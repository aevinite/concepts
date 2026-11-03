// Numbers on paper flags (pataka) strung across the section. They flutter; tap one and it spins
// round its string and counts again.
import { gsap } from "gsap";
import { NUMBERS } from "@shared/content";
import { $, $$, esc, gu, watchView, reduced } from "../lib/utils";
import { sound } from "../lib/sound";


export function numbersHTML() {
  return `<section class="numbers" id="numbers" aria-labelledby="num-h">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow"><span class="gu" lang="gu">${gu(5)}</span><span>Numbers</span></p>
        <h2 class="h2" id="num-h" data-split>Small, true numbers.</h2>
        <p class="lede" data-reveal>Strung up like pataka over a pol street. No client counts, no stars, only what is true today.</p>
      </header>
      <div class="bunting">
        <svg class="bunting-line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 8 Q 500 62 1010 8"/></svg>
        <ul class="flags">
          ${NUMBERS.map((n, i) => `<li class="flag" style="--i:${i}">
            <button type="button" class="flag-in" aria-label="${n.value}: ${esc(n.label)}. Tap to count again">
              <span class="flag-sleeve" aria-hidden="true"></span>
              <b class="flag-v${String(n.value).length > 2 ? " flag-v-long" : ""}" data-v="${n.value}" data-count="${n.count ? 1 : 0}">${n.count ? 0 : n.value}</b>
              <span class="flag-l">${esc(n.label)}</span>
              <span class="flag-gu" lang="gu" aria-hidden="true">${gu(n.value)}</span>
            </button>
          </li>`).join("")}
        </ul>
      </div>
    </div>
  </section>`;
}

export function initNumbers() {
  const flags = $$<HTMLButtonElement>(".flag-in");
  const count = (b: HTMLButtonElement, delay = 0) => {
    const v = $<HTMLElement>(".flag-v", b);
    const target = Number(v.dataset.v);
    if (v.dataset.count !== "1") {
      gsap.fromTo(v, { scale: 1.6, opacity: 0, rotate: -10 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: "back.out(3)", delay });
      return;
    }
    const o = { n: 0 };
    gsap.to(o, { n: target, duration: reduced() ? 0 : 1.1 + target * 0.04, ease: "power2.out", delay, onUpdate: () => { v.textContent = String(Math.round(o.n)); } });
  };
  flags.forEach((b, i) => b.addEventListener("click", () => {
    sound.pluck(i * 2);
    if (!reduced()) gsap.fromTo(b, { rotateX: 0 }, { rotateX: 360, duration: 0.9, ease: "power2.out", transformOrigin: "50% 0%" });
    count(b, 0.15);
  }));
  let done = false;
  watchView($<HTMLElement>(".bunting"), (v) => { if (v && !done) { done = true; flags.forEach((b, i) => count(b, i * 0.15)); } });
}
