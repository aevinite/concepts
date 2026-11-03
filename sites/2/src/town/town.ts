// Tiny Town: lays the lots out on the round model base, runs the traffic, the train, the kite,
// the road works (Process) and the coloured districts (Services), and plays the build-up intro.
import * as THREE from "three";
import gsap from "gsap";
import { MARQUEE } from "@shared/content";
import { C, DEG, Kit, polar, faceCentre, rng } from "./kit";
import * as B from "./buildings";
import type { Ctx, Lot, LotId } from "./buildings";

export type Mode = "town" | "aevidine" | "campus";

export interface Town {
  root: THREE.Group;
  lots: Map<LotId, Lot>;
  pickables: THREE.Object3D[];
  radius: number;
  update(dt: number, time: number, night: number): void;
  assemble(instant: boolean): Promise<void>;
  setDistrict(lots: LotId[] | null, color?: string): void;
  setRoad(stage: number): void;
  setHover(id: string | null): void;
  lift(id: LotId | null): void;
  showKite(on: boolean): void;
  roadCentre(): THREE.Vector3;
  bus: THREE.Group | null;
  on(ev: "board" | "near" | "cut", fn: () => void): void;
  kiteCut(): void;
  toot(): void;
}

type Pop = { obj: THREE.Object3D; delay: number; kind: "drop" | "pop" | "rise"; base: THREE.Vector3; scale: THREE.Vector3 };

