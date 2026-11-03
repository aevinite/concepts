// The sky behind every page, kept to the side gutters so it never sits under text.
// Day: a few far-away kites bob in the margins (none on phones).
// Night: chains of tukkal lanterns tied on one string rise up both edges, with stars behind.
// 30 fps, paused when the tab is hidden.
import { getTheme, onTheme, type Theme } from "@shared/theme";
import { drawKite, drawLantern, LOOKS, type KiteLook } from "./kitedraw";
import { reduced } from "./utils";

type K = { x: number; y: number; s: number; ph: number; look: KiteLook };
type Chain = { x: number; y: number; n: number; s: number; vy: number; ph: number };
type S = { x: number; y: number; r: number; ph: number };

export function initAmbient() {
  const c = document.createElement("canvas");
  c.className = "ambient";
  c.setAttribute("aria-hidden", "true");
  document.body.prepend(c);
  const ctx = c.getContext("2d")!;
  let W = 0, H = 0, dpr = 1, theme: Theme = getTheme(), t = 0, last = 0, raf = 0;
  const kites: K[] = [], chains: Chain[] = [], stars: S[] = [];

  /** Width of the empty margin either side of the 1240 px content column. */
  const gutter = () => (W < 760 ? 18 : Math.max(0, (W - 1240) / 2 + 26));
  const edgeX = (left: boolean) => {
    const g = gutter();
    return left ? 6 + Math.random() * Math.max(4, g - 18) : W - 6 - Math.random() * Math.max(4, g - 18);
  };

  function resize() {
    const sameW = W === innerWidth;
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    if (sameW && (kites.length || chains.length)) return;
    kites.length = 0; chains.length = 0; stars.length = 0;
    const g = gutter();
    const nK = W < 760 || g < 40 ? 0 : 6;
    for (let i = 0; i < nK; i++) kites.push({ x: edgeX(i % 2 === 0), y: H * (0.1 + (i / nK) * 0.8), s: 5 + Math.random() * 5, ph: Math.random() * 6.28, look: LOOKS[i % LOOKS.length] });
    const nC = W < 760 ? 4 : 8;
    for (let i = 0; i < nC; i++) chains.push({ x: edgeX(i % 2 === 0), y: H * ((i + 0.5) / nC) * 1.3, n: 3 + (i % 2), s: W < 760 ? 3.6 : 4.6 + Math.random() * 1.6, vy: 0.18 + Math.random() * 0.16, ph: Math.random() * 6.28 });
    for (let i = 0; i < (W < 760 ? 60 : 120); i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1 + 0.25, ph: Math.random() * 6.28 });
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (theme === "light") {
      ctx.lineWidth = 1;
      for (const k of kites) {
        const x = k.x + Math.sin(t * 0.5 + k.ph) * 5, y = k.y + Math.sin(t * 0.6 + k.ph) * 8;
        const g = ctx.createLinearGradient(x, y, x, y + 80);
        g.addColorStop(0, "rgba(35,30,70,.22)");
        g.addColorStop(1, "rgba(35,30,70,0)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, y + k.s);
        ctx.quadraticCurveTo(x + 3, y + 45, x + 6, y + 80);
        ctx.stroke();
        drawKite(ctx, x, y, k.s, Math.sin(t * 0.9 + k.ph) * 0.18, k.look, 0.6);
      }
      return;
    }
    for (const s of stars) {
      ctx.fillStyle = `rgba(232,230,255,${0.2 + 0.55 * Math.abs(Math.sin(t * 0.7 + s.ph))})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,214,150,.35)";
    for (const ch of chains) {
      const gap = ch.s * 4.6;
      const sway = (j: number) => Math.sin(t * 0.8 + ch.ph + j * 0.5) * (2 + j * 1.5);
      ctx.beginPath();
      ctx.moveTo(ch.x + sway(0), ch.y - gap);
      for (let j = 0; j < ch.n; j++) ctx.lineTo(ch.x + sway(j), ch.y + j * gap);
      ctx.stroke();
      for (let j = 0; j < ch.n; j++) drawLantern(ctx, ch.x + sway(j), ch.y + j * gap + ch.s * 0.7, ch.s, 0.78 + Math.sin(t * 7 + ch.ph + j) * 0.12, 0.92);
    }
  }
  function step(dt: number) {
    const f = dt * 60;
    t += dt;
    for (const ch of chains) {
      ch.y -= ch.vy * f;
      if (ch.y < -ch.n * ch.s * 5) { ch.y = H + 30; ch.x = edgeX(Math.random() < 0.5); }
    }
  }
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return;
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.033);
    last = now;
    step(dt);
    draw();
  }
  const run = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reduced()) { last = 0; raf = requestAnimationFrame(frame); } else draw();
  };
  addEventListener("resize", () => { resize(); draw(); });
  document.addEventListener("visibilitychange", run);
  onTheme((th) => { theme = th; draw(); });
  resize();
  run();
}
