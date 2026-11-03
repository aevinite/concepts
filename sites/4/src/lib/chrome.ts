// Everything every page wears: header + nav, the theme toggle (the new world arrives through a
// growing letter A), the sound toggle, the stage (spotlight, liquid wobble, grain) for the
// dark world, the Swiss grid for the light one, section reveals, the footer, the easter egg.
import { COMPANY, NAV, FILM_CREDIT } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme, type Theme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { gsap, ScrollTrigger, SplitText, onFrame, pointer, scroll, reduced, coarse, startCore, scrollToEl } from "./core";
import { esc, $, $$, clamp, ICON } from "./dom";
import { fit } from "./fit";
import { setSound, onSound, blip, thock, chime } from "./sound";

export type Page = "home" | "aevidine" | "campus";
const kicks: (() => void)[] = [];
export const registerKick = (fn: () => void) => kicks.push(fn);

export function prefix(page: Page) { return page === "home" ? "" : "../"; }


export function header(page: Page) {
  const p = prefix(page);
  const home = page === "home" ? "./" : "../";
  const href = (h: string) => (h.startsWith("#") ? (page === "home" ? h : `../${h}`) : `${p}${h}`);
  const links = NAV.map((n, i) => {
    const cur = (page === "aevidine" && n.href === "aevidine/") || (page === "campus" && n.href === "campus/");
    return `<a href="${href(n.href)}"${cur ? ' aria-current="page"' : ""}><span class="hd-n">${String(i + 1).padStart(2, "0")}</span>${esc(n.label)}</a>`;
  }).join("");
  const big = [{ label: "Home", href: home }, ...NAV.map((n) => ({ label: n.label, href: href(n.href) }))]
    .map((n, i) => `<li><a class="mn-a" href="${n.href}"><span class="mn-n">${String(i).padStart(2, "0")}</span><span class="mn-w">${esc(n.label)}</span></a></li>`).join("");
  return `<a class="skip" href="#main">Skip to content</a>
<header class="hd">
  <a class="hd-mark" href="${home}" aria-label="Aevinite, home"><span class="hd-w">Aevinite</span><span class="hd-dot" aria-hidden="true"></span></a>
  <nav class="hd-nav" aria-label="Main">${links}</nav>
  <div class="hd-r">
    <button class="hd-menu" type="button" aria-expanded="false" aria-controls="menu"><span>Index</span></button>
    <button class="snd" type="button" aria-pressed="false" aria-label="Sound is off. Turn sound on">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path class="snd-b" d="M3 9.5h4l5-4v13l-5-4H3z"/><path class="snd-w1" d="M15.5 9a4 4 0 0 1 0 6"/><path class="snd-w2" d="M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="snd-x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>
    </button>
    <button class="tg" type="button"><span class="tg-a" aria-hidden="true">A</span><span class="tg-l" aria-hidden="true"></span></button>
  </div>
</header>
<div class="mn" id="menu" hidden>
  <div class="mn-in">
    <p class="mn-k">Index</p>
    <ol class="mn-l">${big}</ol>
    <p class="mn-f">${esc(COMPANY.city)}, ${esc(COMPANY.region)} · <a href="mailto:${COMPANY.email}">${esc(COMPANY.email)}</a></p>
  </div>
</div>`;
}

