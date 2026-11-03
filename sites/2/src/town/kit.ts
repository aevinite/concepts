// The model-maker's parts box: clay materials, primitive shapes, little painted textures.
// Everything in the town is built from these, so the whole diorama shares one hand.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const DEG = Math.PI / 180;

/** Clay palette. Pastel, matte, warm; tuned so the night lighting turns them to dusk tones. */
export const C = {
  grass: "#b9c79c",
  grassDeep: "#a3b585",
  path: "#e6d9c0",
  road: "#8e8a83",
  roadLine: "#f1e6cf",
  kerb: "#d9d0bf",
  water: "#8fbac2",
  walnut: "#5c4535",
  walnutDark: "#3f2f25",
  brass: "#c4a364",
  cream: "#f1e7d4",
  paper: "#f7f1e4",
  sand: "#e7d3ae",
  terracotta: "#cf8566",
  brick: "#b86a4c",
  sage: "#9fb48f",
  mint: "#cfe2d6",
  teal: "#6fa39a",
  green: "#2f7a62",
  gold: "#d2a640",
  amber: "#efa037",
  pink: "#e9b2ad",
  rose: "#d98b86",
  sky: "#a9c6d6",
  glass: "#a8c3cc",
  ink: "#2a2b2a",
  red: "#c9483b",
  white: "#f3eee4",
  tank: "#2f3133",
  trunk: "#8a6a50",
  leaf: ["#8fae79", "#7ea36d", "#a3bb83", "#93b27a", "#b2c48a"],
  people: ["#d77b5b", "#5d86a8", "#e2b04b", "#7aa57c", "#b8798f", "#5f6f8f", "#c9a27a"],
  skin: ["#c99572", "#a7774f", "#d8a982", "#8a5f3f"],
};

export type NightMat = { mat: THREE.MeshStandardMaterial; on: number };

/** Seeded random, so the town is the same town on every visit. */
export function rng(seed = 7) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const polar = (r: number, deg: number) => new THREE.Vector3(Math.cos(deg * DEG) * r, 0, Math.sin(deg * DEG) * r);
/** Rotation that makes an object's +z front face the town centre from polar angle `deg`. */
export const faceCentre = (deg: number) => Math.atan2(-Math.cos(deg * DEG), -Math.sin(deg * DEG));

export class Kit {
  lite: boolean;
  private mats = new Map<string, THREE.MeshStandardMaterial>();
  private geos = new Map<string, THREE.BufferGeometry>();
  /** Materials that glow at night; `on` is how strongly. */
  night: NightMat[] = [];
  textures: THREE.Texture[] = [];

  constructor(lite: boolean) {
    this.lite = lite;
  }

