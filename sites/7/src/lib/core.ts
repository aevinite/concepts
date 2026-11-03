// Small shared helpers for Concept 7 (Drafting Table).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { getTheme, onTheme, type Theme } from "@shared/theme";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
export { gsap, ScrollTrigger };

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const coarse = () => matchMedia("(pointer: coarse)").matches;
export const narrow = () => innerWidth < 760;
export const isDark = () => getTheme() === "dark";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** "1 min 14 s" / "52 s" to seconds. */
export const parseLength = (s: string) => {
  const m = s.match(/(\d+)\s*min/), sec = s.match(/(\d+)\s*s\b/);
  return (m ? Number(m[1]) * 60 : 0) + (sec ? Number(sec[1]) : 0);
};

/** Calls back when an element enters/leaves the viewport (with margin). */
export function watchView(el: Element, cb: (visible: boolean) => void, margin = "0px", threshold = 0) {
  const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin, threshold });
  io.observe(el);
  return () => io.disconnect();
}

/**
 * A requestAnimationFrame loop that only runs while its element is on screen, the tab is visible
 * and `enabled()` says yes. Returns a stop function.
 */
export function visibleLoop(el: Element, tick: (dt: number, now: number) => void, enabled: () => boolean = () => true) {
  let onScreen = false, raf = 0, last = 0, dead = false;
  const run = (now: number) => {
    raf = 0;
    if (dead || !onScreen || document.hidden || !enabled()) return;
    const dt = last ? Math.min(50, now - last) : 16.7;
    last = now;
    tick(dt, now);
    raf = requestAnimationFrame(run);
  };
  const kick = () => { if (!raf && !dead && onScreen && !document.hidden && enabled()) { last = 0; raf = requestAnimationFrame(run); } };
  const stopWatch = watchView(el, (v) => { onScreen = v; kick(); }, "80px");
  const vis = () => kick();
  document.addEventListener("visibilitychange", vis);
  return {
    kick,
    stop() { dead = true; if (raf) cancelAnimationFrame(raf); stopWatch(); document.removeEventListener("visibilitychange", vis); },
  };
}

/** Theme listener that also fires once now. */
export function themed(cb: (t: Theme) => void) {
  cb(getTheme());
  return onTheme(cb);
}

/** Fonts loaded (so measured text is right). */
export const fontsReady = () => (document.fonts?.ready ?? Promise.resolve()).then(() => undefined);

/** Rolling number: animates el's text from its current number to `to`. */
export function rollNumber(el: HTMLElement, to: number, dur = 1.2, pad = 0) {
  const from = Number(el.dataset.v ?? "0");
  el.dataset.v = String(to);
  const o = { v: from };
  const fmt = (v: number) => String(Math.round(v)).padStart(pad, "0");
  if (reduced()) { el.textContent = fmt(to); return; }
  gsap.to(o, { v: to, duration: dur, ease: "power2.out", onUpdate: () => { el.textContent = fmt(o.v); } });
}

export const svgNS = "http://www.w3.org/2000/svg";
