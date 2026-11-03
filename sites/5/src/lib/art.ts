// Every drawing in the comic, as SVG strings. Fills are CSS classes (f-*) so the same line art
// re-inks itself for the noir world: colour + Ben-Day dots in light, white ink + screentone in dark.
// The people are invented comic characters, drawn here. None of them is a real client.
import { rng } from "./util";

/* ---------- shared defs: halftone patterns + the head clip used for face shading ---------- */
export function defsSVG() {
  return `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <defs>
    <pattern id="p5-dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
      <circle class="pt-dot" cx="3.5" cy="3.5" r="1.7"/><path class="pt-hatch" d="M0 0 L0 7"/>
    </pattern>
    <pattern id="p5-dots-big" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
      <circle class="pt-dot" cx="6" cy="6" r="3"/><path class="pt-hatch" d="M0 0 L0 12 M6 0 L6 12"/>
    </pattern>
    <pattern id="p5-red" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect class="pt-bg-red" width="9" height="9"/><circle class="pt-dot-red" cx="4.5" cy="4.5" r="2.4"/>
    </pattern>
    <pattern id="p5-blue" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect class="pt-bg-blue" width="9" height="9"/><circle class="pt-dot-blue" cx="4.5" cy="4.5" r="2.4"/>
    </pattern>
    <pattern id="p5-yel" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect class="pt-bg-yel" width="9" height="9"/><circle class="pt-dot-yel" cx="4.5" cy="4.5" r="2.4"/>
    </pattern>
    <clipPath id="p5-head"><ellipse cx="100" cy="88" rx="36" ry="42"/></clipPath>
  </defs></svg>`;
}

