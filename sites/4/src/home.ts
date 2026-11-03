import { COMPANY, PRODUCTS, FOR_WHOM, FILMS, type Film } from "@shared/content";
import { mountChrome, opener, registerKick, toast, magnetic } from "./lib/chrome";
import { gsap, reduced, coarse, isNarrow, fontsReady } from "./lib/core";
import { $, $$, esc, ICON } from "./lib/dom";
import { Kinetic } from "./lib/kinetic";
import { fit } from "./lib/fit";
import { filmHTML, wireFilms } from "./lib/film";
import { chime, blip } from "./lib/sound";
import {
  marqueeHTML, wireMarquee, whoHTML, wireWho, servicesHTML, wireServices, processHTML, wireProcess,
  workHTML, wireWork, numbersHTML, wireNumbers, aboutHTML, wireAbout, contactHTML, wireContact, growOnScroll,
} from "./lib/sections";
import { posterHTML, wirePoster } from "./lib/poster";

const hero = `<section class="hero" id="top" aria-labelledby="hero-h">
  <div class="hero-cap">
    <span><b>(01)</b> ${esc(COMPANY.name)}</span>
    <span>Websites, software, automation</span>
    <span>${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}</span>
    <span>Since ${esc(COMPANY.foundedLabel)}</span>
  </div>
  <p class="hero-pitch">${esc(COMPANY.pitch)}</p>
  <h1 class="hero-h" id="hero-h">
    <span class="hero-l1">We help businesses</span>
    <span class="sr">grow.</span>
    <span class="hero-kw liquid"></span>
  </h1>
  <div class="hero-foot">
    <p class="hero-for">For <span class="for-w" aria-live="polite">${esc(FOR_WHOM[0])}</span>.</p>
    <div class="hero-ctl">
      <p class="hero-hint">${coarse ? "Touch the letters. Tap one to grow it, or hold it and drag up." : "Move near the letters. Scroll fast. Drag a letter up."}</p>
      <button type="button" class="chip hero-tilt" hidden>Tilt to play</button>
      <button type="button" class="chip hero-cut" hidden>Cut back</button>
    </div>
  </div>
</section>`;

const product = (p: (typeof PRODUCTS)[number], i: number) => {
  const lines = p.id === "campus" ? ["Campus", "Conveyance"] : [p.name];
  return `<article class="pr pr--${p.id}" id="p-${p.id}" aria-labelledby="pr-${p.id}">
  <header class="pr-hd">
    <p class="pr-k"><span class="mono">0${i + 1}</span><span>${esc(p.kind)}</span><span class="pr-st"><i aria-hidden="true"></i>${esc(p.status)}</span></p>
    <h3 class="pr-name" id="pr-${p.id}"><a href="${p.href}" class="pr-w" data-fit-text="${esc(lines.reduce((a, b) => (b.length > a.length ? b : a)))}">${lines.map((l) => `<span class="pr-ln">${esc(l)}</span>`).join("")}</a></h3>
  </header>
  <div class="pr-grid">
    <div class="pr-txt">
      <p class="pr-hl">${esc(p.headline)}</p>
      <p class="pr-line">${esc(p.line)}</p>
      <a class="btn" href="${p.href}">All of ${esc(p.name)} ${ICON.arrow}</a>
    </div>
    <div class="pr-film">${filmHTML(p.film)}</div>
  </div>
  ${whoHTML(p.screens, p.name)}
</article>`;
};

