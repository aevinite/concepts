// THE SIGNATURE TOY. You fly a kite over Ahmedabad's rooftops. Its string is a verlet rope from a
// person's raised hand on a roof to the kite, pushed around by gusts. Other kites drift in the sky,
// each with a word on a paper tag. Cross your string with one of theirs and it is cut: it tumbles
// away spinning, the lower string falls, and (at night) the lanterns tied to it float up and turn
// into stars.
import { getTheme, onTheme, type Theme } from "@shared/theme";
import { buildSkyline, type Skyline } from "./skyline";
import { drawKite, drawLantern, glow, LOOKS, COLORS, type KiteLook } from "./kitedraw";
import { clamp, cross, quadPts, reduced, isNarrow } from "./utils";
import { sound } from "./sound";

type Pt = { x: number; y: number; px: number; py: number };
type AI = {
  word: string; look: KiteLook; s: number;
  ax: number; ay: number; bx: number; by: number; ampX: number; ampY: number; sp: number; ph: number;
  x: number; y: number; rot: number;
  state: "in" | "fly" | "cut"; t: number;
  vx: number; vy: number; vr: number;
  str: [number, number][];
  tail: Pt[];
  fall: { pts: [number, number][]; vy: number; a: number } | null;
  lit: boolean;
};
type Free = { x: number; y: number; vy: number; t: number; life: number; s: number; ph: number };
type Star = { x: number; y: number; r: number; ph: number; warm: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; t: number };
type Bird = { x: number; y: number; vx: number; ph: number; s: number };
type Far = { x: number; y: number; s: number; vx: number; ph: number; look: KiteLook };

export type SkyOpts = {
  section: HTMLElement;
  canvas: HTMLCanvasElement;
  words: readonly string[];
  /** Where the other kites live, in section pixels. */
  zone: (W: number, H: number) => { top: number; bottom: number; left: number; right: number };
  flyerX: (W: number) => number;
  /** Where the kite rests and wanders when nobody is flying it (kept clear of the headline). */
  auto: (W: number, H: number) => { cx: number; cy: number; ax: number; ay: number };
  /** Where the tiny far-away kites may sit (kept out of the text). */
  far: (W: number, H: number) => { left: number; right: number; top: number; bottom: number };
  onCut: (word: string, look: KiteLook, x: number, y: number, total: number) => void;
  onLight?: (x: number, y: number) => void;
  onFly?: () => void;
};

const N = 26;
const PLAYER_DAY: KiteLook = { a: COLORS.indigo, b: COLORS.saffron, pattern: "chand" };
const PLAYER_NIGHT: KiteLook = { a: "#ffcb6b", b: "#f2662f", pattern: "chand" };

