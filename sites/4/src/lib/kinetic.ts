// THE SIGNATURE TOY. A word set in Anybody (wdth 50..150, wght 100..900) whose letters swell
// toward the pointer and thin out away from it. The row keeps its total width (the letters
// trade space with each other, like compositors trading a fixed measure), scroll speed
// stretches every letter wide, and you can pull a letter up to make it grow taller.
import { pointer, scroll, onFrame, reduced, whenVisible, onResize } from "./core";
import { fv, clamp, lerp } from "./dom";
import { getTheme, onTheme } from "@shared/theme";
import { blip, thock } from "./sound";

const LH = 0.8; // must match .kw-row line-height in CSS
const W0 = 50, W1 = 150, K0 = 100, K1 = 900;

// ---- per-glyph width model (em), measured once at the four corners of the design space ----
const model = new Map<string, [number, number, number, number]>();
let meter: HTMLSpanElement | null = null;
function measureGlyph(ch: string) {
  if (model.has(ch)) return;
  if (!meter) {
    meter = document.createElement("span");
    meter.setAttribute("aria-hidden", "true");
    meter.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;white-space:pre;font:400 100px/1 "Anybody Variable",sans-serif;font-kerning:none';
    document.body.append(meter);
  }
  meter.textContent = ch;
  const m: number[] = [];
  for (const [w, k] of [[W0, K0], [W1, K0], [W0, K1], [W1, K1]]) {
    meter.style.fontVariationSettings = fv(w, k);
    m.push(meter.getBoundingClientRect().width / 100);
  }
  model.set(ch, m as [number, number, number, number]);
}
function em(ch: string, w: number, k: number) {
  const m = model.get(ch)!;
  const u = (clamp(w, W0, W1) - W0) / (W1 - W0), v = (clamp(k, K0, K1) - K0) / (K1 - K0);
  return (m[0] + (m[1] - m[0]) * u) * (1 - v) + (m[2] + (m[3] - m[2]) * u) * v;
}
function dEm(ch: string, k: number) {
  const m = model.get(ch)!;
  const v = (clamp(k, K0, K1) - K0) / (K1 - K0);
  return ((m[1] - m[0]) * (1 - v) + (m[3] - m[2]) * v) / (W1 - W0);
}

type Cell = {
  ch: string; live: boolean; el: HTMLElement; gl: HTMLElement; lab?: HTMLElement; mir?: HTMLElement;
  w: number; vw: number; tw: number; k: number; vk: number; tk: number; h: number; vh: number; th: number;
  fw: number; fk: number; start: number; cx: number; cy: number; px: number; lastLab: string; lastH: number;
};
type Row = { el: HTMLElement; mir?: HTMLElement; cells: Cell[]; fs: number; k: number; S0: number; pred: number };

export type KineticOpts = {
  rows: () => string[];
  maxRowH: () => number;
  label?: boolean;
  drag?: boolean;
  mirror?: boolean;
  rest?: [number, number];
  /** Glyphs that don't react: [wdth, wght, className]. */
  fixed?: Record<string, [number, number, string]>;
  onGrown?: (grown: boolean) => void;
  onChart?: () => void;
};

export class Kinetic {
  root: HTMLElement;
  opts: KineticOpts;
  rowsEl!: HTMLElement;
  mirEl?: HTMLElement;
  rows: Row[] = [];
  visible = false;
  presence = 0;
  boost = 0;
  frame = 0;
  t = 0;
  config = "";
  dark = getTheme() === "dark";
  touch = { active: false, x: 0, y: 0, until: 0 };
  tilt = { on: false, x: 0, y: 0 };
  drag: { c: Cell; y0: number; h0: number; x0: number; moved: boolean; holding: boolean; timer: number; id: number; type: string } | null = null;
  grown = false;
  charted = false;

  constructor(root: HTMLElement, opts: KineticOpts) {
    this.root = root;
    this.opts = opts;
    root.classList.add("kw");
    this.build();
    whenVisible(root, (v) => (this.visible = v), "60px");
    onFrame(this.tick);
    onResize(() => { if (this.opts.rows().join("|") !== this.config) this.build(); });
    onTheme((t) => (this.dark = t === "dark"));
    if (opts.drag) this.wireDrag();
  }

