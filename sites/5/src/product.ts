// Concept 5 · Panels: each product gets its own special issue. Same comic world as issue #1.
import { COMPANY, productById, type ProductId } from "@shared/content";
import { initChrome, footerHTML, pageCounter } from "./lib/chrome";
import { bookHTML, initBook } from "./lib/book";
import { panel, page } from "./lib/panel";
import { device, deviceFor } from "./lib/devices";
import { tvHTML, initFilms } from "./lib/film";
import { revealPanels, initPow } from "./lib/fx";
import { CAST, bust, focusLines, productCoverArt, type Bust } from "./lib/art";
import { $, esc } from "./lib/util";

const id = (document.body.dataset.product ?? "aevidine") as ProductId;
const P = productById(id);
const other = productById(id === "aevidine" ? "campus" : "aevidine");
const accent = id === "aevidine" ? "gold" : "amber";
const NAV = [
  { label: "Issue #1", href: "../" },
  { label: other.id === "campus" ? "Campus" : "Aevidine", href: `../${other.href}` },
  { label: "Episodes", href: "#film" },
  { label: "The cast", href: "#cast" },
  { label: "Free demo", href: "#demo" },
];
initChrome({ base: "../", nav: NAV });

const WHO: Record<string, Bust> = {
  Guest: CAST.guest("happy"), Kitchen: CAST.cook("happy"), Waiter: CAST.waiter("talk"), Manager: CAST.manager("calm"), Owner: CAST.owner("relief"),
  Student: CAST.student("happy"), Parent: CAST.parent("relief"), Driver: CAST.driver("calm"),
  College: { hair: "short", glasses: true, outfit: "shirt", shirt: "f-grn", mood: "calm" },
  Agency: { hair: "side", outfit: "jacket", shirt: "f-red", mood: "talk" },
  Admin: { hair: "bun", glasses: true, outfit: "hoodie", shirt: "f-blue", mood: "calm" },
};
const BG = ["f-yel-bg", "f-blue-bg", "f-red-bg", "f-grn-bg", "f-gold-bg", "f-yel-bg"];

/* hero */
const hero = `<section class="hero" data-page="1" aria-label="${esc(P.name)} special issue, the cover">
  ${bookHTML({
    accent,
    issue: "Special No. 1",
    kicker: P.kind,
    mast: P.name,
    line: P.headline,
    starring: P.screens.map((s) => s.who),
    art: productCoverArt(id),
    ghosts: [{ mast: "Aevinite", kicker: "No. 1", href: "../", tone: "brand" }, { mast: other.name, kicker: "Special No. 1", href: `../${other.href}`, tone: id === "aevidine" ? "amber" : "gold" }],
    overlay: device("phone", P.screens[id === "aevidine" ? 0 : 1].img, ""),
    logo: P.mark,
    burst: "Special issue!",
    backTitle: "Inside cover",
    backLine: P.sub,
    cast: P.screens.slice(0, 6).map((s) => ({ name: s.who, b: WHO[s.who] })),
    indicia: `${P.name} Special, No. 1. ${P.kind} by Aevinite, ${COMPANY.city}, ${COMPANY.region}. ${P.status}.`,
    contents: [
      { pg: "2", label: "Watch the episode", sub: P.film.length, href: "#film" },
      { pg: "3", label: "Bonus episodes", sub: `${P.extraFilms.length} more ${P.extraFilms.length > 1 ? "films" : "film"}`, href: "#extras" },
      { pg: "4", label: "Meet the cast", sub: `${P.screens.length} people, ${P.screens.length} screens`, href: "#cast" },
      { pg: "6", label: "Panel by panel", sub: "who does what", href: "#panels" },
      { pg: "8", label: "Amazing features", sub: "everything in the box", href: "#features" },
      { pg: "9", label: "Readers ask", sub: "questions and answers", href: "#faq" },
      { pg: "10", label: "Free demo coupon", sub: "clip and send", href: "#demo" },
    ],
    note: `${P.status}. ${P.line}`,
    start: { label: "Watch the episode", href: "#film" },
  })}
  <a class="skip-read" href="#film">Skip the cover, start reading</a>
</section>`;

/* main film */
const film = `<section class="sec" id="film" data-page="2" aria-labelledby="fm-t">
  <header class="sec-head"><p class="sec-k">Page 2</p><h2 id="fm-t" class="sec-t">Watch the episode</h2><p class="sec-s">${esc(P.film.description)}</p></header>
  <div class="tv-panel panel pow-zone ${accent}">${tvHTML(P.film, { label: "Watch the episode", chapterTitle: `Chapters of the ${P.name} film` })}</div>
</section>`;

/* extra films */
const extras = `<section class="sec" id="extras" data-page="3" aria-labelledby="ex-t">
  <header class="sec-head"><p class="sec-k">Page 3</p><h2 id="ex-t" class="sec-t">Bonus episode${P.extraFilms.length > 1 ? "s" : ""}</h2></header>
  <div class="extras n${P.extraFilms.length}">${P.extraFilms.map((f) => `<div class="tv-panel panel pow-zone ${accent} small">${tvHTML(f, { label: "Watch", small: true })}</div>`).join("")}</div>
</section>`;

