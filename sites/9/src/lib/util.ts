// Small helpers shared by every page of Saap Sidi.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin);
export { gsap, ScrollTrigger };

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isPhone = () => matchMedia("(max-width: 720px)").matches;
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A fair die: 1 to 6 from the browser's crypto source, with rejection so no face is favoured. */
export function rollD6(): number {
  const a = new Uint32Array(1);
  const limit = 4294967296 - (4294967296 % 6);
  do crypto.getRandomValues(a); while (a[0] >= limit);
  return (a[0] % 6) + 1;
}

/** A fair coin (cowrie shells land mouth up or down). */
export const coin = () => {
  const a = new Uint8Array(1);
  crypto.getRandomValues(a);
  return (a[0] & 1) === 1;
};

/** Run `cb` once when `el` first scrolls into view. */
export function onceVisible(el: Element, cb: () => void, threshold = 0.25) {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { threshold });
  io.observe(el);
}

/** Pause/resume something with visibility on screen AND tab visibility. */
export function whileVisible(el: Element, on: () => void, off: () => void, threshold = 0) {
  let seen = false;
  const sync = () => (seen && !document.hidden ? on() : off());
  new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; sync(); }, { threshold }).observe(el);
  document.addEventListener("visibilitychange", sync);
}

export const icon = {
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.4 1 2.5.1.2 1.7 2.7 4.2 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6.6 3.5 9.4 7l-1.7 2.2a12 12 0 0 0 7.1 7.1L17 14.6l3.5 2.8-1.4 3a2 2 0 0 1-2 1A16.5 16.5 0 0 1 2.6 6.9a2 2 0 0 1 1-2Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12h15m-6-6 6 6-6 6"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M20 12H5m6-6-6 6 6 6"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m6 6 12 12M18 6 6 18"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z"/></svg>`,
};