  build() {
    const rows = this.opts.rows();
    this.config = rows.join("|");
    const [rw, rk] = this.opts.rest ?? [100, 620];
    const fixed = this.opts.fixed ?? {};
    this.root.innerHTML = "";
    this.rowsEl = document.createElement("div");
    this.rowsEl.className = "kw-rows";
    this.rowsEl.setAttribute("aria-hidden", "true");
    this.root.append(this.rowsEl);
    if (this.opts.mirror) {
      this.mirEl = document.createElement("div");
      this.mirEl.className = "kw-mir";
      this.mirEl.setAttribute("aria-hidden", "true");
      this.root.append(this.mirEl);
    }
    this.rows = [];
    let n = 0;
    const now = this.t || 0;
    for (const text of rows) {
      const el = document.createElement("div");
      el.className = "kw-row";
      const mir = this.mirEl ? Object.assign(document.createElement("div"), { className: "kw-row" }) : undefined;
      const cells: Cell[] = [];
      for (const raw of [...text]) {
        const ch = raw === " " ? " " : raw;
        measureGlyph(ch);
        const fx = fixed[raw];
        const live = !fx && raw !== " ";
        const c = document.createElement("span");
        c.className = `kw-c${live ? " live" : ""}${fx?.[2] ? ` ${fx[2]}` : ""}`;
        const gl = document.createElement("span");
        gl.className = "kw-g";
        gl.textContent = ch;
        c.append(gl);
        let lab: HTMLElement | undefined;
        if (this.opts.label && live) {
          lab = document.createElement("span");
          lab.className = "kw-lab";
          c.append(lab);
        }
        el.append(c);
        let m: HTMLElement | undefined;
        if (mir) {
          const mc = document.createElement("span");
          mc.className = c.className;
          m = document.createElement("span");
          m.className = "kw-g";
          m.textContent = ch;
          mc.append(m);
          mir.append(mc);
        }
        const fw = fx ? fx[0] : raw === " " ? 100 : rw, fk = fx ? fx[1] : raw === " " ? 400 : rk;
        const start = reduced ? 0 : now + 0.25 + n * 0.11;
        const init = reduced || !live;
        cells.push({
          ch, live, el: c, gl, lab, mir: m,
          w: init ? fw : W0, vw: 0, tw: fw, k: init ? fk : K0, vk: 0, tk: fk, h: 1, vh: 0, th: 1,
          fw, fk, start, cx: 0, cy: 0, px: 0, lastLab: "", lastH: 1,
        });
        if (live) n++;
      }
      this.rowsEl.append(el);
      if (mir) this.mirEl!.append(mir);
      const S0 = cells.reduce((s, c) => s + em(c.ch, c.fw, c.fk), 0);
      this.rows.push({ el, mir, cells, fs: 60, k: 1, S0, pred: S0 });
    }
    if (this.opts.drag) this.rows.forEach((r) => r.cells.forEach((c) => c.live && c.el.setAttribute("data-drag", "")));
  }

  /** Every letter at full stretch for a beat (the "type grow" easter egg). */
  kick() { this.boost = 1.25; }
  reset() { this.rows.forEach((r) => r.cells.forEach((c) => (c.th = 1))); this.charted = false; }