export function buildTown(ctx: Ctx, mode: Mode): Town {
  const { kit } = ctx;
  const root = new THREE.Group();
  const lots = new Map<LotId, Lot>();
  const pickables: THREE.Object3D[] = [];
  const updaters: ((dt: number, time: number, night: number) => void)[] = [];
  const pops: Pop[] = [];
  const listeners: Record<string, (() => void)[]> = {};
  const emit = (e: string) => (listeners[e] ?? []).forEach((f) => f());
  const R = mode === "town" ? 10 : mode === "aevidine" ? 5.4 : 6.3;
  const rand = rng(mode === "town" ? 21 : 5);

  /* ---------- the model base: walnut plinth, brass rim, grass top, contact shadow */
  const baseG = new THREE.Group();
  const plinth = kit.cyl(R + 0.35, R + 0.55, 1.1, kit.mat(C.walnut, { rough: 0.75 }), 96);
  plinth.position.y = -1.1;
  const rim = kit.cyl(R + 0.42, R + 0.42, 0.07, kit.mat(C.brass, { rough: 0.45, metal: 0.4 }), 96, true);
  rim.position.y = -0.06;
  const lip = kit.cyl(R + 0.6, R + 0.6, 0.1, kit.mat(C.walnutDark, { rough: 0.8 }), 96);
  lip.position.y = -1.18;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R + 0.36, kit.lite ? 64 : 128), kit.mat(C.grass));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.004;
  ground.receiveShadow = !kit.lite;
  baseG.add(plinth, rim, lip, ground);
  // Brass plaque on the front of the plinth.
  const plaque = kit.sign(mode === "town" ? "AEVINITE  ·  TINY TOWN  ·  AHMEDABAD" : mode === "aevidine" ? "AEVIDINE  ·  ONE RESTAURANT, ONE SYSTEM" : "CAMPUS CONVEYANCE  ·  THE 7:10 BUS", 3.6, 0.3, { bg: "#c4a364", fg: "#3f2f25", weight: 650, size: 26, font: '"JetBrains Mono Variable", ui-monospace, monospace' });
  plaque.position.set(0, -0.58, R + 0.5);
  plaque.rotation.x = -0.18;
  baseG.add(plaque);
  const shadowTex = kit.radialTexture("rgba(40,28,18,0.38)", "rgba(40,28,18,0)");
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry((R + 1) * 3, (R + 1) * 3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.24;
  root.add(shadow);
  root.add(baseG);
  pops.push({ obj: baseG, delay: 0, kind: "rise", base: baseG.position.clone(), scale: new THREE.Vector3(1, 1, 1) });

  const place = (l: Lot, p: THREE.Vector3, rotY: number, delay: number, scale = 1) => {
    l.group.position.copy(p);
    l.group.rotation.y = rotY;
    l.group.scale.setScalar(scale);
    root.add(l.group);
    lots.set(l.id, l);
    pickables.push(l.hit);
    if (l.update) updaters.push(l.update);
    pops.push({ obj: l.group, delay, kind: "drop", base: p.clone(), scale: l.group.scale.clone() });
    return l;
  };

  /* ---------- a ring road with a roll-out intro */
  let roadMesh: THREE.Mesh | null = null;
  let dashes: THREE.InstancedMesh | null = null;
  const ringRoad = (r0: number, r1: number) => {
    const g = new THREE.RingGeometry(r0, r1, 128, 1);
    g.rotateX(-Math.PI / 2);
    roadMesh = new THREE.Mesh(g, kit.mat(C.road));
    roadMesh.position.y = 0.012;
    roadMesh.receiveShadow = !kit.lite;
    root.add(roadMesh);
    for (const [rr, w] of [[r0 - 0.06, 0.12], [r1 + 0.06, 0.12]] as const) {
      const k = new THREE.Mesh(new THREE.RingGeometry(rr - w / 2, rr + w / 2, 128, 1).rotateX(-Math.PI / 2), kit.mat(C.kerb));
      k.position.y = 0.03;
      root.add(k);
    }
    const n = 48;
    dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.01, 0.05), kit.mat(C.roadLine), n);
    const m = new THREE.Matrix4();
    const mid = (r0 + r1) / 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      m.makeRotationY(-a - Math.PI / 2).setPosition(Math.cos(a) * mid, 0.03, Math.sin(a) * mid);
      dashes.setMatrixAt(i, m);
    }
    root.add(dashes);
  };

  /* ---------- trees as instanced clay lollipops */
  let treeTop: THREE.InstancedMesh | null = null, treeTrunk: THREE.InstancedMesh | null = null;
  const treeData: { p: THREE.Vector3; s: number; delay: number }[] = [];
  const plantTrees = (count: number, ok: (x: number, z: number) => boolean, extra: THREE.Vector3[] = []) => {
    const pts = [...extra];
    let guard = 0;
    while (pts.length < count && guard++ < 5000) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * (R - 0.4);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!ok(x, z)) continue;
      if (pts.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 0.55)) continue;
      pts.push(new THREE.Vector3(x, 0, z));
    }
    const topGeo = new THREE.IcosahedronGeometry(0.42, kit.lite ? 0 : 1);
    const trunkGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.4, 6).translate(0, 0.2, 0);
    treeTop = new THREE.InstancedMesh(topGeo, kit.mat("#ffffff"), pts.length);
    treeTrunk = new THREE.InstancedMesh(trunkGeo, kit.mat(C.trunk), pts.length);
    treeTop.castShadow = treeTrunk.castShadow = !kit.lite;
    const col = new THREE.Color();
    pts.forEach((p, i) => {
      const s = 0.75 + rand() * 0.6;
      treeData.push({ p, s, delay: 1.0 + (p.length() / R) * 0.9 + rand() * 0.3 });
      treeTop!.setColorAt(i, col.set(C.leaf[i % C.leaf.length]));
    });
    setTrees(1);
    root.add(treeTop, treeTrunk);
  };
  const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), ts = new THREE.Vector3(), tp = new THREE.Vector3();
  const setTrees = (time: number) => {
    if (!treeTop || !treeTrunk) return;
    treeData.forEach((d, i) => {
      const k = Math.min(1, Math.max(0, (time - d.delay) / 0.45));
      const e = k === 1 ? 1 : backOut(k);
      const s = Math.max(0.0001, e * d.s);
      ts.set(s, s, s);
      tm.compose(tp.copy(d.p), tq, ts);
      treeTrunk!.setMatrixAt(i, tm);
      ts.set(s, s * 1.12, s);
      tm.compose(tp.set(d.p.x, d.p.y + 0.55 * s, d.p.z), tq, ts);
      treeTop!.setMatrixAt(i, tm);
    });
    treeTop.instanceMatrix.needsUpdate = treeTrunk.instanceMatrix.needsUpdate = true;
  };

  /* ---------- street lamps with light pools that only show at night */
  const poolMat = new THREE.MeshBasicMaterial({ map: kit.radialTexture("rgba(255,210,130,1)", "rgba(255,205,120,0)"), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const lamp = (p: THREE.Vector3, faceDeg: number, delay: number) => {
    const l = B.streetLamp(kit);
    l.position.copy(p);
    l.rotation.y = faceDeg;
    root.add(l);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.9), poolMat);
    pool.rotation.x = -Math.PI / 2;
    const off = new THREE.Vector3(0.19, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), faceDeg);
    pool.position.set(p.x + off.x, 0.04, p.z + off.z);
    pool.renderOrder = 1;
    root.add(pool);
    pops.push({ obj: l, delay, kind: "pop", base: l.position.clone(), scale: new THREE.Vector3(1, 1, 1) });
  };

  /* ---------- vehicles going round a ring */
  type Car = { g: THREE.Group; a: number; r: number; v: number; dir: 1 | -1; vmax: number };
  const cars: Car[] = [];
  const addCar = (g: THREE.Group, r: number, a: number, vmax: number, dir: 1 | -1) => {
    root.add(g);
    const c: Car = { g, a, r, v: vmax, dir, vmax };
    cars.push(c);
    pops.push({ obj: g, delay: 2.1 + cars.length * 0.08, kind: "pop", base: new THREE.Vector3(), scale: new THREE.Vector3(1, 1, 1) });
    return c;
  };
  const placeCar = (c: Car) => {
    c.g.position.set(Math.cos(c.a) * c.r, 0, Math.sin(c.a) * c.r);
    c.g.rotation.y = c.dir > 0 ? -c.a - Math.PI / 2 : -c.a + Math.PI / 2;
  };

  /* ---------- the bus and its stop */
  let busCar: Car | null = null;
  let stopA = 0;
  let busState: "drive" | "stop" = "drive", busTimer = 0, studentAway = 0, nearFired = false;
  const runBus = (dt: number, night: number) => {
    if (!busCar) return;
    const stop = lots.get("busstop")!;
    const student = stop.points.student;
    const rush = 1 + night * 0.35;
    if (busState === "drive") {
      const diff = ((stopA - busCar.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const studentWaiting = student.visible && studentAway <= 0;
      let v = busCar.vmax * rush;
      if (studentWaiting && diff < 0.9) v = Math.max(0.06, busCar.vmax * rush * Math.min(1, diff / 0.9));
      if (diff > 1.6 && diff < 1.7 && !nearFired) {
        nearFired = true;
        emit("near");
      }
      busCar.a += v * dt;
      if (studentWaiting && diff < 0.012) {
        busState = "stop";
        busTimer = 0;
      }
    } else {
      busTimer += dt * rush;
      if (busTimer > 0.6 && student.userData.state !== "board") {
        student.userData.state = "board";
        stop.poke?.();
        ctx.sound("pop");
        emit("board");
      }
      if (student.userData.state === "board") {
        const k = Math.min(1, (busTimer - 0.6) / 0.6);
        student.scale.setScalar(1 - k * 0.9);
        student.position.y = Math.sin(k * Math.PI) * 0.25;
        if (k >= 1) {
          student.visible = false;
          studentAway = 7;
        }
      }
      if (busTimer > 2.4) {
        busState = "drive";
        nearFired = false;
      }
    }
    if (studentAway > 0) {
      studentAway -= dt;
      if (studentAway <= 0) {
        student.visible = true;
        student.userData.state = "";
        student.position.y = 0;
        gsap.fromTo(student.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2.5)" });
      }
    }
  };

  /* ---------- districts (services on the map) */
  const districtRings = new Map<LotId, THREE.Mesh>();
  const ringFor = (l: Lot) => {
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false });
    const r = l.radius * l.group.scale.x;
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.0, r * 1.18, 48).rotateX(-Math.PI / 2), m);
    ring.position.set(l.group.position.x, 0.05, l.group.position.z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false }));
    disc.position.y = -0.01;
    ring.add(disc);
    ring.renderOrder = 1;
    root.add(ring);
    districtRings.set(l.id, ring);
  };
  let districtOn: Set<LotId> = new Set();
  let hoverId: string | null = null;
  let liftId: LotId | null = null;
  let districtColor = new THREE.Color("#ffffff");

  /* ---------- the road being built (Process) */
  let roadStage = 0, roadShown = 0;
  let roadG: THREE.Group | null = null;
  const roadParts: { obj: THREE.Object3D; at: number; kind: "pop" | "grow" | "rise" }[] = [];
  let lightLamps: THREE.MeshStandardMaterial[] = [];
  let spurCar: THREE.Group | null = null;
  const roadLen = 2.5;
  const buildSpur = (a: number) => {
    roadG = new THREE.Group();
    const p = polar(6.45, a);
    roadG.position.copy(p);
    roadG.rotation.y = -a * DEG;
    root.add(roadG);
    // 1 · Identify: survey stakes, flags, a surveyor with a tripod.
    for (let i = 0; i < 5; i++)
      for (const s of [-1, 1]) {
        const st = new THREE.Group();
        const stick = kit.cyl(0.015, 0.015, 0.32, C.trunk, 5);
        const flag = kit.box(0.1, 0.06, 0.01, "#e86f3c", 0);
        flag.position.set(0.05, 0.25, 0);
        st.add(stick, flag);
        st.position.set(0.25 + i * 0.55, 0, s * 0.62);
        roadG.add(st);
        roadParts.push({ obj: st, at: 1 + i * 0.05, kind: "pop" });
      }
    const surveyor = kit.person("#e86f3c", C.skin[1], 0.4);
    surveyor.position.set(1.3, 0, 1.0);
    const tri = kit.cone(0.08, 0.3, C.ink, 3);
    tri.position.set(1.55, 0, 1.0);
    const scope = kit.box(0.12, 0.05, 0.05, C.amber, 0.01);
    scope.position.set(1.55, 0.3, 1.0);
    roadG.add(surveyor, tri, scope);
    roadParts.push({ obj: surveyor, at: 1, kind: "pop" }, { obj: tri, at: 1.05, kind: "pop" }, { obj: scope, at: 1.1, kind: "pop" });
    // 2 · Improve: the gravel bed rolls out.
    const grav = new THREE.Mesh(new THREE.BoxGeometry(roadLen, 0.04, 1.06).translate(roadLen / 2, 0.02, 0), kit.mat("#b7a68c"));
    grav.receiveShadow = !kit.lite;
    roadG.add(grav);
    roadParts.push({ obj: grav, at: 2, kind: "grow" });
    // 3 · Automate: asphalt, markings and a traffic light that runs itself.
    const asph = new THREE.Mesh(new THREE.BoxGeometry(roadLen, 0.03, 0.92).translate(roadLen / 2, 0.055, 0), kit.mat(C.road));
    asph.receiveShadow = !kit.lite;
    roadG.add(asph);
    roadParts.push({ obj: asph, at: 3, kind: "grow" });
    for (let i = 0; i < 4; i++) {
      const d = kit.box(0.26, 0.01, 0.05, C.roadLine, 0);
      d.position.set(0.3 + i * 0.6, 0.085, 0);
      roadG.add(d);
      roadParts.push({ obj: d, at: 3.15 + i * 0.05, kind: "pop" });
    }
    const tl = new THREE.Group();
    tl.position.set(0.25, 0, -0.66);
    const tpole = kit.cyl(0.02, 0.02, 0.62, "#2f3433", 6);
    const head = kit.box(0.09, 0.26, 0.09, "#2f3433", 0.02);
    head.position.y = 0.6;
    tl.add(tpole, head);
    lightLamps = ["#e0473a", "#efa037", "#45b36b"].map((c, i) => {
      const m = new THREE.MeshStandardMaterial({ color: "#3a3a3a", emissive: c, emissiveIntensity: 0, roughness: 0.6 });
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), m);
      s.position.set(0, 0.81 - i * 0.075, 0.048);
      tl.add(s);
      return m;
    });
    roadG.add(tl);
    roadParts.push({ obj: tl, at: 3.3, kind: "pop" });
    // 4 · Scale: new buildings rise along the new road, traffic starts using it.
    const shop = new THREE.Group();
    const sb = kit.box(1.0, 0.85, 0.8, "#e8c9a0", 0.05);
    const sr = kit.box(1.06, 0.07, 0.86, C.green, 0.02);
    sr.position.y = 0.85;
    shop.add(sb, sr);
    B_windows(kit, shop);
    const ss = kit.sign("Your business", 0.84, 0.17, { fg: C.paper, bg: C.green, weight: 700 });
    ss.position.set(0, 0.68, 0.41);
    shop.add(ss);
    shop.position.set(1.3, 0, -1.25);
    const ware = new THREE.Group();
    const wb = kit.box(1.1, 0.7, 0.8, "#cdd8cf", 0.05);
    const wr = kit.box(1.16, 0.07, 0.86, C.terracotta, 0.02);
    wr.position.y = 0.7;
    ware.add(wb, wr);
    B_windows(kit, ware);
    ware.position.set(1.4, 0, 1.3);
    ware.rotation.y = Math.PI;
    roadG.add(shop, ware);
    roadParts.push({ obj: shop, at: 4, kind: "rise" }, { obj: ware, at: 4.15, kind: "rise" });
    spurCar = B.car(kit, "#5d86a8");
    spurCar.scale.setScalar(0.85);
    roadG.add(spurCar);
    roadParts.push({ obj: spurCar, at: 4.3, kind: "pop" });
    roadParts.forEach((p) => {
      p.obj.userData.s0 = p.obj.scale.clone();
      p.obj.visible = false;
    });
  };
  const applyRoad = (dt: number, time: number) => {
    if (!roadG) return;
    roadShown += (roadStage - roadShown) * (1 - Math.exp(-dt * 2.6));
    for (const p of roadParts) {
      const k = Math.min(1, Math.max(0, (roadShown - p.at + 0.85) / 0.85));
      p.obj.visible = k > 0.001;
      const s0 = p.obj.userData.s0 as THREE.Vector3;
      if (p.kind === "grow") p.obj.scale.set(Math.max(0.001, k), 1, 1);
      else if (p.kind === "rise") p.obj.scale.set(s0.x, s0.y * Math.max(0.001, backOut(k)), s0.z);
      else p.obj.scale.copy(s0).multiplyScalar(Math.max(0.001, backOut(k)));
    }
    // The traffic light cycles on its own once the road is automated.
    const phase = Math.floor(time / 1.4) % 3;
    lightLamps.forEach((m, i) => (m.emissiveIntensity = roadShown > 2.6 ? (i === [0, 2, 1][phase] ? 2.2 : 0.05) : 0));
    if (spurCar && spurCar.visible) {
      const t = (time * 0.35) % 2;
      const x = t < 1 ? t : 2 - t;
      spurCar.position.set(0.2 + x * (roadLen - 0.5), 0.07, t < 1 ? 0.22 : -0.22);
      spurCar.rotation.y = t < 1 ? 0 : Math.PI;
    }
  };

  /* ---------- the kite (an Uttarayan easter egg) and the train */
  let kite: THREE.Group | null = null, kiteLine: THREE.Line | null = null, kiteAnchor = new THREE.Vector3(), kiteCut = -1;
  const kiteHome = new THREE.Vector3();
  let train: THREE.Group[] = [];
  let trainA = 0, trainBoost = 0;
  const TR = R - 0.65;

  /* ================================================================ layouts */
  if (mode === "town") {
    ringRoad(5.0, 6.5);
    const river = buildRiver(kit, R, 7.25);
    root.add(river.group);
    pops.push({ obj: river.group, delay: 0.35, kind: "rise", base: river.group.position.clone(), scale: new THREE.Vector3(1, 1, 1) });
    updaters.push(river.update);
    // Plaza and park paths.
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(1.2, 40).rotateX(-Math.PI / 2), kit.mat(C.path));
    plaza.position.set(-2.1, 0.01, -2.3);
    plaza.receiveShadow = !kit.lite;
    root.add(plaza);
    const fountain = new THREE.Group();
    const basin = kit.cyl(0.55, 0.6, 0.16, C.kerb, 28);
    const water = kit.cyl(0.48, 0.48, 0.02, kit.mat(C.water, { rough: 0.3 }), 28);
    water.position.y = 0.14;
    const spout = kit.cyl(0.07, 0.1, 0.42, C.kerb, 10);
    fountain.add(basin, water, spout);
    fountain.position.set(-2.1, 0, -2.3);
    root.add(fountain);
    pops.push({ obj: fountain, delay: 1.25, kind: "pop", base: fountain.position.clone(), scale: new THREE.Vector3(1, 1, 1) });
    for (const [x, z, r] of [[-3.2, -1.5, 0.6], [-1.0, -3.3, -0.9]] as const) {
      const bench = kit.box(0.5, 0.12, 0.16, C.trunk, 0.02);
      bench.position.set(x, 0, z);
      bench.rotation.y = r;
      root.add(bench);
    }
    const strollers = [kit.person(C.people[4], C.skin[2], 0.4), kit.person(C.people[1], C.skin[0], 0.38)];
    strollers.forEach((s) => root.add(s));
    updaters.push((_dt, time) => {
      strollers.forEach((s, i) => {
        const a = time * (0.25 + i * 0.08) + i * 2.6;
        s.position.set(-2.1 + Math.cos(a) * (0.95 + i * 0.12), 0.01, -2.3 + Math.sin(a) * (0.95 + i * 0.12));
        s.rotation.y = -a;
      });
    });

    let d = 0.9;
    place(B.restaurant(ctx), new THREE.Vector3(-2.2, 0, 1.45), 0, (d += 0.1));
    place(B.studio(ctx), new THREE.Vector3(1.9, 0, -1.95), -0.3, (d += 0.1));
    place(B.bakery(ctx), new THREE.Vector3(2.35, 0, 2.3), -0.35, (d += 0.1));
    place(B.college(ctx), polar(7.95, -90), faceCentre(-90), (d += 0.1));
    const stop = place(B.busStop(ctx), polar(6.98, -76), faceCentre(-76), (d += 0.06));
    stopA = Math.atan2(stop.group.position.z, stop.group.position.x) - 0.06;
    place(B.hospital(ctx), polar(8.05, -5), faceCentre(-5), (d += 0.1));
    place(B.postOffice(ctx), polar(7.85, 25), faceCentre(25), (d += 0.1));
    place(B.hackathon(ctx), polar(8.0, -168), faceCentre(-168), (d += 0.1));
    place(B.dishes(ctx), polar(7.85, -132), faceCentre(-132), (d += 0.1));
    const pol = B.polHouses(ctx);
    pol.group.position.copy(polar(8.05, 155));
    pol.group.rotation.y = faceCentre(155);
    root.add(pol.group);
    pops.push({ obj: pol.group, delay: (d += 0.1), kind: "drop", base: pol.group.position.clone(), scale: new THREE.Vector3(1, 1, 1) });
    buildSpur(-45);
    for (const id of ["restaurant", "studio", "bakery", "college", "busstop", "hospital", "postoffice", "hackathon", "dishes"] as LotId[]) ringFor(lots.get(id)!);

    // Lamps along the ring road and the riverfront.
    for (const a of [-120, -58, 12, 40, 62, 90, 118, 178, -150]) lamp(polar(6.82, a), -a * DEG + Math.PI, 1.6 + (a + 180) / 900);
    for (const a of [-120, -30, 70, 180]) lamp(polar(4.72, a), -a * DEG, 1.7 + (a + 180) / 900);

    // Traffic: the Campus bus, two auto-rickshaws, a car.
    const bg = B.bus(kit);
    busCar = addCar(bg, 6.02, stopA - 2.2, 0.32, 1);
    bg.add(hitBox(kit, 1.5, 0.8, 0.7, "busstop"));
    pickables.push(bg.children[bg.children.length - 1]);
    addCar(B.rickshaw(kit), 5.45, 1.0, 0.42, -1);
    addCar(B.rickshaw(kit, "#2f6b4f", "#e8c241"), 5.45, 4.1, 0.36, -1);
    const car = addCar(B.car(kit, "#d9e1e6"), 6.02, stopA + 2.6, 0.3, 1);
    updaters.push(() => {
      // The car never drives into the back of the bus.
      if (!busCar) return;
      const gap = ((busCar.a - car.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      car.v = gap < 0.42 ? Math.min(car.vmax, busState === "stop" ? 0 : busCar.vmax) : car.vmax;
    });

    // The model railway round the rim, wagons carrying what we build.
    buildTrack(kit, root, TR, R, pops);
    train = buildTrain(kit, MARQUEE as readonly string[]);
    train.forEach((w) => root.add(w));
    trainA = -2.4;
    const thit = hitBox(kit, 1.3, 0.7, 0.6, "train");
    train[0].add(thit);
    pickables.push(thit);
    pops.push(...train.map((w, i) => ({ obj: w, delay: 2.3 + i * 0.06, kind: "pop" as const, base: new THREE.Vector3(), scale: new THREE.Vector3(1, 1, 1) })));

    // The kite over the pol houses.
    const roof = pol.roofs[1].clone();
    pol.group.updateMatrixWorld(true);
    kiteAnchor = pol.group.localToWorld(roof.clone());
    kiteHome.set(kiteAnchor.x + 2.2, 5.2, kiteAnchor.z - 2.2);
    const k = buildKite(kit);
    kite = k.kite;
    kiteLine = k.line;
    root.add(kite, kiteLine);
    const khit = hitBox(kit, 1.2, 1.2, 1.2, "kite");
    khit.position.y = -0.6;
    kite.add(khit);
    pickables.push(khit);

    plantTrees(kit.lite ? 34 : 70, (x, z) => {
      const r = Math.hypot(x, z);
      if (r > 4.75 && r < 6.8) return false;
      if (r > TR - 0.55) return false;
      if (z > 7.0) return false;
      for (const l of lots.values()) {
        const p = l.group.position;
        if ((p.x - x) ** 2 + (p.z - z) ** 2 < (l.radius * 1.05) ** 2) return false;
      }
      if ((x + 2.1) ** 2 + (z + 2.3) ** 2 < 1.6) return false;
      const pp = pol.group.position;
      if ((pp.x - x) ** 2 + (pp.z - z) ** 2 < 4.8) return false;
      const sp = polar(7.6, -45);
      if ((sp.x - x) ** 2 + (sp.z - z) ** 2 < 4.6) return false;
      return true;
    });
  } else if (mode === "aevidine") {
    // One restaurant on its own base, a street in front, the owner across the road.
    const street = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.2, 1.3).rotateX(-Math.PI / 2), kit.mat(C.road));
    street.position.set(0, 0.012, 3.15);
    street.receiveShadow = !kit.lite;
    const pave = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.2, 0.7).rotateX(-Math.PI / 2), kit.mat(C.path));
    pave.position.set(0, 0.014, 2.15);
    root.add(street, pave);
    clipToDisc(street, R + 0.3);
    clipToDisc(pave, R + 0.3);
    for (let i = -4; i <= 4; i++) {
      const dsh = kit.box(0.3, 0.01, 0.05, C.roadLine, 0);
      dsh.position.set(i * 0.9, 0.02, 3.15);
      if (Math.hypot(i * 0.9, 3.15) < R - 0.2) root.add(dsh);
    }
    const r = place(B.restaurant(ctx), new THREE.Vector3(0, 0, -0.55), 0, 0.9, 1.3);
    r.group.add(managerFigure(kit));
    r.points.manager = r.group.children[r.group.children.length - 1];
    const owner = kit.person("#2f4a6b", C.skin[1], 0.44);
    const ph = kit.box(0.05, 0.09, 0.012, kit.glowMat("#ffd27a", "#ffd27a", 2, "phone"), 0);
    ph.position.set(0.09, 0.3, 0.12);
    owner.add(ph);
    owner.position.set(2.6, 0, 4.15);
    owner.rotation.y = Math.PI;
    root.add(owner);
    pops.push({ obj: owner, delay: 1.6, kind: "pop", base: owner.position.clone(), scale: new THREE.Vector3(1, 1, 1) });
    r.points.owner = owner;
    lamp(new THREE.Vector3(-2.6, 0, 2.4), Math.PI / 2, 1.5);
    lamp(new THREE.Vector3(2.0, 0, 2.4), Math.PI / 2, 1.55);
    const c1 = B.car(kit, "#d9e1e6");
    const c2 = B.rickshaw(kit);
    root.add(c1, c2);
    updaters.push((_dt, time) => {
      const w = Math.sqrt(R * R - 3.15 * 3.15) - 0.4;
      const x1 = ((time * 0.7) % (2 * w)) - w;
      c1.position.set(x1, 0, 3.4);
      c1.rotation.y = 0;
      c1.visible = Math.abs(x1) < w - 0.05;
      const x2 = w - ((time * 0.55 + 3) % (2 * w));
      c2.position.set(x2, 0, 2.9);
      c2.rotation.y = Math.PI;
      c2.visible = Math.abs(x2) < w - 0.05;
    });
    plantTrees(kit.lite ? 10 : 18, (x, z) => z < -2.6 || (Math.abs(x) > 3.4 && z < 1.6));
  } else {
    // Campus: the college, the loop road, the stop, a parent at home, the agency, the admin.
    ringRoad(2.85, 3.95);
    place(B.college(ctx), new THREE.Vector3(0, 0, -5.0), 0, 0.9, 0.82);
    const stop = place(B.busStop(ctx), polar(4.45, -62), faceCentre(-62), 1.0);
    stopA = Math.atan2(stop.group.position.z, stop.group.position.x) - 0.08;
    place(B.parentHouse(ctx), polar(4.95, 140), faceCentre(140), 1.1);
    place(B.office(ctx, "agency", "Agency", "#e6d3b3"), polar(5.0, 32), faceCentre(32), 1.2);
    place(B.office(ctx, "admin", "Admin", "#d5ddd2"), new THREE.Vector3(0, 0, 0.5), 0, 1.3, 0.9);
    const bg = B.bus(kit);
    busCar = addCar(bg, 3.6, stopA - 2.5, 0.42, 1);
    bg.add(hitBox(kit, 1.5, 0.8, 0.7, "busstop"));
    pickables.push(bg.children[bg.children.length - 1]);
    addCar(B.rickshaw(kit), 3.18, 2, 0.5, -1);
    for (const a of [-150, -20, 80, 200]) lamp(polar(4.25, a), -a * DEG + Math.PI, 1.6);
    plantTrees(kit.lite ? 16 : 30, (x, z) => {
      const r = Math.hypot(x, z);
      if (r > 2.6 && r < 4.3) return false;
      for (const l of lots.values()) {
        const p = l.group.position;
        if ((p.x - x) ** 2 + (p.z - z) ** 2 < (l.radius * l.group.scale.x * 1.1) ** 2) return false;
      }
      return r < R - 0.4;
    });
  }

  /* ---------- fireflies (night only) */
  const ffN = kit.lite ? 24 : 60;
  const ffGeo = new THREE.BufferGeometry();
  const ffBase = new Float32Array(ffN * 3);
  for (let i = 0; i < ffN; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * R * 0.9;
    ffBase.set([Math.cos(a) * r, 0.3 + rand() * 1.6, Math.sin(a) * r], i * 3);
  }
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffBase.slice(), 3));
  const ffMat = new THREE.PointsMaterial({ size: kit.lite ? 0.16 : 0.13, map: kit.radialTexture("rgba(255,236,150,1)", "rgba(255,236,150,0)"), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: "#fff3b0" });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  root.add(fireflies);

  /* ================================================================ per frame */
  let introTime = 0, introOn = false;
  const beamMat = B.beamMaterial(kit);
  const update = (dt: number, time: number, night: number) => {
    if (introOn) {
      introTime += dt;
      setTrees(introTime);
    }
    for (const u of updaters) u(dt, time, night);
    runBus(dt, night);
    for (const c of cars) {
      if (c !== busCar) c.a += c.dir * c.v * dt * (1 + night * 0.25);
      placeCar(c);
    }
    beamMat.opacity = night;
    poolMat.opacity = night;
    ffMat.opacity = night * (0.75 + Math.sin(time * 3) * 0.25);
    if (night > 0.01) {
      const pos = ffGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < ffN; i++) {
        pos.setXYZ(i, ffBase[i * 3] + Math.sin(time * 0.7 + i) * 0.3, ffBase[i * 3 + 1] + Math.sin(time * 1.3 + i * 2) * 0.15, ffBase[i * 3 + 2] + Math.cos(time * 0.6 + i * 3) * 0.3);
      }
      pos.needsUpdate = true;
    }
    // District highlight.
    districtRings.forEach((ring, id) => {
      const on = districtOn.has(id);
      const m = ring.material as THREE.MeshBasicMaterial;
      const dm = (ring.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.color.copy(districtColor);
      dm.color.copy(districtColor);
      m.opacity += ((on ? 0.95 : 0) - m.opacity) * Math.min(1, dt * 6);
      dm.opacity += ((on ? 0.28 : 0) - dm.opacity) * Math.min(1, dt * 6);
    });
    if (!introOn)
      lots.forEach((l, id) => {
        const lift = (districtOn.has(id) ? 0.14 + Math.sin(time * 4) * 0.05 : 0) + (hoverId === id ? 0.2 : 0);
        l.group.position.y += (lift - l.group.position.y) * Math.min(1, dt * 9);
      });
    applyRoad(dt, time);
    // Roofs lift off when the drone looks inside.
    lots.forEach((l, id) => {
      const roof = l.points.roof;
      if (!roof) return;
      const up = liftId === id ? 1 : 0;
      const k = Math.min(1, dt * 3);
      roof.userData.k = (roof.userData.k ?? 0) + (up - (roof.userData.k ?? 0)) * k;
      const e = roof.userData.k as number;
      // Lifted like a kit lid, then carried up and away out of the shot.
      roof.position.set(-e * 2.2, e * 1.6 + e * e * e * 16, -e * 2.6);
      roof.rotation.set(-e * 0.5, 0, e * 0.3);
      roof.scale.setScalar(Math.max(0.001, 1 - e * 0.45));
      roof.visible = e < 0.97;
    });
    // Train.
    if (train.length) {
      trainBoost = Math.max(0, trainBoost - dt * 0.6);
      trainA += dt * (0.1 + trainBoost * 0.5) * (1 + night * 0.3);
      train.forEach((w, i) => {
        const a = trainA - i * (1.22 / TR);
        w.position.set(Math.cos(a) * TR, 0.12, Math.sin(a) * TR);
        w.rotation.y = -a - Math.PI / 2;
      });
    }
    // Kite.
    if (kite && kiteLine) {
      if (kiteCut < 0) {
        kite.position.set(kiteHome.x + Math.sin(time * 0.8) * 0.4, kiteHome.y + Math.sin(time * 1.3) * 0.25, kiteHome.z + Math.cos(time * 0.7) * 0.3);
        kite.rotation.z = Math.sin(time * 1.7) * 0.25;
        kiteLine.visible = kite.visible;
        const lp = kiteLine.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          lp.setXYZ(i, kiteAnchor.x + (kite.position.x - kiteAnchor.x) * t, kiteAnchor.y + (kite.position.y - kiteAnchor.y) * t - Math.sin(t * Math.PI) * 0.6, kiteAnchor.z + (kite.position.z - kiteAnchor.z) * t);
        }
        lp.needsUpdate = true;
      } else {
        kiteCut += dt;
        kiteLine.visible = false;
        kite.position.x += dt * 1.6;
        kite.position.y += dt * (0.9 - kiteCut * 0.2);
        kite.position.z -= dt * 0.8;
        kite.rotation.z += dt * 3;
        if (kiteCut > 7) {
          kiteCut = -1;
          gsap.fromTo(kite.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(2)" });
        }
      }
    }
  };

  /* ================================================================ the build-up intro */
  const assemble = (instant: boolean) =>
    new Promise<void>((resolve) => {
      if (instant) {
        if (roadMesh) (roadMesh as THREE.Mesh).geometry.setDrawRange(0, Infinity);
        setTrees(99);
        resolve();
        return;
      }
      introOn = true;
      introTime = 0;
      const tl = gsap.timeline({ onComplete: () => ((introOn = false), setTrees(99), resolve()) });
      for (const p of pops) {
        if (p.kind === "drop") {
          p.obj.position.y = p.base.y + 9;
          tl.to(p.obj.position, { y: p.base.y, duration: 0.95, ease: "bounce.out" }, p.delay);
          tl.call(() => ctx.sound("thud"), [], p.delay + 0.42);
          tl.fromTo(p.obj.scale, { y: p.scale.y * 0.8 }, { y: p.scale.y, duration: 0.5, ease: "elastic.out(1.2,0.4)" }, p.delay + 0.4);
        } else if (p.kind === "pop") {
          p.obj.scale.setScalar(0.001);
          tl.to(p.obj.scale, { x: p.scale.x, y: p.scale.y, z: p.scale.z, duration: 0.55, ease: "back.out(2.6)" }, p.delay);
        } else {
          p.obj.scale.set(1, 0.001, 1);
          tl.to(p.obj.scale, { y: 1, duration: 0.7, ease: "power3.out" }, p.delay);
        }
      }
      if (roadMesh) {
        const g = (roadMesh as THREE.Mesh).geometry;
        const total = g.index ? g.index.count : 0;
        const o = { k: 0 };
        g.setDrawRange(0, 0);
        tl.to(o, { k: 1, duration: 0.9, ease: "power2.inOut", onUpdate: () => g.setDrawRange(0, Math.floor((total * o.k) / 6) * 6) }, 0.45);
      }
      if (dashes) {
        const dd = dashes as THREE.InstancedMesh;
        const n = dd.count;
        const o = { k: 0 };
        dd.count = 0;
        tl.to(o, { k: 1, duration: 0.9, ease: "power2.inOut", onUpdate: () => (dd.count = Math.floor(n * o.k)) }, 0.55);
      }
      setTrees(0);
    });

  return {
    root,
    lots,
    pickables,
    radius: R,
    update,
    assemble,
    bus: busCar ? (busCar as Car).g : null,
    setDistrict(ids, color) {
      districtOn = new Set(ids ?? []);
      if (color) districtColor = new THREE.Color(color);
    },
    setRoad(stage) {
      roadStage = stage;
    },
    setHover(id) {
      hoverId = id;
    },
    lift(id) {
      liftId = id;
    },
    showKite(on) {
      if (kite && kiteLine) {
        kite.visible = on;
        if (!on) kiteLine.visible = false;
      }
    },
    roadCentre: () => (roadG ? roadG.localToWorld(new THREE.Vector3(1.25, 0, 0)) : new THREE.Vector3()),
    on(ev, fn) {
      (listeners[ev] ??= []).push(fn);
    },
    kiteCut() {
      if (kiteCut < 0) {
        kiteCut = 0;
        emit("cut");
      }
    },
    toot() {
      trainBoost = 1.4;
      ctx.sound("toot");
    },
  };
}

