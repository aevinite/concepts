// The buildings of Tiny Town. Each one is a "lot": a model you can click, with a pin point,
// a framing size for the camera, and (sometimes) a little life of its own.
import * as THREE from "three";
import { C, DEG, Kit, windows, rng } from "./kit";

export type LotId = "restaurant" | "college" | "studio" | "hospital" | "bakery" | "hackathon" | "dishes" | "postoffice" | "busstop" | "parent" | "agency" | "admin" | "train";

export interface Lot {
  id: LotId;
  group: THREE.Group;
  hit: THREE.Mesh;
  pin: THREE.Vector3;
  radius: number;
  points: Record<string, THREE.Object3D>;
  update?: (dt: number, time: number, night: number) => void;
  poke?: () => void;
}

export interface Ctx {
  kit: Kit;
  tex: (url: string) => THREE.Texture | null;
  sound: (name: "tick" | "thud" | "horn" | "toot" | "chime" | "pop") => void;
}

function lot(id: LotId, kit: Kit, w: number, h: number, d: number, radius = Math.max(w, d) * 0.75): Lot {
  const group = new THREE.Group();
  group.name = id;
  const hit = new THREE.Mesh(kit.boxGeo(w, h, d), kit.mat("#ff00ff"));
  hit.visible = false;
  hit.userData.lot = id;
  group.add(hit);
  return { id, group, hit, pin: new THREE.Vector3(0, h + 0.35, 0), radius, points: {} };
}

const screenMat = (kit: Kit, t: THREE.Texture | null, fallback: string) => {
  const m = new THREE.MeshStandardMaterial({ color: t ? "#ffffff" : fallback, map: t, roughness: 0.6, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.12 });
  kit.night.push({ mat: m, on: 0.9 });
  return m;
};

function waterTank(kit: Kit) {
  const g = new THREE.Group();
  const t = kit.cyl(0.13, 0.13, 0.24, C.tank, 14);
  const lid = kit.cyl(0.06, 0.13, 0.05, C.tank, 14);
  lid.position.y = 0.24;
  g.add(t, lid);
  return g;
}

function plant(kit: Kit, h = 0.3) {
  const g = new THREE.Group();
  const pot = kit.cyl(0.07, 0.055, 0.1, C.terracotta, 10);
  const leaf = kit.sphere(h * 0.42, C.leaf[1], 10);
  leaf.position.y = 0.1 + h * 0.32;
  leaf.scale.y = 1.2;
  g.add(pot, leaf);
  return g;
}