/* ---------- comic shapes ---------- */
/** A jagged comic burst as a path (star with jittered points). */
export function burstPath(cx: number, cy: number, r1: number, r2: number, n = 14, seed = 1) {
  const r = rng(seed);
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 ? r1 * (0.9 + r() * 0.2) : r2 * (0.85 + r() * 0.3);
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)} `;
  }
  return d + "Z";
}

/** Comic focus lines: thin wedges converging on a point (the "drama" lines). */
export function focusLines(cx: number, cy: number, w: number, h: number, n = 48, seed = 3, inner = 0.42) {
  const r = rng(seed);
  const R = Math.hypot(w, h);
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.08;
    const da = 0.012 + r() * 0.02;
    const ri = R * (inner * 0.6 + r() * inner * 0.5) * 0.5;
    const p = (ang: number, rad: number) => `${(cx + Math.cos(ang) * rad).toFixed(1)} ${(cy + Math.sin(ang) * rad).toFixed(1)}`;
    d += `M${p(a - da, R)} L${p(a, ri)} L${p(a + da, R)}Z `;
  }
  return d;
}

/** Sunburst rays for covers. */
export function rays(cx: number, cy: number, n = 18, R = 900) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2, a2 = ((i + 0.5) / n) * Math.PI * 2;
    d += `M${cx} ${cy} L${(cx + Math.cos(a1) * R).toFixed(1)} ${(cy + Math.sin(a1) * R).toFixed(1)} L${(cx + Math.cos(a2) * R).toFixed(1)} ${(cy + Math.sin(a2) * R).toFixed(1)}Z `;
  }
  return d;
}

export function barcode(seed = 7) {
  const r = rng(seed);
  let x = 4, bars = "";
  while (x < 116) {
    const w = 1 + Math.floor(r() * 3.2);
    if (r() > 0.38) bars += `<rect x="${x}" y="4" width="${w}" height="${x < 10 || x > 108 || (x > 56 && x < 62) ? 50 : 44}"/>`;
    x += w + 1;
  }
  return `<svg class="barcode-svg" viewBox="0 0 120 64" aria-hidden="true">${bars}<text x="60" y="62" text-anchor="middle">8 906 2024 07 28</text></svg>`;
}

/* ---------- people ---------- */
export type Mood = "calm" | "talk" | "panic" | "happy" | "worried" | "relief";
export type Bust = {
  hair?: "short" | "long" | "pony" | "bun" | "none" | "side";
  hat?: "chef" | "cap";
  mood?: Mood;
  stache?: boolean;
  glasses?: boolean;
  bindi?: boolean;
  outfit?: "shirt" | "apron" | "vest" | "kurta" | "jacket" | "tee" | "pack" | "hoodie";
  shirt?: string; // fill class for the clothes
  look?: -1 | 0 | 1; // pupils glance left / right
};

const eyes = (m: Mood, look: number) => {
  const lx = look * 3;
  switch (m) {
    case "panic":
      return `<circle class="f-white s3" cx="85" cy="88" r="10"/><circle class="f-white s3" cx="115" cy="88" r="10"/><circle class="f-ink ns" cx="${85 + lx}" cy="89" r="2.6"/><circle class="f-ink ns" cx="${115 + lx}" cy="89" r="2.6"/>`;
    case "happy":
      return `<path class="f-none s4" d="M77 92 Q86 82 95 92"/><path class="f-none s4" d="M105 92 Q114 82 123 92"/>`;
    case "relief":
      return `<path class="f-none s4" d="M77 89 Q86 97 95 89"/><path class="f-none s4" d="M105 89 Q114 97 123 89"/>`;
    default:
      return `<ellipse class="f-ink ns" cx="${86 + lx}" cy="90" rx="3.8" ry="5.2"/><ellipse class="f-ink ns" cx="${114 + lx}" cy="90" rx="3.8" ry="5.2"/><circle class="f-white ns" cx="${87.4 + lx}" cy="88" r="1.3"/><circle class="f-white ns" cx="${115.4 + lx}" cy="88" r="1.3"/>`;
  }
};
const brows = (m: Mood) => {
  switch (m) {
    case "panic": return `<path class="f-none s4" d="M74 70 Q84 61 95 68"/><path class="f-none s4" d="M105 68 Q116 61 126 70"/>`;
    case "worried": return `<path class="f-none s4" d="M77 79 L95 72"/><path class="f-none s4" d="M105 72 L123 79"/>`;
    case "happy": case "relief": return `<path class="f-none s4" d="M77 75 Q86 70 95 74"/><path class="f-none s4" d="M105 74 Q114 70 123 75"/>`;
    default: return `<path class="f-none s4" d="M78 78 Q86 74 95 77"/><path class="f-none s4" d="M105 77 Q114 74 122 78"/>`;
  }
};
const mouth = (m: Mood) => {
  switch (m) {
    case "panic": return `<ellipse class="f-mouth s3" cx="100" cy="120" rx="9" ry="11"/><path class="f-tongue ns" d="M93 126 Q100 121 107 126 Q100 131 93 126Z"/>`;
    case "happy": return `<path class="f-mouth s3" d="M85 111 Q100 134 115 111 Z"/><path class="f-white ns" d="M88 112.5 L112 112.5 L110 116 L90 116Z"/>`;
    case "talk": return `<path class="f-mouth s3" d="M89 113 Q100 127 111 113 Q100 117 89 113Z"/>`;
    case "worried": return `<path class="f-none s3" d="M87 120 Q93 114 100 119 Q107 124 113 118"/>`;
    case "relief": return `<path class="f-none s4" d="M87 113 Q100 125 113 113"/>`;
    default: return `<path class="f-none s4" d="M90 115 Q100 121 110 115"/>`;
  }
};

const hairBack = (h: Bust["hair"]) => {
  if (h === "long") return `<path class="f-hair" d="M58 82 C48 124 52 156 66 168 L134 168 C148 156 152 124 142 82 Z"/>`;
  if (h === "pony") return `<path class="f-hair" d="M128 58 C164 54 172 92 160 128 C150 110 146 92 132 82Z"/>`;
  if (h === "bun") return `<circle class="f-hair" cx="100" cy="42" r="16"/>`;
  return "";
};
const hairFront = (h: Bust["hair"]) => {
  switch (h) {
    case "short": return `<path class="f-hair" d="M62 86 C56 50 80 37 102 38 C126 39 145 55 138 88 C134 72 125 63 114 60 C100 67 80 66 67 72 Z"/>`;
    case "side": return `<path class="f-hair" d="M62 88 C55 48 84 34 106 38 C130 42 146 60 138 90 C136 76 132 66 124 60 C112 70 92 60 80 62 C72 68 66 76 62 88Z"/>`;
    case "long": case "pony": case "bun": return `<path class="f-hair" d="M62 90 C58 52 82 40 100 40 C122 40 143 54 138 90 C130 70 116 58 98 61 C86 70 74 78 62 90Z"/>`;
    default: return "";
  }
};
const hat = (h: Bust["hat"]) => {
  if (h === "chef") return `<path class="f-white" d="M66 62 L134 62 L136 46 C150 44 154 22 138 18 C134 6 114 2 104 12 C94 0 72 4 70 18 C50 20 50 44 64 46Z"/><path class="f-none s3" d="M84 46 L82 60 M100 44 L100 60 M116 46 L118 60"/>`;
  if (h === "cap") return `<path class="f-blue" d="M60 74 C60 40 140 38 140 74 C120 66 80 66 60 74Z"/><path class="f-blue" d="M128 70 C150 70 168 74 170 80 C150 82 134 80 122 76Z"/><circle class="f-yel s3" cx="100" cy="50" r="6"/>`;
  return "";
};
const outfit = (o: Bust["outfit"], shirt: string) => {
  const torso = `<path class="${shirt}" d="M24 204 C28 162 58 142 100 142 C142 142 172 162 176 204 Z"/>`;
  switch (o) {
    case "apron": return torso + `<path class="f-white" d="M76 160 L124 160 L128 204 L72 204Z"/><path class="f-none s3" d="M76 160 L68 144 M124 160 L132 144"/><path class="f-none s3" d="M88 178 L112 178"/>`;
    case "vest": return torso + `<path class="f-ink" d="M30 204 C34 168 56 148 80 143 L100 176 L100 204Z"/><path class="f-ink" d="M170 204 C166 168 144 148 120 143 L100 176 L100 204Z"/><path class="f-white s3" d="M86 143 L100 160 L114 143Z"/><path class="f-red s2" d="M95 152 L100 158 L105 152 L100 165Z"/>`;
    case "kurta": return torso + `<path class="f-none s3" d="M100 145 L100 172"/><path class="f-dupatta" d="M44 160 C80 176 124 178 164 204 L136 204 C108 188 76 182 38 172Z"/>`;
    case "jacket": return torso + `<path class="f-none s3" d="M100 150 L100 204"/><path class="f-paper s3" d="M80 143 L100 166 L120 143 L112 140 L100 154 L88 140Z"/><circle class="f-yel s2" cx="138" cy="176" r="7"/>`;
    case "pack": return torso + `<path class="f-red s4" d="M70 148 L62 204 L76 204 L82 150Z"/><path class="f-red s4" d="M130 148 L138 204 L124 204 L118 150Z"/><path class="f-none s3" d="M86 143 Q100 156 114 143"/>`;
    case "hoodie": return torso + `<path class="f-none s3" d="M72 146 Q100 176 128 146"/><path class="f-none s3" d="M92 166 L90 186 M108 166 L110 186"/>`;
    case "tee": return torso + `<path class="f-none s3" d="M84 143 Q100 158 116 143"/>`;
    default: return torso + `<path class="f-white s3" d="M82 141 L100 160 L92 166 L78 148Z"/><path class="f-white s3" d="M118 141 L100 160 L108 166 L122 148Z"/><path class="f-none s3" d="M100 160 L100 204"/>`;
  }
};

/** A head-and-shoulders comic character in a 200×204 box. */
export function bust(o: Bust = {}) {
  const m = o.mood ?? "calm";
  return `<g class="bust">
    ${hairBack(o.hair)}
    ${outfit(o.outfit, o.shirt ?? "f-blue")}
    <path class="f-skin" d="M88 116 L88 146 C94 152 106 152 112 146 L112 116Z"/>
    <ellipse class="f-skin" cx="64" cy="92" rx="7" ry="10"/><ellipse class="f-skin" cx="136" cy="92" rx="7" ry="10"/>
    <ellipse class="f-skin" cx="100" cy="88" rx="36" ry="42"/>
    <rect class="f-dots ns shade" x="110" y="40" width="40" height="100" clip-path="url(#p5-head)"/>
    ${hairFront(o.hair)}${hat(o.hat)}
    ${brows(m)}${eyes(m, o.look ?? 0)}
    <path class="f-none s3" d="M100 93 Q95 104 102 106"/>
    ${o.stache ? `<path class="f-hair s2" d="M84 111 Q100 101 116 111 Q108 115 100 110 Q92 115 84 111Z"/>` : ""}
    ${mouth(m)}
    ${o.glasses ? `<circle class="f-none s3" cx="86" cy="90" r="11"/><circle class="f-none s3" cx="114" cy="90" r="11"/><path class="f-none s3" d="M97 89 L103 89"/>` : ""}
    ${o.bindi ? `<circle class="f-red ns" cx="100" cy="74" r="2.6"/>` : ""}
    ${m === "happy" ? `<ellipse class="f-blush ns" cx="76" cy="104" rx="7" ry="4"/><ellipse class="f-blush ns" cx="124" cy="104" rx="7" ry="4"/>` : ""}
    ${m === "panic" ? `<path class="f-sweat s2" d="M146 54 Q154 68 146 74 Q138 68 146 54Z"/><path class="f-sweat s2" d="M54 64 Q60 74 54 79 Q48 74 54 64Z"/>` : ""}
  </g>`;
}

/** The cast, so every page draws the same people. */
export const CAST = {
  owner: (mood: Mood = "calm", look: -1 | 0 | 1 = 0): Bust => ({ hair: "side", stache: true, outfit: "shirt", shirt: "f-blue", mood, look }),
  cook: (mood: Mood = "calm", look: -1 | 0 | 1 = 0): Bust => ({ hair: "none", hat: "chef", outfit: "apron", shirt: "f-white", mood, look }),
  waiter: (mood: Mood = "calm", look: -1 | 0 | 1 = 0): Bust => ({ hair: "short", outfit: "vest", shirt: "f-white", mood, look }),
  guest: (mood: Mood = "happy", look: -1 | 0 | 1 = 0): Bust => ({ hair: "bun", outfit: "tee", shirt: "f-grn", mood, look, glasses: true }),
  manager: (mood: Mood = "calm", look: -1 | 0 | 1 = 0): Bust => ({ hair: "long", outfit: "jacket", shirt: "f-ink2", mood, look }),
  parent: (mood: Mood = "worried", look: -1 | 0 | 1 = 0): Bust => ({ hair: "long", outfit: "kurta", shirt: "f-red", mood, look, bindi: true }),
  student: (mood: Mood = "calm", look: -1 | 0 | 1 = 0): Bust => ({ hair: "pony", outfit: "pack", shirt: "f-yel", mood, look }),
  driver: (mood: Mood = "calm", look: -1 | 0 | 1 = 0): Bust => ({ hair: "short", hat: "cap", stache: true, outfit: "jacket", shirt: "f-blue", mood, look }),
};

export function face(b: Bust, extra = "", viewBox = "0 0 200 204") {
  return `<svg class="art face" viewBox="${viewBox}" aria-hidden="true">${bust(b)}${extra}</svg>`;
}

/* ---------- little props ---------- */
export const kotSlip = (x: number, y: number, rot: number, label = "KOT · T4", s = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path class="f-white s3" d="M-34 -44 L34 -44 L34 40 L28 46 L22 40 L16 46 L10 40 L4 46 L-2 40 L-8 46 L-14 40 L-20 46 L-26 40 L-34 46Z"/><text class="svg-type" x="0" y="-26" text-anchor="middle">${label}</text><path class="f-none s2" d="M-24 -12 L24 -12 M-24 0 L16 0 M-24 12 L20 12 M-24 24 L10 24"/></g>`;

