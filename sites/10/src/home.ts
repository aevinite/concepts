import "./styles.css";
import { COMPANY, FOR_WHOM, PRODUCTS, media } from "@shared/content";
import { initChrome, header, footer, marquee } from "./lib/chrome";
import { shopStageHTML, bindShopStage, clubStageHTML, bindClub, pauseOnTheme } from "./lib/stage";
import { filmBlockHTML, bindFilmBlock, lineupHTML, bindLineup } from "./lib/release";
import { crateHTML, bindCrate } from "./lib/crate";
import { servicesHTML, bindServices, processHTML, bindProcess, numbersHTML, bindNumbers, aboutHTML, bindAbout, contactHTML, bindContact } from "./lib/sections";
import { $, $$, esc, icon, reduced, gsap, onceVisible } from "./lib/util";
import { rotator, reveal } from "./lib/motion";
import type { DeckOpts } from "./lib/deck";

const [AEV, CAMPUS] = PRODUCTS;
const mark = media("aevinite-mark.webp");
const optA: DeckOpts = { side: "A", label: "AEVINITE RECORDS · AEV 01 · 33⅓", name: "Aevinite", mark, tone: "brand" };
const clubA: DeckOpts = { side: "A", label: "AEVIDINE · ONE PLATFORM · AEV 01", name: "Aevidine", mark, tone: "gold" };
const clubB: DeckOpts = { side: "B", label: "CAMPUS CONVEYANCE · THE 7:10 BUS · AEV 02", name: "Campus", mark: CAMPUS.mark, tone: "amber" };

const dual = (l: string, d: string) => `<span class="only-l">${l}</span><span class="only-d">${d}</span>`;

function hero() {
  return `<section class="hero" id="top" aria-labelledby="h1">
    <div class="hero__intro">
      <p class="kick hero__kick">${dual("Aevinite Records · Side A", "Aevinite Records · Side B · Club night")}</p>
      <h1 class="hero__h1" id="h1"><span class="ln1">We help</span> <span class="ln2">businesses</span> <span class="ln3"><em>grow.</em></span></h1>
      <p class="hero__hits">Hits for ${rotator(FOR_WHOM)}</p>
      <p class="hero__pitch">${esc(COMPANY.pitch)}</p>
      <div class="hero__cta">
        <button type="button" class="btn btn--main" data-drop>${icon.play}<span>Drop the needle</span></button>
        <a class="btn btn--ghost" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>Book us for a show</span></a>
      </div>
      <p class="hero__how">${dual("Spin the record to scrub the film. Pick a track to jump.", "Two decks. Spin either record, then drag the crossfader to mix Aevidine into Campus.")}</p>
    </div>
    ${shopStageHTML(AEV.film, optA, "only-l-flex")}
    ${clubStageHTML(AEV.film, CAMPUS.film, clubA, clubB)}
  </section>`;
}

function releases() {
  return `<section class="sec sec--rel" id="releases" aria-labelledby="rel-h">
    <header class="sec__head">
      <p class="kick">${dual("New in the racks", "Tonight's headliners")}</p>
      <h2 class="h2" id="rel-h">Two records <em>of our own.</em></h2>
      <p class="sec__lede">Two products of our own, each with its film, its tracklist and everyone who plays on it. Press play for the full film with sound.</p>
    </header>
    ${PRODUCTS.map((p, i) => `<article class="rel" data-tone="${p.color}" id="rel-${p.id}">
      <div class="rel__info">
        <p class="rel__cat"><span>AEV 0${i + 1}</span><span>LP</span><span>${esc(p.kind)}</span></p>
        <h3 class="rel__name"><img src="${p.mark}" alt="" width="40" height="40" loading="lazy"> ${esc(p.name)}</h3>
        <p class="rel__head">${esc(p.headline)}</p>
        <p class="rel__sub">${esc(p.line)}</p>
        <span class="sticker">${esc(p.status)}</span>
        <a class="btn btn--line" href="${p.href}"><span>Open the release</span>${icon.arrow}</a>
      </div>
      <div class="rel__film">${filmBlockHTML(p.film, i ? "B" : "A", p.color)}</div>
      <div class="rel__lu"><p class="kick kick--sm">Featuring</p>${lineupHTML(p.screens, p.name)}</div>
    </article>`).join("")}
  </section>`;
}

