import "./styles.css";
import { COMPANY, FOR_WHOM, SERVICES, PROCESS, WORK, NUMBERS, FOUNDERS, PRODUCTS, media } from "@shared/content";
import { gsap, ScrollTrigger, $, $$, esc, reduced, coin, onceVisible, whileVisible, icon } from "./lib/util";
import { initChrome, header, footer, scrollToEl, SOCIALS } from "./lib/chrome";
import { boardHTML, trayHTML, cardHTML, winHTML, initBoard } from "./lib/board";
import { LADDERS, SNAKES } from "./lib/data";
import { filmHTML, chaptersHTML, screensHTML, initFilms, initScreens } from "./lib/film";
import { rangoli, toran, cowrie, pawn, band, diya, lotus } from "./lib/art";
import { cowries as cowrieSound, deal, tick, climb, bell, tap } from "./lib/sound";

const [AV, CC] = PRODUCTS;

/* ------------------------------------------------------------------ hero */
const hero = () => `<section class="hero" id="top" aria-labelledby="hero-t">
  <div class="hero__toran">${toran()}</div>
  <div class="hero__rangoli" data-hero-rangoli>${rangoli(16, 300)}</div>
  <div class="hero__in" data-game>
    <div class="hero__text">
      <p class="kicker"><span class="dev" lang="hi">साँप सीढ़ी</span><span>Saap Sidi · the board game India gave the world</span></p>
      <h1 id="hero-t" class="hero__h1"><span class="hero__brand">Aevinite</span> <span class="hero__line" data-split>We help businesses grow.</span></h1>
      <div class="hero__more">
        <p class="hero__lead">Climb the ladders. We'll handle the snakes.</p>
        <p class="hero__for">For <span class="rot" aria-live="off"><span class="rot__w" data-rot>${FOR_WHOM[0]}</span></span> and the people who run them.</p>
        <p class="hero__pitch">${esc(COMPANY.pitch)}</p>
      </div>
    </div>
    ${cardHTML()}
    <div class="hero__board">${boardHTML()}</div>
    ${trayHTML()}
  </div>
  <a class="hero__skip" href="#everything" data-skip>Skip the game, show me everything ${icon.arrow}</a>
</section>`;

/* ------------------------------------------------------------------ the board, read flat */
const flat = () => `<section class="flat" id="everything" tabindex="-1" aria-labelledby="flat-t">
  ${band()}
  <div class="wrap">
    <header class="sec-head" data-rv>
      <p class="kicker">The key to the board</p>
      <h2 id="flat-t" data-split>Every ladder and every snake, read flat.</h2>
      <p class="sec-sub">No dice needed. Ladders are things we build. Snakes are problems we have already tamed, and what tamed them.</p>
    </header>
    <div class="flat__cols">
      <div class="flat__col flat__col--l" data-rv>
        <h3 class="flat__h"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2v16M14 2v16M6 5.5h8M6 10h8M6 14.5h8"/></svg>Ladders: what we build</h3>
        <ol>${LADDERS.map((l) => `<li><span class="flat__sq">${l.from_sq}<i>to</i>${l.to_sq}</span><div><b>${esc(l.label)}</b><span>${esc(l.from)}: ${esc(l.title)}</span></div></li>`).join("")}</ol>
      </div>
      <div class="flat__col flat__col--s" data-rv>
        <h3 class="flat__h"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15.5 4.5c-2-1.6-5.4-.8-5.4 1.8 0 3 5.6 2.6 5.6 6.2 0 3.2-4.6 4.4-8 2.4-2-1.2-3.6-1-4.6.2"/></svg>Snakes: problems we tame</h3>
        <ol>${SNAKES.map((s) => `<li><span class="flat__sq">${s.head}</span><div><b><s>${esc(s.label)}</s></b><span>${esc(s.from.endsWith(s.title) ? s.from : `${s.from}. ${s.title}`)}.</span></div></li>`).join("")}</ol>
      </div>
    </div>
    <nav class="flat__index" aria-label="Sections" data-rv>
      ${[["#products", "Expansion packs", "Aevidine and Campus Conveyance"], ["#services", "Five ladders", "What we build"], ["#process", "Rules of growth", "How we work"], ["#work", "Previous games", "Work"], ["#about", "Players", "Who we are"], ["#contact", "Square 100", "Contact"]]
        .map(([h, t, s], i) => `<a href="${h}"><span class="fi__n">${String(i + 1).padStart(2, "0")}</span><b>${t}</b><small>${s}</small></a>`).join("")}
    </nav>
  </div>
</section>`;

