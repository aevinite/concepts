import { COMPANY, PRODUCTS, productById, type ProductId } from "@shared/content";
import { initPage, initReveals } from "./lib/common";
import { initAmbient } from "./lib/ambient";
import { initNight, lanternSky } from "./lib/night";
import { film, initFilms, screensHTML, initScreens } from "./lib/film";
import { terraceSVG, initTerrace, routeSVG, initRoute } from "./lib/scenes";
import { buildSkyline } from "./lib/skyline";
import { COLORS } from "./lib/kitedraw";
import { esc, gu, kiteSVG } from "./lib/utils";

const id = (document.body.dataset.product ?? "aevidine") as ProductId;
const p = productById(id);
const other = PRODUCTS.find((x) => x.id !== id)!;
const isA = id === "aevidine";
const roofs = buildSkyline(1600, 200, 150, isA ? 52 : 63);

const pc = isA ? COLORS.gold : COLORS.amber;
const skyKites = [
  { x: 74, y: 22, s: 30, a: pc, b: COLORS.indigo, sx: 58, r: -8 },
  { x: 91, y: 40, s: 20, a: COLORS.vermilion, b: COLORS.cream, sx: 96, r: 10 },
  { x: 58, y: 14, s: 14, a: COLORS.leaf, b: pc, sx: 40, r: 4 },
];
const phSky = `<div class="phero-sky" aria-hidden="true">
  <svg class="ph-strings" viewBox="0 0 100 100" preserveAspectRatio="none">${skyKites.map((k) => `<path d="M${k.x} ${k.y + 3} Q ${(k.x + k.sx) / 2 + 6} ${(k.y + 100) / 2 + 14} ${k.sx} 104"/>`).join("")}</svg>
  ${skyKites.map((k, i) => `<span class="ph-kite" style="left:${k.x}%;top:${k.y}%;width:${k.s}px;--r:${k.r}deg;--d:${i * -1.3}s;--k-a:${k.a};--k-b:${k.b}">${kiteSVG()}</span>`).join("")}
  ${Array.from({ length: 7 }, (_, i) => `<i class="ph-lantern" style="--i:${i};left:${8 + ((i * 37) % 86)}%"></i>`).join("")}
</div>`;

const head = (n: number, label: string, title: string, lede = "") => `<header class="sec-head">
  <p class="eyebrow"><span class="gu" lang="gu">${gu(n)}</span><span>${esc(label)}</span></p>
  <h2 class="h2" data-split>${esc(title)}</h2>
  ${lede ? `<p class="lede" data-reveal>${esc(lede)}</p>` : ""}
</header>`;

const main = `
<section class="phero" aria-labelledby="ph-h">
  ${phSky}
  <div class="wrap phero-grid">
    <div class="phero-text">
      <a class="back" href="../"><svg viewBox="0 0 20 12" aria-hidden="true"><path d="M7 1 L2 6 L7 11 M2 6 H19"/></svg>Back to Aevinite</a>
      <p class="prod-kind"><img src="${p.mark}" alt="" width="36" height="${isA ? 22 : 36}"><span>${esc(p.name)}, ${esc(p.kind.toLowerCase())}</span></p>
      <h1 class="phero-title" id="ph-h" data-split>${esc(p.headline)}</h1>
      <p class="phero-sub" data-reveal>${esc(p.sub)}</p>
      <p class="prod-status" data-reveal><span class="pulse" aria-hidden="true"></span>${esc(p.status)}</p>
      <div class="hero-cta" data-reveal>
        <a class="btn btn-primary" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span>Ask for a free demo</span></a>
        <a class="btn btn-line" href="#film"><span>Watch the film</span></a>
      </div>
    </div>
    <figure class="phero-scene" data-reveal>
      ${isA ? terraceSVG("ph-sc") : routeSVG("ph-sc")}
      <figcaption>${isA ? "Tap a table: its order flies to the kitchen. Tap the lights to switch them on." : "The route is the kite's string. Drag along the map to drive the bus."}</figcaption>
    </figure>
  </div>
  <svg class="phero-roofs" viewBox="0 0 1600 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="${roofs.back}" class="r-back"/><path d="${roofs.front}" class="r-front"/></svg>
</section>

<section class="pfilm" id="film" aria-label="The film">
  <div class="wrap">
    ${head(1, "The film", p.film.title.split(":")[1]?.trim().replace(/^./, (c) => c.toUpperCase()) ?? p.film.title, "Press play for sound, or jump straight to a moment.")}
    ${film(p.film)}
  </div>
</section>

<section class="pscreens" aria-label="Screens">
  <div class="wrap">
    ${head(2, "Screens", "One screen for each person.", `Tap a name to see what ${p.name} shows them.`)}
    ${screensHTML(`scr-${id}`, p.screens, p.name)}
  </div>
</section>

<section class="ppanels" aria-label="Panels">
  <div class="wrap">
    ${head(3, "Who uses what", "Every role gets its own panel.")}
    <ol class="panels">
      ${p.panels.map((x, i) => `<li class="panel-row" data-reveal style="--k-a:${[COLORS.saffron, COLORS.vermilion, COLORS.leaf, COLORS.indigo, COLORS.gold][i]};--k-b:var(--paper-kite)">
        <span class="panel-kite">${kiteSVG()}</span>
        <p class="panel-who">${esc(x.who)}</p>
        <h3 class="panel-title">${esc(x.title)}</h3>
        <p class="panel-text">${esc(x.text)}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>