export const clock = (x: number, y: number, r: number, h = 7, m = 5) => {
  const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = m / 60 * Math.PI * 2 - Math.PI / 2;
  let ticks = "";
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ticks += `M${(x + Math.cos(a) * r * .78).toFixed(1)} ${(y + Math.sin(a) * r * .78).toFixed(1)} L${(x + Math.cos(a) * r * .9).toFixed(1)} ${(y + Math.sin(a) * r * .9).toFixed(1)} `; }
  return `<g class="clock"><circle class="f-white s5" cx="${x}" cy="${y}" r="${r}"/><path class="f-none s2" d="${ticks}"/>
  <path class="f-none s5" d="M${x} ${y} L${(x + Math.cos(ha) * r * .5).toFixed(1)} ${(y + Math.sin(ha) * r * .5).toFixed(1)}"/>
  <path class="f-none s3 hand-m" d="M${x} ${y} L${(x + Math.cos(ma) * r * .76).toFixed(1)} ${(y + Math.sin(ma) * r * .76).toFixed(1)}"/><circle class="f-red s2" cx="${x}" cy="${y}" r="4"/></g>`;
};

/** A side-on bus, 360 wide. */
export const bus = (x: number, y: number, s = 1, doorOpen = false) =>
  `<g transform="translate(${x} ${y}) scale(${s})" class="bus">
    <path class="f-amb" d="M8 20 Q8 0 30 0 L330 0 Q352 0 356 22 L360 120 L4 120Z"/>
    <rect class="f-dots ns" x="10" y="64" width="344" height="52" opacity=".9"/>
    <path class="f-none s4" d="M4 64 L360 64"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect class="f-glass" x="${96 + i * 50}" y="14" width="40" height="38" rx="4"/>`).join("")}
    <rect class="f-glass" x="300" y="14" width="44" height="38" rx="4"/>
    <rect class="${doorOpen ? "f-ink" : "f-glass"}" x="24" y="12" width="52" height="104" rx="3"/>
    ${doorOpen ? `<path class="f-glass s3" d="M24 12 L10 18 L10 112 L24 116Z"/>` : `<path class="f-none s3" d="M50 12 L50 116"/>`}
    <rect class="f-yel s3" x="320" y="76" width="30" height="14" rx="3"/>
    <text class="svg-bang" x="200" y="100" text-anchor="middle">SCHOOL BUS</text>
    <circle class="f-ink2" cx="96" cy="122" r="22"/><circle class="f-paper s3" cx="96" cy="122" r="8"/>
    <circle class="f-ink2" cx="290" cy="122" r="22"/><circle class="f-paper s3" cx="290" cy="122" r="8"/>
  </g>`;

/** A paper-ticket printer spitting a KOT. */
export const printer = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" class="printer">
    <g class="printer-paper">${kotSlip(60, -40, -4, "KOT #141", 0.9)}</g>
    <path class="f-ink2" d="M0 0 L120 0 L128 60 L-8 60Z"/><rect class="f-white s3" x="16" y="-6" width="88" height="12" rx="3"/>
    <circle class="f-grn s2" cx="104" cy="34" r="6"/><path class="f-none s3" d="M10 30 L60 30"/>
  </g>`;

