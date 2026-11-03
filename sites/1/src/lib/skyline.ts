// Pol-house rooftops, drawn from code: flat roofs, parapets and railings, black water tanks on
// legs, stair rooms, old TV antennas, and people on the roofs with their arms up (it is Uttarayan).
// Output is SVG path data, so the same skyline draws on a canvas (Path2D) and in an <svg>.
import { rng } from "./utils";

export type Win = { x: number; y: number; w: number; h: number; lit: boolean; hue: number };
export type Person = { x: number; y: number; h: number };
export type Skyline = { back: string; front: string; win: Win[]; hand: { x: number; y: number }; people: Person[]; topAt: (x: number) => number };

const f = (n: number) => n.toFixed(1);
const R = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const C = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;
function P(pts: [number, number][]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  if (s < 0) pts.reverse();
  return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
}

/** A person standing on a roof. arm: 1 = right arm raised (flying), -1 = left, 0 = none. */
function person(out: string[], x: number, ground: number, h: number, arm: number) {
  const headR = h * 0.12;
  const sh = ground - h * 0.7;
  out.push(P([[x - h * 0.12, sh], [x + h * 0.12, sh], [x + h * 0.15, ground + 1], [x - h * 0.15, ground + 1]]));
  out.push(C(x, sh - headR * 1.15, headR));
  let hand = { x, y: sh };
  if (arm) {
    const s0 = { x: x + arm * h * 0.08, y: sh + h * 0.05 };
    hand = { x: x + arm * h * 0.34, y: sh - h * 0.38 };
    const dx = hand.x - s0.x, dy = hand.y - s0.y, l = Math.hypot(dx, dy), t = h * 0.045;
    const nx = (-dy / l) * t, ny = (dx / l) * t;
    out.push(P([[s0.x + nx, s0.y + ny], [hand.x + nx, hand.y + ny], [hand.x - nx, hand.y - ny], [s0.x - nx, s0.y - ny]]));
  }
  return hand;
}

function tank(out: string[], tx: number, top: number, tw: number, height: number) {
  const legH = height * 0.05, th = tw * 1.0, y0 = top - legH - th + tw * 0.22;
  out.push(R(tx + 2, top - legH - 1, 2, legH + 2), R(tx + tw - 4, top - legH - 1, 2, legH + 2));
  out.push(R(tx, y0, tw, th - tw * 0.22));
  out.push(`M${f(tx)} ${f(y0 + 0.5)}a${f(tw / 2)} ${f(tw * 0.22)} 0 0 1 ${f(tw)} 0Z`);
  out.push(R(tx + tw * 0.4, y0 - tw * 0.3, tw * 0.2, tw * 0.12));
}

export function buildSkyline(W: number, baseY: number, height: number, seed: number, flyerX?: number): Skyline {
  const r = rng(seed);
  const back: string[] = [], front: string[] = [];
  const win: Win[] = [];
  const tops: [number, number, number][] = [];
  const people: Person[] = [];

  let x = -40;
  while (x < W + 40) {
    const w = 90 + r() * 160, h = height * (0.62 + r() * 0.55), top = baseY - h;
    back.push(R(x, top, w + 1, h + 2));
    if (r() < 0.5) back.push(R(x, top - height * 0.06, w + 1, height * 0.06 + 1));
    if (r() < 0.45) tank(back, x + 12 + r() * (w - 44), top, 16 + r() * 10, height);
    if (r() < 0.3) { const ax = x + r() * w, ah = height * (0.2 + r() * 0.2); back.push(R(ax, top - ah, 1.6, ah)); for (let i = 0; i < 3; i++) back.push(R(ax - (18 - i * 5) / 2, top - ah + 3 + i * 6, 18 - i * 5, 1.6)); }
    if (r() < 0.12) { const mx = x + w * 0.3, mh = height * 0.5; back.push(R(mx, top - mh, 16, mh), P([[mx - 3, top - mh], [mx + 8, top - mh - 22], [mx + 19, top - mh]])); }
    x += w;
  }

  x = -24;
  let flyerDone = flyerX === undefined;
  let hand = { x: W * 0.6, y: baseY - height * 0.6 };
  while (x < W + 24) {
    const w = 74 + r() * 128, h = height * (0.3 + r() * 0.42), top = baseY - h;
    front.push(R(x, top, w + 1, h + 2));
    tops.push([x, x + w, top]);
    const style = r();
    if (style < 0.42) front.push(R(x, top - height * 0.07, w + 1, height * 0.07 + 1));
    else if (style < 0.82) {
      const rh = height * 0.1;
      front.push(R(x, top - rh, w + 1, 2.4));
      for (let bx = x + 3; bx < x + w - 2; bx += 8) front.push(R(bx, top - rh, 1.8, rh));
    }
    const isFlyer = !flyerDone && flyerX! >= x && flyerX! < x + w;
    if (r() < 0.32 && !isFlyer) { const mw = 26 + r() * 22, mh = height * (0.15 + r() * 0.08); front.push(R(x + (r() < 0.5 ? 6 : w - mw - 6), top - mh, mw, mh)); }
    if (r() < 0.45 && !isFlyer) tank(front, x + 10 + r() * (w - 44), top, 18 + r() * 12, height);
    if (r() < 0.22) { const ax = x + 8 + r() * (w - 16), ah = height * (0.26 + r() * 0.16); front.push(R(ax, top - ah, 1.7, ah)); for (let i = 0; i < 3; i++) front.push(R(ax - (22 - i * 6) / 2, top - ah + 4 + i * 6, 22 - i * 6, 1.7)); }
    if (isFlyer) { hand = person(front, flyerX!, top, height * 0.34, 1); flyerDone = true; }
    else if (r() < 0.34) { const px = x + 16 + r() * (w - 32), ph = height * (0.24 + r() * 0.07); person(front, px, top, ph, r() < 0.55 ? (r() < 0.5 ? -1 : 1) : 0); people.push({ x: px, y: top, h: ph }); }
    for (let wy = top + 14; wy < baseY - 12; wy += 21) {
      for (let wx = x + 9; wx < x + w - 14; wx += 17) if (r() < 0.7) win.push({ x: wx, y: wy, w: 6, h: 9, lit: r() < 0.36, hue: r() });
    }
    x += w;
  }
  const topAt = (px: number) => { for (const [a, b, t] of tops) if (px >= a && px < b) return t; return baseY - height * 0.5; };
  return { back: back.join(""), front: front.join(""), win, hand, people, topAt };
}
