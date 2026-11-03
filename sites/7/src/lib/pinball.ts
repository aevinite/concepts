// DARK WORLD signature toy: a playable pinball table (matter-js physics, canvas drawing).
// Five pop bumpers are five things (services on the home page, the product's panels on a product
// page): hit one and it lights, scores, and the backglass shows what it is. Flippers: arrow keys
// or Z and /, the two halves of the table, or the big buttons under it. Plunger: hold Space / Down,
// or hold the lane, or the Launch button. The canvas is touch-action:pan-y, so a finger can still
// scroll the page past it. Until someone presses Start, the table plays itself (attract mode).
import Matter from "matter-js";
import { visibleLoop, watchView, reduced } from "./core";
import { sfx } from "./sound";

const setPos = Matter.Body.setPosition as unknown as (b: Matter.Body, p: Matter.Vector, v?: boolean) => void;
const setAng = Matter.Body.setAngle as unknown as (b: Matter.Body, a: number, v?: boolean) => void;
const { Engine, Bodies, Body, Composite, Events, Vertices } = Matter;

export type BumperDef = { short: string; title: string; text: string };
export type PinEvent =
  | { type: "score"; score: number }
  | { type: "hit"; index: number; first: boolean }
  | { type: "msg"; text: string; sub?: string }
  | { type: "state"; state: State; ball: number; balls: number };
type State = "attract" | "ready" | "play" | "over";

const W = 420, H = 780;
const LANE = 380; // x of the plunger-lane wall
const R = 9.5; // ball radius
const COLORS = ["#39d0ff", "#ffc23d", "#b5f23b", "#ff5fa8", "#ff7a2f"];
const BUMPERS = [
  { x: 190, y: 252 }, { x: 108, y: 322 }, { x: 272, y: 322 }, { x: 140, y: 420 }, { x: 240, y: 420 },
];
const LANES = [122, 170, 218, 266];
const MULTS = [1, 2, 3, 5];

