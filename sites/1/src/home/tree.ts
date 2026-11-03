// Work: every Uttarayan the neem trees collect cut kites. Ours holds five, each with a project
// screenshot on its sail. Shake the tree (tap it, or drag across it) and the next kite drops into
// your hands; tap a kite to pull that one down. The project list above is the plain way in.
import { gsap } from "gsap";
import { WORK } from "@shared/content";
import { $, $$, esc, gu, rng, watchView, reduced } from "../lib/utils";
import { sound } from "../lib/sound";

const SPOTS = [
  { x: 148, y: 300, r: -18 },
  { x: 236, y: 150, r: 12 },
  { x: 392, y: 128, r: -8 },
  { x: 474, y: 282, r: 20 },
  { x: 320, y: 318, r: -4 },
];
const DROP = [{ x: 150, y: 520, r: -70 }, { x: 445, y: 525, r: 64 }];
const COLS = ["#d6432b", "#2b3990", "#3d8a4e", "#eb960f", "#c99a2c"];

function leaves(seed: number, clumps: [number, number, number][], per: number) {
  const r = rng(seed);
  let s = "";
  for (const [cx, cy, rad] of clumps) {
    for (let i = 0; i < per; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8;
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(7 + r() * 4).toFixed(1)}" ry="${(2.6 + r() * 1.2).toFixed(1)}" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" class="l${1 + Math.floor(r() * 4)}"/>`;
    }
  }
  return s;
}

const media = (i: number) => {
  const w = WORK[i];
  return "video" in w && w.video
    ? `<video class="work-main" src="${w.video}" poster="${w.images[0]}" muted playsinline loop preload="none" aria-label="${esc(w.title)}: a short screen recording of the scroll story" width="1600" height="900"></video>`
    : `<img class="work-main" src="${w.images[0]}" alt="${esc(w.title)}: screenshot 1" width="1600" height="900">`;
};

const card = (i: number) => {
  const w = WORK[i];
  const ext = w.link.startsWith("http");
  return `<p class="work-cat"><span class="gu" lang="gu">${gu(i + 1)}</span>${esc(w.category)}</p>
    <h3 class="work-title">${esc(w.title)}</h3>
    <p class="work-desc">${esc(w.desc)}</p>
    <ul class="work-tech" aria-label="Built with">${w.tech.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    <div class="work-media">${media(i)}</div>
    ${w.images.length > 1 ? `<div class="work-thumbs" role="group" aria-label="More screenshots">${w.images.map((src, j) => `<button type="button" aria-label="Screenshot ${j + 1}" aria-pressed="${j === 0}" data-src="${src}"><img src="${src}" alt="" width="1600" height="900" loading="lazy"></button>`).join("")}</div>` : ""}
    ${w.link ? `<a class="btn btn-line work-link" href="${w.link}"${ext ? ` target="_blank" rel="noopener"` : ""}><span>${ext ? "Visit the live site" : "See Aevidine"}</span></a>` : ""}`;
};

function fairyLights() {
  const strands: [number, number, number, number, number, number][] = [
    [96, 268, 210, 330, 318, 214], [318, 214, 410, 300, 520, 262], [168, 170, 300, 240, 452, 150], [236, 110, 310, 160, 392, 96],
  ];
  let wires = "", bulbs = "", k = 0;
  for (const [x0, y0, cx, cy, x1, y1] of strands) {
    wires += `<path d="M${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}"/>`;
    for (let i = 1; i < 12; i++) {
      const t = i / 12, u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      bulbs += `<circle cx="${x.toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="3" style="--k:${k++ % 7}"/>`;
    }
  }
  const lamps = [[214, 352], [404, 356], [500, 312], [130, 316]].map(([x, y], i) => `<g class="tr-lamp" style="--i:${i}"><line x1="${x}" y1="${y - 26}" x2="${x}" y2="${y - 10}"/><circle cx="${x}" cy="${y}" r="26" class="glow"/><rect x="${x - 7}" y="${y - 10}" width="14" height="19" rx="5"/></g>`).join("");
  return `<g class="tr-lights night-anim" aria-hidden="true"><defs><radialGradient id="trGlow"><stop offset="0" stop-color="#ffb850" stop-opacity=".6"/><stop offset="1" stop-color="#ffb850" stop-opacity="0"/></radialGradient></defs><g class="tr-wires">${wires}</g><g class="tr-bulbs">${bulbs}</g>${lamps}</g>`;
}

