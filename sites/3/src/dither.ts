// Dithering: the light world sees every screenshot and poster as true 1-bit (Floyd–Steinberg),
// the dark world sees it as four-level amber phosphor. Film previews are dithered LIVE, frame by
// frame (ordered Bayer dither, which stays steady between frames instead of crawling).
import { getTheme } from "@shared/theme";

export const INK: [number, number, number] = [23, 22, 20];
export const PAPER: [number, number, number] = [242, 240, 233];
export const AMBER: [number, number, number][] = [[12, 8, 4], [86, 48, 9], [178, 108, 20], [255, 182, 64]];

export const BAYER8 = (() => {
  const m = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
  ];
  return Float32Array.from(m, (v) => (v + 0.5) / 64);
})();

const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

const out = new Map<string, ImageData>();

function fs(src: CanvasImageSource, w: number, hgt: number, dark: boolean): ImageData {
  const c = document.createElement("canvas");
  c.width = w; c.height = hgt;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.fillStyle = dark ? "#000" : "#fff";
  x.fillRect(0, 0, w, hgt);
  x.drawImage(src, 0, 0, w, hgt);
  const id = x.getImageData(0, 0, w, hgt);
  const d = id.data;
  const L = new Float32Array(w * hgt);
  for (let i = 0, p = 0; i < L.length; i++, p += 4) {
    let l = (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / 255;
    l = Math.min(1, Math.max(0, (l - 0.5) * 1.18 + 0.52));
    L[i] = l;
  }
  const levels = dark ? 3 : 1; // number of steps between 0 and 1
  for (let y = 0; y < hgt; y++) {
    for (let xx = 0; xx < w; xx++) {
      const i = y * w + xx;
      const old = L[i];
      const q = Math.round(Math.min(1, Math.max(0, old)) * levels) / levels;
      const err = old - q;
      L[i] = q;
      if (xx + 1 < w) L[i + 1] += (err * 7) / 16;
      if (y + 1 < hgt) {
        if (xx > 0) L[i + w - 1] += (err * 3) / 16;
        L[i + w] += (err * 5) / 16;
        if (xx + 1 < w) L[i + w + 1] += err / 16;
      }
    }
  }
  for (let i = 0, p = 0; i < L.length; i++, p += 4) {
    const col = dark ? AMBER[Math.round(L[i] * 3)] : L[i] > 0.5 ? PAPER : INK;
    d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
  }
  return id;
}

/** Draw a dithered copy of `src` into `canvas` at `w` px wide (height keeps the ratio). */
export async function ditherInto(canvas: HTMLCanvasElement, src: string, w: number) {
  canvas.dataset.dither = src;
  canvas.dataset.dw = String(w);
  const img = await loadImage(src).catch(() => null);
  if (!img) return;
  const ww = Math.max(16, Math.round(Math.min(w, img.naturalWidth)));
  const hh = Math.max(16, Math.round((ww * img.naturalHeight) / img.naturalWidth));
  const dark = getTheme() === "dark";
  const key = `${src}|${ww}|${dark ? 1 : 0}`;
  let id = out.get(key);
  if (!id) {
    id = fs(img, ww, hh, dark);
    out.set(key, id);
  }
  canvas.width = ww; canvas.height = hh;
  canvas.getContext("2d")!.putImageData(id, 0, 0);
  canvas.classList.add("ready");
}

/** A <canvas> that shows a dithered image. Re-dithers itself when the world switches. */
export function ditherCanvas(src: string, w: number, alt = "") {
  const c = document.createElement("canvas");
  c.className = "dith";
  if (alt) { c.setAttribute("role", "img"); c.setAttribute("aria-label", alt); } else c.setAttribute("aria-hidden", "true");
  // Lazy: dither when it first comes near the screen.
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); ditherInto(c, src, w); }
  }, { rootMargin: "300px" });
  io.observe(c);
  c.dataset.dither = src; c.dataset.dw = String(w);
  return c;
}

export function refreshDithers() {
  document.querySelectorAll<HTMLCanvasElement>("canvas.dith.ready").forEach((c) => {
    if (c.dataset.dither) ditherInto(c, c.dataset.dither, Number(c.dataset.dw) || 480);
  });
}

/**
 * Live ordered dither of a playing (muted) video into a canvas. Returns a stop function.
 * Runs at ~24 fps, only while the video plays.
 */
export function liveDither(video: HTMLVideoElement, canvas: HTMLCanvasElement, w = 256) {
  const x = canvas.getContext("2d", { willReadFrequently: true })!;
  let raf = 0, last = 0, alive = true;
  const step = (t: number) => {
    if (!alive) return;
    raf = requestAnimationFrame(step);
    if (video.paused || video.readyState < 2 || t - last < 40) return;
    last = t;
    const vw = video.videoWidth || 16, vh = video.videoHeight || 9;
    const W = w, H = Math.round((w * vh) / vw);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    x.drawImage(video, 0, 0, W, H);
    const id = x.getImageData(0, 0, W, H);
    const d = id.data;
    const dark = getTheme() === "dark";
    for (let yy = 0, p = 0; yy < H; yy++) {
      for (let xx = 0; xx < W; xx++, p += 4) {
        let l = (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / 255;
        l = Math.min(1, Math.max(0, (l - 0.5) * 1.25 + 0.55));
        const th = BAYER8[(yy & 7) * 8 + (xx & 7)];
        let col: [number, number, number];
        if (dark) {
          const v = l * 3, base = Math.floor(v), f = v - base;
          col = AMBER[Math.min(3, base + (f > th ? 1 : 0))];
        } else col = l > th ? PAPER : INK;
        d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
      }
    }
    x.putImageData(id, 0, 0);
    canvas.classList.add("ready");
  };
  raf = requestAnimationFrame(step);
  return () => { alive = false; cancelAnimationFrame(raf); };
}