/* ---------------------------------------------------------------- helpers */
function backOut(k: number) {
  const s = 2.2;
  return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
}

function hitBox(kit: Kit, w: number, h: number, d: number, id: string) {
  const m = new THREE.Mesh(kit.boxGeo(w, h, d), kit.mat("#ff00ff"));
  m.visible = false;
  m.userData.lot = id;
  return m;
}

function B_windows(kit: Kit, g: THREE.Group) {
  const m = kit.glowMat(C.glass, "#ffc26a", 3.6, "win");
  for (const x of [-0.25, 0.25]) {
    const w = new THREE.Mesh(kit.boxGeo(0.24, 0.22, 0.03), m);
    w.position.set(x, 0.3, 0.41);
    g.add(w);
  }
}

function managerFigure(kit: Kit) {
  const m = kit.person("#7a5c8a", C.skin[2], 0.44);
  const tab = kit.box(0.14, 0.1, 0.012, kit.glowMat("#e9f1ee", "#c6ffe8", 1.6, "tab"), 0.004);
  tab.position.set(0.1, 0.28, 0.12);
  tab.rotation.x = -0.6;
  m.add(tab);
  m.position.set(1.22, 0.08, -0.82);
  m.rotation.y = -0.6;
  return m;
}

function clipToDisc(mesh: THREE.Mesh, r: number) {
  // Squash the street's ends onto the round base by moving vertices that fall outside it.
  const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i) + mesh.position.z;
    const max = Math.sqrt(Math.max(0, r * r - z * z));
    if (Math.abs(x) > max) pos.setX(i, Math.sign(x) * max);
  }
  pos.needsUpdate = true;
}

