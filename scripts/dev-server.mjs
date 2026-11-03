// Starts (and lets you stop) one concept's Vite dev server from a script, so checks never leave a
import { fileURLToPath } from "node:url";
// server running.  const s = await startDev(3); … s.url … await s.close();
import { createServer } from "vite";
export async function startDev(site, port = 5100 + Number(site)) {
  process.env.SITE = String(site);
  const server = await createServer({ configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)), server: { port, strictPort: false }, logLevel: "error" });
  await server.listen();
  const actual = server.config.server.port ?? port;
  const addr = server.httpServer.address();
  return { url: `http://localhost:${typeof addr === "object" ? addr.port : actual}/concepts/${site}/`, close: () => server.close() };
}