/* ---------------------------------------------------------------- Aevidine: the restaurant */
export function restaurant(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("restaurant", kit, 3.4, 1.7, 2.6, 2.1);
  const g = L.group;
  const floor = kit.box(3.2, 0.08, 2.4, "#e3cfa9", 0.03);
  const back = kit.box(3.2, 1.1, 0.1, "#efe3cc", 0.02);
  back.position.set(0, 0, -1.15);
  const sideL = kit.box(0.1, 1.1, 2.4, "#efe3cc", 0.02);
  sideL.position.set(-1.55, 0, 0);
  const sideR = sideL.clone();
  sideR.position.x = 1.55;
  const roof = kit.box(3.44, 0.12, 2.64, C.cream, 0.05);
  roof.position.y = 1.1;
  const trim = kit.box(3.46, 0.08, 0.12, C.gold, 0.03);
  trim.position.set(0, 1.08, 1.3);
  g.add(floor, back, sideL, sideR);
  // Everything above the walls lifts off as one piece, like the lid of a model kit.
  const top = new THREE.Group();
  top.add(roof, trim);
  g.add(top);
  L.points.roof = top;

  // Striped gold awning over the open front.
  const aw = new THREE.Group();
  aw.position.set(0, 1.04, 1.32);
  aw.rotation.x = 0.55;
  for (let i = 0; i < 9; i++) {
    const s = kit.box(3.44 / 9, 0.025, 0.5, i % 2 ? C.cream : C.gold, 0);
    s.position.set(-3.44 / 2 + (i + 0.5) * (3.44 / 9), 0, 0.25);
    aw.add(s);
  }
  top.add(aw);

  // Roof sign.
  const board = kit.box(1.9, 0.42, 0.06, "#2a2622", 0.02);
  board.position.set(0, 1.24, 0.9);
  const sign = kit.sign("Aevidine", 1.76, 0.32, { fg: C.gold, bg: "#2a2622", font: '"Gloock", Georgia, serif', weight: 400 });
  sign.position.set(0, 1.24 + 0.21, 0.94);
  top.add(board, sign);

  // Kitchen at the back left: counter, printer, screen, chef.
  const counter = kit.box(1.25, 0.44, 0.36, "#e9dcc2", 0.03);
  counter.position.set(-0.8, 0.04, -0.72);
  const ctop = kit.box(1.29, 0.04, 0.4, C.gold, 0.01);
  ctop.position.set(-0.8, 0.48, -0.72);
  g.add(counter, ctop);
  const printer = kit.box(0.2, 0.12, 0.17, "#3b3936", 0.03);
  printer.position.set(-0.42, 0.52, -0.72);
  g.add(printer);
  const kScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.38), screenMat(kit, ctx.tex("films/aevidine-screens/kitchen.webp"), "#efe6d2"));
  kScreen.position.set(-0.8, 0.86, -1.09);
  const kFrame = kit.box(0.92, 0.44, 0.03, "#2b2a28", 0.01);
  kFrame.position.set(-0.8, 0.86 - 0.22, -1.11);
  g.add(kFrame, kScreen);
  const chef = kit.person(C.white, C.skin[1], 0.44);
  chef.position.set(-1.1, 0.08, -0.96);
  const hat = kit.cyl(0.07, 0.06, 0.09, C.white, 10);
  hat.position.y = 0.44;
  chef.add(hat);
  g.add(chef);
  // Ticket rail with tickets that pile up.
  const rail = kit.box(0.9, 0.025, 0.025, C.brass, 0);
  rail.position.set(0.25, 0.92, -1.08);
  g.add(rail);

  // The ticket the printer spits out, on a loop.
  const tGeo = new THREE.PlaneGeometry(0.11, 0.2);
  tGeo.translate(0, 0.1, 0);
  const tMat = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 1, side: THREE.DoubleSide, emissive: "#fff6df", emissiveIntensity: 0 });
  kit.night.push({ mat: tMat, on: 0.5 });
  const ticket = new THREE.Mesh(tGeo, tMat);
  ticket.position.set(-0.42, 0.58, -0.66);
  ticket.scale.y = 0.001;
  g.add(ticket);
  const pinned: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(tGeo, tMat);
    p.scale.set(0.8, 0.8, 0.8);
    p.rotation.x = Math.PI;
    p.position.set(-0.1 + i * 0.18, 0.92, -1.06);
    p.visible = false;
    g.add(p);
    pinned.push(p);
  }

  // Tables, chairs, guests, QR stands.
  const qr = kit.qrTexture(11);
  const qrMat = new THREE.MeshStandardMaterial({ map: qr, roughness: 1 });
  const tables = [new THREE.Vector3(-0.75, 0, 0.55), new THREE.Vector3(0.45, 0, 0.62), new THREE.Vector3(0.95, 0, -0.42)];
  const r = rng(4);
  tables.forEach((p, i) => {
    const t = new THREE.Group();
    t.position.copy(p).setY(0.08);
    const leg = kit.cyl(0.035, 0.05, 0.34, C.ink, 8);
    const top = kit.cyl(0.3, 0.3, 0.035, "#f3ead8", 22);
    top.position.y = 0.34;
    t.add(leg, top);
    const stand = kit.box(0.07, 0.1, 0.025, "#2b2a28", 0.005);
    stand.position.set(0, 0.375, 0);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), qrMat);
    face.position.set(0, 0.44, 0.014);
    t.add(stand, face);
    for (const sx of [-1, 1]) {
      const chair = kit.cyl(0.09, 0.09, 0.2, i % 2 ? C.terracotta : C.sage, 12);
      chair.position.set(sx * 0.42, 0, 0);
      t.add(chair);
      if (r() > 0.25) {
        const guest = kit.person(C.people[(i * 2 + (sx > 0 ? 1 : 0)) % C.people.length], C.skin[(i + (sx > 0 ? 1 : 0)) % 4], 0.36);
        guest.position.set(sx * 0.42, 0.1, 0);
        guest.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        t.add(guest);
      }
    }
    g.add(t);
    L.points[`table${i}`] = t;
  });
  const pl = plant(kit, 0.34);
  pl.position.set(1.3, 0.08, 1.0);
  const pl2 = plant(kit, 0.3);
  pl2.position.set(-1.32, 0.08, 1.05);
  g.add(pl, pl2);

  // The waiter walks the floor with a tray.
  const waiter = kit.person(C.green, C.skin[0], 0.44);
  const tray = kit.cyl(0.09, 0.09, 0.015, C.brass, 12);
  tray.position.set(0.14, 0.4, 0);
  waiter.add(tray);
  waiter.position.set(-0.1, 0.08, -0.4);
  g.add(waiter);
  const route = [new THREE.Vector3(-0.15, 0.08, -0.38), new THREE.Vector3(-0.75, 0.08, 0.12), new THREE.Vector3(0.0, 0.08, 0.98), new THREE.Vector3(0.45, 0.08, 0.18), new THREE.Vector3(0.55, 0.08, -0.42)];
  let leg = 0, legT = 0, pause = 0;

  // Warm light in the kitchen at night.
  let glow: THREE.PointLight | null = null;
  if (!kit.lite) {
    glow = new THREE.PointLight("#ffb661", 0, 4.5, 1.6);
    glow.position.set(-0.4, 0.95, -0.2);
    g.add(glow);
  }

  L.points.printer = printer;
  L.points.waiter = waiter;
  L.points.screen = kScreen;
  L.points.counter = counter;
  L.pin.set(0, 1.85, 0.4);

  let cycle = 0.6, printing = 0, fired = 0;
  const print = () => {
    if (printing > 0) return;
    printing = 0.0001;
    ctx.sound("tick");
  };
  L.poke = print;

  L.update = (dt, time, night) => {
    const rush = 1 + night * 0.7;
    // Printer loop: rise, hold, tear, pin to the rail.
    cycle -= dt * rush;
    if (cycle <= 0) {
      cycle = 4.2;
      print();
    }
    if (printing > 0) {
      printing += dt * rush;
      const p = printing;
      if (p < 0.9) {
        ticket.visible = true;
        ticket.position.set(-0.42, 0.58, -0.66);
        ticket.rotation.set(0, 0, 0);
        ticket.scale.y = Math.max(0.001, p / 0.9) * (1 + Math.sin(p * 40) * 0.02);
      } else if (p < 1.6) {
        const k = (p - 0.9) / 0.7;
        const slot = pinned[fired % pinned.length];
        ticket.position.lerpVectors(new THREE.Vector3(-0.42, 0.58, -0.66), slot.position.clone().setY(0.92 - 0.2 * 0.8), k * k * (3 - 2 * k));
        ticket.position.y += Math.sin(k * Math.PI) * 0.25;
        ticket.rotation.z = Math.sin(k * Math.PI) * 0.6;
      } else {
        const slot = pinned[fired % pinned.length];
        slot.visible = true;
        fired++;
        if (fired % pinned.length === 0) pinned.forEach((x, i) => (x.visible = i === 0));
        ticket.visible = false;
        ticket.scale.y = 0.001;
        printing = 0;
      }
    }
    // Waiter
    if (pause > 0) pause -= dt * rush;
    else {
      const a = route[leg], b = route[(leg + 1) % route.length];
      const len = a.distanceTo(b);
      legT += (dt * 0.5 * rush) / len;
      if (legT >= 1) {
        legT = 0;
        leg = (leg + 1) % route.length;
        pause = 0.7;
      }
      waiter.position.lerpVectors(a, b, legT);
      waiter.position.y = 0.08 + Math.abs(Math.sin(time * 9 * rush)) * 0.025;
      const dir = new THREE.Vector3().subVectors(b, a);
      waiter.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI / 2;
    }
    chef.rotation.y = Math.sin(time * 1.4) * 0.5;
    if (glow) glow.intensity = night * 5.5;
  };
  return L;
}