/* ------------------------------------------------------------------ expansion packs */
const pack = (p: (typeof PRODUCTS)[number], n: number) => `<article class="pack pack--${p.color}" id="pack-${p.id}" aria-labelledby="pack-${p.id}-t">
  <div class="pack__lid" data-rv>
    <p class="pack__no"><span>Expansion pack ${n}</span><span>${esc(p.kind)}</span></p>
    <div class="pack__title"><img src="${p.mark}" alt="" width="190" height="${p.id === "campus" ? 190 : 122}" loading="lazy"><h3 id="pack-${p.id}-t">${esc(p.name)}</h3></div>
    <p class="pack__head">${esc(p.headline)}</p>
    <p class="pack__sub">${esc(p.sub)}</p>
    <p class="pack__status"><span class="pack__dot"></span>${esc(p.status)}</p>
    <a class="btn btn--pack" href="${p.href}"><span>Open the ${esc(p.id === "campus" ? "Campus" : p.name)} pack</span>${icon.arrow}</a>
  </div>
  <div class="pack__film" data-rv>
    <div class="lights">${filmHTML(p.film, { label: p.film.title })}</div>
  </div>
  <div class="pack__chap" data-rv>
    <p class="chap__h">Jump to a chapter of the film</p>
    ${chaptersHTML(p.film)}
  </div>
  <div class="pack__players" data-rv>
    <p class="pack__ph">A screen for every player at the table</p>
    ${screensHTML(p.id, p.screens, `${p.name}: each person's screen`)}
  </div>
</article>`;

const packs = () => `<section class="packs" id="products" aria-labelledby="packs-t">
  ${band()}
  <div class="wrap">
    <header class="sec-head" data-rv>
      <p class="kicker">Expansion packs</p>
      <h2 id="packs-t" data-split>Two games we built and run ourselves.</h2>
      <p class="sec-sub">Besides client work, Aevinite makes its own products. Each pack comes with its film, chapters you can jump to, and the screen every person sees.</p>
    </header>
    ${pack(AV, 1)}
    ${pack(CC, 2)}
  </div>
</section>`;

/* ------------------------------------------------------------------ services: the ladder of five */
const tamesFor = (i: number) => {
  const title = SERVICES[i].title;
  const s = SNAKES.find((x) => x.title === title), l = LADDERS.find((x) => x.title === title);
  if (s) return `<p class="svc__board"><span>On the board</span>tames the snake <s>${esc(s.label)}</s></p>`;
  if (l) return `<p class="svc__board"><span>On the board</span>the ladder "${esc(l.label)}"</p>`;
  return "";
};

const services = () => `<section class="svc" id="services" aria-labelledby="svc-t">
  ${band()}
  <div class="wrap">
    <header class="sec-head" data-rv>
      <p class="kicker">What we build</p>
      <h2 id="svc-t" data-split>Five ladders, one rung at a time.</h2>
      <p class="sec-sub">Scroll and the token climbs. Each rung is something we make for you, from the first website to the systems that carry you when you grow.</p>
    </header>
    <div class="svc__body">
      <div class="svc__rail" aria-hidden="true"><div class="svc__sticky">
        <svg class="svc__ladder" viewBox="0 0 120 600" preserveAspectRatio="xMidYMid meet">
          <path class="sl__shade" d="M30 8V592M90 8V592"/>
          ${SERVICES.map((_, i) => `<path class="sl__rung" data-r="${i}" d="M30 ${540 - i * 118}H90"/>`).join("")}
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => `<path class="sl__minor" d="M30 ${598 - k * 59 - 29.5}H90"/>`).join("")}
          <path class="sl__rail" d="M30 8V592"/><path class="sl__rail" d="M90 8V592"/>
          ${SERVICES.map((_, i) => `<text class="sl__n" x="104" y="${545 - i * 118}">${i + 1}</text>`).join("")}
        </svg>
        <div class="svc__token"><img src="${media("aevinite-mark.webp")}" alt="" width="190" height="122"></div>
      </div></div>
      <ol class="svc__list">${SERVICES.map((s, i) => `<li class="svc__item" data-i="${i}">
        <span class="svc__big" aria-hidden="true">${i + 1}</span>
        <p class="svc__no">Rung ${i + 1} <span>${esc(s.tag)}</span></p>
        <h3>${esc(s.title)}</h3>
        <p class="svc__desc">${esc(s.desc)}</p>
        <ul class="svc__items">${s.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        ${tamesFor(i)}
      </li>`).join("")}</ol>
    </div>
  </div>
