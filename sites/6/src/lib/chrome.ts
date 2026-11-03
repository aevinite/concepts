// The frame every page of The Pass shares: header, the menu card (nav that prints a KOT),
// the heat-lamp pull cord (theme switch), the sound switch, footer, rubber stamps, heat lamps,
// steam, and the visitor's running order.
import Lenis from "lenis";
import { COMPANY, FILM_CREDIT, media } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme, type Theme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { gsap, ScrollTrigger, $, $$, esc, reduced, pad, once } from "./util";
import { sound, click, printLine, stampThud, lampHum } from "./sound";

export type MenuItem = { course: string; label: string; href: string; note?: string };

let lenis: Lenis | null = null;
let kotNo = 0;

/* ---------- the visitor's order (Chef's specials -> the bill) ---------- */
const orderItems: string[] = [];
const orderSubs = new Set<(items: string[]) => void>();
export const order = {
  get items() { return orderItems.slice(); },
  has: (t: string) => orderItems.includes(t),
  toggle(t: string) {
    const i = orderItems.indexOf(t);
    if (i >= 0) orderItems.splice(i, 1); else orderItems.push(t);
    orderSubs.forEach((s) => s(orderItems.slice()));
    return i < 0;
  },
  sub(cb: (items: string[]) => void) { orderSubs.add(cb); cb(orderItems.slice()); },
};

/* ---------- section heading ---------- */
export function head(o: { course: string; title: string; lede?: string; stamp?: string; align?: "center"; chalk?: boolean }) {
  return `<header class="shead${o.align === "center" ? " shead--c" : ""}${o.chalk ? " shead--chalk" : ""}">
    <p class="shead__course"><span>${esc(o.course)}</span></p>
    <h2 class="shead__title">${o.title}</h2>
    ${o.lede ? `<p class="shead__lede">${esc(o.lede)}</p>` : ""}
    ${o.stamp ? `<span class="stamp" data-stamp aria-hidden="true">${esc(o.stamp)}</span>` : ""}
  </header>`;
}

/** Morning sun through the café window (light world only). */
export const sun = (v = 1) => `<span class="sun sun--${v}" aria-hidden="true"></span>`;

/** A strip of till roll running between sections. */
export function tape(words: readonly string[]) {
  const run = words.map((w) => `<span>${esc(w.toUpperCase())}</span><i>*</i>`).join("");
  return `<div class="tape" aria-hidden="true"><div class="tape__run">${run}${run}${run}${run}</div></div>`;
}

/** A perforated line, like the bottom of a ticket pad. */
export const perf = (label = "Tear here") => `<div class="perf" aria-hidden="true"><span>${esc(label)}</span></div>`;

export const lamps = (n: number, cls = "") =>
  `<div class="lamps ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, i) =>
    `<span class="lamp" style="--x:${((i + 0.5) / n) * 100}%;--d:${(i * 0.37).toFixed(2)}s"><i class="lamp__wire"></i><i class="lamp__shade"></i><i class="lamp__cone"></i></span>`).join("")}</div>`;

