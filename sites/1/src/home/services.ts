// Services: five kites tied to a rooftop manja line. Tap one and it climbs into the sky while
// its card unfolds below. A plain list of all five is one click away.
import { gsap } from "gsap";
import { SERVICES } from "@shared/content";
import { $, $$, esc, gu, kiteSVG, watchView, isNarrow, reduced } from "../lib/utils";
import { sound } from "../lib/sound";

const PAIRS: [string, string][] = [
  ["var(--saffron)", "var(--indigo)"],
  ["var(--vermilion)", "var(--paper-kite)"],
  ["var(--leaf)", "var(--gold)"],
  ["var(--indigo)", "var(--amber)"],
  ["var(--gold)", "var(--vermilion)"],
];

const card = (i: number) => {
  const s = SERVICES[i];
  return `<p class="svc-n"><span>${String(i + 1).padStart(2, "0")}</span><span class="gu" lang="gu">${gu(i + 1)}</span><span class="svc-tag">${esc(s.tag)}</span></p>
    <h3 class="svc-title">${esc(s.title)}</h3>
    <p class="svc-desc">${esc(s.desc)}</p>
    <ul class="svc-items" aria-label="What this covers">${s.items.map((it, j) => `<li style="--j:${j}">${esc(it)}</li>`).join("")}</ul>`;
};

export function servicesHTML() {
  return `<section class="services" id="services" aria-labelledby="svc-h">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow"><span class="gu" lang="gu">${gu(2)}</span><span>Services</span></p>
        <h2 class="h2" id="svc-h" data-split>Five kites on one string.</h2>
        <p class="lede" data-reveal>Five things we build for you, tied to the same manja. Tap a kite to fly it and read what it carries.</p>
      </header>
      <div class="manja" data-reveal>
        <svg class="manja-svg" aria-hidden="true"><path class="manja-line"/><g class="manja-threads"></g><g class="manja-posts"></g></svg>
        ${SERVICES.map((s, i) => `<button type="button" class="skite" data-i="${i}" aria-pressed="false" aria-controls="svc-card" style="--k-a:${PAIRS[i][0]};--k-b:${PAIRS[i][1]}">${kiteSVG()}<span class="skite-lamp" aria-hidden="true"></span><span class="sr-only">${esc(s.title)}</span></button>
          <span class="skite-tag" data-i="${i}" aria-hidden="true"><b>${gu(i + 1)}</b><span>${esc(s.title)}</span></span>`).join("")}
      </div>
      <article class="svc-card kite-paper" id="svc-card" aria-live="polite">${card(0)}</article>
      <details class="svc-all" data-reveal>
        <summary>Just show me all five</summary>
        <ol>${SERVICES.map((s) => `<li><b>${esc(s.title)}</b> <span>${esc(s.desc)}</span> <em>${s.items.map(esc).join(", ")}</em></li>`).join("")}</ol>
      </details>
    </div>
  </section>`;
}

