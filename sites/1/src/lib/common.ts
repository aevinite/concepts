// Everything every Patang page shares: fonts, the day/night switch, sound, header, menu,
// footer, smooth scroll and the reveal motion.
import "@fontsource/baloo-bhai-2/600.css";
import "@fontsource/baloo-bhai-2/700.css";
import "@fontsource/baloo-bhai-2/800.css";
import "@fontsource/hind-vadodara/400.css";
import "@fontsource/hind-vadodara/500.css";
import "@fontsource/hind-vadodara/600.css";
import "@fontsource/rozha-one/400.css";
import "../style.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initTheme, setTheme, getTheme, onTheme, type Theme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { COMPANY, FILM_CREDIT, media } from "@shared/content";
import { esc, $, $$, reduced, isCoarse, kiteSVG } from "./utils";
import { sound } from "./sound";
import { buildSkyline } from "./skyline";
import { lanternSky } from "./night";

gsap.registerPlugin(ScrollTrigger);

export type Page = "home" | "aevidine" | "campus";

const SOCIALS = [
  { label: "Instagram", href: COMPANY.instagram },
  { label: "LinkedIn", href: COMPANY.linkedin },
  { label: "GitHub", href: COMPANY.github },
  { label: "Medium", href: COMPANY.medium },
  { label: "Facebook", href: COMPANY.facebook },
];
export const socialsHTML = (cls = "socials") => `<ul class="${cls}">${SOCIALS.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.label}</a></li>`).join("")}</ul>`;

/** Links that work from the home page (root "") and from a product page (root "../"). */
export function links(root: string) {
  const home = root || "./";
  const hash = (h: string) => (root ? `${root}#${h}` : `#${h}`);
  return [
    { label: "Aevidine", href: `${root}aevidine/`, key: "aevidine" },
    { label: "Campus", href: `${root}campus/`, key: "campus" },
    { label: "Work", href: hash("work"), key: "work" },
    { label: "Services", href: hash("services"), key: "services" },
    { label: "Contact", href: hash("contact"), key: "contact" },
    { label: "Home", href: home, key: "home" },
  ];
}

