// "Grow your name": type a business name and it is set eight times, from hairline-condensed
// to black-extended, as a poster you can save as a PNG (drawn on a canvas, nothing uploaded).
import { gsap, reduced, isNarrow, onResize } from "./core";
import { $, $$, esc } from "./dom";
import { getTheme, onTheme } from "@shared/theme";
import { blip, chime } from "./sound";
import { toast } from "./chrome";

const WIDTHS = [50, 62.5, 75, 87.5, 100, 112.5, 125, 150];
const STRETCH = ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded"];
const WEIGHTS = WIDTHS.map((_, i) => Math.round(100 + (800 * i) / 7));
const FALLBACK = "Your business";

let meter: HTMLSpanElement | null = null;
function measureRow(text: string, i: number) {
  if (!meter) {
    meter = document.createElement("span");
    meter.setAttribute("aria-hidden", "true");
    meter.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;white-space:pre;font:400 100px/1 "Anybody Variable",sans-serif;text-transform:uppercase';
    document.body.append(meter);
  }
  meter.textContent = text;
  meter.style.fontVariationSettings = `"wdth" ${WIDTHS[i]}, "wght" ${WEIGHTS[i]}`;
  return meter.getBoundingClientRect().width / 100;
}
/** Every row is set to the full measure at its own step. Long names would overflow the sheet
 *  with eight rows, so the poster drops to fewer steps (always hairline first, black last)
 *  until the stack fits at (nearly) full width. */
function plan(emWidth: (step: number) => number, W: number, H: number, lh = 0.84) {
  let best = { steps: [0, 7], sizes: [0, 0], k: 0 };
  for (const n of [8, 7, 6, 5, 4]) {
    const steps = Array.from({ length: n }, (_, j) => Math.round((j * 7) / (n - 1)));
    const sizes = steps.map((st) => W / Math.max(0.01, emWidth(st)));
    const total = sizes.reduce((a, b) => a + b * lh, 0);
    const k = Math.min(1, H / total);
    if (k > best.k + 0.001) best = { steps, sizes: sizes.map((x) => x * k), k };
    if (k >= 0.9) break;
  }
  return best;
}

export function posterHTML() {
  return `<div class="pm">
  <div class="pm-ctl">
    <label class="pm-lab" for="pm-in">Type your business name</label>
    <input id="pm-in" class="pm-in" maxlength="22" autocomplete="off" spellcheck="false" placeholder="${FALLBACK}" enterkeyhint="done">
    <p class="pm-hint">Your name, stacked from a hairline to full black, every line set to the full width. It is drawn right here in your browser; nothing you type is sent anywhere.</p>
    <button class="pm-save btn btn--ink" type="button">Save the poster as PNG</button>
  </div>
  <figure class="pm-art" aria-label="Poster preview">
    <div class="pm-top"><span>Aevinite</span><span>Grow your name</span><span class="pm-no">No. 01</span></div>
    <div class="pm-rows" aria-hidden="true">${WIDTHS.map((w, i) => `<span class="pm-r${i === 7 ? " pm-r--last" : ""}" style="--w:${w};--k:${WEIGHTS[i]}">${esc(FALLBACK)}</span>`).join("")}</div>
    <figcaption class="pm-bot"><span class="pm-line">We help <b class="pm-name">${esc(FALLBACK)}</b> grow.</span><span class="pm-url">aevinite.com</span></figcaption>
  </figure>
</div>`;
}