/* ---------- scenes (each fills its panel; subjects kept inside a centre-safe area) ---------- */
export function restaurantScene() {
  const diner = (x: number, y: number, hand = false, cls = "f-crowd", flip = 1) =>
    `<g transform="translate(${x} ${y}) scale(${flip} 1)"><path class="${cls}" d="M-26 60 C-24 30 -14 22 0 22 C14 22 24 30 26 60Z"/><circle class="f-skin" cx="0" cy="0" r="18"/><path class="f-hair ns" d="M-18 -2 C-18 -22 18 -24 18 -4 C10 -12 -8 -12 -18 -2Z"/>${hand ? `<path class="f-skin s3" d="M14 30 L30 -16 L36 -14 L22 32Z"/><circle class="f-skin s3" cx="33" cy="-20" r="7"/>` : ""}</g>`;
  const table = (x: number) => `<g><ellipse class="f-white" cx="${x}" cy="356" rx="88" ry="20"/><path class="f-none s5" d="M${x} 376 L${x} 430 M${x - 30} 432 L${x + 30} 432"/><path class="f-none s3" d="M${x - 40} 348 L${x - 26} 348 M${x + 14} 350 L${x + 34} 350"/></g>`;
  return `<svg class="art scene" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <rect class="f-wall ns" width="800" height="450"/>
    <rect class="f-dots ns" width="800" height="300" opacity=".55"/>
    <rect class="f-floor" x="-10" y="300" width="820" height="160"/>
    <path class="f-none s2 floorlines" d="M0 340 L800 340 M0 384 L800 384 M120 300 L60 450 M300 300 L280 450 M500 300 L520 450 M680 300 L740 450"/>
    <g class="board"><rect class="f-board" x="290" y="58" width="220" height="112" rx="6"/><text class="svg-chalk" x="400" y="92" text-anchor="middle">TODAY</text><path class="f-none s2 chalk" d="M318 110 L420 110 M318 128 L460 128 M318 146 L400 146 M444 110 L482 110 M470 146 L482 146"/></g>
    ${[130, 400, 670].map((x, i) => `<path class="f-none s3" d="M${x} 0 L${x} 40"/><path class="${i === 1 ? "f-red" : "f-yel"}" d="M${x - 30} 70 L${x - 14} 40 L${x + 14} 40 L${x + 30} 70Z"/><path class="lamp-glow ns" d="M${x - 30} 70 L${x - 90} 300 L${x + 90} 300 L${x + 30} 70Z"/>`).join("")}
    ${diner(92, 300, true, "f-crowd")}${diner(208, 304, false, "f-crowd2", -1)}
    ${table(150)}
    ${diner(612, 300, false, "f-crowd2")}${diner(728, 304, true, "f-crowd", -1)}
    ${table(670)}
    <g class="waiter-run" transform="translate(400 210)">
      <path class="f-none s3 speed" d="M-120 30 L-60 30 M-140 60 L-70 60 M-110 90 L-56 90"/>
      <path class="f-ink" d="M-22 40 L-48 120 L-36 124 L-6 60Z"/><path class="f-ink" d="M10 40 L44 116 L56 110 L26 44Z"/>
      <path class="f-white" d="M-28 -20 C-26 -40 26 -40 28 -20 L24 50 L-24 50Z"/><path class="f-ink" d="M-28 -20 L-10 -36 L0 10 L10 -36 L28 -20 L24 50 L-24 50Z"/>
      <circle class="f-skin" cx="0" cy="-56" r="22"/><path class="f-hair ns" d="M-22 -58 C-22 -84 22 -86 22 -60 C12 -70 -10 -70 -22 -58Z"/>
      <ellipse class="f-ink ns" cx="7" cy="-56" rx="2.6" ry="3.6"/><ellipse class="f-ink ns" cx="-7" cy="-56" rx="2.6" ry="3.6"/><ellipse class="f-mouth s2" cx="0" cy="-42" rx="5" ry="6"/>
      <path class="f-skin s3" d="M24 -10 L58 -46 L64 -40 L32 -2Z"/><ellipse class="f-white" cx="66" cy="-52" rx="40" ry="8"/>
      <path class="f-red s3" d="M50 -60 Q58 -78 66 -60Z"/><path class="f-yel s3" d="M70 -60 Q80 -82 90 -60Z"/>
    </g>
    ${kotSlip(560, 120, 18, "T6", 0.7)}${kotSlip(250, 150, -22, "T9", 0.62)}${kotSlip(690, 200, 8, "T2", 0.5)}
  </svg>`;
}

