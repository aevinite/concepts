// LOOK at a concept the way the owner will: starts its dev server, screenshots light + dark,
// laptop + phone, scrolled step by step, prints page errors, then stops the server.
//   node scripts/look.mjs <n> [--page campus/] [--theme light|dark] [--device desktop|mobile]
//                             [--steps 8] [--wait 1200]
// Files land in shots/<n>/ (gitignored). Open them with the Read tool and really look.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { startDev } from "./dev-server.mjs";
const site = process.argv[2];
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
if (!site) { console.error("usage: node scripts/look.mjs <n> [...]"); process.exit(1); }
const page = arg("page", ""), steps = Number(arg("steps", 8)), wait = Number(arg("wait", 1200));
const themes = arg("theme") ? [arg("theme")] : ["light", "dark"];
const devices = arg("device") ? [arg("device")] : ["desktop", "mobile"];
const out = `shots/${site}`;
mkdirSync(out, { recursive: true });
const DEV = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const server = await startDev(site);
const browser = await chromium.launch();
const errors = [];
try {
  for (const device of devices) for (const theme of themes) {
    const ctx = await browser.newContext({ ...DEV[device] });
    await ctx.addInitScript(([k, t]) => { try { localStorage.setItem(k, t); } catch {} }, [`aev-c${site}-theme`, theme]);
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(`${device}/${theme}: ${e.message}`));
    p.on("console", (m) => m.type() === "error" && errors.push(`${device}/${theme} console: ${m.text()}`));
    p.on("requestfailed", (r) => !r.url().endsWith(".mp4") && errors.push(`${device}/${theme} failed: ${r.url()}`));
    await p.goto(server.url + page, { waitUntil: "load", timeout: 60000 }).catch((e) => errors.push(`goto ${e.message}`));
    await p.waitForTimeout(2500);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    const vh = DEV[device].viewport.height;
    const n = Math.max(1, Math.min(steps, Math.ceil(total / vh)));
    const slug = (page || "home").replace(/\W+/g, "") || "home";
    for (let i = 0; i < n; i++) {
      const y = Math.round((i / Math.max(1, n - 1)) * Math.max(0, total - vh));
      await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      await p.mouse.wheel(0, 1).catch(() => {});
      await p.waitForTimeout(wait);
      const f = `${out}/${slug}-${device}-${theme}-${String(i).padStart(2, "0")}.jpg`;
      await p.screenshot({ path: f, type: "jpeg", quality: 70 });
      console.log(f);
    }
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) errors.push(`${device}/${theme}: page is ${overflow}px wider than the screen (sideways scroll)`);
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}
if (errors.length) { console.log("\nPROBLEMS:"); for (const e of [...new Set(errors)]) console.log(" -", e); }
else console.log("\nno page errors, no sideways scroll");
