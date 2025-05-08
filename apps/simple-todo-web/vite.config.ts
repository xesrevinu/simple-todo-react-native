import { join, resolve } from "node:path"
import { reactRouter } from "@react-router/dev/vite"
import { tamaguiPlugin } from "@tamagui/vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import babel from "vite-plugin-babel"
import checker from "vite-plugin-checker"

const dir = import.meta.dirname
const workspaceRoot = resolve(dir, "../..")
const packagesDir = join(workspaceRoot, "packages")
const baseCore = join(dir, "../simple-todo/src")

const warmup = {
  clientFiles: [`${dir}/app/**/*.{ts,tsx}`],
  ssrFiles: [],
}

export default defineConfig({
  root: dir,
  cacheDir: join(workspaceRoot, `node_modules/.vite/simple-todo-web`),
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
    rollupOptions: {
      external: ["cloudflare:workers"],
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
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
    reactRouter() as any,
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
      "@xstack/app-kit": join(packagesDir, "app-kit/src"),
      "@xstack/config": join(packagesDir, "config/src"),
      "@xstack/db": join(packagesDir, "db/src"),
      "@xstack/event-log": join(packagesDir, "event-log/src"),
      "@xstack/fx": join(packagesDir, "fx/src"),
      "@xstack/lib": join(packagesDir, "lib/src"),
      "@xstack/sql-kysely": join(packagesDir, "sql-kysely/src"),
      "@xstack/sql-op-sqlite": join(packagesDir, "sql-op-sqlite/src"),

      "@core": baseCore,
      "@": dir,
    },
  },
})
