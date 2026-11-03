import { COMPANY, PRODUCTS, productById, type Film, type ProductId } from "@shared/content";
import { mountChrome, opener, registerKick, magnetic } from "./lib/chrome";
import { gsap, reduced, coarse, isNarrow, fontsReady } from "./lib/core";
import { $, $$, esc, pad2, ICON } from "./lib/dom";
import { Kinetic } from "./lib/kinetic";
import { fit } from "./lib/fit";
import { filmHTML, wireFilms, FilmPlayer } from "./lib/film";
import { blip, thock } from "./lib/sound";
import { whoHTML, wireWho, contactHTML, wireContact, growOnScroll } from "./lib/sections";

const id = (document.body.dataset.page as ProductId) || "aevidine";
const p = productById(id);
const other = PRODUCTS.find((x) => x.id !== id)!;
const isCampus = id === "campus";

const extras = p.extraFilms as readonly Film[];
const extraBlock = extras.length === 1
  ? filmHTML(extras[0])
  : `<div class="xf">
      <div class="xf-player">${filmHTML(extras[0])}</div>
      <ol class="xf-list">${extras.map((f, i) => `<li><button type="button" class="xf-b" data-i="${i}" aria-pressed="${i === 0}">
        <span class="xf-n">${pad2(i + 1)}</span><span class="xf-t">${esc(f.title.replace(/^Campus Conveyance: /, ""))}</span><span class="xf-l">${esc(f.length)}</span><span class="xf-d">${esc(f.description)}</span></button></li>`).join("")}</ol>
    </div>`;

const main = `<section class="ph ph--${id}" aria-labelledby="ph-h">
  <div class="ph-top">
    <a class="ph-back" href="../">${ICON.back}<span>Aevinite</span></a>
    <span>${esc(p.kind)}</span>
    <span class="pr-st"><i aria-hidden="true"></i>${esc(p.status)}</span>
  </div>
  <h1 class="ph-h" id="ph-h"><span class="sr">${esc(p.name)}</span><span class="ph-kw liquid"></span></h1>
  <div class="ph-row">
    <p class="ph-hl">${esc(p.headline)}</p>
    <div class="ph-r">
      <p class="ph-sub">${esc(p.sub)}</p>
      <div class="ph-cta">
        <a class="btn btn--ink" href="#film">${ICON.play} Watch the film</a>
        <a class="btn btn--line" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${ICON.wa} Ask for a free demo</a>
      </div>
    </div>
  </div>
  <p class="ph-hint">${coarse ? "Touch the letters. Tap one to grow it." : "Move near the letters. Drag one up."}</p>
</section>
<section class="sec" id="film" aria-labelledby="h-film">
  ${opener("01", "The film", p.film.length)}
  <h2 class="h2 rv" id="h-film">${isCampus ? "One school morning, by the clock." : "From paper tickets to one system."}</h2>
  ${filmHTML(p.film, { big: true })}
</section>
<section class="sec" id="people" aria-labelledby="h-people">
  ${opener("02", "Every person", `${p.screens.length} screens`)}
  <h2 class="h2 rv" id="h-people">A screen for each person.</h2>
  ${whoHTML(p.screens, p.name)}
</section>
<section class="sec" id="panels" aria-labelledby="h-panels">
  ${opener("03", "Panels", `${p.panels.length} panels`)}
  <h2 class="h2 rv" id="h-panels">What each one gets.</h2>
  <ol class="pn">${p.panels.map((x, i) => `<li class="pn-i">
    <span class="pn-n">${pad2(i + 1)}</span><span class="pn-who">${esc(x.who)}</span>
    <h3 class="pn-t"><span class="pn-tw">${esc(x.title)}</span></h3>
    <p class="pn-x">${esc(x.text)}</p></li>`).join("")}</ol>
</section>
<section class="sec" id="features" aria-labelledby="h-features">
  ${opener("04", "Features", `${p.features.length} in all`)}
  <h2 class="h2 rv" id="h-features">Everything in it.</h2>
  <ol class="fe-l">${p.features.map((f, i) => `<li><span class="fe-n">${pad2(i + 1)}</span><span class="fe-t">${esc(f)}</span></li>`).join("")}</ol>
</section>
<section class="sec" id="more-films" aria-labelledby="h-more">
  ${opener("05", "More films", `${extras.length} more`)}
  <h2 class="h2 rv" id="h-more">${extras.length > 1 ? "Four more films." : "One more film."}</h2>
  ${extraBlock}
</section>
<section class="sec" id="faq" aria-labelledby="h-faq">
  ${opener("06", "Questions", `${p.faq.length} answers`)}
  <h2 class="h2 rv" id="h-faq">Questions people ask.</h2>
  <ol class="fq">${p.faq.map((q, i) => `<li class="fq-i">
    <button type="button" class="fq-b" aria-expanded="false" aria-controls="fq${i}"><span class="fq-n">${pad2(i + 1)}</span><span class="fq-q">${esc(q.q)}</span><span class="fq-x" aria-hidden="true">+</span></button>
    <div class="fq-p" id="fq${i}" inert><div class="fq-pi"><p>${esc(q.a)}</p></div></div></li>`).join("")}</ol>
</section>
<section class="sec sec--contact" id="contact">
  ${opener("07", "Demo and contact", COMPANY.city)}
  ${contactHTML()}
</section>
<nav class="nx nx--${other.id}" aria-label="More">
  <a class="nx-a" href="../${other.href}"><span class="nx-k">Next product</span><span class="nx-w" data-fit-text="${esc(other.id === "campus" ? "Conveyance" : other.name)}">${other.id === "campus" ? "<span>Campus</span><span>Conveyance</span>" : esc(other.name)}</span></a>
  <a class="nx-home" href="../">${ICON.back} Back to Aevinite</a>
</nav>`;