/* ---------------------------------------------------------------- Campus: the college */
export function college(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("college", kit, 4.6, 3.1, 1.8, 2.6);
  const g = L.group;
  const main = kit.box(4.4, 1.35, 1.5, C.brick, 0.04);
  g.add(main);
  const cornice = kit.box(4.5, 0.1, 1.6, "#a85f43", 0.03);
  cornice.position.y = 1.35;
  g.add(cornice);
  // Kahn-style round openings, an Ahmedabad brick signature.
  const holeMat = kit.glowMat("#5b3222", "#ffb85c", 2.2, "hole");
  const holeGeo = new THREE.CircleGeometry(0.17, 20);
  for (let i = 0; i < 6; i++) {
    if (i === 2 || i === 3) continue;
    const h = new THREE.Mesh(holeGeo, holeMat);
    h.position.set(-1.85 + i * 0.74, 0.92, 0.76);
    g.add(h);
  }
  windows(kit, g, { cols: 6, rows: 1, w: 0.36, h: 0.22, gapX: 0.74, gapY: 0, y0: 0.38, z: 0.76 });
  // Clock tower.
  const tower = kit.box(0.8, 2.55, 0.8, "#c07455", 0.03);
  tower.position.z = 0.25;
  g.add(tower);
  const cap = kit.cone(0.66, 0.5, C.terracotta, 4);
  cap.rotation.y = Math.PI / 4;
  cap.position.set(0, 2.55, 0.25);
  g.add(cap);
  const clockC = document.createElement("canvas");
  clockC.width = clockC.height = 128;
  const x = clockC.getContext("2d")!;
  x.fillStyle = C.paper;
  x.beginPath();
  x.arc(64, 64, 60, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = "#2a2622";
  x.lineWidth = 6;
  x.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    x.fillStyle = "#2a2622";
    x.fillRect(64 + Math.cos(a) * 46 - 3, 64 + Math.sin(a) * 46 - 3, 6, 6);
  }
  // 7:10, the bus.
  x.lineCap = "round";
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(64, 64);
  x.lineTo(64 + Math.cos(((7 + 10 / 60) / 12) * Math.PI * 2 - Math.PI / 2) * 28, 64 + Math.sin(((7 + 10 / 60) / 12) * Math.PI * 2 - Math.PI / 2) * 28);
  x.stroke();
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(64, 64);
  x.lineTo(64 + Math.cos((10 / 60) * Math.PI * 2 - Math.PI / 2) * 44, 64 + Math.sin((10 / 60) * Math.PI * 2 - Math.PI / 2) * 44);
  x.stroke();
  const clockM = new THREE.MeshStandardMaterial({ map: kit.canvasTex(clockC), roughness: 1, transparent: true, emissive: "#ffffff", emissiveIntensity: 0 });
  clockM.emissiveMap = clockM.map;
  kit.night.push({ mat: clockM, on: 0.7 });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.28, 28), clockM);
  clock.position.set(0, 2.15, 0.66);
  g.add(clock);
  // Entrance.
  const door = kit.box(0.42, 0.62, 0.05, "#3a2a20", 0.02);
  door.position.set(0, 0, 0.66);
  const steps = kit.box(1.0, 0.08, 0.3, C.kerb, 0.02);
  steps.position.set(0, 0, 0.82);
  g.add(door, steps);
  const name = kit.sign("College", 0.78, 0.2, { fg: C.paper, bg: "#7d3f2a", weight: 650 });
  name.position.set(0, 0.86, 0.66);
  g.add(name);
  // Flag on the roof that waves.
  const pole = kit.cyl(0.015, 0.015, 0.9, C.ink, 6);
  pole.position.set(1.7, 1.42, 0.2);
  const flagGeo = new THREE.PlaneGeometry(0.4, 0.24, 6, 1);
  flagGeo.translate(0.2, 0, 0);
  const flag = new THREE.Mesh(flagGeo, kit.mat(C.amber, { side: THREE.DoubleSide }));
  flag.position.set(1.7, 2.18, 0.2);
  g.add(pole, flag);
  const tank = waterTank(kit);
  tank.position.set(-1.6, 1.45, -0.3);
  g.add(tank);
  L.pin.set(0, 3.4, 0.3);
  const pos = flagGeo.attributes.position as THREE.BufferAttribute;
  const base = Float32Array.from(pos.array as Float32Array);
  L.update = (_dt, time) => {
    for (let i = 0; i < pos.count; i++) {
      const xx = base[i * 3];
      pos.setZ(i, Math.sin(time * 4 + xx * 9) * 0.05 * xx * 2.5);
    }
    pos.needsUpdate = true;
  };
  return L;
}