function page() {
  return `${header("", "home")}
  <main id="main">
    ${hero()}
    ${marquee()}
    ${releases()}
    <section class="sec sec--crate" id="crate" aria-labelledby="crate-h">
      <header class="sec__head">
        <p class="kick">${dual("The crate", "The record bag")}</p>
        <h2 class="h2" id="crate-h">Dig through <em>everything we've pressed.</em></h2>
        <p class="sec__lede">Our two products and the work we've built besides them. Flick through the sleeves, pull one out for its liner notes.</p>
      </header>
      ${crateHTML("")}
    </section>
    <section class="sec sec--b" id="services" aria-labelledby="svc-h">
      <div class="backcover">
        <header class="sec__head">
          <p class="kick">${dual("Side B", "The setlist")}</p>
          <h2 class="h2" id="svc-h">Five things <em>we make for you.</em></h2>
        </header>
        ${servicesHTML()}
        <div class="backcover__foot" aria-hidden="true"><span class="barcode"></span><span>AEV 2024 · Pressed in Ahmedabad</span></div>
      </div>
    </section>
    <section class="sec sec--ep" id="process" aria-labelledby="ep-h">
      <header class="sec__head">
        <p class="kick">${dual("The EP", "Extended mix")}</p>
        <h2 class="h2" id="ep-h">Four tracks <em>to growth.</em></h2>
        <p class="sec__lede">How every project runs, start to finish. Scroll and the needle plays through it.</p>
      </header>
      ${processHTML()}
    </section>
    <section class="sec sec--vu" id="numbers" aria-labelledby="vu-h">
      <header class="sec__head">
        <p class="kick">${dual("The levels", "Levels")}</p>
        <h2 class="h2" id="vu-h">Honest numbers, <em>no hype.</em></h2>
      </header>
      ${numbersHTML()}
    </section>
    <section class="sec sec--about" id="about" aria-label="About the label">
      ${aboutHTML()}
    </section>
    <section class="sec sec--contact" id="contact" aria-label="Book us">
      ${contactHTML()}
    </section>
  </main>
  ${footer("", true)}`;
}

const app = $("#app");
app.innerHTML = page();
initChrome(10, "Side A");

const shop = bindShopStage($(".stage--shop"), AEV.film, "A");
const club = bindClub($(".stage--club"), AEV.film, CAMPUS.film);
pauseOnTheme("light", [shop.player]);
pauseOnTheme("dark", [club.pa, club.pb]);

$("[data-drop]").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  (dark ? club.da : shop.deck).start(0);
});

$$<HTMLElement>(".rel").forEach((r, i) => {
  bindFilmBlock($(".fb", r), PRODUCTS[i].film);
  bindLineup($(".lu", r), PRODUCTS[i].screens);
});
bindCrate($(".crate-wrap"), "");
bindServices($("#services"));
bindProcess($("#process"));
bindNumbers($("#numbers"));
bindAbout($("#about"));
bindContact($("#contact"));
reveal();

// Hero entrance.
if (!reduced()) {
  gsap.from(".hero__h1 > span", { yPercent: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 });
  gsap.from([".hero__hits", ".hero__pitch", ".hero__cta", ".hero__how"], { y: 14, opacity: 0, duration: 0.7, delay: 0.25, stagger: 0.06 });
  gsap.from(".stage--shop .shop__deck, .stage--club .cdeck", { y: 40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.15, stagger: 0.1 });
}
onceVisible($(".mq"), () => $(".mq").classList.add("is-on"));
