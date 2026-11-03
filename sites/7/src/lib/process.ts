// PROCESS as a gear train: Identify drives Improve drives Automate drives Scale. Scrolling turns
// the crank; you can also grab the crank and turn it yourself. The teeth really mesh (each gear's
// phase is solved from its neighbour), and each gear that has turned lights its step.
import { PROCESS } from "@shared/content";
import { $, $$, esc, gsap, ScrollTrigger, reduced } from "./core";
import { lamps } from "./chrome";
import { sfx } from "./sound";

const M = 7; // module
const GEARS = [
  { n: 14, x: 92, y: 168 },
  { n: 20, x: 0, y: 0 },
  { n: 12, x: 0, y: 0 },
  { n: 24, x: 0, y: 0 },
];
const ANG = [-0.28, 0.42, -0.36]; // direction from gear i to gear i+1 (radians)
GEARS.forEach((g, i) => {
  if (!i) return;
  const p = GEARS[i - 1], d = (M * p.n) / 2 + (M * g.n) / 2;
  g.x = p.x + Math.cos(ANG[i - 1]) * d;
  g.y = p.y + Math.sin(ANG[i - 1]) * d;
});

function gearPath(n: number) {
  const r = (M * n) / 2, ra = r + M, rd = r - 1.25 * M, step = (Math.PI * 2) / n;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = k * step;
    const pts = [
      [rd, a - step * 0.5], [rd, a - step * 0.3], [ra, a - step * 0.14], [ra, a + step * 0.14], [rd, a + step * 0.3],
    ];
    pts.forEach(([rr, t], j) => { d += `${k === 0 && j === 0 ? "M" : "L"}${(rr * Math.cos(t)).toFixed(2)} ${(rr * Math.sin(t)).toFixed(2)} `; });
  }
  return d + "Z";
}

export function processHTML() {
  return `
  <div class="gears-wrap">
    <svg class="gears" viewBox="0 0 560 320" role="img" aria-label="Four meshing gears: Identify, Improve, Automate and Scale. Turning the first turns them all.">
      ${GEARS.map((g, i) => {
        const r = (M * g.n) / 2;
        const ring = Array.from({ length: 18 }, (_, k) => {
          const t = (k / 18) * Math.PI * 2, rr = r + M + 9;
          return `<circle class="glamp" style="--k:${k}" cx="${(Math.cos(t) * rr).toFixed(1)}" cy="${(Math.sin(t) * rr).toFixed(1)}" r="2.6"/>`;
        }).join("");
        return `<g class="gear" data-i="${i}" transform="translate(${g.x.toFixed(1)} ${g.y.toFixed(1)})">
          <g class="glamps">${ring}</g>
          <g class="grot">
            <path class="gbody" d="${gearPath(g.n)}"/>
            <circle class="gpitch" r="${r}"/>
            <circle class="ghub" r="${Math.max(9, r * 0.22)}"/>
            ${Array.from({ length: 4 }, (_, k) => { const t = (k / 4) * Math.PI * 2 + Math.PI / 4, a = r * 0.36, b = r - 1.25 * M - 6; return `<path class="gspoke" d="M${(Math.cos(t) * a).toFixed(1)} ${(Math.sin(t) * a).toFixed(1)} L${(Math.cos(t) * b).toFixed(1)} ${(Math.sin(t) * b).toFixed(1)}"/>`; }).join("")}
            ${i === 0 ? `<g class="crank"><path class="crank-arm" d="M0 0 L${r * 0.78} 0"/><circle class="crank-knob" cx="${r * 0.78}" cy="0" r="9"/></g>` : ""}
          </g>
          <circle class="gaxle" r="3.2"/>
          <text class="gnum" y="${-(r * 0.22 + 14)}">${PROCESS[i].n}</text>
          <text class="gname" y="${r + M + 30}">${esc(PROCESS[i].title)}</text>
        </g>`;
      }).join("")}
      <text class="gears-note" x="${(GEARS[0].x - 62).toFixed(0)}" y="${(GEARS[0].y + 112).toFixed(0)}">Drive gear · grab and turn</text>
    </svg>
    <button class="crank-btn" type="button"><span class="cb-ico" aria-hidden="true"></span>Turn the crank</button>
  </div>
  <ol class="steps">
    ${PROCESS.map((p, i) => `<li class="step" data-i="${i}">${lamps(4, "step-lamps")}<span class="step-n">${p.n}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><span class="step-ratio">${i ? `Ratio ${GEARS[i - 1].n}:${GEARS[i].n}` : `Drive gear · ${GEARS[0].n} teeth`}</span></li>`).join("")}
  </ol>`;
}