export function wirePoster(root: HTMLElement) {
  const input = $("#pm-in", root) as HTMLInputElement;
  const rowsEl = $(".pm-rows", root), rows = $$(".pm-r", root), nameEl = $(".pm-name", root), noEl = $(".pm-no", root);
  let count = 1;
  const clean = () => input.value.replace(/\s+/g, " ").trim().slice(0, 22) || FALLBACK;
  // Each row is set to the full measure at its own width and weight, then the whole stack is
  // scaled to the sheet: hairline rows stand tall, black rows sit squat. That is the growth.
  const refit = () => {
    const W = rowsEl.clientWidth, H = rowsEl.clientHeight;
    if (!W || !H) return;
    const text = rows[0].textContent ?? "";
    const pl = plan((st) => measureRow(text, st), W * 0.985, H);
    rows.forEach((r, i) => {
      const on = i < pl.steps.length;
      r.hidden = !on;
      if (!on) return;
      const st = pl.steps[i];
      r.style.fontSize = `${pl.sizes[i].toFixed(2)}px`;
      r.style.setProperty("--w", String(WIDTHS[st]));
      r.style.setProperty("--k", String(WEIGHTS[st]));
      r.dataset.k = String(WEIGHTS[st]);
      r.classList.toggle("pm-r--last", i === pl.steps.length - 1);
    });
  };
  refit();
  document.fonts.ready.then(refit);
  onResize(refit);

  const wave = () => {
    if (reduced) return;
    const vis = rows.filter((r) => !r.hidden);
    gsap.fromTo(vis, { clipPath: "inset(0 100% 0 0)", "--k": 100 }, { clipPath: "inset(0 0% 0 0)", "--k": (i: number) => Number(vis[i].dataset.k), duration: 0.9, ease: "expo.out", stagger: 0.06, overwrite: true });
  };
  let last = "";
  input.addEventListener("input", () => {
    const n = clean();
    if (n === last) return;
    last = n;
    rows.forEach((r) => (r.textContent = n));
    nameEl.textContent = n;
    refit();
    wave();
    blip(300 + Math.min(22, input.value.length) * 30, 0.03, 0.04);
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") input.blur(); });

  let waved = false;
  new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !waved) { waved = true; wave(); } }), { threshold: 0.4 }).observe(rowsEl);

  $(".pm-save", root).addEventListener("click", async () => {
    const blob = await render(clean(), count);
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `grow-${clean().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "your-business"}.png`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    chime();
    toast(`Poster No. ${String(count).padStart(2, "0")} saved. Print it big.`);
    count++;
    noEl.textContent = `No. ${String(count).padStart(2, "0")}`;
  });
  onTheme(() => requestAnimationFrame(refit));
  void isNarrow;
}

async function render(name: string, no: number): Promise<Blob | null> {
  await document.fonts.load('900 100px "Anybody Variable"', name);
  const W = 1080, H = 1350, M = 72;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const dark = getTheme() === "dark";
  const bg = dark ? "#09090a" : "#f1ede4", ink = dark ? "#ecebe7" : "#121212", red = dark ? "#ff3b28" : "#e3200f";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Hairline frame and rules, like the preview.
  ctx.strokeStyle = dark ? "rgba(236,235,231,.22)" : "rgba(18,18,18,.25)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(M, M + 44); ctx.lineTo(W - M, M + 44); ctx.moveTo(M, H - M - 70); ctx.lineTo(W - M, H - M - 70); ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = '600 22px "JetBrains Mono Variable", monospace';
  ctx.textBaseline = "alphabetic";
  ctx.fillText("AEVINITE", M, M + 24);
  ctx.textAlign = "center"; ctx.fillText("GROW YOUR NAME", W / 2, M + 24);
  ctx.textAlign = "right"; ctx.fillText(`NO. ${String(no).padStart(2, "0")}`, W - M, M + 24);
  ctx.textAlign = "left";

  const text = name.toLocaleUpperCase("en-IN");
  const hasStretch = "fontStretch" in ctx;
  const setFont = (i: number, size: number) => {
    ctx.font = `${WEIGHTS[i]} ${size}px "Anybody Variable", sans-serif`;
    if (hasStretch) (ctx as unknown as { fontStretch: string }).fontStretch = STRETCH[i];
  };
  const fake = (i: number) => (hasStretch ? 1 : WIDTHS[i] / 100);
  const top = M + 70, bottom = H - M - 96;
  const pl = plan((st) => { setFont(st, 100); return (ctx.measureText(text).width * fake(st)) / 100; }, W - 2 * M, bottom - top, 0.8);
  const n = pl.steps.length;
  const used = pl.sizes.reduce((a, b) => a + b * 0.8, 0);
  const gap = Math.max(0, (bottom - top - used) / (n - 1));
  let y = top;
  for (let r = 0; r < n; r++) {
    const i = pl.steps[r], size = pl.sizes[r];
    setFont(i, size);
    y += size * 0.8;
    const base = y - size * 0.02;
    if (r === n - 1) ctx.fillStyle = red;
    else if (dark) {
      const g = ctx.createLinearGradient(0, base - size * 0.72, 0, base);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.45, "#b9bdc5"); g.addColorStop(0.5, "#3c4048"); g.addColorStop(0.62, "#9aa0aa"); g.addColorStop(1, "#eef0f3");
      ctx.fillStyle = g;
    } else ctx.fillStyle = ink;
    ctx.save();
    ctx.translate(M, base);
    ctx.scale(fake(i), 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    y += gap;
  }
  ctx.fillStyle = ink;
  ctx.font = '500 34px "Instrument Sans Variable", sans-serif';
  ctx.fillText(`We help ${name} grow.`, M, H - M - 18, W - 2 * M - 260);
  ctx.font = '500 22px "JetBrains Mono Variable", monospace';
  ctx.textAlign = "right";
  ctx.fillText("aevinite.com", W - M, H - M - 22);
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}
