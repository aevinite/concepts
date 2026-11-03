// Things that exist only in the night world: lantern chains beside the section headings and
// skies of rising tukkal lanterns. They are plain DOM + CSS; each group only animates while it
// is on screen (the "run" class), so off-screen night costs nothing.
import { $$, kiteSVG } from "./utils";

const chain = (i: number) => `<div class="night-anim night-chain" aria-hidden="true" style="--d:${(i * -1.7).toFixed(1)}s">
  <span class="nc-kite">${kiteSVG("", "#ffd27a", "#f2662f")}</span><span class="nc-string"></span>
  ${[0, 1, 2, 3].map((j) => `<i style="--j:${j}"></i>`).join("")}
</div>`;

/** A sky of lanterns rising, for the contact section and the footer. */
export const lanternSky = (n: number, cls = "") => `<div class="night-anim sky-lanterns ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, i) => {
  const x = (i * 61.8) % 100, s = 0.6 + ((i * 37) % 10) / 14, d = -((i * 2.3) % 14);
  return `<i style="left:${x.toFixed(1)}%;--s:${s.toFixed(2)};--d:${d.toFixed(1)}s;--t:${(11 + (i % 5) * 1.6).toFixed(1)}s;--x:${(((i * 13) % 9) - 4) * 8}px"></i>`;
}).join("")}</div>`;

export function initNight() {
  $$<HTMLElement>(".sec-head").forEach((h, i) => { if (!h.closest(".contact")) h.insertAdjacentHTML("beforeend", chain(i)); });
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("run", e.isIntersecting)), { rootMargin: "60px" });
  $$<HTMLElement>(".night-anim").forEach((el) => io.observe(el));
}
