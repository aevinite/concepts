// The bath: one fixed full-screen fluid behind every page. Owns the engine (GPU fluid or the
// paper fallback), the pointer brush, the scroll comb, the headline obstacle, ambient life,
// the night sparks and snapshots for prints and the marbled card.
import { Fluid, type Mode, type RGB } from "./fluid";
import { Ink2D } from "./ink2d";
import { getTheme, onTheme, prefersReducedMotion } from "@shared/theme";
import { plip, swish, chord } from "./sound";

export type PigmentId = "indigo" | "gold" | "amber" | "terracotta" | "sap" | "saffron" | "cream" | "deep";
export const PIGMENTS: Record<PigmentId, { name: string; light: string; dark: string }> = {
  indigo: { name: "Indigo", light: "#2a3c72", dark: "#3cf2dc" },
  gold: { name: "Gold", light: "#c29a3f", dark: "#ffd86a" },
  amber: { name: "Amber", light: "#de8723", dark: "#ff9638" },
  terracotta: { name: "Terracotta", light: "#b4523a", dark: "#ff6a5c" },
  sap: { name: "Sap green", light: "#5b7a3d", dark: "#6cffa0" },
  saffron: { name: "Saffron", light: "#e7b24c", dark: "#ffc65e" },
  cream: { name: "Size white", light: "#f6efe0", dark: "#0d4a52" },
  deep: { name: "Lamp black", light: "#22283a", dark: "#1a7d96" },
};
export const hexRGB = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const pigment = (id: PigmentId, mode: Mode = getTheme()): RGB => hexRGB(PIGMENTS[id][mode]);

type Engine = Fluid | Ink2D;
type P = { x: number; y: number; sx: number; sy: number; t: number; moved: boolean; type: string; inBath: boolean; paint: boolean };

const isPhone = () => matchMedia("(max-width: 760px), (pointer: coarse)").matches;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

class Bath {
  canvas!: HTMLCanvasElement;
  engine!: Engine;
  gpu = false;
  palette: PigmentId[] = ["indigo", "gold", "amber"];
  seedSet: PigmentId[] = ["indigo", "gold", "amber", "terracotta", "sap", "cream"];
  current: PigmentId = "indigo";
  brush = false;
  private sparks!: Sparks;
  private hero: HTMLElement | null = null;
  private maskCanvas = document.createElement("canvas");
  private ptr = new Map<number, P>();
  private mouse: { x: number; y: number } | null = null;
  private pendingScroll = 0;
  private lastScrollY = 0;
  private scrollIdle = 0;
  private combOrigin = 0.5;
  private idle = 0;
  private pulse = 0;
  private t0 = performance.now();
  private last = performance.now();
  private raf = 0;
  private running = false;
  private anims: ((dt: number) => boolean)[] = [];
  private listeners = new Set<() => void>();
  W = 1; H = 1;

  init(opts: { palette: PigmentId[]; seedSet: PigmentId[]; hero: HTMLElement | null }) {
    this.palette = opts.palette;
    this.seedSet = opts.seedSet;
    this.current = opts.palette[0];
    this.hero = opts.hero;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "bath";
    this.canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(this.canvas);
    this.sizeCanvas();
    const phone = isPhone();
    const fluid = new URLSearchParams(location.search).has("paper") ? null : Fluid.create(this.canvas, { simRes: phone ? 80 : 128, dyeRes: phone ? 512 : 960, pressureIters: phone ? 14 : 22, curl: phone ? 14 : 18 });
    if (fluid) {
      this.engine = fluid; this.gpu = true;
      if (fluid.soft) { this.soft = true; this.sizeCanvas(); fluid.initFramebuffers(); }
    }
    else {
      this.canvas.remove();
      this.canvas = document.createElement("canvas");
      this.canvas.className = "bath";
      this.canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(this.canvas);
      this.sizeCanvas();
      this.engine = new Ink2D(this.canvas);
    }
    document.documentElement.dataset.engine = this.gpu ? "gpu" : "paper";
    this.sparks = new Sparks();
    this.applyMode(getTheme());
    this.seed();
    this.bindInput();
    this.lastScrollY = scrollY;
    addEventListener("scroll", () => { this.pendingScroll += scrollY - this.lastScrollY; this.lastScrollY = scrollY; }, { passive: true });
    // resizing a canvas clears it: paint again at once so a blank frame never reaches the screen
    new ResizeObserver(() => { this.sizeCanvas(); this.engine.initFramebuffers(); this.buildMask(); this.engine.render((performance.now() - this.t0) / 1000); }).observe(this.canvas);
    document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
    onTheme((t) => { this.applyMode(t); this.engine.fade(0, true); this.seed(); this.buildMask(); });
    document.fonts?.ready.then(() => this.buildMask());
    this.start();
  }

