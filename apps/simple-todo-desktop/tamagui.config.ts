import { config } from "@tamagui/config/v3"
import { defaultConfig } from "@tamagui/config/v4"
import { createTamagui } from "@tamagui/core"

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
  },
  media: {
    ...defaultConfig.media,
    ...config.media,
  },
})

export type AppConfig = typeof appConfig

declare module "tamagui" {
  // overrides TamaguiCustomConfig so your custom types
  // work everywhere you import `tamagui`
  interface TamaguiCustomConfig extends AppConfig {}

  interface TypeOverride {
    groupNames(): "window" | "listitem" | "item"
  }
}

export default appConfig
