// LIGHT WORLD signature toy: a word built from physical letter blocks resting on a drawn shelf.
// Pull the release lever: the trapdoor shelf drops open, the blocks fall and tumble down,
// bouncing off the drawing's dimension lines (which are real static bodies). Drag and throw any
// block. "Reassemble" tweens every block back home. Only the blocks capture the pointer
// (touch-action:none on them alone), so the page always scrolls everywhere else.
import Matter from "matter-js";
import { gsap, visibleLoop, reduced, svgNS, esc } from "./core";
import { sfx } from "./sound";

const setPos = Matter.Body.setPosition as unknown as (b: Matter.Body, p: Matter.Vector, v?: boolean) => void;
const setAng = Matter.Body.setAngle as unknown as (b: Matter.Body, a: number, v?: boolean) => void;
const { Engine, Bodies, Body, Composite, Constraint, Events, Sleeping } = Matter;

type Opts = { word: string; label?: string };

let DROP = 1.08; // radians each trapdoor half swings down (capped so the tips stay above the floor)
// matter-js resets friction to 1 and restitution to 0 on static bodies: set them back afterwards
const tune = (b: Matter.Body, friction: number, restitution: number, frictionStatic = 0.5) => { b.friction = friction; b.restitution = restitution; b.frictionStatic = frictionStatic; return b; };

