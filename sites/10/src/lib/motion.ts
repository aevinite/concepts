// Headline reveals (word by word, masked rise) and the rotating "Hits for ..." word.
import { $$, esc, reduced, gsap, onceVisible } from "./util";

export function rotator(words: readonly string[]) {
  return `<span class="rot" data-words="${esc(words.join("|"))}"><span class="rot__w">${esc(words[0])}</span></span><span class="sr-only">${esc(words.slice(0, -1).join(", "))} and ${esc(words[words.length - 1])}</span>`;
}

function startRotators() {
  $$(".rot").forEach((r) => {
    const words = (r.dataset.words ?? "").split("|");
    let i = 0;
    r.setAttribute("aria-hidden", "true");
    if (reduced() || words.length < 2) return;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % words.length;
      const old = r.querySelector(".rot__w")!;
      const nw = document.createElement("span");
      nw.className = "rot__w";
      nw.textContent = words[i];
      r.append(nw);
      gsap.fromTo(nw, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "power3.out" });
      gsap.to(old, { yPercent: -100, duration: 0.55, ease: "power3.out", onComplete: () => old.remove() });
    }, 2300);
  });
}

/** Split a heading into words and let them rise into place once it is on screen. */
export function reveal() {
  startRotators();
  if (reduced()) return;
  $$(".h2").forEach((h) => {
    const walk = (n: Node): void => {
      if (n.nodeType === 3) {
        const parts = (n.textContent ?? "").split(/(\s+)/);
        const f = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { f.append(document.createTextNode(p)); return; }
          const m = document.createElement("span"); m.className = "w";
          const i = document.createElement("span"); i.textContent = p;
          m.append(i); f.append(m);
        });
        n.parentNode!.replaceChild(f, n);
      } else Array.from(n.childNodes).forEach(walk);
    };
    Array.from(h.childNodes).forEach(walk);
    const inner = h.querySelectorAll(".w > span");
    gsap.set(inner, { yPercent: 105 });
    onceVisible(h, () => gsap.to(inner, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.045 }), "0px 0px -6% 0px");
  });
  $$(".sec__lede, .rel, .backcover, .ep, .rack, .about, .board, .crate-wrap").forEach((el) => {
    gsap.set(el, { opacity: 0, y: 28 });
    onceVisible(el, () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }), "0px 0px -4% 0px");
  });
}