/* ---------------------------------------------------------------- The bus stop, with a waiting student */
export function busStop(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("busstop", kit, 1.4, 1.0, 0.7, 1.2);
  const g = L.group;
  const roof = kit.box(1.15, 0.05, 0.48, C.amber, 0.02);
  roof.position.y = 0.72;
  const p1 = kit.cyl(0.02, 0.02, 0.72, C.ink, 6);
  p1.position.set(-0.52, 0, -0.18);
  const p2 = p1.clone();
  p2.position.x = 0.52;
  const back = kit.box(1.1, 0.5, 0.03, kit.mat(C.glass, { opacity: 0.55 }), 0);
  back.position.set(0, 0.12, -0.2);
  const bench = kit.box(0.8, 0.05, 0.16, C.trunk, 0.01);
  bench.position.set(0, 0.2, -0.1);
  const signPole = kit.cyl(0.015, 0.015, 0.95, C.ink, 6);
  signPole.position.set(0.72, 0, 0.12);
  const plate = kit.sign("Campus Conveyance", 0.5, 0.2, { bg: C.amber, fg: "#2a1a05", weight: 700 });
  plate.position.set(0.72, 0.86, 0.13);
  g.add(roof, p1, p2, back, bench, signPole, plate);
  const student = kit.person("#5d86a8", C.skin[2], 0.42);
  const bag = kit.box(0.14, 0.17, 0.08, C.amber, 0.03);
  bag.position.set(0, 0.2, -0.1);
  student.add(bag);
  student.position.set(-0.2, 0, 0.1);
  g.add(student);
  // The QR flash at boarding.
  const ringMat = new THREE.MeshBasicMaterial({ color: C.amber, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 32), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(-0.2, 0.03, 0.25);
  const qrM = new THREE.MeshBasicMaterial({ map: kit.qrTexture(5), transparent: true, opacity: 0 });
  const qrCard = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), qrM);
  qrCard.position.set(-0.2, 0.75, 0.25);
  g.add(ring, qrCard);
  L.points.student = student;
  L.points.qr = qrCard;
  L.pin.set(0, 1.2, 0);
  let flash = -1;
  L.poke = () => {
    flash = 0;
  };
  L.update = (dt, time) => {
    if (flash >= 0) {
      flash += dt;
      const k = Math.min(1, flash / 1.2);
      ring.scale.setScalar(1 + k * 3);
      ringMat.opacity = (1 - k) * 0.9;
      qrM.opacity = flash < 1.4 ? Math.min(1, flash * 5) * (1 - Math.max(0, flash - 1.1) / 0.3) : 0;
      qrCard.position.y = 0.75 + Math.min(1, flash) * 0.12;
      if (flash > 1.5) flash = -1;
    }
    if (student.visible && student.userData.state !== "board") student.rotation.y = Math.sin(time * 0.8) * 0.4;
  };
  return L;
}

/* ---------------------------------------------------------------- Aevinite studio HQ */
export function studio(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("studio", kit, 2.6, 2.3, 2.0, 1.7);
  const g = L.group;
  const floor = kit.box(2.4, 0.06, 1.8, "#e6dccb", 0.02);
  const back = kit.box(2.4, 0.8, 0.08, C.cream, 0.02);
  back.position.set(0, 0, -0.86);
  const sl = kit.box(0.08, 0.8, 1.8, C.cream, 0.02);
  sl.position.set(-1.16, 0, 0);
  const sr = sl.clone();
  sr.position.x = 1.16;
  const upper = kit.box(2.5, 0.8, 1.9, C.paper, 0.05);
  upper.position.y = 0.8;
  const band = kit.box(2.54, 0.12, 1.94, C.green, 0.03);
  band.position.y = 1.56;
  const top = new THREE.Group();
  top.add(upper, band);
  g.add(floor, back, sl, sr, top);
  L.points.roof = top;
  windows(kit, top, { cols: 4, rows: 1, w: 0.36, h: 0.36, gapX: 0.56, gapY: 0, y0: 1.08, z: 0.96 });
  // Glass front with mullions.
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.74), new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.2, transparent: true, opacity: 0.22 }));
  glass.position.set(0, 0.43, 0.9);
  g.add(glass);
  for (let i = -2; i <= 2; i++) {
    const m = kit.box(0.03, 0.78, 0.03, C.ink, 0);
    m.position.set(i * 0.575, 0.04, 0.9);
    g.add(m);
  }
  // Two desks, two founders, two glowing laptops.
  const lapMat = kit.glowMat("#d9e7df", "#9ff0cf", 1.6, "lap");
  for (const [i, sx] of [[0, -0.5], [1, 0.52]] as const) {
    const desk = kit.box(0.7, 0.04, 0.38, "#c79a6b", 0.01);
    desk.position.set(sx, 0.3, -0.25);
    const legs = kit.box(0.66, 0.3, 0.34, "#d8c7ac", 0.01);
    legs.position.set(sx, 0.02, -0.25);
    const lap = kit.box(0.24, 0.015, 0.16, "#3b3a37", 0.004);
    lap.position.set(sx, 0.34, -0.22);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.15), lapMat);
    scr.position.set(sx, 0.43, -0.31);
    scr.rotation.x = -0.25;
    const f = kit.person(i === 0 ? C.green : "#2f4a6b", C.skin[i === 0 ? 1 : 3], i === 0 ? 0.47 : 0.45);
    f.position.set(sx, 0.08, 0.12);
    f.rotation.y = Math.PI;
    g.add(legs, desk, lap, scr, f);
    L.points[`founder${i}`] = f;
  }
  const board = kit.box(0.7, 0.4, 0.02, C.paper, 0.01);
  board.position.set(0.1, 0.4, -0.8);
  g.add(board);
  const pl = plant(kit, 0.4);
  pl.position.set(-0.98, 0.06, 0.6);
  g.add(pl);
  // Roof: sign and a black water tank, like every roof in Ahmedabad.
  const frame = kit.box(1.7, 0.42, 0.05, C.ink, 0.02);
  frame.position.set(0, 1.68, 0.55);
  const sign = kit.sign("Aevinite", 1.6, 0.34, { fg: "#f4efe4", bg: C.green, weight: 720 });
  sign.position.set(0, 1.68 + 0.21, 0.58);
  const tank = waterTank(kit);
  tank.position.set(0.8, 1.68, -0.4);
  top.add(frame, sign, tank);
  L.pin.set(0, 2.45, 0.2);
  // A warm desk lamp glow for the night shift.
  let lamp: THREE.PointLight | null = null;
  if (!kit.lite) {
    lamp = new THREE.PointLight("#ffc77a", 0, 3.6, 1.6);
    lamp.position.set(0, 0.7, 0.1);
    g.add(lamp);
  }
  L.update = (_dt, time, night) => {
    if (lamp) lamp.intensity = night * 4.5;
    const f0 = L.points.founder0, f1 = L.points.founder1;
    f0.position.y = 0.08 + Math.max(0, Math.sin(time * 2.1)) * 0.02;
    f1.rotation.y = Math.PI + Math.sin(time * 0.7) * 0.35;
  };
  return L;
}

