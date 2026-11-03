// The desktop wallpaper, drawn as real ordered dither (Bayer 8x8) into a small canvas that is
// scaled up with crisp pixels.
//  light: a still 1-bit gradient that thickens into the classic checkerboard; your pointer is a
//         small lamp that thins the dither around it.
//  dark:  a slow amber plasma on the phosphor; the pointer heats it up and leaves a glow.
import { getTheme } from "@shared/theme";
import { BAYER8 } from "./dither";
import { reduced } from "./dom";

type RGB = [number, number, number];
const L_INK: RGB = [23, 22, 20], L_PAP: RGB = [242, 240, 233];
const D_BG: RGB = [11, 8, 4], D_DIM: RGB = [58, 34, 7], D_MID: RGB = [128, 76, 14];

export function wallpaper(canvas: HTMLCanvasElement, clear: () => DOMRect[]) {
  const ctx = canvas.getContext("2d")!;
  let W = 0, H = 0, cell = 2, cw = 0, ch = 0, img: ImageData | null = null;
  let px = -999, py = -999, tx = -999, ty = -999, heat = 0;
  let raf = 0, running = false, t0 = performance.now(), last = 0, paused = false;
  let clears: DOMRect[] = [];
  let origin = { x: 0, y: 0 };

  function size() {
    const r = canvas.getBoundingClientRect();
    origin = { x: r.left, y: r.top };
    W = r.width; H = r.height;
    const dark = getTheme() === "dark";
    cell = dark ? 3 : 2;
    cw = Math.max(1, Math.ceil(W / cell)); ch = Math.max(1, Math.ceil(H / cell));
    canvas.width = cw; canvas.height = ch;
    img = ctx.createImageData(cw, ch);
    clears = clear().map((c) => new DOMRect((c.left - origin.x) / cell, (c.top - origin.y) / cell, c.width / cell, c.height / cell));
  }

  function draw(time: number) {
    if (!img) return;
    const d = img.data;
    const dark = getTheme() === "dark";
    const t = (time - t0) / 1000;
    const pcx = (px - origin.x) / cell, pcy = (py - origin.y) / cell;
    const pr = (dark ? 120 : 150) / cell;
    const pr2 = pr * pr;
    const pad = 46 / cell;
    for (let y = 0, p = 0; y < ch; y++) {
      const v = y / ch;
      for (let x = 0; x < cw; x++, p += 4) {
        const u = x / cw;
        let dens: number;
        if (!dark) {
          dens = Math.min(0.5, Math.max(0, u * 0.62 + v * 0.55 - 0.36)) + Math.max(0, v - 0.86) * 1.1;
        } else {
          const s = Math.sin(x * 0.045 + t * 0.6) + Math.sin(y * 0.06 - t * 0.8) + Math.sin((x + y) * 0.028 + t * 0.35) + Math.sin(Math.hypot(x - cw * 0.7, y - ch * 0.4) * 0.05 - t);
          dens = 0.2 + s * 0.09 + v * 0.12;
        }
        // keep the hero text area clean
        for (let k = 0; k < clears.length; k++) {
          const c = clears[k];
          const dx = Math.max(c.x - x, 0, x - (c.x + c.width));
          const dy = Math.max(c.y - y, 0, y - (c.y + c.height));
          const dd = Math.hypot(dx, dy);
          if (dd < pad) dens *= dd / pad;
        }
        let lamp = 0;
        const ddx = x - pcx, ddy = y - pcy, d2 = ddx * ddx + ddy * ddy;
        if (d2 < pr2) lamp = 1 - Math.sqrt(d2) / pr;
        const th = BAYER8[(y & 7) * 8 + (x & 7)];
        let col: RGB;
        if (!dark) {
          dens = Math.max(0, dens - lamp * 0.55);
          col = dens > th ? L_INK : L_PAP;
        } else {
          dens = Math.min(1, dens + lamp * lamp * 0.9 * heat);
          col = dens > th ? (dens > 0.55 && dens - 0.55 > th * 0.45 ? D_MID : D_DIM) : D_BG;
        }
        d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop(time: number) {
    raf = 0;
    if (paused) { running = false; return; }
    const dark = getTheme() === "dark";
    // ease the lamp toward the pointer
    px += (tx - px) * 0.22; py += (ty - py) * 0.22;
    heat += ((tx > -900 ? 1 : 0) - heat) * 0.08;
    const moving = Math.abs(tx - px) + Math.abs(ty - py) > 0.5;
    if (time - last > (dark ? 42 : 16)) { draw(time); last = time; }
    if ((dark && !reduced()) || moving) raf = requestAnimationFrame(loop);
    else running = false;
  }
  function kick() {
    if (running || paused) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX; ty = e.clientY;
    if (px < -900) { px = tx; py = ty; }
    kick();
  };
  addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerleave", () => { tx = ty = -999; kick(); });
  const ro = new ResizeObserver(() => { size(); draw(performance.now()); });
  ro.observe(canvas);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { paused = true; } else { paused = false; kick(); } });

  size(); draw(performance.now()); kick();
  return {
    refresh() { size(); draw(performance.now()); kick(); },
    pause(v: boolean) { paused = v; if (!v) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; running = false; } },
  };
}