<section class="pfeatures" aria-label="Features">
  <div class="wrap">
    ${head(4, "Features", `Everything ${p.name} does.`)}
    <ul class="features">${p.features.map((f, i) => `<li data-reveal><span class="feat-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>${esc(f)}</li>`).join("")}</ul>
  </div>
</section>

<section class="pextra" aria-label="More films">
  <div class="wrap">
    ${head(5, "More films", p.extraFilms.length > 1 ? "Four more short films." : "One more film, the whole guest menu.")}
    <div class="extra-grid extra-${p.extraFilms.length}">${p.extraFilms.map((f) => `<div data-reveal>${film(f, { compact: true, label: "Play" }).replace(/<p class="film-credit">.*?<\/p>/, "")}</div>`).join("")}</div>
  </div>
</section>

<section class="pfaq" aria-label="Questions">
  <div class="wrap pfaq-grid">
    ${head(6, "Questions", "Asked on the rooftop.")}
    <div class="faq">${p.faq.map((f) => `<details data-reveal><summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join("")}</div>
  </div>
</section>

<section class="pcta contact" id="contact" aria-labelledby="pcta-h">
  ${lanternSky(18)}
  <div class="wrap contact-in">
    <p class="eyebrow"><span class="gu" lang="gu">${gu(7)}</span><span>See it running</span></p>
    <h2 class="h2 contact-h" id="pcta-h" data-split>Want a demo of ${esc(p.name)}?</h2>
    <p class="lede" data-reveal>Write or call, and we will show it to you working.</p>
    <div class="contact-actions" data-reveal>
      <a class="btn btn-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span class="wa-kite" aria-hidden="true">${kiteSVG()}</span><span>Message us on WhatsApp</span></a>
      <a class="contact-line" href="mailto:${COMPANY.email}"><small>Email</small><b>${esc(COMPANY.email)}</b></a>
      <a class="contact-line" href="${COMPANY.phoneHref}"><small>Phone and WhatsApp</small><b>${esc(COMPANY.phoneDisplay)}</b></a>
    </div>
    <div class="next-kite" data-reveal>
      <a class="next-card next-${other.id}" href="../${other.href}">
        <small>Also from Aevinite</small>
        <b>${esc(other.name)}</b>
        <span>${esc(other.line)}</span>
      </a>
      <a class="next-card next-home" href="../">
        <small>Back to the rooftop</small>
        <b>Aevinite</b>
        <span>${esc(COMPANY.line)} Websites, software and automation, made in ${esc(COMPANY.city)}.</span>
      </a>
    </div>
  </div>
</section>`;

initPage(id, "../", main);
initAmbient();
initFilms();
initScreens(document, p.screens, p.name);
if (isA) initTerrace(document); else initRoute(document);
initNight();
initReveals();
