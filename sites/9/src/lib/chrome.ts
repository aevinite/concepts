// The frame every page shares: the top bar (brand, nav, "Skip the game", the sound bell and the
// diya that switches worlds), the footer, smooth scrolling, reveals, and the night world's
// rangoli and kolam lines that draw themselves in light as you scroll.
import "@fontsource/yatra-one/400.css";
import "@fontsource/rozha-one/400.css";
import "@fontsource/martel/300.css";
import "@fontsource/martel/400.css";
import "@fontsource/martel/700.css";
import "@fontsource/martel/800.css";
import Lenis from "lenis";
import { COMPANY, NAV, FILM_CREDIT, media } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme, type Theme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { gsap, ScrollTrigger, $, $$, esc, reduced } from "./util";
import { sound, strike, tap } from "./sound";
import { diya, bandDefs, band } from "./art";

export let lenis: Lenis | null = null;

const BELL = `<svg class="bell" viewBox="0 0 32 32" aria-hidden="true">
  <path class="bell__body" d="M16 5.5c-4.6 0-7.6 3.6-7.6 8.4v4.8L5.8 23h20.4l-2.6-4.3v-4.8c0-4.8-3-8.4-7.6-8.4Z"/>
  <path class="bell__top" d="M16 2.6v2.9"/><circle class="bell__clap" cx="16" cy="25.6" r="2.2"/>
  <path class="bell__w1" d="M27.4 9.5c1.3 1.8 2 3.8 2 6"/><path class="bell__w2" d="M4.6 9.5c-1.3 1.8-2 3.8-2 6"/>
  <path class="bell__x" d="M5 4 27 27"/>
</svg>`;

export const SOCIALS = [
  { label: "Instagram", href: COMPANY.instagram },
  { label: "LinkedIn", href: COMPANY.linkedin },
  { label: "GitHub", href: COMPANY.github },
  { label: "Medium", href: COMPANY.medium },
  { label: "Facebook", href: COMPANY.facebook },
];

type Page = "home" | "aevidine" | "campus";

export function header(page: Page) {
  const home = page === "home";
  const pre = home ? "" : "../";
  const links = home
    ? NAV.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("")
    : [`<a href="../">Aevinite</a>`, `<a href="../aevidine/" ${page === "aevidine" ? 'aria-current="page"' : ""}>Aevidine</a>`, `<a href="../campus/" ${page === "campus" ? 'aria-current="page"' : ""}>Campus</a>`, `<a href="../#contact">Contact</a>`].join("");
  return `<header class="top" data-top>
    <a class="top__brand" href="${home ? "#top" : "../"}" aria-label="Aevinite, ${home ? "back to the top" : "home"}">
      <img src="${media("aevinite-mark.webp")}" alt="" width="190" height="122"><span>Aevinite</span>
    </a>
    <nav class="top__nav" aria-label="Main">${links}</nav>
    <div class="top__tools">
      ${home ? `<a class="skip" href="#everything" data-skip><span class="skip__long">Skip the game, show me everything</span><span class="skip__short">Skip the game</span></a>`
             : `<a class="skip skip--home" href="${pre}"><span class="skip__long">Play the board</span><span class="skip__short">Board</span></a>`}
      <button class="snd" type="button" aria-pressed="false" aria-label="Sound is off. Turn sound on">${BELL}<span class="snd__l">Sound off</span></button>
      <button class="lamp" type="button" aria-label="Light the diya: switch to Diwali night">${diya("lamp__diya")}<span class="lamp__smoke" aria-hidden="true"></span></button>
    </div>
  </header>`;
}