export function lostTicketScene() {
  return `<svg class="art scene" viewBox="0 0 400 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-yel-bg ns" width="400" height="450"/>
    <path class="f-focus ns" d="${focusLines(200, 210, 400, 450, 60, 9)}"/>
    <path class="f-floor" d="M-10 360 L410 360 L410 460 L-10 460Z"/>
    <path class="f-ink" d="M-10 330 L410 330 L410 360 L-10 360Z"/>
    <path class="f-none s3 drift" d="M150 120 Q90 160 150 200 Q210 240 160 280"/>
    <g class="ticket-fall">${kotSlip(205, 214, -28, "KOT · T4", 1.25)}</g>
    <path class="f-none s3" d="M282 248 Q300 262 292 280 M300 232 Q326 246 318 268"/>
  </svg>`;
}

export function kitchenWall(extra = "") {
  let tiles = "";
  for (let y = 0; y < 460; y += 40) tiles += `M0 ${y} L800 ${y} `;
  for (let x = 0; x < 820; x += 40) tiles += `M${x} 0 L${x} 460 `;
  return `<svg class="art scene" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-tile ns" width="800" height="450"/><path class="f-none s1 tiles" d="${tiles}"/>
    <rect class="f-steel" x="-10" y="372" width="820" height="90"/>
    <g class="pans"><path class="f-none s3" d="M60 0 L60 40 M120 0 L120 30"/><circle class="f-ink2" cx="60" cy="72" r="30"/><path class="f-ink2" d="M56 40 L64 40 L64 44 L56 44Z"/><circle class="f-ink2" cx="120" cy="58" r="22"/></g>
    ${extra}
  </svg>`;
}

export function homeScene() {
  return `<svg class="art scene" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-wall2 ns" width="800" height="450"/><rect class="f-dots ns" width="800" height="450" opacity=".35"/>
    <g class="window"><rect class="f-night" x="70" y="60" width="200" height="170"/><circle class="f-moon" cx="210" cy="110" r="26"/><circle class="f-night ns" cx="222" cy="102" r="22"/>
    <circle class="f-star ns" cx="110" cy="96" r="3"/><circle class="f-star ns" cx="150" cy="150" r="2.4"/><circle class="f-star ns" cx="240" cy="190" r="2"/>
    <path class="f-none s5" d="M70 60 L270 60 L270 230 L70 230Z M170 60 L170 230 M70 145 L270 145"/></g>
    <path class="f-none s3" d="M650 0 L650 90"/><path class="f-yel" d="M610 130 L630 90 L670 90 L690 130Z"/><path class="lamp-glow ns" d="M610 130 L540 360 L760 360 L690 130Z"/>
    <path class="f-sofa" d="M120 300 Q120 250 170 250 L630 250 Q680 250 680 300 L680 400 L120 400Z"/>
    <path class="f-sofa2" d="M90 320 Q90 290 120 290 L150 290 L150 420 L90 420Z"/><path class="f-sofa2" d="M650 290 L680 290 Q710 290 710 320 L710 420 L650 420Z"/>
    <path class="f-none s3" d="M150 340 L650 340"/><path class="f-ink ns" d="M110 420 L110 440 M690 420 L690 440"/>
  </svg>`;
}

export function windowScene() {
  return `<svg class="art scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-house ns" width="600" height="450"/>
    <path class="f-none s2 bricks" d="M0 40 L600 40 M0 80 L600 80 M0 120 L600 120 M0 400 L600 400 M0 440 L600 440 M40 0 L40 40 M140 0 L140 40 M240 0 L240 40 M340 0 L340 40 M440 0 L440 40 M540 0 L540 40 M90 40 L90 80 M190 40 L190 80 M290 40 L290 80 M390 40 L390 80 M490 40 L490 80 M80 400 L80 440 M200 400 L200 440 M320 400 L320 440 M440 400 L440 440"/>
    <rect class="f-room" x="110" y="130" width="300" height="260"/>
    <rect class="f-dots ns" x="110" y="130" width="300" height="260" opacity=".5"/>
    <g class="win-person" transform="translate(160 186) scale(1.06)">${bust(CAST.parent("worried", 1))}<path class="f-skin s3" d="M150 150 C160 120 170 100 186 92 L196 100 C186 112 176 130 172 160Z"/></g>
    <path class="f-curtain" d="M96 120 C130 180 120 300 150 396 L96 396Z"/><path class="f-curtain" d="M424 120 C390 180 400 300 370 396 L424 396Z"/>
    <path class="f-none s6" d="M110 130 L410 130 L410 390 L110 390Z"/><rect class="f-sill" x="90" y="388" width="340" height="18"/>
    <path class="f-none s3 rainonly" d="M126 150 L118 176 M210 140 L202 168 M300 152 L292 180 M380 146 L372 172 M160 250 L152 276 M350 260 L342 286"/>
    ${clock(510, 120, 52)}
  </svg>`;
}

export function stopScene() {
  return `<svg class="art scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-sky ns" width="600" height="450"/><rect class="f-dots ns" width="600" height="300" opacity=".4"/>
    <path class="f-far" d="M0 250 L0 170 L50 170 L50 140 L110 140 L110 190 L160 190 L160 120 L176 100 L192 120 L192 190 L250 190 L250 160 L330 160 L330 200 L400 200 L400 130 L460 130 L460 180 L520 180 L520 150 L600 150 L600 250Z"/>
    <rect class="f-road" x="-10" y="300" width="620" height="160"/><path class="f-none s4 dash" d="M20 380 L80 380 M140 380 L200 380 M260 380 L320 380 M380 380 L440 380 M500 380 L560 380"/>
    <rect class="f-pave" x="-10" y="250" width="620" height="52"/>
    <path class="f-none s5" d="M470 300 L470 120"/><rect class="f-amb" x="420" y="70" width="100" height="62" rx="8"/><text class="svg-bang" x="470" y="110" text-anchor="middle">BUS STOP</text>
    <g transform="translate(150 140) scale(1.12)">${bust(CAST.student("worried", 1))}</g>
  </svg>`;
}

