// Process: the four stages of a kite launch, Hold, Lift, Climb, Soar. A sticky stage: a full-width
// row of rooftops, one person flying, and one continuous string that draws itself as you scroll,
// with the kite riding its tip. The stage text beside the string changes with it.
// At night the rooftops light up and the people on them hold lanterns.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROCESS } from "@shared/content";
import { buildSkyline } from "../lib/skyline";
import { $, $$, esc, gu, isNarrow } from "../lib/utils";

const STAGES = ["Hold", "Lift", "Climb", "Soar"];
const AT = [0.05, 0.36, 0.66, 0.97];

export function processHTML() {
  return `<section class="process" id="process" aria-labelledby="proc-h">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow"><span class="gu" lang="gu">${gu(3)}</span><span>Process</span></p>
        <h2 class="h2" id="proc-h" data-split>Hold, lift, climb, soar.</h2>
        <p class="lede" data-reveal>A kite goes up in four stages, and so does the work we do with you. Scroll, and watch the string climb.</p>
      </header>
    </div>
    <div class="proc">
      <div class="proc-stage">
        <svg class="proc-svg" aria-hidden="true"></svg>
        <div class="wrap proc-wrap">
          <ol class="proc-steps">
            ${PROCESS.map((p, i) => `<li class="pstep${i === 0 ? " on" : ""}" data-i="${i}">
              <p class="pstep-stage"><span class="gu" lang="gu">${gu(i + 1)}</span>${STAGES[i]}</p>
              <h3 class="pstep-title"><span class="pstep-n">${p.n}</span>${esc(p.title)}</h3>
              <p class="pstep-desc">${esc(p.desc)}</p>
            </li>`).join("")}
          </ol>
        </div>
      </div>
    </div>
  </section>`;
}

