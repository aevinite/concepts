// Small helpers shared by every page of concept 6 (The Pass).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, Flip);
export { gsap, ScrollTrigger, Draggable, Flip };

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const narrow = () => innerWidth < 760;
export const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** The visitor's own date and time, printed on tickets the way a till prints them. */
export function stamp() {
  const d = new Date();
  return { date: `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** Run `on` while the element is on screen and `off` when it leaves (and when the tab hides). */
export function whileVisible(el: Element, on: () => void, off: () => void, threshold = 0.15) {
  let seen = false;
  const io = new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen && !document.hidden) on();
    else off();
  }, { threshold });
  io.observe(el);
  document.addEventListener("visibilitychange", () => (document.hidden ? off() : seen && on()));
  return () => io.disconnect();
}

/** Fire once when the element first comes into view. */
export function once(el: Element, cb: () => void, rootMargin = "0px 0px -15% 0px") {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { io.disconnect(); cb(); }
  }, { rootMargin });
  io.observe(el);
}

/** A deterministic barcode (Code-128 look, not a real code) for a ticket number. */
export function barcode(seed: number, w = 220, h = 34) {
  let x = 0, s = seed * 9301 + 49297, bars = "";
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (x < w - 4) {
    const bw = 1 + Math.floor(rnd() * 3.2);
    if (rnd() > 0.38) bars += `<rect x="${x}" width="${bw}" height="${h}"/>`;
    x += bw + 1 + Math.floor(rnd() * 2);
  }
  return `<svg class="barcode" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

/** Split a string into odometer reels (each digit is a column of 0-9 that rolls). */
export function reels(value: number | string) {
  return String(value).split("").map((ch) =>
    /\d/.test(ch)
      ? `<span class="reel" data-d="${ch}"><span class="reel__strip">${"0123456789".split("").map((d) => `<span>${d}</span>`).join("")}</span></span>`
      : `<span>${ch}</span>`,
  ).join("");
}

export function rollReels(host: Element, delay = 0) {
  $$(".reel", host).forEach((r, i) => {
    const d = Number(r.dataset.d);
    const strip = r.firstElementChild as HTMLElement;
    if (reduced()) { strip.style.transform = `translateY(${-d * 10}%)`; return; }
    gsap.fromTo(strip, { yPercent: 0 }, { yPercent: -d * 10, duration: 1.1 + i * 0.18, delay, ease: "power3.out" });
  });
}

/** Set a reel group to a new number at once, rolling only the digits that changed. */
export function setReels(host: HTMLElement, value: number, width: number) {
  const s = pad(value, width);
  if (host.childElementCount !== width) host.innerHTML = reels(s);
  $$(".reel", host).forEach((r, i) => {
    const d = Number(s[i]);
    r.dataset.d = String(d);
    gsap.to(r.firstElementChild, { yPercent: -d * 10, duration: reduced() ? 0 : 0.55, ease: "back.out(1.6)" });
  });
}