export function cabScene() {
  return `<svg class="art scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-sky ns" width="600" height="450"/><path class="f-far ns" d="M0 220 L60 200 L120 214 L200 190 L300 210 L380 186 L460 206 L600 190 L600 260 L0 260Z"/>
    <path class="f-ink" d="M0 0 L600 0 L600 60 L0 60Z M0 0 L60 0 L40 300 L0 300Z M600 0 L560 0 L580 300 L600 300Z"/>
    <g transform="translate(220 130) scale(1.15)">${bust(CAST.driver("happy"))}</g>
    <path class="f-dash" d="M-10 330 Q300 290 610 330 L610 460 L-10 460Z"/>
    <path class="f-none s8 wheel" d="M150 450 A150 150 0 0 1 450 450"/><path class="f-none s5" d="M300 450 L300 360"/>
  </svg>`;
}

export function boardScene() {
  return `<svg class="art scene" viewBox="0 0 600 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <rect class="f-sky ns" width="600" height="450"/><path class="f-focus ns" d="${focusLines(300, 220, 600, 450, 56, 21, .5)}"/>
    <rect class="f-pave" x="-10" y="400" width="620" height="60"/>
    ${bus(190, 250, 1.12, true)}
    <g transform="translate(70 190) scale(.95)">${bust(CAST.student("happy", 1))}</g>
  </svg>`;
}

