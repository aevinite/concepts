// /aevidine/ and /campus/: one release, on its own page. The hero deck plays the main film;
// the bonus singles swap a different film onto the turntable.
import "./styles.css";
import { COMPANY, productById, type ProductId, type Film } from "@shared/content";
import { initChrome, header, footer } from "./lib/chrome";
import { shopStageHTML, bindShopStage } from "./lib/stage";
import { tracksHTML, bindTracks, type DeckOpts } from "./lib/deck";
import { lineupHTML, bindLineup } from "./lib/release";
import { $, $$, esc, icon, reduced, gsap } from "./lib/util";
import { reveal } from "./lib/motion";
import * as snd from "./lib/sound";

const id = document.body.dataset.product as ProductId;
const P = productById(id);
const tone = P.color as "gold" | "amber";
const cat = id === "aevidine" ? "AEV 01" : "AEV 02";
const opts: DeckOpts = {
  side: "A", label: `${P.name.toUpperCase()} · ${cat} · 33⅓`, name: id === "aevidine" ? "Aevidine" : "Campus",
  mark: P.mark, tone,
};
const films: Film[] = [P.film, ...P.extraFilms];
const short = (f: Film) => { const t = f.title.replace(/^[^:]+:\s*/, ""); return t[0].toUpperCase() + t.slice(1); };
const dual = (l: string, d: string) => `<span class="only-l">${l}</span><span class="only-d">${d}</span>`;
const half = Math.ceil(P.features.length / 2);

function page() {
  return `${header("../", id)}
  <main id="main" class="prod" data-tone="${tone}">
    <section class="hero hero--prod" aria-labelledby="h1">
      <div class="hero__intro">
        <p class="kick hero__kick"><span>${cat}</span><span>LP</span><span>${esc(P.kind)}</span></p>
        <h1 class="hero__h1 hero__h1--prod" id="h1">${esc(P.headline)}</h1>
        <p class="hero__pitch">${esc(P.sub)}</p>
        <span class="sticker">${esc(P.status)}</span>
        <div class="hero__cta">
          <button type="button" class="btn btn--main" data-drop>${icon.play}<span>Drop the needle</span></button>
          <a class="btn btn--ghost" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>Book a free demo</span></a>
        </div>
        <p class="hero__how">Spin the record to scrub the film. Pick a track to jump.</p>
      </div>
      ${shopStageHTML(P.film, opts)}
    </section>

    <section class="sec sec--singles ${films.length <= 2 ? "is-few" : ""}" aria-labelledby="sg-h">
      <header class="sec__head">
        <p class="kick">${dual("Bonus singles", "B2B set")}</p>
        <h2 class="h2" id="sg-h">More films <em>from this release.</em></h2>
        <p class="sec__lede">Drop any single on the turntable above. It swaps the record and plays from the top.</p>
      </header>
      <ol class="singles">${films.map((f, i) => `<li><button type="button" class="single ${i === 0 ? "is-on" : ""}" data-i="${i}" aria-pressed="${i === 0}">
        <span class="single__sleeve"><img src="${f.poster}" alt="" width="1280" height="720" loading="lazy"><span class="single__disc" aria-hidden="true"></span></span>
        <span class="single__meta"><i>${i === 0 ? "Main film" : `Single ${i}`}</i><b>${esc(short(f))}</b><small>${esc(f.length)}</small></span>
        <span class="single__desc">${esc(f.description)}</span>
        <span class="single__on">On the deck</span>
      </button></li>`).join("")}</ol>
    </section>

    <section class="sec sec--feat" aria-labelledby="ft-h">
      <header class="sec__head">
        <p class="kick">Featuring</p>
        <h2 class="h2" id="ft-h">Everyone who <em>plays on it.</em></h2>
      </header>
      ${lineupHTML(P.screens, P.name)}
    </section>

    <section class="sec sec--credits" aria-labelledby="cr-h">
      <header class="sec__head">
        <p class="kick">${dual("Liner notes", "Who's on stage")}</p>
        <h2 class="h2" id="cr-h">Every part, <em>credited.</em></h2>
      </header>
      <ol class="credits">${P.panels.map((p) => `<li class="credit">
        <p class="credit__who">${esc(p.who)}</p>
        <div><h3 class="credit__t">${esc(p.title)}</h3><p class="credit__p">${esc(p.text)}</p></div>
      </li>`).join("")}</ol>
    </section>

    <section class="sec sec--list" aria-labelledby="tl-h">
      <div class="backcover">
        <header class="sec__head">
          <p class="kick">Full tracklist</p>
          <h2 class="h2" id="tl-h">What's <em>on the record.</em></h2>
        </header>
        <div class="fulllist">
          <ol class="fulllist__side"><li class="fulllist__h">Side A</li>${P.features.slice(0, half).map((f, i) => `<li><span>A${i + 1}</span>${esc(f)}</li>`).join("")}</ol>
          <ol class="fulllist__side"><li class="fulllist__h">Side B</li>${P.features.slice(half).map((f, i) => `<li><span>B${i + 1}</span>${esc(f)}</li>`).join("")}</ol>
        </div>
        <div class="backcover__foot" aria-hidden="true"><span class="barcode"></span><span>${cat} · ${esc(P.name)} · Pressed in Ahmedabad</span></div>
      </div>
    </section>

    <section class="sec sec--faq" aria-labelledby="fq-h">
      <header class="sec__head">
        <p class="kick">${dual("The interview", "After-party Q&amp;A")}</p>
        <h2 class="h2" id="fq-h">Questions, <em>answered.</em></h2>
      </header>
      <div class="faq">${P.faq.map((f, i) => `<details class="qa" ${i === 0 ? "open" : ""}><summary><span class="qa__n">Q${i + 1}</span><span class="qa__q">${esc(f.q)}</span><span class="qa__x" aria-hidden="true"></span></summary><p class="qa__a">${esc(f.a)}</p></details>`).join("")}</div>
    </section>

    <section class="sec sec--cta" aria-labelledby="cta-h">
      <div class="board">
        <div class="flyer flyer--cta">
          <span class="flyer__pin" aria-hidden="true"></span>
          <p class="flyer__k"><span>Now booking</span><span>Free demo</span></p>
          <h2 class="flyer__h" id="cta-h">See ${esc(P.name)} <em>played live.</em></h2>
          <p class="flyer__p">A free demo and a quote, from the people who built it.</p>
          <div class="flyer__cta">
            <a class="btn btn--main" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>WhatsApp us</span></a>
            <p class="flyer__plain"><a href="mailto:${COMPANY.email}">${esc(COMPANY.email)}</a><a href="${COMPANY.phoneHref}">${esc(COMPANY.phoneDisplay)}</a></p>
          </div>
        </div>
        <a class="backhome" href="../">${icon.back}<span>${dual("Back to the shop", "Back to the club")}</span></a>
      </div>
    </section>
  </main>
  ${footer("../", true)}`;
}

