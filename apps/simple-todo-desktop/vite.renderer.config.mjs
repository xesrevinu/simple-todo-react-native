import { join } from "node:path"
import { workspaceRoot } from "@nx/devkit"
import { tamaguiPlugin } from "@tamagui/vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import babel from "vite-plugin-babel"
import checker from "vite-plugin-checker"

const packagesDir = join(workspaceRoot, "packages")
const dir = import.meta.dirname
const baseCore = join(dir, "../simple-todo/src")

const warmup = {
  clientFiles: [`${dir}/renderer/**/*.{ts,tsx}`],
  ssrFiles: [],
}

export default defineConfig({
  root: dir,
  cacheDir: join(workspaceRoot, `node_modules/.vite/simple-todo-desktop-renderer`),
  envPrefix: ["VITE_"],
  logLevel: "error",
  server: {
    watch: {
      ignored: [
        "dist",
        ".vite",
        ".tamagui",
        ".direnv",
        "logs",
        "coverage",
        "private",
        "scratchpad",
        "infra",
        "scripts",
        "**/e2e",
        "**/fixtures",
        "**/tests",
      ],
    },
    warmup,
  },
  worker: {
    format: "es",
  },
  build: {
    // cssTarget: buildTarget,
    // target: buildTarget,
    // minify: isServerTarget ? false : isMinify,
    modulePreload: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    // A workaround for Vite bug: https://github.com/vitejs/vite/issues/13314#issuecomment-1560745780
    exclude: ["@effect-x/wa-sqlite"],
    // Another workaround for Vite bug: https://github.com/radix-ui/primitives/discussions/1915#discussioncomment-5733178
    include: ["react-dom", "react/jsx-runtime"],
  },
  plugins: [
    tamaguiPlugin({
      config: "./tamagui.config.ts",
      components: ["tamagui"],
      optimize: true,
      disable: false,
      outputCSS: "./public/tamagui.css",
      logTimings: true,
      // disable static extraction, faster to iterate in dev mode (default false)
      disableExtraction: process.env.NODE_ENV === "development",
      platform: "web",
    }),
    babel({
      exclude: [
        // ignore css
        /\.css$/,

        // react-router related
        /root\.tsx/,
        /\?client-route=1/,
        /\?__react-router-build-client-route/,
        /.*\.route\.tsx/,
        /.*\.client\.tsx/,

        // radix-ui
        /packages\/lib\/src\/ui\/.*/,

        /packages\/fx\/.*/,
      ],
      filter: /(?:\/(?:hooks|components|ui|rx)\/.*\.tsx?|rx\.ts$|hooks\.tsx?$|.*\.tsx)/,
      babelConfig: {
        generatorOpts: {
          // https://github.com/babel/babel/issues/9804#issuecomment-480075309
          jsescOption: {
            minimal: true,
          },
        },
        presets: ["@babel/preset-typescript"], // if you use TypeScript
        plugins: [["babel-plugin-react-compiler", {}]].filter(Boolean),
        parserOpts: {
          sourceType: "module",
        },
        configFile: false,
        babelrc: false,
        sourceMaps: "both",
        ast: false,
      },
    }),
    react(),
    checker({
      typescript: {
        tsconfigPath: join(dir, "tsconfig.json"),
      },
      enableBuild: false,
      overlay: {
        initialIsOpen: false,
        panelStyle: "opacity: 0.8;height:90dvh;width: auto; inset: 5%;",
      },
      root: dir,
    }),
  ],
  resolve: {
    conditions: ["browser", "module", "import"],
    mainFields: ["browser", "module", "main"],
    alias: {
      react: join(dir, "node_modules/react"),
      "react-dom": join(dir, "node_modules/react-dom"),
      "react-is": join(dir, "node_modules/react-is"),
      scheduler: join(dir, "node_modules/scheduler"),

      "@xstack/app-kit": join(packagesDir, "app-kit/src"),
      "@xstack/config": join(packagesDir, "config/src"),
      "@xstack/db": join(packagesDir, "db/src"),
      "@xstack/event-log": join(packagesDir, "event-log/src"),
      "@xstack/fx": join(packagesDir, "fx/src"),
      "@xstack/lib": join(packagesDir, "lib/src"),
      "@xstack/sql-kysely": join(packagesDir, "sql-kysely/src"),
      "@xstack/sql-op-sqlite": join(packagesDir, "sql-op-sqlite/src"),

      "@core": baseCore,
      "@": join(dir, "renderer"),
    },
  },
})
