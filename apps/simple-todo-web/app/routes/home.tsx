// import type { Route } from "./+types/home"
import { Main } from "@core/entry"
import { TamaguiProvider } from "tamagui"
import * as Tamagui from "../../tamagui.config"
import "../../public/tamagui.css"

export function meta() {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }]
}

export default function Home() {
  return (
    <TamaguiProvider disableInjectCSS config={Tamagui.default}>
      <Main />
    </TamaguiProvider>
  )
}
