// Hub previews: the first screen of each concept in light and dark, from the LIVE site.
// node scripts/thumbs.mjs 1 2 3 …   → hub/thumbs/<n>-light.webp, <n>-dark.webp (via PIL)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
const ids = process.argv.slice(2);
const b = await chromium.launch();
for (const n of ids) for (const theme of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const key = /^\d+$/.test(n) && Number(n) <= 10 ? `aev-c${n}-theme` : "aev-theme";
  await ctx.addInitScript(([k, t]) => { try { localStorage.setItem(k, t); sessionStorage.setItem("aevos-booted", "1"); } catch {} }, [key, theme]);
  const p = await ctx.newPage();
  await p.goto(`https://aevinite.github.io/concepts/${n}/`, { waitUntil: "load", timeout: 90000 });
  await p.waitForTimeout(4500);
  const jpg = `shots/thumb-${n}-${theme}.jpg`;
  await p.screenshot({ path: jpg, type: "jpeg", quality: 85 });
  execFileSync("python3", ["-c", `from PIL import Image; Image.open("${jpg}").resize((720,450)).save("hub/thumbs/${n}-${theme}.webp", quality=72)`]);
  console.log(n, theme);
  await ctx.close();
}
await b.close();
