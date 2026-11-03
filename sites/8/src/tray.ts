// The Process tray: a small marbling tray drawn with vector maths (Jaffer's drop and tine
// transforms on polygons) so it can be scrubbed by scroll, backwards and forwards, exactly.
// Four stages of an Ebru print = the four steps of our process.
import { getTheme } from "@shared/theme";
import { PIGMENTS, type PigmentId } from "./bath";

type V = [number, number];
type Drop = { c: V; r: number; id: PigmentId; at: number };

const N = 220;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (t: number) => t * t * (3 - 2 * t);

// fixed composition so every visitor sees the same print being made
function plan(): Drop[] {
  const ids: PigmentId[] = ["indigo", "saffron", "terracotta", "sap", "gold", "cream", "indigo", "amber", "cream", "terracotta", "gold", "sap", "cream", "indigo"];
  const pts: V[] = [[0.3, 0.35], [0.7, 0.62], [0.5, 0.5], [0.18, 0.72], [0.82, 0.3], [0.5, 0.5], [0.62, 0.22], [0.32, 0.8], [0.3, 0.35], [0.85, 0.78], [0.12, 0.2], [0.7, 0.62], [0.82, 0.3], [0.5, 0.5]];
  const rs = [0.2, 0.17, 0.16, 0.12, 0.13, 0.08, 0.1, 0.1, 0.07, 0.09, 0.08, 0.07, 0.05, 0.05];
  return ids.map((id, i) => ({ id, c: pts[i], r: rs[i], at: i / ids.length }));
}

