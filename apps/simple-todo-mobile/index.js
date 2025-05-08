import "./global.css"
import registerRootComponent from "expo/src/launch/registerRootComponent"
import ReactNativeFeatureFlags from "react-native/Libraries/ReactNative/ReactNativeFeatureFlags"
import { install } from "react-native-quick-crypto"
import App from "./app/App"

// enable the JS-side of the w3c PointerEvent implementation
ReactNativeFeatureFlags.shouldEmitW3CPointerEvents = () => true

// enable hover events in Pressibility to be backed by the PointerEvent implementation.
// shouldEmitW3CPointerEvents should also be true
ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover = () => true

install()

registerRootComponent(App)