export function workHTML() {
  const back: [number, number, number][] = [[140, 268, 84], [224, 180, 90], [318, 124, 92], [412, 162, 88], [486, 250, 82], [300, 236, 104], [206, 318, 70], [414, 320, 72], [96, 320, 52], [520, 326, 50], [360, 70, 50], [250, 96, 46]];
  const front: [number, number, number][] = [[112, 236, 36], [270, 106, 36], [458, 210, 34], [356, 262, 30], [190, 190, 28], [520, 300, 26], [92, 300, 24]];
  return `<section class="work" id="work" aria-labelledby="work-h">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow"><span class="gu" lang="gu">${gu(4)}</span><span>Work</span></p>
        <h2 class="h2" id="work-h" data-split>Caught in our neem tree.</h2>
        <p class="lede" data-reveal>After Uttarayan the neem trees are full of kites. Ours holds five pieces of work. Shake the tree, or pick one from the list.</p>
      </header>
      <div class="work-list" role="group" aria-label="All five projects" data-reveal>
        ${WORK.map((w, i) => `<button type="button" class="wl" data-i="${i}" aria-pressed="false" style="--c:${COLS[i]}"><span class="wl-dot" aria-hidden="true"></span>${esc(w.title)}</button>`).join("")}
      </div>
      <div class="work-grid">
        <div class="tree-box" data-reveal>
          <svg class="tree" viewBox="0 0 600 600" aria-hidden="true">
            <defs>${SPOTS.map((_, i) => `<clipPath id="kc${i}"><path d="M0 -46 L45 -3 L0 47 L-45 -3Z"/></clipPath>`).join("")}</defs>
            <path class="tr-wall" d="M0 560 H600 V600 H0Z"/>
            <path class="tr-wall-cap" d="M0 556 H600 V564 H0Z"/>
            <g class="crown">
              <path class="tr-trunk" d="M278 600 C 284 540 290 486 282 436 C 274 388 244 344 196 312 L 208 300 C 252 326 284 360 296 398 C 298 352 296 300 306 244 L 324 248 C 316 300 314 352 318 400 C 340 356 384 322 428 298 L 436 312 C 394 338 352 376 334 432 C 326 488 332 548 344 600 Z"/>
              <path class="tr-branch" d="M300 330 C 270 260 240 220 232 180 M310 300 C 330 240 360 200 388 150 M220 312 C 190 300 170 290 150 276 M410 312 C 440 300 460 290 478 262 M316 260 C 318 220 316 170 318 128"/>
              <g class="tr-back">${leaves(3, back, 78)}</g>
              ${SPOTS.map((s, i) => `<g class="tkite" data-i="${i}" transform="translate(${s.x} ${s.y}) rotate(${s.r})"><g class="tk-in">
                <path class="tk-thread" d="M0 30 C 14 48 -12 60 8 74 C 22 84 4 96 18 104"/>
                <path d="M0 42 L-11 62 L11 62Z" fill="${COLS[i]}"/>
                <path d="M0 -46 L45 -3 L0 47 L-45 -3Z" fill="${COLS[i]}"/>
                <image href="${WORK[i].images[0]}" x="-46" y="-48" width="92" height="96" preserveAspectRatio="xMidYMid slice" clip-path="url(#kc${i})"/>
                <path d="M0 -46 L45 -3 L0 47 L-45 -3Z" fill="none" stroke="${COLS[i]}" stroke-width="5"/>
                <path d="M0 -46 L0 47 M-45 -3 Q0 -36 45 -3" fill="none" stroke="rgba(60,35,10,.6)" stroke-width="1.6"/>
              </g></g>`).join("")}
              <g class="tr-front">${leaves(9, front, 26)}</g>
              ${fairyLights()}
            </g>
            <g class="tr-fall"></g>
          </svg>
          <button type="button" class="btn btn-line shake-btn"><span>Shake the tree</span></button>
        </div>
        <article class="work-card kite-paper" aria-live="polite">${card(0)}</article>
      </div>
    </div>
  </section>`;
}