/* ---------------------------------------------------------------- Hospital (a website we made) */
export function hospital(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("hospital", kit, 2.6, 2.6, 1.5, 1.7);
  const g = L.group;
  const body = kit.box(2.4, 2.1, 1.3, "#e5eee8", 0.05);
  g.add(body);
  const band = kit.box(2.44, 0.1, 1.34, "#7fb3a4", 0.02);
  band.position.y = 0.7;
  g.add(band);
  windows(kit, g, { cols: 5, rows: 2, w: 0.26, h: 0.26, gapX: 0.44, gapY: 0.62, y0: 1.05, z: 0.66 });
  const canopy = kit.box(1.0, 0.06, 0.45, "#7fb3a4", 0.02);
  canopy.position.set(0, 0.55, 0.8);
  const door = kit.box(0.5, 0.5, 0.04, kit.mat(C.glass, { opacity: 0.8, rough: 0.3 }), 0);
  door.position.set(0, 0, 0.66);
  g.add(canopy, door);
  // Green cross on the roof.
  const crossMat = kit.glowMat("#3f9a73", "#7dffbf", 1.3, "cross");
  const a = kit.box(0.5, 0.16, 0.06, crossMat, 0.02);
  const b = kit.box(0.16, 0.5, 0.06, crossMat, 0.02);
  a.position.set(0, 2.3, 0.3);
  b.position.set(0, 2.13, 0.3);
  g.add(a, b);
  const sign = kit.sign("Hospital", 0.9, 0.2, { fg: "#24564a", bg: "#e5eee8", weight: 700 });
  sign.position.set(0, 0.68, 1.03);
  g.add(sign);
  L.pin.set(0, 2.95, 0);
  return L;
}

/* ---------------------------------------------------------------- Sweet Bites bakery kiosk */
export function bakery(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("bakery", kit, 1.5, 1.8, 1.2, 1.2);
  const g = L.group;
  const body = kit.box(1.3, 0.9, 1.0, C.pink, 0.06);
  g.add(body);
  const counter = kit.box(1.1, 0.06, 0.3, C.cream, 0.02);
  counter.position.set(0, 0.42, 0.55);
  const opening = kit.box(1.0, 0.36, 0.02, "#6e3b35", 0);
  opening.position.set(0, 0.46, 0.505);
  g.add(opening, counter);
  const aw = new THREE.Group();
  aw.position.set(0, 0.86, 0.52);
  aw.rotation.x = 0.6;
  for (let i = 0; i < 6; i++) {
    const s = kit.box(1.36 / 6, 0.02, 0.36, i % 2 ? C.cream : C.rose, 0);
    s.position.set(-0.68 + (i + 0.5) * (1.36 / 6), 0, 0.18);
    aw.add(s);
  }
  g.add(aw);
  // A giant cupcake on the roof.
  const cake = new THREE.Group();
  cake.position.y = 0.9;
  const wrap = kit.cyl(0.26, 0.2, 0.26, C.gold, 14);
  const frost = kit.sphere(0.3, "#f5d7d0", 16);
  frost.scale.y = 0.75;
  frost.position.y = 0.32;
  const top = kit.sphere(0.17, "#f5d7d0", 14);
  top.position.y = 0.52;
  const cherry = kit.sphere(0.07, C.red, 10);
  cherry.position.y = 0.69;
  cake.add(wrap, frost, top, cherry);
  g.add(cake);
  const sign = kit.sign("Sweet Bites", 0.9, 0.18, { fg: "#6e3b35", bg: C.cream, weight: 700 });
  sign.position.set(0, 0.74, 0.51);
  g.add(sign);
  const vendor = kit.person(C.cream, C.skin[0], 0.4);
  vendor.position.set(0, 0, 0.2);
  g.add(vendor);
  L.pin.set(0, 1.95, 0);
  L.points.cake = cake;
  L.update = (_dt, time) => {
    cake.rotation.y = time * 0.6;
  };
  return L;
}

