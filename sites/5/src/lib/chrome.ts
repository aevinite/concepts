// The parts every page shares: masthead with nav, the theme toggle (a tiny panel: sun in the
// Sunday edition, moon and rain in the noir one), the sound toggle, the page-number button, the
// footer, the rain, and the switch animations (lightning into noir, a halftone wipe back to day).
import "@fontsource/bangers/latin-400.css";
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import "@fontsource/special-elite/latin-400.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource-variable/archivo/wdth.css";
import "../style.css";
import { COMPANY, FILM_CREDIT, media } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { $, $$, esc, reduced } from "./util";
import { defsSVG, SUN_MOON, SPEAKER } from "./art";
import { initRain, lightning } from "./rain";
import { setSound, soundOn, onSound, sfx } from "./sound";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type ChromeOpts = { base: string; nav: { label: string; href: string }[]; film?: boolean };

export function initChrome(o: ChromeOpts) {
  initTheme(5);
  document.body.insertAdjacentHTML("afterbegin", defsSVG() + `<a class="skip" href="#main">Skip to the story</a>`);
  const header = document.createElement("header");
  header.className = "mast";
  header.innerHTML = `
    <a class="brand" href="${o.base}" aria-label="Aevinite, home">
      <span class="brand-mark"><img src="${media("aevinite-mark.webp")}" alt="" width="192" height="118"></span>
      <span class="brand-name">Aevinite</span><span class="brand-sub">Comics</span>
    </a>
    <nav class="nav" aria-label="Main">${o.nav.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("")}</nav>
    <div class="tools">
      <button class="tool menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open the contents"><span class="menu-ico" aria-hidden="true"><i></i><i></i><i></i></span></button>
      <button class="tool snd" type="button" aria-pressed="false" aria-label="Sound effects off. Turn on">${SPEAKER}</button>
      <button class="tool tg" type="button" aria-label="Switch to the noir night edition">${SUN_MOON}<span class="tg-sfx" aria-hidden="true">CLICK!</span></button>
    </div>
    <div class="menu" id="menu" hidden><p class="menu-h">In this issue</p>${o.nav.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("")}</div>`;
  document.body.prepend(header);

  // theme toggle
  const tg = $<HTMLButtonElement>(".tg", header);
  const label = () => tg.setAttribute("aria-label", getTheme() === "dark" ? "Switch to the Sunday colour edition (light)" : "Switch to the noir night edition (dark)");
  label();
  onTheme(() => { label(); setTimeout(() => ScrollTrigger.refresh(), 50); });
  tg.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    sfx.click();
    tg.classList.remove("flip"); void tg.offsetWidth; tg.classList.add("flip");
    if (next === "dark") setTheme("dark", { transition: (commit) => { sfx.thunder(); lightning(commit); } });
    else setTheme("light", { transition: halftoneWipe });
  });

  // sound toggle
  const snd = $<HTMLButtonElement>(".snd", header);
  snd.addEventListener("click", () => { setSound(!soundOn()); sfx.ding(); });
  onSound((on) => { snd.setAttribute("aria-pressed", String(on)); snd.setAttribute("aria-label", on ? "Sound effects on. Turn off" : "Sound effects off. Turn on"); snd.classList.toggle("on", on); });

  // phone menu
  const mb = $<HTMLButtonElement>(".menu-btn", header), menu = $("#menu", header);
  const closeMenu = () => { menu.hidden = true; mb.setAttribute("aria-expanded", "false"); };
  mb.addEventListener("click", () => { const open = menu.hidden === true; menu.hidden = !open; mb.setAttribute("aria-expanded", String(open)); });
  $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
  document.addEventListener("click", (e) => { if (!menu.hidden && !(e.target as Element).closest(".menu, .menu-btn")) closeMenu(); });

  // the masthead gets a paper backing once the page moves (it never hides: the toggles stay reachable)
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 30), { passive: true });

  initRain();
  conceptBadge(5, "Panels");
  // an occasional far-off lightning flash in the noir world (never with reduced motion)
  if (!reduced()) setInterval(() => { if (getTheme() === "dark" && !document.hidden && Math.random() < 0.25) document.body.classList.add("distant"), setTimeout(() => document.body.classList.remove("distant"), 260); }, 9000);
}

/** Light: a wall of Ben-Day dots swells over the page, the page changes, the dots shrink away. */
function halftoneWipe(commit: () => void) {
  if (reduced()) return commit();
  const w = document.createElement("div");
  w.className = "wipe";
  document.body.append(w);
  const a = w.animate([{ "--r": "0px" } as Keyframe, { "--r": "26px" } as Keyframe], { duration: 380, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" });
  a.onfinish = () => {
    commit();
    const b = w.animate([{ "--r": "26px" } as Keyframe, { "--r": "0px" } as Keyframe], { duration: 420, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" });
    b.onfinish = () => w.remove();
  };
}

/** Bottom-right page number; tap it to go back to the cover. */
export function pageCounter() {
  const pages = $$<HTMLElement>("[data-page]");
  if (!pages.length) return;
  const b = document.createElement("button");
  b.className = "pageno";
  b.type = "button";
  b.setAttribute("aria-label", "Back to the cover");
  b.innerHTML = `<span class="pn-p">page</span><span class="pn-n">1</span><span class="pn-hint">back to the cover</span>`;
  document.body.append(b);
  const n = $(".pn-n", b);
  b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) n.textContent = (e.target as HTMLElement).dataset.page!; }), { rootMargin: "-45% 0px -50% 0px" });
  pages.forEach((p) => io.observe(p));
}

export function footerHTML(base: string, nav: { label: string; href: string }[], film = true) {
  const socials = [["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]];
  return `<footer class="foot">
    <div class="foot-next pop"><p class="foot-k">Next issue</p><p class="foot-big">Starring: your business.</p><a class="btn btn-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">Start it on WhatsApp</a></div>
    <div class="foot-cols">
      <div><p class="foot-h">This issue</p><nav aria-label="Footer">${[{ label: "Home", href: base }, ...nav].map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("")}</nav></div>
      <div><p class="foot-h">Find us</p><nav aria-label="Social">${socials.map(([l, h]) => `<a href="${h}" target="_blank" rel="noopener">${l}</a>`).join("")}</nav></div>
      <div><p class="foot-h">Write in</p><a href="mailto:${COMPANY.email}">${COMPANY.email}</a><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a><p class="foot-small">${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}</p></div>
    </div>
    <p class="indicia">${film ? `${esc(FILM_CREDIT)}. ` : ""}© 2026 Aevinite, Ahmedabad. Every character in these pages is drawn for the story; the software in their hands is real.</p>
  </footer>`;
}
