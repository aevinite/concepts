import { defineConfig, type Plugin } from "vite";
import { resolve, join, extname } from "node:path";
import { readdirSync, statSync, createReadStream, existsSync } from "node:fs";

// One config, ten sites. Run with SITE=<n>: `SITE=3 npx vite --port 5103` (dev) or
// `SITE=3 npx vite build`. BASE_ROOT is where the concepts live on the host
// ("/concepts/" on aevinite.github.io/concepts/; "/" once a concept gets its own subdomain).
const site = process.env.SITE;
if (!site) throw new Error("Set SITE=<1..10>");
const BASE_ROOT = process.env.BASE_ROOT ?? "/concepts/";
const root = resolve(import.meta.dirname, "sites", site);
const mediaDir = resolve(import.meta.dirname, "media");

// Every index.html under the site folder becomes a page (/, /aevidine/, /campus/ …).
function pages(dir: string, out: Record<string, string> = {}) {
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f === "public" || f === "src") continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (f === "index.html") out[p.slice(root.length + 1).replace(/\/?index\.html$/, "") || "main"] = p;
  }
  return out;
}

const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
// In dev, serve the shared media folder at the same address it has in production.
const serveMedia = (): Plugin => ({
  name: "shared-media",
  configureServer(server) {
    server.middlewares.use(`${BASE_ROOT}media/`, (req, res, next) => {
      const file = join(mediaDir, decodeURIComponent((req.url ?? "").split("?")[0]));
      if (!file.startsWith(mediaDir) || !existsSync(file) || statSync(file).isDirectory()) return next();
      const size = statSync(file).size;
      const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
      res.setHeader("Content-Type", TYPES[extname(file)] ?? "application/octet-stream");
      res.setHeader("Accept-Ranges", "bytes");
      if (range) {
        const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
        res.setHeader("Content-Length", end - start + 1);
        createReadStream(file, { start, end }).pipe(res);
      } else {
        res.setHeader("Content-Length", size);
        createReadStream(file).pipe(res);
      }
    });
  },
});

export default defineConfig({
  root,
  base: `${BASE_ROOT}${site}/`,
  publicDir: resolve(root, "public"),
  resolve: { alias: { "@shared": resolve(import.meta.dirname, "shared") } },
  define: {
    "import.meta.env.VITE_MEDIA_BASE": JSON.stringify(`${BASE_ROOT}media/`),
    "import.meta.env.VITE_HUB": JSON.stringify(BASE_ROOT),
  },
  plugins: [serveMedia()],
  server: { open: false, strictPort: true },
  build: {
    outDir: resolve(import.meta.dirname, "dist", site),
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 1500,
    rollupOptions: { input: pages(root) },
  },
});
