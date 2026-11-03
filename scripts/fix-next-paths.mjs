// Prefix raw public-file paths ("/films/…", "/projects/…", "/logo.png") with the base path in an
// exported Next site; Next only prefixes its own links and _next assets. Also adds noindex.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
const [out, pub, base] = process.argv.slice(2);
const entries = readdirSync(pub).filter((e) => !e.startsWith("."));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re = new RegExp(`(["'\`(=\\s,]|\\\\")/(${entries.map(esc).join("|")})(?=[/"'\`)\\\\?#\\s,]|$)`, "g");
let files = 0, hits = 0;
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if ([".html", ".js", ".css", ".txt", ".json", ".xml", ".webmanifest"].includes(extname(p))) fix(p); } };
function fix(p) {
  let s = readFileSync(p, "utf8"); const before = s;
  s = s.replace(re, (m, pre, e) => { hits++; return `${pre}${base}/${e}`; });
  if (extname(p) === ".html" && !s.includes('name="robots" content="noindex"')) s = s.replace("<head>", '<head><meta name="robots" content="noindex"/>');
  if (s !== before) { writeFileSync(p, s); files++; }
}
walk(out);
console.log(`${base}: rewrote ${hits} paths in ${files} files; public entries: ${entries.join(", ")}`);
