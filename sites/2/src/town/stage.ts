// The stage: one WebGL renderer, a drone camera that glides between "shots", day and night
// lighting, drag-to-spin with inertia, click-to-pick, and a render loop that sleeps whenever
// the town is off screen or the tab is hidden.
import * as THREE from "three";
import { Kit } from "./kit";

export type Region = [number, number, number, number]; // x0, y0, x1, y1 as fractions of the viewport
export interface Shot {
  target: THREE.Vector3;
  az: number; // radians, 0 = camera on the +z (front) side
  pitch: number; // radians above the horizon
  size: [number, number]; // half-width and half-height (world units) that must fit
  region: Region; // where on screen the subject should sit
}

interface Rig { t: THREE.Vector3; az: number; pitch: number; dist: number; cx: number; cy: number }

const tmp = new THREE.Vector3();

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  turntable = new THREE.Group();
  kit: Kit;
  lite: boolean;
  reduce: boolean;
  night = 0;
  nightTarget = 0;
  /** Supplies the shot the camera should glide toward this frame. */
  director: (dt: number) => Shot;
  pickables: THREE.Object3D[] = [];
  onPick: (id: string) => void = () => {};
  onHover: (id: string | null) => void = () => {};
  canSpin: () => boolean = () => true;
  /** Extra pitch/zoom from the visitor's own drag (play mode). */
  userPitch = 0;
  spinVel = 0;
  spinIdle = 0.045;
  playMode = false;

  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fill: THREE.DirectionalLight;
  private rig: Rig | null = null;
  private frameFns: ((dt: number, time: number) => void)[] = [];
  private raf = 0;
  private visible = true;
  private running = false;
  private last = 0;
  private time = 0;
  private interacting = 0;
  private hoverXY: [number, number] | null = null;
  private hovered: string | null = null;
  private ray = new THREE.Raycaster();
  private W = 1;
  private H = 1;

  constructor(opts: { canvas: HTMLCanvasElement; host: HTMLElement; lite: boolean; reduce: boolean; night: boolean }) {
    this.canvas = opts.canvas;
    this.host = opts.host;
    this.lite = opts.lite;
    this.reduce = opts.reduce;
    this.kit = new Kit(opts.lite);
    this.night = this.nightTarget = opts.night ? 1 : 0;
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, opts.lite ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !opts.lite;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(opts.lite ? 34 : 28, 1, 0.5, 400);
    this.scene.add(this.turntable);

    this.hemi = new THREE.HemisphereLight("#fff3e0", "#b9a98a", 1.7);
    this.sun = new THREE.DirectionalLight("#fff1d6", 2.6);
    this.sun.castShadow = !opts.lite;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -14;
    sc.right = sc.top = 14;
    sc.near = 1;
    sc.far = 60;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.radius = 3;
    this.fill = new THREE.DirectionalLight("#dbe6ff", 0.35);
    this.fill.position.set(-10, 6, 8);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.fill);

    this.director = () => ({ target: new THREE.Vector3(), az: 0, pitch: 0.6, size: [10, 6], region: [0, 0, 1, 1] });
    this.resize();
    new ResizeObserver(() => this.resize()).observe(this.host);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.kick();
    }, { rootMargin: "80px" }).observe(this.host);
    document.addEventListener("visibilitychange", () => this.kick());
    this.bindPointer();
    this.applyNight();
  }

  onFrame(fn: (dt: number, time: number) => void) {
    this.frameFns.push(fn);
  }

  setNight(on: boolean) {
    this.nightTarget = on ? 1 : 0;
    if (this.reduce) this.night = this.nightTarget;
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.W = w;
    this.H = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.renderOnce();
  }

  /* -------------------------------------------------------------- camera */
  private solve(s: Shot): Rig {
    const tanv = Math.tan((this.camera.fov * Math.PI) / 360);
    const [x0, y0, x1, y1] = s.region;
    const rw = Math.max(0.1, x1 - x0), rh = Math.max(0.1, y1 - y0);
    const dist = Math.max(s.size[1] / (tanv * rh), s.size[0] / (tanv * this.camera.aspect * rw));
    return { t: s.target.clone(), az: s.az, pitch: s.pitch, dist, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }

  private placeCamera(r: Rig) {
    const cp = Math.cos(r.pitch);
    this.camera.position.set(r.t.x + Math.sin(r.az) * cp * r.dist, r.t.y + Math.sin(r.pitch) * r.dist, r.t.z + Math.cos(r.az) * cp * r.dist);
    this.camera.lookAt(r.t);
    this.camera.near = Math.max(0.2, r.dist * 0.05);
    this.camera.far = r.dist * 4 + 40;
    this.camera.setViewOffset(this.W, this.H, this.W * (0.5 - r.cx), this.H * (0.5 - r.cy), this.W, this.H);
    this.camera.updateProjectionMatrix();
  }

  private stepCamera(dt: number, snap = false) {
    const s = this.director(dt);
    s.pitch = Math.min(1.45, Math.max(0.12, s.pitch + this.userPitch));
    const want = this.solve(s);
    if (!this.rig || snap) this.rig = want;
    else {
      const k = 1 - Math.exp(-dt * (this.reduce ? 9 : 3.2));
      const r = this.rig;
      r.t.lerp(want.t, k);
      let da = want.az - r.az;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      r.az += da * k;
      r.pitch += (want.pitch - r.pitch) * k;
      r.dist = Math.exp(Math.log(r.dist) + (Math.log(want.dist) - Math.log(r.dist)) * k);
      r.cx += (want.cx - r.cx) * k;
      r.cy += (want.cy - r.cy) * k;
    }
    this.placeCamera(this.rig);
  }

  /** Screen position (CSS px within the host) of a world point; null when behind the camera. */
  project(v: THREE.Vector3) {
    tmp.copy(v).project(this.camera);
    if (tmp.z > 1) return null;
    return { x: (tmp.x * 0.5 + 0.5) * this.W, y: (-tmp.y * 0.5 + 0.5) * this.H };
  }

  /* -------------------------------------------------------------- light */
  private applyNight() {
    const n = this.night;
    const c = new THREE.Color();
    this.hemi.color.copy(c.set("#fff3e0").lerp(new THREE.Color("#7f9fe0"), n));
    this.hemi.groundColor.copy(c.set("#b9a98a").lerp(new THREE.Color("#2c3a5c"), n));
    this.hemi.intensity = 1.7 - n * 0.3;
    // The sun sets behind the town; the moon rises on the other side.
    const a = n * Math.PI;
    this.sun.position.set(Math.cos(a) * 12 + 2, 16 - Math.sin(a) * 3, 9 - n * 16);
    this.sun.color.copy(c.set("#fff1d6").lerp(new THREE.Color("#b4caff"), n));
    this.sun.intensity = 2.6 - n * 1.15;
    this.fill.intensity = 0.35 + n * 0.25;
    for (const nm of this.kit.night) nm.mat.emissiveIntensity = n * nm.on;
  }

  /* -------------------------------------------------------------- pointer */
  private bindPointer() {
    const el = this.canvas;
    let down: { x: number; y: number; id: number; t: number; drag: boolean; lastX: number; lastY: number; lastT: number; type: string } | null = null;
    el.addEventListener("pointerdown", (e) => {
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now(), drag: false, lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), type: e.pointerType };
      if (e.pointerType === "mouse" || this.playMode) el.setPointerCapture(e.pointerId);
      this.spinVel = 0;
      this.interacting = 2;
      this.kick();
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") {
        const r = el.getBoundingClientRect();
        this.hoverXY = [e.clientX - r.left, e.clientY - r.top];
        this.kick();
      }
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.lastX, dy = e.clientY - down.lastY;
      const tot = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (!down.drag && tot > 6 && this.canSpin()) down.drag = Math.abs(e.clientX - down.x) > Math.abs(e.clientY - down.y) * 0.8 || this.playMode || down.type === "mouse";
      if (down.drag) {
        const now = performance.now();
        const step = (dx / Math.max(320, this.W)) * Math.PI * 1.6;
        this.turntable.rotation.y += step;
        this.spinVel = step / Math.max(0.008, (now - down.lastT) / 1000);
        if (this.playMode || down.type === "mouse") this.userPitch = Math.min(0.5, Math.max(-0.35, this.userPitch + dy * 0.004));
        down.lastT = now;
        this.interacting = 2;
        el.classList.add("is-dragging");
      }
      down.lastX = e.clientX;
      down.lastY = e.clientY;
    });
    const end = (e: PointerEvent, cancelled: boolean) => {
      if (!down || e.pointerId !== down.id) return;
      if (!cancelled && !down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) {
        const r = el.getBoundingClientRect();
        const id = this.pick(e.clientX - r.left, e.clientY - r.top);
        if (id) this.onPick(id);
      }
      if (!down.drag) this.spinVel = 0;
      el.classList.remove("is-dragging");
      down = null;
    };
    el.addEventListener("pointerup", (e) => end(e, false));
    el.addEventListener("pointercancel", (e) => end(e, true));
    el.addEventListener("pointerleave", () => {
      this.hoverXY = null;
      if (this.hovered) {
        this.hovered = null;
        this.onHover(null);
        el.style.cursor = "";
      }
    });
  }

  pick(x: number, y: number): string | null {
    this.ray.setFromCamera(new THREE.Vector2((x / this.W) * 2 - 1, -(y / this.H) * 2 + 1), this.camera);
    const hit = this.ray.intersectObjects(this.pickables, false)[0];
    return (hit?.object.userData.lot as string) ?? null;
  }

  /* -------------------------------------------------------------- loop */
  kick() {
    const want = this.visible && !document.hidden;
    if (want && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    } else if (!want && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.frame(dt);
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(dt: number) {
    if (Math.abs(this.night - this.nightTarget) > 0.001) {
      this.night += (this.nightTarget - this.night) * (1 - Math.exp(-dt * 2.2));
      if (Math.abs(this.night - this.nightTarget) < 0.002) this.night = this.nightTarget;
      this.applyNight();
    }
    // Spin: inertia after a drag, a slow idle turn, or a glide home when the tour moves on.
    this.interacting = Math.max(0, this.interacting - dt);
    if (this.canSpin()) {
      if (this.interacting <= 0 || this.spinVel !== 0) {
        this.turntable.rotation.y += this.spinVel * dt;
        this.spinVel *= Math.exp(-dt * 2.4);
        if (Math.abs(this.spinVel) < 0.01) this.spinVel = 0;
      }
      if (this.interacting <= 0 && this.spinVel === 0 && !this.reduce) this.turntable.rotation.y += this.spinIdle * dt;
    } else {
      this.spinVel = 0;
      const r = this.turntable.rotation.y;
      const home = Math.round(r / (Math.PI * 2)) * Math.PI * 2;
      this.turntable.rotation.y += (home - r) * (1 - Math.exp(-dt * 2.5));
      this.userPitch *= Math.exp(-dt * 3);
    }
    for (const f of this.frameFns) f(dt, this.time);
    this.stepCamera(dt);
    if (this.hoverXY) {
      const id = this.pick(this.hoverXY[0], this.hoverXY[1]);
      if (id !== this.hovered) {
        this.hovered = id;
        this.canvas.style.cursor = id ? "pointer" : "";
        this.onHover(id);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  renderOnce() {
    if (!this.rig) return;
    this.placeCamera(this.rig);
    this.renderer.render(this.scene, this.camera);
  }

  /** Jump the camera straight to its shot (first frame, reduced motion). */
  snap() {
    this.stepCamera(0, true);
  }

  get seconds() {
    return this.time;
  }
}
