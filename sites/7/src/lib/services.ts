// SERVICES. Light: an exploded-view assembly drawing (isometric parts with numbered balloons)
// that assembles itself as you scroll, beside its parts list. Dark: a bank of five drop targets;
// knock one down and its lit insert switches on. Either way the full list is always readable.
import { SERVICES } from "@shared/content";
import { $, $$, esc, gsap, ScrollTrigger, reduced, svgNS } from "./core";
import { lamps } from "./chrome";
import { sfx } from "./sound";

export const SVC_SHORT = ["Web", "Software", "Auto + AI", "3D", "Cloud"];

type P3 = [number, number, number];
const iso = ([x, y, z]: P3) => [(x - y) * 0.866, (x + y) * 0.5 - z] as const;
const poly = (pts: P3[]) => pts.map((p) => iso(p).map((v) => v.toFixed(1)).join(",")).join(" ");

function boxFaces(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  return `
    <polygon class="f-top" points="${poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])}"/>
    <polygon class="f-x" points="${poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]])}"/>
    <polygon class="f-y" points="${poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])}"/>`;
}

function partSVG(i: number) {
  // i = SERVICES index. Returns [svg, anchor point (right side), level]
  switch (i) {
    case 4: { // Cloud & growth systems: the base plate with four bolts
      let s = boxFaces(-100, 100, -100, 100, 0, 20);
      for (const [x, y] of [[-72, -72], [72, -72], [72, 72], [-72, 72]]) {
        const c = iso([x, y, 20]);
        s += `<ellipse class="bolt" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" rx="8" ry="4.6"/>`;
      }
      return { s, a: iso([100, -100, 10]), level: 0 };
    }
    case 1: { // Custom software: a block with a keyed top
      let s = boxFaces(-68, 68, -68, 68, 20, 58);
      for (let k = -1; k <= 1; k++) {
        s += `<polyline class="gl" points="${poly([[-68, k * 30, 58], [68, k * 30, 58]])}"/>`;
        s += `<polyline class="gl" points="${poly([[k * 30, -68, 58], [k * 30, 68, 58]])}"/>`;
      }
      return { s, a: iso([68, -68, 40]), level: 1 };
    }
    case 2: { // Automation & AI: a knurled drive wheel
      const r = 56, z0 = 58, z1 = 86, pts = (z: number, from = 0, to = Math.PI * 2, n = 48) =>
        Array.from({ length: n + 1 }, (_, k) => { const t = from + ((to - from) * k) / n; return [r * Math.cos(t), r * Math.sin(t), z] as P3; });
      const front = [...pts(z0, -Math.PI / 4, (Math.PI * 3) / 4), ...pts(z1, -Math.PI / 4, (Math.PI * 3) / 4).reverse()];
      let s = `<polygon class="f-x" points="${poly(front)}"/>`;
      for (let k = 0; k < 14; k++) {
        const t = -Math.PI / 4 + ((k + 0.5) / 14) * Math.PI;
        s += `<polyline class="gl" points="${poly([[r * Math.cos(t), r * Math.sin(t), z0], [r * Math.cos(t), r * Math.sin(t), z1]])}"/>`;
      }
      s += `<polygon class="f-top" points="${poly(pts(z1))}"/>`;
      s += `<polygon class="hub" points="${poly(Array.from({ length: 25 }, (_, k) => [16 * Math.cos((k / 24) * Math.PI * 2), 16 * Math.sin((k / 24) * Math.PI * 2), z1] as P3))}"/>`;
      return { s, a: iso([r * 0.7, -r * 0.7, 72]), level: 2 };
    }
    case 0: { // Websites & apps: a standing screen panel
      let s = boxFaces(-62, 62, -6, 6, 86, 164);
      s += `<polygon class="screen" points="${poly([[-52, 6, 96], [52, 6, 96], [52, 6, 154], [-52, 6, 154]])}"/>`;
      s += `<polyline class="gl" points="${poly([[-44, 6, 140], [10, 6, 140]])}"/><polyline class="gl" points="${poly([[-44, 6, 128], [30, 6, 128]])}"/>`;
      return { s, a: iso([62, -6, 130]), level: 3 };
    }
    default: { // 3D & immersive web: a floating octahedron
      const c = 210, r = 38;
      const T: P3 = [0, 0, c + r], B: P3 = [0, 0, c - r], X: P3 = [r, 0, c], Y: P3 = [0, r, c], mX: P3 = [-r, 0, c], mY: P3 = [0, -r, c];
      const s = `
        <polygon class="f-top" points="${poly([T, X, mY])}"/>
        <polygon class="f-top" points="${poly([T, mX, Y])}"/>
        <polygon class="f-y" points="${poly([T, Y, X])}"/>
        <polygon class="f-x" points="${poly([B, X, Y])}"/>
        <polygon class="f-y" points="${poly([B, Y, mX])}"/>
        <polygon class="f-x" points="${poly([B, mY, X])}"/>
        <polyline class="gl dashed" points="${poly([[0, 0, c - r - 10], [0, 0, 170]])}"/>`;
      return { s, a: iso([r, 0, c]), level: 4 };
    }
  }
}