</section>`;

/* ------------------------------------------------------------------ process: rules + cowries */
const rules = () => `<section class="rules" id="process" aria-labelledby="rules-t">
  ${band()}
  <div class="rules__rangoli" data-rangoli>${rangoli(12, 220)}</div>
  <div class="wrap rules__in">
    <div class="rules__page" data-rv>
      <header class="rules__head">
        <p class="kicker">The rule booklet</p>
        <h2 id="rules-t" data-split>Rules of growth.</h2>
        <p class="sec-sub">Four rules, played in this order, for every business we work with.</p>
      </header>
      <ol class="rules__list">${PROCESS.map((p, i) => `<li class="rule" data-k="${i + 1}">
        <span class="rule__n">Rule ${i + 1}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        <span class="rule__stamp" aria-hidden="true">Your rule</span>
      </li>`).join("")}</ol>
    </div>
    <div class="rules__toy" data-rv>
      <p class="rules__toyh">Throw the cowries</p>
      <p class="rules__toyp">Before dice, Indian board games like Chaupar used cowrie shells. Throw four: the number that land mouth up picks a rule to read.</p>
      <div class="cowries" data-cowries>${[0, 1, 2, 3].map((i) => `<span class="cw" data-cw="${i}">${cowrie()}</span>`).join("")}</div>
      <button class="btn btn--roll" type="button" data-throw>Throw the cowries</button>
      <p class="rules__out" aria-live="polite" data-cw-out>Four shells, four rules.</p>
    </div>
  </div>
</section>`;

/* ------------------------------------------------------------------ work: previous games */
const games = () => `<section class="games" id="work" aria-labelledby="games-t">
  ${band()}
  <div class="wrap">
    <header class="sec-head" data-rv>
      <p class="kicker">Previous games</p>
      <h2 id="games-t" data-split>Boards we have already played.</h2>
      <p class="sec-sub">Real screens from real projects. Tap a stack to deal the next screen.</p>
    </header>
    <ol class="games__list">${WORK.map((w, i) => {
      const imgs = w.images.map((src, k) => `<img src="${src}" alt="${esc(`${w.title}, screen ${k + 1}`)}" width="1600" height="${w.id === "dish-explorer-4d" ? 732 : 900}" loading="lazy" decoding="async">`).join("");
      const vid = "video" in w ? `<video class="game__vid" muted playsinline loop preload="none" poster="${w.images[0]}" data-src="${w.video}" width="1600" height="900" aria-label="${esc(`${w.title}: scroll demo`)}"></video>` : "";
      const href = w.link;
      const ext = href.startsWith("http");
      return `<li class="game game--${i}" data-rv>
        <button class="game__stack" type="button" data-stack aria-label="${esc(`${w.title}: deal the next screen`)}" ${w.images.length + (vid ? 1 : 0) < 2 ? "data-single" : ""}>
          ${vid}${imgs}
          ${w.images.length + (vid ? 1 : 0) > 1 ? `<span class="game__deal">Tap to deal</span>` : ""}
        </button>
        <div class="game__txt">
          <p class="game__no">Game ${String(i + 1).padStart(2, "0")} <span>${esc(w.category)}</span></p>
          <h3>${esc(w.title)}</h3>
          <p>${esc(w.desc)}</p>
          <p class="game__pieces"><span>Pieces</span>${w.tech.map((t) => `<i>${esc(t)}</i>`).join("")}</p>
          ${href ? `<a class="game__link" href="${href}" ${ext ? 'target="_blank" rel="noopener"' : ""}><span>${ext ? "Play it live" : "Open the pack"}</span>${icon.arrow}</a>` : ""}
        </div>
      </li>`;
    }).join("")}</ol>
  </div>