/* ---------------------------------------------------------------- HackJudge hall */
export function hackathon(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("hackathon", kit, 3.2, 1.9, 1.7, 1.9);
  const g = L.group;
  const walls = kit.box(3.0, 0.72, 1.5, "#c9d6c0", 0.04);
  g.add(walls);
  const roofGeo = new THREE.CylinderGeometry(0.78, 0.78, 3.1, kit.lite ? 12 : 24, 1, false, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeo, kit.mat("#eee4cf"));
  roof.rotation.set(0, 0, Math.PI / 2);
  roof.position.y = 0.72;
  roof.castShadow = !kit.lite;
  roof.receiveShadow = !kit.lite;
  // Half cylinder lying along x, its curve facing up, flattened into a barrel vault.
  roof.scale.set(0.62, 1, 1);
  g.add(roof);
  // Leaderboard screen above the entrance (the real HackJudge leaderboard).
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.62), screenMat(kit, ctx.tex("projects/hackathon/2-leaderboard.webp"), "#dfe8f0"));
  scr.position.set(0, 1.0, 0.8);
  const fr = kit.box(1.38, 0.7, 0.04, C.ink, 0.01);
  fr.position.set(0, 0.65, 0.77);
  g.add(fr, scr);
  const door = kit.box(0.7, 0.44, 0.04, "#34433b", 0.01);
  door.position.set(0, 0, 0.76);
  g.add(door);
  const sign = kit.sign("HackJudge", 1.0, 0.2, { fg: "#f2efe6", bg: "#34433b", weight: 700 });
  sign.position.set(0, 0.555, 0.79);
  g.add(sign);
  windows(kit, g, { cols: 2, rows: 1, w: 0.36, h: 0.26, gapX: 2.1, gapY: 0, y0: 0.4, z: 0.76 });
  L.pin.set(0, 2.0, 0);
  return L;
}

/* ---------------------------------------------------------------- 4D Dish Explorer: a pavilion with a giant waffle */
export function dishes(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("dishes", kit, 1.8, 2.4, 1.8, 1.3);
  const g = L.group;
  const base = kit.cyl(0.75, 0.8, 0.12, C.kerb, 28);
  const glass = kit.cyl(0.62, 0.62, 0.62, kit.mat(C.glass, { opacity: 0.45, rough: 0.2 }), 28);
  glass.position.y = 0.12;
  const roof = kit.cyl(0.82, 0.82, 0.08, C.cream, 28);
  roof.position.y = 0.74;
  const pole = kit.cyl(0.04, 0.04, 0.55, C.brass, 8);
  pole.position.y = 0.82;
  g.add(base, glass, roof, pole);
  // Waffle texture.
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#d9a24a";
  x.fillRect(0, 0, 128, 128);
  x.fillStyle = "#b9822f";
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) x.fillRect(8 + i * 20, 8 + j * 20, 13, 13);
  const wTex = kit.canvasTex(c);
  const waffle = new THREE.Mesh(kit.boxGeo(0.95, 0.16, 0.95, 0.06), new THREE.MeshStandardMaterial({ map: wTex, roughness: 0.9 }));
  waffle.castShadow = !kit.lite;
  const wg = new THREE.Group();
  wg.position.y = 1.5;
  waffle.rotation.x = 1.1;
  wg.add(waffle);
  const syrup = kit.sphere(0.12, "#7a3f17", 10);
  syrup.scale.set(1.5, 0.3, 1.5);
  syrup.position.set(0, 0.0, 0.1);
  waffle.add(syrup);
  g.add(wg);
  // A croissant on a plinth beside it.
  const plinth = kit.box(0.3, 0.3, 0.3, C.paper, 0.03);
  plinth.position.set(0.85, 0, 0.45);
  const cro = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.07, 10, 18, Math.PI * 1.25), kit.mat("#c98a3c"));
  cro.position.set(0.85, 0.38, 0.45);
  cro.rotation.set(-Math.PI / 2, 0, -0.6);
  cro.castShadow = !kit.lite;
  g.add(plinth, cro);
  const sign = kit.sign("4D Dish Explorer", 1.2, 0.2, { fg: "#5a3a14", bg: C.paper, weight: 700 });
  sign.position.set(0, 0.2, 0.86);
  g.add(sign);
  L.pin.set(0, 2.25, 0);
  L.update = (_dt, time) => {
    wg.rotation.y = time * 0.7;
    wg.position.y = 1.5 + Math.sin(time * 1.6) * 0.06;
  };
  return L;
}

/* ---------------------------------------------------------------- The post office (contact) */
export function postOffice(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("postoffice", kit, 1.9, 1.6, 1.4, 1.3);
  const g = L.group;
  const body = kit.box(1.6, 0.95, 1.1, C.cream, 0.05);
  const band = kit.box(1.64, 0.22, 1.14, C.red, 0.03);
  band.position.y = 0.95;
  const roof = kit.box(1.7, 0.08, 1.2, "#9e3a30", 0.03);
  roof.position.y = 1.17;
  g.add(body, band, roof);
  const sign = kit.sign("Post Office", 1.2, 0.18, { fg: C.paper, bg: C.red, weight: 700 });
  sign.position.set(0, 1.06, 0.58);
  g.add(sign);
  const door = kit.box(0.4, 0.6, 0.04, "#6b2c24", 0.02);
  door.position.set(-0.3, 0, 0.56);
  g.add(door);
  windows(kit, g, { cols: 1, rows: 1, w: 0.42, h: 0.32, gapX: 0, gapY: 0, y0: 0.5, z: 0.56, x0: 0.35 });
  // Red pillar box out front.
  const pb = new THREE.Group();
  pb.position.set(0.55, 0, 0.88);
  const body2 = kit.cyl(0.11, 0.12, 0.42, C.red, 14);
  const capp = kit.sphere(0.12, C.red, 14);
  capp.scale.y = 0.55;
  capp.position.y = 0.42;
  const slot = kit.box(0.12, 0.02, 0.02, C.ink, 0);
  slot.position.set(0, 0.32, 0.11);
  pb.add(body2, capp, slot);
  g.add(pb);
  L.points.box = pb;
  L.pin.set(0, 1.7, 0.2);
  return L;
}

