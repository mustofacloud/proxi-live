import express from "express";
import http from "http";
import https from "https";
import { URL } from "url";

const app = express();

// =====================
// CORS
// =====================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});

// =====================
// INFO ENDPOINT
// =====================
app.get("/", (req, res) => {
  if (!req.query.url) {
    return res.json({
      status: "ok",
      message: "HLS Proxy is running",
      usage: "/api/proxy?url={ENCODED_URL}",
      example:
        "/api/proxy?url=https%3A%2F%2Fexample.com%2Fstream.m3u8",
    });
  }
});

// =====================
// PROXY HANDLER
// =====================
app.get("/", (req, res) => {
  let target;

  try {
    target = new URL(decodeURIComponent(req.query.url));
  } catch {
    return res.status(400).json({ error: "Invalid target URL" });
  }

  const client = target.protocol === "https:" ? https : http;

  client
    .get(target, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    })
    .on("error", () => {
      res.status(500).json({ error: "Proxy error" });
    });
});

// =====================
// EXPORT (PENTING)
// =====================
export default app;
