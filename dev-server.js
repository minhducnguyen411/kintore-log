// ローカル開発用サーバー: npm run dev → http://localhost:3000
// public/ の画面と api/ のAPIを、Vercel と同じURLで動かす
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT ?? 3000);
// fileURLToPath: Windows でも正しいパス (C:\...) になるようにする
const PUBLIC_DIR = fileURLToPath(new URL("./public/", import.meta.url));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

// URL → API ファイルの対応（Vercel はファイル名から自動で作る）
const ROUTES = [
  { pattern: /^\/api\/records\/?$/, file: "./api/records/index.js" },
  { pattern: /^\/api\/records\/([^/]+)\/?$/, file: "./api/records/[id].js", param: "id" },
  { pattern: /^\/api\/exercises\/?$/, file: "./api/exercises.js" },
  { pattern: /^\/api\/demo\/?$/, file: "./api/demo.js" },
];

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    await serveStatic(res, url.pathname);
  } catch (err) {
    console.error(err);
    res.writeHead(500).end("Internal Server Error");
  }
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT} で起動しました`);
});

async function handleApi(req, res, url) {
  const route = ROUTES.find((r) => r.pattern.test(url.pathname));
  if (!route) return res.writeHead(404).end();

  // Vercel と同じ req.query / req.body / res.status() / res.json() を用意する
  req.query = Object.fromEntries(url.searchParams);
  if (route.param) req.query[route.param] = url.pathname.match(route.pattern)[1];
  req.body = await readJson(req);
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
  };

  const { default: handler } = await import(route.file);
  await handler(req, res);
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

async function serveStatic(res, pathname) {
  if (pathname.endsWith("/")) pathname += "index.html";
  const file = normalize(join(PUBLIC_DIR, pathname));
  if (!file.startsWith(PUBLIC_DIR)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not Found");
  }
}
