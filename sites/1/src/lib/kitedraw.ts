// How a patang is drawn on a canvas: a square kite turned on its corner, the bamboo spine
// (dhaddo) and the bent bow (kamaan), a little paper tail (puchhdi), and the paper's pattern.

export type Pattern = "split" | "chand" | "band" | "tri";
export type KiteLook = { a: string; b: string; pattern: Pattern };

export const COLORS = {
  indigo: "#2b3990",
  saffron: "#f08a17",
  vermilion: "#d6432b",
  leaf: "#3d8a4e",
  gold: "#c99a2c",
  amber: "#eb960f",
  cream: "#fbf0d8",
  rose: "#c8375e",
};

export const LOOKS: KiteLook[] = [
  { a: COLORS.saffron, b: COLORS.indigo, pattern: "split" },
  { a: COLORS.vermilion, b: COLORS.cream, pattern: "chand" },
  { a: COLORS.leaf, b: COLORS.gold, pattern: "band" },
  { a: COLORS.indigo, b: COLORS.amber, pattern: "tri" },
  { a: COLORS.gold, b: COLORS.vermilion, pattern: "chand" },
  { a: COLORS.amber, b: COLORS.leaf, pattern: "split" },
  { a: COLORS.cream, b: COLORS.rose, pattern: "band" },
];

function body(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.98, -s * 0.06);
  ctx.lineTo(0, s * 1.02);
  ctx.lineTo(-s * 0.98, -s * 0.06);
  ctx.closePath();
}

export function drawKite(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, look: KiteLook, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = look.b;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.lineTo(-s * 0.26, s * 1.4);
  ctx.lineTo(s * 0.26, s * 1.4);
  ctx.closePath();
  ctx.fill();
  body(ctx, s);
  ctx.fillStyle = look.a;
  ctx.fill();
  ctx.save();
  body(ctx, s);
  ctx.clip();
  ctx.fillStyle = look.b;
  if (look.pattern === "split") ctx.fillRect(0, -s, s, s * 2.1);
  else if (look.pattern === "chand") { ctx.beginPath(); ctx.arc(0, s * 0.06, s * 0.36, 0, Math.PI * 2); ctx.fill(); }
  else if (look.pattern === "band") ctx.fillRect(-s, -s * 0.3, s * 2, s * 0.32);
  else { ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.52, -s * 0.5); ctx.lineTo(-s * 0.52, -s * 0.5); ctx.closePath(); ctx.fill(); }
  // light through the paper: one soft crease
  ctx.fillStyle = "rgba(255,255,255,.13)";
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(-s * 0.98, -s * 0.06);
  ctx.lineTo(0, -s * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = Math.max(0.7, s * 0.03);
  ctx.strokeStyle = "rgba(40,25,10,.32)";
  body(ctx, s);
  ctx.stroke();
  ctx.strokeStyle = "rgba(70,42,16,.62)";
  ctx.lineWidth = Math.max(0.8, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(0, s * 1.02);
  ctx.moveTo(-s * 0.98, -s * 0.06);
  ctx.quadraticCurveTo(0, -s * 0.8, s * 0.98, -s * 0.06);
  ctx.stroke();
  ctx.restore();
}

/** Soft warm light (used only in the night world, never as decoration on its own). */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number, rgb = "255,176,84") {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.45, `rgba(${rgb},${a * 0.32})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A tukkal: the paper lantern people tie to kite strings on Uttarayan night. */
export function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flicker: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  glow(ctx, x, y, s * 3.6, 0.42 * flicker);
  const w = s, h = s * 1.32;
  const g = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
  g.addColorStop(0, "#ffe7ad");
  g.addColorStop(0.55, "#ffb653");
  g.addColorStop(1, "#ef7b2c");
  ctx.fillStyle = g;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, w * 0.38);
  else ctx.rect(x - w / 2, y - h / 2, w, h);
  ctx.fill();
  ctx.fillStyle = "rgba(90,35,10,.75)";
  ctx.fillRect(x - w * 0.32, y - h / 2 - s * 0.12, w * 0.64, s * 0.16);
  ctx.fillRect(x - w * 0.32, y + h / 2 - s * 0.04, w * 0.64, s * 0.16);
  ctx.strokeStyle = "rgba(160,70,20,.35)";
  ctx.lineWidth = Math.max(0.6, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2);
  ctx.lineTo(x, y + h / 2);
  ctx.stroke();
  ctx.restore();
}
