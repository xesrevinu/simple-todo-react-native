import * as Reactivity from "@effect/experimental/Reactivity"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as SqlClient from "@effect/sql/SqlClient"
import { WorkerSession } from "@xstack/app-kit/presets/local-first/session"
import { SettingsEvents } from "@xstack/app-kit/sync/services/settings"
import * as Events from "@xstack/event-log/events"
import { CryptoLive } from "@xstack/event-log/internal/CryptoNative"
import * as EventLogAudit from "@xstack/event-log/internal/EventLogAudit"
import * as EventLogConfig from "@xstack/event-log/internal/EventLogConfig"
import * as EventLogDaemon from "@xstack/event-log/internal/EventLogDaemon"
import * as EventLogEncryption from "@xstack/event-log/internal/EventLogEncryption"
import * as EventLogPlatformEffects from "@xstack/event-log/internal/EventLogPlatformEffectsNative"
import { ExternalDatabaseStorage } from "@xstack/event-log/internal/EventLogPlatformEffectsNative"
import * as EventLogRemoteSocket from "@xstack/event-log/internal/EventLogRemoteSocket"
import * as EventLogStates from "@xstack/event-log/internal/EventLogStates"
import { IdentityStorage } from "@xstack/event-log/internal/IdentityStorage"
import * as IdentityStorageNative from "@xstack/event-log/internal/IdentityStorageNative"
import { Default as IdentityLayer } from "@xstack/event-log/internal/IdentityWorker"
import * as SqlEventJournal from "@xstack/event-log/internal/SqlEventJournal"
import * as Identity from "@xstack/event-log/internal/Tag"
import { GlobalSessionToken } from "@xstack/fx/worker/session"
import * as SqlKyselySqlite from "@xstack/sql-kysely/sqlite"
import * as OPSqlClient from "@xstack/sql-op-sqlite/SqlClient"
import * as Config from "effect/Config"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as LogLevel from "effect/LogLevel"
import * as Option from "effect/Option"
import * as Redacted from "effect/Redacted"
import * as Stream from "effect/Stream"
import * as String from "effect/String"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { fetch as ExpoFetch } from "expo/fetch"
import * as ExpoFileSystem from "expo-file-system"
import { CamelCasePlugin } from "kysely"

export interface KyselyTables<T> extends SqlKyselySqlite.EffectKysely<T> {}

export class Kysely extends Context.Tag("Kysely")<Kysely, KyselyTables<any>>() {}

const make = <DB>() => {
  const kysely = SqlKyselySqlite.make<DB>({
    plugins: [new CamelCasePlugin()],
  })

  const DBLive = Layer.effectContext(
    Effect.map(SqlClient.SqlClient, (sqlClient) =>
      pipe(Context.make(Kysely, kysely as unknown as KyselyTables<DB>), Context.add(SqlClient.SqlClient, sqlClient)),
    ),
  )

  return {
    DB: Kysely as Context.Tag<Kysely, KyselyTables<DB>>,
    DBLive,
  }
}

const { DBLive } = make<{}>()

const SqliteLive = OPSqlClient.layerConfig({
  filename: Config.succeed("main.sqlite"),
  location: EventLogConfig.StorageLocation,
  transformQueryNames: Config.succeed(String.camelToSnake),
  transformResultNames: Config.succeed(String.snakeToCamel),
})

const DBLive_ = DBLive.pipe(Layer.provideMerge(SqliteLive), Layer.provide(Reactivity.layer), Layer.orDie)

const IdentityLive = IdentityLayer.pipe(
  Layer.provide([CryptoLive, IdentityStorageNative.Live, FetchHttpClient.layer]),
  Layer.provide(
    Layer.succeed(FetchHttpClient.Fetch, (input, init) => {
      // Convert URL or RequestInfo to string
      const url = input instanceof URL ? input.toString() : input.toString()

      // Convert RequestInit to FetchRequestInit
      const fetchInit = init
        ? {
            body: init.body,
            credentials: init.credentials,
            headers: init.headers,
            method: init.method,
            signal: init.signal,
          }
        : undefined

      return ExpoFetch(url, fetchInit as any) as unknown as Promise<Response>
    }),
  ),
)