mountChrome(id, main);
document.documentElement.dataset.product = id;

const players = wireFilms(document, [p.film, ...extras]);
wireWho($("#people .who"), p.screens);
wireContact($("#contact"));
$$(".btn").forEach((b) => magnetic(b, 0.18));
const nx = $(".nx-w");
fit(nx, { max: () => innerHeight * 0.22, slack: 0.97 });
growOnScroll(nx);

// Extra films switcher (Campus has four).
const xfPlayer = players.find((pl) => pl.fig.closest(".xf-player")) as FilmPlayer | undefined;
$$(".xf-b").forEach((b) => b.addEventListener("click", () => {
  const i = Number(b.dataset.i);
  $$(".xf-b").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  xfPlayer?.swap(extras[i], true);
  blip(500 + i * 80);
  if (!reduced) gsap.fromTo(".xf-player .film-frame", { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.out" });
}));

// FAQ.
$$(".fq-b").forEach((b) => b.addEventListener("click", () => {
  const li = b.closest(".fq-i")!;
  const open = !li.classList.contains("open");
  li.classList.toggle("open", open);
  b.setAttribute("aria-expanded", String(open));
  $(".fq-p", li).toggleAttribute("inert", !open);
  thock(open ? 160 : 100, 0.1);
}));

fontsReady().then(() => {
  const kw = new Kinetic($(".ph-kw"), {
    rows: () => (isCampus ? ["CAMPUS", "CONVEYANCE"] : isNarrow() ? ["AEVI", "DINE"] : ["AEVIDINE"]),
    maxRowH: () => (isCampus ? (isNarrow() ? innerHeight * 0.13 : innerHeight * 0.24) : isNarrow() ? innerHeight * 0.16 : innerHeight * 0.36),
    drag: true,
    mirror: true,
    rest: [100, 700],
  });
  registerKick(() => kw.kick());
  const ck = new Kinetic($(".ct-kw"), {
    rows: () => (isNarrow() ? ["LET’S", "TALK."] : ["LET’S TALK."]),
    maxRowH: () => (isNarrow() ? innerHeight * 0.14 : innerHeight * 0.3),
    fixed: { ".": [150, 900, "dot"], "’": [100, 800, ""] },
    rest: [100, 700],
  });
  registerKick(() => ck.kick());
});