export class Tray {
  private x: CanvasRenderingContext2D;
  private drops = plan();
  private last = -1;
  private dpr = Math.min(devicePixelRatio || 1, 2);
  constructor(private canvas: HTMLCanvasElement) {
    this.x = canvas.getContext("2d")!;
    new ResizeObserver(() => this.size()).observe(canvas);
    this.size();
  }
  private size() {
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(2, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(2, Math.round(r.height * this.dpr));
    const p = this.last; this.last = -1; this.draw(Math.max(0, p));
  }

  /** p: 0..1 across the four stages. */
  draw(p: number) {
    if (Math.abs(p - this.last) < 0.0005) return;
    this.last = p;
    const dark = getTheme() === "dark";
    const { x } = this;
    const W = this.canvas.width, H = this.canvas.height;
    const s1 = clamp(p / 0.25), s2 = clamp((p - 0.25) / 0.25), s3 = clamp((p - 0.5) / 0.25), s4 = clamp((p - 0.75) / 0.25);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, W, H);

    // the tray (tekne)
    const pad = Math.round(Math.min(W, H) * 0.06);
    const tw = W - pad * 2, th = H - pad * 2;
    x.fillStyle = dark ? "#020d10" : "#e9dcc1";
    x.fillRect(0, 0, W, H);
    x.fillStyle = dark ? "#041b20" : "#efe4cf";
    x.fillRect(pad, pad, tw, th);

    // stage 1: the size is poured and checked: still water, ripple lines settle
    const settle = ease(s1);
    x.save();
    x.beginPath(); x.rect(pad, pad, tw, th); x.clip();
    const lines = 7;
    for (let i = 0; i < lines; i++) {
      const yy = pad + th * ((i + 0.5) / lines);
      x.beginPath();
      for (let k = 0; k <= 40; k++) {
        const xx = pad + (tw * k) / 40;
        const amp = (1 - settle) * th * 0.02 + th * 0.002;
        x.lineTo(xx, yy + Math.sin(k * 0.6 + i * 1.7 + p * 30) * amp);
      }
      x.strokeStyle = dark ? `rgba(80,240,220,${0.08 + 0.1 * (1 - s2)})` : `rgba(90,70,40,${0.1 * (1 - s2)})`;
      x.lineWidth = this.dpr;
      x.stroke();
    }

    // stage 2: drops fall one after another; stage 3: comb
    const polys: { pts: V[]; id: PigmentId }[] = [];
    const k2 = s2 * this.drops.length;
    const aspect = tw / th;
    this.drops.forEach((d, i) => {
      const grow = clamp(k2 - i);
      if (grow <= 0) return;
      const r = d.r * ease(grow);
      // every older drop is pushed out by this one
      for (const pl of polys) for (const v of pl.pts) push(v, d.c, r, aspect);
      const pts: V[] = [];
      for (let j = 0; j < N; j++) { const a = (j / N) * Math.PI * 2; pts.push([d.c[0] + (Math.cos(a) * r) / aspect, d.c[1] + Math.sin(a) * r]); }
      polys.push({ pts, id: d.id });
    });
    if (s3 > 0) {
      const z1 = ease(clamp(s3 * 2)) * 0.12, z2 = ease(clamp(s3 * 2 - 1)) * 0.09;
      for (const pl of polys) for (const v of pl.pts) {
        tine(v, [1, 0], 0.5, z1, 0.02, 0.16, true, aspect);
        if (z2 > 0) tine(v, [0, 1], 0.5, z2, 0.012, 0.075, false, aspect);
      }
    }
    for (const pl of polys) {
      x.beginPath();
      pl.pts.forEach((v, j) => { const X = pad + v[0] * tw, Y = pad + v[1] * th; j ? x.lineTo(X, Y) : x.moveTo(X, Y); });
      x.closePath();
      if (dark) {
        x.fillStyle = PIGMENTS[pl.id].dark + (pl.id === "cream" ? "40" : "2a");
        x.fill();
        x.strokeStyle = PIGMENTS[pl.id === "cream" ? "indigo" : pl.id].dark;
        x.lineWidth = 1.3 * this.dpr;
        x.shadowColor = x.strokeStyle; x.shadowBlur = 8 * this.dpr;
        x.stroke(); x.shadowBlur = 0;
      } else {
        x.fillStyle = PIGMENTS[pl.id].light;
        x.fill();
        x.strokeStyle = "rgba(30,25,20,.28)"; x.lineWidth = 0.8 * this.dpr; x.stroke();
      }
    }
    x.restore();

    // stage 4: lay the paper, lift the print, and the print is repeated
    if (s4 > 0) {
      const lay = ease(clamp(s4 * 2.2));
      const lift = ease(clamp(s4 * 2.2 - 1.1));
      if (lift <= 0) {
        x.fillStyle = dark ? `rgba(6,30,34,${0.88 * lay})` : `rgba(251,246,234,${0.92 * lay})`;
        const yy = pad + th * (1 - lay);
        x.fillRect(pad - 2, pad, tw + 4, th * lay);
        x.fillStyle = dark ? "rgba(120,255,230,.6)" : "rgba(30,25,20,.25)";
        x.fillRect(pad, Math.min(yy + th * lay, H - pad) - 2, tw, 2);
      } else {
        // the print, shrunk and repeated: one good system, many copies
        const copies = 1 + Math.floor(ease(lift) * 3.999);
        const src = document.createElement("canvas"); src.width = tw; src.height = th;
        src.getContext("2d")!.drawImage(this.canvas, pad, pad, tw, th, 0, 0, tw, th);
        x.fillStyle = dark ? "#020d10" : "#e9dcc1";
        x.fillRect(0, 0, W, H);
        const gap = pad * 0.6;
        const scale = copies === 1 ? 1 - 0.18 * lift : (1 - gap * 3 / tw) / 2;
        const cw = tw * scale, ch = th * scale;
        const pos: V[] = copies === 1 ? [[(W - cw) / 2, (H - ch) / 2]] : [[pad, pad], [pad + cw + gap, pad], [pad, pad + ch + gap], [pad + cw + gap, pad + ch + gap]];
        const ox = copies === 1 ? 0 : (W - (cw * 2 + gap)) / 2 - pad, oy = copies === 1 ? 0 : (H - (ch * 2 + gap)) / 2 - pad;
        pos.slice(0, copies === 1 ? 1 : copies).forEach(([px, py], i) => {
          const m = cw * 0.06;
          x.fillStyle = dark ? "#0a2a2f" : "#fbf6ea";
          if (!dark) { x.shadowColor = "rgba(40,30,15,.18)"; x.shadowBlur = 10 * this.dpr; x.shadowOffsetY = 3 * this.dpr; }
          x.fillRect(px + ox, py + oy, cw, ch);
          x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetY = 0;
          x.globalAlpha = i === copies - 1 && copies > 1 ? clamp((ease(lift) * 3.999) % 1 + 0.25) : 1;
          x.drawImage(src, px + ox + m, py + oy + m, cw - m * 2, ch - m * 2);
          x.globalAlpha = 1;
          if (dark) { x.strokeStyle = "rgba(80,240,220,.5)"; x.lineWidth = this.dpr; x.strokeRect(px + ox + 0.5, py + oy + 0.5, cw - 1, ch - 1); }
        });
      }
    }
  }
}

function push(v: V, c: V, r: number, aspect: number) {
  let dx = (v[0] - c[0]) * aspect; const dy = v[1] - c[1];
  const d2 = dx * dx + dy * dy || 1e-9;
  const k = Math.sqrt(1 + (r * r) / d2);
  dx *= k;
  v[0] = c[0] + dx / aspect; v[1] = c[1] + dy * k;
}

function tine(v: V, dir: V, origin: number, z: number, lambda: number, spacing: number, alternate: boolean, aspect: number) {
  // dir is axis aligned here: [1,0] = horizontal strokes, [0,1] = vertical strokes
  const t = dir[0] ? v[1] - origin : (v[0] - origin) * aspect;
  const kk = Math.floor(t / spacing + 0.5);
  const d = Math.abs(t - kk * spacing);
  const sgn = alternate && kk % 2 !== 0 ? -1 : 1;
  const f = (z * lambda) / (d + lambda) * sgn;
  if (dir[0]) v[0] += f / aspect; else v[1] += f;
}