/* ---------------------------------------------------------------- Old-city pol houses with a kite */
export function polHouses(ctx: Ctx) {
  const { kit } = ctx;
  const g = new THREE.Group();
  const cols = ["#e2b65f", "#7fb7b0", "#e3a7a0", "#b7c47a", "#8fb0cf", "#e7c79a"];
  const hs = [1.5, 1.95, 1.35, 1.75, 1.6, 1.25];
  let x = -1.85;
  const roofs: THREE.Vector3[] = [];
  hs.forEach((h, i) => {
    const w = 0.62;
    const house = kit.box(w, h, 0.9, cols[i], 0.03);
    house.position.x = x + w / 2;
    g.add(house);
    const bal = kit.box(w * 0.8, 0.05, 0.2, "#8a6a50", 0.01);
    bal.position.set(x + w / 2, h * 0.55, 0.52);
    const rail = kit.box(w * 0.8, 0.12, 0.02, "#8a6a50", 0);
    rail.position.set(x + w / 2, h * 0.55 + 0.05, 0.61);
    g.add(bal, rail);
    windows(kit, g, { cols: 1, rows: 2, w: 0.2, h: 0.22, gapX: 0, gapY: h * 0.42, y0: h * 0.3, z: 0.46, x0: x + w / 2 });
    if (i % 2 === 0) {
      const t = waterTank(kit);
      t.position.set(x + w / 2, h, -0.15);
      g.add(t);
    }
    roofs.push(new THREE.Vector3(x + w / 2, h, 0));
    x += w + 0.02;
  });
  return { group: g, roofs };
}

/* ---------------------------------------------------------------- Product-page extras */
export function parentHouse(ctx: Ctx): Lot {
  const { kit } = ctx;
  const L = lot("parent", kit, 1.5, 1.9, 1.3, 1.2);
  const g = L.group;
  const body = kit.box(1.3, 1.3, 1.1, "#e7c79a", 0.05);
  const roof = kit.box(1.4, 0.08, 1.2, "#b86a4c", 0.03);
  roof.position.y = 1.3;
  g.add(body, roof);
  const win = kit.box(0.5, 0.36, 0.03, kit.glowMat("#3a2f28", "#ffbf66", 1.4, "pwin"), 0.01);
  win.position.set(-0.2, 0.7, 0.56);
  g.add(win);
  const parent = kit.person("#b8798f", C.skin[0], 0.42);
  parent.position.set(-0.2, 0.5, 0.42);
  g.add(parent);
  const phone = kit.box(0.05, 0.09, 0.012, kit.glowMat("#ffd27a", "#ffd27a", 2, "phone"), 0);
  phone.position.set(0.09, 0.33, 0.1);
  parent.add(phone);
  const door = kit.box(0.3, 0.55, 0.04, "#6b4a35", 0.02);
  door.position.set(0.35, 0, 0.56);
  g.add(door);
  const t = waterTank(kit);
  t.position.set(0.35, 1.38, -0.2);
  g.add(t);
  L.points.parent = parent;
  L.pin.set(0, 1.9, 0);
  return L;
}

export function office(ctx: Ctx, id: "agency" | "admin", label: string, color: string): Lot {
  const { kit } = ctx;
  const L = lot(id, kit, 1.6, 1.8, 1.3, 1.2);
  const g = L.group;
  const body = kit.box(1.4, 1.2, 1.1, color, 0.05);
  const roof = kit.box(1.5, 0.08, 1.2, C.cream, 0.03);
  roof.position.y = 1.2;
  g.add(body, roof);
  windows(kit, g, { cols: 2, rows: 1, w: 0.34, h: 0.3, gapX: 0.6, gapY: 0, y0: 0.72, z: 0.56 });
  const door = kit.box(0.32, 0.5, 0.04, C.ink, 0.02);
  door.position.set(0, 0, 0.56);
  g.add(door);
  const sign = kit.sign(label, 1.0, 0.2, { fg: "#2a1a05", bg: C.amber, weight: 700 });
  sign.position.set(0, 1.42, 0.3);
  const post = kit.box(1.04, 0.24, 0.04, C.ink, 0.01);
  post.position.set(0, 1.3, 0.28);
  g.add(post, sign);
  L.pin.set(0, 1.95, 0);
  return L;
}

