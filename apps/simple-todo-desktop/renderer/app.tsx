import { Main } from "@core/entry"
import { startTransition } from "react"
import { createRoot } from "react-dom/client"
import { TamaguiProvider } from "tamagui"
import * as Tamagui from "../tamagui.config"

const root = document.getElementById("root")!

startTransition(() => {
  createRoot(root).render(
    <TamaguiProvider disableInjectCSS config={Tamagui.default}>
      <Main />
    </TamaguiProvider>,
  )
})