export function initServices() {
  const box = $<HTMLElement>(".manja");
  const svg = $<SVGSVGElement>(".manja-svg", box);
  const line = $<SVGPathElement>(".manja-line", svg);
  const threads = $<SVGGElement>(".manja-threads", svg);
  const posts = $<SVGGElement>(".manja-posts", svg);
  const kites = $$<HTMLButtonElement>(".skite", box);
  const tags = $$<HTMLElement>(".skite-tag", box);
  const cardEl = $<HTMLElement>("#svc-card");
  const lift = kites.map(() => ({ v: 0 }));
  threads.innerHTML = kites.map(() => `<path/>`).join("");
  const threadEls = $$<SVGPathElement>("path", threads);
  let W = 0, H = 0, ks = 60, sel = -1, t = 0, raf = 0, last = 0;

  const stringY = (x: number) => {
    const u = (x - W * 0.02) / (W * 0.96), y0 = H * 0.8 - 6, yc = H * 0.8 + 52;
    return (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * yc + u * u * y0;
  };
  const tieX = (i: number) => W * (0.12 + i * 0.19);

  const layout = () => {
    W = box.clientWidth; H = box.clientHeight;
    ks = isNarrow() ? 46 : 66;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const x0 = W * 0.02, x1 = W * 0.98;
    line.setAttribute("d", `M${x0} ${H * 0.8 - 6} Q ${W / 2} ${H * 0.8 + 52} ${x1} ${H * 0.8 - 6}`);
    posts.innerHTML = [x0, x1].map((x) => `<rect x="${x - 2}" y="${H * 0.8 - 16}" width="4" height="${H * 0.2 + 16}" rx="1"/><circle cx="${x}" cy="${H * 0.8 - 8}" r="4"/>`).join("");
    tags.forEach((tg, i) => { tg.style.left = `${tieX(i)}px`; tg.style.top = `${stringY(tieX(i)) + 10}px`; });
    place();
  };

  const place = () => {
    kites.forEach((k, i) => {
      const tx = tieX(i), ty = stringY(tx);
      const rest = isNarrow() ? 58 : 76, high = H * 0.8 - ks * 0.6;
      const L = lift[i].v;
      const bob = reduced() ? 0 : 1;
      const x = tx + Math.sin(t * 1.3 + i * 1.7) * (3 + L * 10) * bob;
      const y = ty - rest - (high - rest) * L + Math.sin(t * 1.8 + i) * (2.5 + L * 5) * bob;
      const r = Math.sin(t * 1.1 + i * 2) * (5 + L * 8) * bob;
      k.style.transform = `translate(${x - ks / 2}px, ${y - ks * 0.55}px) rotate(${r}deg)`;
      k.style.width = `${ks}px`;
      const mx = (tx + x) / 2 + 8 + L * 14, my = (ty + y) / 2 + 6;
      threadEls[i].setAttribute("d", `M${tx} ${ty} Q ${mx} ${my} ${x} ${y + ks * 0.18}`);
    });
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    t += Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    place();
  };

  const select = (i: number, quiet = false) => {
    if (i === sel) {
      gsap.fromTo(lift[i], { v: lift[i].v }, { v: lift[i].v - 0.12, yoyo: true, repeat: 1, duration: 0.18 });
      return;
    }
    const prev = sel;
    sel = i;
    kites.forEach((k, j) => k.setAttribute("aria-pressed", String(j === i)));
    tags.forEach((tg, j) => tg.classList.toggle("on", j === i));
    if (prev >= 0) gsap.to(lift[prev], { v: 0, duration: 1.1, ease: "elastic.out(1,.55)" });
    gsap.to(lift[i], { v: 1, duration: reduced() ? 0.01 : 1.3, ease: "back.out(1.4)" });
    if (!quiet) sound.whoosh();
    cardEl.style.setProperty("--k-a", PAIRS[i][0]);
    cardEl.style.setProperty("--k-b", PAIRS[i][1]);
    const swap = () => { cardEl.innerHTML = card(i); };
    if (reduced() || prev < 0) { swap(); return; }
    gsap.timeline()
      .to(cardEl, { rotateX: 70, opacity: 0, transformOrigin: "50% 0%", duration: 0.22, ease: "power2.in" })
      .add(swap)
      .fromTo(cardEl, { rotateX: -60, opacity: 0 }, { rotateX: 0, opacity: 1, duration: 0.7, ease: "back.out(1.5)" })
      .from(() => $$(".svc-items li", cardEl), { y: 14, opacity: 0, stagger: 0.05, duration: 0.4, ease: "back.out(2)" }, "-=0.45");
  };

  kites.forEach((k, i) => k.addEventListener("click", () => select(i)));
  new ResizeObserver(layout).observe(box);
  layout();
  let first = true;
  watchView(box, (v) => {
    cancelAnimationFrame(raf);
    if (v) {
      last = 0;
      raf = requestAnimationFrame(frame);
      if (first) { first = false; gsap.delayedCall(0.4, () => select(0, true)); }
    }
  });
}