/* ---------- header, cord, menu card ---------- */
function headerHTML(home: string, menu: MenuItem[]) {
  return `
  <a class="skip" href="#main">Skip to the content</a>
  <header class="top" id="top-bar">
    <a class="top__brand" href="${home}" aria-label="Aevinite, home">
      <img src="${media("aevinite-mark.webp")}" alt="" width="40" height="25">
      <span class="top__name">Aevinite</span><span class="top__sub">The Pass</span>
    </a>
    <div class="top__tools">
      <button class="top__menu" type="button" aria-expanded="false" aria-controls="menucard">
        <span class="top__menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span>
      </button>
      <a class="top__order" href="${menu.find((m) => m.href.includes("bill"))?.href ?? "#bill"}" hidden aria-label="Your order"><span>Order</span><b class="top__order-n">0</b></a>
      <button class="top__sound" type="button" aria-pressed="false" aria-label="Sound is off. Turn sound on">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9h4l5-4v14l-5-4H4z"/><path class="wave w1" d="M16 9.5a3.5 3.5 0 0 1 0 5"/><path class="wave w2" d="M18.5 7a7 7 0 0 1 0 10"/><path class="mute" d="M16 9l5 6M21 9l-5 6"/></svg>
        <span class="top__sound-label">Sound</span>
      </button>
    </div>
    <span class="top__slot" aria-hidden="true"></span>
  </header>
  <button class="cord" type="button" aria-label="Pull the cord: switch on the heat lamps (the kitchen at 9 pm)">
    <span class="cord__string" aria-hidden="true"></span>
    <span class="cord__knob" aria-hidden="true"><span class="cord__tag">9pm</span></span>
  </button>
  <div class="menucard" id="menucard" role="dialog" aria-modal="false" aria-label="Menu" hidden>
    <div class="menucard__card">
      <p class="menucard__kicker">Aevinite &middot; The Pass</p>
      <p class="menucard__title">Menu</p>
      <ol class="menucard__list">
        ${menu.map((m, i) => `<li><a href="${m.href}" data-course="${esc(m.course)}" data-label="${esc(m.label)}"><span class="mc__n">${pad(i + 1)}</span><span class="mc__course">${esc(m.course)}</span><span class="mc__dots" aria-hidden="true"></span><span class="mc__label">${esc(m.label)}</span></a></li>`).join("")}
      </ol>
      <p class="menucard__foot">Choose a course and the kitchen prints it.</p>
      <button class="menucard__close" type="button" aria-label="Close the menu">Close</button>
    </div>
  </div>
  <div class="kot" aria-hidden="true"><div class="kot__paper"></div></div>
  <div class="lights" aria-hidden="true"></div>
  <p class="sr-only" aria-live="polite" id="announce"></p>`;
}

export function announce(msg: string) {
  const a = document.getElementById("announce");
  if (a) { a.textContent = ""; requestAnimationFrame(() => (a.textContent = msg)); }
}

/** A KOT ticket prints under the header (used by the menu card and other order buttons). */
export function printKOT(lines: string[]) {
  const kot = $(".kot"), paper = $(".kot__paper");
  kotNo++;
  paper.innerHTML = [`<p class="kot__h"><span>KOT ${pad(kotNo, 4)}</span><span>${new Date().toTimeString().slice(0, 5)}</span></p>`, ...lines.map((l) => `<p>${esc(l)}</p>`), `<p class="kot__cut" aria-hidden="true"></p>`].join("");
  gsap.killTweensOf([kot, paper]);
  const rows = $$("p", paper);
  if (reduced()) {
    gsap.set(kot, { autoAlpha: 1, y: 0, rotation: 0 });
    gsap.set(rows, { autoAlpha: 1 });
    gsap.to(kot, { autoAlpha: 0, delay: 1.6, duration: 0.3 });
    return;
  }
  const tl = gsap.timeline();
  tl.set(kot, { autoAlpha: 1, y: 0, x: 0, rotation: 0 })
    .set(paper, { yPercent: -100 })
    .set(rows, { autoAlpha: 1 });
  const n = rows.length;
  for (let i = 1; i <= n; i++) {
    tl.to(paper, { yPercent: -100 + (100 * i) / n, duration: 0.06, ease: "steps(2)", onStart: () => printLine(true) }).to(paper, { y: 1.5, duration: 0.03, yoyo: true, repeat: 1 }, "<");
  }
  tl.to(kot, { rotation: -4, duration: 0.25, ease: "power2.out" }, "+=0.9")
    .to(kot, { y: -140, x: 60, rotation: 14, autoAlpha: 0, duration: 0.5, ease: "power2.in" });
}

function smoothTo(target: string | Element) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -64, duration: 1.3 });
  else (el as HTMLElement).scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
}

