// The signature toy: a real 10×10 snakes and ladders board. A fair die, a token that hops square by
// square, ladders that are things we build, and snakes that are problems. Landing on a snake never
// drops you: the snake is charmed, slides back into its head and turns into a ladder that lifts
// you. Reaching 100 celebrates and shows how to reach us. Works by mouse, touch and keyboard (R).
import { COMPANY, MARQUEE, media } from "@shared/content";
import { getTheme, onTheme } from "@shared/theme";
import { gsap, $, $$, esc, reduced, rollD6, wait, icon } from "./util";

const isSheet = () => matchMedia("(max-width: 1099px)").matches;
import { hop, climb, charm, bell, win as winSound, tap } from "./sound";
import { sq, cell, snake, ladder, lerp, lotus, diya, type P } from "./art";
import { LADDERS, SNAKES, SNAKE_COLORS, type Ladder, type Snake } from "./data";
import { Die, dieHTML } from "./die";
import { celebrate } from "./fx";

type Item = Ladder | Snake;
const ALL: Item[] = [...LADDERS, ...SNAKES];
const SQ_TONES = ["t0", "t1", "t2", "t3", "t4"];

const glyph = {
  ladder: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2v16M14 2v16M6 5.5h8M6 10h8M6 14.5h8"/></svg>`,
  snake: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 4.5c-2-1.6-5.4-.8-5.4 1.8 0 3 5.6 2.6 5.6 6.2 0 3.2-4.6 4.4-8 2.4-2-1.2-3.6-1-4.6.2"/><circle cx="15.4" cy="4.6" r="1.6"/></svg>`,
};

/* ------------------------------------------------------------------ markup */

function squaresHTML() {
  let s = "";
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const br = 9 - r, n = br % 2 === 0 ? br * 10 + c + 1 : br * 10 + (9 - c) + 1;
    const tone = SQ_TONES[(r * 3 + c * 2 + (r % 2)) % 5];
    const extra = n === 100 ? `<span class="sq__goal">${lotus("sq__lotus")}</span>` : n === 1 ? `<span class="sq__start">Start</span>` : "";
    s += `<div class="sq ${tone}${n === 100 ? " sq--goal" : ""}${n === 1 ? " sq--start" : ""}" data-n="${n}"><span class="sq__n">${n}</span>${extra}</div>`;
  }
  return s;
}