export function footer(page: Page) {
  const pre = page === "home" ? "" : "../";
  return `<footer class="foot">
    ${band("band--foot")}
    <div class="foot__in wrap">
      <div class="foot__brand">
        <img src="${media("aevinite-mark.webp")}" alt="" width="190" height="122" loading="lazy">
        <p class="foot__name">Aevinite</p>
        <p class="foot__line">${esc(COMPANY.line)}</p>
        <p class="foot__city">${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}</p>
      </div>
      <nav class="foot__nav" aria-label="Footer">
        <a href="${pre || "#top"}">Home</a><a href="${pre}aevidine/">Aevidine</a><a href="${pre}campus/">Campus Conveyance</a>
        <a href="${pre}#services">Services</a><a href="${pre}#work">Work</a><a href="${pre}#about">About</a><a href="${pre}#contact">Contact</a>
      </nav>
      <ul class="foot__soc" aria-label="Aevinite elsewhere">${SOCIALS.map((s) => `<li><a href="${s.href}" rel="noopener" target="_blank">${s.label}</a></li>`).join("")}</ul>
      <div class="foot__fine">
        <p>${esc(FILM_CREDIT)}</p>
        <p>&copy; 2026 Aevinite, ${esc(COMPANY.city)}.</p>
      </div>
    </div>
    <div class="foot__diyas" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<span style="--i:${i}">${diya("diya--row")}</span>`).join("")}</div>
  </footer>`;
}

/* ------------------------------------------------------------------ toggles */

function initSound() {
  const b = $<HTMLButtonElement>(".snd");
  sound.restore();
  sound.sub((on) => {
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on");
    $(".snd__l", b).textContent = on ? "Sound on" : "Sound off";
    b.classList.toggle("is-on", on);
  });
  b.addEventListener("click", () => {
    sound.set(!sound.on);
    if (sound.on) tap();
    if (!reduced()) gsap.fromTo($(".bell", b), { rotation: -18 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1.4,0.25)", transformOrigin: "50% 10%" });
  });
}

function labelLamp(t: Theme) {
  const b = $<HTMLButtonElement>(".lamp");
  b.setAttribute("aria-label", t === "dark" ? "Blow out the diya: switch to the painted day board" : "Light the diya: switch to Diwali night");
  b.classList.toggle("is-lit", t === "dark");
  $('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#150c07" : "#ecdfc4");
}

function initLamp() {
  const b = $<HTMLButtonElement>(".lamp");
  labelLamp(getTheme());
  onTheme(labelLamp);
  b.addEventListener("click", () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    strike(next === "dark");
    const flame = $$(".diya__flame, .diya__core, .diya__glow", b);
    if (reduced()) { setTheme(next, { from: b }); return; }
    if (next === "dark") {
      gsap.fromTo(flame, { scale: 0, opacity: 0, transformOrigin: "50% 90%" }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.5)", stagger: 0.03 });
      setTimeout(() => setTheme(next, { from: b }), 220);
    } else {
      gsap.to(flame, { scale: 0, opacity: 0, transformOrigin: "50% 90%", duration: 0.25, ease: "power2.in" });
      gsap.fromTo($(".lamp__smoke", b), { opacity: 0.8, y: 0, scale: 0.6 }, { opacity: 0, y: -20, scale: 1.6, duration: 0.9, ease: "power1.out" });
      setTimeout(() => { setTheme(next, { from: b }); gsap.set(flame, { clearProps: "all" }); }, 260);
    }
  });
}

/* ------------------------------------------------------------------ scroll + reveals */

function initScroll() {
  if (!reduced()) {
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const top = $("[data-top]");
  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    top.classList.toggle("is-scrolled", y > 24);
    last = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  void last;
}

export function scrollToEl(el: Element) {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: 12, duration: 1.4, force: true }); // Lenis already honours scroll-padding-top (76px)
  else el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
}

/** Wrap each word in a mask so headings rise word by word. */
function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = "1";
  const walk = (n: Node) => {
    [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const parts = (c.textContent ?? "").split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(p)); return; }
          const w = document.createElement("span"); w.className = "w";
          const i = document.createElement("span"); i.className = "w__i"; i.textContent = p;
          w.append(i); frag.append(w);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !(c as HTMLElement).classList.contains("w")) walk(c);
    });
  };
  walk(el);
}

function initReveals() {
  if (reduced()) return;
  $$("[data-split]").forEach((el) => {
    splitWords(el);
    const words = $$(".w__i", el);
    gsap.set(words, { yPercent: 110, rotate: 4 });
    const o = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      gsap.to(words, { yPercent: 0, rotate: 0, duration: 0.9, ease: "power4.out", stagger: 0.05, onComplete: () => el.classList.add("is-in") });
    }, { rootMargin: "0px 0px -8% 0px" });
    o.observe(el);
  });
  // Reveals use an IntersectionObserver: it can never go stale when fonts or images change the layout.
  const rv = $$("[data-rv]");
  gsap.set(rv, { opacity: 0, y: 34 });
  let queue: Element[] = [], flush = 0;
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { queue.push(e.target); io.unobserve(e.target); } });
    cancelAnimationFrame(flush);
    flush = requestAnimationFrame(() => {
      gsap.to(queue, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.07, overwrite: true });
      queue = [];
    });
  }, { rootMargin: "0px 0px -6% 0px" });
  rv.forEach((el) => io.observe(el));
  // Night world: kolam bands and rangolis draw themselves in light as they scroll past.
  $$(".band .kolam").forEach((k) => {
    gsap.fromTo($$(".kb", k), { drawSVG: "0%" }, { drawSVG: "100%", ease: "none", scrollTrigger: { trigger: k, start: "top 95%", end: "top 45%", scrub: 0.6 } });
  });
  $$("[data-rangoli]").forEach((r) => {
    const parts = $$(".rg", r);
    gsap.fromTo(parts, { drawSVG: "0%" }, { drawSVG: "100%", ease: "none", stagger: 0.02, scrollTrigger: { trigger: r, start: "top 90%", end: "center 45%", scrub: 0.8 } });
  });
}

export function initChrome(page: Page) {
  initTheme(9);
  document.body.insertAdjacentHTML("afterbegin", bandDefs);
  initSound();
  initLamp();
  initScroll();
  conceptBadge(9, "Saap Sidi");
  // In-page links (the skip button, the nav): glide there, then move focus for keyboard users.
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#") return;
    const t = document.querySelector<HTMLElement>(a.getAttribute("href")!);
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
    history.replaceState(null, "", a.getAttribute("href"));
    setTimeout(() => { if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }, 1500);
  });
  requestAnimationFrame(() => initReveals());
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  // Re-measure every scroll-driven piece whenever the page height changes (fonts, images, phones rotating).
  let rt = 0, lastH = 0;
  new ResizeObserver(() => {
    const h = document.body.scrollHeight;
    if (Math.abs(h - lastH) < 2) return;
    lastH = h;
    clearTimeout(rt);
    rt = window.setTimeout(refresh, 180);
  }).observe(document.body);
  addEventListener("load", refresh);
  onTheme(() => requestAnimationFrame(refresh));
}
