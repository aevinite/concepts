// Small helpers shared by every part of Side A.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const coarse = () => matchMedia("(pointer: coarse)").matches;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** 74.4 -> "1:14" */
export const fmt = (t: number) => {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** "1 min 14 s" -> 74, "52 s" -> 52 */
export const parseLen = (s: string) => {
  const m = /(\d+)\s*min/.exec(s), sec = /(\d+)\s*s\b/.exec(s);
  return (m ? Number(m[1]) * 60 : 0) + (sec ? Number(sec[1]) : 0);
};

/** Reading time of some text, as an honest "track length": about 230 words a minute. */
export const readTime = (text: string) => Math.max(4, Math.round((text.split(/\s+/).length / 230) * 60));

export function frag(html: string) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content;
}

/** Calls cb(true/false) as the element enters / leaves the screen. */
export function whileVisible(el: Element, cb: (v: boolean) => void, margin = "0px") {
  const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin });
  io.observe(el);
  return io;
}

/** Calls cb once, the first time the element is on screen. */
export function onceVisible(el: Element, cb: () => void, margin = "0px 0px -12% 0px") {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin: margin });
  io.observe(el);
}

/** A requestAnimationFrame loop that only runs while `el` is on screen and the tab is visible. */
export function loop(el: Element, tick: (dt: number, now: number) => void) {
  let on = false, vis = false, raf = 0, last = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    tick(dt, now);
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    const want = vis && !document.hidden;
    if (want && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!want && on) { on = false; cancelAnimationFrame(raf); }
  };
  whileVisible(el, (v) => { vis = v; sync(); }, "120px");
  document.addEventListener("visibilitychange", sync);
}

export const icon = {
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" fill="currentColor"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.3 14.8L2.3 21.8l4.9-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.6-.4z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5 9.3 3l1.6 4.2-2 1.4a11 11 0 0 0 6.5 6.5l1.4-2 4.2 1.6-.5 2.7a2 2 0 0 1-2 1.6A16.5 16.5 0 0 1 5 5.5a2 2 0 0 1 1.6-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
};