function buildRiver(kit: Kit, R: number, z0: number) {
  // The Sabarmati along the front edge, with a riverfront wall and a little boat.
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const a1 = Math.asin(z0 / R), a2 = Math.PI - a1;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = a1 + ((a2 - a1) * i) / steps;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    if (i === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  }
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 12);
  g.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.35, metalness: 0.05 }));
  water.position.y = 0.009;
  water.receiveShadow = !kit.lite;
  group.add(water);
  const half = Math.sqrt(R * R - z0 * z0);
  const wall = kit.box(half * 2, 0.1, 0.16, C.kerb, 0.02);
  wall.position.set(0, 0, z0 - 0.04);
  group.add(wall);
  // Water ripples: thin pale strokes that drift.
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const rp = kit.box(0.5 + (i % 3) * 0.2, 0.005, 0.03, "#c7e0e3", 0);
    rp.position.set(-4 + i * 1.3, 0.012, z0 + 0.6 + (i % 3) * 0.55);
    group.add(rp);
    ripples.push(rp);
  }
  const boat = new THREE.Group();
  const hull = kit.box(0.6, 0.12, 0.22, C.terracotta, 0.06);
  const seat = kit.box(0.16, 0.06, 0.18, C.cream, 0.02);
  seat.position.y = 0.1;
  const rower = kit.person(C.people[2], C.skin[1], 0.32);
  rower.position.set(-0.12, 0.08, 0);
  boat.add(hull, seat, rower);
  group.add(boat);
  const update = (_dt: number, time: number) => {
    const w = half - 1.2;
    const x = Math.sin(time * 0.12) * w;
    boat.position.set(x, Math.sin(time * 2) * 0.012, z0 + 1.05);
    boat.rotation.y = Math.cos(time * 0.12) > 0 ? 0 : Math.PI;
    boat.rotation.z = Math.sin(time * 1.7) * 0.04;
    ripples.forEach((r, i) => {
      r.position.x = ((((time * 0.18 + i * 1.3) % 9) + 9) % 9) - 4.5;
    });
  };
  return { group, update };
}

