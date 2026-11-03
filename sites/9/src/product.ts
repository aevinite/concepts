// An expansion pack page (/aevidine/, /campus/). Signature toy: the film's chapters are squares on a
// little board; roll the die and the token hops forward that many chapters and the film jumps
// there, with sound. As the film plays the token follows the chapter you are watching.
import "./styles.css";
import { COMPANY, PRODUCTS, productById, media, type ProductId } from "@shared/content";
import { gsap, ScrollTrigger, $, $$, esc, reduced, rollD6, wait, icon } from "./lib/util";
import { initChrome, header, footer } from "./lib/chrome";
import { filmHTML, chaptersHTML, screensHTML, initFilms, initScreens, seek, currentChapter } from "./lib/film";
import { Die, dieHTML } from "./lib/die";
import { toran, band, lotus, diya, rangoli } from "./lib/art";
import { hop, tick, tap } from "./lib/sound";

export function productPage(id: ProductId) {
  const p = productById(id);
  const n = PRODUCTS.findIndex((x) => x.id === id) + 1;
  const other = PRODUCTS.find((x) => x.id !== id)!;
  const short = id === "campus" ? "Campus" : p.name;
  const f = p.film;

  const heroS = `<section class="phero phero--${p.color}" aria-labelledby="ph-t">
    <div class="hero__toran">${toran()}</div>
    <div class="phero__rangoli" data-hero-rangoli>${rangoli(14, 260)}</div>
    <div class="phero__in wrap">
      <div class="phero__txt">
        <a class="back" href="../">${icon.back}<span>Back to the board</span></a>
        <p class="kicker">Expansion pack ${n} · ${esc(p.kind)}</p>
        <p class="phero__name"><img src="${p.mark}" alt="" width="190" height="${id === "campus" ? 190 : 122}"><span>${esc(p.name)}</span></p>
        <h1 id="ph-t" data-split>${esc(p.headline)}</h1>
        <p class="phero__sub">${esc(p.sub)}</p>
        <p class="pack__status"><span class="pack__dot"></span>${esc(p.status)}</p>
        <div class="phero__acts">
          <a class="btn btn--wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>Ask for a free demo</span></a>
          <a class="btn btn--ghost" href="#players">See every screen</a>
        </div>
      </div>
      <div class="phero__film">
        <div class="lights">${filmHTML(f, { label: f.title })}</div>
        <div class="cboard" data-cboard="${f.id}">
          <div class="cboard__track">
            ${chaptersHTML(f)}
            <span class="cboard__tok" aria-hidden="true"><img src="${media("aevinite-mark.webp")}" alt="" width="190" height="122"></span>
          </div>
          <button class="cboard__roll" type="button" data-croll>${dieHTML("die--mini")}<span><b>Roll to jump the film</b><small>The token hops that many chapters</small></span></button>
        </div>
      </div>
    </div>
  </section>`;

  const extras = `<section class="pextra" aria-labelledby="px-t">
    ${band()}
    <div class="wrap">
      <header class="sec-head" data-rv><p class="kicker">More from this pack</p><h2 id="px-t" data-split>${p.extraFilms.length > 1 ? `${p.extraFilms.length} more films.` : "One more film."}</h2></header>
      <div class="pextra__grid pextra__grid--${p.extraFilms.length}">${p.extraFilms.map((x) => `<div data-rv>${filmHTML(x, { preview: false })}</div>`).join("")}</div>
    </div>
  </section>`;

  const players = `<section class="pplayers" id="players" aria-labelledby="pp-t">
    ${band()}
    <div class="wrap">
      <header class="sec-head" data-rv><p class="kicker">Players at this table</p><h2 id="pp-t" data-split>${p.screens.length} people, ${p.screens.length} screens.</h2>
      <p class="sec-sub">Pick a pawn to see the screen that person uses.</p></header>
      <div data-rv>${screensHTML(p.id, p.screens, `${p.name}: each person's screen`)}</div>
    </div>
  </section>`;

  const panels = `<section class="ppanels" aria-labelledby="pn-t">
    ${band()}
    <div class="wrap">
      <header class="sec-head" data-rv><p class="kicker">Each player's powers</p><h2 id="pn-t" data-split>What every panel does.</h2></header>
      <ol class="powers">${p.panels.map((x, i) => `<li class="power power--${i}" data-rv>
        <span class="power__n">${i + 1}</span>
        <div><p class="power__who">${esc(x.who)}</p><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>
      </li>`).join("")}</ol>
    </div>
  </section>`;

  const cols = p.features.length > 10 ? 4 : 5;
  const feats = `<section class="pfeat" aria-labelledby="pf-t">
    ${band()}
    <div class="wrap">
      <header class="sec-head" data-rv><p class="kicker">What's in the box</p><h2 id="pf-t" data-split>${p.features.length} pieces, one board.</h2>
      <p class="sec-sub">Scroll and the token walks the board, square by square.</p></header>
      <div class="fboard" style="--cols:${cols}" data-fboard>
        <ol class="fboard__grid">${p.features.map((x, i) => {
          const row = Math.floor(i / cols), col = row % 2 ? cols - 1 - (i % cols) : i % cols;
          return `<li class="fsq" style="grid-row:${row + 1};grid-column:${col + 1}" data-i="${i}"><span class="fsq__n">${i + 1}</span><span class="fsq__t">${esc(x)}</span></li>`;
        }).join("")}</ol>
        <span class="fboard__tok" aria-hidden="true"></span>
      </div>
    </div>
  </section>`;

  const faq = `<section class="pfaq" aria-labelledby="pq-t">
    ${band()}
    <div class="wrap pfaq__in">
      <header class="sec-head" data-rv><p class="kicker">Questions at the table</p><h2 id="pq-t" data-split>Asked before every game.</h2></header>
      <div class="faq">${p.faq.map((q) => `<details class="faq__i" data-rv><summary><span>${esc(q.q)}</span><i class="faq__g" aria-hidden="true"></i></summary><p>${esc(q.a)}</p></details>`).join("")}</div>
    </div>
  </section>`;

  const cta = `<section class="contact contact--p" id="contact" aria-labelledby="pc-t">
    ${band()}
    <div class="wrap contact__in">
      <div class="sq100" data-rv aria-hidden="true">
        <span class="sq100__n">100</span>${lotus("sq100__lotus")}
        <span class="sq100__d sq100__d--1">${diya()}</span><span class="sq100__d sq100__d--2">${diya()}</span><span class="sq100__d sq100__d--3">${diya()}</span>
      </div>
      <div class="contact__txt" data-rv>
        <p class="kicker">Your move</p>
        <h2 id="pc-t" data-split>See ${esc(short)} on your own board.</h2>
        <p class="contact__lead">${esc(p.faq[p.faq.length - 1].a)}</p>
        <div class="contact__acts">
          <a class="btn btn--wa btn--big" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>WhatsApp us</span></a>
          <a class="contact__line" href="mailto:${COMPANY.email}">${icon.mail}<span>${COMPANY.email}</span></a>
          <a class="contact__line" href="${COMPANY.phoneHref}">${icon.phone}<span>${COMPANY.phoneDisplay}</span></a>
        </div>
        <p class="contact__more"><a href="../${other.href}">${icon.arrow}<span>The other pack: ${esc(other.name)}</span></a><a href="../">${icon.back}<span>Back to the board</span></a></p>
      </div>
    </div>
  </section>`;

  document.getElementById("app")!.innerHTML = `${header(id)}<main>${heroS}${extras}${players}${panels}${feats}${faq}${cta}</main>${footer(id)}`;
  initChrome(id);
  initFilms();
  initScreens();

  /* ---- the chapter board ---- */
  const cb = $("[data-cboard]"), track = $(".cboard__track", cb), tok = $(".cboard__tok", cb);
  const sqs = $$<HTMLButtonElement>(".chap__sq", cb);
  const die = new Die($(".die", cb));
  let at = 0, busy = false;
  const spot = (i: number) => {
    const b = sqs[i], tr = track.getBoundingClientRect(), r = b.getBoundingClientRect();
    return { x: r.right - tr.left - 24, y: r.top - tr.top + 24 };
  };
  const put = (i: number, animate: boolean) => {
    const s = spot(i);
    if (!animate || reduced()) gsap.set(tok, { x: s.x, y: s.y });
    else return gsap.timeline()
      .to(tok, { x: s.x, duration: 0.22, ease: "power1.inOut" }, 0)
      .to(tok, { y: s.y - 22, duration: 0.11, ease: "power2.out" }, 0)
      .to(tok, { y: s.y, duration: 0.11, ease: "power2.in" }, 0.11);
  };
  const ready = () => put(at, false);
  requestAnimationFrame(ready);
  document.fonts?.ready.then(ready);
  addEventListener("resize", ready);
  addEventListener("film:chapter", (e) => {
    const d = (e as CustomEvent<{ id: string; i: number }>).detail;
    if (d.id !== f.id || busy || d.i === at) return;
    at = d.i;
    void put(at, true);
  });
  $("[data-croll]", cb).addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    const r = rollD6();
    await die.roll(r);
    for (let k = 0; k < r; k++) {
      at = (at + 1) % sqs.length;
      hop(k);
      await put(at, true);
      if (reduced()) await wait(80);
    }
    sqs.forEach((b, i) => b.classList.toggle("is-now", i === at));
    seek(f.id, Number(sqs[at].dataset.t), false);
    busy = false;
  });
  void currentChapter;

  /* ---- feature board: the token walks as you scroll ---- */
  const fb = $("[data-fboard]"), ftok = $(".fboard__tok", fb), fsq = $$(".fsq", fb);
  let fLast = -1;
  const fput = (i: number) => {
    const el = fsq[i], r = el.getBoundingClientRect(), br = fb.getBoundingClientRect();
    gsap.to(ftok, { x: r.left - br.left + r.width - 26, y: r.top - br.top + 12, duration: reduced() ? 0 : 0.35, ease: "back.out(2)" });
  };
  ScrollTrigger.create({
    trigger: fb, start: "top 75%", end: "bottom 45%",
    onUpdate: (st) => {
      const i = Math.min(fsq.length - 1, Math.floor(st.progress * fsq.length));
      if (i === fLast) return;
      if (fLast >= 0) tick();
      fLast = i;
      fsq.forEach((s, k) => { s.classList.toggle("is-on", k === i); s.classList.toggle("is-past", k < i); });
      fput(i);
    },
  });
  requestAnimationFrame(() => fput(0));
  addEventListener("resize", () => fput(Math.max(0, fLast)));

  /* ---- night world rangoli in the hero ---- */
  const rg = $("[data-hero-rangoli]");
  const draw = () => {
    if (document.documentElement.dataset.theme !== "dark" || reduced()) return;
    gsap.fromTo($$(".rg", rg), { drawSVG: "0%" }, { drawSVG: "100%", duration: 2.2, ease: "power2.out", stagger: 0.012 });
  };
  draw();
  import("@shared/theme").then(({ onTheme }) => onTheme(draw));

  $$("details.faq__i").forEach((d) => d.addEventListener("toggle", () => { if ((d as HTMLDetailsElement).open) tap(); }));
}