/** Cover art for issue #1: a small shop takes off like a rocket over the city. */
export function coverArt() {
  return `<svg class="art cover-art" viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-cover-sky ns" width="400" height="420"/>
    <path class="f-rays ns" d="${rays(200, 250, 22, 700)}"/>
    <rect class="f-dots ns" width="400" height="420" opacity=".35"/>
    <g class="cv-rain rainonly">${Array.from({ length: 40 }, (_, i) => { const r = rng(i + 4); const x = r() * 420, y = r() * 420; return `<path class="f-none s1" d="M${x.toFixed(0)} ${y.toFixed(0)} L${(x - 8).toFixed(0)} ${(y + 26).toFixed(0)}"/>`; }).join("")}</g>
    <g class="cv-beam darkonly"><path class="f-beam ns" d="M60 420 L130 0 L190 0 L90 420Z"/><path class="f-beam ns" d="M350 420 L250 0 L310 0 L380 420Z"/></g>
    <g class="cv-shop" transform="translate(30 -6) scale(.85)">
      <g class="cv-smoke"><circle class="f-white" cx="160" cy="356" r="30"/><circle class="f-white" cx="240" cy="360" r="34"/><circle class="f-white" cx="200" cy="378" r="36"/><circle class="f-white" cx="128" cy="388" r="22"/><circle class="f-white" cx="278" cy="392" r="24"/></g>
      <path class="f-flame" d="M162 316 Q200 400 238 316Z"/><path class="f-flame2" d="M178 316 Q200 368 222 316Z"/>
      <path class="f-none s3 speed" d="M110 270 L110 340 M296 260 L296 330 M86 210 L86 262 M318 200 L318 250"/>
      <rect class="f-shop" x="126" y="170" width="148" height="146"/>
      <rect class="f-dots ns" x="210" y="170" width="64" height="146" opacity=".7"/>
      <path class="f-none s4" d="M126 170 L274 170 L274 316 L126 316Z"/>
      <path class="f-awn1" d="M114 150 L286 150 L290 186 L110 186Z"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path class="${i % 2 ? "f-awn2" : "f-awn1"} s3" d="M${110 + i * 30} 186 L${140 + i * 30} 186 L${140 + i * 30} 196 Q${125 + i * 30} 208 ${110 + i * 30} 196Z"/>`).join("")}
      <path class="f-none s4" d="M114 150 L286 150 L290 186 L110 186Z"/>
      <rect class="f-sign" x="134" y="118" width="132" height="32" rx="3"/><text class="svg-bang sign" x="200" y="142" text-anchor="middle">YOUR SHOP</text>
      <rect class="f-glass" x="140" y="214" width="62" height="56"/><rect class="f-door" x="216" y="214" width="44" height="102"/><circle class="f-yel s2" cx="250" cy="266" r="4"/>
      <g transform="translate(146 214) scale(.25)">${bust(CAST.owner("happy"))}</g>
      <path class="f-skin s3" d="M188 236 L200 214 L206 218 L196 240Z"/>
    </g>
    <path class="f-city" d="M0 420 L0 350 L30 350 L30 330 L56 330 L56 300 L62 290 L68 300 L68 330 L90 330 L90 372 L112 372 L112 344 L128 344 L128 420Z M272 420 L272 360 L300 360 L300 320 L316 306 L332 320 L332 344 L350 344 L350 300 L354 280 L358 300 L358 330 L370 330 L370 300 L374 280 L378 300 L378 340 L400 340 L400 420Z"/>
    <g class="darkonly cv-lit">${[[36, 360], [44, 380], [100, 388], [300, 372], [318, 396], [384, 360], [384, 384]].map(([x, y]) => `<rect class="f-lit ns" x="${x}" y="${y}" width="6" height="8"/>`).join("")}</g>
  </svg>`;
}

/** Product cover art: Aevidine = a busy table, QR stand, plate and a flying KOT; Campus = the bus at
 *  sunrise on its route. A real app screen in a drawn phone is laid over each (see product.ts). */
export function productCoverArt(id: "aevidine" | "campus") {
  if (id === "campus") return `<svg class="art cover-art" viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-cover-sky ns" width="400" height="420"/><path class="f-rays ns" d="${rays(150, 250, 22, 700)}"/><rect class="f-dots ns" width="400" height="420" opacity=".35"/>
    <circle class="f-sun" cx="150" cy="250" r="64"/>
    <path class="f-far" d="M0 300 L0 250 L30 250 L30 230 L60 230 L60 262 L84 262 L84 240 L120 240 L120 270 L170 270 L170 236 L200 236 L200 260 L240 260 L240 300Z"/>
    <rect class="f-road" x="-10" y="300" width="420" height="130"/><path class="f-none s4 dash" d="M10 360 L50 360 M90 360 L130 360 M170 360 L210 360 M250 360 L290 360"/>
    <path class="f-none s3 speed" d="M0 282 L40 282 M-6 304 L30 304 M4 326 L36 326"/>
    ${bus(40, 214, 0.62)}
    <path class="f-none s4 route" d="M60 120 Q140 90 200 140 Q240 172 236 210"/>
    <path class="f-pin" d="M38 104 C38 76 80 76 80 104 C80 128 59 140 59 160 C59 140 38 128 38 104Z"/><circle class="f-white s3" cx="59" cy="104" r="8"/>
  </svg>`;
  return `<svg class="art cover-art" viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="f-cover-sky ns" width="400" height="420"/><path class="f-rays ns" d="${rays(150, 240, 22, 700)}"/><rect class="f-dots ns" width="400" height="420" opacity=".35"/>
    <path class="f-white" d="M-20 300 Q200 262 420 300 L420 430 L-20 430Z"/><rect class="f-dots ns" x="0" y="300" width="400" height="130" opacity=".5"/>
    <path class="f-plate" d="M40 316 A62 18 0 1 0 164 316 A62 18 0 1 0 40 316Z"/><path class="f-food" d="M62 312 Q102 262 142 312Z"/><path class="f-red s3" d="M84 300 Q92 288 100 300Z"/>
    <path class="f-none s3 steam" d="M86 262 Q78 246 88 232 M104 256 Q96 238 106 222 M120 262 Q114 248 122 236"/>
    <g transform="translate(176 232)"><path class="f-ink2" d="M-4 76 L52 76 L46 86 L2 86Z"/><rect class="f-white" x="0" y="0" width="48" height="76" rx="4"/>${qr(8, 8, 32)}<text class="svg-type small" x="24" y="56" text-anchor="middle">SCAN</text><text class="svg-type small" x="24" y="68" text-anchor="middle">ME</text></g>
    ${kotSlip(196, 150, 12, "KOT #141", 0.72)}
    <path class="f-none s3 drift" d="M150 120 Q170 100 196 104"/>
  </svg>`;
}

/** A believable QR-code-ish block (decoration only). */
export function qr(x: number, y: number, s: number, seed = 11) {
  const r = rng(seed), n = 9, c = s / n;
  let d = "";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const corner = (i < 3 && j < 3) || (i > 5 && j < 3) || (i < 3 && j > 5);
    if (corner) { if (i % 6 === 0 || j % 6 === 0 || i % 6 === 2 || j % 6 === 2 || (i % 6 === 1 && j % 6 === 1)) d += `M${x + i * c} ${y + j * c}h${c}v${c}h${-c}Z`; }
    else if (r() > 0.5) d += `M${x + i * c} ${y + j * c}h${c}v${c}h${-c}Z`;
  }
  return `<path class="f-ink ns" d="${d}"/>`;
}

/* ---------- service emblems (hero chest emblems) ---------- */
export const EMBLEMS = [
  `<rect class="f-white" x="14" y="22" width="72" height="56" rx="6"/><path class="f-red" d="M14 28 Q14 22 20 22 L80 22 Q86 22 86 28 L86 36 L14 36Z"/><circle class="f-white s2" cx="22" cy="29" r="2.5"/><circle class="f-white s2" cx="30" cy="29" r="2.5"/><path class="f-none s3" d="M24 48 L56 48 M24 58 L70 58 M24 68 L48 68"/><rect class="f-yel s3" x="58" y="44" width="20" height="12"/>`,
  `<path class="f-blue" d="${gear(50, 50, 34, 24, 9)}"/><circle class="f-white" cx="50" cy="50" r="11"/>`,
  `<path class="f-yel" d="M58 8 L22 56 L46 56 L38 92 L78 40 L54 40 L64 8Z"/>`,
  `<path class="f-red" d="M50 12 L84 30 L50 48 L16 30Z"/><path class="f-blue" d="M16 30 L50 48 L50 88 L16 70Z"/><path class="f-yel" d="M84 30 L50 48 L50 88 L84 70Z"/>`,
  `<path class="f-white" d="M24 72 C8 72 8 50 24 48 C24 30 48 24 56 38 C62 28 82 32 80 48 C94 50 94 72 80 72Z"/><path class="f-grn s3" d="M50 66 L50 44 M40 54 L50 44 L60 54"/>`,
];

export function gear(cx: number, cy: number, r1: number, r2: number, teeth: number) {
  let d = "";
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? r2 : r1;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a0 + 0.05) * r).toFixed(1)} ${(cy + Math.sin(a0 + 0.05) * r).toFixed(1)} L${(cx + Math.cos(a1 - 0.05) * r).toFixed(1)} ${(cy + Math.sin(a1 - 0.05) * r).toFixed(1)} `;
  }
  return d + "Z";
}