  mat(color: string, opts: { rough?: number; metal?: number; opacity?: number; side?: THREE.Side } = {}) {
    const key = `${color}|${opts.rough ?? 1}|${opts.metal ?? 0}|${opts.opacity ?? 1}|${opts.side ?? 0}`;
    let m = this.mats.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color,
        roughness: opts.rough ?? 1,
        metalness: opts.metal ?? 0,
        transparent: (opts.opacity ?? 1) < 1,
        opacity: opts.opacity ?? 1,
        side: opts.side ?? THREE.FrontSide,
      });
      this.mats.set(key, m);
    }
    return m;
  }

  /** A material that is plain by day and lit from inside at night. */
  glowMat(day: string, glow: string, on = 1.4, key = "") {
    const k = `glow|${day}|${glow}|${key}`;
    let m = this.mats.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: day, roughness: 0.9, emissive: glow, emissiveIntensity: 0 });
      this.mats.set(k, m);
      this.night.push({ mat: m, on });
    }
    return m;
  }

  private geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
    let g = this.geos.get(key) as T | undefined;
    if (!g) {
      g = make();
      this.geos.set(key, g);
    }
    return g;
  }

  boxGeo(w: number, h: number, d: number, r = 0) {
    const rounded = r > 0 && !this.lite;
    return this.geo(`box${w}|${h}|${d}|${rounded ? r : 0}`, () =>
      (rounded ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d)).translate(0, h / 2, 0),
    );
  }

  /** A box whose bottom sits on y = 0 of its parent (models stand on things). */
  box(w: number, h: number, d: number, m: THREE.Material | string, r = 0.04) {
    const g = this.boxGeo(w, h, d, r);
    const mesh = new THREE.Mesh(g, typeof m === "string" ? this.mat(m) : m);
    mesh.castShadow = !this.lite;
    mesh.receiveShadow = !this.lite;
    return mesh;
  }

  cyl(rt: number, rb: number, h: number, m: THREE.Material | string, seg = 18, open = false) {
    const s = this.lite ? Math.max(8, Math.round(seg * 0.6)) : seg;
    const g = this.geo(`cyl${rt}|${rb}|${h}|${s}|${open}`, () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open).translate(0, h / 2, 0));
    const mesh = new THREE.Mesh(g, typeof m === "string" ? this.mat(m) : m);
    mesh.castShadow = !this.lite;
    mesh.receiveShadow = !this.lite;
    return mesh;
  }

  sphere(r: number, m: THREE.Material | string, seg = 16) {
    const s = this.lite ? Math.max(8, Math.round(seg * 0.6)) : seg;
    const g = this.geo(`sph${r}|${s}`, () => new THREE.SphereGeometry(r, s, Math.round(s * 0.75)));
    const mesh = new THREE.Mesh(g, typeof m === "string" ? this.mat(m) : m);
    mesh.castShadow = !this.lite;
    return mesh;
  }

  cone(r: number, h: number, m: THREE.Material | string, seg = 4) {
    const g = this.geo(`cone${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0));
    const mesh = new THREE.Mesh(g, typeof m === "string" ? this.mat(m) : m);
    mesh.castShadow = !this.lite;
    return mesh;
  }

  /** A blob person: the classic model-railway figure, simplified to clay. */
  person(body: string, skin: string, h = 0.42) {
    const g = new THREE.Group();
    const bodyGeo = this.geo(`cap${h}`, () => new THREE.CapsuleGeometry(h * 0.22, h * 0.42, 4, 10));
    const b = new THREE.Mesh(bodyGeo, this.mat(body));
    b.position.y = h * 0.42;
    b.castShadow = !this.lite;
    const head = this.sphere(h * 0.17, skin, 12);
    head.position.y = h * 0.86;
    g.add(b, head);
    g.userData.body = b;
    return g;
  }

  /** Paint text (a shop sign) onto a canvas texture. Fonts must already be loaded. */
  signTexture(text: string, opts: { bg?: string; fg?: string; font?: string; w?: number; h?: number; weight?: number; size?: number; border?: string } = {}) {
    const w = opts.w ?? 512, h = opts.h ?? 128;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d")!;
    if (opts.bg) {
      x.fillStyle = opts.bg;
      x.fillRect(0, 0, w, h);
    }
    if (opts.border) {
      x.strokeStyle = opts.border;
      x.lineWidth = h * 0.06;
      const i = h * 0.06;
      x.strokeRect(i, i, w - 2 * i, h - 2 * i);
    }
    x.fillStyle = opts.fg ?? C.ink;
    const size = opts.size ?? h * 0.56;
    x.font = `${opts.weight ?? 700} ${size}px ${opts.font ?? '"Bricolage Grotesque Variable", system-ui, sans-serif'}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    let s = size;
    while (x.measureText(text).width > w * 0.9 && s > 8) {
      s -= 2;
      x.font = `${opts.weight ?? 700} ${s}px ${opts.font ?? '"Bricolage Grotesque Variable", system-ui, sans-serif'}`;
    }
    x.fillText(text, w / 2, h / 2 + s * 0.04);
    return this.canvasTex(c);
  }

  canvasTex(c: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    this.textures.push(t);
    return t;
  }

  /** A flat sign: plane with a painted face that also glows a little at night. */
  sign(text: string, w: number, h: number, opts: Parameters<Kit["signTexture"]>[1] & { glow?: number } = {}) {
    const tex = this.signTexture(text, { w: 512, h: Math.round((512 * h) / w), ...opts });
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, transparent: !opts.bg, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0 });
    this.night.push({ mat: m, on: opts.glow ?? 0.85 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    return mesh;
  }

  /** A tiny QR-like pattern for the table stands and the bus pass. Decorative, not scannable. */
  qrTexture(seed = 3) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!;
    x.fillStyle = "#f6f1e6";
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = "#222";
    const r = rng(seed);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (r() > 0.5) x.fillRect(5 + i * 6, 5 + j * 6, 6, 6);
    for (const [px, py] of [[5, 5], [41, 5], [5, 41]]) {
      x.fillRect(px, py, 18, 18);
      x.fillStyle = "#f6f1e6";
      x.fillRect(px + 3, py + 3, 12, 12);
      x.fillStyle = "#222";
      x.fillRect(px + 6, py + 6, 6, 6);
    }
    const t = this.canvasTex(c);
    t.magFilter = THREE.NearestFilter;
    return t;
  }

  /** Soft round light pool, used under street lamps and for the contact shadow. */
  radialTexture(inner: string, outer: string) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return this.canvasTex(c);
  }

  dispose() {
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}

/** A row of windows painted with the shared night material. */
export function windows(kit: Kit, parent: THREE.Object3D, o: { cols: number; rows: number; w: number; h: number; gapX: number; gapY: number; y0: number; z: number; x0?: number; mat?: THREE.Material }) {
  const m = o.mat ?? kit.glowMat(C.glass, "#ffc26a", 3.6, "win");
  const g = kit.boxGeo(o.w, o.h, 0.03);
  const totalW = (o.cols - 1) * o.gapX;
  for (let r = 0; r < o.rows; r++)
    for (let c = 0; c < o.cols; c++) {
      const w = new THREE.Mesh(g, m);
      w.position.set((o.x0 ?? 0) - totalW / 2 + c * o.gapX, o.y0 + r * o.gapY, o.z);
      parent.add(w);
    }
}
