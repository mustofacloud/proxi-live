import http from "http";
import https from "https";
import { URL } from "url";

http
  .createServer((req, res) => {
    // =====================
    // CORS
    // =====================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");

    const reqUrl = new URL(req.url, "http://localhost");

    // =====================
    // INFO ENDPOINT
    // =====================
    if (reqUrl.pathname === "/proxy" && !reqUrl.searchParams.get("url")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify(
          {
            status: "ok",
            message: "HLS Proxy is running",
            usage: "/proxy?url={ENCODED_URL}",
            example:
              "/proxy?url=https%3A%2F%2Fexample.com%2Fstream.m3u8",
          },
          null,
          2
        )
      );
    }

    // =====================
    // PROXY HANDLER
    // =====================
    if (reqUrl.pathname !== "/proxy") {
      res.writeHead(404);
      return res.end("Not Found");
    }

    const target = reqUrl.searchParams.get("url");
    if (!target) {
      res.writeHead(400);
      return res.end("Missing url parameter");
    }

    let targetUrl;
    try {
      targetUrl = new URL(decodeURIComponent(target));
    } catch {
      res.writeHead(400);
      return res.end("Invalid target URL");
    }

    const client = targetUrl.protocol === "https:" ? https : http;

    client
      .get(targetUrl, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      })
      .on("error", () => {
        res.writeHead(500);
        res.end("Proxy error");
      });
  })
  .listen(3000, () => {
    console.log("Proxy running on http://localhost:3000/proxy");
  });