/* ---------- process art (one little shop, four stages) ---------- */
export const PROCESS_ART = [
  // Identify: a tangle under a magnifying glass
  `<svg class="art" viewBox="0 0 300 220" aria-hidden="true"><rect class="f-yel-bg ns" width="300" height="220"/><path class="f-focus ns" d="${focusLines(150, 110, 300, 220, 40, 31)}"/>
   <path class="f-none s4 tangle" d="M40 150 C70 60 110 190 130 110 C150 30 190 200 170 120 C150 60 230 80 200 140 C180 180 120 160 150 120 C170 96 240 120 260 70"/>
   <circle class="f-glass" cx="168" cy="108" r="46"/><path class="f-none s5" d="M168 62 A46 46 0 1 1 167.9 62Z"/><path class="f-ink2" d="M200 142 L246 192 L234 204 L190 154Z"/><path class="f-white ns" d="M140 92 Q150 76 168 74" opacity=".8"/></svg>`,
  // Improve: the tangle combed straight by a wrench
  `<svg class="art" viewBox="0 0 300 220" aria-hidden="true"><rect class="f-blue-bg ns" width="300" height="220"/><rect class="f-dots ns" width="300" height="220" opacity=".5"/>
   <path class="f-none s4" d="M30 150 C60 150 70 120 100 120 C130 120 140 96 170 96 L270 96"/>
   <g class="wrench" transform="translate(150 140) rotate(-30)"><path class="f-steel" d="M-60 -8 L30 -8 L30 8 L-60 8Z"/><path class="f-steel" d="M30 -22 C60 -22 66 0 60 10 L44 10 L44 -6 L36 -6 L36 22 C60 22 66 0 60 -10Z"/></g>
   <path class="f-none s3" d="M226 70 L238 58 M246 84 L262 80 M236 116 L250 126"/></svg>`,
  // Automate: gears turning by themselves
  `<svg class="art" viewBox="0 0 300 220" aria-hidden="true"><rect class="f-red-bg ns" width="300" height="220"/><rect class="f-dots ns" width="300" height="220" opacity=".45"/>
   <g class="spin-a"><path class="f-yel" d="${gear(110, 110, 52, 40, 10)}"/><circle class="f-white" cx="110" cy="110" r="14"/></g>
   <g class="spin-b"><path class="f-white" d="${gear(196, 76, 34, 25, 8)}"/><circle class="f-ink2" cx="196" cy="76" r="9"/></g>
   <g class="spin-c"><path class="f-blue" d="${gear(210, 160, 30, 22, 8)}"/><circle class="f-white" cx="210" cy="160" r="8"/></g></svg>`,
  // Scale: the shop, now a tower
  `<svg class="art" viewBox="0 0 300 220" aria-hidden="true"><rect class="f-grn-bg ns" width="300" height="220"/><path class="f-rays ns" d="${rays(150, 220, 16, 400)}" opacity=".6"/>
   <rect class="f-shop" x="110" y="30" width="80" height="190"/><rect class="f-dots ns" x="150" y="30" width="40" height="190" opacity=".6"/><path class="f-none s4" d="M110 30 L190 30 L190 220 L110 220Z"/>
   ${[0, 1, 2, 3].map((i) => `<rect class="f-glass" x="122" y="${46 + i * 36}" width="22" height="22"/><rect class="f-glass" x="156" y="${46 + i * 36}" width="22" height="22"/>`).join("")}
   <path class="f-awn1" d="M100 18 L200 18 L204 34 L96 34Z"/><path class="f-none s4" d="M60 210 L60 170 L84 170 L84 210 M220 210 L220 186 L244 186 L244 210"/><path class="f-red s3" d="M236 40 L262 40 L262 66 M262 40 L222 80"/></svg>`,
];

/* ---------- origin story art ---------- */
export function cityDawn() {
  return `<svg class="art scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <rect class="f-cover-sky ns" width="400" height="300"/><circle class="f-sun" cx="200" cy="200" r="60"/><rect class="f-dots ns" width="400" height="300" opacity=".3"/>
    <path class="f-city" d="M0 300 L0 220 L40 220 L40 196 L70 196 L70 230 L100 230 L100 180 L104 150 L108 140 L112 150 L116 180 L116 210 L150 210 L150 180 L154 150 L158 140 L162 150 L166 180 L166 230 L210 230 L210 200 L240 200 L240 170 L270 170 L270 214 L300 214 L300 188 L340 188 L340 226 L400 226 L400 300Z"/>
    <path class="f-none s2" d="M104 160 L116 160 M154 160 L166 160"/>
  </svg>`;
}

export function silhouette(x: number, s = 1) {
  return `<g transform="translate(${x} 60) scale(${s})"><circle class="f-sil" cx="0" cy="40" r="34"/><path class="f-sil" d="M-60 200 C-58 120 -36 86 0 86 C36 86 58 120 60 200Z"/><text class="svg-bang q" x="0" y="54" text-anchor="middle">?</text></g>`;
}

export function infinity() {
  return `<svg class="art inf" viewBox="0 0 300 160" aria-hidden="true"><path class="f-none s14 inf-back" d="M150 80 C120 30 50 30 50 80 C50 130 120 130 150 80 C180 30 250 30 250 80 C250 130 180 130 150 80Z"/><path class="f-none s8 inf-line" pathLength="1" d="M150 80 C120 30 50 30 50 80 C50 130 120 130 150 80 C180 30 250 30 250 80 C250 130 180 130 150 80Z"/></svg>`;
}

/* ---------- toggles ---------- */
export const SUN_MOON = `<svg class="art tg-art" viewBox="0 0 48 48" aria-hidden="true">
  <g class="tg-sun"><path class="f-yel" d="${burstPath(24, 24, 12, 19, 10, 5)}"/><circle class="f-red" cx="24" cy="24" r="8"/></g>
  <g class="tg-moon"><path class="f-moon" d="M30 8 A17 17 0 1 0 40 32 A13 13 0 1 1 30 8Z"/><path class="f-none s2 tg-rain" d="M8 30 L5 38 M16 34 L13 42 M38 6 L35 14"/></g></svg>`;

export const SPEAKER = `<svg class="art snd-art" viewBox="0 0 48 48" aria-hidden="true"><path class="f-white" d="M8 18 L16 18 L26 9 L26 39 L16 30 L8 30Z"/><g class="snd-on"><path class="f-none s3" d="M31 18 Q36 24 31 30"/><path class="f-none s3" d="M35 13 Q44 24 35 35"/></g><g class="snd-off"><path class="f-none s3" d="M32 18 L42 30 M42 18 L32 30"/></g></svg>`;