export function footer(page: Page) {
  const p = prefix(page);
  const home = page === "home" ? "./" : "../";
  const hash = (h: string) => (page === "home" ? h : `../${h}`);
  const soc = [["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]];
  return `<footer class="ft" id="footer">
  <div class="ft-big" aria-hidden="true"><span class="ft-word">Aevinite</span></div>
  <div class="ft-grid">
    <div class="ft-col"><h2 class="ft-h">Pages</h2><ul>
      <li><a href="${home}">Home</a></li><li><a href="${p}aevidine/">Aevidine</a></li><li><a href="${p}campus/">Campus Conveyance</a></li>
      <li><a href="${hash("#work")}">Work</a></li><li><a href="${hash("#services")}">Services</a></li><li><a href="${hash("#contact")}">Contact</a></li></ul></div>
    <div class="ft-col"><h2 class="ft-h">Elsewhere</h2><ul>${soc.map(([l, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${l}</a></li>`).join("")}</ul></div>
    <div class="ft-col"><h2 class="ft-h">Talk</h2><ul>
      <li><a href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
      <li><a href="mailto:${COMPANY.email}">${esc(COMPANY.email)}</a></li>
      <li><a href="${COMPANY.phoneHref}">${esc(COMPANY.phoneDisplay)}</a></li></ul></div>
    <div class="ft-col ft-colo"><h2 class="ft-h">Colophon</h2>
      <p>Set in Anybody, a variable face with a width axis from 50 to 150 and a weight axis from 100 to 900. Text in Instrument Sans, figures in JetBrains Mono. The stage at night is set in Unbounded.</p></div>
  </div>
  <div class="ft-base">
    <span>© 2026 ${esc(COMPANY.name)}, ${esc(COMPANY.city)}</span>
    <span class="ft-credit">${esc(FILM_CREDIT)}</span>
    <span>Founded ${esc(COMPANY.foundedLabel)} as ${esc(COMPANY.formerName)}</span>
  </div>
</footer>`;
}

/** Section opener in the Swiss manner: margin number, label, rule. */
export const opener = (n: string, label: string, aside = "") =>
  `<div class="op"><span class="op-n">(${n})</span><span class="op-l">${esc(label)}</span>${aside ? `<span class="op-a">${esc(aside)}</span>` : ""}</div>`;

let toastTimer = 0;
export function toast(msg: string) {
  let t = $(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("on"), 3600);
}

function themeLabel(btn: HTMLElement, t: Theme) {
  btn.setAttribute("aria-label", t === "dark" ? "Switch to the light world, the Swiss poster" : "Switch to the dark world, the stage");
  $(".tg-l", btn).textContent = t === "dark" ? "Paper" : "Stage";
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", t === "dark" ? "#09090a" : "#f1ede4");
}

/** The new world arrives through a giant letter A that grows out of the toggle. */
function letterSwap(btn: HTMLElement, commit: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (!d.startViewTransition || reduced) { commit(); return; }
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.documentElement.classList.add("vt-a");
  const vt = d.startViewTransition(commit);
  vt.ready.then(() => {
    const k = (s: number, c: number) => ({
      maskSize: `${s}px ${s}px, ${c}px ${c}px`, WebkitMaskSize: `${s}px ${s}px, ${c}px ${c}px`,
      maskPosition: `${x - s / 2}px ${y - s * 0.62}px, ${x - c / 2}px ${y - c / 2}px`,
      WebkitMaskPosition: `${x - s / 2}px ${y - s * 0.62}px, ${x - c / 2}px ${y - c / 2}px`,
    });
    document.documentElement.animate(
      [{ ...k(2, 0), offset: 0 }, { ...k(far * 1.1, 0), offset: 0.45 }, { ...k(far * 3.4, far * 2.3), offset: 1 }],
      { duration: 1100, easing: "cubic-bezier(.6,0,.2,1)", pseudoElement: "::view-transition-new(root)", fill: "both" },
    );
  }).catch(() => undefined);
  vt.finished.finally(() => document.documentElement.classList.remove("vt-a"));
}

function stage() {
  // Liquid wobble filter (dark world): displacement grows with scroll speed.
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "defs");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<filter id="liq4" x="-5%" y="-20%" width="110%" height="140%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  document.body.append(svg);
  const disp = svg.querySelector("feDisplacementMap")!;
  const turb = svg.querySelector("feTurbulence")!;

  const layers = document.createElement("div");
  layers.className = "stage";
  layers.setAttribute("aria-hidden", "true");
  layers.innerHTML = `<div class="cols">${"<i></i>".repeat(12)}</div><div class="grain"></div><div class="spot"><div class="beam"></div><div class="pool"></div></div>`;
  document.body.prepend(layers);
  const beam = $(".beam", layers), pool = $(".pool", layers);

  let dark = getTheme() === "dark";
  let spike = 0;
  onTheme((t) => { dark = t === "dark"; if (dark) spike = 1; });
  const sp = { x: innerWidth * 0.6, y: innerHeight * 0.55 };
  let liq = -1, on = false;
  onFrame((dt, t) => {
    if (!dark) { if (on) { document.documentElement.classList.remove("liq-on"); on = false; } return; }
    // Liquid.
    spike = Math.max(0, spike - dt * 0.7);
    const amt = reduced ? 0 : Math.min(70, scroll.speed * 110 + spike * 60);
    if (Math.abs(amt - liq) > 0.4) {
      liq = amt;
      disp.setAttribute("scale", amt.toFixed(1));
      if (amt > 0.8) turb.setAttribute("baseFrequency", `${(0.006 + Math.sin(t * 1.3) * 0.002).toFixed(4)} ${(0.018 + Math.cos(t) * 0.004).toFixed(4)}`);
      const want = amt > 0.8;
      if (want !== on) { document.documentElement.classList.toggle("liq-on", want); on = want; }
    }
    // Spotlight: follows the mouse; on touch or when idle it sweeps the stage by itself.
    const idle = coarse || !pointer.moved || performance.now() - pointer.t > 5000;
    const tx = idle ? innerWidth * (0.5 + 0.34 * Math.sin(t * 0.33)) : pointer.x;
    const ty = idle ? innerHeight * (0.58 + 0.12 * Math.sin(t * 0.51)) : pointer.y;
    sp.x += (tx - sp.x) * Math.min(1, dt * 6);
    sp.y += (ty - sp.y) * Math.min(1, dt * 6);
    const sx = innerWidth * 0.5, sy = -innerHeight * 0.25;
    const ang = Math.atan2(sp.x - sx, sp.y - sy);
    const len = Math.hypot(sp.x - sx, sp.y - sy);
    beam.style.transform = `translate(${sx}px, ${sy}px) rotate(${(-ang * 180) / Math.PI}deg) scaleY(${(len / 1000).toFixed(3)})`;
    pool.style.transform = `translate(${sp.x}px, ${sp.y}px)`;
  });
}

function reveals() {
  if (reduced) return;
  const heads = $$(".rv");
  document.fonts.ready.then(() => heads.forEach((h) => {
    const split = SplitText.create(h, { type: "words,chars", charsClass: "c", wordsClass: "wd", aria: "auto" });
    gsap.set(split.chars, { "--w": 50, "--k": 100, opacity: 0.0001 });
    ScrollTrigger.create({
      trigger: h, start: "top 88%", once: true,
      onEnter: () => {
        const dark = getTheme() === "dark";
        if (dark) {
          gsap.fromTo(split.chars, { yPercent: -70, rotate: () => gsap.utils.random(-25, 25), opacity: 0 },
            { yPercent: 0, rotate: 0, opacity: 1, "--w": 100, "--k": 800, duration: 1.1, ease: "elastic.out(1,.45)", stagger: 0.022, clearProps: "transform" });
        } else {
          gsap.to(split.chars, { "--w": 100, "--k": 800, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.018 });
        }
      },
    });
  }));
}

function easterEgg() {
  let buf = "";
  addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, [contenteditable]")) return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === "grow") {
      kicks.forEach((k) => k());
      chime();
      $$(".rv .c").forEach((c, i) => i < 400 && gsap.fromTo(c, { "--w": 150, "--k": 900 }, { "--w": 100, "--k": 800, duration: 1.4, ease: "elastic.out(1,.3)", delay: (i % 40) * 0.01 }));
      toast("You typed grow. So everything did.");
    }
  });
}

function menu() {
  const btn = $(".hd-menu"), m = $("#menu");
  let open = false;
  const set = (v: boolean) => {
    open = v;
    btn.setAttribute("aria-expanded", String(v));
    $("span", btn).textContent = v ? "Close" : "Index";
    document.documentElement.classList.toggle("mn-open", v);
    if (v) {
      m.hidden = false;
      $$(".mn-w", m).forEach((w) => fit(w, { max: () => innerHeight * 0.1, widest: '"wdth" 150, "wght" 900' }));
      if (!reduced) gsap.fromTo($$(".mn-w", m), { "--w": 50, "--k": 100, yPercent: 40, opacity: 0 }, { "--w": 100, "--k": 700, yPercent: 0, opacity: 1, stagger: 0.04, duration: 0.7, ease: "expo.out" });
      ($(".mn-a", m) as HTMLElement).focus({ preventScroll: true });
    } else m.hidden = true;
  };
  btn.addEventListener("click", () => { blip(open ? 380 : 520); set(!open); });
  m.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    set(false);
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      e.preventDefault();
      const el = document.querySelector(url.hash) as HTMLElement | null;
      if (el) requestAnimationFrame(() => scrollToEl(el));
    }
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { set(false); btn.focus(); } });
}

/** Mount the shared chrome. Call once per page, before page content is wired. */
export function mountChrome(page: Page, main: string) {
  initTheme(4);
  startCore();
  const app = $("#app");
  app.innerHTML = header(page) + `<main id="main">${main}</main>` + footer(page);
  conceptBadge(4, "Big Type");
  stage();
  menu();

  const tg = $(".tg");
  themeLabel(tg, getTheme());
  tg.addEventListener("click", () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    thock(next === "dark" ? 80 : 160, 0.22);
    if (!reduced) gsap.fromTo($(".tg-a", tg), { "--w": 150, "--k": 900, scale: 1.3 }, { "--w": 100, "--k": 500, scale: 1, duration: 0.8, ease: "elastic.out(1,.4)" });
    setTheme(next, { transition: (commit) => letterSwap(tg, commit) });
  });
  onTheme((t) => { themeLabel(tg, t); ScrollTrigger.refresh(); });

  const snd = $(".snd");
  snd.addEventListener("click", () => setSound(snd.getAttribute("aria-pressed") !== "true"));
  onSound((on) => {
    snd.setAttribute("aria-pressed", String(on));
    snd.setAttribute("aria-label", on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on");
    if (on) blip(700, 0.08, 0.07);
  });

  // Header gets a solid ground once the page moves.
  const hd = $(".hd");
  onFrame(() => hd.classList.toggle("is-scrolled", scroll.y > 24));

  // Footer: the wordmark grows from hairline to full black as you arrive.
  const fw = $(".ft-word");
  fit(fw, { max: () => innerHeight * 0.4 });
  if (!reduced) gsap.fromTo(fw, { "--w": 50, "--k": 100 }, { "--w": 150, "--k": 900, ease: "none", scrollTrigger: { trigger: ".ft", start: "top bottom", end: "top 25%", scrub: 0.6 } });

  reveals();
  easterEgg();
  addEventListener("load", () => ScrollTrigger.refresh());
}

/** Magnetic hover for big buttons (desktop only). */
export function magnetic(el: HTMLElement, strength = 0.28) {
  if (coarse || reduced) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength, duration: 0.4, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,.4)" }));
}

export { clamp, ICON };