function initMenu() {
  const btn = $<HTMLButtonElement>(".top__menu"), card = $("#menucard"), inner = $(".menucard__card", card);
  let open = false;
  const show = (v: boolean, focusBack = true) => {
    if (v === open) return;
    open = v;
    btn.setAttribute("aria-expanded", String(v));
    click(v);
    if (v) {
      card.hidden = false;
      gsap.fromTo(inner, { rotationX: -70, y: -20, autoAlpha: 0, transformOrigin: "50% 0%" }, { rotationX: 0, y: 0, autoAlpha: 1, duration: reduced() ? 0 : 0.55, ease: "back.out(1.4)" });
      gsap.fromTo($$("li", inner), { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, stagger: 0.04, duration: reduced() ? 0 : 0.3, delay: 0.1 });
      $<HTMLAnchorElement>("a", inner).focus();
    } else {
      gsap.to(inner, { rotationX: -60, autoAlpha: 0, duration: reduced() ? 0 : 0.28, ease: "power2.in", onComplete: () => { card.hidden = true; } });
      if (focusBack) btn.focus();
    }
  };
  btn.addEventListener("click", () => show(!open));
  $$("[data-open-menu]").forEach((b) => b.addEventListener("click", () => show(true)));
  $(".menucard__close", card).addEventListener("click", () => show(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) show(false); });
  document.addEventListener("pointerdown", (e) => {
    if (open && !inner.contains(e.target as Node) && !btn.contains(e.target as Node)) show(false, false);
  });
  $$<HTMLAnchorElement>("a", card).forEach((a) => a.addEventListener("click", (e) => {
    const href = a.getAttribute("href")!;
    show(false, false);
    printKOT([`1 × ${a.dataset.course!.toUpperCase()}`, `   ${a.dataset.label}`, href.startsWith("#") ? "TO: THIS TABLE" : "TO: NEXT ROOM"]);
    if (href.startsWith("#")) {
      e.preventDefault();
      setTimeout(() => smoothTo(href), reduced() ? 0 : 380);
      history.replaceState(null, "", href);
    } else {
      e.preventDefault();
      setTimeout(() => (location.href = href), reduced() ? 0 : 650);
    }
  }));
  // In-page links elsewhere scroll smoothly too.
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    if (a.closest("#menucard") || a.classList.contains("skip")) return;
    a.addEventListener("click", (e) => {
      const h = a.getAttribute("href")!;
      if (h.length > 1 && document.querySelector(h)) { e.preventDefault(); smoothTo(h); }
    });
  });
}