</section>`;

/* ------------------------------------------------------------------ numbers: the scoreboard */
const wheels = (v: number) => String(v).split("").map((d) => `<span class="dw" data-d="${d}"><span class="dw__s">${Array.from({ length: 30 }, (_, k) => `<span>${k % 10}</span>`).join("")}</span></span>`).join("");
const scoreboard = () => `<section class="scoreb" id="numbers" aria-labelledby="score-t">
  ${band()}
  <div class="wrap">
    <header class="sec-head sec-head--row" data-rv>
      <div><p class="kicker">The scoreboard</p><h2 id="score-t" data-split>Honest numbers only.</h2></div>
      <button class="btn btn--ghost" type="button" data-reroll>Shake the scoreboard</button>
    </header>
    <ol class="scoreb__list">${NUMBERS.map((n) => `<li class="sb" data-rv>
      <button type="button" class="sb__dice" data-sb aria-label="${n.value}, ${esc(n.label)}. Tap to roll it again"><span class="sb__v" aria-hidden="true">${wheels(n.value)}</span></button>
      <p class="sb__l">${esc(n.label)}</p>
    </li>`).join("")}</ol>
  </div>
</section>`;

/* ------------------------------------------------------------------ about: players */
const about = () => `<section class="about" id="about" aria-labelledby="about-t">
  ${band()}
  <div class="wrap">
    <header class="sec-head" data-rv>
      <p class="kicker">Players</p>
      <h2 id="about-t" data-split>Two players from ${esc(COMPANY.city)}.</h2>
      <p class="sec-sub">The people who build your software are the people you talk to.</p>
    </header>
    <div class="about__players">${FOUNDERS.map((f, i) => `<article class="player player--${i + 1}" data-rv>
      <div class="player__pawn">${pawn(f.name.split(" ").map((x) => x[0]).join(""), `pawn--${i + 1}`)}</div>
      <div class="player__txt">
        <p class="player__no">Player ${i + 1} · ${esc(f.role)}</p>
        <h3>${esc(f.name)}</h3>
        <p>${esc(f.bio)}</p>
        <p class="player__links"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p>
      </div>
    </article>`).join("")}</div>
    <div class="about__lower">
      <div class="about__name" data-rv>
        <img src="${media("aevinite-mark.webp")}" alt="The Aevinite mark: an infinity loop" width="190" height="122" loading="lazy">
        <h3>What the name means</h3>
        <p>${esc(COMPANY.meaning)}</p>
      </div>
      <ol class="about__track" data-rv aria-label="The game so far">
        <li><span class="at__sq">1</span><div><b>${esc(COMPANY.foundedLabel)}</b><span>Founded as ${esc(COMPANY.formerName)} in ${esc(COMPANY.city)}, ${esc(COMPANY.region)}.</span></div></li>
        <li class="at__lad"><span class="at__sq at__sq--lad"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2v16M14 2v16M6 5.5h8M6 10h8M6 14.5h8"/></svg></span><div><b>${esc(COMPANY.renamedLabel)}</b><span>${esc(COMPANY.formerName)} became Aevinite.</span></div></li>
        <li class="at__you"><span class="at__sq">?</span><div><b>Your square</b><span>The next business on the board.</span></div></li>
      </ol>
    </div>
  </div>