const EventLogEncryptionLive = EventLogEncryption.layerSubtle.pipe(Layer.provide(CryptoLive))

const EventLogLayer = Events.toLayer(SettingsEvents)

const EventLogStatesLive = EventLogStates.EventLogStates.Default.pipe(
  Layer.provide([EventLogLayer, IdentityLive]),
  Layer.provide(EventLogAudit.EventLogAudit.Default),
  Layer.provide(SqlEventJournal.layer()),
  Layer.provide([Reactivity.layer, DBLive_]),
)

const PlatformEffectsLive = EventLogPlatformEffects.Live.pipe(
  Layer.provide(
    Layer.effect(
      ExternalDatabaseStorage,
      Effect.gen(function* () {
        const identityStorage = yield* IdentityStorage

        const get = [identityStorage.storageSize]

        return { get }
      }),
    ),
  ),
  Layer.provide([IdentityStorageNative.Live, DBLive_]),
)

const EventLogLive = pipe(
  EventLogRemoteSocket.layerWebSocketBrowser(
    Effect.gen(function* () {
      const { namespace, syncUrl } = yield* EventLogConfig.EventLogConfig.pipe(Effect.orDie)
      const identity = yield* Identity.Identity
      const session = yield* WorkerSession

      return pipe(
        Stream.zipLatestAll(session.changes, identity.publicKeyHashStream),
        Stream.map(([token, publicKeyHash]) =>
          pipe(
            token,
            Option.map((token) => btoa(`${namespace}:${publicKeyHash}:${Redacted.value(token)}`)),
            Option.map((query) => `${syncUrl.replace(/^https?/, "ws")}?q=${query}`),
          ),
        ),
      )
    }).pipe(Effect.provide(WorkerSession.Default)),
  ),
  Layer.provide(EventLogDaemon.EventLogDaemon.Default.pipe(Layer.provide(PlatformEffectsLive))),
  Layer.provideMerge(EventLogStatesLive),
  Layer.provideMerge(EventLogLayer),
  Layer.provide([IdentityLive, EventLogAudit.EventLogAudit.Default, EventLogEncryptionLive, SqlEventJournal.layer()]),
  Layer.provide([Reactivity.layer, DBLive_]),
)

const Live = Layer.mergeAll(Reactivity.layer, DBLive_, IdentityLive, EventLogLive, EventLogStatesLive).pipe(
  Layer.tapErrorCause(Effect.logError),
  Layer.provide(
    Layer.setConfigProvider(
      ConfigProvider.fromJson({
        NAMESPACE: "template",
        SYNC: {
          URL: "http://127.0.0.1:8300/sync",
          STORAGE_LOCATION: ExpoFileSystem.documentDirectory ?? "/",
        },
      }),
    ),
  ),
  Layer.orDie,
)

const program = Effect.gen(function* () {
  const identity = yield* Identity.Identity

  yield* SubscriptionRef.set(GlobalSessionToken, Option.some(Redacted.make("7w3jnwsw3j24xsvvxfvssk6pxuhcuwiut5u5hudc")))

  yield* identity.importFromMnemonic(
    Redacted.make("they sea craft payment ticket bind vague believe visit lady knife fox"),
  )

  const sql = yield* SqlClient.SqlClient
  const reactivity = yield* Reactivity.Reactivity

  const stream = reactivity.stream(
    { x_settings: [] },
    Effect.gen(function* () {
      const settings = yield* sql`select * from x_settings`
      // @ts-expect-error
      globalThis.handle?.(settings)
    }),
  )
  yield* Effect.forkScoped(Stream.runDrain(stream))

  yield* Effect.forkScoped(
    Effect.gen(function* () {
      const settings = yield* sql`select * from x_settings`
      console.log(settings)
      // @ts-expect-error
      globalThis.handle?.(settings)
    }).pipe(Effect.delay(300)),
  )

  yield* Effect.never
}).pipe(Effect.provide(Live), Logger.withMinimumLogLevel(LogLevel.All), Effect.scoped)

Effect.runPromise(program)