/* the cast: every person and their real screen */
const castPanels = P.screens.map((s, i) => {
  const d = deviceFor(s.img);
  const wide = d.kind === "laptop" || d.kind === "tablet";
  const last = i === P.screens.length - 1 && P.screens.length % 2 === 1;
  return panel({
    span: last ? 6 : 3, ard: last ? "21/9" : "4/3", ar: "4/3", cls: `castp ${wide ? "wide" : "tall"}`,
    label: `${s.who}: ${s.line}`,
    art: `<svg class="art scene" viewBox="0 0 800 600" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><rect class="${BG[i]} ns" width="800" height="600"/><path class="f-focus ns" d="${focusLines(220, 420, 800, 600, 44, i + 50)}"/><g transform="translate(${wide ? -10 : 20} 300) scale(${wide ? 1.45 : 1.6})">${bust(WHO[s.who] ?? CAST.owner())}</g></svg>`,
    devs: [{ html: device(d.kind, s.img, `${P.name}, the ${s.who.toLowerCase()} screen`), pos: wide ? (last ? "right:4%;top:12%;width:44%" : "right:4%;top:24%;width:58%") : (last ? "right:12%;top:7%;width:16%" : "right:9%;top:6%;width:27%"), cls: i % 2 ? "tilt-l" : "tilt-r" }],
    caps: [{ text: s.line, pos: wide ? "left:3%;top:4%;max-width:56%" : "left:3%;top:4%;max-width:54%" }],
    sfx: [{ text: `The ${s.who.toLowerCase()}`, pos: "left:3%;bottom:4%", rot: -5, size: last ? 4.5 : 7 }],
  });
});
const pairs: string[][] = [];
for (let i = 0; i < castPanels.length; i += 2) pairs.push(castPanels.slice(i, i + 2));
const cast = `<section class="story" id="cast" data-page="4" aria-labelledby="cs-t">
  <header class="sec-head sec" style="padding-bottom:0"><p class="sec-k">Page 4</p><h2 id="cs-t" class="sec-t">Meet the cast</h2><p class="sec-s">Every person who touches ${esc(P.name)}, and the real screen in their hands.</p></header>
  ${pairs.map((p) => page(p)).join("")}
</section>`;

/* panel by panel */
const spans = P.panels.length === 5 ? [2, 2, 2, 3, 3] : P.panels.map(() => 3);
const panelsSec = `<section class="story" id="panels" data-page="6" aria-labelledby="pp-t">
  <header class="sec-head sec" style="padding-bottom:0"><p class="sec-k">Page 6</p><h2 id="pp-t" class="sec-t">Panel by panel</h2><p class="sec-s">${esc(P.sub)}</p></header>
  ${page(P.panels.map((p, i) => panel({ span: spans[i], cls: `txtp t${i % 5}`, html: `<p class="tx-who">${esc(p.who)}</p><h3 class="tx-t">${esc(p.title)}</h3><p class="tx-b">${esc(p.text)}</p><span class="tx-n" aria-hidden="true">${i + 1}</span>` })))}
</section>`;

/* features as a vintage comic ad page */
const features = `<section class="sec" id="features" data-page="8" aria-labelledby="ft-t">
  <div class="adpage pop">
    <header class="ad-head"><p class="ad-k">Amazing! Astounding! All in one system!</p><h2 id="ft-t" class="ad-t">Amazing features</h2></header>
    <ul class="ads">${P.features.map((f, i) => `<li class="ad a${i % 6}"><span class="ad-n">No. ${i + 1}</span><span class="ad-f">${esc(f)}</span></li>`).join("")}</ul>
    <p class="ad-foot">No batteries required. No GPS box. No paper tickets lost behind the counter.</p>
  </div>
</section>`;

/* FAQ as letters to the editor */
const faq = `<section class="sec" id="faq" data-page="9" aria-labelledby="fq-t">
  <header class="sec-head"><p class="sec-k">Page 9</p><h2 id="fq-t" class="sec-t">Readers ask</h2><p class="sec-s">Letters to the editor, answered. Tap a letter to read the reply.</p></header>
  <div class="faq">${P.faq.map((q, i) => `<details class="qa pop"${i === 0 ? " open" : ""}><summary><span class="qa-k">A reader asks</span><span class="qa-q">${esc(q.q)}</span><span class="qa-ico" aria-hidden="true"></span></summary><div class="qa-a"><span class="qa-k">The editors reply</span><p>${esc(q.a)}</p></div></details>`).join("")}</div>
</section>`;

/* coupon CTA */
const demo = `<section class="sec" id="demo" data-page="10" aria-labelledby="dm-t">
  <div class="coupon pop">
    <span class="scissors" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="9" cy="10" r="6"/><circle cx="9" cy="30" r="6"/><path d="M14 13 L38 30 M14 27 L38 10"/></svg></span>
    <div class="cp-in">
      <p class="cp-k">Clip this coupon</p>
      <h2 id="dm-t" class="cp-t">Free ${esc(P.name)} demo!</h2>
      <p class="cp-s">${esc(P.faq[P.faq.length - 1].a)}</p>
      <div class="cp-btns">
        <a class="btn btn-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp us</a>
        <a class="btn" href="mailto:${COMPANY.email}">${esc(COMPANY.email)}</a>
        <a class="btn btn-ink" href="${COMPANY.phoneHref}">${esc(COMPANY.phoneDisplay)}</a>
      </div>
    </div>
    <div class="cp-side" aria-hidden="true"><svg class="art" viewBox="0 0 200 204">${bust(id === "aevidine" ? CAST.owner("happy") : CAST.parent("happy"))}</svg></div>
  </div>
  <p class="backhome"><a class="btn btn-ink" href="../">Back to issue #1</a> <a class="btn btn-${other.id === "campus" ? "amber" : "gold"}" href="../${other.href}">Read the ${esc(other.name)} special</a></p>
</section>`;

document.documentElement.dataset.product = id;
$("#app").innerHTML = `<main id="main" class="prod ${accent}">${hero}${film}${extras}${cast}${panelsSec}${features}${faq}${demo}</main>${footerHTML("../", NAV)}`;
initBook($(".hero"), P.screens.map((s) => s.who));
initFilms();
revealPanels();
initPow();
pageCounter();