export function mountLetters(host: HTMLElement, opts: Opts) {
  const word = opts.word.toUpperCase();
  host.innerHTML = `
    <div class="lp-stage" data-state="ready">
      <svg class="lp-svg" aria-hidden="true"></svg>
      <div class="lp-blocks" aria-hidden="true"></div>
      <button class="lp-lever" type="button" aria-label="Pull the release lever: the shelf drops open and the letters of ${esc(word)} tumble down">
        <svg viewBox="0 0 60 120" aria-hidden="true">
          <rect class="lv-base" x="16" y="88" width="28" height="24" rx="2"/>
          <path class="lv-slot" d="M30 92 v16"/>
          <g class="lv-arm"><path d="M30 100 L30 18"/><circle cx="30" cy="16" r="10"/><circle class="lv-pin" cx="30" cy="100" r="4"/></g>
        </svg>
        <span class="lv-tag">PULL</span>
      </button>
    </div>
    <div class="lp-controls">
      <button class="lp-btn lp-release" type="button"><span class="lp-btn-ico" aria-hidden="true"></span><span>Release the shelf</span></button>
      <button class="lp-btn lp-again" type="button" disabled><span class="lp-btn-ico" aria-hidden="true"></span><span>Reassemble</span></button>
      <p class="lp-hint" aria-live="polite">Drag or throw any block.</p>
    </div>`;

  const stage = host.querySelector<HTMLElement>(".lp-stage")!;
  const svg = host.querySelector<SVGSVGElement>(".lp-svg")!;
  const blocksEl = host.querySelector<HTMLElement>(".lp-blocks")!;
  const lever = host.querySelector<HTMLButtonElement>(".lp-lever")!;
  const arm = lever.querySelector<SVGGElement>(".lv-arm")!;
  const btnRelease = host.querySelector<HTMLButtonElement>(".lp-release")!;
  const btnAgain = host.querySelector<HTMLButtonElement>(".lp-again")!;
  const hint = host.querySelector<HTMLElement>(".lp-hint")!;

  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = 1.1;

  let W = 0, H = 0, S = 0;
  type Door = { body: Matter.Body; hx: number; hy: number; len: number; dir: 1 | -1; g: SVGGElement };
  let doors: Door[] = [];
  let shelfAngle = 0, shelfTarget = 0, shelfLen = 0;
  const shelfThick = 14;
  let blocks: { body: Matter.Body; el: HTMLElement; home: { x: number; y: number } }[] = [];
  let released = false, busy = false;
  let grab: { c: Matter.Constraint; b: Matter.Body; id: number; el: HTMLElement } | null = null;

  function line(x1: number, y1: number, x2: number, y2: number, cls: string) {
    const l = document.createElementNS(svgNS, "line");
    l.setAttribute("x1", String(x1)); l.setAttribute("y1", String(y1));
    l.setAttribute("x2", String(x2)); l.setAttribute("y2", String(y2));
    l.setAttribute("class", cls);
    return l;
  }
  function text(x: number, y: number, s: string, cls: string, rot = 0) {
    const t = document.createElementNS(svgNS, "text");
    t.setAttribute("x", String(x)); t.setAttribute("y", String(y));
    t.setAttribute("class", cls);
    if (rot) t.setAttribute("transform", `rotate(${rot} ${x} ${y})`);
    t.textContent = s;
    return t;
  }
  /** a dimension line with arrowheads, extension ticks and a measured label */
  function dimension(g: SVGGElement, x1: number, y1: number, x2: number, y2: number, label: string, labelSide = -1) {
    const a = Math.atan2(y2 - y1, x2 - x1), deg = (a * 180) / Math.PI;
    const ah = 9, aw = 3.4;
    g.append(line(x1, y1, x2, y2, "dim"));
    const head = (x: number, y: number, dir: number) => {
      const p = document.createElementNS(svgNS, "path");
      const bx = x - Math.cos(a) * ah * dir, by = y - Math.sin(a) * ah * dir;
      const nx = -Math.sin(a) * aw, ny = Math.cos(a) * aw;
      p.setAttribute("d", `M${x} ${y} L${bx + nx} ${by + ny} L${bx - nx} ${by - ny}Z`);
      p.setAttribute("class", "dim-head");
      g.append(p);
    };
    head(x1, y1, -1); head(x2, y2, 1);
    const nx = -Math.sin(a), ny = Math.cos(a);
    for (const [x, y] of [[x1, y1], [x2, y2]]) g.append(line(x - nx * 7, y - ny * 7, x + nx * 7, y + ny * 7, "dim-tick"));
    const mx = (x1 + x2) / 2 + nx * 11 * labelSide, my = (y1 + y2) / 2 + ny * 11 * labelSide;
    const t = text(mx, my, label, "dim-txt", deg > 90 || deg < -90 ? deg + 180 : deg);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "middle");
    g.append(t);
  }

  function build() {
    Composite.clear(engine.world, false);
    svg.innerHTML = "";
    blocksEl.innerHTML = "";
    blocks = [];
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const n = word.length;
    // narrow screens stack the word in two rows on the same shelf (bigger blocks, same physics)
    // the word stacks in two rows (AEVI / NITE): big blocks that own the drawing
    const rows = n > 5 ? 2 : 1;
    const per = Math.ceil(n / rows);
    const leverSpace = Math.max(46, W * 0.085);
    const minPad = Math.max(14, W * 0.035);
    S = Math.min((W - minPad * 2 - leverSpace) / (per + (per - 1) * 0.14 + 0.5), (H * 0.42) / rows, 128);
    const gap = S * 0.14;
    const shelfY = Math.round(Math.max(H * 0.36, S * rows + 64));
    const rowW = per * S + (per - 1) * gap;
    shelfLen = rowW + S * 0.5;
    // centre the shelf (and its lever) in the frame
    const pad = Math.max(minPad, (W - shelfLen - leverSpace) / 2);
    const x0 = pad + S * 0.25;

    // static scenery: floor, walls, two dimension lines the blocks bounce off
    const floorY = H - 6;
    const wallOpts = { isStatic: true, friction: 0.6, restitution: 0.2 };
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, floorY + 30, W * 2, 60, wallOpts),
      Bodies.rectangle(-30, H / 2, 60, H * 3, wallOpts),
      Bodies.rectangle(W + 30, H / 2, 60, H * 3, wallOpts),
      Bodies.rectangle(W / 2, -H - 30, W * 2, 60, wallOpts),
    ].map((b) => tune(b, 0.6, 0.2)));
    const g = document.createElementNS(svgNS, "g");
    svg.append(g);
    // datum floor with section hatch below it
    g.append(line(0, floorY, W, floorY, "floor"));
    const hatch = document.createElementNS(svgNS, "path");
    let hd = "";
    for (let x = -10; x < W + 10; x += 14) hd += `M${x} ${floorY + 6} l6 -6 `;
    hatch.setAttribute("d", hd);
    hatch.setAttribute("class", "floor-hatch");
    g.append(hatch);

    // one real dimension line in the drop zone: the blocks bounce off it
    const ramps: [number, number, number, number, string, number][] = [
      [pad + shelfLen * 0.68, shelfY + (H - shelfY) * 0.5, pad + shelfLen * 0.34, shelfY + (H - shelfY) * 0.72, "", 1],
    ];
    for (const [x1, y1, x2, y2, , side] of ramps) {
      const len = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
      const t = 10, nx = -Math.sin(a), ny = Math.cos(a);
      Composite.add(engine.world, tune(Bodies.rectangle((x1 + x2) / 2 + nx * t / 2, (y1 + y2) / 2 + ny * t / 2, len, t, { ...wallOpts, angle: a }), 0.05, 0.45, 0.1));
      dimension(g, x1, y1, x2, y2, `${Math.round(len)} px`, -side);
    }
    // overall width dimension above the word, and the drop height
    dimension(g, x0, shelfY - S * rows - 22, x0 + rowW, shelfY - S * rows - 22, `${word} · ${n} blocks · ${Math.round(rowW)} px`);
    const dx = W - 14;
    dimension(g, dx, shelfY + shelfThick + 40, dx, floorY - 4, `drop ${Math.round(floorY - shelfY)} px`, 1);
    g.append(text(pad, H * 0.97 - 14, "DATUM A", "dim-note"));

    // the shelf: two hatched trapdoor halves, hinged at the outer ends, held shut by a prop at the
    // seam. Pulling the lever knocks the prop away and both halves swing down (kinematic bodies).
    const hy = shelfY + shelfThick / 2, half = shelfLen / 2, seam = pad + half;
    DROP = Math.min(1.08, Math.asin(Math.min(1, Math.max(0.3, (floorY - 34 - hy) / (half - 1)))));
    doors = ([[pad, 1], [pad + shelfLen, -1]] as const).map(([hx, dir]) => {
      const g2 = document.createElementNS(svgNS, "g");
      g2.setAttribute("class", "shelf");
      const x1 = dir === 1 ? hx : hx - half;
      const bar = document.createElementNS(svgNS, "rect");
      bar.setAttribute("x", String(x1)); bar.setAttribute("y", String(shelfY));
      bar.setAttribute("width", String(half - 1)); bar.setAttribute("height", String(shelfThick));
      bar.setAttribute("class", "shelf-bar");
      const sh = document.createElementNS(svgNS, "path");
      let sd = "";
      for (let x = x1 + 6; x < x1 + half - 4; x += 9) sd += `M${x} ${shelfY + shelfThick} l${Math.min(9, x1 + half - 1 - x)} ${-shelfThick} `;
      sh.setAttribute("d", sd);
      sh.setAttribute("class", "shelf-hatch");
      g2.append(bar, sh);
      svg.append(g2);
      const hg = document.createElementNS(svgNS, "g");
      hg.setAttribute("class", "hinge");
      const hc = document.createElementNS(svgNS, "circle");
      hc.setAttribute("cx", String(hx)); hc.setAttribute("cy", String(hy)); hc.setAttribute("r", "6");
      hg.append(hc, line(hx - 11, hy, hx + 11, hy, "cl"), line(hx, hy - 11, hx, hy + 11, "cl"));
      svg.append(hg);
      const body = tune(Bodies.rectangle(0, 0, half - 1, shelfThick, { isStatic: true }), 0.3, 0.1);
      Composite.add(engine.world, body);
      return { body, hx, hy, len: half - 1, dir, g: g2 } as Door;
    });
    const prop = document.createElementNS(svgNS, "path");
    prop.setAttribute("d", `M${seam} ${shelfY + shelfThick} l0 30 M${seam - 12} ${shelfY + shelfThick + 30} h24`);
    prop.setAttribute("class", "prop");
    svg.append(prop);
    const pl = text(seam + 8, shelfY + shelfThick + 26, "PROP", "dim-note prop");
    svg.append(pl);

    // lever sits right of the shelf
    lever.style.left = `${Math.min(W - leverSpace * 0.5, pad + shelfLen + leverSpace * 0.55)}px`;
    lever.style.top = `${shelfY}px`;
    lever.style.setProperty("--s", String(Math.max(0.6, Math.min(1.15, (S / 80) * 1.15, (shelfY - 18) / 150))));

    shelfAngle = released ? DROP : 0;
    shelfTarget = shelfAngle;
    placeShelf(shelfAngle, false);

    word.split("").forEach((ch, i) => {
      const r = Math.floor(i / per), c = i % per;
      const home = { x: x0 + S / 2 + c * (S + gap), y: shelfY - S / 2 - 0.5 - (rows - 1 - r) * (S + 0.5) };
      const body = Bodies.rectangle(home.x, home.y, S, S, { chamfer: { radius: S * 0.06 }, restitution: 0.28, friction: 0.3, frictionStatic: 0.2, frictionAir: 0.012, density: 0.0016 });
      const el = document.createElement("div");
      el.className = "blk";
      el.style.width = el.style.height = `${S}px`;
      el.style.fontSize = `${S * 0.74}px`;
      el.innerHTML = `<b>${esc(ch)}</b><i>${String(i + 1).padStart(2, "0")}</i>`;
      blocksEl.append(el);
      blocks.push({ body, el, home });
      Composite.add(engine.world, body);
      bindDrag(el, body);
    });
    if (released) {
      // after a resize while tumbled: drop them in again from their homes
      blocks.forEach((b) => Body.setPosition(b.body, { x: b.home.x, y: b.home.y - 10 }));
    }
    render();
  }

  function placeShelf(a: number, vel: boolean) {
    for (const d of doors) {
      // each half swings down about its own outer hinge
      const cx = d.hx + d.dir * Math.cos(a) * d.len / 2;
      const cy = d.hy + Math.sin(a) * d.len / 2;
      setPos(d.body, { x: cx, y: cy }, vel);
      setAng(d.body, a * d.dir, vel);
      d.g.setAttribute("transform", `rotate(${((a * d.dir * 180) / Math.PI).toFixed(2)} ${d.hx} ${d.hy})`);
    }
  }

  function render() {
    for (const b of blocks) {
      const { x, y } = b.body.position;
      b.el.style.transform = `translate(${x - S / 2}px, ${y - S / 2}px) rotate(${b.body.angle}rad)`;
    }
  }

  const local = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function bindDrag(el: HTMLElement, body: Matter.Body) {
    el.addEventListener("pointerdown", (e) => {
      if (busy || grab) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const p = local(e);
      Sleeping.set(body, false);
      const c = Constraint.create({ pointA: p, bodyB: body, pointB: { x: p.x - body.position.x, y: p.y - body.position.y }, stiffness: 0.18, damping: 0.08, length: 0 });
      Composite.add(engine.world, c);
      grab = { c, b: body, id: e.pointerId, el };
      el.classList.add("held");
      loop.kick();
    });
    const end = (e: PointerEvent) => {
      if (!grab || grab.id !== e.pointerId) return;
      Composite.remove(engine.world, grab.c);
      grab.el.classList.remove("held");
      grab = null;
    };
    el.addEventListener("pointermove", (e) => { if (grab && grab.id === e.pointerId) { grab.c.pointA = local(e); loop.kick(); } });
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  let lastKnock = 0;
  Events.on(engine, "collisionStart", (ev) => {
    const now = performance.now();
    if (now - lastKnock < 70) return;
    for (const p of ev.pairs) {
      const s = Math.max(p.bodyA.speed, p.bodyB.speed);
      if (s > 2.5) { lastKnock = now; sfx.knock(Math.min(1, s / 12)); break; }
    }
  });

  const loop = visibleLoop(stage, (dt) => {
    // shelf eases toward its target angle as a kinematic body (so it really tips the blocks)
    const sub = 2, h = Math.min(dt, 25) / sub;
    for (let i = 0; i < sub; i++) {
      // the trapdoor halves fall open like they have weight, and close at a steady pace
      if (Math.abs(shelfTarget - shelfAngle) > 0.0005) {
        const opening = shelfTarget > shelfAngle;
        const sp = (opening ? 0.012 + shelfAngle * 0.05 : 0.03) * (h / 16.7);
        shelfAngle += Math.sign(shelfTarget - shelfAngle) * Math.min(Math.abs(shelfTarget - shelfAngle), sp);
        if (opening && shelfAngle >= shelfTarget) sfx.knock(1);
      }
      placeShelf(shelfAngle, true);
      Engine.update(engine, h);
    }
    render();
  });

  function release() {
    if (released || busy) return;
    released = true;
    stage.dataset.state = "released";
    sfx.lever();
    gsap.to(arm, { rotation: 38, svgOrigin: "30 100", duration: 0.25, ease: "back.out(2)" });
    host.querySelectorAll(".prop").forEach((e) => e.classList.add("gone"));
    shelfTarget = DROP;
    blocks.forEach((b) => Sleeping.set(b.body, false));
    btnRelease.disabled = true;
    btnAgain.disabled = false;
    hint.textContent = "Now throw them around. Reassemble puts them back.";
    if (reduced()) { shelfAngle = DROP; placeShelf(DROP, false); }
    loop.kick();
  }

  function reassemble() {
    if (!released || busy) return;
    busy = true;
    stage.dataset.state = "assembling";
    sfx.lever();
    if (grab) { Composite.remove(engine.world, grab.c); grab.el.classList.remove("held"); grab = null; }
    // shelf swings back while the blocks fly home along arcs, then physics resumes
    shelfTarget = 0;
    const tl = gsap.timeline({
      onComplete: () => {
        blocks.forEach((b) => { Sleeping.set(b.body, false); b.body.collisionFilter.mask = 0xffffffff; Body.setVelocity(b.body, { x: 0, y: 0 }); Body.setAngularVelocity(b.body, 0); });
        shelfAngle = 0; placeShelf(0, false);
        released = false; busy = false;
        stage.dataset.state = "ready";
        host.querySelectorAll(".prop").forEach((e) => e.classList.remove("gone"));
        btnRelease.disabled = false; btnAgain.disabled = true;
        hint.textContent = "Back in place. Pull the lever again.";
        gsap.to(arm, { rotation: 0, svgOrigin: "30 100", duration: 0.3, ease: "power2.out" });
      },
    });
    blocks.forEach((b, i) => {
      Sleeping.set(b.body, false);
      b.body.collisionFilter.mask = 0;
      const from = { x: b.body.position.x, y: b.body.position.y, a: b.body.angle };
      const turns = Math.round(from.a / (Math.PI / 2)) * (Math.PI / 2);
      const o = { t: 0 };
      tl.to(o, {
        t: 1, duration: reduced() ? 0.01 : 0.85, ease: "power3.inOut",
        onUpdate: () => {
          const t = o.t, lift = Math.sin(t * Math.PI) * -Math.max(60, S * 1.2);
          Body.setPosition(b.body, { x: from.x + (b.home.x - from.x) * t, y: from.y + (b.home.y - from.y) * t + lift });
          Body.setAngle(b.body, from.a + (turns - from.a) * t);
          Body.setVelocity(b.body, { x: 0, y: 0 });
          Body.setAngularVelocity(b.body, 0);
          if (t >= 1) Body.setAngle(b.body, 0);
          loop.kick();
        },
        onComplete: () => {
          // this block is home: give it its body back straight away (others may still be flying)
          Body.setAngle(b.body, 0);
          Body.setPosition(b.body, { x: b.home.x, y: b.home.y });
          Body.setVelocity(b.body, { x: 0, y: 0 });
          Body.setAngularVelocity(b.body, 0);
          b.body.collisionFilter.mask = 0xffffffff;
          sfx.knock(0.6);
        },
      }, 0.12 + i * 0.06);
    });
  }

  if (import.meta.env.DEV) (window as unknown as { __lp: unknown }).__lp = { engine, get blocks() { return blocks; } };
  lever.addEventListener("click", release);
  btnRelease.addEventListener("click", release);
  btnAgain.addEventListener("click", reassemble);
  // drag the lever handle downward to pull it, too
  lever.addEventListener("pointerdown", (e) => {
    const y0 = e.clientY;
    const mv = (ev: PointerEvent) => { if (ev.clientY - y0 > 18) { release(); up(); } };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
    addEventListener("pointermove", mv);
    addEventListener("pointerup", up);
  });

  let rw = 0;
  const ro = new ResizeObserver(() => {
    const w = Math.round(stage.getBoundingClientRect().width);
    if (w && w !== rw) { rw = w; build(); loop.kick(); }
  });
  ro.observe(stage);

  return {
    release,
    reassemble,
    destroy() {
      loop.stop();
      ro.disconnect();
      Events.off(engine, "collisionStart");
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      host.innerHTML = "";
    },
  };
}