function buildTrack(kit: Kit, root: THREE.Group, TR: number, R: number, pops: Pop[]) {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.RingGeometry(TR - 0.34, TR + 0.34, 128, 1).rotateX(-Math.PI / 2), kit.mat("#c7b79c"));
  bed.position.y = 0.02;
  bed.receiveShadow = !kit.lite;
  g.add(bed);
  const railM = kit.mat("#7c7a78", { rough: 0.5, metal: 0.5 });
  for (const r of [TR - 0.15, TR + 0.15]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 4, 160), railM);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 0.1;
    g.add(rail);
  }
  const n = kit.lite ? 90 : 150;
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.05, 0.5), kit.mat("#6b5543"), n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    m.makeRotationY(-a).setPosition(Math.cos(a) * TR, 0.06, Math.sin(a) * TR);
    sl.setMatrixAt(i, m);
  }
  sl.receiveShadow = !kit.lite;
  g.add(sl);
  // Piers where the line crosses the river.
  for (let a = 50; a <= 130; a += 10) {
    const p = polar(TR, a);
    if (p.z < 7.3) continue;
    const pier = kit.box(0.24, 0.1, 0.62, C.kerb, 0.02);
    pier.position.set(p.x, -0.02, p.z);
    pier.rotation.y = -a * DEG;
    g.add(pier);
  }
  void R;
  root.add(g);
  pops.push({ obj: g, delay: 0.7, kind: "pop", base: new THREE.Vector3(), scale: new THREE.Vector3(1, 1, 1) });
}

