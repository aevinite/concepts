// Celebrations, drawn on a canvas that exists only while it plays (about four seconds):
// by day a confetti of tiny paper kites and marigold petals; by night fireworks of light and
// little diyas floating up. Never loops, never runs off screen, skipped for reduced motion.
import { reduced } from "./util";

type Bit = { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; k: number; life: number; trail?: [number, number][] };

const DAY = ["#b8381f", "#26386b", "#c98b22", "#4c7337", "#d9881a", "#7c2b2b"];
const NIGHT = ["#ffcf73", "#ff9a3c", "#ffe7b0", "#7fe3cf", "#ff7a59"];

export function celebrate(dark: boolean, origin?: { x: number; y: number }, host: HTMLElement = document.body) {
  if (reduced()) return;
  const cv = document.createElement("canvas");
  cv.className = "fx-canvas";
  cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  const dpr = Math.min(devicePixelRatio || 1, matchMedia("(max-width: 720px)").matches ? 1.5 : 2);
  const W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext("2d")!;
  g.scale(dpr, dpr);
  const bits: Bit[] = [];
  const ox = origin?.x ?? W / 2, oy = origin?.y ?? H / 2;
  const phone = W < 720;
  if (!dark) {
    const n = phone ? 70 : 140;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 6 + Math.random() * 10;
      bits.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, s: 6 + Math.random() * 8, c: DAY[i % DAY.length], k: i % 4 === 0 ? 1 : 0, life: 1 });
    }
  } else {
    const shells = phone ? 5 : 8;
    for (let b = 0; b < shells; b++) {
      const cx = W * (0.15 + Math.random() * 0.7), cy = H * (0.15 + Math.random() * 0.4), col = NIGHT[b % NIGHT.length];
      const delay = b * 14;
      for (let i = 0; i < (phone ? 34 : 54); i++) {
        const a = (i / 54) * Math.PI * 2, sp = 2.2 + Math.random() * 3.4;
        bits.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 0, vr: 0, s: 2, c: col, k: 2, life: 1 + delay / 60, trail: [] });
      }
    }
    for (let i = 0; i < (phone ? 10 : 18); i++) {
      bits.push({ x: Math.random() * W, y: H + 20 + Math.random() * 100, vx: (Math.random() - 0.5) * 0.4, vy: -1.4 - Math.random() * 1.6, r: 0, vr: 0, s: 10 + Math.random() * 6, c: "#ffcf73", k: 3, life: 1.6 });
    }
  }
  let frame = 0, raf = 0;
  const kite = (b: Bit) => {
    g.save(); g.translate(b.x, b.y); g.rotate(b.r);
    g.fillStyle = b.c;
    g.beginPath(); g.moveTo(0, -b.s); g.lineTo(b.s * 0.75, 0); g.lineTo(0, b.s * 1.1); g.lineTo(-b.s * 0.75, 0); g.closePath(); g.fill();
    g.strokeStyle = "rgba(43,29,20,.55)"; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(0, -b.s); g.lineTo(0, b.s * 1.1); g.moveTo(-b.s * 0.75, 0); g.lineTo(b.s * 0.75, 0); g.stroke();
    g.beginPath(); g.moveTo(0, b.s * 1.1); g.quadraticCurveTo(b.s * 0.6, b.s * 1.8, 0, b.s * 2.4); g.stroke();
    g.restore();
  };
  const petal = (b: Bit) => {
    g.save(); g.translate(b.x, b.y); g.rotate(b.r);
    g.fillStyle = b.c; g.beginPath(); g.ellipse(0, 0, b.s * 0.35, b.s * 0.6, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  const lamp = (b: Bit) => {
    const fl = 0.85 + Math.random() * 0.3;
    g.save(); g.translate(b.x, b.y);
    g.globalAlpha = Math.min(1, b.life);
    g.fillStyle = "rgba(255,170,60,.25)"; g.beginPath(); g.arc(0, -b.s * 0.6, b.s * 1.4 * fl, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffd27a"; g.beginPath(); g.ellipse(0, -b.s * 0.65, b.s * 0.28, b.s * 0.55 * fl, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#c2632b"; g.beginPath(); g.ellipse(0, 0, b.s * 0.9, b.s * 0.32, 0, 0, Math.PI); g.fill();
    g.restore();
  };
  const step = () => {
    frame++;
    g.clearRect(0, 0, W, H);
    if (dark) g.globalCompositeOperation = "lighter";
    let alive = 0;
    for (const b of bits) {
      if (b.k === 2) {
        if (b.life > 1) { b.life -= 1 / 60; continue; }
        b.trail!.push([b.x, b.y]); if (b.trail!.length > 7) b.trail!.shift();
        b.vx *= 0.975; b.vy = b.vy * 0.975 + 0.035; b.x += b.vx; b.y += b.vy; b.life -= 0.011;
        if (b.life <= 0) continue;
        alive++;
        g.strokeStyle = b.c; g.globalAlpha = Math.max(0, b.life); g.lineWidth = 1.6; g.lineCap = "round";
        g.beginPath(); b.trail!.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(b.x, b.y); g.stroke();
        g.fillStyle = "#fff4d6"; g.beginPath(); g.arc(b.x, b.y, 1.3, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
      } else if (b.k === 3) {
        b.x += b.vx + Math.sin((frame + b.s * 10) / 30) * 0.3; b.y += b.vy; b.life -= 0.004;
        if (b.life <= 0 || b.y < -40) continue;
        alive++;
        g.globalCompositeOperation = "source-over"; lamp(b); if (dark) g.globalCompositeOperation = "lighter";
      } else {
        b.vy += 0.22; b.vx *= 0.985; b.vy *= 0.985; b.vy = Math.min(b.vy, 2.6 + b.s * 0.08);
        b.x += b.vx + Math.sin((frame + b.s * 7) / 14) * 0.6; b.y += b.vy; b.r += b.vr;
        if (b.y > H + 40) continue;
        alive++;
        if (b.k === 1) kite(b); else petal(b);
      }
    }
    g.globalCompositeOperation = "source-over";
    if (alive && frame < 60 * 6) raf = requestAnimationFrame(step);
    else cv.remove();
  };
  raf = requestAnimationFrame(step);
  const stop = () => { cancelAnimationFrame(raf); cv.remove(); };
  document.addEventListener("visibilitychange", stop, { once: true });
}
