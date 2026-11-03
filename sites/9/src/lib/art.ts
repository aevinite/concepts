// Hand-built illustrations for Saap Sidi, all generated as SVG in code: painted snakes with
// tapering bodies and scales, wooden ladders, diyas, a lotus, a rangoli, a toran garland,
// cowrie shells, pawns and the decorative border bands. Each drawing carries classes that the
// two worlds (painted cloth / Diwali night) colour differently in CSS.

export type P = { x: number; y: number };
const f = (n: number) => Math.round(n * 10) / 10;

/** Centre of square n (1..100) in the board's 1000×1000 drawing space. 1 is bottom left, 100 top left. */
export function sq(n: number): P {
  const i = n - 1, row = Math.floor(i / 10), k = i % 10, col = row % 2 ? 9 - k : k;
  return { x: col * 100 + 50, y: (9 - row) * 100 + 50 };
}
/** Grid position (0..9 from the left, 0..9 from the top) of square n. */
export function cell(n: number) {
  const i = n - 1, row = Math.floor(i / 10), k = i % 10;
  return { col: row % 2 ? 9 - k : k, row: 9 - row };
}

/** A smooth path through points (Catmull-Rom turned into cubic Béziers). */
export function smooth(pts: P[], closed = false) {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`;
  }
  return closed ? d + "Z" : d;
}

/* ------------------------------------------------------------------ snakes */

export type SnakeArt = { spine: string; body: string; belly: string; head: string; eyes: string; tongue: string; angle: number; len: number; headAt: P };

/** A snake from head h to tail t: wavy spine, body that tapers, a spade head, eyes and tongue. */
export function snake(h: P, t: P, seed: number, bend = 1): SnakeArt {
  const dx = t.x - h.x, dy = t.y - h.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const waves = Math.max(1.1, L / 250);
  const A = Math.min(52, 16 + L * 0.075) * bend;
  const phase = (seed * 1.7) % (Math.PI * 2);
  const N = 64;
  const spine: P[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const env = Math.min(1, s / 0.14) * (1 - 0.35 * s);
    const off = A * (Math.sin(Math.PI * 2 * waves * s + phase) - Math.sin(phase)) * env;
    const curl = s > 0.86 ? (s - 0.86) * 160 * (seed % 2 ? 1 : -1) : 0;
    spine.push({ x: h.x + ux * L * s + nx * (off + curl), y: h.y + uy * L * s + ny * (off + curl) });
  }
  const width = (s: number) => 31 * Math.pow(1 - s, 0.62) + 2.2;
  const left: P[] = [], right: P[] = [], bl: P[] = [];
  for (let i = 0; i <= N; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(N, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const px = -ty, py = tx, w = width(i / N) / 2, p = spine[i];
    left.push({ x: p.x + px * w, y: p.y + py * w });
    right.push({ x: p.x - px * w, y: p.y - py * w });
    bl.push({ x: p.x + px * w * 0.25, y: p.y + py * w * 0.25 });
  }
  const tip = spine[N];
  const body = smooth([...left, tip, ...right.reverse()], true);
  const belly = smooth(bl);
  // Head: a rounded spade pointing away from the body.
  const hx = -ux, hy = -uy, angle = Math.atan2(hy, hx) * 180 / Math.PI;
  const c = { x: h.x + hx * 6, y: h.y + hy * 6 };
  const rot = (x: number, y: number) => ({ x: c.x + x * hx - y * hy, y: c.y + x * hy + y * hx });
  const hp = [rot(-16, -17), rot(6, -20), rot(26, -11), rot(34, 0), rot(26, 11), rot(6, 20), rot(-16, 17), rot(-22, 0)];
  const head = smooth(hp, true);
  const e1 = rot(14, -9), e2 = rot(14, 9);
  const eyes = `M${f(e1.x - 4.5)},${f(e1.y)}a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0M${f(e2.x - 4.5)},${f(e2.y)}a4.5,4.5 0 1,0 9,0a4.5,4.5 0 1,0 -9,0`;
  const t0 = rot(33, 0), t1 = rot(50, 0), ta = rot(58, -6), tb = rot(58, 6);
  const tongue = `M${f(t0.x)},${f(t0.y)}L${f(t1.x)},${f(t1.y)}L${f(ta.x)},${f(ta.y)}M${f(t1.x)},${f(t1.y)}L${f(tb.x)},${f(tb.y)}`;
  return { spine: smooth(spine), body, belly, head, eyes, tongue, angle, len: L, headAt: h };
}

/* ------------------------------------------------------------------ ladders */

export type LadderArt = { railA: string; railB: string; rungs: string[]; angle: number };

export function ladder(b: P, t: P, half = 22, ext = 16, gap = 36): LadderArt {
  const dx = t.x - b.x, dy = t.y - b.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const s = { x: b.x - ux * ext, y: b.y - uy * ext }, e = { x: t.x + ux * ext, y: t.y + uy * ext };
  const rail = (k: number) => `M${f(s.x + nx * half * k)},${f(s.y + ny * half * k)}L${f(e.x + nx * half * k)},${f(e.y + ny * half * k)}`;
  const rungs: string[] = [];
  const total = L + ext * 2, count = Math.max(2, Math.round((total - 30) / gap));
  for (let i = 0; i <= count; i++) {
    const d = 15 + (i * (total - 30)) / count;
    const p = { x: s.x + ux * d, y: s.y + uy * d };
    rungs.push(`M${f(p.x + nx * half)},${f(p.y + ny * half)}L${f(p.x - nx * half)},${f(p.y - ny * half)}`);
  }
  return { railA: rail(1), railB: rail(-1), rungs, angle: Math.atan2(dy, dx) * 180 / Math.PI };
}

/** Point a fraction of the way from a to b. */
export const lerp = (a: P, b: P, k: number): P => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

/* ------------------------------------------------------------------ small drawings */

/** A clay diya with its flame (the flame only shows in the night world, or when lit). */
export const diya = (cls = "") => `<svg class="diya ${cls}" viewBox="0 0 48 48" aria-hidden="true">
  <path class="diya__glow" d="M24 2c9 10 13 18 13 25a13 13 0 0 1-26 0c0-7 4-15 13-25Z"/>
  <path class="diya__flame" d="M24 9c4.6 6 6.6 10.4 6.6 14.2a6.6 6.6 0 0 1-13.2 0C17.4 19.4 19.4 15 24 9Z"/>
  <path class="diya__core" d="M24 17c1.9 2.6 2.8 4.5 2.8 6.1a2.8 2.8 0 0 1-5.6 0c0-1.6.9-3.5 2.8-6.1Z"/>
  <path class="diya__wick" d="M24 26.5v4"/>
  <path class="diya__bowl" d="M5 30.5c4.2 1.6 10.6 2.6 19 2.6s14.8-1 19-2.6c-1.6 7.8-9 12.5-19 12.5S6.6 38.3 5 30.5Z"/>
  <path class="diya__lip" d="M5 30.5c4.2 1.6 10.6 2.6 19 2.6s14.8-1 19-2.6"/>
  <path class="diya__dots" d="M13 37.2h.1M19 38.6h.1M24 39h.1M29 38.6h.1M35 37.2h.1"/>
</svg>`;

/** A lotus, the old board's last square (moksha). */
export const lotus = (cls = "") => `<svg class="lotus ${cls}" viewBox="0 0 120 80" aria-hidden="true">
  <path class="lotus__p3" d="M60 70C38 64 18 50 6 30c18 2 36 12 54 40Zm0 0c22-6 42-20 54-40-18 2-36 12-54 40Z"/>
  <path class="lotus__p2" d="M60 72C44 58 34 40 32 16c14 10 24 26 28 56Zm0 0c16-14 26-32 28-56-14 10-24 26-28 56Z"/>
  <path class="lotus__p1" d="M60 72C52 54 50 32 60 6c10 26 8 48 0 66Z"/>
  <path class="lotus__base" d="M30 72h60"/>
</svg>`;

/** A rangoli drawn as lines of light (dark world) or chalk (light world). Paths draw on scroll. */
export function rangoli(petals = 12, r = 200) {
  const c = r + 10, parts: string[] = [];
  const ring = (rr: number) => `<circle class="rg rg--ring" cx="${c}" cy="${c}" r="${rr}"/>`;
  parts.push(ring(r * 0.18), ring(r * 0.98));
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2, b = a + Math.PI / petals;
    const p = (rad: number, ang: number) => `${f(c + Math.cos(ang) * rad)},${f(c + Math.sin(ang) * rad)}`;
    parts.push(`<path class="rg rg--petal" d="M${p(r * 0.2, a - 0.18)}Q${p(r * 0.62, a - 0.32)} ${p(r * 0.78, a)}Q${p(r * 0.62, a + 0.32)} ${p(r * 0.2, a + 0.18)}"/>`);
    parts.push(`<path class="rg rg--leaf" d="M${p(r * 0.5, b)}Q${p(r * 0.76, b - 0.14)} ${p(r * 0.94, b)}Q${p(r * 0.76, b + 0.14)} ${p(r * 0.5, b)}"/>`);
    parts.push(`<circle class="rg rg--dot" cx="${p(r * 0.88, a).split(",")[0]}" cy="${p(r * 0.88, a).split(",")[1]}" r="${f(r * 0.009)}"/>`);
  }
  return `<svg class="rangoli" viewBox="0 0 ${c * 2} ${c * 2}" aria-hidden="true">${parts.join("")}</svg>`;
}

/** A kolam line: loops that link along a band, used between sections in the night world. */
export function kolamBand(w = 1200, h = 60, n = 16) {
  const step = w / n;
  let d = `M0,${h / 2}`;
  for (let i = 0; i < n; i++) {
    const x = i * step;
    d += `C${f(x + step * 0.25)},${-h * 0.1} ${f(x + step * 0.75)},${-h * 0.1} ${f(x + step)},${h / 2}`;
  }
  let d2 = `M0,${h / 2}`;
  for (let i = 0; i < n; i++) {
    const x = i * step;
    d2 += `C${f(x + step * 0.25)},${h * 1.1} ${f(x + step * 0.75)},${h * 1.1} ${f(x + step)},${h / 2}`;
  }
  const dots = Array.from({ length: n }, (_, i) => `<circle class="kb__dot" cx="${f(i * step + step / 2)}" cy="${h / 2}" r="3"/>`).join("");
  return `<svg class="kolam" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path class="kb kb--a" d="${d}"/><path class="kb kb--b" d="${d2}"/>${dots}</svg>`;
}

/** A toran: mango leaves and marigolds by day, a string of bulbs by night, hung on one curve. */
export function toran(w = 1440, sag = 26, n = 22) {
  const y0 = 6;
  const yAt = (x: number) => y0 + sag * 4 * (x / w) * (1 - x / w);
  let items = "";
  for (let i = 0; i < n; i++) {
    const x = (w / n) * (i + 0.5), y = yAt(x);
    const flower = i % 3 === 1;
    items += `<g transform="translate(${f(x)} ${f(y)})" style="--i:${i}">
      ${flower
        ? `<g class="tor__flower"><circle r="8" cy="10"/><circle class="tor__flower-in" r="3.6" cy="10"/></g>`
        : `<path class="tor__leaf" d="M0 0C7 8 7 22 0 34C-7 22-7 8 0 0Z"/><path class="tor__vein" d="M0 3V31"/>`}
      <g class="tor__bulb"><path class="tor__cap" d="M-2.5 0h5v4h-5z"/><circle class="tor__glass" cy="10" r="5.2"/></g>
    </g>`;
  }
  return `<svg class="toran" viewBox="0 0 ${w} ${y0 + sag + 46}" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <path class="tor__string" d="M0 ${y0}Q${w / 2} ${y0 + sag * 2} ${w} ${y0}"/>${items}</svg>`;
}

/** A cowrie shell, seen mouth up (with its toothed slit) or back up (smooth dome). */
export const cowrie = () => `<svg class="cowrie" viewBox="0 0 60 80" aria-hidden="true">
  <g class="cw__back"><ellipse cx="30" cy="40" rx="24" ry="34"/><path class="cw__spot" d="M18 26c4-3 8-3 12 0M24 46c4-3 8-3 12 0M20 58c3-2 6-2 9 0"/></g>
  <g class="cw__mouth"><ellipse cx="30" cy="40" rx="24" ry="34"/><path class="cw__slit" d="M30 10C25 30 25 50 30 70C35 50 35 30 30 10Z"/>
  <path class="cw__teeth" d="M24 22h4M23 30h5M23 38h5M23 46h5M24 54h4M32 22h4M32 30h5M32 38h5M32 46h5M32 54h4"/></g>
</svg>`;

/** A painted pawn with initials (the founders are players 1 and 2). */
export const pawn = (label: string, cls = "") => `<svg class="pawn ${cls}" viewBox="0 0 80 100" aria-hidden="true">
  <ellipse class="pawn__shadow" cx="40" cy="93" rx="30" ry="5"/>
  <path class="pawn__body" d="M18 88c0-12 8-20 14-27-6-3-9-8-9-14a17 17 0 1 1 34 0c0 6-3 11-9 14 6 7 14 15 14 27Z"/>
  <path class="pawn__band" d="M22 80h36"/>
  <text class="pawn__t" x="40" y="52" text-anchor="middle">${label}</text>
</svg>`;

/** The painted border band used between sections in the day world. */
export const bandDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <pattern id="band-day" width="48" height="24" patternUnits="userSpaceOnUse">
    <rect width="48" height="24" class="bd__bg"/>
    <path class="bd__a" d="M0 12 12 3l12 9-12 9Z"/><path class="bd__b" d="M24 12l12-9 12 9-12 9Z"/>
    <circle class="bd__c" cx="12" cy="12" r="2.6"/><circle class="bd__d" cx="36" cy="12" r="2.6"/>
  </pattern>
  <filter id="glow" filterUnits="userSpaceOnUse" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glow-soft" filterUnits="userSpaceOnUse" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs></svg>`;

export const band = (cls = "") => `<div class="band ${cls}" aria-hidden="true">
  <svg class="band__day" preserveAspectRatio="none"><rect width="100%" height="100%" fill="url(#band-day)"/></svg>
  ${kolamBand()}
</div>`;