  async enableTilt() {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (D.requestPermission && (await D.requestPermission()) !== "granted") return false;
    } catch { return false; }
    addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || e.beta == null) return;
      this.tilt.on = true;
      this.tilt.x = clamp(e.gamma / 35, -1, 1);
      this.tilt.y = clamp((e.beta - 45) / 35, -1, 1);
    });
    return true;
  }

  private cellFor(target: EventTarget | null) {
    const el = (target as HTMLElement | null)?.closest?.(".kw-c.live");
    if (!el) return null;
    for (const r of this.rows) for (const c of r.cells) if (c.el === el) return c;
    return null;
  }

  private wireDrag() {
    const root = this.root;
    root.addEventListener("pointerdown", (e) => {
      this.touch = { active: e.pointerType !== "mouse", x: e.clientX, y: e.clientY, until: 0 };
      const c = this.cellFor(e.target);
      if (!c) return;
      const d = { c, y0: e.clientY, x0: e.clientX, h0: c.th, moved: false, holding: e.pointerType === "mouse", timer: 0, id: e.pointerId, type: e.pointerType };
      if (e.pointerType === "mouse") e.preventDefault();
      else d.timer = window.setTimeout(() => { d.holding = true; c.el.classList.add("hold"); blip(330, 0.05); }, 190);
      this.drag = d;
    });
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") { this.touch.x = e.clientX; this.touch.y = e.clientY; }
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      const dy = d.y0 - e.clientY, dx = d.x0 - e.clientX;
      if (Math.hypot(dx, dy) > 6) d.moved = true;
      if (!d.holding) { if (d.moved) { clearTimeout(d.timer); this.drag = null; } return; }
      const cap = this.capPx(d.c);
      const before = d.c.th;
      d.c.th = clamp(d.h0 + dy / cap, 0.6, this.hMax(d.c));
      if (Math.floor(before * 10) !== Math.floor(d.c.th * 10)) blip(220 + d.c.th * 260, 0.035, 0.05);
    };
    addEventListener("pointermove", move, { passive: true });
    const end = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") { this.touch.active = false; this.touch.until = performance.now() + 700; }
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      clearTimeout(d.timer);
      d.c.el.classList.remove("hold");
      if (!d.moved && e.type === "pointerup") {
        // A tap grows the letter a step; past the top it springs back down.
        const next = d.c.th + 0.34;
        d.c.th = next > this.hMax(d.c) + 0.01 ? 1 : next;
        thock(d.c.th > 1 ? 120 + d.c.th * 40 : 90);
      } else if (d.holding) thock(110 + d.c.th * 40, 0.12);
      this.drag = null;
      this.checkChart();
    };
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
    // Once a letter is "held", the finger drags the letter instead of the page.
    root.addEventListener("touchmove", (e) => { if (this.drag?.holding) e.preventDefault(); }, { passive: false });
  }

  private rowOf(c: Cell) { return this.rows.find((r) => r.cells.includes(c))!; }
  private capPx(c: Cell) { return this.rowOf(c).fs * 0.72; }
  private hMax(c: Cell) {
    const r = c.el.getBoundingClientRect();
    const room = r.bottom - Math.max(84, r.bottom - innerHeight * 0.92);
    return clamp(room / this.capPx(c), 1.15, 2.7);
  }

  private checkChart() {
    const live = this.rows.flatMap((r) => r.cells.filter((c) => c.live));
    const grown = live.some((c) => c.th > 1.04);
    if (grown !== this.grown) { this.grown = grown; this.opts.onGrown?.(grown); }
    if (this.charted || live.length < 3) return;
    const up = live.every((c, i) => i === 0 || c.th >= live[i - 1].th + 0.1) && live[live.length - 1].th >= 1.45;
    if (up) { this.charted = true; this.opts.onChart?.(); }
  }

  tick = (dt: number, time: number) => {
    this.t = time;
    if (!this.visible || !this.rows.length) return;
    this.frame++;
    const r = this.rowsEl.getBoundingClientRect();
    if (!r.width) return;

    // Correct the width model against reality every few frames (kerning, rounding).
    if (this.frame % 8 === 0) for (const row of this.rows) {
      const actual = row.el.offsetWidth;
      if (actual > 0 && row.pred > 0) row.k = clamp(lerp(row.k, actual / (row.pred * row.fs), 0.6), 0.85, 1.2);
    }

    // Where is the "hand"? Tilt > finger > mouse > the idle wave.
    const now = performance.now();
    let px = pointer.x, py = pointer.y, want = 0;
    if (this.tilt.on) { px = r.left + r.width * (0.5 + this.tilt.x * 0.55); py = r.top + r.height * (0.5 + this.tilt.y * 0.6); want = 1; }
    else if (this.touch.active || now < this.touch.until) { px = this.touch.x; py = this.touch.y; want = 1; }
    else if (pointer.type === "mouse" && pointer.moved) {
      const inside = py > r.top - r.height * 0.7 && py < r.bottom + r.height * 0.35 && px > r.left - 80 && px < r.right + 80;
      want = inside ? 1 : 0;
    }
    this.presence += (want - this.presence) * Math.min(1, dt * (want ? 5 : 1.6));
    const wx = r.left + r.width * (0.5 + 0.56 * Math.sin(time * 0.62)), wy = r.top + r.height * (0.5 + 0.3 * Math.sin(time * 0.41));
    const s = reduced ? 0 : clamp(scroll.speed * 1.7 + this.boost, 0, 1);
    this.boost = Math.max(0, this.boost - dt * 0.9);

    const maxFs = this.opts.maxRowH() / LH;
    let yAcc = r.top;
    for (const row of this.rows) {
      const fs = row.fs, rowH = fs * LH;
      let xAcc = r.left;
      for (const c of row.cells) {
        const wpx = em(c.ch, c.w, c.k) * fs * row.k;
        c.cx = xAcc + wpx / 2; c.cy = yAcc + rowH * 0.5; c.px = wpx; xAcc += wpx;
      }
      // Targets from the hand and the idle wave.
      const reach = fs * 0.85;
      for (const c of row.cells) {
        if (!c.live) { c.tw = c.fw; c.tk = c.fk; continue; }
        const g = (x: number, y: number) => { const dx = (x - c.cx) / reach, dy = (y - c.cy) / (reach * 1.4); return Math.exp(-(dx * dx + dy * dy)); };
        const p = Math.max(g(px, py) * this.presence, g(wx, wy) * (1 - this.presence) * 0.9);
        c.tw = W0 + (W1 - W0) * p;
        c.tk = 140 + 760 * Math.pow(p, 0.8);
      }
      // Conserve the measure: shift every live letter's width so the row keeps its length.
      let delta = 0;
      for (let it = 0; it < 4; it++) {
        let S = 0, slope = 0;
        for (const c of row.cells) {
          const w = c.live ? clamp(c.tw + delta, W0, W1) : c.tw;
          S += em(c.ch, w, c.tk);
          if (c.live && w > W0 && w < W1) slope += dEm(c.ch, c.tk);
        }
        if (slope <= 0) break;
        delta += (row.S0 - S) / slope;
      }
      for (const c of row.cells) if (c.live) {
        c.tw = lerp(clamp(c.tw + delta, W0, W1), W1, s);
        c.tk = lerp(c.tk, 840, s * 0.6);
      }
      // Springs.
      let S = 0;
      for (const c of row.cells) {
        if (time >= c.start) {
          c.vw += ((c.tw - c.w) * 170 - c.vw * 15) * dt; c.w += c.vw * dt;
          c.vk += ((c.tk - c.k) * 150 - c.vk * 15) * dt; c.k += c.vk * dt;
          c.vh += ((c.th - c.h) * 120 - c.vh * 8.5) * dt; c.h += c.vh * dt;
        }
        S += em(c.ch, c.w, c.k);
      }
      row.pred = S;
      row.fs = Math.max(12, Math.min(maxFs, r.width / (S * row.k)));
      yAcc += row.fs * LH;
    }

    // Write.
    const labels = this.opts.label && this.frame % 3 === 0;
    for (const row of this.rows) {
      const fsTxt = `${row.fs.toFixed(2)}px`;
      row.el.style.fontSize = fsTxt;
      if (row.mir && this.dark) row.mir.style.fontSize = fsTxt;
      const cap = row.fs * 0.72;
      for (const c of row.cells) {
        const set = fv(c.w, c.k);
        c.gl.style.fontVariationSettings = set;
        const h = Math.max(0.3, c.h);
        if (Math.abs(h - c.lastH) > 0.002) { c.gl.style.transform = `scaleY(${h.toFixed(3)})`; c.lastH = h; }
        if (this.dark) {
          const x0 = c.cx - c.px / 2;
          c.gl.style.setProperty("--hx", `${(((px - x0) / Math.max(1, c.px)) * 100).toFixed(1)}%`);
          c.gl.style.setProperty("--hy", `${(((py - (c.cy - row.fs * LH * 0.5)) / (row.fs * LH)) * 100).toFixed(1)}%`);
          if (c.mir) { c.mir.style.fontVariationSettings = set; c.mir.style.transform = c.gl.style.transform; }
        }
        if (labels && c.lab) {
          const grown = c.h > 1.04 ? ` +${Math.round((c.h - 1) * 100)}%` : "";
          const txt = innerWidth < 760 ? `${Math.round(c.w)}/${Math.round(c.k)}${grown}` : `wdth ${Math.round(c.w)} wght ${Math.round(c.k)}${grown}`;
          if (txt !== c.lastLab) { c.lab.textContent = txt; c.lastLab = txt; }
          c.lab.style.transform = `translateY(${(-(h - 1) * cap).toFixed(1)}px)`;
        }
      }
    }
    if (this.frame % 20 === 0) this.checkChart();
  };
}
