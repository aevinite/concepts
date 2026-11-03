// Small helpers shared by every page of concept 5 (Panels).
export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const isPhone = () => matchMedia("(max-width: 760px)").matches;
export const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Deterministic random numbers, so drawings look the same on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Calls back with true/false as an element enters or leaves the screen. */
export function watchView(el: Element, cb: (inView: boolean) => void, margin = "0px", threshold = 0) {
  const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin, threshold });
  io.observe(el);
  return io;
}

/** Fires once when an element first comes into view. */
export function onceInView(el: Element, cb: () => void, margin = "0px 0px -12% 0px") {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin: margin });
  io.observe(el);
}
