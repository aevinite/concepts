// Top bar, the sleeve-flip theme toggle (Side A = record shop, Side B = club night), the sound
// switch, the footer and the marquee. Shared by all three pages.
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/archivo-black/index.css";
import { COMPANY, FILM_CREDIT, MARQUEE } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme, type Theme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { $, $$, esc, reduced, gsap, ScrollTrigger, icon } from "./util";
import * as snd from "./sound";

export const SOCIALS = [
  { label: "Instagram", href: COMPANY.instagram },
  { label: "LinkedIn", href: COMPANY.linkedin },
  { label: "GitHub", href: COMPANY.github },
  { label: "Medium", href: COMPANY.medium },
  { label: "Facebook", href: COMPANY.facebook },
] as const;

/** `root` is "" on the home page and "../" on the product pages. */
export function header(root: string, here: "home" | "aevidine" | "campus") {
  const home = root || "./";
  const links = [
    { l: "Aevidine", h: `${root}aevidine/`, on: here === "aevidine" },
    { l: "Campus", h: `${root}campus/`, on: here === "campus" },
    { l: "Crate", h: `${home}#crate`, on: false },
    { l: "Services", h: `${home}#services`, on: false },
    { l: "Contact", h: `${home}#contact`, on: false },
  ];
  return `<a class="skip" href="#main">Skip to the music</a>
  <header class="bar">
    <a class="logo" href="${home}" aria-label="Aevinite Records, home">
      <span class="logo__disc" aria-hidden="true"></span>
      <span class="logo__word">Aevinite<small>Records</small></span>
    </a>
    <nav class="nav" aria-label="Main">
      <ul>${links.map((x) => `<li><a href="${x.h}" ${x.on ? `aria-current="page"` : ""}>${x.l}</a></li>`).join("")}</ul>
    </nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
    <div class="bar__end">
      <button class="snd" type="button" aria-pressed="false" aria-label="Sound effects: off">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="snd__spk" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="snd__w1" d="M15 9.2a4 4 0 0 1 0 5.6"/><path class="snd__w2" d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4"/><path class="snd__x" d="m15.5 9.5 5 5m0-5-5 5"/></svg>
        <span class="snd__l">Sound</span>
      </button>
      <button class="flip" type="button" aria-label="Flip the record to Side B, club night (dark)">
        <span class="flip__sleeve" aria-hidden="true"><span class="flip__a">A</span><span class="flip__b">B</span></span>
        <span class="flip__l" aria-hidden="true"><b class="la">Side A</b><b class="lb">Side B</b></span>
      </button>
    </div>
    <div class="menu" id="menu" hidden>
      <ul>${links.map((x) => `<li><a href="${x.h}">${x.l}</a></li>`).join("")}</ul>
    </div>
  </header>`;
}

export function marquee(words: readonly string[] = MARQUEE) {
  const row = words.map((w) => `<span>${esc(w)}</span><i aria-hidden="true"></i>`).join("");
  return `<div class="mq" aria-label="${esc(words.join(", "))}"><div class="mq__track" aria-hidden="true">${row}${row}${row}</div></div>`;
}

export function footer(root: string, withCredit: boolean) {
  const home = root || "./";
  return `<footer class="foot" id="foot">
    <div class="foot__in">
      <div class="foot__big">
        <p class="foot__k only-l">Thank you for shopping at</p>
        <p class="foot__k only-d">Lights up. Last record of the night from</p>
        <p class="foot__w">Aevinite <span>Records</span></p>
        <p class="foot__l">${esc(COMPANY.line)} ${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}.</p>
      </div>
      <nav class="foot__nav" aria-label="Footer">
        <p class="foot__h">The shop</p>
        <ul>
          <li><a href="${home}">Home</a></li>
          <li><a href="${root}aevidine/">Aevidine</a></li>
          <li><a href="${root}campus/">Campus Conveyance</a></li>
          <li><a href="${home}#crate">The crate</a></li>
          <li><a href="${home}#services">Services</a></li>
          <li><a href="${home}#about">About the label</a></li>
          <li><a href="${home}#contact">Book us</a></li>
        </ul>
      </nav>
      <div class="foot__nav">
        <p class="foot__h">Follow the label</p>
        <ul>${SOCIALS.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.label}</a></li>`).join("")}</ul>
      </div>
      <div class="foot__nav">
        <p class="foot__h">Talk to us</p>
        <ul>
          <li><a href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
          <li><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></li>
        </ul>
      </div>
    </div>
    <div class="foot__base">
      ${withCredit ? `<p>${esc(FILM_CREDIT)}</p>` : ""}
      <p>© 2026 Aevinite, ${esc(COMPANY.city)}. Pressed in-house.</p>
    </div>
  </footer>`;
}

/** The record flip: a giant record grows from the toggle, turns over, and shrinks back. */
function flipTransition(btn: HTMLElement, next: Theme) {
  return (commit: () => void) => {
    if (reduced()) return commit();
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.08;
    const d = document.createElement("div");
    d.className = `bigflip to-${next}`;
    d.style.cssText = `left:${x - R}px;top:${y - R}px;width:${R * 2}px;height:${R * 2}px`;
    d.innerHTML = `<span class="bigflip__label"><b>${next === "dark" ? "Side B" : "Side A"}</b><i>${next === "dark" ? "Club night" : "Record shop"}</i></span>`;
    document.body.append(d);
    gsap.timeline({ onComplete: () => d.remove() })
      .fromTo(d, { scale: 0.02, rotate: -120 }, { scale: 1, rotate: 0, duration: 0.55, ease: "power3.in" })
      .add(() => { commit(); ScrollTrigger.refresh(); })
      .to(d, { scale: 0.02, rotate: 140, duration: 0.6, ease: "power3.out" }, "+=0.08");
  };
}

export function initChrome(n: number, name: string) {
  initTheme(n);
  conceptBadge(n, name);

  const flip = $(".flip");
  const label = (t: Theme) => flip.setAttribute("aria-label", t === "dark"
    ? "Flip the record back to Side A, record shop (light)" : "Flip the record to Side B, club night (dark)");
  label(getTheme());
  flip.addEventListener("click", () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    snd.tick(0.8);
    setTheme(next, { from: flip, transition: flipTransition(flip, next) });
  });
  onTheme((t) => { label(t); document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0c0b0d" : "#efe5d3"); });

  const sb = $(".snd");
  sb.addEventListener("click", () => {
    snd.setSound(!snd.soundOn());
    if (snd.soundOn()) snd.chime();
  });
  snd.onSound((on) => {
    sb.setAttribute("aria-pressed", String(on));
    sb.setAttribute("aria-label", `Sound effects: ${on ? "on" : "off"}`);
    sb.classList.toggle("is-on", on);
  });

  const mb = $(".menu-btn"), menu = $("#menu");
  mb.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    mb.setAttribute("aria-expanded", String(open));
  });
  $$("a", menu).forEach((a) => a.addEventListener("click", () => { menu.hidden = true; mb.setAttribute("aria-expanded", "false"); }));

  // The bar gets a backing once the page has moved.
  const bar = $(".bar");
  const onScroll = () => bar.classList.toggle("is-stuck", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Pinned and scroll-driven parts are measured again once the real fonts are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener("load", () => ScrollTrigger.refresh());
}

export { icon };
