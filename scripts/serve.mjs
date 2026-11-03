// Serves dist/ exactly as GitHub Pages will: http://localhost:<port>/concepts/<n>/
// node scripts/serve.mjs [port]
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
const port = Number(process.argv[2] ?? 4600);
const dist = resolve("dist");
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".mp4": "video/mp4", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".txt": "text/plain", ".ico": "image/x-icon", ".glb": "model/gltf-binary" };
createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (!url.startsWith("/concepts/")) { res.writeHead(302, { Location: "/concepts/" }); return res.end(); }
  let file = join(dist, url.slice("/concepts".length));
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(file + ".html")) file += ".html";
  if (!existsSync(file)) { res.writeHead(404); return res.end("404"); }
  const size = statSync(file).size;
  const type = T[extname(file)] ?? "application/octet-stream";
  const m = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const s = Number(m[1] || 0), e = m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${s}-${e}/${size}`, "Accept-Ranges": "bytes", "Content-Length": e - s + 1 });
    createReadStream(file, { start: s, end: e }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
    createReadStream(file).pipe(res);
  }
}).listen(port, () => console.log(`serving dist at http://localhost:${port}/concepts/`));
