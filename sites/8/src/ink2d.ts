// The paper fallback: when a device can't run the GPU fluid (no float textures, WebGL off), the
// same bath API is drawn with Canvas 2D. Drops, smears and comb strokes are approximations, but
// the page still looks marbled and still answers every touch. Never a blank page.
import type { Mode, RGB } from "./fluid";

const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

export class Ink2D {
  mode: Mode = "light";
  velocityDissipation = 0;
  dyeDissipation = 0;
  maskRect: [number, number, number, number] = [0, 0, 0, 0];
  colors = { paper: [0.96, 0.925, 0.86] as RGB, paperDeep: [0.93, 0.885, 0.8] as RGB, sea: [0.02, 0.11, 0.12] as RGB, seaDeep: [0.004, 0.035, 0.045] as RGB, spark: [0.55, 1, 0.92] as RGB };
  private ctx: CanvasRenderingContext2D;
  private ink = document.createElement("canvas");
  private ictx: CanvasRenderingContext2D;
  private tmp = document.createElement("canvas");
  private halo: HTMLCanvasElement | null = null;
  private scale = 0.5;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.ictx = this.ink.getContext("2d")!;
    this.initFramebuffers();
  }

  get W() { return this.ink.width; }
  get H() { return this.ink.height; }

  initFramebuffers() {
    const w = Math.max(2, Math.round(this.canvas.width * this.scale)), h = Math.max(2, Math.round(this.canvas.height * this.scale));
    if (w === this.ink.width && h === this.ink.height) return;
    const old = this.ink.width > 2 ? (() => { const c = document.createElement("canvas"); c.width = this.ink.width; c.height = this.ink.height; c.getContext("2d")!.drawImage(this.ink, 0, 0); return c; })() : null;
    this.ink.width = w; this.ink.height = h;
    if (old) this.ictx.drawImage(old, 0, 0, w, h);
  }

  setMask(source: CanvasImageSource | null, rect?: [number, number, number, number]) {
    if (!source) { this.halo = null; return; }
    const s = source as HTMLCanvasElement;
    const c = this.halo ?? document.createElement("canvas");
    c.width = s.width; c.height = s.height;
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(s, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = this.mode === "dark" ? css(this.colors.sea) : css(this.colors.paper);
    x.fillRect(0, 0, c.width, c.height);
    // the mask is white text on black: knock the black out so only the halo stays
    this.halo = c;
    if (rect) this.maskRect = rect;
  }

  splat(x: number, y: number, dx: number, dy: number, color: RGB | null, radius: number, amount = 1) {
    const px = x * this.W, py = (1 - y) * this.H;
    const r = Math.sqrt(radius / 100) * this.H * 0.9;
    const c = this.ictx;
    const sx = dx * 0.0006 * this.W, sy = -dy * 0.0006 * this.H;
    if (Math.abs(sx) + Math.abs(sy) > 0.5) {
      const size = Math.ceil(r * 2);
      this.tmp.width = size; this.tmp.height = size;
      const t = this.tmp.getContext("2d")!;
      t.drawImage(this.ink, px - r, py - r, size, size, 0, 0, size, size);
      c.save();
      c.beginPath(); c.arc(px + sx, py + sy, r, 0, Math.PI * 2); c.clip();
      c.globalAlpha = 0.55;
      c.drawImage(this.tmp, px - r + sx, py - r + sy);
      c.restore();
    }
    if (!color) return;
    const g = c.createRadialGradient(px, py, 0, px, py, r * 0.8);
    g.addColorStop(0, css(color, Math.min(1, amount)));
    g.addColorStop(1, css(color, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(px, py, r * 0.8, 0, Math.PI * 2); c.fill();
  }

  drop(x: number, y: number, radius: number, color: RGB, density = 1) {
    const px = x * this.W, py = (1 - y) * this.H, r = radius * this.H;
    const c = this.ictx;
    // push what is there outward a little, like a real drop spreading on the size
    const R = r * 2.6, size = Math.ceil(R * 2);
    this.tmp.width = size; this.tmp.height = size;
    const t = this.tmp.getContext("2d")!;
    t.drawImage(this.ink, px - R, py - R, size, size, 0, 0, size, size);
    c.save();
    c.beginPath(); c.arc(px, py, R * 1.18, 0, Math.PI * 2); c.clip();
    c.drawImage(this.tmp, px - R * 1.18, py - R * 1.18, size * 1.18, size * 1.18);
    c.restore();
    c.fillStyle = css(color, density);
    c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
  }

  tine(dirX: number, dirY: number, ox: number, oy: number, z: number, lambda: number, spacing: number, alternate = false) {
    // thin slices, each shifted by the same falloff the GPU comb uses, so the result stays smooth
    const vertical = Math.abs(dirY) > Math.abs(dirX);
    const W = this.W, H = this.H;
    const along = vertical ? H : W, across = vertical ? W : H;
    const shift = z * along * Math.sign(vertical ? -dirY : dirX);
    const sp = spacing > 0 ? spacing * H : 0;
    const o = (vertical ? ox * W : (1 - oy) * H);
    this.tmp.width = W; this.tmp.height = H;
    this.tmp.getContext("2d")!.drawImage(this.ink, 0, 0);
    const step = 2;
    for (let a = 0; a < across; a += step) {
      let t = a + step / 2 - o, sgn = 1;
      if (sp > 0) { const k = Math.floor(t / sp + 0.5); t -= k * sp; if (alternate && k % 2) sgn = -1; }
      const d = Math.abs(t) / H;
      const k = shift * (lambda / (d + lambda)) * sgn;
      if (Math.abs(k) < 0.3) continue;
      if (vertical) this.ictx.drawImage(this.tmp, a, 0, step, H, a, k, step, H);
      else this.ictx.drawImage(this.tmp, 0, a, W, step, k, a, W, step);
    }
  }

  fade(k: number) {
    const c = this.ictx;
    c.save();
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = `rgba(0,0,0,${1 - k})`;
    c.fillRect(0, 0, this.W, this.H);
    c.restore();
  }

  step(dt: number) {
    if (this.mode === "dark" && this.dyeDissipation > 0) this.fade(1 / (1 + this.dyeDissipation * dt));
  }

  render(_time: number, withMask = true) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    if (this.mode === "light") {
      const g = ctx.createLinearGradient(0, H, 0, 0);
      g.addColorStop(0, css(this.colors.paperDeep)); g.addColorStop(1, css(this.colors.paper));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(this.ink, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, H, 0, 0);
      g.addColorStop(0, css(this.colors.seaDeep)); g.addColorStop(1, css(this.colors.sea));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(this.ink, 0, 0, W, H); ctx.restore();
    }
    if (withMask && this.halo) {
      const [x, y, w, h] = this.maskRect;
      ctx.drawImage(this.halo, x * W, (1 - y - h) * H, w * W, h * H);
    }
  }
}