export function mountPinball(host: HTMLElement, opts: { bumpers: BumperDef[]; emit: (e: PinEvent) => void; name: string }) {
  host.innerHTML = `
    <div class="pb-table">
      <canvas class="pb-canvas" role="img" aria-label="A playable pinball table. Its five bumpers are: ${opts.bumpers.map((b) => b.title).join(", ")}."></canvas>
      <div class="pb-zones" aria-hidden="true"><span>Left flipper</span><span>Right flipper</span></div>
    </div>
    <div class="pb-pad">
      <button type="button" class="pb-key pb-l" aria-label="Left flipper"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19"/></svg><span>Flip</span></button>
      <button type="button" class="pb-key pb-go" aria-label="Start the game"><span class="pb-go-t">Start</span></button>
      <button type="button" class="pb-key pb-r" aria-label="Right flipper"><span>Flip</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19"/></svg></button>
    </div>`;
  const table = host.querySelector<HTMLElement>(".pb-table")!;
  const canvas = host.querySelector<HTMLCanvasElement>(".pb-canvas")!;
  const ctx = canvas.getContext("2d")!;
  const goBtn = host.querySelector<HTMLButtonElement>(".pb-go")!;
  const goT = host.querySelector<HTMLElement>(".pb-go-t")!;

  const engine = Engine.create();
  engine.gravity.y = 1.15;
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  const world = engine.world;
  const statics = { isStatic: true };
  // matter-js resets friction to 1 and restitution to 0 on static bodies: set them back afterwards
  const tune = <T extends Matter.Body>(b: T, restitution = 0.35, friction = 0.02) => { b.restitution = restitution; b.friction = friction; b.frictionStatic = 0.1; return b; };

  // ---------- geometry ----------
  const interior = { x: 190, y: 420 };
  const wallPaths: { x: number; y: number }[][] = [];
  function seg(x1: number, y1: number, x2: number, y2: number, T = 40, draw = true) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    let nx = -dy / len, ny = dx / len;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    if (nx * (mx - interior.x) + ny * (my - interior.y) < 0) { nx = -nx; ny = -ny; }
    const b = tune(Bodies.rectangle(mx + nx * T / 2, my + ny * T / 2, len + 6, T, { ...statics, angle: Math.atan2(dy, dx) }));
    Composite.add(world, b);
    if (draw) wallPaths.push([{ x: x1, y: y1 }, { x: x2, y: y2 }]);
    return b;
  }
  // top arch
  const arc: { x: number; y: number }[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = Math.PI + (i / 32) * Math.PI;
    arc.push({ x: 210 + 210 * Math.cos(t), y: 215 + 205 * Math.sin(t) });
  }
  for (let i = 0; i < arc.length - 1; i++) seg(arc[i].x, arc[i].y, arc[i + 1].x, arc[i + 1].y, 40, false);
  wallPaths.push(arc);
  seg(0, 215, 0, 585);
  seg(0, 585, 112, 684);
  seg(W, 215, W, H + 40);
  seg(LANE, 585, 268, 684, 12); // right inlane slope (thin, so it never reaches into the lane)
  // lane wall: a thin double-sided rail
  Composite.add(world, tune(Bodies.rectangle(LANE + 3, (250 + H) / 2 + 10, 6, H - 250 + 20, statics)));
  // plunger floor
  const plungerTop = 742;
  Composite.add(world, tune(Bodies.rectangle((LANE + 6 + W) / 2, plungerTop + 20, W - LANE, 40, statics), 0.05, 0.3));
  // one-way gate at the top of the lane
  const gate = tune(Bodies.rectangle(LANE + 22, 228, 50, 6, { ...statics, angle: -0.75, isSensor: true }));
  Composite.add(world, gate);
  // top-lane dividers (rollover lanes G R O W)
  const dividers = [98, 146, 194, 242, 290].map((x) => tune(Bodies.rectangle(x, 118, 5, 40, { ...statics, chamfer: { radius: 2 } })));
  Composite.add(world, dividers);
  const laneSensors = LANES.map((x) => Bodies.rectangle(x, 122, 28, 14, { isStatic: true, isSensor: true }));
  Composite.add(world, laneSensors);
  // pop bumpers
  const bumpers = BUMPERS.map((p) => tune(Bodies.circle(p.x, p.y, 22, statics), 0.6));
  Composite.add(world, bumpers);
  // slingshots
  const slingPts = [
    [{ x: 40, y: 498 }, { x: 40, y: 572 }, { x: 94, y: 610 }],
    [{ x: LANE - 40, y: 498 }, { x: LANE - 40, y: 572 }, { x: LANE - 94, y: 610 }],
  ];
  const slings = slingPts.map((pts) => {
    const c = Vertices.centre(pts);
    const b = tune(Bodies.fromVertices(c.x, c.y, [pts], statics), 0.4);
    Composite.add(world, b);
    return b;
  });
  // flippers: tapered capsules, kinematic static bodies rotated about their pivot every substep
  const FL = 58, r1 = 10, r2 = 5.5;
  const capsule = () => {
    const d = Math.asin((r1 - r2) / FL), pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + d + (i / 8) * (Math.PI - 2 * d); pts.push({ x: r1 * Math.cos(a), y: r1 * Math.sin(a) }); }
    for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + d + (i / 6) * (Math.PI - 2 * d); pts.push({ x: FL + r2 * Math.cos(a), y: r2 * Math.sin(a) }); }
    return pts;
  };
  const shape = capsule();
  const cen = Vertices.centre(shape);
  const mkFlipper = (px: number, py: number, rest: number, up: number) => {
    const body = tune(Bodies.fromVertices(px + cen.x, py + cen.y, [shape.map((p) => ({ ...p }))], { isStatic: true }), 0.25, 0.08);
    Composite.add(world, body);
    return { body, px, py, rest, up, a: 0, on: false };
  };
  const flippers = [mkFlipper(120, 690, 0.5, -0.45), mkFlipper(260, 690, Math.PI - 0.5, Math.PI + 0.45)];
  for (const f of flippers) { f.a = f.rest; Body.setAngle(f.body, f.rest); placeFlipper(f, f.rest, false); }
  function placeFlipper(f: (typeof flippers)[number], a: number, vel: boolean) {
    const c = Math.cos(a), s = Math.sin(a);
    setPos(f.body, { x: f.px + cen.x * c - cen.y * s, y: f.py + cen.x * s + cen.y * c }, vel);
    setAng(f.body, a, vel);
  }

  // ---------- ball & game state ----------
  const ball = Bodies.circle(W - 20, plungerTop - R, R, { restitution: 0.32, friction: 0.005, frictionAir: 0.0006, density: 0.004, label: "ball" });
  Composite.add(world, ball);
  let state: State = "attract";
  let score = 0, ballNo = 0, balls = 3, mult = 1, multI = 0;
  const lanesLit = [false, false, false, false];
  const bumperHit = [0, 0, 0, 0, 0];
  const flash = [0, 0, 0, 0, 0];
  const slingFlash = [0, 0];
  let laneFlash = 0, charge = 0, charging = false, lastMoveT = performance.now(), best = 0;
  try { best = Number(localStorage.getItem("aev-c7-best") || 0); } catch { /* ignore */ }

  const add = (n: number) => {
    if (state !== "play") return;
    score += n * mult;
    opts.emit({ type: "score", score });
  };
  const setState = (s: State) => { state = s; opts.emit({ type: "state", state, ball: ballNo, balls }); updateGo(); };
  function toLane() {
    Body.setPosition(ball, { x: W - 20, y: plungerTop - R - 1 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    gate.isSensor = true;
  }
  function start() {
    score = 0; ballNo = 1; balls = 3; mult = 1; multI = 0;
    lanesLit.fill(false); bumperHit.fill(0);
    toLane();
    setState("ready");
    opts.emit({ type: "score", score });
    opts.emit({ type: "msg", text: "Ball 1", sub: "Hold the plunger, let go to launch" });
    sfx.coin();
  }
  function launch(power: number) {
    if (!(ball.position.x > LANE && ball.position.y > 640)) return;
    Body.setVelocity(ball, { x: 0, y: -(19 + 13 * power) });
    if (state === "ready") { setState("play"); opts.emit({ type: "msg", text: `Ball ${ballNo}`, sub: "Hit a bumper to read it" }); }
  }
  function drained() {
    if (state === "attract") { toLane(); setTimeout(() => state === "attract" && launch(0.6 + Math.random() * 0.4), 700); return; }
    if (state !== "play") { toLane(); return; }
    sfx.drain();
    if (ballNo >= balls) {
      if (score > best) { best = score; try { localStorage.setItem("aev-c7-best", String(best)); } catch { /* ignore */ } }
      opts.emit({ type: "msg", text: "Game over", sub: `Score ${score.toLocaleString("en-IN")} · Best ${best.toLocaleString("en-IN")}` });
      toLane();
      setState("over");
      return;
    }
    ballNo++;
    toLane();
    setState("ready");
    opts.emit({ type: "msg", text: `Ball ${ballNo}`, sub: "Hold the plunger, let go to launch" });
  }

  function updateGo() {
    const label = state === "attract" || state === "over" ? (state === "over" ? "Again" : "Start") : "Launch";
    goT.textContent = label;
    goBtn.setAttribute("aria-label", label === "Launch" ? "Launch the ball (hold for more power)" : "Start a game of pinball");
    goBtn.dataset.mode = label.toLowerCase();
  }
  updateGo();

  // ---------- collisions ----------
  Events.on(engine, "collisionStart", (ev) => {
    for (const p of ev.pairs) {
      const other = p.bodyA === ball ? p.bodyB : p.bodyB === ball ? p.bodyA : null;
      if (!other) continue;
      const bi = bumpers.indexOf(other);
      if (bi >= 0) {
        const nx = ball.position.x - other.position.x, ny = ball.position.y - other.position.y, l = Math.hypot(nx, ny) || 1;
        const sp = Math.min(17, Math.max(10.5, ball.speed * 1.05));
        Body.setVelocity(ball, { x: (nx / l) * sp, y: (ny / l) * sp });
        flash[bi] = 1;
        sfx.ping(1 + bi * 0.09);
        if (state === "play") {
          const first = bumperHit[bi] === 0;
          bumperHit[bi]++;
          add(100);
          opts.emit({ type: "hit", index: bi, first });
          if (first && bumperHit.every((h) => h > 0)) { add(5000); sfx.chime(); opts.emit({ type: "msg", text: "All five lit", sub: "+5,000 bonus" }); }
        } else opts.emit({ type: "hit", index: bi, first: false });
        continue;
      }
      const si = slings.indexOf(other);
      if (si >= 0) {
        const [a, , c] = slingPts[si];
        let nx = c.y - a.y, ny = -(c.x - a.x);
        const l = Math.hypot(nx, ny); nx /= l; ny /= l;
        const mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2;
        if (nx * (ball.position.x - mx) + ny * (ball.position.y - my) < 0) { nx = -nx; ny = -ny; }
        if (nx * (ball.position.x - mx) + ny * (ball.position.y - my) > -2) {
          Body.setVelocity(ball, { x: ball.velocity.x + nx * 8, y: ball.velocity.y + ny * 8 });
          slingFlash[si] = 1;
          sfx.ping(0.6);
          add(10);
        }
        continue;
      }
      const li = laneSensors.indexOf(other);
      if (li >= 0 && !lanesLit[li]) {
        lanesLit[li] = true;
        sfx.blip(li);
        add(50);
        if (lanesLit.every(Boolean)) {
          laneFlash = 1;
          sfx.chime();
          multI = Math.min(MULTS.length - 1, multI + 1);
          mult = MULTS[multI];
          add(1000);
          opts.emit({ type: "msg", text: "G R O W", sub: `Multiplier now ${mult}x` });
          setTimeout(() => lanesLit.fill(false), 900);
        }
      }
    }
  });

  // ---------- input ----------
  const flip = (i: number, on: boolean) => {
    const f = flippers[i];
    if (f.on === on) return;
    f.on = on;
    if (on) sfx.clack();
  };
  const startCharge = () => { if (state === "attract" || state === "over") { start(); return; } if (state === "ready" || ball.position.x > LANE) { charging = true; charge = 0; } };
  const endCharge = () => { if (!charging) return; charging = false; launch(charge); charge = 0; };

  let visible = false;
  const stopVis = watchView(table, (v) => { visible = v; }, "0px", 0.35);
  const keyMap = (k: string) => (k === "ArrowLeft" || k === "z" || k === "Z" ? 0 : k === "ArrowRight" || k === "/" || k === "m" || k === "M" ? 1 : -1);
  const onKey = (e: KeyboardEvent) => {
    if (!visible || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const down = e.type === "keydown";
    const i = keyMap(e.key);
    if (i >= 0) { e.preventDefault(); flip(i, down); return; }
    const playing = state === "ready" || state === "play";
    if ((e.key === " " || e.key === "ArrowDown") && playing) {
      e.preventDefault();
      if (down && !e.repeat) startCharge();
      if (!down) endCharge();
    }
  };
  addEventListener("keydown", onKey);
  addEventListener("keyup", onKey);

  // pointer on the table: left half / right half flip; the lane bottom is the plunger
  const pointers = new Map<number, number>();
  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    if (x > LANE && y > 560) { pointers.set(e.pointerId, 2); startCharge(); return; }
    if (state === "attract" || state === "over") return;
    const side = x < 190 ? 0 : 1;
    pointers.set(e.pointerId, side);
    flip(side, true);
  });
  const lift = (e: PointerEvent) => {
    const s = pointers.get(e.pointerId);
    if (s === undefined) return;
    pointers.delete(e.pointerId);
    if (s === 2) endCharge(); else flip(s, false);
  };
  canvas.addEventListener("pointerup", lift);
  canvas.addEventListener("pointercancel", lift);
  canvas.addEventListener("pointerleave", lift);

  const hold = (el: HTMLElement, down: () => void, up: () => void) => {
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch { /* synthetic */ } el.classList.add("on"); down(); });
    const u = () => { if (el.classList.contains("on")) { el.classList.remove("on"); up(); } };
    el.addEventListener("pointerup", u);
    el.addEventListener("pointercancel", u);
    el.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); el.classList.add("on"); down(); } });
    el.addEventListener("keyup", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); u(); } });
  };
  hold(host.querySelector(".pb-l")!, () => flip(0, true), () => flip(0, false));
  hold(host.querySelector(".pb-r")!, () => flip(1, true), () => flip(1, false));
  hold(goBtn, startCharge, endCharge);

  // ---------- simulation ----------
  let aiT = [0, 0];
  function step(dt: number, now: number) {
    const sub = 4, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (const f of flippers) {
        const target = f.on ? f.up : f.rest;
        const speed = (f.on ? 0.36 : 0.17) * (h / 16.7);
        const d = target - f.a;
        const na = Math.abs(d) <= speed ? target : f.a + Math.sign(d) * speed;
        placeFlipper(f, na, true);
        f.a = na;
      }
      if (charging) charge = Math.min(1, charge + h / 900);
      Engine.update(engine, h);
      if (ball.speed > 30) Body.setVelocity(ball, { x: (ball.velocity.x / ball.speed) * 30, y: (ball.velocity.y / ball.speed) * 30 });
    }
    // the gate closes once the ball is out in the playfield
    if (gate.isSensor && ball.position.x < LANE - 8 && ball.position.y < 400) gate.isSensor = false;
    if (ball.position.y > H + 30 || ball.position.x < -40 || ball.position.x > W + 40) drained();
    // a ball resting somewhere out of reach gets a nudge
    if (ball.speed > 0.4 || ball.position.x > LANE) lastMoveT = now;
    else if (now - lastMoveT > 3500) { Body.setVelocity(ball, { x: (Math.random() - 0.5) * 8, y: -6 }); lastMoveT = now; }
    // attract mode plays itself
    if (state === "attract") {
      flippers.forEach((f, i) => {
        const tipx = f.px + Math.cos(f.rest) * FL * 0.6;
        const near = Math.abs(ball.position.x - tipx) < 44 && ball.position.y > 640 && ball.position.y < 705 && ball.velocity.y > -1;
        if (near && now > aiT[i]) { f.on = true; aiT[i] = now + 420; setTimeout(() => (f.on = false), 160); }
      });
      if (ball.position.x > LANE && ball.position.y > 700 && ball.speed < 0.3 && !charging) { charging = true; charge = 0; setTimeout(() => endCharge(), 300 + Math.random() * 600); }
    }
    for (let i = 0; i < 5; i++) flash[i] = Math.max(0, flash[i] - dt / 260);
    slingFlash[0] = Math.max(0, slingFlash[0] - dt / 160);
    slingFlash[1] = Math.max(0, slingFlash[1] - dt / 160);
    laneFlash = Math.max(0, laneFlash - dt / 900);
    draw(now);
  }

  // ---------- drawing ----------
  let scale = 1, dpr = 1;
  const art = document.createElement("canvas");
  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2);
    scale = r.width / W;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    art.width = canvas.width; art.height = canvas.height;
    paintArt();
    draw(performance.now());
  }

  const font = (px: number, fam = "Bungee") => `${px}px ${fam}, "Barlow Condensed", sans-serif`;
  function paintArt() {
    const g = art.getContext("2d")!;
    g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    // playfield
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#13204a"); bg.addColorStop(0.55, "#0d1636"); bg.addColorStop(1, "#090f26");
    g.fillStyle = bg;
    g.beginPath();
    g.moveTo(0, H); g.lineTo(0, 215);
    arc.forEach((p) => g.lineTo(p.x, p.y));
    g.lineTo(W, H); g.closePath(); g.fill();
    g.save(); g.clip();
    // printed sunburst behind the bumpers
    g.globalAlpha = 0.07;
    for (let i = 0; i < 24; i++) {
      g.fillStyle = i % 2 ? "#39d0ff" : "#ffc23d";
      const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 0.5) / 24) * Math.PI * 2;
      g.beginPath(); g.moveTo(190, 340); g.lineTo(190 + Math.cos(a0) * 600, 340 + Math.sin(a0) * 600); g.lineTo(190 + Math.cos(a1) * 600, 340 + Math.sin(a1) * 600); g.fill();
    }
    g.globalAlpha = 1;
    // printed rings
    g.strokeStyle = "rgba(255,243,221,.08)"; g.lineWidth = 1.2;
    for (const rr of [70, 120, 170]) { g.beginPath(); g.arc(190, 340, rr, 0, Math.PI * 2); g.stroke(); }
    // name printed on the playfield, low
    g.fillStyle = "rgba(255,243,221,.07)";
    g.font = font(34, "'Bungee Shade'");
    g.textAlign = "center";
    g.fillText(opts.name.toUpperCase(), 190, 660);
    g.restore();
    // lane-guide arrows toward the lanes
    g.fillStyle = "rgba(255,255,255,.06)";
    for (const x of LANES) { g.beginPath(); g.moveTo(x, 150); g.lineTo(x - 9, 168); g.lineTo(x + 9, 168); g.fill(); }
    // chrome rails
    const chrome = g.createLinearGradient(0, 0, W, 0);
    chrome.addColorStop(0, "#8c95ad"); chrome.addColorStop(0.5, "#e8ecf5"); chrome.addColorStop(1, "#8c95ad");
    g.strokeStyle = chrome; g.lineWidth = 5; g.lineCap = "round"; g.lineJoin = "round";
    for (const p of wallPaths) { g.beginPath(); g.moveTo(p[0].x, p[0].y); p.forEach((q) => g.lineTo(q.x, q.y)); g.stroke(); }
    g.beginPath(); g.moveTo(LANE + 3, 250); g.lineTo(LANE + 3, H); g.stroke();
    // lane
    g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(LANE + 6, 250, W - LANE - 6, H - 250);
    g.fillStyle = "rgba(255,243,221,.45)"; g.font = font(9); g.save(); g.translate(W - 14, 520); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.fillText("HOLD TO LAUNCH", 0, 0); g.restore();
    // dividers
    g.fillStyle = "#e8ecf5";
    dividers.forEach((d) => { g.beginPath(); (g as CanvasRenderingContext2D).roundRect(d.position.x - 2.5, 98, 5, 40, 2.5); g.fill(); });
    // bumper bases
    BUMPERS.forEach((b) => { g.fillStyle = "#05070f"; g.beginPath(); g.arc(b.x, b.y + 3, 27, 0, Math.PI * 2); g.fill(); });
  }

  function lamp(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, lit: number, label?: string) {
    g.save();
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    if (lit > 0) {
      g.shadowColor = color; g.shadowBlur = 14 * lit;
      g.fillStyle = color; g.globalAlpha = 0.35 + 0.65 * lit; g.fill();
    } else { g.fillStyle = "rgba(255,255,255,.08)"; g.fill(); g.strokeStyle = color; g.globalAlpha = 0.5; g.lineWidth = 1.2; g.stroke(); }
    g.restore();
    if (label) {
      g.fillStyle = lit > 0.3 ? "#0b1022" : "rgba(255,243,221,.75)";
      g.font = font(r * 1.05); g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(label, x, y + 1);
    }
  }

  function draw(now: number) {
    const g = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(art, 0, 0);
    g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    const blink = Math.floor(now / 420) % 2;
    // G R O W lane lamps
    "GROW".split("").forEach((ch, i) => lamp(g, LANES[i], 186, 11, "#ffc23d", lanesLit[i] ? 1 : laneFlash > 0 && blink ? 0.8 : 0, ch));
    // multiplier lamps
    MULTS.forEach((m, i) => lamp(g, 145 + i * 30, 548, 10, "#ff5fa8", i <= multI && (i > 0 || state === "play") ? 1 : 0, `${m}x`));
    // service lamps: lit once each bumper has been hit this game (attract: chase)
    BUMPERS.forEach((_, i) => {
      const lit = state === "attract" ? (Math.floor(now / 160) % 5 === i ? 1 : 0) : bumperHit[i] > 0 ? 1 : 0;
      lamp(g, 130 + i * 30, 506, 9, COLORS[i], lit, String(i + 1));
    });
    // slingshots
    slingPts.forEach((pts, i) => {
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y); pts.forEach((p) => g.lineTo(p.x, p.y)); g.closePath();
      g.fillStyle = slingFlash[i] > 0 ? "#ffd27a" : "#c2333f"; g.fill();
      g.lineWidth = 4; g.strokeStyle = "#f6f1e6"; g.lineJoin = "round"; g.stroke();
    });
    // bumpers
    BUMPERS.forEach((b, i) => {
      const f = flash[i], c = COLORS[i];
      g.save();
      if (f > 0) { g.shadowColor = c; g.shadowBlur = 26 * f; }
      const grad = g.createRadialGradient(b.x - 6, b.y - 8, 2, b.x, b.y, 24);
      grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.35, c); grad.addColorStop(1, f > 0 ? c : "#1b2448");
      g.fillStyle = grad; g.beginPath(); g.arc(b.x, b.y, 22 + f * 3, 0, Math.PI * 2); g.fill();
      g.restore();
      g.lineWidth = 2.5; g.strokeStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(b.x, b.y, 22 + f * 3, 0, Math.PI * 2); g.stroke();
      const lbl = opts.bumpers[i]?.short ?? "";
      let fs = 9; g.font = font(fs);
      while (fs > 5.5 && g.measureText(lbl).width > 36) { fs -= 0.5; g.font = font(fs); }
      g.fillStyle = "#0b1022"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(lbl, b.x, b.y + 1);
      if (f > 0) { g.strokeStyle = c; g.globalAlpha = f; g.lineWidth = 2; g.beginPath(); g.arc(b.x, b.y, 26 + (1 - f) * 22, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    });
    // flippers
    flippers.forEach((f) => {
      const v = f.body.vertices;
      g.beginPath(); g.moveTo(v[0].x, v[0].y); v.forEach((p) => g.lineTo(p.x, p.y)); g.closePath();
      g.fillStyle = "#e8433f"; g.fill(); g.lineWidth = 3; g.strokeStyle = "#f6f1e6"; g.stroke();
      g.fillStyle = "#0b1022"; g.beginPath(); g.arc(f.px, f.py, 3.2, 0, Math.PI * 2); g.fill();
    });
    // plunger spring
    const py = plungerTop + charge * 26;
    g.strokeStyle = "#c9cfdd"; g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= 10; i++) g.lineTo(i % 2 ? W - 26 : W - 12, py + 4 + (i / 10) * (H - py - 8));
    g.stroke();
    g.fillStyle = "#e8ecf5"; g.fillRect(W - 32, py, 26, 5);
    // ball
    const bx = ball.position.x, by = ball.position.y;
    const bg = g.createRadialGradient(bx - 3, by - 4, 1, bx, by, R);
    bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.4, "#c9d0de"); bg.addColorStop(1, "#4d5568");
    g.fillStyle = bg; g.beginPath(); g.arc(bx, by, R, 0, Math.PI * 2); g.fill();
  }

  const loop = visibleLoop(table, step);
  if (import.meta.env.DEV) (window as unknown as { __pb: unknown }).__pb = { ball, get state() { return state; }, get score() { return score; } };
  const ro = new ResizeObserver(() => size());
  ro.observe(canvas);
  document.fonts?.ready.then(() => size());
  if (reduced()) engine.timing.timeScale = 0.85;
  // attract mode begins with a launch
  setTimeout(() => state === "attract" && launch(0.8), 600);
  opts.emit({ type: "state", state, ball: 0, balls });

  return {
    start,
    destroy() {
      loop.stop(); ro.disconnect(); stopVis();
      removeEventListener("keydown", onKey); removeEventListener("keyup", onKey);
      Events.off(engine, "collisionStart");
      Composite.clear(world, false); Engine.clear(engine);
      host.innerHTML = "";
    },
  };
}