export function initWork() {
  const svg = $<SVGSVGElement>(".tree");
  const crown = $<SVGGElement>(".crown", svg);
  const fall = $<SVGGElement>(".tr-fall", svg);
  const kites = $$<SVGGElement>(".tkite", svg);
  const listBtns = $$<HTMLButtonElement>(".wl");
  const cardEl = $<HTMLElement>(".work-card");
  let sel = -1, next = 0, slot = 0, lastShake = 0;

  const wireCard = () => {
    const main = $<HTMLImageElement | HTMLVideoElement>(".work-main", cardEl);
    if (main instanceof HTMLVideoElement) {
      watchView(main, (v) => { if (v && !reduced()) main.play().catch(() => {}); else main.pause(); });
    }
    $$<HTMLButtonElement>(".work-thumbs button", cardEl).forEach((b, j, all) => b.addEventListener("click", () => {
      all.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      if (main instanceof HTMLImageElement) {
        gsap.to(main, { opacity: 0, duration: 0.15, onComplete: () => { main.src = b.dataset.src!; main.alt = `${main.alt.split(":")[0]}: screenshot ${j + 1}`; gsap.to(main, { opacity: 1, duration: 0.3 }); } });
      }
      sound.pluck(j);
    }));
  };

  const select = (i: number) => {
    if (i === sel) return;
    const prev = sel;
    sel = i;
    next = (i + 1) % WORK.length;
    listBtns.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    if (prev >= 0) {
      const s = SPOTS[prev];
      gsap.to(kites[prev], { attr: { transform: `translate(${s.x} ${s.y}) rotate(${s.r})` }, duration: reduced() ? 0 : 1.1, ease: "power3.inOut" });
    }
    const d = DROP[slot++ % 2];
    const k = kites[i];
    const s = SPOTS[i];
    if (reduced()) k.setAttribute("transform", `translate(${d.x} ${d.y}) rotate(${d.r})`);
    else {
      const o = { x: s.x, y: s.y, r: s.r };
      gsap.timeline()
        .to(o, { y: s.y - 18, r: s.r + 20, duration: 0.18, ease: "power2.out", onUpdate: () => k.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.r})`) })
        .to(o, { x: d.x, y: d.y, duration: 1.1, ease: "power1.in", onUpdate: () => k.setAttribute("transform", `translate(${o.x + Math.sin(o.y / 26) * 18} ${o.y}) rotate(${o.r})`) })
        .to(o, { r: d.r + 360, duration: 1.1, ease: "power1.out" }, "<")
        .to(o, { r: d.r, duration: 0.01 });
    }
    svg.insertBefore(k, fall);
    const swap = () => { cardEl.innerHTML = card(i); wireCard(); };
    if (prev < 0 || reduced()) { swap(); return; }
    gsap.timeline()
      .to(cardEl, { y: 12, opacity: 0, rotate: -1.5, duration: 0.2, ease: "power2.in" })
      .add(swap)
      .fromTo(cardEl, { y: -30, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: 0, duration: 0.7, ease: "back.out(1.5)" });
  };

  const shake = (strength = 1) => {
    const now = performance.now();
    if (now - lastShake < 650) return;
    lastShake = now;
    sound.rustle();
    if (!reduced()) {
      gsap.fromTo(crown, { rotate: 0 }, { keyframes: [{ rotate: -3.5 * strength }, { rotate: 3 * strength }, { rotate: -2 * strength }, { rotate: 1 * strength }, { rotate: 0 }], duration: 0.9, ease: "sine.inOut", svgOrigin: "300 600" });
      const r = Math.random;
      for (let i = 0; i < 9; i++) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        const x = 130 + r() * 360, y = 140 + r() * 200;
        el.setAttribute("cx", "0"); el.setAttribute("cy", "0"); el.setAttribute("rx", "7"); el.setAttribute("ry", "2.8"); el.setAttribute("class", `l${1 + (i % 4)}`);
        fall.append(el);
        gsap.fromTo(el, { x, y, rotate: r() * 180 }, { x: x + (r() - 0.5) * 140, y: 560 + r() * 30, rotate: `+=${300 + r() * 400}`, duration: 1.6 + r() * 1.2, ease: "sine.in", onComplete: () => el.remove() });
      }
    }
    gsap.delayedCall(0.25, () => select(next === sel ? (next + 1) % WORK.length : next));
  };

  kites.forEach((k, i) => k.addEventListener("click", (e) => { e.stopPropagation(); select(i); }));
  listBtns.forEach((b, i) => b.addEventListener("click", () => select(i)));
  $<HTMLButtonElement>(".shake-btn").addEventListener("click", () => shake(1.2));
  let downX = 0, dragged = 0, down = false;
  svg.addEventListener("pointerdown", (e) => { down = true; downX = e.clientX; dragged = 0; });
  svg.addEventListener("pointermove", (e) => {
    if (!down) return;
    dragged = Math.max(dragged, Math.abs(e.clientX - downX));
    if (Math.abs(e.clientX - downX) > 40) { shake(Math.min(1.8, Math.abs(e.clientX - downX) / 60)); downX = e.clientX; }
  });
  svg.addEventListener("pointerup", (e) => {
    down = false;
    if (dragged < 8 && !(e.target as Element).closest(".tkite")) shake(1);
  });
  svg.addEventListener("pointercancel", () => { down = false; });

  let first = true;
  watchView(svg, (v) => { if (v && first) { first = false; gsap.delayedCall(0.5, () => select(0)); } });
  wireCard();
}
