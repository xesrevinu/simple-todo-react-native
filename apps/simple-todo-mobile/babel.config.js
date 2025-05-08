module.exports = (api) => {
  api.cache(true)
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          lazyImports: true,
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      ["babel-plugin-react-compiler", { target: "19" }],
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === "development",
        },
      ],
      "react-native-reanimated/plugin", // NOTE: this plugin MUST be last
    ],
  }
}