/* ---------------------------------------------------------------- Vehicles */
export function bus(kit: Kit) {
  const g = new THREE.Group();
  const body = kit.box(1.36, 0.5, 0.56, C.amber, 0.09);
  body.position.y = 0.12;
  const roof = kit.box(1.3, 0.06, 0.52, "#f6c46e", 0.03);
  roof.position.y = 0.62;
  const glass = kit.glowMat("#4c5a63", "#ffd690", 2.4, "buswin");
  const win = kit.box(1.0, 0.16, 0.58, glass, 0.03);
  win.position.set(-0.06, 0.4, 0);
  const wind = kit.box(0.04, 0.2, 0.46, glass, 0.01);
  wind.position.set(0.68, 0.4, 0);
  g.add(body, roof, win, wind);
  const sideTex = kit.signTexture("CAMPUS", { w: 256, h: 64, fg: "#3a2405", weight: 750 });
  const sideM = new THREE.MeshBasicMaterial({ map: sideTex, transparent: true });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.15), sideM);
    p.position.set(-0.06, 0.26, s * 0.285);
    if (s < 0) p.rotation.y = Math.PI;
    g.add(p);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14);
  wheelGeo.rotateX(Math.PI / 2);
  for (const [x, z] of [[-0.42, 0.28], [0.42, 0.28], [-0.42, -0.28], [0.42, -0.28]]) {
    const w = new THREE.Mesh(wheelGeo, kit.mat("#2c2b29"));
    w.position.set(x, 0.11, z);
    g.add(w);
  }
  addHeadlights(kit, g, 0.69, 0.3, 0.18);
  const driver = kit.person("#2f4a6b", C.skin[3], 0.36);
  driver.position.set(0.45, 0.2, 0.1);
  g.add(driver);
  return g;
}

export function rickshaw(kit: Kit, color = "#2b2b2a", top = "#e8c241") {
  const g = new THREE.Group();
  const body = kit.box(0.62, 0.28, 0.36, color, 0.07);
  body.position.y = 0.08;
  const canopy = kit.box(0.5, 0.06, 0.38, top, 0.03);
  canopy.position.set(-0.04, 0.56, 0);
  const pillar = kit.box(0.04, 0.24, 0.3, color, 0.01);
  pillar.position.set(0.18, 0.32, 0);
  const pillar2 = pillar.clone();
  pillar2.position.x = -0.26;
  const nose = kit.box(0.14, 0.2, 0.2, top, 0.05);
  nose.position.set(0.3, 0.1, 0);
  g.add(body, canopy, pillar, pillar2, nose);
  const wg = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10);
  wg.rotateX(Math.PI / 2);
  for (const [x, z] of [[0.3, 0], [-0.22, 0.17], [-0.22, -0.17]]) {
    const w = new THREE.Mesh(wg, kit.mat("#2c2b29"));
    w.position.set(x, 0.07, z);
    g.add(w);
  }
  addHeadlights(kit, g, 0.38, 0.0, 0.2, true);
  return g;
}

export function car(kit: Kit, color: string) {
  const g = new THREE.Group();
  const body = kit.box(0.74, 0.2, 0.36, color, 0.07);
  body.position.y = 0.06;
  const cab = kit.box(0.4, 0.16, 0.32, kit.glowMat("#566770", "#ffd690", 0.7, "carwin"), 0.06);
  cab.position.set(-0.04, 0.26, 0);
  g.add(body, cab);
  const wg = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10);
  wg.rotateX(Math.PI / 2);
  for (const [x, z] of [[-0.24, 0.17], [0.24, 0.17], [-0.24, -0.17], [0.24, -0.17]]) {
    const w = new THREE.Mesh(wg, kit.mat("#2c2b29"));
    w.position.set(x, 0.07, z);
    g.add(w);
  }
  addHeadlights(kit, g, 0.38, 0.12, 0.14);
  return g;
}

/** Headlamps plus a soft beam on the road that only shows at night. */
function addHeadlights(kit: Kit, g: THREE.Group, x: number, y: number, spread: number, single = false) {
  const lampM = kit.glowMat("#f4ead2", "#fff2c4", 2.2, "headlamp");
  const xs = single ? [0] : [-spread / 2, spread / 2];
  for (const z of xs) {
    const l = kit.sphere(0.035, lampM, 8);
    l.position.set(x, y + 0.12, z);
    g.add(l);
  }
  const beamGeo = new THREE.PlaneGeometry(1.9, 0.9);
  beamGeo.rotateX(-Math.PI / 2);
  beamGeo.translate(0.95 + x, 0.03, 0);
  const beam = new THREE.Mesh(beamGeo, beamMaterial(kit));
  beam.renderOrder = 2;
  g.add(beam);
  g.userData.beams = [...(g.userData.beams ?? []), beam];
}

let beamMatCache: THREE.MeshBasicMaterial | null = null;
export function beamMaterial(kit: Kit) {
  if (beamMatCache) return beamMatCache;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const x = c.getContext("2d")!;
  const gr = x.createLinearGradient(0, 0, 128, 0);
  gr.addColorStop(0, "rgba(255,230,170,1)");
  gr.addColorStop(1, "rgba(255,226,160,0)");
  x.fillStyle = gr;
  x.beginPath();
  x.moveTo(0, 26);
  x.lineTo(128, 0);
  x.lineTo(128, 64);
  x.lineTo(0, 38);
  x.fill();
  beamMatCache = new THREE.MeshBasicMaterial({ map: kit.canvasTex(c), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  return beamMatCache;
}
export const resetBeamCache = () => (beamMatCache = null);

export function streetLamp(kit: Kit) {
  const g = new THREE.Group();
  const pole = kit.cyl(0.022, 0.03, 0.95, "#2f3433", 6);
  const arm = kit.box(0.22, 0.025, 0.025, "#2f3433", 0);
  arm.position.set(0.09, 0.93, 0);
  const bulb = kit.sphere(0.055, kit.glowMat("#f1e6c8", "#ffd27a", 2.6, "bulb"), 8);
  bulb.position.set(0.19, 0.9, 0);
  g.add(pole, arm, bulb);
  return g;
}

export { DEG };