export function initProcess() {
  const stage = $<HTMLElement>(".proc-stage");
  const svg = $<SVGSVGElement>(".proc-svg", stage);
  const steps = $$<HTMLElement>(".pstep");
  let p = 0, path: SVGPathElement | null = null, kite: SVGGElement, knots: SVGGElement[] = [], L = 1, lastW = 0, lastH = 0;

  const build = () => {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H || (W === lastW && Math.abs(H - lastH) < 60)) return;
    lastW = W; lastH = H;
    const narrow = isNarrow();
    const col = Math.min(W, 1240), left = (W - col) / 2 + (narrow ? 20 : 56), inner = col - (narrow ? 40 : 112);
    const roofH = narrow ? Math.min(130, Math.max(96, H * 0.14)) : Math.min(170, Math.max(110, H * 0.17));
    const fx = narrow ? W * 0.84 : left + inner * 0.08;
    const sky = buildSkyline(W, H + 2, roofH, 41, fx);
    const { x: hx, y: hy } = sky.hand;
    let d: string;
    if (narrow) {
      const ex = W * 0.16, ey = H * 0.1, dy = hy - ey;
      d = `M${hx} ${hy} C ${hx + W * 0.1} ${hy - dy * 0.3} ${hx + W * 0.04} ${hy - dy * 0.62} ${W * 0.7} ${hy - dy * 0.74} S ${ex + W * 0.12} ${ey + H * 0.04} ${ex} ${ey}`;
    } else {
      const ex = left + inner * 0.42, ey = H * 0.12, dx = ex - hx, dy = hy - ey;
      d = `M${hx} ${hy} C ${hx + dx * 0.55} ${hy - dy * 0.12} ${hx - dx * 0.15} ${hy - dy * 0.42} ${hx + dx * 0.32} ${hy - dy * 0.56} S ${ex + dx * 0.25} ${ey + dy * 0.22} ${ex} ${ey}`;
    }
    const lamps = sky.people.map((q, i) => {
      const lx = q.x + (i % 2 ? -1 : 1) * q.h * 0.32, ly = q.y - q.h * 0.42;
      return `<g class="pr-lamp" style="--i:${i}"><circle cx="${lx}" cy="${ly}" r="${q.h * 0.6}" class="glow"/><line x1="${lx}" y1="${ly - q.h * 0.3}" x2="${lx}" y2="${ly - q.h * 0.14}"/><rect x="${lx - q.h * 0.09}" y="${ly - q.h * 0.14}" width="${q.h * 0.18}" height="${q.h * 0.25}" rx="${q.h * 0.06}"/></g>`;
    }).join("");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <defs><radialGradient id="prGlow"><stop offset="0" stop-color="#ffb850" stop-opacity=".55"/><stop offset="1" stop-color="#ffb850" stop-opacity="0"/></radialGradient></defs>
      <path d="${sky.back}" class="pr-back"/>
      <path d="${d}" class="pr-ghost"/>
      <path d="${d}" class="pr-path"/>
      <g class="pr-knots"></g>
      <g class="pr-kite"><g class="pr-kite-in">
        <path d="M0 18 L-5.5 28 L5.5 28Z" class="k-b"/>
        <path d="M0 -20 L19.6 -1.2 L0 20.4 L-19.6 -1.2Z" class="k-a"/>
        <circle cx="0" cy="1.2" r="7" class="k-b"/>
        <path d="M0 -20 L0 20.4 M-19.6 -1.2 Q0 -16 19.6 -1.2" class="k-s"/>
      </g></g>
      <path d="${sky.front}" class="pr-front"/>
      <g class="pr-win">${sky.win.filter((w) => w.lit).map((w) => `<rect x="${w.x.toFixed(0)}" y="${w.y.toFixed(0)}" width="${w.w}" height="${w.h}"/>`).join("")}</g>
      <g class="pr-lamps">${lamps}</g>`;
    path = $<SVGPathElement>(".pr-path", svg);
    kite = $<SVGGElement>(".pr-kite", svg);
    L = path.getTotalLength();
    path.style.strokeDasharray = `${L}`;
    const kg = $<SVGGElement>(".pr-knots", svg);
    kg.innerHTML = AT.map((a, i) => {
      const pt = path!.getPointAtLength(L * a);
      const right = narrow ? pt.x < W * 0.5 : false;
      return `<g class="knot" data-i="${i}"><circle cx="${pt.x}" cy="${pt.y}" r="${narrow ? 6 : 7}"/><text x="${pt.x + (right ? 16 : -24)}" y="${pt.y + 5}" text-anchor="${right ? "start" : "end"}">${STAGES[i]}</text></g>`;
    }).join("");
    knots = $$<SVGGElement>(".knot", kg);
    draw();
  };

  const draw = () => {
    if (!path) return;
    const len = Math.max(2, L * p);
    path.style.strokeDashoffset = `${L - len}`;
    const pt = path.getPointAtLength(len), pr = path.getPointAtLength(Math.max(0, len - 4));
    const ang = Math.atan2(pt.y - pr.y, pt.x - pr.x) * (180 / Math.PI);
    kite.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${((ang + 90) * 0.35).toFixed(1)}) scale(${1.15 - p * 0.3})`);
    knots.forEach((k, i) => k.classList.toggle("on", p >= AT[i] - 0.01));
    let act = 0;
    AT.forEach((a, i) => { if (p >= a - 0.01) act = i; });
    steps.forEach((s, i) => s.classList.toggle("on", i === act));
  };

  new ResizeObserver(build).observe(stage);
  build();
  const obj = { v: 0 };
  const toP = (q: number) => {
    const idx = Math.min(3, Math.floor(q * 4)), local = q * 4 - idx;
    const from = AT[idx], to = idx === 3 ? 1 : AT[idx + 1];
    return from + (to - from) * Math.min(1, local);
  };
  ScrollTrigger.create({
    trigger: ".proc",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (st) => gsap.to(obj, { v: toP(st.progress), duration: 0.4, ease: "power2.out", overwrite: true, onUpdate: () => { p = obj.v; draw(); } }),
  });
  p = AT[0];
  draw();
}
