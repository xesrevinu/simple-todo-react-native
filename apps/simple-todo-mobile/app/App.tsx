import { Main } from "@core/entry"
import { TamaguiProvider, ThemeProvider } from "@tamagui/core"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import * as Tamagui from "../tamagui.config"

// if (Platform.OS === "ios") {
//   import("./agent")
// }

export const App = () => {
  return (
    <SafeAreaProvider>
      <TamaguiProvider disableInjectCSS config={Tamagui.default}>
        <SafeAreaView style={{ flex: 1 }} mode="padding" edges={["top", "bottom"]}>
          <ThemeProvider defaultTheme="light">
            <Main />
          </ThemeProvider>
        </SafeAreaView>
      </TamaguiProvider>
    </SafeAreaProvider>
  )
}

export default App
