import { defineConfig } from "vite"

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["cloudflare:workers"],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "tsx",
      },
      define: {
        global: "globalThis",
      },
      // target: buildTarget,
      // plugins: [fixReactVirtualized],
    },
  },
})
