"use strict";

const express = require("express");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(
  express.static(publicDir, {
    maxAge: "1h",
    etag: true,
    index: "index.html"
  })
);

// Static site fallback. Keep /health above this route.
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AnimeSiddhesh listening on port ${port}`);
});