export function servicesHTML(head = "") {
  const order = [4, 1, 2, 0, 3];
  const parts = order.map((i) => {
    const p = partSVG(i);
    const bx = 250, by = p.a[1];
    return `<g class="part" data-i="${i}" data-level="${p.level}" tabindex="-1">
      ${p.s}
      <path class="leader" d="M${p.a[0].toFixed(1)} ${p.a[1].toFixed(1)} L${(bx - 16).toFixed(1)} ${by.toFixed(1)}"/>
      <circle class="dotend" cx="${p.a[0].toFixed(1)}" cy="${p.a[1].toFixed(1)}" r="2.6"/>
      <circle class="balloon" cx="${bx}" cy="${by.toFixed(1)}" r="15"/>
      <text class="balloon-n" x="${bx}" y="${(by + 1).toFixed(1)}">${i + 1}</text>
      <text class="balloon-t" x="${bx + 22}" y="${(by + 1).toFixed(1)}">${esc(SVC_SHORT[i])}</text>
    </g>`;
  }).join("");
  return `
  <div class="svc">
    <div class="svc-fig">
      <svg class="asm" viewBox="-190 -560 560 690" role="img" aria-label="Exploded assembly drawing: five parts, one for each service, stacked into one machine">
        <defs>
          <pattern id="hx" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hatch"/></pattern>
          <pattern id="hy" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="4" class="hatch"/></pattern>
        </defs>
        <polyline class="axis" points="0,-540 0,110"/>
        ${parts}
      </svg>
      <p class="cap asm-cap">Exploded view · scroll to assemble · tap a part</p>
      <div class="targets" role="group" aria-label="Drop targets: knock one down to light its service">
        ${SERVICES.map((s, i) => `<button type="button" class="tgt" data-i="${i}" aria-label="Knock down target ${i + 1}: ${esc(s.title)}"><span class="tgt-face"><b>${i + 1}</b><small>${esc(SVC_SHORT[i])}</small></span></button>`).join("")}
        <p class="tgt-msg" aria-live="polite">Knock down all five.</p>
        <button type="button" class="tgt-reset" hidden>Reset the bank</button>
      </div>
    </div>
    ${head}
    <ol class="bom">
      <li class="bom-h" aria-hidden="true"><span>Item</span><span>Part</span><span>Specification</span></li>
      ${SERVICES.map((s, i) => `<li class="bom-row" data-i="${i}" style="--c:var(--c${i})">
        ${lamps(6, "row-lamps")}
        <span class="bom-n">${String(i + 1).padStart(2, "0")}</span>
        <div class="bom-b">
          <h3><button type="button" class="bom-btn">${esc(s.title)}</button></h3>
          <p class="bom-tag">${esc(s.tag)}</p>
          <p class="bom-d">${esc(s.desc)}</p>
          <ul class="bom-items">${s.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
        </div>
      </li>`).join("")}
    </ol>
  </div>`;
}

export function initServices() {
  const root = $<HTMLElement>("#services");
  const parts = $$<SVGGElement>(".part", root);
  const rows = $$<HTMLElement>(".bom-row", root);
  const GAP = 64;

  // exploded → assembled, scrubbed by scroll
  const setP = (p: number) => parts.forEach((g) => {
    const lv = Number(g.dataset.level);
    g.setAttribute("transform", `translate(0 ${(-(1 - p) * GAP * lv).toFixed(1)})`);
  });
  setP(reduced() ? 1 : 0);
  if (!reduced()) {
    ScrollTrigger.create({
      trigger: $(".svc-fig", root), start: "top 85%", end: "bottom 45%", scrub: 0.6,
      onUpdate: (st) => setP(gsap.parseEase("power2.inOut")(st.progress)),
    });
  }

  const select = (i: number) => {
    parts.forEach((g) => g.classList.toggle("on", Number(g.dataset.i) === i));
    rows.forEach((r) => r.classList.toggle("on", Number(r.dataset.i) === i));
  };
  parts.forEach((g) => {
    g.addEventListener("pointerenter", () => select(Number(g.dataset.i)));
    g.addEventListener("click", () => { select(Number(g.dataset.i)); sfx.knock(0.7); });
  });
  rows.forEach((r) => {
    r.addEventListener("pointerenter", () => select(Number(r.dataset.i)));
    $(".bom-btn", r).addEventListener("click", () => { select(Number(r.dataset.i)); sfx.knock(0.7); });
    $(".bom-btn", r).addEventListener("focus", () => select(Number(r.dataset.i)));
  });
  $(".svc", root).addEventListener("pointerleave", () => select(-1));

  // dark: drop targets
  const tgts = $$<HTMLButtonElement>(".tgt", root);
  const msg = $<HTMLElement>(".tgt-msg", root), reset = $<HTMLButtonElement>(".tgt-reset", root);
  const down = new Set<number>();
  tgts.forEach((t) => t.addEventListener("click", () => {
    const i = Number(t.dataset.i);
    if (down.has(i)) { select(i); return; }
    down.add(i);
    t.classList.add("down");
    t.setAttribute("aria-pressed", "true");
    rows[i].classList.add("lit");
    select(i);
    sfx.blip(i);
    msg.textContent = down.size === 5 ? "Bank complete. All five services lit." : `${SERVICES[i].title} lit. ${5 - down.size} to go.`;
    if (down.size === 5) { sfx.chime(); reset.hidden = false; root.classList.add("bank"); }
  }));
  reset.addEventListener("click", () => {
    down.clear();
    tgts.forEach((t) => { t.classList.remove("down"); t.removeAttribute("aria-pressed"); });
    rows.forEach((r) => r.classList.remove("lit"));
    root.classList.remove("bank");
    reset.hidden = true;
    msg.textContent = "Knock down all five.";
    sfx.lever();
  });
  void svgNS;
}
