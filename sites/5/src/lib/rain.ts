// Noir rain: canvas streaks across the whole page, only in the dark world. The reader carries an
// umbrella: rain parts around the pointer (or finger) and splashes off its edge. Pauses when the
// tab is hidden or the light world is on. Reduced motion: a still, sparse drizzle.
import { getTheme, onTheme } from "@shared/theme";
import { reduced } from "./util";

type Drop = { x: number; y: number; l: number; v: number; w: number };
type Splash = { x: number; y: number; vx: number; vy: number; life: number };

export function initRain() {
  const cv = document.createElement("canvas");
  cv.className = "rain";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const umb = document.createElement("div");
  umb.className = "umbrella";
  umb.setAttribute("aria-hidden", "true");
  umb.innerHTML = `<svg viewBox="0 0 64 64"><path d="M4 30 Q32 -2 60 30 Q53 25 46 30 Q39 25 32 30 Q25 25 18 30 Q11 25 4 30Z"/><path class="u-h" d="M32 30 L32 52 Q32 58 26 58 Q21 58 21 53"/></svg>`;
  document.body.append(umb);
  const g = cv.getContext("2d")!;
  let W = 0, H = 0, dpr = 1, drops: Drop[] = [], splashes: Splash[] = [], raf = 0, running = false;
  const ptr = { x: -999, y: -999, on: false, tx: -999, ty: -999 };
  const R = 74;

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / (innerWidth < 760 ? 5200 : 3600));
    drops = Array.from({ length: n }, () => mk(true));
    if (!running) still();
  };
  const mk = (anyY = false): Drop => ({ x: Math.random() * (W + 200) - 100, y: anyY ? Math.random() * H : -40 - Math.random() * 100, l: 10 + Math.random() * 22, v: 9 + Math.random() * 9, w: Math.random() < 0.15 ? 1.6 : 0.9 });

  const draw = () => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = "rgba(220,225,232,.34)";
    g.lineCap = "round";
    const sx = -0.22;
    ptr.x += (ptr.tx - ptr.x) * 0.25; ptr.y += (ptr.ty - ptr.y) * 0.25;
    for (const d of drops) {
      const dx = d.x - ptr.x, dy = d.y - (ptr.y - 6);
      if (ptr.on && dy < 4 && dy > -R * 1.2 && Math.abs(dx) < R) {
        // under the umbrella: the drop hits the canopy and splashes off
        if (dy > -R * 0.45 && Math.random() < 0.4) splashes.push({ x: d.x, y: d.y, vx: (dx > 0 ? 1 : -1) * (1 + Math.random() * 2.5), vy: -1.5 - Math.random() * 2, life: 1 });
        if (dy > -R * 0.45) { Object.assign(d, mk()); continue; }
      }
      g.lineWidth = d.w;
      g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x + sx * d.l, d.y + d.l); g.stroke();
      d.y += d.v; d.x += sx * d.v;
      if (d.y > H + 20) Object.assign(d, mk());
    }
    g.fillStyle = "rgba(235,238,242,.6)";
    splashes = splashes.filter((s) => (s.life -= 0.05) > 0);
    for (const s of splashes) { s.x += s.vx; s.y += s.vy; s.vy += 0.35; g.fillRect(s.x, s.y, 1.6, 1.6); }
    if (running) raf = requestAnimationFrame(draw);
  };
  const still = () => {
    g.clearRect(0, 0, W, H);
    if (getTheme() !== "dark") return;
    g.strokeStyle = "rgba(220,225,232,.22)"; g.lineWidth = 1;
    for (const d of drops.slice(0, drops.length / 2)) { g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 0.22 * d.l, d.y + d.l); g.stroke(); }
  };
  const update = () => {
    const want = getTheme() === "dark" && !document.hidden && !reduced();
    if (want && !running) { running = true; raf = requestAnimationFrame(draw); }
    if (!want && running) { running = false; cancelAnimationFrame(raf); }
    if (!want) still();
  };

  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", update);
  onTheme(update);
  const fine = matchMedia("(pointer: fine)").matches;
  addEventListener("pointermove", (e) => {
    ptr.tx = e.clientX; ptr.ty = e.clientY; ptr.on = true;
    if (ptr.x < -900) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
    if (fine) { umb.style.transform = `translate(${e.clientX - 32}px, ${e.clientY - 40}px)`; document.body.classList.add("umb-live"); }
  }, { passive: true });
  addEventListener("pointerdown", (e) => { ptr.tx = e.clientX; ptr.ty = e.clientY; ptr.on = true; }, { passive: true });
  document.addEventListener("pointerleave", () => (ptr.on = false));
  if (fine) document.body.classList.add("has-umbrella");
  resize();
  update();
}

/** A double lightning flash (theme switch into the dark world, and an occasional distant one). */
export function lightning(onPeak?: () => void) {
  const f = document.createElement("div");
  f.className = "flash";
  document.body.append(f);
  if (reduced()) { onPeak?.(); f.remove(); return; }
  const a = f.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.08 }, { opacity: 0.1, offset: 0.2 }, { opacity: 0.85, offset: 0.3 }, { opacity: 0, offset: 1 }], { duration: 900, easing: "linear" });
  setTimeout(() => onPeak?.(), 80);
  a.onfinish = () => f.remove();
}
