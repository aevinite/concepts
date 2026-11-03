// Header, the fixed top-right controls (sound + the DRAW/PLAY selector switch), the left ruler
// (light, desktop), lamp strips (dark), and the footer title block.
import { COMPANY, FILM_CREDIT, NAV, media } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { $, $$, esc, reduced, gsap } from "./core";
import { sfx, setSound, onSound, soundOn } from "./sound";

/** base = "" on the home page, "../" on product pages */
export function navHref(href: string, base: string) {
  if (href.startsWith("#")) return base ? `${base}${href}` : href;
  return `${base}${href}`;
}

const SOCIALS = [
  { label: "Instagram", href: COMPANY.instagram },
  { label: "LinkedIn", href: COMPANY.linkedin },
  { label: "GitHub", href: COMPANY.github },
  { label: "Medium", href: COMPANY.medium },
  { label: "Facebook", href: COMPANY.facebook },
];
export const socialsHTML = (cls = "soc") => `<ul class="${cls}">${SOCIALS.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.label}</a></li>`).join("")}</ul>`;

/** a row of lamp bulbs that chase in the dark world */
export const lamps = (n: number, cls = "") => `<span class="lamps ${cls}" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</span>`;

export function headerHTML(base: string, current?: string) {
  return `
  <a class="skip" href="#main">Skip to content</a>
  <header class="top">
    <a class="brand" href="${base || "./"}" aria-label="Aevinite, home">
      <img src="${media("aevinite-mark.webp")}" alt="" width="48" height="30">
      <span><b>Aevinite</b><small>Drawing set · Ahmedabad</small></span>
    </a>
    <nav class="nav" aria-label="Main">
      ${NAV.map((n) => `<a href="${navHref(n.href, base)}"${current && n.href.startsWith(current) ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
    </nav>
  </header>
  <div class="ctl" role="group" aria-label="Site controls">
    <button class="ctl-menu" type="button" aria-expanded="false" aria-controls="sheetnav" aria-label="Open the sheet index"><span></span><span></span><span></span></button>
    <button class="ctl-snd" type="button" aria-pressed="false" aria-label="Sound is off. Turn sound on">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="w1" d="M15 9.2c1.1 1.6 1.1 4 0 5.6"/><path class="w2" d="M17.6 7c2.2 2.9 2.2 7.1 0 10"/><path class="x" d="M15.5 9.5l5 5m0-5l-5 5"/></svg>
    </button>
    <button class="tgl" type="button" aria-label="Switch to the dark world: the drawing becomes a pinball machine">
      <span class="tgl-plate" aria-hidden="true"><span class="tgl-a">Draw</span><span class="tgl-b">Play</span><span class="tgl-knob"><i></i></span></span>
    </button>
  </div>
  <nav class="sheetnav" id="sheetnav" aria-label="Sheet index" hidden>
    <p class="sheetnav-k">Sheet index</p>
    ${NAV.map((n, i) => `<a href="${navHref(n.href, base)}"><span>${String(i + 1).padStart(2, "0")}</span>${n.label}</a>`).join("")}
  </nav>
  <div class="ruler" aria-hidden="true"><span class="ruler-mk"><i></i><b>0</b></span></div>
  <div class="rail rail-l" aria-hidden="true">${lamps(14)}</div>
  <div class="rail rail-r" aria-hidden="true">${lamps(14)}</div>`;
}

export function footerHTML(base: string, withFilm = true) {
  return `
  <footer class="foot" id="footer">
    <div class="foot-in">
      ${lamps(24, "foot-lamps")}
      <div class="tb">
        <div class="tb-cell tb-name"><small>Project</small><b>Aevinite</b><span>${esc(COMPANY.line)}</span></div>
        <div class="tb-cell"><small>Sheets</small>
          <ul class="foot-nav">
            <li><a href="${base || "./"}">Home</a></li>
            ${NAV.map((n) => `<li><a href="${navHref(n.href, base)}">${n.label}</a></li>`).join("")}
          </ul>
        </div>
        <div class="tb-cell"><small>Elsewhere</small>${socialsHTML("foot-soc")}</div>
        <div class="tb-cell"><small>Talk to us</small>
          <a href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>
          <a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a>
        </div>
        <div class="tb-cell tb-wide"><small>Notes</small>
          ${withFilm ? `<p>${esc(FILM_CREDIT)}</p>` : ""}
          <p>© 2026 Aevinite, ${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}.</p>
        </div>
        <div class="tb-cell tb-stamp"><small>Drawn by</small><b>Aevinite</b><span>Scale 1:1</span></div>
      </div>
    </div>
  </footer>`;
}

/** Wire everything that the header/controls need. Returns nothing; safe to call once per page. */
export function initChrome() {
  initTheme(7);
  conceptBadge(7, "Drafting Table");

  // sound toggle
  const snd = $<HTMLButtonElement>(".ctl-snd");
  onSound((on) => {
    snd.setAttribute("aria-pressed", String(on));
    snd.setAttribute("aria-label", on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on");
    snd.classList.toggle("on", on);
  });
  snd.addEventListener("click", () => { setSound(!soundOn()); if (soundOn()) sfx.lever(); });

  // theme switch: its own transition (lamps power on top-down / pencil redraws left-to-right)
  const tgl = $<HTMLButtonElement>(".tgl");
  const label = () => tgl.setAttribute("aria-label", getTheme() === "dark"
    ? "Switch to the light world: back to the drawing"
    : "Switch to the dark world: the drawing becomes a pinball machine");
  label();
  onTheme(label);
  tgl.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    if (next === "dark") sfx.coin(); else sfx.pencil();
    tgl.classList.add("press");
    setTimeout(() => tgl.classList.remove("press"), 260);
    setTheme(next, {
      transition: (commit) => {
        const d = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
        if (!d.startViewTransition || reduced()) return commit();
        document.documentElement.classList.add(next === "dark" ? "vt-on" : "vt-draw");
        const vt = d.startViewTransition(commit);
        vt.ready.then(() => {
          const clip = next === "dark"
            ? ["inset(0 0 100% 0)", "inset(0 0 0% 0)"]
            : ["inset(0 100% 0 0)", "inset(0 0% 0 0)"];
          const a = document.documentElement.animate({ clipPath: clip }, { duration: 760, easing: "cubic-bezier(.75,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
          a.finished.finally(() => document.documentElement.classList.remove("vt-on", "vt-draw"));
        }).catch(() => document.documentElement.classList.remove("vt-on", "vt-draw"));
      },
    });
  });

  // phone sheet index
  const mb = $<HTMLButtonElement>(".ctl-menu"), sn = $<HTMLElement>(".sheetnav");
  const closeNav = () => { sn.hidden = true; mb.setAttribute("aria-expanded", "false"); mb.setAttribute("aria-label", "Open the sheet index"); };
  mb.addEventListener("click", () => {
    const open = sn.hidden;
    sn.hidden = !open;
    mb.setAttribute("aria-expanded", String(open));
    mb.setAttribute("aria-label", open ? "Close the sheet index" : "Open the sheet index");
    if (open) gsap.fromTo(sn, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out" });
  });
  $$("a", sn).forEach((a) => a.addEventListener("click", closeNav));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !sn.hidden) { closeNav(); mb.focus(); } });

  // left ruler: marks the pointer's height on the page in px (desktop, fine pointer)
  const ruler = $<HTMLElement>(".ruler"), mk = $<HTMLElement>(".ruler-mk"), mkb = $<HTMLElement>(".ruler-mk b");
  let raf = 0, py = 200;
  const upd = () => {
    raf = 0;
    mk.style.transform = `translateY(${py}px)`;
    mkb.textContent = String(Math.round(py + scrollY));
    ruler.style.backgroundPositionY = `${-scrollY % 100}px`;
  };
  addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; py = e.clientY; if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });

  // easter egg: type "tilt"
  let typed = "";
  addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === "tilt") {
      typed = "";
      document.body.classList.add("tilted");
      const b = document.createElement("div");
      b.className = "tilt-banner";
      b.setAttribute("role", "status");
      b.textContent = getTheme() === "dark" ? "TILT" : "Table knocked. Redrawing.";
      document.body.append(b);
      sfx.drain();
      setTimeout(() => { document.body.classList.remove("tilted"); b.remove(); }, 1800);
    }
  });
}