export function initSky(o: SkyOpts) {
  const ctx = o.canvas.getContext("2d")!;
  let W = 0, H = 0, dpr = 1, roofH = 0, narrow = false;
  let sky: Skyline | null = null, back: Path2D | null = null, front: Path2D | null = null;
  let theme: Theme = getTheme();
  const rope: Pt[] = [];
  const kite = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, s: 30 };
  const target = { x: 0, y: 0 };
  let lastInput = -1e9, pressed = false, flown = false;
  let t = 0, raf = 0, last = 0, visible = true, cool = 0, wind = 0, gust = 0, gustTo = 0, gustT = 2;
  let wordIdx = 0, total = 0, birdT = 4;
  const ais: AI[] = [], free: Free[] = [], stars: Star[] = [], sparks: Spark[] = [], birds: Bird[] = [], far: Far[] = [];
  const slow = reduced();

  const nextWord = () => {
    const live = new Set(ais.map((a) => a.word));
    for (let i = 0; i < o.words.length; i++) {
      const w = o.words[(wordIdx + i) % o.words.length];
      if (!live.has(w)) { wordIdx = (wordIdx + i + 1) % o.words.length; return w; }
    }
    return o.words[wordIdx++ % o.words.length];
  };

  function spawn(k: AI | null, enter: boolean, slot = Math.random()): AI {
    const z = o.zone(W, H);
    const bx = z.left + slot * (z.right - z.left) + (Math.random() - 0.5) * 24;
    const band = ((slot * 7.31) % 1) * 0.8 + 0.1;
    const by = z.top + band * (z.bottom - z.top) + (Math.random() - 0.5) * 16;
    const fresh: AI = {
      word: "", look: LOOKS[Math.floor(Math.random() * LOOKS.length)], s: (narrow ? 15 : 21) + Math.random() * (narrow ? 5 : 8),
      bx, by, ampX: 16 + Math.random() * (narrow ? 22 : 46), ampY: 8 + Math.random() * 20, sp: 0.32 + Math.random() * 0.38, ph: Math.random() * 6.28,
      ax: clamp(bx + (Math.random() - 0.5) * W * 0.9, -W * 0.12, W * 1.12), ay: H - roofH * (0.18 + Math.random() * 0.2),
      x: 0, y: 0, rot: 0, state: enter ? "in" : "fly", t: 0, vx: 0, vy: 0, vr: 0, str: [], tail: [], fall: null, lit: Math.random() < 0.8,
    };
    const out = k ?? fresh;
    Object.assign(out, fresh);
    out.word = nextWord();
    out.x = enter ? out.ax : bx;
    out.y = enter ? out.ay : by;
    return out;
  }

  function resize() {
    const nW = o.section.clientWidth, nH = o.section.clientHeight;
    if (!nW || !nH) return;
    const widthChanged = Math.abs(nW - W) > 2;
    W = nW; H = nH; narrow = isNarrow();
    dpr = Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2);
    o.canvas.width = Math.round(W * dpr);
    o.canvas.height = Math.round(H * dpr);
    roofH = narrow ? clamp(H * 0.15, 104, 140) : clamp(H * 0.2, 130, 200);
    sky = buildSkyline(W, H + 2, roofH, 11, o.flyerX(W));
    back = new Path2D(sky.back);
    front = new Path2D(sky.front);
    kite.s = narrow ? 24 : 32;
    if (widthChanged || !ais.length) {
      ais.length = 0;
      const n = narrow ? 3 : 5;
      for (let i = 0; i < n; i++) ais.push(spawn(null, false, (i + 0.5) / n));
      const a0 = o.auto(W, H);
      kite.x = a0.cx + a0.ax * 0.5;
      kite.y = a0.cy;
      rope.length = 0;
      for (let i = 0; i < N; i++) {
        const x = sky.hand.x + (kite.x - sky.hand.x) * (i / (N - 1)), y = sky.hand.y + (kite.y - sky.hand.y) * (i / (N - 1));
        rope.push({ x, y, px: x, py: y });
      }
      stars.length = 0;
      for (let i = 0; i < (narrow ? 50 : 90); i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.72, r: Math.random() * 1.1 + 0.3, ph: Math.random() * 6.28, warm: false });
      far.length = 0;
      const fb = o.far(W, H);
      for (let i = 0; i < (narrow ? 3 : 7); i++) far.push({ x: fb.left + Math.random() * (fb.right - fb.left), y: fb.top + Math.random() * (fb.bottom - fb.top), s: 3.5 + Math.random() * 4, vx: 0, ph: Math.random() * 6.28, look: LOOKS[i % LOOKS.length] });
    } else {
      for (const k of ais) k.ay = H - roofH * 0.25;
    }
  }

  function setTarget(e: PointerEvent) {
    const r = o.canvas.getBoundingClientRect();
    target.x = clamp(e.clientX - r.left, 16, W - 16);
    target.y = clamp(e.clientY - r.top, 30, H - roofH * 0.7);
    lastInput = performance.now();
    if (!flown) { flown = true; o.onFly?.(); }
  }
  o.section.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || pressed) setTarget(e); }, { passive: true });
  o.section.addEventListener("pointerdown", (e) => {
    if ((e.target as Element).closest("a,button")) return;
    pressed = true;
    setTarget(e);
  });
  const up = () => { pressed = false; };
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);

  function cut(k: AI, p: { x: number; y: number }, j: number) {
    k.state = "cut";
    k.t = 0;
    k.vx = kite.vx * 0.12 + (Math.random() - 0.5) * 1.4 + wind * 0.8;
    k.vy = -1.2 - Math.random() * 0.8;
    k.vr = (Math.random() < 0.5 ? -1 : 1) * (0.045 + Math.random() * 0.06);
    const upper = [[p.x, p.y] as [number, number], ...k.str.slice(j + 1)].reverse();
    k.tail = upper.map(([x, y]) => ({ x, y, px: x, py: y }));
    k.fall = { pts: [...k.str.slice(0, j + 1), [p.x, p.y]], vy: 0, a: 1 };
    if (theme === "dark" && k.lit) {
      const n = k.str.length;
      for (const idx of [n - 4, n - 6]) {
        const q = k.str[idx];
        if (q) free.push({ x: q[0], y: q[1] + k.s * 0.6, vy: -0.55 - Math.random() * 0.3, t: 0, life: 5 + Math.random() * 2.5, s: narrow ? 6 : 7.5, ph: Math.random() * 6.28 });
      }
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3.2;
      sparks.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, t: 0 });
    }
    total++;
    cool = 0.35;
    sound.snap();
    o.onCut(k.word, k.look, p.x, p.y, total);
  }

  function step(dt: number) {
    const f = dt * 60;
    t += dt * (slow ? 0.5 : 1);
    cool -= dt;
    gustT -= dt;
    if (gustT < 0) { gustTo = (Math.random() - 0.5) * 2.2; gustT = 2.5 + Math.random() * 4; }
    gust += (gustTo - gust) * 0.02 * f;
    wind = Math.sin(t * 0.55) * 0.45 + gust * 0.6;

    const now = performance.now();
    const userFlying = now - lastInput < (narrow ? 6000 : 3000);
    let tx = target.x, ty = target.y;
    if (!userFlying) {
      const a = o.auto(W, H);
      tx = a.cx + Math.sin(t * 0.29) * a.ax;
      ty = a.cy + Math.sin(t * 0.43) * a.ay;
    }
    kite.vx += (tx - kite.x) * 0.016 * f + wind * 0.06 * f;
    kite.vy += (ty - kite.y) * 0.016 * f;
    const damp = Math.pow(0.87, f);
    kite.vx *= damp;
    kite.vy *= damp;
    kite.x += kite.vx * f;
    kite.y += kite.vy * f + Math.sin(t * 2.6) * 0.25 * f;
    const hand = sky!.hand;
    const lean = Math.atan2(kite.x - hand.x, hand.y - kite.y) * 0.32;
    const rt = clamp(kite.vx * 0.035, -0.55, 0.55) + lean + Math.sin(t * 2.2) * 0.05;
    kite.rot += (rt - kite.rot) * 0.1 * f;

    const bx = kite.x - Math.sin(kite.rot) * kite.s * 0.12, by = kite.y + Math.cos(kite.rot) * kite.s * 0.12;
    rope[0].x = hand.x; rope[0].y = hand.y;
    rope[N - 1].x = bx; rope[N - 1].y = by;
    for (let i = 1; i < N - 1; i++) {
      const p = rope[i];
      const vx = (p.x - p.px) * 0.96, vy = (p.y - p.py) * 0.96;
      p.px = p.x; p.py = p.y;
      p.x += vx + wind * 0.05 * f;
      p.y += vy + 0.2 * f;
    }
    const seg = (Math.hypot(bx - hand.x, by - hand.y) / (N - 1)) * 1.03;
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < N - 1; i++) {
        const a = rope[i], b = rope[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, diff = (d - seg) / d;
        if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
        else if (i + 1 === N - 1) { a.x += dx * diff; a.y += dy * diff; }
        else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
      }
    }

    const roofLine = H - roofH * 0.62;
    for (let ki = 0; ki < ais.length; ki++) {
      const k = ais[ki];
      k.t += dt;
      if (k.state !== "cut") {
        const fx = k.bx + Math.sin(t * k.sp + k.ph) * k.ampX + wind * 14;
        const fy = k.by + Math.sin(t * k.sp * 1.37 + k.ph * 2) * k.ampY;
        if (k.state === "in") {
          const e = 1 - Math.pow(1 - Math.min(1, k.t / 2.4), 3);
          k.x = k.ax + (fx - k.ax) * e + Math.sin(k.t * 5) * 18 * (1 - e);
          k.y = k.ay + (fy - k.ay) * e;
          if (e >= 1) k.state = "fly";
        } else { k.x = fx; k.y = fy; }
        k.rot = Math.cos(t * k.sp + k.ph) * 0.2 + wind * 0.06;
        const kbx = k.x - Math.sin(k.rot) * k.s * 0.12, kby = k.y + Math.cos(k.rot) * k.s * 0.12;
        const d = Math.hypot(kbx - k.ax, kby - k.ay);
        k.str = quadPts(k.ax, k.ay, (k.ax + kbx) / 2 + wind * 26, (k.ay + kby) / 2 + d * 0.13, kbx, kby, 14);
        if (userFlying && cool <= 0 && (k.state === "fly" || k.t > 1.2)) {
          outer: for (let j = 0; j < k.str.length - 1; j++) {
            const [x1, y1] = k.str[j], [x2, y2] = k.str[j + 1];
            if (y1 > roofLine && y2 > roofLine) continue;
            for (let i = 1; i < N - 1; i++) {
              const a = rope[i], b = rope[i + 1];
              const p = cross(a.x, a.y, b.x, b.y, x1, y1, x2, y2);
              if (p && p.y < roofLine) { cut(k, p, j); break outer; }
            }
          }
        }
      } else {
        k.vy = Math.min(k.vy + 0.028 * f, 1.5);
        k.vx = (k.vx + wind * 0.03 * f) * Math.pow(0.996, f);
        k.x += (k.vx + Math.sin(k.t * 3 + k.ph) * 0.9) * f;
        k.y += k.vy * f;
        k.rot += k.vr * f;
        if (k.tail.length) {
          k.tail[0].x = k.x; k.tail[0].y = k.y + k.s * 0.1;
          for (let i = 1; i < k.tail.length; i++) {
            const p = k.tail[i];
            const vx = (p.x - p.px) * 0.95, vy = (p.y - p.py) * 0.95;
            p.px = p.x; p.py = p.y;
            p.x += vx + wind * 0.08 * f; p.y += vy + 0.25 * f;
          }
          const L = 9;
          for (let it = 0; it < 4; it++) for (let i = 0; i < k.tail.length - 1; i++) {
            const a = k.tail[i], b = k.tail[i + 1];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, diff = (d - L) / d;
            if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
            else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
          }
        }
        if (k.fall) {
          k.fall.vy += 0.3 * f;
          for (const q of k.fall.pts) q[1] += k.fall.vy * f;
          k.fall.a -= 0.025 * f;
          if (k.fall.a <= 0) k.fall = null;
        }
        if (k.y > H + 60 || k.x < -140 || k.x > W + 140 || k.t > 8) spawn(k, true, (ki + 0.5) / ais.length);
      }
    }

    for (let i = free.length - 1; i >= 0; i--) {
      const l = free[i];
      l.t += dt;
      l.y += l.vy * f;
      l.x += Math.sin(l.t * 1.4 + l.ph) * 0.35 * f + wind * 0.1 * f;
      if (l.t > l.life || l.y < H * 0.04) {
        if (stars.length < 220) stars.push({ x: l.x, y: l.y, r: 1.7, ph: Math.random() * 6.28, warm: true });
        sound.chime();
        free.splice(i, 1);
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t += dt; s.x += s.vx * f; s.y += s.vy * f; s.vy += 0.12 * f; s.vx *= 0.97;
      if (s.t > 0.6) sparks.splice(i, 1);
    }

    if (theme === "light" && !slow) {
      birdT -= dt;
      if (birdT < 0) {
        birdT = 14 + Math.random() * 10;
        const y = H * (0.08 + Math.random() * 0.25), dir = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < 5; i++) birds.push({ x: dir > 0 ? -30 - i * 22 : W + 30 + i * 22, y: y + (i % 2) * 12 + i * 4, vx: dir * (1.3 + Math.random() * 0.3), ph: Math.random() * 6.28, s: 5 + Math.random() * 2 });
      }
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        b.x += b.vx * f;
        b.y += Math.sin(t * 2 + b.ph) * 0.15 * f;
        if (b.x > W + 200 || b.x < -200) birds.splice(i, 1);
      }
    }
    if (theme === "dark") o.onLight?.(kite.x, kite.y);
  }

  function drawTag(k: AI, dark: boolean) {
    const tipX = k.x - Math.sin(k.rot) * k.s * 1.4, tipY = k.y + Math.cos(k.rot) * k.s * 1.4;
    const sway = Math.sin(t * 2.1 + k.ph) * 0.12;
    const fs = narrow ? 12 : 13;
    ctx.font = `600 ${fs}px "Hind Vadodara", system-ui, sans-serif`;
    const w = ctx.measureText(k.word).width + 16, h = fs + 10, thread = 9;
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(sway);
    ctx.strokeStyle = dark ? "rgba(255,220,170,.55)" : "rgba(40,30,60,.5)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, thread); ctx.stroke();
    if (dark) glow(ctx, 0, thread + h / 2, w * 0.9, 0.18);
    ctx.fillStyle = dark ? "#ffe9bd" : "#fdf6e6";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-w / 2, thread, w, h, 3); else ctx.rect(-w / 2, thread, w, h);
    ctx.fill();
    ctx.fillStyle = k.look.a === COLORS.cream ? k.look.b : k.look.a;
    ctx.fillRect(-w / 2, thread, 3, h);
    ctx.fillStyle = dark ? "#3a1c08" : "#1c2150";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(k.word, 1.5, thread + h / 2 + 1);
    ctx.restore();
  }

  function draw() {
    const dark = theme === "dark";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (dark) {
      for (const s of stars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(t * (s.warm ? 1.3 : 0.8) + s.ph));
        if (s.warm) { glow(ctx, s.x, s.y, 9, 0.35 * a); ctx.fillStyle = `rgba(255,226,170,${a})`; }
        else ctx.fillStyle = `rgba(235,232,255,${a * 0.8})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      const g = ctx.createLinearGradient(0, H - roofH * 1.9, 0, H);
      g.addColorStop(0, "rgba(255,140,60,0)");
      g.addColorStop(1, "rgba(255,140,60,.2)");
      ctx.fillStyle = g;
      ctx.fillRect(0, H - roofH * 1.9, W, roofH * 1.9);
      for (const fk of far) {
        const y = fk.y + Math.sin(t * 0.7 + fk.ph) * 6;
        glow(ctx, fk.x, y, fk.s * 3.4, 0.35);
        ctx.fillStyle = "rgba(255,200,120,.85)";
        ctx.beginPath(); ctx.arc(fk.x, y, fk.s * 0.35, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      for (const fk of far) drawKite(ctx, fk.x, fk.y + Math.sin(t * 0.9 + fk.ph) * 5, fk.s, Math.sin(t + fk.ph) * 0.2, fk.look, 0.42);
      ctx.strokeStyle = "rgba(30,35,70,.55)";
      ctx.lineWidth = 1.3;
      for (const b of birds) {
        const flap = Math.sin(t * 9 + b.ph) * b.s * 0.55;
        ctx.beginPath();
        ctx.moveTo(b.x - b.s, b.y - flap);
        ctx.quadraticCurveTo(b.x - b.s * 0.4, b.y - flap * 0.2, b.x, b.y);
        ctx.quadraticCurveTo(b.x + b.s * 0.4, b.y - flap * 0.2, b.x + b.s, b.y - flap);
        ctx.stroke();
      }
    }

    ctx.fillStyle = dark ? "#0e1840" : "rgba(43,57,144,.13)";
    ctx.fill(back!);

    ctx.lineWidth = 1;
    ctx.strokeStyle = dark ? "rgba(255,222,180,.38)" : "rgba(35,30,70,.42)";
    for (const k of ais) {
      if (k.state !== "cut" && k.str.length) {
        ctx.beginPath();
        ctx.moveTo(k.str[0][0], k.str[0][1]);
        for (const [x, y] of k.str) ctx.lineTo(x, y);
        ctx.stroke();
      }
      if (k.fall) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, k.fall.a);
        ctx.beginPath();
        ctx.moveTo(k.fall.pts[0][0], k.fall.pts[0][1]);
        for (const [x, y] of k.fall.pts) ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
      }
      if (k.state === "cut" && k.tail.length) {
        ctx.beginPath();
        ctx.moveTo(k.tail[0].x, k.tail[0].y);
        for (const p of k.tail) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    for (const k of ais) {
      if (dark) glow(ctx, k.x, k.y, k.s * 2.6, 0.12);
      drawKite(ctx, k.x, k.y, k.s, k.rot, k.look);
      if (k.state !== "cut") drawTag(k, dark);
      if (dark && k.lit && k.state !== "cut" && k.str.length) {
        const n = k.str.length;
        for (const idx of [n - 4, n - 6]) {
          const q = k.str[idx];
          ctx.strokeStyle = "rgba(255,222,180,.45)";
          ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] + k.s * 0.35); ctx.stroke();
          drawLantern(ctx, q[0], q[1] + k.s * 0.6, narrow ? 6 : 7.5, 0.85 + Math.sin(t * 9 + idx + k.ph) * 0.15);
        }
      }
    }

    ctx.lineWidth = 1.35;
    ctx.strokeStyle = dark ? "rgba(255,214,150,.8)" : "rgba(28,33,80,.8)";
    ctx.beginPath();
    ctx.moveTo(rope[0].x, rope[0].y);
    for (let i = 1; i < N - 1; i++) {
      const mx = (rope[i].x + rope[i + 1].x) / 2, my = (rope[i].y + rope[i + 1].y) / 2;
      ctx.quadraticCurveTo(rope[i].x, rope[i].y, mx, my);
    }
    ctx.lineTo(rope[N - 1].x, rope[N - 1].y);
    ctx.stroke();
    if (dark) glow(ctx, kite.x, kite.y, kite.s * 5, 0.38);
    drawKite(ctx, kite.x, kite.y, kite.s, kite.rot, dark ? PLAYER_NIGHT : PLAYER_DAY);
    if (dark) {
      for (const idx of [N - 5, N - 9, N - 13]) {
        const q = rope[idx];
        ctx.strokeStyle = "rgba(255,214,150,.6)";
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x, q.y + 6); ctx.stroke();
        drawLantern(ctx, q.x, q.y + 12, narrow ? 7 : 9, 0.85 + Math.sin(t * 8 + idx) * 0.15);
      }
    }
    for (const l of free) {
      const p = l.t / l.life;
      drawLantern(ctx, l.x, l.y, l.s * (1 - p * 0.8), 1, 1 - Math.max(0, p - 0.8) * 3);
    }
    for (const s of sparks) {
      const a = 1 - s.t / 0.6;
      ctx.strokeStyle = dark ? `rgba(255,200,110,${a})` : `rgba(214,67,43,${a})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2); ctx.stroke();
    }

    ctx.fillStyle = dark ? "#040820" : "#252b5e";
    ctx.fill(front!);
    if (dark && sky) {
      for (const w of sky.win) if (w.lit) {
        ctx.fillStyle = w.hue < 0.7 ? "rgba(255,200,110,.85)" : "rgba(255,236,190,.7)";
        ctx.fillRect(w.x, w.y, w.w, w.h);
      }
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    step(dt);
    draw();
  }
  const run = () => {
    cancelAnimationFrame(raf);
    if (visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  };
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; run(); }).observe(o.section);
  document.addEventListener("visibilitychange", run);
  new ResizeObserver(() => { resize(); draw(); }).observe(o.section);
  onTheme((th) => { theme = th; if (th === "light") free.length = 0; draw(); });
  resize();
  run();
  return { get total() { return total; } };
}