</section>`;

/* ------------------------------------------------------------------ contact: square 100 */
const contact = () => `<section class="contact" id="contact" aria-labelledby="contact-t">
  ${band()}
  <div class="wrap contact__in">
    <div class="sq100" data-rv aria-hidden="true">
      <span class="sq100__n">100</span>${lotus("sq100__lotus")}
      <span class="sq100__d sq100__d--1">${diya()}</span><span class="sq100__d sq100__d--2">${diya()}</span><span class="sq100__d sq100__d--3">${diya()}</span>
    </div>
    <div class="contact__txt" data-rv>
      <p class="kicker">Square 100</p>
      <h2 id="contact-t" data-split>Your move.</h2>
      <p class="contact__lead">Tell us where your business is stuck. We will find the ladders and deal with the snakes. No forms: just message, mail or call.</p>
      <div class="contact__acts">
        <a class="btn btn--wa btn--big" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>WhatsApp us</span></a>
        <a class="contact__line" href="mailto:${COMPANY.email}">${icon.mail}<span>${COMPANY.email}</span></a>
        <a class="contact__line" href="${COMPANY.phoneHref}">${icon.phone}<span>${COMPANY.phoneDisplay}</span></a>
      </div>
      <ul class="contact__soc" aria-label="Aevinite elsewhere">${SOCIALS.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.label}</a></li>`).join("")}</ul>
    </div>
  </div>
</section>`;

/* ------------------------------------------------------------------ build */
document.getElementById("app")!.innerHTML = `${header("home")}<main>${hero()}${flat()}${packs()}${services()}${rules()}${games()}${scoreboard()}${about()}${contact()}</main>${footer("home")}${winHTML()}`;
initChrome("home");

const everything = () => {
  const t = $("#everything");
  scrollToEl(t);
  setTimeout(() => t.focus({ preventScroll: true }), 1500);
};
initBoard($("[data-game]"), { onEverything: everything });
initFilms();
initScreens();

/* rotating "for whom" word: flips like a die face */
{
  const w = $("[data-rot]");
  let i = 0;
  const next = () => {
    i = (i + 1) % FOR_WHOM.length;
    if (reduced()) { w.textContent = FOR_WHOM[i]; return; }
    gsap.timeline()
      .to(w, { rotationX: 90, opacity: 0, duration: 0.28, ease: "power2.in", transformOrigin: "50% 50% -0.5em" })
      .call(() => { w.textContent = FOR_WHOM[i]; })
      .fromTo(w, { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.45, ease: "back.out(2)" });
  };
  let t = 0;
  whileVisible(w, () => { if (!t) t = window.setInterval(next, 2400); }, () => { clearInterval(t); t = 0; });
}

/* dark world: the hero rangoli draws itself whenever the night begins */
{
  const r = $("[data-hero-rangoli]");
  const draw = () => {
    if (document.documentElement.dataset.theme !== "dark" || reduced()) return;
    gsap.fromTo($$(".rg", r), { drawSVG: "0%" }, { drawSVG: "100%", duration: 2.2, ease: "power2.out", stagger: 0.012 });
  };
  draw();
  import("@shared/theme").then(({ onTheme }) => onTheme(draw));
}

/* ------------------------------------------------------------------ services ladder climb */
{
  const items = $$(".svc__item"), tok = $(".svc__token"), rail = $(".svc__rail"), rungs = $$(".sl__rung");
  let last = -1;
  const setActive = (k: number) => {
    if (k === last) return;
    if (last >= 0 && k > last) climb(2); else if (last >= 0) tick();
    last = k;
    items.forEach((it, i) => it.classList.toggle("is-on", i === k));
    rungs.forEach((r, i) => r.classList.toggle("is-on", i <= k));
  };
  ScrollTrigger.create({
    trigger: ".svc__list", start: "top 60%", end: "bottom 60%",
    onUpdate: (st) => {
      const p = st.progress;
      const h = $(".svc__sticky", rail).clientHeight;
      gsap.to(tok, { y: -p * (472 / 600) * h, duration: reduced() ? 0 : 0.3, overwrite: true });
      setActive(Math.min(items.length - 1, Math.floor(p * items.length)));
    },
    onLeaveBack: () => setActive(0),
  });
  setActive(0);
}