const main = `${hero}
${marqueeHTML()}
<section class="sec" id="products" aria-labelledby="h-products">
  ${opener("02", "Products", "Two of our own")}
  <h2 class="h2 rv" id="h-products">Two products of our own.</h2>
  ${PRODUCTS.map(product).join("")}
</section>
<section class="sec" id="services" aria-labelledby="h-services">
  ${opener("03", "Services", "Tap a line to open it")}
  <h2 class="h2 rv" id="h-services">Five things we build for you.</h2>
  ${servicesHTML()}
</section>
<section class="sec sec--process" id="process" aria-labelledby="h-process">
  ${opener("04", "Process", "Scroll to step through")}
  <h2 class="h2 rv" id="h-process">How we work, in four steps.</h2>
  ${processHTML()}
</section>
<section class="sec" id="work" aria-labelledby="h-work">
  ${opener("05", "Work", coarse ? "Tap a name" : "Hover a name, click to open")}
  <h2 class="h2 rv" id="h-work">Things we have made.</h2>
  ${workHTML()}
</section>
<section class="sec" id="numbers" aria-labelledby="h-numbers">
  ${opener("06", "Numbers", "Honest ones only")}
  <h2 class="h2 rv" id="h-numbers">The numbers, as they are.</h2>
  ${numbersHTML()}
</section>
<section class="sec" id="poster" aria-labelledby="h-poster">
  ${opener("07", "Grow your name", "A poster for you")}
  <h2 class="h2 rv" id="h-poster">Now watch your name grow.</h2>
  ${posterHTML()}
</section>
<section class="sec" id="about" aria-labelledby="h-about">
  ${opener("08", "About", `Since ${COMPANY.foundedYear}`)}
  <h2 class="h2 rv" id="h-about">From Infinite to Aevinite.</h2>
  ${aboutHTML()}
</section>
<section class="sec sec--contact" id="contact">
  ${opener("09", "Contact", COMPANY.city)}
  ${contactHTML()}
</section>`;

mountChrome("home", main);

const films: Film[] = [FILMS.onePlatform, FILMS.campus];
wireFilms(document, films);
PRODUCTS.forEach((p) => wireWho($(`#p-${p.id} .who`), p.screens));
wireMarquee($(".mq"));
wireServices($("#services"));
wireProcess($("#process"));
wireWork($("#work"));
wireNumbers($("#numbers"));
wirePoster($("#poster"));
wireAbout($("#about"));
wireContact($("#contact"));
$$(".pr-w").forEach((w) => { fit(w, { max: () => innerHeight * 0.26, slack: 0.975 }); growOnScroll(w); });
$$(".btn").forEach((b) => magnetic(b, 0.18));

// Rotating "for whom" word: the old one thins away, the new one arrives fat and settles.
const forW = $(".for-w");
let fi = 0;
setInterval(() => {
  if (document.hidden) return;
  fi = (fi + 1) % FOR_WHOM.length;
  if (reduced) { forW.textContent = FOR_WHOM[fi]; return; }
  gsap.timeline()
    .to(forW, { "--w": 50, "--k": 100, opacity: 0, duration: 0.32, ease: "power2.in" })
    .call(() => { forW.textContent = FOR_WHOM[fi]; })
    .fromTo(forW, { "--w": 150, "--k": 900, opacity: 1 }, { "--w": 110, "--k": 760, duration: 0.9, ease: "elastic.out(1,.45)" });
}, 2400);

fontsReady().then(() => {
  const cut = $(".hero-cut");
  const kw = new Kinetic($(".hero-kw"), {
    rows: () => (isNarrow() ? ["GR", "OW."] : ["GROW."]),
    maxRowH: () => (isNarrow() ? Math.min(innerHeight * 0.2, innerWidth * 0.5) : Math.min(innerHeight * 0.32, innerHeight - 600)),
    label: true,
    drag: true,
    mirror: true,
    fixed: { ".": [150, 900, "dot"] },
    onGrown: (g) => { cut.hidden = !g; },
    onChart: () => { chime(); toast("That is a growth chart. We build real ones too."); },
  });
  cut.addEventListener("click", () => { kw.reset(); blip(260, 0.1); });
  registerKick(() => kw.kick());

  const tilt = $(".hero-tilt");
  if (coarse && "DeviceOrientationEvent" in window) {
    tilt.hidden = false;
    tilt.addEventListener("click", async () => {
      const ok = await kw.enableTilt();
      tilt.textContent = ok ? "Tilt is on" : "Tilt is not available";
      tilt.setAttribute("aria-pressed", String(ok));
    });
  }

  // The contact heading is a smaller cousin of the hero toy.
  const ck = new Kinetic($(".ct-kw"), {
    rows: () => (isNarrow() ? ["LET’S", "TALK."] : ["LET’S TALK."]),
    maxRowH: () => (isNarrow() ? innerHeight * 0.14 : innerHeight * 0.3),
    fixed: { ".": [150, 900, "dot"], "’": [100, 800, ""] },
    rest: [100, 700],
  });
  registerKick(() => ck.kick());
});