$("#app").innerHTML = page();
initChrome(10, "Side A");

const { deck, player } = bindShopStage($(".stage--shop"), P.film, "A");
$("[data-drop]").addEventListener("click", () => deck.start(0));
bindLineup($(".lu"), P.screens);
reveal();

// Bonus singles: lift the record off, press the new one, put it back, play.
let unbind: (() => void) | undefined;
const singles = $$<HTMLButtonElement>(".single");
singles.forEach((b) => b.addEventListener("click", () => {
  const i = Number(b.dataset.i), f = films[i];
  if (player.film.id === f.id) { deck.start(0); return; }
  snd.tick(0.6);
  singles.forEach((x, k) => { x.classList.toggle("is-on", k === i); x.setAttribute("aria-pressed", String(k === i)); });
  const swap = () => {
    player.load(f);
    deck.relabel(f, { ...opts, label: `${P.name.toUpperCase()} · ${i ? `SINGLE ${i}` : cat} · 33⅓` });
    const list = $(".stage--shop .tracks");
    list.outerHTML = tracksHTML(f, "A", "tracks--shop");
    unbind?.();
    unbind = bindTracks($(".stage--shop .tracks"), deck);
    $(".shop__cap span:last-child").textContent = f.length;
    deck.start(0);
  };
  const stage = $(".stage--shop");
  stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
  if (reduced()) return swap();
  gsap.to(".stage--shop .tt__rec", { y: -40, scale: 1.04, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => {
    swap();
    gsap.fromTo(".stage--shop .tt__rec", { y: -40, scale: 1.04, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" });
  } });
}));

if (!reduced()) {
  gsap.from(".hero__h1", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out" });
  gsap.from([".hero__pitch", ".hero--prod .sticker", ".hero__cta", ".hero__how"], { y: 14, opacity: 0, duration: 0.7, delay: 0.2, stagger: 0.06 });
  gsap.from(".shop__deck", { y: 40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.15 });
}