function buildTrain(kit: Kit, words: readonly string[]) {
  const cars: THREE.Group[] = [];
  const loco = new THREE.Group();
  const lb = kit.box(1.05, 0.38, 0.42, C.green, 0.06);
  lb.position.y = 0.08;
  const cab = kit.box(0.38, 0.22, 0.42, "#26614f", 0.05);
  cab.position.set(-0.3, 0.46, 0);
  const stripe = kit.box(1.07, 0.06, 0.44, C.cream, 0.01);
  stripe.position.y = 0.28;
  const lamp = kit.sphere(0.05, kit.glowMat("#f4ead2", "#fff2c4", 2.4, "headlamp"), 8);
  lamp.position.set(0.53, 0.36, 0);
  loco.add(lb, cab, stripe, lamp);
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.46, 10).rotateX(Math.PI / 2);
  const wm = kit.mat("#2c2b29");
  const wheels = (g: THREE.Group, len: number) => {
    for (const x of [-len / 2 + 0.2, len / 2 - 0.2]) {
      const w = new THREE.Mesh(wheelGeo, wm);
      w.position.set(x, 0.08, 0);
      g.add(w);
    }
  };
  wheels(loco, 1.05);
  cars.push(loco);
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Group();
    const body = kit.box(1.05, 0.4, 0.42, C.cream, 0.05);
    body.position.y = 0.08;
    const band = kit.box(1.07, 0.05, 0.44, C.green, 0.01);
    band.position.y = 0.42;
    const roof = kit.box(1.0, 0.05, 0.38, "#d8cbb4", 0.02);
    roof.position.y = 0.48;
    w.add(body, band, roof);
    wheels(w, 1.05);
    for (const s of [-1, 1]) {
      const word = words[(i * 2 + (s > 0 ? 0 : 1)) % words.length];
      const tex = kit.signTexture(word, { w: 512, h: 128, fg: "#1f4a3c", weight: 700 });
      const mm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, emissive: "#ffd690", emissiveMap: tex, emissiveIntensity: 0 });
      kit.night.push({ mat: mm, on: 0.6 });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.24), mm);
      p.position.set(0, 0.26, s * 0.215);
      if (s < 0) p.rotation.y = Math.PI;
      w.add(p);
    }
    cars.push(w);
  }
  return cars;
}

function buildKite(kit: Kit) {
  const kite = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.45);
  shape.lineTo(0.36, 0);
  shape.lineTo(0, -0.45);
  shape.lineTo(-0.36, 0);
  shape.closePath();
  const m = new THREE.MeshStandardMaterial({ color: "#e0603f", side: THREE.DoubleSide, roughness: 1 });
  const body = new THREE.Mesh(new THREE.ShapeGeometry(shape), m);
  const half = new THREE.Shape();
  half.moveTo(0, 0.45);
  half.lineTo(0.36, 0);
  half.lineTo(0, 0);
  half.closePath();
  const h2 = new THREE.Mesh(new THREE.ShapeGeometry(half), new THREE.MeshStandardMaterial({ color: "#f2c14e", side: THREE.DoubleSide, roughness: 1 }));
  h2.position.z = 0.003;
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.4), new THREE.MeshStandardMaterial({ color: "#2f7a62", side: THREE.DoubleSide }));
  tail.position.y = -0.62;
  kite.add(body, h2, tail);
  kite.rotation.x = -0.3;
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(13 * 3), 3));
  const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: "#5a4a3a", transparent: true, opacity: 0.7 }));
  line.frustumCulled = false;
  void kit;
  return { kite, line };
}