function artHTML() {
  const defs: string[] = [], lads: string[] = [], snks: string[] = [];
  LADDERS.forEach((l) => {
    const a = ladder(sq(l.from_sq), sq(l.to_sq));
    lads.push(`<g class="lad" data-id="${l.id}">
      <path class="lad__shade" d="${a.railA}${a.railB}"/>
      <g class="lad__rungs">${a.rungs.map((d) => `<path class="lad__rung" d="${d}"/>`).join("")}</g>
      <path class="lad__rail" d="${a.railA}"/><path class="lad__rail" d="${a.railB}"/>
    </g>`);
  });
  SNAKES.forEach((s, i) => {
    const a = snake(sq(s.head), sq(s.tail), s.seed, s.bend ?? 1);
    const col = SNAKE_COLORS[i % SNAKE_COLORS.length];
    defs.push(`<pattern id="scl-${s.id}" width="18" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(${Math.round(a.angle)})">
        <path class="scl" d="M0 7 9 0l9 7-9 7Z"/></pattern>
      <mask id="mk-${s.id}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="1100" height="1100"><path class="snk__mask" d="${a.spine}"/></mask>`);
    snks.push(`<g class="snk snk--${col}" data-id="${s.id}">
      <g class="snk__bodyg" mask="url(#mk-${s.id})">
        <path class="snk__body" d="${a.body}"/>
        <path class="snk__scales" d="${a.body}" fill="url(#scl-${s.id})"/>
        <path class="snk__belly" d="${a.belly}"/>
        <path class="snk__line" d="${a.body}"/>
      </g>
      <g class="snk__headg" style="transform-origin:${a.headAt.x}px ${a.headAt.y}px">
        <path class="snk__tongue" d="${a.tongue}"/>
        <path class="snk__head" d="${a.head}"/>
        <path class="snk__eyes" d="${a.eyes}"/>
      </g>
    </g>`);
  });
  return `<svg class="board__art" viewBox="0 0 1000 1000" aria-hidden="true">
    <defs>${defs.join("")}</defs>
    <g class="art__ladders">${lads.join("")}</g>
    <g class="art__tamed"></g>
    <g class="art__snakes">${snks.join("")}</g>
  </svg>`;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** A label sits on the square that triggers it (a ladder's foot, a snake's head), low in the square. */
function chipAt(it: Item): P {
  const p = sq(it.kind === "ladder" ? it.from_sq : it.head);
  return { x: p.x + (it.labelNudge?.[0] ?? 0), y: p.y + 30 + (it.labelNudge?.[1] ?? 0) };
}

function chipsHTML() {
  return ALL.map((it) => {
    const p = chipAt(it);
    const where = it.kind === "ladder" ? `Ladder from square ${it.from_sq} to ${it.to_sq}` : `Snake on square ${it.head}`;
    return `<button type="button" class="chip chip--${it.kind}" data-chip="${it.id}" style="left:${clamp(p.x / 10, 8.5, 91.5)}%;top:${clamp(p.y / 10, 4, 96)}%"
      aria-label="${esc(`${where}: ${it.label}. Read the card`)}"><span class="chip__in"><span class="chip__g">${glyph[it.kind]}</span><span class="chip__t">${esc(it.label)}</span></span></button>`;
  }).join("");
}

function frameHTML() {
  const side = (a: number, b: number) => MARQUEE.slice(a, b).join("  ·  ");
  const diyas = Array.from({ length: 28 }, (_, i) => {
    const side = Math.floor(i / 7), k = (i % 7) + 0.5, t = (k / 7) * 100;
    const pos = side === 0 ? `left:${t}%;top:0` : side === 1 ? `left:100%;top:${t}%` : side === 2 ? `left:${100 - t}%;top:100%` : `left:0;top:${100 - t}%`;
    return `<span class="fr__diya" style="${pos};--i:${i}">${diya()}</span>`;
  }).join("");
  return `<div class="board__frame" aria-hidden="true">
    <svg class="fr__paint" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <path id="fr-t" class="fr__guide" d="M60,26H940"/><path id="fr-r" class="fr__guide" d="M974,60V940"/>
      <path id="fr-b" class="fr__guide" d="M60,974H940"/><path id="fr-l" class="fr__guide" d="M26,940V60"/>
      <text class="fr__text"><textPath href="#fr-t" startOffset="50%" text-anchor="middle">${esc(side(0, 3))}</textPath></text>
      <text class="fr__text"><textPath href="#fr-r" startOffset="50%" text-anchor="middle">${esc(side(3, 5))}</textPath></text>
      <text class="fr__text"><textPath href="#fr-b" startOffset="50%" text-anchor="middle">${esc(side(5, 8))}</textPath></text>
      <text class="fr__text fr__text--dev" lang="hi"><textPath href="#fr-l" startOffset="50%" text-anchor="middle">साँप सीढ़ी  ·  मोक्ष पटम</textPath></text>
    </svg>
    <span class="fr__corner fr__corner--tl"></span><span class="fr__corner fr__corner--tr"></span><span class="fr__corner fr__corner--bl"></span><span class="fr__corner fr__corner--br"></span>
    <div class="fr__diyas">${diyas}</div>
  </div>`;
}

export function boardHTML() {
  return `<div class="board" data-board>
    ${frameHTML()}
    <div class="board__field">
      <div class="board__grid">${squaresHTML()}</div>
      ${artHTML()}
      <div class="board__chips">${chipsHTML()}</div>
      <div class="token" aria-hidden="true"><div class="token__hop"><div class="token__disc"><img src="${media("aevinite-mark.webp")}" alt="" width="190" height="122"></div></div><span class="token__shadow"></span></div>
    </div>
  </div>`;
}

export function trayHTML() {
  return `<div class="tray" data-tray>
    <button class="tray__die" type="button" data-roll aria-describedby="tray-hint">${dieHTML()}<span class="sr">Roll the die</span></button>
    <div class="tray__side">
      <div class="tray__btns">
        <button class="btn btn--roll" type="button" data-roll><span>Roll the die</span><kbd aria-hidden="true">R</kbd></button>
        <button class="btn btn--ghost btn--auto" type="button" data-auto aria-pressed="false">Let it play itself</button>
      </div>
      <p class="tray__status" id="tray-hint" aria-live="polite" data-status>Square 1. Ladders are what we build, snakes are problems we tame. Landing on a snake never drops you.</p>
      <p class="tray__score" data-score><span>Square <b data-k="pos">1</b></span><span>Rolls <b data-k="rolls">0</b></span><span>Ladders <b data-k="lad">0</b>/${LADDERS.length}</span><span>Tamed <b data-k="snk">0</b>/${SNAKES.length}</span></p>
    </div>
  </div>`;
}

export function cardHTML() {
  return `<aside class="gcard" role="dialog" aria-modal="false" aria-labelledby="gcard-t" hidden data-gcard>
    <div class="gcard__in">
      <button class="gcard__x" type="button" data-close aria-label="Close the card">${icon.close}</button>
      <p class="gcard__kind" data-f="kind"></p>
      <h2 class="gcard__label" id="gcard-t" data-f="label"></h2>
      <p class="gcard__from" data-f="from"></p>
      <h3 class="gcard__title" data-f="title"></h3>
      <p class="gcard__text" data-f="text"></p>
      <ul class="gcard__items" data-f="items"></ul>
      <div class="gcard__act">
        <a class="gcard__more" data-f="more" href="#">${icon.arrow}</a>
        <button class="btn btn--roll btn--sm" type="button" data-roll data-card-roll>Roll again</button>
      </div>
    </div>
  </aside>`;
}

export function winHTML() {
  return `<div class="win" role="dialog" aria-modal="true" aria-labelledby="win-t" hidden data-win>
    <div class="win__card">
      <div class="win__lotus">${lotus()}</div>
      <p class="win__kicker">Square 100</p>
      <h2 class="win__t" id="win-t">You grew!</h2>
      <p class="win__sum" data-win-sum></p>
      <p class="win__lead">That is the game we play with real businesses. Tell us where yours is stuck and we will find the ladders.</p>
      <div class="win__contact">
        <a class="btn btn--wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>WhatsApp us</span></a>
        <a class="win__link" href="mailto:${COMPANY.email}">${icon.mail}<span>${COMPANY.email}</span></a>
        <a class="win__link" href="${COMPANY.phoneHref}">${icon.phone}<span>${COMPANY.phoneDisplay}</span></a>
      </div>
      <div class="win__act">
        <button class="btn btn--ghost" type="button" data-again>Play again</button>
        <button class="btn btn--ghost" type="button" data-everything>Show me everything</button>
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ the game */

export function initBoard(root: HTMLElement, opts: { onEverything: () => void }) {
  const board = $("[data-board]", root), field = $(".board__field", board), token = $(".token", board), tokHop = $(".token__hop", token);
  const svg = $<SVGSVGElement>(".board__art", board), tamedG = $(".art__tamed", svg);
  const status = $("[data-status]", root), card = $("[data-gcard]", root), winEl = $("[data-win]");
  const die = new Die($(".die", root));
  const auto = $<HTMLButtonElement>("[data-auto]", root);
  const squares = new Map<number, HTMLElement>($$("[data-n]", board).map((e) => [Number(e.dataset.n), e]));
  const byId = new Map(ALL.map((i) => [i.id, i]));

  let pos = 1, rolls = 0, busy = false, won = false, sixes = 0, autoOn = false, cardFor: string | null = null;
  const climbed = new Set<string>(), tamed = new Set<string>();

  const place = (n: number) => { const c = cell(n); return { xPercent: c.col * 100, yPercent: c.row * 100 }; };
  gsap.set(token, place(1));

  const score = () => {
    const set = (k: string, v: number) => { const b = $(`[data-k="${k}"]`, root); if (b.textContent !== String(v)) { b.textContent = String(v); if (!reduced()) gsap.fromTo(b, { yPercent: -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "back.out(2)" }); } };
    set("pos", pos); set("rolls", rolls); set("lad", climbed.size); set("snk", tamed.size);
  };
  const say = (t: string) => { status.textContent = t; };

  /* ---- movement ---- */
  const light = (n: number) => {
    const s = squares.get(n);
    if (!s) return;
    s.classList.remove("lit"); void s.offsetWidth; s.classList.add("lit");
  };

  async function hopTo(target: number) {
    const fast = reduced();
    for (let n = pos + 1; n <= target; n++) {
      hop(n - pos);
      light(n);
      if (fast) { gsap.set(token, place(n)); await wait(60); continue; }
      const p = place(n);
      await new Promise<void>((res) => {
        const tl = gsap.timeline({ onComplete: res });
        tl.to(token, { ...p, duration: 0.2, ease: "power1.inOut" }, 0)
          .to(tokHop, { y: -18, scaleY: 1.05, duration: 0.1, ease: "power2.out" }, 0)
          .to(tokHop, { y: 0, scaleY: 1, duration: 0.1, ease: "power2.in" }, 0.1)
          .to(tokHop, { scaleY: 0.86, scaleX: 1.1, duration: 0.05, yoyo: true, repeat: 1 }, 0.2);
      });
    }
    pos = target;
  }

  async function slide(to: number, kind: "ladder" | "tamed") {
    const from = cell(pos), dest = cell(to);
    const dist = Math.hypot(from.col - dest.col, from.row - dest.row);
    climb(Math.min(9, Math.round(dist * 2)));
    if (reduced()) { gsap.set(token, place(to)); pos = to; light(to); return; }
    await gsap.timeline()
      .to(tokHop, { scale: 1.25, duration: 0.18, ease: "power2.out" })
      .to(token, { ...place(to), duration: 0.45 + dist * 0.1, ease: kind === "ladder" ? "power2.inOut" : "power3.inOut" }, "<0.05")
      .to(tokHop, { scale: 1, duration: 0.35, ease: "back.out(3)" });
    pos = to;
    light(to);
  }

  async function tame(s: Snake) {
    const g = $(`.snk[data-id="${s.id}"]`, svg);
    const headG = $(".snk__headg", g), mask = $(".snk__mask", g);
    charm();
    g.classList.add("is-charmed");
    if (!reduced()) {
      await gsap.timeline()
        .to(headG, { rotation: 10, duration: 0.14, yoyo: true, repeat: 5, ease: "sine.inOut" })
        .to(mask, { drawSVG: "0% 0%", duration: 0.8, ease: "power2.in" }, 0.25)
        .to(headG, { scale: 0.62, duration: 0.4, ease: "back.in(2)" }, 0.85);
    } else gsap.set(mask, { drawSVG: "0% 0%" });
    g.classList.add("is-tamed");
    // The snake becomes a ladder from its head upward.
    const a = ladder(sq(s.head), sq(s.tamedTo), 22, 16, 34);
    const lg = document.createElementNS("http://www.w3.org/2000/svg", "g");
    lg.setAttribute("class", "lad lad--tamed");
    lg.dataset.id = s.id;
    lg.innerHTML = `<path class="lad__shade" d="${a.railA}${a.railB}"/><g class="lad__rungs">${a.rungs.map((d) => `<path class="lad__rung" d="${d}"/>`).join("")}</g><path class="lad__rail" d="${a.railA}"/><path class="lad__rail" d="${a.railB}"/>`;
    tamedG.append(lg);
    bell(1.2);
    if (!reduced()) {
      await gsap.timeline()
        .fromTo($$(".lad__rail, .lad__shade", lg), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.55, ease: "power2.out" })
        .fromTo($$(".lad__rung", lg), { opacity: 0, scale: 0.2, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.035, ease: "back.out(3)" }, "-=0.35");
    }
    tamed.add(s.id);
    const chip = $(`[data-chip="${s.id}"]`, board);
    chip.classList.add("is-tamed");
  }

  /* ---- the card ---- */
  function fillCard(it: Item, played: boolean) {
    const f = (k: string) => $(`[data-f="${k}"]`, card);
    let kind: string;
    if (it.kind === "ladder") kind = `${glyph.ladder}<span>Ladder · square ${it.from_sq} to ${it.to_sq}</span>`;
    else kind = `${glyph.snake}<span>${played || tamed.has(it.id) ? `Snake tamed · ${it.head} became a ladder to ${it.tamedTo}` : `Snake on square ${it.head} · we tame it`}</span>`;
    f("kind").innerHTML = kind;
    f("label").innerHTML = `<span class="gcard__lt">${esc(it.label)}</span>`;
    f("label").classList.toggle("is-struck", it.kind === "snake");
    f("from").textContent = it.from;
    f("title").textContent = it.title;
    f("text").textContent = it.text;
    const items = f("items");
    items.innerHTML = (it.items ?? []).map((x) => `<li>${esc(x)}</li>`).join("");
    items.hidden = !it.items?.length;
    const more = f("more") as HTMLAnchorElement;
    more.href = it.href;
    more.innerHTML = `<span>${esc(it.hrefLabel)}</span>${icon.arrow}`;
    card.dataset.kind = it.kind;
    card.dataset.tone = it.tone;
    $("[data-card-roll]", card).hidden = won;
  }

  function openCard(it: Item, played: boolean, from?: Element) {
    fillCard(it, played);
    const wasOpen = !card.hidden;
    card.hidden = false;
    root.classList.add("has-card");
    cardFor = it.id;
    hot(it.id);
    if (reduced()) return;
    if (isSheet()) {
      gsap.fromTo(card, { yPercent: wasOpen ? 0 : 100 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
    } else {
      const o = (from ?? token).getBoundingClientRect(), r = card.getBoundingClientRect();
      gsap.fromTo(card, { x: o.left + o.width / 2 - (r.left + r.width / 2), y: o.top + o.height / 2 - (r.top + r.height / 2), scale: 0.15, opacity: 0, rotation: -6 },
        { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: "expo.out" });
    }
    const label = $(".gcard__label", card);
    if (it.kind === "snake") gsap.fromTo(label, { "--strike": 0 }, { "--strike": 1, duration: 0.6, delay: 0.35, ease: "power2.inOut" });
    gsap.fromTo($$(".gcard__from, .gcard__title, .gcard__text, .gcard__items li, .gcard__act", card), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, delay: 0.15, ease: "power2.out" });
  }

  function closeCard(focusDie = false) {
    if (card.hidden) return;
    cardFor = null;
    hot(null);
    root.classList.remove("has-card");
    if (reduced()) card.hidden = true;
    else gsap.to(card, { opacity: 0, y: isSheet() ? 0 : 10, yPercent: isSheet() ? 100 : 0, duration: 0.25, ease: "power2.in", onComplete: () => { card.hidden = true; gsap.set(card, { clearProps: "all" }); } });
    if (focusDie) $<HTMLButtonElement>(".tray__die", root).focus();
  }

  /* ---- hovering a ladder or snake lights it ---- */
  function hot(id: string | null) {
    board.classList.toggle("has-hot", !!id);
    $$(".lad, .snk", svg).forEach((g) => g.classList.toggle("is-hot", g.dataset.id === id));
    $$(".chip", board).forEach((c) => c.classList.toggle("is-hot", c.dataset.chip === id));
  }

  /* ---- a turn ---- */
  async function turn() {
    if (busy) return;
    if (won) reset();
    busy = true;
    root.classList.add("is-busy");
    closeCard();
    const n = rollD6();
    rolls++;
    await die.roll(n);
    sixes = n === 6 ? sixes + 1 : 0;
    const target = Math.min(100, pos + n);
    say(`You rolled ${n}.${pos + n > 100 ? " More than you needed: growth rounds up, straight to 100." : ""}`);
    const start = pos;
    await hopTo(target);
    let msg = `Rolled ${n}: square ${start} to ${target}.`;
    const lad = LADDERS.find((l) => l.from_sq === pos);
    const snk = SNAKES.find((s) => s.head === pos);
    let opened: Item | null = null;
    if (lad) {
      await wait(120);
      await slide(lad.to_sq, "ladder");
      climbed.add(lad.id);
      $(`[data-chip="${lad.id}"]`, board).classList.add("is-done");
      msg = `Rolled ${n}. Ladder! "${lad.label}" lifts you from ${lad.from_sq} to ${lad.to_sq}.`;
      opened = lad;
    } else if (snk) {
      await wait(120);
      if (!tamed.has(snk.id)) await tame(snk);
      await slide(snk.tamedTo, "tamed");
      msg = `Rolled ${n}. A snake: "${snk.label}". Tamed. It became a ladder from ${snk.head} to ${snk.tamedTo}.`;
      opened = snk;
    }
    if (sixes === 3) { msg += " Three sixes in a row. In the old rules that cost you the turn; here it only rings a bell."; bell(1.6); sixes = 0; }
    say(msg);
    score();
    if (opened) openCard(opened, true);
    root.classList.remove("is-busy");
    busy = false;
    if (pos >= 100) { await wait(opened ? 900 : 200); finish(); return; }
    if (autoOn) scheduleAuto(opened ? 1700 : 650);
  }

  /* ---- auto-play ---- */
  let autoT = 0;
  const scheduleAuto = (ms: number) => { clearTimeout(autoT); autoT = window.setTimeout(() => { if (autoOn && !document.hidden) void turn(); }, ms); };
  const setAuto = (on: boolean) => {
    autoOn = on;
    auto.setAttribute("aria-pressed", String(on));
    auto.textContent = on ? "Stop auto-play" : "Let it play itself";
    if (on) scheduleAuto(150); else clearTimeout(autoT);
  };
  auto.addEventListener("click", () => { tap(); setAuto(!autoOn); });
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && autoOn) setAuto(false); }).observe(board);

  /* ---- win and reset ---- */
  function finish() {
    won = true;
    setAuto(false);
    closeCard();
    const sum = $("[data-win-sum]");
    sum.textContent = `100 squares in ${rolls} roll${rolls === 1 ? "" : "s"}. ${climbed.size} ladder${climbed.size === 1 ? "" : "s"} climbed, ${tamed.size} snake${tamed.size === 1 ? "" : "s"} tamed.`;
    winEl.hidden = false;
    document.documentElement.classList.add("has-win");
    const t = getTheme() === "dark";
    winSound(t);
    const r = squares.get(100)!.getBoundingClientRect();
    celebrate(t, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, winEl);
    if (!reduced()) gsap.fromTo($(".win__card", winEl), { scale: 0.6, opacity: 0, rotation: -4 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1,0.6)" });
    $<HTMLButtonElement>("[data-again]", winEl).focus();
    say(`You reached 100 in ${rolls} rolls. You grew!`);
  }
  function closeWin() {
    winEl.hidden = true;
    document.documentElement.classList.remove("has-win");
  }
  function reset() {
    closeWin();
    won = false; pos = 1; rolls = 0; sixes = 0;
    climbed.clear(); tamed.clear();
    tamedG.innerHTML = "";
    $$(".snk", svg).forEach((g) => { g.classList.remove("is-tamed", "is-charmed"); gsap.set($(".snk__mask", g), { drawSVG: "100%" }); gsap.set($(".snk__headg", g), { scale: 1, rotation: 0 }); });
    $$(".chip", board).forEach((c) => c.classList.remove("is-tamed", "is-done"));
    gsap.to(token, { ...place(1), duration: reduced() ? 0 : 0.8, ease: "power3.inOut" });
    say("New game. You are on square 1. Roll the die.");
    score();
  }
  $("[data-again]", winEl).addEventListener("click", () => { tap(); reset(); $<HTMLButtonElement>(".tray__die", root).focus(); });
  $("[data-everything]", winEl).addEventListener("click", () => { closeWin(); opts.onEverything(); });
  winEl.addEventListener("click", (e) => { if (e.target === winEl) closeWin(); });

  /* ---- input ---- */
  $$("[data-roll]", root).forEach((b) => b.addEventListener("click", () => { if (autoOn) setAuto(false); void turn(); }));
  $("[data-close]", card).addEventListener("click", () => closeCard(true));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!winEl.hidden) closeWin(); else closeCard(true); return; }
    if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || !winEl.hidden) return;
      const r = board.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      e.preventDefault();
      void turn();
    }
  });
  $$<HTMLButtonElement>(".chip", board).forEach((c) => {
    const it = byId.get(c.dataset.chip!)!;
    c.addEventListener("click", () => { tap(); if (cardFor === it.id) closeCard(); else openCard(it, false, c); });
    c.addEventListener("pointerenter", () => { if (!cardFor) hot(it.id); });
    c.addEventListener("pointerleave", () => { if (!cardFor) hot(null); });
    c.addEventListener("focus", () => { if (!cardFor) hot(it.id); });
    c.addEventListener("blur", () => { if (!cardFor) hot(null); });
  });

  /* ---- entrance: squares settle, ladders draw, snakes slither in, the token drops onto 1 ---- */
  if (!reduced()) {
    const sqs = $$(".sq", board);
    const tl = gsap.timeline({ delay: 0.15 });
    tl.from(sqs, { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(2)", stagger: { each: 0.006, grid: [10, 10], from: "end" } })
      .fromTo($$(".lad .lad__rail, .lad .lad__shade", svg), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, ease: "power2.out", stagger: 0.02 }, 0.55)
      .from($$(".lad .lad__rung", svg), { opacity: 0, duration: 0.3, stagger: 0.004 }, 0.8)
      .fromTo($$(".snk__mask", svg), { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1.1, ease: "power2.inOut", stagger: 0.07 }, 0.75)
      .from($$(".snk__headg", svg), { scale: 0, duration: 0.5, ease: "back.out(3)", stagger: 0.07 }, 0.75)
      .fromTo($$(".chip__in", board), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)", stagger: 0.03, clearProps: "transform,opacity" }, 1.3)
      .from(token, { y: -120, opacity: 0, duration: 0.7, ease: "bounce.out" }, 1.5);
  }

  // Night world: the board's light flickers on when the diya is lit.
  onTheme((t) => {
    if (t !== "dark" || reduced()) return;
    gsap.fromTo($$(".sq", board), { opacity: 0.25 }, { opacity: 1, duration: 0.6, stagger: { each: 0.005, from: "random" } });
  });

  score();
  return { roll: turn, reset, get pos() { return pos; }, get won() { return won; } };
}
