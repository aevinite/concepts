// The two product scenes.
// Aevidine: a rooftop restaurant terrace on Uttarayan. Tap a table and its order flies to the
//           kitchen window as a ticket; tap the string lights to switch them on.
// Campus:   a kite whose string is the bus route across a map of the city. The bus drives the
//           string; drag along the map to drive it yourself.
import { gsap } from "gsap";
import { buildSkyline } from "./skyline";
import { $, $$, quadPts, reduced, watchView, clamp } from "./utils";
import { sound } from "./sound";

const kitePoly = (x: number, y: number, s: number, a: string, b: string, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <path d="M0 ${s * 0.9} L${-s * 0.26} ${s * 1.4} L${s * 0.26} ${s * 1.4}Z" fill="${b}"/>
  <path d="M0 ${-s} L${s * 0.98} ${-s * 0.06} L0 ${s * 1.02} L${-s * 0.98} ${-s * 0.06}Z" fill="${a}"/>
  <path d="M0 ${-s} L${s * 0.98} ${-s * 0.06} L0 ${s * 1.02}Z" fill="${b}"/>
  <path d="M0 ${-s} L0 ${s * 1.02} M${-s * 0.98} ${-s * 0.06} Q0 ${-s * 0.8} ${s * 0.98} ${-s * 0.06}" fill="none" stroke="rgba(60,35,10,.55)" stroke-width="1.2"/>
</g>`;

/* ---------- Aevidine: the terrace ---------- */

export function terraceSVG(uid: string) {
  const city = buildSkyline(800, 330, 120, 21);
  const bulbs = quadPts(16, 74, 400, 176, 784, 62, 16).slice(1, -1);
  const tables = [168, 400, 618];
  const jaali = Array.from({ length: 26 }, (_, i) => `<path d="M${18 + i * 30} 372 l7 -9 l7 9 l-7 9Z" class="sc-hole"/>`).join("");
  return `<svg class="scene scene-terrace" viewBox="0 0 800 400" role="img" aria-labelledby="${uid}-t">
    <title id="${uid}-t">A rooftop restaurant terrace on Uttarayan: string lights, three tables with QR codes, a waiter, and the kitchen window on the right.</title>
    <path d="${city.back}" class="sc-far"/>
    <path d="${city.front}" class="sc-mid"/>
    <g class="sc-kites">
      <path d="M120 40 Q 60 140 -20 330" class="sc-string"/>${kitePoly(120, 40, 14, "#d6432b", "#fbf0d8", -8)}
      <path d="M560 24 Q 640 160 760 330" class="sc-string"/>${kitePoly(560, 24, 11, "#2b3990", "#eb960f", 10)}
      <path d="M300 92 Q 250 200 210 330" class="sc-string"/>${kitePoly(300, 92, 9, "#3d8a4e", "#c99a2c", 4)}
    </g>
    <rect x="0" y="318" width="800" height="82" class="sc-floor"/>
    <g class="sc-kitchen">
      <rect x="682" y="150" width="130" height="190" class="sc-wall"/>
      <rect x="704" y="186" width="74" height="52" rx="2" class="sc-window"/>
      <text x="741" y="217" class="sc-kot" text-anchor="middle">KOT</text>
      <rect x="716" y="258" width="44" height="82" class="sc-door"/>
      <text x="741" y="176" class="sc-sign" text-anchor="middle">Kitchen</text>
    </g>
    <path d="M16 74 Q 400 176 784 62" class="sc-wire"/>
    <g class="sc-bulbs" role="button" tabindex="0" aria-label="Switch the string lights on or off">
      ${bulbs.map(([x, y], i) => `<g class="bulb" style="--i:${i}"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 7}" class="sc-wire"/><circle cx="${x}" cy="${y + 12}" r="6"/></g>`).join("")}
      <path d="M16 74 Q 400 176 784 62" class="sc-hit"/>
    </g>
    ${tables.map((x, i) => `<g class="sc-table" data-i="${i}" role="button" tabindex="0" aria-label="Send an order from table ${i + 1} to the kitchen">
      <rect x="${x - 70}" y="232" width="140" height="100" class="sc-hit"/>
      <path d="M${x - 64} 330 L${x - 60} 292 L${x - 40} 292 L${x - 42} 330 M${x + 64} 330 L${x + 60} 292 L${x + 40} 292 L${x + 42} 330" class="sc-chair"/>
      ${i !== 1 ? `<circle cx="${x - 50}" cy="262" r="9" class="sc-ink"/><path d="M${x - 64} 296 Q${x - 62} 272 ${x - 50} 272 Q${x - 38} 272 ${x - 36} 296Z" class="sc-ink"/>` : ""}
      ${i !== 0 ? `<circle cx="${x + 50}" cy="264" r="8.5" class="sc-ink"/><path d="M${x + 36} 296 Q${x + 38} 273 ${x + 50} 273 Q${x + 62} 273 ${x + 64} 296Z" class="sc-ink"/>` : ""}
      <rect x="${x - 3}" y="292" width="6" height="38" class="sc-ink"/>
      <ellipse cx="${x}" cy="290" rx="50" ry="8" class="sc-top"/>
      <g class="sc-qr"><rect x="${x - 7}" y="268" width="14" height="18" rx="1.5"/><rect x="${x - 4}" y="271" width="4" height="4" class="q"/><rect x="${x + 1}" y="276" width="3" height="3" class="q"/><rect x="${x - 4}" y="279" width="3" height="4" class="q"/></g>
      <text x="${x}" y="320" text-anchor="middle" class="sc-num">${i + 1}</text>
    </g>`).join("")}
    <g class="sc-waiter"><circle cx="520" cy="222" r="9" class="sc-ink"/><path d="M510 236 L530 236 L534 312 L506 312Z" class="sc-ink"/><path d="M530 240 L552 226 L555 230 L533 246Z" class="sc-ink"/><rect x="540" y="218" width="30" height="4" rx="2" class="sc-ink"/><rect x="510" y="312" width="7" height="20" class="sc-ink"/><rect x="523" y="312" width="7" height="20" class="sc-ink"/></g>
    <rect x="0" y="352" width="800" height="48" class="sc-parapet"/>
    ${jaali}
    <g class="sc-tickets"></g>
  </svg>`;
}

export function initTerrace(root: ParentNode) {
  for (const svg of $$<SVGSVGElement>(".scene-terrace", root)) {
    const tickets = $<SVGGElement>(".sc-tickets", svg);
    const win = $<SVGRectElement>(".sc-window", svg);
    const kot = $<SVGTextElement>(".sc-kot", svg);
    const bulbs = $<SVGGElement>(".sc-bulbs", svg);
    let n = 0;
    const send = (g: SVGGElement) => {
      const x = Number($<SVGEllipseElement>(".sc-top", g).getAttribute("cx"));
      n++;
      const tk = document.createElementNS("http://www.w3.org/2000/svg", "g");
      tk.setAttribute("class", "ticket");
      tk.innerHTML = `<rect x="-11" y="-14" width="22" height="28" rx="1"/><path d="M-6 -7 h12 M-6 -2 h9 M-6 3 h12 M-6 8 h7"/>`;
      tickets.append(tk);
      sound.whoosh();
      gsap.set(tk, { x, y: 262, scale: 0.3, rotate: -10 });
      gsap.timeline({ onComplete: () => tk.remove() })
        .to(tk, { scale: 1, y: 226, duration: 0.3, ease: "back.out(2)" })
        .to(tk, { x: (x + 741) / 2, y: 130, rotate: 12, duration: 0.45, ease: "sine.out" })
        .to(tk, { x: 741, y: 212, rotate: 0, scale: 0.7, duration: 0.45, ease: "sine.in" })
        .add(() => {
          kot.textContent = `KOT ${n}`;
          sound.tick();
          gsap.fromTo(win, { opacity: 0.4 }, { opacity: 1, duration: 0.5 });
          svg.classList.add("kot-on");
          gsap.delayedCall(1.6, () => svg.classList.remove("kot-on"));
        })
        .to(tk, { opacity: 0, duration: 0.15 });
      gsap.fromTo($<SVGGElement>(".sc-qr", g), { y: 0 }, { y: -6, yoyo: true, repeat: 1, duration: 0.15 });
    };
    $$<SVGGElement>(".sc-table", svg).forEach((g) => {
      g.addEventListener("click", () => send(g));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); send(g); } });
    });
    const toggleLights = () => { svg.classList.toggle("lights-on"); sound.chime(); };
    bulbs.addEventListener("click", toggleLights);
    bulbs.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleLights(); } });
    // A first order goes in by itself the first time the scene is seen, so it is clear what happens.
    let shown = false;
    watchView(svg, (v) => {
      if (v && !shown) { shown = true; gsap.delayedCall(0.9, () => send($$<SVGGElement>(".sc-table", svg)[0])); if (!reduced()) gsap.delayedCall(0.4, () => svg.classList.add("lights-on")); }
    });
  }
}

/* ---------- Campus: the route that is a kite string ---------- */

const ROUTE = "M70 344 C 120 344 140 318 180 306 L 262 284 C 318 268 330 236 380 226 L 470 208 C 530 196 548 160 596 146 L 640 134 C 676 124 690 96 704 74 C 716 56 724 44 736 34";
const STOPS = [
  { at: 0.0, label: "Driver goes online" },
  { at: 0.3, label: "Home stop" },
  { at: 0.56, label: "" },
  { at: 0.76, label: "College" },
];

export function routeSVG(uid: string) {
  const blocks: string[] = [];
  for (let gx = 0; gx < 12; gx++) for (let gy = 0; gy < 7; gy++) {
    const x = 18 + gx * 66 + (gy % 2) * 10, y = 16 + gy * 56;
    if ((gx * 7 + gy * 3) % 5 === 0) continue;
    blocks.push(`<rect x="${x}" y="${y}" width="${50 + ((gx + gy) % 3) * 4}" height="${40 + ((gx * gy) % 3) * 3}" rx="3"/>`);
  }
  return `<svg class="scene scene-route" viewBox="0 0 800 400" role="img" aria-labelledby="${uid}-t">
    <title id="${uid}-t">A map of the city. The bus route runs from the driver's start, past the home stop, to the college, and keeps going up into the sky as the string of a kite.</title>
    <rect x="0" y="0" width="800" height="400" rx="4" class="mp-paper"/>
    <g class="mp-blocks">${blocks.join("")}</g>
    <path d="M250 -10 C 300 80 210 160 290 240 C 350 300 300 360 330 410" class="mp-river"/>
    <path d="M0 200 L800 160 M140 0 L180 400 M520 0 L560 400 M0 330 L800 300" class="mp-road"/>
    <path d="${ROUTE}" class="mp-route-under"/>
    <path d="${ROUTE}" class="mp-route" id="${uid}-route"/>
    <g class="mp-stops"></g>
    <g class="mp-kite">${kitePoly(744, 26, 20, "#eb960f", "#2b3990", 18)}</g>
    <g class="mp-bus">
      <rect x="-17" y="-11" width="34" height="20" rx="5" class="bus-body"/>
      <rect x="-12" y="-7" width="7" height="6" rx="1" class="bus-win"/><rect x="-3" y="-7" width="7" height="6" rx="1" class="bus-win"/><rect x="6" y="-7" width="7" height="6" rx="1" class="bus-win"/>
      <circle cx="-9" cy="10" r="3.5" class="bus-wheel"/><circle cx="9" cy="10" r="3.5" class="bus-wheel"/>
    </g>
    <g class="mp-note" opacity="0"><rect x="0" y="0" width="210" height="40" rx="8"/><circle cx="20" cy="20" r="9" class="note-dot"/><text x="36" y="25"></text></g>
  </svg>`;
}

export function initRoute(root: ParentNode) {
  for (const svg of $$<SVGSVGElement>(".scene-route", root)) {
    const path = $<SVGPathElement>(".mp-route", svg);
    const bus = $<SVGGElement>(".mp-bus", svg);
    const note = $<SVGGElement>(".mp-note", svg);
    const noteText = $<SVGTextElement>("text", note);
    const stopsG = $<SVGGElement>(".mp-stops", svg);
    const kite = $<SVGGElement>(".mp-kite", svg);
    const L = path.getTotalLength();
    const END = 0.78;
    stopsG.innerHTML = STOPS.map((s, i) => {
      const p = path.getPointAtLength(L * s.at);
      return `<g class="stop" data-i="${i}"><circle cx="${p.x}" cy="${p.y}" r="7"/>${s.label ? `<text x="${p.x + (i === 3 ? -12 : 12)}" y="${p.y + (i === 0 ? 26 : 24)}" text-anchor="${i === 3 ? "end" : i === 0 ? "start" : "start"}">${s.label}</text>` : ""}</g>`;
    }).join("");
    const stops = $$<SVGGElement>(".stop", svg);
    let p = 0, raf = 0, last = 0, drag = false, dwell = 0, noteKey = "";
    const say = (key: string, text: string, at: { x: number; y: number }) => {
      if (noteKey === key) return;
      noteKey = key;
      if (!text) { gsap.to(note, { opacity: 0, duration: 0.25 }); return; }
      noteText.textContent = text;
      const w = Math.min(330, 52 + text.length * 7.4);
      $<SVGRectElement>("rect", note).setAttribute("width", String(w));
      const nx = clamp(at.x - w / 2, 8, 800 - w - 8), ny = at.y > 200 ? at.y - 74 : at.y + 28;
      gsap.fromTo(note, { opacity: 0, x: nx, y: ny + 10 }, { opacity: 1, y: ny, duration: 0.4, ease: "back.out(2)" });
      sound.tick();
    };
    const place = () => {
      const len = L * Math.min(p, END);
      const pt = path.getPointAtLength(len);
      const ahead = path.getPointAtLength(Math.min(L, len + 2));
      const flip = ahead.x < pt.x ? -1 : 1;
      bus.setAttribute("transform", `translate(${pt.x} ${pt.y - 4}) scale(${flip} 1)`);
      path.style.strokeDashoffset = String(L - (p >= END - 0.005 ? L * Math.min(1, p + 0.22) : len));
      stops.forEach((s, i) => s.classList.toggle("passed", p >= STOPS[i].at - 0.005));
      if (p < 0.12) say("start", "", pt);
      else if (p < 0.29) say("ten", "Your bus is 10 minutes away", path.getPointAtLength(L * 0.3));
      else if (p < 0.4) say("on", "On board. The family is told.", pt);
      else if (p < 0.72) say("mid", "", pt);
      else say("col", "At college", path.getPointAtLength(L * END));
      kite.classList.toggle("flying", p >= END - 0.01);
    };
    path.style.strokeDasharray = String(L);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      if (drag) return;
      if (dwell > 0) { dwell -= dt; return; }
      const before = p;
      p += dt / 11;
      if (before < 0.3 && p >= 0.3) dwell = 1.4;
      if (before < END && p >= END) dwell = 2.4;
      if (p > 1.0) { p = 0; noteKey = ""; }
      place();
    };
    const setFrom = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      p = clamp((e.clientX - r.left) / r.width, 0, 1) * END * 1.04;
      place();
    };
    svg.addEventListener("pointerdown", (e) => { drag = true; setFrom(e); });
    svg.addEventListener("pointermove", (e) => { if (drag) setFrom(e); });
    const end = () => { drag = false; };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("pointerleave", end);
    place();
    watchView(svg, (v) => {
      cancelAnimationFrame(raf);
      if (v && !reduced()) { last = 0; raf = requestAnimationFrame(frame); }
      else if (v) { p = END; place(); }
    });
  }
}
