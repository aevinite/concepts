// Small helpers shared by every Patang page.

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** Gujarati numerals, used as quiet decoration next to the Latin ones. */
const GU = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
export const gu = (n: number | string) => String(n).replace(/\d/g, (d) => GU[+d]);

/** Seeded random, so the rooftops look the same on every visit. */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const isCoarse = () => matchMedia("(pointer: coarse)").matches;
export const isNarrow = () => innerWidth < 760;
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Calls back with true / false as the element enters or leaves the screen. */
export function watchView(el: Element, cb: (visible: boolean) => void, rootMargin = "0px") {
  const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin });
  io.observe(el);
  return io;
}

/** A kite drawn in SVG, used for buttons, bullets and tags. Colours come from CSS variables. */
export const kiteSVG = (cls = "", a = "var(--k-a)", b = "var(--k-b)") => `<svg class="kite-ico ${cls}" viewBox="-52 -52 104 126" aria-hidden="true">
  <path d="M0 64 L-11 84 L11 84 Z" fill="${b}"/>
  <path d="M0 -50 L49 -3 L0 51 L-49 -3 Z" fill="${a}"/>
  <path d="M0 -50 L49 -3 L0 51 Z" fill="${b}" opacity=".9"/>
  <path d="M0 -50 L0 51 M-49 -3 Q0 -40 49 -3" fill="none" stroke="rgba(60,35,10,.55)" stroke-width="2.4"/>
  <path d="M0 -50 L49 -3 L0 51 L-49 -3 Z" fill="none" stroke="rgba(40,25,10,.3)" stroke-width="2"/>
</svg>`;

/** Sample a quadratic curve into points. */
export function quadPts(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n: number) {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
  return out;
}

/** Segment intersection; returns the crossing point or null. */
export function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const r1 = bx - ax, r2 = by - ay, s1 = dx - cx, s2 = dy - cy;
  const den = r1 * s2 - r2 * s1;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((cx - ax) * s2 - (cy - ay) * s1) / den;
  const u = ((cx - ax) * r2 - (cy - ay) * r1) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: ax + t * r1, y: ay + t * r2 };
}
