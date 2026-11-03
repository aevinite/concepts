// The work viewer (a print brought up off the line) and the easter eggs.
import { gsap } from "gsap";
import { WORK } from "@shared/content";
import { prefersReducedMotion } from "@shared/theme";
import { bath } from "./bath";
import { chord } from "./sound";

export function workDialog() {
  const d = document.createElement("dialog");
  d.className = "work-modal";
  d.setAttribute("aria-labelledby", "wm-t");
  document.body.append(d);
  const close = () => {
    d.querySelectorAll("video").forEach((v) => v.pause());
    if (prefersReducedMotion()) return d.close();
    gsap.to(d.querySelector(".wm-box"), { y: 30, opacity: 0, duration: 0.22, onComplete: () => d.close() });
  };
  d.addEventListener("click", (e) => { if (e.target === d) close(); });
  d.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  document.querySelectorAll<HTMLButtonElement>("[data-work]").forEach((b) => b.addEventListener("click", () => {
    const p = WORK.find((x) => x.id === b.dataset.work)!;
    const vid = "video" in p ? `<figure class="wm-vid"><video controls playsinline preload="none" poster="${p.images[0]}" src="${p.video}" width="1600" height="900"></video><figcaption>The scroll story, recorded.</figcaption></figure>` : "";
    d.innerHTML = `
      <div class="wm-box" data-solid>
        <button type="button" class="wm-x" aria-label="Close">Close</button>
        <p class="eyebrow">${p.category}</p>
        <h3 id="wm-t">${p.title}</h3>
        <p class="wm-d">${p.desc}</p>
        <p class="wm-tech">${p.tech.map((t) => `<span>${t}</span>`).join("")}</p>
        ${p.link ? `<p><a class="btn btn-ink" href="${p.link}" ${p.link.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${p.link.startsWith("http") ? "Open the live site" : "See the product page"}</a></p>` : ""}
        ${vid}
        <div class="wm-imgs">${p.images.map((src, i) => `<img src="${src}" alt="${p.title}, screenshot ${i + 1}" loading="lazy" decoding="async" width="1600" height="${src.includes("aevidine-3d") ? 732 : 900}">`).join("")}</div>
      </div>`;
    d.querySelector(".wm-x")!.addEventListener("click", close);
    d.showModal();
    if (!prefersReducedMotion()) gsap.fromTo(d.querySelector(".wm-box"), { y: 60, opacity: 0, rotate: -1.2 }, { y: 0, opacity: 1, rotate: 0, duration: 0.6, ease: "expo.out" });
  }));
}

/** Type "ebru" or "tulip" anywhere: the bath makes the classic tulip. */
export function eggs() {
  let typed = "";
  addEventListener("keydown", (e) => {
    if ((e.target as Element).closest("input,textarea")) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed.endsWith("ebru") || typed.endsWith("tulip")) {
      scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      setTimeout(() => bath.tulip(innerWidth * 0.5, innerHeight * 0.55), 400);
      toast("You found the tulip, the flower every Ebru marbler learns.");
      chord();
    }
  });
}

export function toast(msg: string) {
  const t = document.createElement("p");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.append(t);
  gsap.fromTo(t, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
  setTimeout(() => gsap.to(t, { opacity: 0, y: 10, duration: 0.4, onComplete: () => t.remove() }), 3600);
}
