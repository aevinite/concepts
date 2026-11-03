// Builds every concept into dist/<n>/, copies the shared media and the hub page, and adds the
// frozen old/current sites (prebuilt/11, prebuilt/12). `node scripts/build-all.mjs --only 3`
// builds just one concept (no media/hub copy).
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const sites = (existsSync("sites") ? readdirSync("sites") : []).filter((d) => /^\d+$/.test(d) && existsSync(`sites/${d}/index.html`)).sort((a, b) => a - b);
for (const s of only ? [only] : sites) {
  console.log(`\n▶ building concept ${s}`);
  execSync("npx vite build --logLevel warn", { stdio: "inherit", env: { ...process.env, SITE: s } });
}
if (!only) {
  mkdirSync("dist", { recursive: true });
  cpSync("media", "dist/media", { recursive: true });
  cpSync("hub", "dist", { recursive: true });
  for (const p of ["11", "12"]) if (existsSync(`prebuilt/${p}`)) cpSync(`prebuilt/${p}`, `dist/${p}`, { recursive: true });
  console.log(`\n✓ built ${sites.length} concepts + hub + media`);
}
