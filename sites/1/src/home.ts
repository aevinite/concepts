import { COMPANY, MARQUEE, PRODUCTS } from "@shared/content";
import { initPage, socialsHTML } from "./lib/common";
import { initAmbient } from "./lib/ambient";
import { film, initFilms, screensHTML, initScreens } from "./lib/film";
import { terraceSVG, initTerrace, routeSVG, initRoute } from "./lib/scenes";
import { esc, gu, kiteSVG } from "./lib/utils";
import { heroHTML, initHero } from "./home/hero";
import { servicesHTML, initServices } from "./home/services";
import { processHTML, initProcess } from "./home/process";
import { workHTML, initWork } from "./home/tree";
import { numbersHTML, initNumbers } from "./home/flags";
import { aboutHTML, initAbout } from "./home/about";
import { initReveals } from "./lib/common";
import { initNight, lanternSky } from "./lib/night";

const strip = () => {
  const row = MARQUEE.map((w, i) => `<span class="mq-word">${esc(w)}</span><span class="mq-kite" style="--k-a:var(--${["saffron", "vermilion", "leaf", "indigo"][i % 4]});--k-b:var(--paper-kite)">${kiteSVG()}</span>`).join("");
  return `<div class="strip" aria-label="What we make: ${esc(MARQUEE.join(", "))}"><svg class="strip-line" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 5 Q 50 8 100 5"/></svg><div class="strip-track" aria-hidden="true"><div class="strip-row">${row}</div><div class="strip-row">${row}</div></div></div>`;
};

const product = (i: number) => {
  const p = PRODUCTS[i];
  const isA = p.id === "aevidine";
  return `<article class="prod prod-${p.id}" aria-labelledby="prod-${p.id}-h">
    <div class="prod-top">
      <div class="prod-text">
        <p class="prod-kind"><img src="${p.mark}" alt="" width="36" height="${isA ? 22 : 36}" loading="lazy"><span>${esc(p.kind)}</span></p>
        <h3 class="prod-name" id="prod-${p.id}-h" data-split>${esc(p.name)}</h3>
        <p class="prod-headline" data-reveal>${esc(p.headline)}</p>
        <p class="prod-line" data-reveal>${esc(p.sub)}</p>
        <p class="prod-status" data-reveal><span class="pulse" aria-hidden="true"></span>${esc(p.status)}</p>
        <a class="btn btn-prod" href="${p.href}" data-reveal><span>Open ${esc(p.name)}</span></a>
      </div>
      <figure class="prod-scene" data-reveal>
        ${isA ? terraceSVG(`ter-h`) : routeSVG(`rt-h`)}
        <figcaption>${isA ? "Tap a table: its order flies to the kitchen. Tap the lights to switch them on." : "The route is the kite's string. Drag along the map to drive the bus."}</figcaption>
      </figure>
    </div>
    <div class="prod-film" data-reveal>${film(p.film)}</div>
    <div class="prod-screens" data-reveal>
      <p class="mini-head">One screen for each person</p>
      ${screensHTML(`scr-${p.id}`, p.screens, p.name)}
    </div>
  </article>`;
};

const contactHTML = () => `<section class="contact" id="contact" aria-labelledby="contact-h">
  ${lanternSky(22)}
  <div class="wrap contact-in">
    <p class="eyebrow"><span class="gu" lang="gu">${gu(7)}</span><span>Contact</span></p>
    <h2 class="h2 contact-h" id="contact-h" data-split>Send us a kite.</h2>
    <p class="lede" data-reveal>Tell us about your business and what slows it down. There is no form here: write to us on WhatsApp, email, or call.</p>
    <div class="contact-actions" data-reveal>
      <a class="btn btn-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span class="wa-kite" aria-hidden="true">${kiteSVG()}</span><span>Message us on WhatsApp</span></a>
      <a class="contact-line" href="mailto:${COMPANY.email}"><small>Email</small><b>${esc(COMPANY.email)}</b></a>
      <a class="contact-line" href="${COMPANY.phoneHref}"><small>Phone and WhatsApp</small><b>${esc(COMPANY.phoneDisplay)}</b></a>
    </div>
    <div class="contact-social" data-reveal><small>Elsewhere</small>${socialsHTML()}</div>
  </div>
</section>`;

const main = `${heroHTML()}
  ${strip()}
  <section class="products" id="products" aria-labelledby="prod-h">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow"><span class="gu" lang="gu">${gu(1)}</span><span>Our own products</span></p>
        <h2 class="h2" id="prod-h" data-split>Two kites of our own.</h2>
        <p class="lede" data-reveal>We build for clients, and we fly our own. Each one has a short film: press play for sound, or jump to a moment.</p>
      </header>
      ${product(0)}
      ${product(1)}
    </div>
  </section>
  ${servicesHTML()}
  ${processHTML()}
  ${workHTML()}
  ${numbersHTML()}
  ${aboutHTML()}
  ${contactHTML()}`;

initPage("home", "", main);
initAmbient();
initHero();
initFilms();
PRODUCTS.forEach((p) => initScreens(document.querySelector(`.prod-${p.id}`)!, p.screens, p.name));
initTerrace(document);
initRoute(document);
initServices();
initProcess();
initWork();
initNumbers();
initAbout();
initNight();
initReveals();