/* ------------------------------------------------------------------ cowries */
{
  const box = $("[data-cowries]"), shells = $$(".cw", box), out = $("[data-cw-out]"), rulesEls = $$(".rule");
  shells.forEach((s, i) => s.classList.toggle("is-up", i % 2 === 0));
  let busy = false;
  $("[data-throw]").addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    cowrieSound();
    const ups = shells.map(() => coin());
    const k = ups.filter(Boolean).length;
    rulesEls.forEach((r) => r.classList.remove("is-picked"));
    await Promise.all(shells.map((s, i) => new Promise<void>((res) => {
      if (reduced()) { s.classList.toggle("is-up", ups[i]); res(); return; }
      const x = (Math.random() - 0.5) * 40, y = (Math.random() - 0.5) * 20, rot = Math.random() * 300 - 150;
      gsap.timeline({ onComplete: res })
        .to(s, { y: -70 - Math.random() * 40, rotation: `+=${rot}`, duration: 0.3, ease: "power2.out" })
        .call(() => s.classList.toggle("is-up", ups[i]))
        .to(s, { x, y, rotation: `+=${rot / 3}`, duration: 0.5, ease: "bounce.out" });
    })));
    if (k === 0) out.textContent = "No shell landed mouth up. In the old game that is a throw again.";
    else {
      const r = rulesEls[k - 1];
      out.textContent = `${k} mouth up: Rule ${k}, ${PROCESS[k - 1].title}. ${PROCESS[k - 1].desc}`;
      r.classList.add("is-picked");
      bell(1 + k * 0.12);
      if (!reduced()) gsap.fromTo($(".rule__stamp", r), { scale: 2.4, opacity: 0, rotation: -24 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.45, ease: "back.out(2)" });
    }
    busy = false;
  });
}

/* ------------------------------------------------------------------ work stacks: tap to deal */
{
  $$<HTMLButtonElement>("[data-stack]").forEach((st) => {
    const cards = () => $$<HTMLElement>("img, video", st);
    const lay = (instant = false) => cards().forEach((c, i) => {
      const r = [0, -3, 2.6, -1.6, 3.4][i % 5], dx = [0, -14, 12, -6, 16][i % 5], dy = i * 6;
      gsap.to(c, { rotation: r, x: dx, y: dy, zIndex: 10 - i, duration: instant || reduced() ? 0 : 0.5, ease: "power3.out" });
    });
    lay(true);
    const vid = $<HTMLVideoElement>("video", st);
    if (vid) whileVisible(st, () => { if (!vid.getAttribute("src")) vid.src = vid.dataset.src!; if (!reduced() && cards()[0] === vid) void vid.play().catch(() => {}); }, () => vid.pause(), 0.3);
    if (st.hasAttribute("data-single")) { st.tabIndex = -1; return; }
    st.addEventListener("click", () => {
      const cs = cards(), top = cs[0];
      deal();
      if (reduced()) { st.append(top); lay(true); return; }
      gsap.timeline()
        .to(top, { x: 140, y: -40, rotation: 14, duration: 0.25, ease: "power2.out" })
        .call(() => { st.insertBefore(top, $(".game__deal", st)); lay(); if (vid) { if (cards()[0] === vid) void vid.play().catch(() => {}); else vid.pause(); } });
    });
  });
}

/* ------------------------------------------------------------------ scoreboard wheels */
{
  const spin = (el: HTMLElement, random: boolean) => {
    $$(".dw", el).forEach((w, i) => {
      const d = Number(w.dataset.d), s = $(".dw__s", w);
      const target = random ? Math.floor(Math.random() * 10) + 10 : 20 + d;
      if (reduced()) { gsap.set(s, { yPercent: -(target / 30) * 100 }); return; }
      gsap.fromTo(s, { yPercent: -(Math.floor(Math.random() * 10) / 30) * 100 }, { yPercent: -(target / 30) * 100, duration: 0.9 + i * 0.18, ease: "power3.out", onStart: tick });
    });
  };
  const all = $$<HTMLElement>("[data-sb]");
  all.forEach((b) => gsap.set($$(".dw__s", b), { yPercent: 0 }));
  onceVisible($(".scoreb__list"), () => all.forEach((b, i) => setTimeout(() => spin(b, false), i * 140)), 0.4);
  all.forEach((b) => b.addEventListener("click", () => {
    spin(b, true);
    setTimeout(() => spin(b, false), 650);
    if (!reduced()) gsap.fromTo(b, { rotation: -6 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1.2,0.3)" });
  }));
  $("[data-reroll]").addEventListener("click", () => {
    tap();
    all.forEach((b, i) => { setTimeout(() => spin(b, true), i * 60); setTimeout(() => spin(b, false), 700 + i * 90); });
  });
}

void cowrie; void diya;