const THEME_ICON = `<span class="tg-sky" aria-hidden="true"><svg class="tg-kite" viewBox="-52 -56 104 130"><path d="M0 64 L-11 84 L11 84 Z" fill="#f08a17"/><path d="M0 -50 L49 -3 L0 51 L-49 -3 Z" fill="#2b3990"/><circle cx="0" cy="3" r="17" fill="#f08a17"/><path d="M0 -50 L0 51 M-49 -3 Q0 -40 49 -3" fill="none" stroke="rgba(255,240,210,.7)" stroke-width="3"/></svg><svg class="tg-lantern" viewBox="-30 -46 60 92"><path d="M0 -46 V-30" stroke="#ffd79a" stroke-width="2.5"/><rect x="-14" y="-32" width="28" height="6" rx="2" fill="#7a3510"/><rect x="-20" y="-26" width="40" height="50" rx="15" fill="url(#lg)"/><rect x="-14" y="24" width="28" height="6" rx="2" fill="#7a3510"/><path d="M0 -26 V24" stroke="rgba(150,60,10,.35)" stroke-width="2"/><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b0"/><stop offset=".6" stop-color="#ffb24f"/><stop offset="1" stop-color="#ee7a2a"/></linearGradient></defs></svg></span>`;
const SOUND_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path class="wave w1" d="M15 9.2c1.2 1.6 1.2 4 0 5.6"/><path class="wave w2" d="M17.6 6.8c2.5 3 2.5 7.4 0 10.4"/><path class="mute" d="M15.5 9.5l5 5m0-5l-5 5"/></svg>`;

export function headerHTML(root: string, page: Page) {
  const L = links(root);
  const nav = L.filter((l) => l.key !== "home").map((l) => `<a href="${l.href}"${l.key === page ? ` aria-current="page"` : ""}>${l.label}</a>`).join("");
  return `<a class="skip" href="#main">Skip to content</a>
  <header class="site-head">
    <div class="wrap head-row">
      <a class="logo" href="${root || "./"}" aria-label="Aevinite, home"><img src="${media("aevinite-mark.webp")}" alt="" width="44" height="27"><span>Aevinite</span></a>
      <nav class="head-nav" aria-label="Main">${nav}</nav>
      <button class="ctl ctl-menu" type="button" aria-expanded="false" aria-controls="menu"><span class="bars" aria-hidden="true"><i></i><i></i></span><span class="ctl-text">Menu</span></button>
    </div>
  </header>
  <div class="controls">
    <button class="ctl ctl-sound" type="button" aria-pressed="false" aria-label="Sound is off. Turn sound on">${SOUND_ICON}</button>
    <button class="ctl ctl-theme" type="button">${THEME_ICON}<span class="ctl-text tg-word"></span></button>
  </div>
  <div class="menu-sheet" id="menu" hidden>
    <nav aria-label="Menu">${L.map((l, i) => `<a href="${l.href}" style="--i:${i}">${l.label}</a>`).join("")}</nav>
    <p class="menu-foot">${esc(COMPANY.city)}, ${esc(COMPANY.region)}</p>
  </div>`;
}

export function footerHTML(root: string, hasFilm: boolean) {
  const L = links(root);
  const sky = buildSkyline(1600, 260, 190, 33);
  const wins = sky.win.filter((w) => w.lit).map((w) => `<rect x="${w.x.toFixed(0)}" y="${w.y.toFixed(0)}" width="${w.w}" height="${w.h}"/>`).join("");
  return `<footer class="site-foot">
    <div class="sunset" aria-hidden="true">
      <svg viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice">
        <circle cx="1080" cy="200" r="74" class="sun"/>
        <path d="${sky.back}" class="sun-back"/>
        <path d="${sky.front}" class="sun-front"/>
        <g class="sun-win">${wins}</g>
      </svg>
      ${lanternSky(16, "foot-sky")}
    </div>
    <div class="foot-body">
      <div class="wrap">
        <p class="foot-line">Every business deserves to fly.</p>
        <div class="foot-cols">
          <nav aria-label="Footer"><h2>Pages</h2><ul>${L.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}</ul></nav>
          <div><h2>Follow</h2>${socialsHTML("foot-socials")}</div>
          <div><h2>Talk</h2><ul><li><a href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li><li><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></li></ul></div>
        </div>
        <div class="foot-base">
          ${hasFilm ? `<p class="foot-credit">${esc(FILM_CREDIT)}</p>` : ""}
          <p>© 2026 Aevinite, ${esc(COMPANY.city)}</p>
          <p class="foot-gu" lang="gu">પતંગ</p>
        </div>
      </div>
    </div>
  </footer>`;
}

/** Night falls from the top like a curtain; morning comes up from the rooftops. */
function skyTransition(next: Theme) {
  return (commit: () => void) => {
    const d = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!d.startViewTransition || reduced()) { commit(); return; }
    const vt = d.startViewTransition(commit);
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: next === "dark" ? ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] : ["inset(100% 0 0 0)", "inset(0% 0 0 0)"] },
        { duration: 950, easing: "cubic-bezier(.7,0,.25,1)", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => {});
  };
}

function initControls() {
  const themeBtn = $<HTMLButtonElement>(".ctl-theme");
  const word = $<HTMLElement>(".tg-word");
  const meta = document.querySelector('meta[name="theme-color"]');
  const paint = (t: Theme) => {
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to Uttarayan day" : "Switch to Uttarayan night");
    word.textContent = t === "dark" ? "Night" : "Day";
    meta?.setAttribute("content", t === "dark" ? "#070c24" : "#f8ead0");
  };
  paint(getTheme());
  onTheme(paint);
  themeBtn.addEventListener("click", () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    gsap.fromTo(themeBtn, { scale: 0.9 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,.45)" });
    sound.whoosh();
    setTheme(next, { from: themeBtn, transition: skyTransition(next) });
  });

  const soundBtn = $<HTMLButtonElement>(".ctl-sound");
  sound.sub((on) => {
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.setAttribute("aria-label", on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on");
    soundBtn.classList.toggle("on", on);
  });
  soundBtn.addEventListener("click", () => {
    sound.toggle();
    gsap.fromTo(soundBtn, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,.5)" });
  });

  const menuBtn = $<HTMLButtonElement>(".ctl-menu");
  const sheet = $<HTMLElement>("#menu");
  const close = () => {
    if (sheet.hidden) return;
    menuBtn.setAttribute("aria-expanded", "false");
    gsap.to(sheet, { clipPath: "inset(0 0 100% 0)", duration: 0.35, ease: "power2.in", onComplete: () => { sheet.hidden = true; } });
  };
  menuBtn.addEventListener("click", () => {
    if (!sheet.hidden) return close();
    sheet.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    gsap.fromTo(sheet, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.5, ease: "power3.out" });
    gsap.fromTo($$("a", sheet), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.45, ease: "back.out(1.6)", delay: 0.1 });
    $<HTMLAnchorElement>("a", sheet).focus();
  });
  sheet.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

/** Headings rise word by word out of a mask; other blocks float up like paper on a breeze. */
export function initReveals(root: ParentNode = document) {
  if (reduced()) return;
  for (const h of $$<HTMLElement>("[data-split]", root)) {
    if (h.dataset.splitDone) continue;
    h.dataset.splitDone = "1";
    const words = (h.textContent ?? "").trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent!.trim());
    h.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span>${esc(w)}</span></span>`).join(" ");
    gsap.from($$(".w > span", h), {
      yPercent: 110, rotate: 4, duration: 0.8, ease: "power4.out", stagger: 0.05,
      scrollTrigger: { trigger: h, start: "top 92%", once: true },
    });
  }
  ScrollTrigger.batch($$("[data-reveal]", root), {
    start: "top 94%",
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 34, opacity: 0, rotate: () => (Math.random() - 0.5) * 2 }, { y: 0, opacity: 1, rotate: 0, duration: 0.8, ease: "power3.out", stagger: 0.06, overwrite: true }),
  });
}

export function initPage(page: Page, root: string, mainHTML: string, hasFilm = true) {
  initTheme(1);
  document.documentElement.classList.add("js");
  document.body.dataset.page = page;
  document.body.insertAdjacentHTML("afterbegin", headerHTML(root, page));
  const app = document.getElementById("app")!;
  app.innerHTML = `<main id="main">${mainHTML}</main>${footerHTML(root, hasFilm)}`;
  initControls();
  conceptBadge(1, "Patang");

  if (!reduced() && !isCoarse()) {
    const lenis = new Lenis({ lerp: 0.11, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  return app;
}

export { kiteSVG };