function initSound() {
  const b = $<HTMLButtonElement>(".top__sound");
  b.addEventListener("click", () => {
    sound.set(!sound.on);
    click(true);
  });
  sound.sub((on) => {
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on");
    b.classList.toggle("is-on", on);
    gsap.fromTo(b, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  });
}

/* ---------- the heat-lamp pull cord ---------- */
function lightsTransition(next: Theme) {
  return (commit: () => void) => {
    const veil = $(".lights");
    if (reduced()) { commit(); return; }
    if (next === "dark") {
      lampHum();
      gsap.timeline()
        .set(veil, { background: "#0a0706", autoAlpha: 0 })
        .to(veil, { autoAlpha: 1, duration: 0.22, ease: "power2.in" })
        .add(commit)
        .to(veil, { autoAlpha: 0.35, duration: 0.06 }, "+=0.12")
        .to(veil, { autoAlpha: 0.9, duration: 0.05 })
        .to(veil, { autoAlpha: 0.15, duration: 0.07 })
        .to(veil, { autoAlpha: 0.6, duration: 0.05 })
        .to(veil, { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
    } else {
      gsap.timeline()
        .set(veil, { background: "#f4eee3", autoAlpha: 0 })
        .to(veil, { autoAlpha: 1, duration: 0.25, ease: "power2.in" })
        .add(commit)
        .to(veil, { autoAlpha: 0, duration: 0.65, ease: "power2.out" }, "+=0.05");
    }
  };
}

function initCord() {
  const cord = $<HTMLButtonElement>(".cord"), str = $(".cord__string", cord), knob = $(".cord__knob", cord);
  let y0 = 0, dy = 0, down = false;
  const label = (t: Theme) => {
    cord.setAttribute("aria-label", t === "dark"
      ? "Pull the cord: switch the heat lamps off (back to the café counter at 10 am)"
      : "Pull the cord: switch on the heat lamps (the kitchen at 9 pm)");
    $(".cord__tag", cord).textContent = t === "dark" ? "10am" : "9pm";
  };
  const draw = (d: number) => { gsap.set(str, { scaleY: 1 + d / 56 }); gsap.set(knob, { y: d }); };
  cord.addEventListener("pointerdown", (e) => { down = true; y0 = e.clientY; dy = 0; cord.setPointerCapture(e.pointerId); gsap.killTweensOf([str, knob]); });
  cord.addEventListener("pointermove", (e) => { if (!down) return; dy = Math.max(0, Math.min(60, (e.clientY - y0) * 0.8)); draw(dy); });
  const release = () => {
    down = false;
    gsap.to(str, { scaleY: 1, duration: 0.9, ease: "elastic.out(1,0.3)" });
    gsap.to(knob, { y: 0, duration: 0.9, ease: "elastic.out(1,0.3)" });
  };
  cord.addEventListener("pointerup", release);
  cord.addEventListener("pointercancel", release);
  cord.addEventListener("click", () => {
    if (dy < 8 && !reduced()) {
      // a tap (or keyboard): play the pull for them
      gsap.timeline().to(str, { scaleY: 1.7, duration: 0.14, ease: "power2.out" }, 0).to(knob, { y: 40, duration: 0.14, ease: "power2.out" }, 0)
        .to(str, { scaleY: 1, duration: 0.9, ease: "elastic.out(1,0.3)" }).to(knob, { y: 0, duration: 0.9, ease: "elastic.out(1,0.3)" }, "<");
    }
    dy = 0;
    click();
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    setTheme(next, { from: cord, transition: lightsTransition(next) });
  });
  label(getTheme());
  onTheme(label);
}

/* ---------- footer ---------- */
export function footerHTML(menu: MenuItem[], withFilm = true) {
  const socials = [["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]];
  return `<footer class="foot">
    <div class="foot__paper">
      <p class="foot__thanks">Thank you. Come again.</p>
      <p class="foot__addr">AEVINITE &middot; ${COMPANY.city.toUpperCase()}, ${COMPANY.region.toUpperCase()}, ${COMPANY.country.toUpperCase()}</p>
      <div class="foot__cols">
        <nav aria-label="Footer"><p class="foot__h">On the menu</p><ul>${menu.map((m) => `<li><a href="${m.href}">${esc(m.course)} <span>${esc(m.label)}</span></a></li>`).join("")}</ul></nav>
        <div><p class="foot__h">Find us</p><ul>${socials.map(([n, h]) => `<li><a href="${h}" target="_blank" rel="noopener">${n}</a></li>`).join("")}</ul></div>
        <div><p class="foot__h">Talk to the kitchen</p><ul>
          <li><a href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
          <li><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></li>
        </ul></div>
      </div>
      ${withFilm ? `<p class="foot__credit">Films: ${esc(FILM_CREDIT)}</p>` : ""}
      <p class="foot__copy">&copy; 2026 Aevinite, Ahmedabad</p>
      <div class="foot__bar" aria-hidden="true"></div>
    </div>
  </footer>`;
}

/* ---------- stamps, reveals ---------- */
function initStamps() {
  $$("[data-stamp]").forEach((s) => once(s, () => {
    s.classList.add("is-in");
    if (reduced()) return;
    const r = Number(s.dataset.rot ?? (-8 + Math.random() * 6));
    gsap.fromTo(s, { scale: 2.6, rotation: r - 10, autoAlpha: 0 }, { scale: 1, rotation: r, autoAlpha: 1, duration: 0.32, ease: "power4.in", onComplete: () => {
      stampThud();
      gsap.fromTo(s.closest("section") ?? s, { y: 0 }, { y: 2, duration: 0.05, yoyo: true, repeat: 1 });
    } });
  }, "0px 0px -30% 0px"));
  if (reduced()) return;
  $$(".rv").forEach((el) => {
    gsap.set(el, { autoAlpha: 0, y: 26 });
    once(el, () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", delay: Number(el.dataset.d ?? 0) }), "0px 0px -8% 0px");
  });
}

/* ---------- steam (dark world only) ---------- */
export function steam(host: HTMLElement, emitters: number[], opts: { rate?: number; size?: number; minWidth?: number } = {}) {
  const cv = document.createElement("canvas");
  cv.className = "steam";
  cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  const g = cv.getContext("2d")!;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const sg = sprite.getContext("2d")!, grd = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,236,214,.55)"); grd.addColorStop(0.5, "rgba(255,226,196,.18)"); grd.addColorStop(1, "rgba(255,220,190,0)");
  sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);
  type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; age: number; ph: number };
  let ps: P[] = [], raf = 0, running = false, w = 0, h = 0, last = 0;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  new ResizeObserver(size).observe(cv);
  const rate = opts.rate ?? 0.6, base = opts.size ?? 26;
  const tick = (t: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (ps.length < 90) emitters.forEach((ex) => { if (Math.random() < rate * dt * 10) ps.push({ x: ex * w + (Math.random() - 0.5) * 30, y: h + 10, vx: (Math.random() - 0.5) * 8, vy: -(26 + Math.random() * 30), r: base * (0.6 + Math.random() * 0.6), a: 0, life: 4 + Math.random() * 3, age: 0, ph: Math.random() * 6 }); });
    g.clearRect(0, 0, w, h);
    ps = ps.filter((p) => {
      p.age += dt;
      const k = p.age / p.life;
      p.x += (p.vx + Math.sin(p.age * 1.3 + p.ph) * 10) * dt;
      p.y += p.vy * dt;
      p.r += 9 * dt;
      p.a = Math.sin(Math.PI * k) * 0.5;
      g.globalAlpha = p.a;
      g.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      return k < 1;
    });
  };
  const start = () => { if (running || getTheme() !== "dark" || reduced() || innerWidth < (opts.minWidth ?? 0)) return; running = true; size(); last = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  let visible = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
  io.observe(host);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : visible && start()));
  onTheme((t) => { if (t === "dark" && visible) start(); else { stop(); ps = []; g.clearRect(0, 0, w, h); } });
}

/* ---------- boot ---------- */
export function initChrome(o: { home: string; menu: MenuItem[]; withFilm?: boolean }) {
  initTheme(6);
  const shell = document.createElement("div");
  shell.innerHTML = headerHTML(o.home, o.menu);
  document.body.prepend(...Array.from(shell.childNodes));
  document.body.insertAdjacentHTML("beforeend", footerHTML(o.menu, o.withFilm ?? true));
  conceptBadge(6, "The Pass");
  initMenu();
  initSound();
  initCord();
  initStamps();
  order.sub((items) => {
    const chip = $<HTMLAnchorElement>(".top__order");
    if (!chip) return;
    const was = chip.hidden;
    chip.hidden = items.length === 0;
    $(".top__order-n", chip).textContent = String(items.length);
    if (!chip.hidden) gsap.fromTo(chip, { scale: was ? 0.4 : 1.25 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)" });
  });
  // Lenis smooth wheel scrolling on desktop only; touch stays native.
  if (!reduced() && matchMedia("(pointer: fine)").matches) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // Header gets a paper edge once the page scrolls.
  const top = $(".top");
  const onScroll = () => top.classList.toggle("is-scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export { smoothTo };
