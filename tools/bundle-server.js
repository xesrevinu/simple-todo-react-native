const http = require("http")
const fs = require("fs")
const path = require("path")

const PORT = 8081
const BUNDLE_PATH = path.join(__dirname, "temp.js")
const TARGET_PORT = 19000

const server = http.createServer((req, res) => {
  // Check if this is a bundle request
  if (req.url.includes("bundle")) {
    console.log("bundle")
    try {
      // 检查文件是否存在
      if (!fs.existsSync(BUNDLE_PATH)) {
        res.writeHead(404)
        res.end("Bundle file not found")
        return
      }

      // 读取文件内容
      const bundleContent = fs.readFileSync(BUNDLE_PATH, "utf8")

      // 设置响应头
      res.writeHead(200, {
        "Content-Type": "application/javascript",
        "Content-Length": Buffer.byteLength(bundleContent),
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      })

      // 发送文件内容
      res.end(bundleContent)
    } catch (error) {
      console.error("Error serving bundle:", error)
      res.writeHead(500)
      res.end("Internal Server Error")
    }
  } else {
    // Forward other requests to port 19000
    const options = {
      hostname: "localhost",
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })

    proxyReq.on("error", (error) => {
      console.error("Error forwarding request:", error)
      res.writeHead(500)
      res.end("Error forwarding request")
    })

    req.pipe(proxyReq)
  }
})

server.listen(PORT, () => {
  console.log(`Bundle server running at http://localhost:${PORT}/apps/simple-todo/index.bundle`)
  console.log(`Other requests will be forwarded to http://localhost:${TARGET_PORT}`)
})