  onFrame(cb: () => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }

  private soft = false;

  private sizeCanvas() {
    const dpr = this.soft ? 0.75 : Math.min(devicePixelRatio || 1, isPhone() ? 1.25 : 1.5);
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.W = w; this.H = h;
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
  }

  private applyMode(t: Mode) {
    this.engine.mode = t;
    this.engine.velocityDissipation = t === "dark" ? 0.6 : 1.6;
    if (this.engine instanceof Fluid) this.engine.opts.curl = t === "dark" ? (isPhone() ? 12 : 15) : 3;
    this.engine.dyeDissipation = t === "dark" ? 0.2 : 0.0;
    this.sparks.enabled = t === "dark" && !prefersReducedMotion();
  }

  /** Lay a fresh composition on the bath for the current world. */
  seed() {
    const e = this.engine;
    const dark = e.mode === "dark";
    const asp = this.W / this.H;
    if (!dark) {
      // A battal ground: drops on a jittered grid, rings of size white, then a gel-git comb.
      const cols = Math.max(3, Math.round(asp * 4)), rows = 4;
      const cells: [number, number][] = [];
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) cells.push([(i + rnd(0.15, 0.85)) / cols, (j + rnd(0.15, 0.85)) / rows]);
      cells.sort(() => Math.random() - 0.5);
      cells.forEach(([x, y], k) => {
        const solid = this.seedSet.filter((p) => p !== "cream");
        const id = solid[k % solid.length];
        e.drop(x, y, rnd(0.07, 0.13), pigment(id, "light"));
        if (k % 3 === 0) e.drop(x + rnd(-0.01, 0.01), y, rnd(0.025, 0.05), pigment(k % 2 ? "cream" : this.palette[k % this.palette.length], "light"));
      });
      // a second, smaller layer for detail
      for (let k = 0; k < Math.round(cols * 2.5); k++) e.drop(rnd(0, 1), rnd(0, 1), rnd(0.02, 0.05), pigment(this.seedSet[(k * 7) % this.seedSet.length], "light"));
      this.combOrigin = Math.random();
      e.tine(1, 0, 0.5, this.combOrigin, 0.09, 0.012, 0.11, true);
      e.tine(0, 1, 0.33, 0.5, 0.05, 0.008, 0.05, false);
    } else {
      const night = this.night();
      for (let k = 0; k < 9; k++) {
        const x = rnd(0.05, 0.95), y = rnd(0.08, 0.92);
        e.drop(x, y, rnd(0.025, 0.055), pigment(night[k % night.length], "dark"), rnd(0.3, 0.5));
        e.splat(x, y, rnd(-400, 400), rnd(-400, 400), null, 0.4);
      }
      for (let k = 0; k < 16; k++) e.splat(rnd(0, 1), rnd(0, 1), rnd(-600, 600), rnd(-600, 600), pigment(night[k % night.length], "dark"), rnd(0.06, 0.2), 0.3);
      for (let i = 0; i < 30; i++) e.step(1 / 60);
    }
    e.render(0);
  }

  /** At night the sea is mostly cold light, with the page's own colour as the rare warm spark. */
  private night(): PigmentId[] { return ["indigo", "sap", "deep", "indigo", this.palette[0] === "indigo" ? "gold" : this.palette[0], "deep"]; }

  // ---------- input ----------
  private uv(cx: number, cy: number) { return { x: cx / this.W, y: 1 - cy / this.H }; }

  private inBath(t: EventTarget | null) {
    const el = t as Element | null;
    if (!el || !el.closest) return false;
    if (el.closest("a,button,input,select,textarea,video,label,summary,[data-solid],dialog")) return false;
    return !!el.closest("[data-bath]");
  }

  private bindInput() {
    const opt = { passive: true } as AddEventListenerOptions;
    addEventListener("pointerdown", (e) => {
      const inBath = this.inBath(e.target);
      this.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, type: e.pointerType, inBath, paint: inBath });
      this.idle = 0;
    }, opt);
    addEventListener("pointermove", (e) => {
      this.idle = 0;
      const p = this.ptr.get(e.pointerId);
      if (e.pointerType === "mouse") {
        const m = this.mouse;
        this.mouse = { x: e.clientX, y: e.clientY };
        if (m && !document.hidden) {
          const dx = e.clientX - m.x, dy = e.clientY - m.y;
          if (dx || dy) this.push(e.clientX, e.clientY, dx, dy, !!(p && p.inBath && e.buttons));
          this.sparks.trail(e.clientX, e.clientY, dx, dy);
        }
        if (p && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) p.moved = true;
        return;
      }
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 8) p.moved = true;
      if (p.inBath && p.paint) { this.push(e.clientX, e.clientY, dx, dy, true); this.sparks.trail(e.clientX, e.clientY, dx, dy); }
    }, opt);
    const end = (e: PointerEvent, cancel: boolean) => {
      const p = this.ptr.get(e.pointerId);
      this.ptr.delete(e.pointerId);
      if (!p || cancel) return;
      if (!p.moved && p.inBath && performance.now() - p.t < 450 && this.inBath(e.target)) this.tap(e.clientX, e.clientY);
    };
    addEventListener("pointerup", (e) => end(e, false), opt);
    addEventListener("pointercancel", (e) => end(e, true), opt);
    document.addEventListener("mouseleave", () => (this.mouse = null));
  }

  /** Brush stroke: push the water; paint while pressed. */
  push(cx: number, cy: number, dx: number, dy: number, paint: boolean) {
    const { x, y } = this.uv(cx, cy);
    const dark = this.engine.mode === "dark";
    const f = paint ? 9 : dark ? 6 : 5.5;
    const vx = (dx / this.W) * f * 1000, vy = (-dy / this.H) * f * 1000;
    // on paper, a hover only moves the water; at night every movement leaves a thin trail of light
    const color = paint || dark ? pigment(this.current) : null;
    const amount = paint ? (dark ? 0.7 : 0.55) : 0.3;
    const rad = paint ? (dark ? 0.09 : 0.22) : dark ? 0.035 : 0.16;
    this.engine.splat(x, y, vx, vy, color, rad, amount);
  }

  /** A drop of the chosen pigment, at a screen point. */
  tap(cx: number, cy: number, id: PigmentId = this.current, r?: number) {
    const { x, y } = this.uv(cx, cy);
    const dark = this.engine.mode === "dark";
    const rad = r ?? (isPhone() ? rnd(0.035, 0.05) : rnd(0.045, 0.07));
    this.engine.drop(x, y, rad, pigment(id), dark ? 0.75 : 1);
    if (dark) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; this.engine.splat(x + Math.cos(a) * 0.02, y + Math.sin(a) * 0.02, Math.cos(a) * 420, Math.sin(a) * 420, null, 0.12); }
    this.sparks.burst(cx, cy, PIGMENTS[id].dark);
    plip(0.9 + Math.random() * 0.25);
  }

  // ---------- tools ----------
  private animate(fn: (dt: number) => boolean) { this.anims.push(fn); }

  comb() {
    swish(0.8);
    const dark = this.engine.mode === "dark";
    let t = 0;
    const origin = Math.random();
    this.animate((dt) => {
      t += dt;
      const k = Math.min(1, t / 0.9);
      if (!dark) {
        if (k < 0.5) this.engine.tine(1, 0, 0.5, origin, 0.0045 * (dt * 60), 0.012, 0.09, true);
        else this.engine.tine(0, 1, origin, 0.5, 0.0035 * (dt * 60), 0.007, 0.045, false);
      } else {
        const x = k;
        for (let i = 0; i < 5; i++) this.engine.splat(x, (i + 0.5) / 5, 900, (i % 2 ? 1 : -1) * 260, pigment(this.palette[i % this.palette.length]), 0.18, 0.18);
      }
      return k < 1;
    });
  }

  tulip(cx = this.W * (isPhone() ? 0.5 : 0.72), cy = this.H * (isPhone() ? 0.62 : 0.5)) {
    const { x, y } = this.uv(cx, cy);
    const rings: PigmentId[] = [this.palette[0], "cream", this.palette[1], "cream", this.palette[2], this.palette[0], "cream"];
    const dark = this.engine.mode === "dark";
    let i = 0, t = 0, pull = 0;
    const R = isPhone() ? 0.13 : 0.17;
    this.animate((dt) => {
      t += dt;
      if (i < rings.length && t > i * 0.12) {
        this.engine.drop(x, y, R * (1 - i / (rings.length + 0.6)), pigment(rings[i]), dark ? 0.7 : 1);
        plip(0.8 + i * 0.08);
        i++;
        return true;
      }
      if (i >= rings.length && t > rings.length * 0.12 + 0.15) {
        const step = 0.012 * dt * 60;
        this.engine.tine(0, 1, x, y, step, 0.012, 0, false);
        pull += step;
        if (pull > (isPhone() ? 0.2 : 0.26)) { chord(); return false; }
      }
      return true;
    });
  }

  skim() {
    swish(0.6);
    let t = 0;
    this.animate((dt) => {
      t += dt;
      this.engine.fade(0.86);
      if (t > 0.45) {
        this.engine.fade(0, true);
        const dark = this.engine.mode === "dark";
        for (let k = 0; k < 4; k++) this.engine.drop(rnd(0.1, 0.9), rnd(0.15, 0.85), rnd(0.04, 0.08), pigment(this.palette[k % this.palette.length]), dark ? 0.6 : 1);
        return false;
      }
      return true;
    });
  }

  /** A few fresh drops (after a print is pulled the bath gets new colour). */
  refresh(n = 3) {
    const dark = this.engine.mode === "dark";
    for (let k = 0; k < n; k++) this.engine.drop(rnd(0.05, 0.95), rnd(0.05, 0.95), rnd(0.04, 0.09), pigment(this.seedSet[Math.floor(Math.random() * this.seedSet.length)]), dark ? 0.55 : 1);
  }

  /** Drop at a page point with a pigment (pigment jars, numbers). */
  dropAt(cx: number, cy: number, id: PigmentId, r = 0.06) { this.tap(cx, cy, id, r); }

  /** The bath as an image (no headline halo). */
  snapshot(w: number, h: number, region?: { x: number; y: number; w: number; h: number }) {
    this.engine.render((performance.now() - this.t0) / 1000, false);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const cw = this.canvas.width, ch = this.canvas.height;
    let r = region ? { x: region.x * cw, y: region.y * ch, w: region.w * cw, h: region.h * ch } : { x: 0, y: 0, w: cw, h: ch };
    const want = w / h;
    if (r.w / r.h > want) { const nw = r.h * want; r = { ...r, x: r.x + (r.w - nw) / 2, w: nw }; }
    else { const nh = r.w / want; r = { ...r, y: r.y + (r.h - nh) / 2, h: nh }; }
    c.getContext("2d")!.drawImage(this.canvas, r.x, r.y, r.w, r.h, 0, 0, w, h);
    this.engine.render((performance.now() - this.t0) / 1000, true);
    return c;
  }

  // ---------- headline obstacle ----------
  buildMask() {
    const hero = this.hero;
    if (!hero) return;
    const words = hero.querySelectorAll<HTMLElement>("[data-obstacle] .w");
    if (!words.length) return;
    const r = hero.getBoundingClientRect();
    const s = this.gpu ? 0.5 : 0.5;
    const mc = this.maskCanvas;
    mc.width = Math.max(2, Math.round(r.width * s)); mc.height = Math.max(2, Math.round(r.height * s));
    const x = mc.getContext("2d")!;
    x.clearRect(0, 0, mc.width, mc.height);
    x.fillStyle = x.strokeStyle = "#fff";
    x.shadowColor = "#fff";
    x.lineJoin = "round";
    words.forEach((w) => {
      const wr = w.getBoundingClientRect();
      const cs = getComputedStyle(w);
      const fs = parseFloat(cs.fontSize) * s;
      x.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      try { (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${parseFloat(cs.letterSpacing || "0") * s || 0}px`; } catch { /* old browsers */ }
      x.textBaseline = "alphabetic";
      const m = x.measureText(w.textContent || "");
      const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
      const top = (wr.top - r.top) * s, h = wr.height * s;
      const base = top + h / 2 + (asc - desc) / 2;
      x.lineWidth = fs * 0.22;
      x.shadowBlur = fs * 0.42;
      x.strokeText(w.textContent || "", (wr.left - r.left) * s, base);
      x.fillText(w.textContent || "", (wr.left - r.left) * s, base);
      x.shadowBlur = fs * 0.5;
      x.fillText(w.textContent || "", (wr.left - r.left) * s, base);
    });
    this.engine.setMask(mc, this.maskRect());
  }

  private maskRect(): [number, number, number, number] {
    if (!this.hero) return [-9, -9, 1, 1];
    const r = this.hero.getBoundingClientRect();
    return [r.left / this.W, 1 - r.bottom / this.H, r.width / this.W, r.height / this.H];
  }

  // ---------- loop ----------
  start() { if (this.running) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.frame); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  private frame = (now: number) => {
    if (!this.running) return;
    // a software rasteriser gets a calmer 30 frames a second
    if (this.soft && now - this.last < 30) { this.raf = requestAnimationFrame(this.frame); return; }
    const dt = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;
    const t = (now - this.t0) / 1000;
    const e = this.engine;
    const dark = e.mode === "dark";
    try {
      // scroll comb (paper) or wake (night)
      const ps = this.pendingScroll;
      if (Math.abs(ps) > 0.5) {
        this.pendingScroll = 0;
        this.scrollIdle = 0;
        const z = Math.max(-0.035, Math.min(0.035, (ps / this.H) * 0.16));
        if (!dark) e.tine(0, 1, this.combOrigin, 0.5, z, 0.006, isPhone() ? 0.075 : 0.085, false);
        else for (let i = 0; i < 4; i++) e.splat(rnd(0, 1), rnd(0.1, 0.9), rnd(-120, 120), (ps / this.H) * 2600, i === 0 ? pigment(this.palette[Math.floor(Math.random() * 3)]) : null, 0.25, 0.22);
      } else if (this.scrollIdle >= 0) {
        this.scrollIdle += dt;
        if (this.scrollIdle > 0.7) {
          // the comb is lifted: the marbler adds new colour
          this.scrollIdle = -1;
          this.combOrigin = Math.random();
          if (!dark) this.refresh(2);
        }
      }
      // ambient life
      this.idle += dt;
      if (!prefersReducedMotion()) {
        const lx = 0.5 + 0.38 * Math.sin(t * 0.21), ly = 0.5 + 0.32 * Math.sin(t * 0.17 + 1.3);
        const vx = Math.cos(t * 0.21) * 0.38 * 0.21, vy = Math.cos(t * 0.17 + 1.3) * 0.32 * 0.17;
        e.splat(lx, ly, vx * (dark ? 900 : 380), vy * (dark ? 900 : 380), null, 0.6);
        if (dark) {
          this.pulse -= dt;
          if (this.pulse <= 0) {
            this.pulse = rnd(0.35, 0.9);
            const night = this.night();
            e.splat(rnd(0.03, 0.97), rnd(0.05, 0.95), rnd(-250, 250), rnd(-250, 250), pigment(night[Math.floor(Math.random() * night.length)]), rnd(0.05, 0.16), rnd(0.3, 0.5));
          }
        }
      }
      this.anims = this.anims.filter((a) => a(dt));
      e.step(dt);
      if (this.hero) e.maskRect = this.maskRect();
      e.render(t);
      this.sparks.frame(dt, t);
      this.listeners.forEach((l) => l());
    } catch (err) {
      console.warn("[ink] bath error", err);
      this.stop();
      return;
    }
    this.raf = requestAnimationFrame(this.frame);
  };
}

/** Night only: drifting plankton motes and the sparks that trail your finger. */
class Sparks {
  enabled = false;
  private c = document.createElement("canvas");
  private x: CanvasRenderingContext2D;
  private motes: { x: number; y: number; r: number; p: number; s: number }[] = [];
  private live: { x: number; y: number; vx: number; vy: number; life: number; col: string }[] = [];
  private w = 0; private h = 0;
  private drawn = false;
  constructor() {
    this.c.className = "sparks";
    this.c.setAttribute("aria-hidden", "true");
    document.body.prepend(this.c);
    this.x = this.c.getContext("2d")!;
    const size = () => { this.w = this.c.width = innerWidth; this.h = this.c.height = Math.max(innerHeight, this.c.clientHeight || 0); };
    size(); addEventListener("resize", size);
    const n = isPhone() ? 34 : 70;
    for (let i = 0; i < n; i++) this.motes.push({ x: Math.random(), y: Math.random(), r: rnd(0.5, 1.8), p: Math.random() * 10, s: rnd(0.004, 0.014) });
  }
  trail(x: number, y: number, dx: number, dy: number) {
    if (!this.enabled) return;
    const sp = Math.hypot(dx, dy);
    const n = Math.min(4, Math.floor(sp / 6) + 1);
    for (let i = 0; i < n && this.live.length < 220; i++) this.live.push({ x: x - dx * Math.random(), y: y - dy * Math.random(), vx: rnd(-30, 30) - dx * 0.6, vy: rnd(-30, 30) - dy * 0.6, life: rnd(0.5, 1.1), col: Math.random() < 0.7 ? "120,255,230" : "255,214,120" });
  }
  burst(x: number, y: number, hex: string) {
    if (!this.enabled) return;
    const c = hexRGB(hex).map((v) => Math.round(v * 255)).join(",");
    for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, s = rnd(40, 220); this.live.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.5, 1.2), col: c }); }
  }
  frame(dt: number, t: number) {
    const x = this.x;
    if (!this.enabled) { if (this.drawn) { x.clearRect(0, 0, this.w, this.h); this.drawn = false; } this.live.length = 0; return; }
    this.drawn = true;
    x.clearRect(0, 0, this.w, this.h);
    x.globalCompositeOperation = "lighter";
    for (const m of this.motes) {
      m.y -= m.s * dt; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      const px = (m.x + Math.sin(t * 0.3 + m.p) * 0.01) * this.w, py = m.y * this.h;
      const a = 0.25 + 0.25 * Math.sin(t * 1.7 + m.p * 3);
      x.fillStyle = `rgba(140,255,232,${a})`;
      x.beginPath(); x.arc(px, py, m.r, 0, 6.283); x.fill();
    }
    this.live = this.live.filter((p) => (p.life -= dt) > 0);
    for (const p of this.live) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
      x.fillStyle = `rgba(${p.col},${Math.min(1, p.life * 1.3)})`;
      x.beginPath(); x.arc(p.x, p.y, 1.1 + p.life * 1.2, 0, 6.283); x.fill();
    }
    x.globalCompositeOperation = "source-over";
  }
}

export const bath = new Bath();