export function initProcess() {
  const root = $<HTMLElement>("#process");
  const rots = $$<SVGGElement>(".grot", root);
  const gears = $$<SVGGElement>(".gear", root);
  const steps = $$<HTMLElement>(".step", root);
  let scrollA = 0, manualA = 0, maxA = 0, lastTooth = 0, lastTick = 0;

  // mesh phase solved once at rest; after that each gear turns by the tooth ratio
  const phase = [0];
  for (let i = 1; i < GEARS.length; i++) {
    const p = GEARS[i - 1], g = GEARS[i], th = ANG[i - 1];
    const u = (((th - phase[i - 1]) * p.n) / (Math.PI * 2)) % 1;
    phase.push(th + Math.PI - ((Math.PI * 2) / g.n) * (0.5 - u));
  }
  const apply = () => {
    const a0 = ((scrollA + manualA) * Math.PI) / 180;
    const angles = [a0];
    for (let i = 1; i < GEARS.length; i++) angles.push(phase[i] - (angles[i - 1] - phase[i - 1]) * (GEARS[i - 1].n / GEARS[i].n));
    rots.forEach((r, i) => r.setAttribute("transform", `rotate(${((angles[i] * 180) / Math.PI).toFixed(2)})`));
    const total = Math.abs(scrollA) + Math.abs(manualA);
    maxA = Math.max(maxA, total);
    const lit = Math.min(4, Math.floor((maxA + 40) / 150));
    steps.forEach((s, i) => s.classList.toggle("lit", i < lit));
    gears.forEach((g, i) => g.classList.toggle("lit", i < lit));
    const tooth = Math.floor((scrollA + manualA) / (360 / GEARS[0].n));
    if (tooth !== lastTooth) {
      lastTooth = tooth;
      const now = performance.now();
      if (now - lastTick > 45) { lastTick = now; sfx.tick(); }
    }
  };
  apply();

  if (reduced()) { scrollA = 620; apply(); }
  else ScrollTrigger.create({
    trigger: root, start: "top 80%", end: "bottom 30%", scrub: 0.4,
    onUpdate: (st) => { scrollA = st.progress * 640; apply(); },
  });

  // turn the crank by hand
  const g0 = gears[0];
  const svg = $<SVGSVGElement>(".gears", root);
  const center = () => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return { x: ctm.a * GEARS[0].x + ctm.e, y: ctm.d * GEARS[0].y + ctm.f };
  };
  let dragging = false, lastAng = 0;
  g0.addEventListener("pointerdown", (e) => {
    dragging = true;
    g0.setPointerCapture(e.pointerId);
    const c = center();
    lastAng = Math.atan2(e.clientY - c.y, e.clientX - c.x);
    g0.classList.add("held");
  });
  g0.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const c = center();
    const a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
    let d = a - lastAng;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    lastAng = a;
    manualA += (d * 180) / Math.PI;
    apply();
  });
  const up = () => { dragging = false; g0.classList.remove("held"); };
  g0.addEventListener("pointerup", up);
  g0.addEventListener("pointercancel", up);
  // keyboard: the crank is a real control
  const crankBtn = $<HTMLButtonElement>(".crank-btn", root);
  crankBtn?.addEventListener("click", () => {
    const o = { v: manualA };
    gsap.to(o, { v: manualA + 180, duration: 0.9, ease: "power2.inOut", onUpdate: () => { manualA = o.v; apply(); } });
  });
}
