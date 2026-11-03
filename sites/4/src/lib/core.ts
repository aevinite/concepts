// The engine room every page shares: fonts, GSAP, smooth scroll, one frame loop,
// the pointer and the scroll speed (the site's type reacts to both).
import "@fontsource-variable/anybody/standard.css";
import "@fontsource-variable/unbounded/wght.css";
import "@fontsource-variable/instrument-sans/standard.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "../style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import Lenis from "lenis";
import { prefersReducedMotion } from "@shared/theme";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
export { gsap, ScrollTrigger, SplitText };

export const reduced = prefersReducedMotion();
export const coarse = matchMedia("(pointer: coarse)").matches;
export const isNarrow = () => innerWidth < 760;

/** Live scroll state. `v` is px per second (signed, smoothed); `speed` is 0..1. */
export const scroll = { y: 0, v: 0, speed: 0, dir: 1 };
/** Live pointer state in viewport pixels. */
export const pointer = { x: innerWidth / 2, y: innerHeight * 0.4, moved: false, type: "mouse" as string, down: false, t: 0 };

type FrameFn = (dt: number, t: number) => void;
const frames = new Set<FrameFn>();
export const onFrame = (fn: FrameFn) => { frames.add(fn); return () => frames.delete(fn); };

export let lenis: Lenis | null = null;

let lastY = scrollY;
let started = false;
export function startCore() {
  if (started) return;
  started = true;
  if (!reduced) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
  }
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time, deltaMs) => {
    const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    lenis?.raf(time * 1000);
    const y = scrollY;
    const raw = (y - lastY) / dt;
    lastY = y;
    scroll.y = y;
    scroll.v += (raw - scroll.v) * Math.min(1, dt * 9);
    if (Math.abs(scroll.v) < 2) scroll.v = 0;
    if (scroll.v !== 0) scroll.dir = scroll.v > 0 ? 1 : -1;
    const target = Math.min(1, Math.abs(scroll.v) / 4200);
    scroll.speed += (target - scroll.speed) * Math.min(1, dt * (target > scroll.speed ? 10 : 3.2));
    frames.forEach((f) => f(dt, time));
  });

  const track = (e: PointerEvent) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; pointer.type = e.pointerType; pointer.t = performance.now();
  };
  addEventListener("pointermove", track, { passive: true });
  addEventListener("pointerdown", (e) => { track(e); pointer.down = true; }, { passive: true });
  addEventListener("pointerup", () => { pointer.down = false; }, { passive: true });
  addEventListener("pointercancel", () => { pointer.down = false; }, { passive: true });

  // In-page anchors glide (and land below the fixed header).
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest?.("a[href*='#']") as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.querySelector(url.hash);
    if (!el) return;
    e.preventDefault();
    scrollToEl(el as HTMLElement);
    history.replaceState(null, "", url.hash);
  });
}

export function scrollToEl(el: HTMLElement, offset = -72) {
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

/** Wait for the faces the kinetic type measures, so measurements are real. */
export async function fontsReady() {
  const f = document.fonts;
  await Promise.all([
    f.load('900 100px "Anybody Variable"', "GROWAEVIDNCMPUSTL"),
    f.load('100 100px "Anybody Variable"', "GROW"),
    f.load('400 16px "Instrument Sans Variable"', "We help"),
    f.load('500 12px "JetBrains Mono Variable"', "0123"),
    f.load('800 40px "Unbounded Variable"', "Aevinite"),
  ]).catch(() => undefined);
  await f.ready;
}

/** Calls `fn(true/false)` when the element enters / leaves the screen. */
export function whenVisible(el: Element, fn: (on: boolean) => void, margin = "120px") {
  const io = new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting)), { rootMargin: margin });
  io.observe(el);
  return io;
}

/** Runs once after resizes settle, and only when the width changes (phones resize on scroll). */
export function onResize(fn: () => void) {
  let w = innerWidth, t = 0;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = window.setTimeout(() => { if (innerWidth !== w) { w = innerWidth; fn(); } }, 140);
  });
}
