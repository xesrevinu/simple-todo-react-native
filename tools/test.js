const fs = require("fs")
// let url = 'http://localhost:8081/.expo/.virtual-metro-entry'
const url =
  "http://localhost:8081/apps/simple-todo-macos/index.bundle?&platform=macos&dev=true&hot=false&lazy=false&transform.engine=hermes&transform.bytecode=0&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable"
const url2 =
  "http://localhost:8081/apps/simple-todo/index.bundle?&platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable"

fetch(url)
  .then((res) => res.text())
  .then((text) => {
    // write temp.js
    fs.writeFileSync("temp.js", text)
  })
  .catch((err) => {
    console.error(err)
  })
