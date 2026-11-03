// Comic motion: panels pop in, bubbles letter themselves, SFX slam, any panel answers a tap with
// POW / ZAP / BAM and a tiny shake (rate limited), numbers roll.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $$, reduced, rng, watchView } from "./util";
import { burstPath } from "./art";
import { sfx } from "./sound";

gsap.registerPlugin(ScrollTrigger);

/** Split bubble text into per-letter spans (screen readers get the plain text once). */
export function prepBubbles(root: ParentNode = document) {
  for (const b of $$(".bubble-text, .cap-type", root)) {
    if (b.dataset.split) continue;
    b.dataset.split = "1";
    const text = b.textContent ?? "";
    const words = text.split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? " " : `<span class="w">${[...w].map((c) => `<span class="ch">${c.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`).join("")}</span>`)).join("");
    b.innerHTML = `<span class="sr">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span><span aria-hidden="true" class="typed">${words}</span>`;
  }
}

function typeIn(el: HTMLElement, delay = 0) {
  const chars = $$(".ch", el);
  if (!chars.length || reduced()) return;
  gsap.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: Math.min(0.03, 1.1 / chars.length), delay, ease: "none" });
}

const SFX_SOUND: Record<string, () => void> = { ding: sfx.ding, chunk: sfx.chunk, beep: sfx.beep, buzz: sfx.buzz, pow: sfx.pow, swish: sfx.swish };

export function slam(el: HTMLElement, delay = 0) {
  const rot = Number(el.dataset.rot ?? -6);
  if (reduced()) { gsap.set(el, { opacity: 1 }); return; }
  gsap.fromTo(el, { scale: 2.6, opacity: 0, rotate: rot - 14 }, { scale: 1, opacity: 1, rotate: rot, duration: 0.55, delay, ease: "back.out(2.6)", onStart: () => { const s = el.dataset.sfx; if (s) SFX_SOUND[s]?.(); } });
}

/** Panels pop in as they reach the screen; their bubbles type and SFX slam after them. */
export function revealPanels(root: ParentNode = document) {
  prepBubbles(root);
  const panels = $$(".panel, .pop", root).filter((p) => !p.dataset.revealed);
  // CSS loops inside a panel (gears, buzzing phones, the infinity sign) only run while it is on screen
  panels.filter((p) => p.classList.contains("panel")).forEach((p) => watchView(p, (v) => p.classList.toggle("run", v)));
  panels.forEach((p) => (p.dataset.revealed = "1"));
  const rr = rng(5);
  if (reduced()) {
    ScrollTrigger.batch(panels, { start: "top 92%", once: true, onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4 }) });
    return;
  }
  gsap.set(panels, { opacity: 0 });
  ScrollTrigger.batch(panels, {
    start: "top 88%",
    once: true,
    onEnter: (els) => {
      els.forEach((el, i) => {
        const d = i * 0.12;
        gsap.fromTo(el, { opacity: 0, scale: 0.86, rotate: (rr() - 0.5) * 5, y: 36 }, { opacity: 1, scale: 1, rotate: 0, y: 0, duration: 0.7, delay: d, ease: "back.out(1.7)", clearProps: "transform" });
        $$(".sfx", el).forEach((s, j) => slam(s, d + 0.35 + j * 0.25));
        $$(".bubble-text, .cap-type", el).forEach((b, j) => typeIn(b, d + 0.45 + j * 0.5));
      });
    },
  });
}

/* ---------- POW ---------- */
const WORDS = ["POW!", "ZAP!", "BAM!", "WHAM!", "KAPOW!", "BOOM!", "ZOK!", "BIFF!"];
let lastPow = 0, lastShake = 0, wordI = 0;

export function initPow(root: ParentNode = document) {
  root.addEventListener("click", (e) => {
    const ev = e as MouseEvent;
    const t = ev.target as HTMLElement;
    const panel = t.closest<HTMLElement>(".panel, .pow-zone");
    if (!panel || t.closest("a, button, video, input, summary, details, .no-pow, .dev")) {
      if (panel && t.closest(".dev")) return; // devices are for looking at, not punching
      return;
    }
    const sfxWord = t.closest<HTMLElement>(".sfx");
    if (sfxWord) { slam(sfxWord); return; }
    const now = performance.now();
    if (now - lastPow < 280) return;
    lastPow = now;
    const r = panel.getBoundingClientRect();
    const x = ev.clientX ? ev.clientX - r.left : r.width / 2, y = ev.clientY ? ev.clientY - r.top : r.height / 2;
    const word = WORDS[wordI++ % WORDS.length];
    const b = document.createElement("span");
    b.className = "powburst";
    b.setAttribute("aria-hidden", "true");
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.innerHTML = `<svg viewBox="-60 -60 120 120"><path d="${burstPath(0, 0, 34, 58, 13, wordI * 7)}"/></svg><b>${word}</b>`;
    panel.append(b);
    sfx.pow();
    if (reduced()) { gsap.fromTo(b, { opacity: 1 }, { opacity: 0, duration: 0.8, delay: 0.3, onComplete: () => b.remove() }); return; }
    gsap.timeline({ onComplete: () => b.remove() })
      .fromTo(b, { scale: 0.2, rotate: -30 + Math.random() * 20 }, { scale: 1, rotate: -8 + Math.random() * 16, duration: 0.35, ease: "back.out(3)" })
      .to(b, { scale: 1.25, opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.35");
    if (now - lastShake > 900) {
      lastShake = now;
      gsap.fromTo(panel, { x: 0, y: 0 }, { keyframes: [{ x: -7, y: 3 }, { x: 6, y: -4 }, { x: -4, y: 2 }, { x: 3, y: -1 }, { x: 0, y: 0 }], duration: 0.32, ease: "none", clearProps: "x,y" });
    }
  });
}

/* ---------- numbers roll ---------- */
export function countUp(root: ParentNode = document) {
  for (const el of $$("[data-count]", root)) {
    const to = Number(el.dataset.count);
    if (reduced()) { el.textContent = String(to); continue; }
    el.textContent = "0";
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.4, ease: "power3.out", onUpdate: () => (el.textContent = String(Math.round(o.v))) }); },
    });
  }
}
