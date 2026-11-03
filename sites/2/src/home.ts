// Home: the whole of Tiny Town. A drone tour over a model town (three.js) carries the story;
// the kit shelf, the census milestones and the post office follow underneath.
import "./fonts";
import "./styles/base.css";
import "./styles/home.css";
import * as THREE from "three";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { COMPANY, FOR_WHOM, MARQUEE, NUMBERS, PROCESS, SERVICES, WORK, productById, type Film } from "@shared/content";
import { $, $$, boot, header, controls, footer, esc, reveals, splitWords, odometer, openFilm, openImage, bindPreviews, oneFilmAtATime, isNarrow, isTouch, reduce, ICON, skyline } from "./core/ui";
import { play } from "./core/sound";
import { productBody, aboutBody, workBody, contactButtons, type WorkItem } from "./content-blocks";
import { mountTown } from "./town/mount";
import type { Shot, Region } from "./town/stage";
import type { LotId } from "./town/buildings";

gsap.registerPlugin(MotionPathPlugin);
boot();

const A = productById("aevidine");
const K = productById("campus");
const FILMS: Record<string, Film> = { [A.film.id]: A.film, [K.film.id]: K.film };

const PINS: { id: LotId; name: string; sub: string }[] = [
  { id: "restaurant", name: "Aevidine", sub: "The restaurant" },
  { id: "college", name: "Campus Conveyance", sub: "The college bus" },
  { id: "studio", name: "Aevinite", sub: "Our studio" },
  { id: "hospital", name: "Hospital website", sub: "Healthcare" },
  { id: "bakery", name: "Sweet Bites", sub: "3D scroll story" },
  { id: "hackathon", name: "HackJudge", sub: "Hackathons" },
  { id: "dishes", name: "4D Dish Explorer", sub: "3D web" },
  { id: "postoffice", name: "Post office", sub: "Say hello" },
];

const DISTRICTS: { lots: LotId[]; color: string; where: string }[] = [
  { lots: ["hospital", "hackathon"], color: "#4f86b5", where: "the hospital and the HackJudge hall" },
  { lots: ["restaurant", "college"], color: "#d2a640", where: "the restaurant and the college" },
  { lots: ["restaurant", "busstop"], color: "#2f8a68", where: "the kitchen printer and the bus stop" },
  { lots: ["bakery", "dishes"], color: "#d9786f", where: "Sweet Bites and the dish pavilion" },
  { lots: ["studio", "college"], color: "#7aa8a0", where: "the studio and the college" },
];

const ROUTE = ["Town", "Restaurant", "Bus", "Studio", "Map", "Road"];

/* ================================================================== markup */
const hero = `
<header class="stop stop--hero" data-stop="0">
  <div class="hero">
    <p class="kicker mono"><span class="kicker__dot" aria-hidden="true"></span>Aevinite · ${COMPANY.city} · model scale</p>
    <h1 class="h1">We help businesses grow.</h1>
    <p class="hero__lede">A whole town that runs on our software. Websites, custom software and automation for
      <span class="rot" aria-live="polite"><span class="rot__w">${FOR_WHOM[0]}</span></span>.</p>
    <p class="hero__pitch">${esc(COMPANY.pitch)}</p>
    <div class="hero__cta">
      <a class="btn btn--wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${ICON.wa}<span>Talk to us on WhatsApp</span></a>
      <a class="btn btn--ghost" href="#aevidine">Take the drone tour ${ICON.arrow}</a>
    </div>
  </div>
</header>`;

const productStop = (p: typeof A, n: number, place: string) => `
<article class="stop" data-stop="${n}" id="${p.id}">
  <div class="card card--${p.color}">
    <p class="tag"><span class="tag__no mono">Stop 0${n}</span><span>${place}</span></p>
    ${productBody(p)}
  </div>
</article>`;

const tour = `
<section class="tour" id="town" aria-label="Tiny Town, a model of what we build">
  <div class="stage">
    <div class="sky" aria-hidden="true"><span class="sky__stars"></span><span class="sky__sun"></span><span class="sky__moon"></span></div>
    <canvas class="town" role="img" aria-label="A miniature 3D town built by Aevinite. Drag sideways to spin it, click or tap a building to visit it."></canvas>
    <div class="tilt tilt--t" aria-hidden="true"></div><div class="tilt tilt--b" aria-hidden="true"></div>
    <div class="pins" role="group" aria-label="Buildings in town">${PINS.map((p) => `<button class="pin" type="button" data-lot="${p.id}"><span class="pin__dot" aria-hidden="true"></span><span class="pin__t"><b>${p.name}</b><small>${p.sub}</small></span></button>`).join("")}</div>
    <div class="callouts" aria-hidden="true"></div>
    <div class="stage__ui">
      <p class="hint"><span class="hint__icon" aria-hidden="true"><i></i></span><span class="hint__t">${isTouch() ? "Swipe sideways to spin the town. Tap a building to visit." : "Drag to spin the town. Click a building to visit."}</span></p>
      <button class="btn btn--small play-btn" type="button">Play with the town</button>
      <button class="btn btn--small play-done" type="button" hidden>Back to the page</button>
    </div>
    <nav class="route" aria-label="Drone route">${ROUTE.map((r, i) => `<button type="button" data-go="${i}"><span class="route__dot" aria-hidden="true"></span><span class="route__l">${r}</span></button>`).join("")}</nav>
  </div>
  <div class="stops">
    ${hero}
    ${productStop(A, 1, "The restaurant runs on Aevidine")}
    ${productStop(K, 2, "Follow the 7:10 bus")}
    <article class="stop" data-stop="3" id="about">
      <div class="card card--studio">
        <p class="tag"><span class="tag__no mono">Stop 03</span><span>The studio, ${COMPANY.city}</span></p>
        ${aboutBody()}
      </div>
    </article>
    <article class="stop" data-stop="4" id="services">
      <div class="card card--map">
        <p class="tag"><span class="tag__no mono">Stop 04</span><span>Up high: the town map</span></p>
        <h2 class="h2">Five districts. Five things we build.</h2>
        <p class="lede">Each district lights up on the map as you read it. Tap one to light it yourself.</p>
        <ol class="districts">${SERVICES.map(
          (s, i) => `<li class="district" data-i="${i}" style="--d:${DISTRICTS[i].color}">
            <button class="district__btn" type="button" aria-pressed="false"><span class="district__sw" aria-hidden="true"></span><span class="mono">District 0${i + 1}</span><span class="district__tag">${esc(s.tag)}</span></button>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.desc)}</p>
            <p class="district__items">${s.items.map(esc).join(" · ")}</p>
            <p class="district__where mono">On the map: ${DISTRICTS[i].where}</p>
          </li>`,
        ).join("")}</ol>
      </div>
    </article>
    <article class="stop" data-stop="5" id="process">
      <div class="card card--road">
        <p class="tag"><span class="tag__no mono">Stop 05</span><span>Road works ahead</span></p>
        <h2 class="h2">How we work: one new road, four stages.</h2>
        <p class="lede">Watch the road off the ring road get built while you read.</p>
        <ol class="steps">${PROCESS.map(
          (s, i) => `<li class="step" data-i="${i}"><button class="step__n" type="button" aria-label="Show stage ${i + 1}, ${s.title}"><span class="mono">${s.n}</span></button><div><h3>${s.title}</h3><p>${esc(s.desc)}</p><p class="step__site mono">${["On site: survey stakes and flags", "On site: the gravel bed goes down", "On site: asphalt, and a light that runs itself", "On site: new buildings move in"][i]}</p></div></li>`,
        ).join("")}</ol>
      </div>
    </article>
  </div>
</section>`;

const board = `
<section class="board" aria-label="What runs in town">
  ${skyline(5)}
  <div class="board__in">
    <p class="board__k mono">Now running in town</p>
    <div class="flaps" aria-hidden="true"></div>
    <button class="board__next" type="button" aria-label="Show the next one">${ICON.arrow}</button>
  </div>
  <p class="board__all">${MARQUEE.join(" · ")}</p>
</section>`;

const work = `
<section class="work" id="work" aria-labelledby="work-h">
  <header class="sec-head">
    <p class="mono">The kit shelf · Work</p>
    <h2 class="h2" id="work-h">More buildings we put up.</h2>
    <p class="lede">Real projects, boxed like model kits. Open a box to see what is inside.</p>
  </header>
  <ol class="kits">${WORK.map(
    (w: WorkItem, i) => `<li class="kit rv" data-id="${w.id}">
      <div class="kit__stage">
        <button class="kit__box" type="button" aria-expanded="false" aria-controls="tray-${w.id}" aria-label="Open the ${esc(w.title)} box">
          <span class="kit__lid"><img src="${w.images[0]}" alt="${esc(w.title)}" width="1600" height="900" loading="lazy" decoding="async">
          <span class="kit__band"><span class="mono">No. 0${i + 1}</span><span class="kit__cat">${esc(w.category)}</span><span class="mono">H0 · 1:87</span></span></span>
          <span class="kit__side" aria-hidden="true"></span>
        </button>
        <div class="kit__tray" id="tray-${w.id}">${
          "video" in w
            ? `<video class="tv__v" muted playsinline loop preload="none" poster="${w.images[0]}" data-src="${w.video}" aria-label="${esc(w.title)} scroll demo"></video>`
            : w.images
                .slice(1)
                .map((src, j) => `<button class="tray__shot" type="button" style="--j:${j}" data-img="${src}" data-alt="${esc(`${w.title}, screenshot ${j + 2}`)}" data-cap="${esc(w.title)}" aria-label="Open screenshot ${j + 2} larger"><img src="${src}" alt="${esc(`${w.title}, screenshot ${j + 2}`)}" width="1600" height="900" loading="lazy" decoding="async"></button>`)
                .join("")
        }</div>
      </div>
      <div class="kit__text">
        <p class="mono kit__no">Kit No. 0${i + 1} · ${esc(w.category)}</p>
        <h3>${esc(w.title)}</h3>
        <p>${esc(w.desc)}</p>
        <p class="parts"><span class="mono">Parts in the box</span> ${w.tech.map(esc).join(" · ")}</p>
        ${w.link ? `<a class="link" href="${w.link}" ${w.link.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${w.link.startsWith("http") ? "Open it live" : "See Aevidine"} ${ICON.arrow}</a>` : ""}
      </div>
    </li>`,
  ).join("")}</ol>
</section>`;

const numbers = `
<section class="numbers" id="numbers" aria-labelledby="num-h">
  <header class="sec-head">
    <p class="mono">Town census</p>
    <h2 class="h2" id="num-h">Honest numbers, set in stone.</h2>
    <p class="lede">Roadside milestones, the Indian kind. Tap one to count again.</p>
  </header>
  <ul class="stones">${NUMBERS.map(
    (n, i) => `<li class="stone rv" style="--i:${i}"><button class="stone__b" type="button" aria-label="${n.value}, ${esc(n.label)}. Count again">
      <span class="stone__cap" aria-hidden="true"></span>
      <span class="stone__n" data-v="${n.value}">${n.value}</span>
      <span class="stone__l">${esc(n.label)}</span>
    </button></li>`,
  ).join("")}</ul>
</section>`;

const contact = `
<section class="contact" id="contact" aria-labelledby="contact-h">
  <div class="po">
    <div class="po__text">
      <p class="mono">The post office · Contact</p>
      <h2 class="h2" id="contact-h">Say hello. The post office is open.</h2>
      <p class="lede">No forms to fill. Message us, write, or call, and you talk to the people who build it, in ${COMPANY.city}.</p>
      ${contactButtons()}
      <p class="po__soc">${[["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]].map(([l, h]) => `<a href="${h}" target="_blank" rel="noopener">${l}</a>`).join("")}</p>
    </div>
    <div class="po__art">
      <a class="pillar js-post" href="${COMPANY.whatsapp}" target="_blank" rel="noopener" aria-label="Post a letter: opens WhatsApp">
        <span class="pillar__cap" aria-hidden="true"></span>
        <span class="pillar__body" aria-hidden="true"><span class="pillar__slot"></span><span class="pillar__plate">POST</span><span class="pillar__hint mono">Post a letter</span></span>
        <span class="pillar__foot" aria-hidden="true"></span>
        <span class="letter" aria-hidden="true"></span>
      </a>
      <svg class="plane" viewBox="0 0 48 48" aria-hidden="true"><path d="M4 22L44 6 34 42 24 30z" /><path d="M24 30l20-24L18 27z" class="plane__fold"/></svg>
    </div>
  </div>
</section>`;

const sheet = `
<aside class="sheet" role="dialog" aria-modal="false" aria-labelledby="sheet-title" hidden>
  <div class="sheet__grip" aria-hidden="true"><i></i></div>
  <button class="icon-btn sheet__x" type="button" aria-label="Close and fly back">${ICON.close}</button>
  <div class="sheet__body"></div>
</aside>
<div class="toast" role="status" aria-live="polite"></div>`;

$("#app").innerHTML = header("", "home") + `<main id="main">${tour}${board}${work}${numbers}${contact}</main>` + footer("", "home") + sheet;
controls();
oneFilmAtATime();
{
  // A few hundred stars for the night sky, scattered once.
  let a = 17;
  const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const stars = Array.from({ length: 140 }, () => `${(r() * 100).toFixed(2)}vw ${(r() * 70).toFixed(2)}vh 0 ${r() > 0.85 ? 1 : 0}px rgba(255,244,214,${(0.35 + r() * 0.6).toFixed(2)})`);
  $(".sky__stars").style.boxShadow = stars.join(",");
}
bindPreviews();
reveals();
$$<HTMLElement>(".sec-head .h2").forEach(splitWords);
reveals();

/* ================================================================== small toys outside the town */
// Rotating "who for" word: each word drops in like a building landing.
{
  const w = $(".rot__w");
  let i = 0;
  if (!reduce)
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % FOR_WHOM.length;
      gsap.to(w, {
        yPercent: 110,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          w.textContent = FOR_WHOM[i];
          gsap.fromTo(w, { yPercent: -160, opacity: 1 }, { yPercent: 0, duration: 0.8, ease: "bounce.out" });
        },
      });
    }, 2600);
}

// Toast notes.
const toastEl = $(".toast");
let toastT = 0;
const toast = (msg: string) => {
  toastEl.textContent = msg;
  toastEl.classList.add("on");
  clearTimeout(toastT);
  toastT = window.setTimeout(() => toastEl.classList.remove("on"), 2800);
};

// Lightbox for every screenshot button.
document.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-img]");
  if (b) openImage(b.dataset.img!, b.dataset.alt ?? "", b.dataset.cap ?? "");
  const f = (e.target as HTMLElement).closest<HTMLElement>("[data-open]");
  if (f) openFilm(FILMS[f.dataset.open!]);
  const st = (e.target as HTMLElement).closest<HTMLElement>(".line--card .station");
  if (st) openFilm(FILMS[st.closest<HTMLElement>(".line")!.dataset.film!], Number(st.dataset.t));
});

// Departure board: split-flap letters flip to the next thing we build.
{
  const flaps = $(".flaps");
  const N = isNarrow() ? 12 : 16;
  flaps.innerHTML = Array.from({ length: N }, () => `<span class="flap"><span class="flap__c"> </span></span>`).join("");
  const cells = $$(".flap__c", flaps);
  let k = 0;
  const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ3&";
  const show = (word: string) => {
    const t = word.toUpperCase().padEnd(N, " ").slice(0, N);
    cells.forEach((c, i) => {
      const target = t[i];
      if (reduce) return void (c.textContent = target);
      let n = 0;
      const max = 3 + Math.floor(Math.random() * 4) + i * 0.3;
      const spin = () => {
        c.parentElement!.classList.remove("flip");
        void c.parentElement!.offsetWidth;
        c.parentElement!.classList.add("flip");
        c.textContent = n++ < max && target !== " " ? CH[Math.floor(Math.random() * CH.length)] : target;
        if (c.textContent !== target) setTimeout(spin, 55);
      };
      setTimeout(spin, i * 22);
    });
    play("tick");
  };
  const next = () => show(MARQUEE[(k = (k + 1) % MARQUEE.length)]);
  show(MARQUEE[0]);
  $(".board__next").addEventListener("click", next);
  let timer = 0;
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting && !reduce) timer = window.setInterval(() => !document.hidden && next(), 3200);
  }).observe(flaps);
}

// Kit boxes: the lid lifts and the parts fan out.
$$<HTMLButtonElement>(".kit__box").forEach((b) => {
  b.addEventListener("click", () => {
    const kit = b.closest(".kit")!;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    kit.classList.toggle("is-open", open);
    const v = $<HTMLVideoElement>("video", kit);
    if (v) {
      if (open) {
        if (!v.src) v.src = v.dataset.src!;
        v.play().catch(() => {});
      } else v.pause();
    }
    play(open ? "pop" : "click");
  });
});

// Census milestones roll their numbers when they come into view; tap to count again.
$$<HTMLElement>(".stone__n").forEach((el) => {
  const roll = odometer(el, Number(el.dataset.v));
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      roll();
      io.disconnect();
    }
  }, { threshold: 0.6 });
  io.observe(el);
  el.closest("button")!.addEventListener("click", (e) => {
    roll(2);
    play("tick");
    if (!reduce) gsap.fromTo(e.currentTarget as HTMLElement, { rotate: -4 }, { rotate: 0, duration: 0.9, ease: "elastic.out(1.4,0.3)" });
  });
});

// Post office: the letter goes in, a paper plane flies off toward WhatsApp.
$$<HTMLAnchorElement>(".js-post").forEach((a) =>
  a.addEventListener("click", () => {
    play("whoosh");
    const letter = $(".letter");
    const plane = $<SVGElement>(".plane");
    if (reduce) return;
    gsap.timeline()
      .fromTo(letter, { y: -60, opacity: 0, rotate: -8 }, { y: 0, opacity: 1, rotate: 0, duration: 0.35, ease: "power2.out" })
      .to(letter, { y: 30, scaleY: 0.2, opacity: 0, duration: 0.25, ease: "power2.in" })
      .set(plane, { opacity: 1, x: 0, y: 0, rotate: 0 })
      .to(plane, { duration: 1.6, ease: "power1.inOut", motionPath: { path: [{ x: -60, y: -120 }, { x: 80, y: -220 }, { x: -40, y: -320 }, { x: 260, y: -520 }], curviness: 1.4, autoRotate: 40 } })
      .to(plane, { opacity: 0, duration: 0.3 }, "-=0.3");
  }),
);

/* ================================================================== the town */
const stageEl = $(".stage");
const canvas = $<HTMLCanvasElement>("canvas.town");
const stops = $$<HTMLElement>(".stop");

mountTown(stageEl, canvas, "town").then(({ stage, town }) => {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const lotWorld = (id: LotId, lift = 0) => {
    const l = town.lots.get(id)!;
    return l.group.getWorldPosition(V()).add(V(0, lift * l.group.scale.y, 0));
  };
  const narrow = () => isNarrow();
  const subj = (): Region => (narrow() ? [0.03, 0.07, 0.97, 0.5] : [0.45, 0.08, 0.98, 0.92]);

  /* ---------- tour progress from the scroll position */
  let tourT = 0;
  const measure = () => {
    if (stage.playMode) return void (tourT = 0);
    const vh = innerHeight;
    let t = 0;
    for (let i = 1; i < stops.length; i++) {
      const top = stops[i].getBoundingClientRect().top;
      t += Math.min(1, Math.max(0, (vh * 1.02 - top) / (vh * 0.62)));
    }
    tourT = t;
  };

  /* ---------- shots for each stop */
  const heroShot = (): Shot => ({
    target: V(0, 0.9, 0.6),
    az: 0,
    pitch: 0.6,
    size: narrow() && !stage.playMode ? [8.4, 7.0] : [10.9, 7.7],
    region: stage.playMode ? [0.02, 0.12, 0.98, 0.86] : narrow() ? [-0.08, 0.4, 1.08, 1.0] : [0.42, 0.1, 0.94, 0.99],
  });
  const busShot = (): Shot => {
    const b = town.bus!;
    const p = b.getWorldPosition(V()).add(V(0, 0.35, 0));
    const th = b.rotation.y + stage.turntable.rotation.y;
    return { target: p, az: Math.atan2(-Math.cos(th), Math.sin(th)) + 1.15, pitch: 0.42, size: [2.4, 1.5], region: subj() };
  };
  const shots: (() => Shot)[] = [
    heroShot,
    () => ({ target: lotWorld("restaurant", 0.4), az: 0.36, pitch: 0.78, size: [2.3, 1.9], region: subj() }),
    busShot,
    () => ({ target: lotWorld("studio", 0.4), az: -0.15, pitch: 0.7, size: [1.7, 1.5], region: subj() }),
    () => ({ target: V(0, 0, 0.4), az: 0, pitch: 1.32, size: [10.7, 10.4], region: narrow() ? [0.02, 0.06, 0.98, 0.52] : [0.43, 0.04, 0.99, 0.96] }),
    () => ({ target: town.roadCentre().add(V(0, 0.35, 0)), az: 0.15, pitch: 0.58, size: [2.8, 2.0], region: subj() }),
  ];
  const lerpShot = (a: Shot, b: Shot, f: number): Shot => {
    let da = b.az - a.az;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const lift = 1 + Math.sin(f * Math.PI) * 0.55; // the drone rises between stops
    return {
      target: a.target.clone().lerp(b.target, f),
      az: a.az + da * f,
      pitch: a.pitch + (b.pitch - a.pitch) * f + Math.sin(f * Math.PI) * 0.12,
      size: [(a.size[0] + (b.size[0] - a.size[0]) * f) * lift, (a.size[1] + (b.size[1] - a.size[1]) * f) * lift],
      region: a.region.map((v, i) => v + (b.region[i] - v) * f) as Region,
    };
  };

  /* ---------- focus (a building clicked) */
  let focus: LotId | null = null;
  const focusShot = (id: LotId): Shot => {
    const l = town.lots.get(id)!;
    const r = l.radius * l.group.scale.x;
    const sheetW = Math.min(480, innerWidth * 0.42);
    return {
      target: lotWorld(id, 0.5),
      az: l.group.rotation.y + stage.turntable.rotation.y + 0.38,
      pitch: 0.48,
      size: [r * 1.3, r * 0.95],
      region: narrow() ? [0.03, 0.05, 0.97, 0.4] : [0.02, 0.08, 1 - sheetW / innerWidth - 0.02, 0.94],
    };
  };

  stage.director = () => {
    if (focus) return focusShot(focus);
    const t = Math.min(shots.length - 1, tourT);
    const i = Math.floor(t);
    const f = t - i;
    const e = f * f * (3 - 2 * f);
    const a = shots[i](), b = shots[Math.min(shots.length - 1, i + 1)]();
    return f < 0.001 ? a : lerpShot(a, b, e);
  };
  stage.canSpin = () => !focus && (tourT < 0.25 || stage.playMode);

  /* ---------- pins and callouts */
  const pinEls = new Map<string, HTMLElement>($$<HTMLElement>(".pin").map((p) => [p.dataset.lot!, p]));
  const calloutsEl = $(".callouts");
  const mk = (cls: string, text: string) => {
    const d = document.createElement("div");
    d.className = `callout ${cls}`;
    d.innerHTML = `<span>${esc(text)}</span>`;
    calloutsEl.append(d);
    return d;
  };
  type Callout = { el: HTMLElement; stop: number; at: () => THREE.Vector3; until?: number; event?: boolean };
  const callouts: Callout[] = [];
  const rest = town.lots.get("restaurant")!;
  const wp = (o: THREE.Object3D, y = 0.55) => o.getWorldPosition(V()).add(V(0, y, 0));
  callouts.push(
    { el: mk("c-gold", "Guest orders by QR"), stop: 1, at: () => wp(rest.points.table0, 0.75) },
    { el: mk("c-gold", "KOT prints in the kitchen"), stop: 1, at: () => wp(rest.points.printer, 0.45) },
    { el: mk("c-gold", "Waiter sees every table"), stop: 1, at: () => wp(rest.points.waiter, 0.7) },
  );
  const near: Callout = { el: mk("c-amber", "Your bus is 10 minutes away"), stop: 2, at: () => wp(town.bus!, 1.1), event: true, until: 0 };
  const boarded: Callout = { el: mk("c-amber", "On board. The family is told."), stop: 2, at: () => wp(town.lots.get("busstop")!.group, 1.4), event: true, until: 0 };
  callouts.push(near, boarded);
  town.on("near", () => (near.until = stage.seconds + 3.2));
  town.on("board", () => {
    boarded.until = stage.seconds + 3.2;
    near.until = 0;
  });
  const st = town.lots.get("studio")!;
  callouts.push(
    { el: mk("c-green", "Rishi"), stop: 3, at: () => wp(st.points.founder0, 0.62) },
    { el: mk("c-green", "Jenish"), stop: 3, at: () => wp(st.points.founder1, 0.6) },
  );
  const roadLabel: Callout = { el: mk("c-road", ""), stop: 5, at: () => town.roadCentre().add(V(0, 1.3, 0)) };
  callouts.push(roadLabel);

  /* ---------- services districts + process road, driven by what you are reading */
  const districtEls = $$<HTMLElement>(".district");
  const stepEls = $$<HTMLElement>(".step");
  let pickedService = -1, pickedStep = -1, shownService = -2;
  const activeService = () => {
    if (tourT < 3.55 || tourT > 4.6) return -1;
    if (pickedService >= 0) return pickedService;
    const mid = innerHeight * (narrow() ? 0.62 : 0.5);
    let best = 0, bd = 1e9;
    districtEls.forEach((d, i) => {
      const r = d.getBoundingClientRect();
      const dd = Math.abs(r.top + r.height / 2 - mid);
      if (dd < bd) (bd = dd), (best = i);
    });
    return best;
  };
  const activeStep = () => {
    if (pickedStep >= 0 && tourT > 4.5) return pickedStep;
    if (tourT < 4.55) return -1;
    let s = -1;
    stepEls.forEach((el, i) => el.getBoundingClientRect().top < innerHeight * 0.72 && (s = i));
    return Math.max(0, s);
  };
  districtEls.forEach((d, i) =>
    $(".district__btn", d).addEventListener("click", () => {
      pickedService = pickedService === i ? -1 : i;
      play("pop");
    }),
  );
  stepEls.forEach((s, i) =>
    $(".step__n", s).addEventListener("click", () => {
      pickedStep = i;
      play("pop");
    }),
  );

  /* ---------- route rail */
  const routeBtns = $$<HTMLButtonElement>(".route button");
  routeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const i = Number(b.dataset.go);
      const target = i === 0 ? 0 : stops[i].getBoundingClientRect().top + scrollY - innerHeight * 0.3;
      scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
    }),
  );

  /* ---------- per frame: tour, pins, callouts, districts, road */
  let lastStop = -1;
  stage.onFrame(() => {
    measure();
    town.showKite(tourT < 0.6 || stage.playMode);
    town.lift(focus === "restaurant" || focus === "studio" ? focus : Math.abs(tourT - 1) < 0.45 ? "restaurant" : Math.abs(tourT - 3) < 0.45 ? "studio" : null);
    const vis = !focus && (tourT < 0.3 || stage.playMode);
    stageEl.classList.toggle("pins-on", vis);
    if (vis || pinEls.size) {
      pinEls.forEach((el, id) => {
        const l = town.lots.get(id as LotId)!;
        const p = stage.project(l.group.localToWorld(l.pin.clone()));
        if (!p) return void (el.style.visibility = "hidden");
        el.style.visibility = "";
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        el.classList.toggle("pin--l", p.x > stageEl.clientWidth * 0.62);
      });
    }
    const here = Math.round(tourT);
    const now = stage.seconds;
    for (const c of callouts) {
      let on = !focus && Math.abs(tourT - c.stop) < 0.3;
      if (c.event) on = on && (c.until ?? 0) > now;
      c.el.classList.toggle("on", on);
      if (on) {
        const p = stage.project(c.at());
        if (p) c.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      }
    }
    if (here !== lastStop) {
      lastStop = here;
      routeBtns.forEach((b, i) => b.classList.toggle("is-here", i === here));
      if (here !== 4) pickedService = -1;
      if (here !== 5) pickedStep = -1;
    }
    const sv = activeService();
    if (sv !== shownService) {
      shownService = sv;
      town.setDistrict(sv >= 0 ? DISTRICTS[sv].lots : null, sv >= 0 ? DISTRICTS[sv].color : undefined);
      districtEls.forEach((d, i) => {
        d.classList.toggle("is-on", i === sv);
        $(".district__btn", d).setAttribute("aria-pressed", String(i === sv && pickedService === i));
      });
    }
    const step = activeStep();
    town.setRoad(step + 1);
    stepEls.forEach((s, i) => s.classList.toggle("is-on", i <= step));
    roadLabel.el.firstElementChild!.textContent = step >= 0 ? `Stage ${step + 1} of 4: ${PROCESS[step].title}` : "";
  });

  /* ---------- clicking buildings: fly in and open the sheet */
  const sheetEl = $(".sheet");
  const sheetBody = $(".sheet__body");
  let opener: HTMLElement | null = null;
  const WORK_BY_LOT: Partial<Record<LotId, string>> = { hospital: "hospital-website", bakery: "sweet-bites", hackathon: "hackjudge", dishes: "dish-explorer-4d" };
  const openSheet = (id: LotId) => {
    let html = "";
    if (id === "restaurant") html = `<p class="tag"><span class="tag__no mono">Lot 01</span><span>The restaurant</span></p>${productBody(A)}`;
    else if (id === "college" || id === "busstop") html = `<p class="tag"><span class="tag__no mono">Lot 02</span><span>The college and its bus</span></p>${productBody(K)}`;
    else if (id === "studio") html = `<p class="tag"><span class="tag__no mono">Lot 00</span><span>Our studio</span></p>${aboutBody()}`;
    else if (id === "postoffice") html = `<p class="tag"><span class="tag__no mono">Post office</span><span>Contact</span></p><h2 class="h2">Say hello.</h2><p class="lede">No forms. Message, write or call, and you talk to the people who build it.</p>${contactButtons()}`;
    else {
      const w = WORK.find((x) => x.id === WORK_BY_LOT[id]);
      if (!w) return;
      html = `<p class="tag"><span class="tag__no mono">Work</span><span>${esc(w.category)}</span></p>${workBody(w)}`;
    }
    focus = id === "busstop" ? "college" : id;
    sheetBody.innerHTML = html;
    const h = $(".h2", sheetBody);
    if (h) {
      h.id = "sheet-title";
      h.tabIndex = -1;
    }
    bindPreviews(sheetBody);
    sheetEl.hidden = false;
    document.documentElement.classList.add("sheet-open");
    if (!reduce) gsap.fromTo(sheetEl, narrow() ? { yPercent: 100 } : { xPercent: 104 }, { yPercent: 0, xPercent: 0, duration: 0.55, ease: "power3.out" });
    sheetBody.scrollTop = 0;
    h?.focus({ preventScroll: true });
    play("pop");
  };
  const closeSheet = () => {
    if (sheetEl.hidden) return;
    focus = null;
    $$<HTMLVideoElement>("video", sheetEl).forEach((v) => v.pause());
    const done = () => {
      sheetEl.hidden = true;
      sheetBody.innerHTML = "";
      document.documentElement.classList.remove("sheet-open");
      gsap.set(sheetEl, { clearProps: "transform" });
    };
    if (reduce) done();
    else gsap.to(sheetEl, { ...(narrow() ? { yPercent: 100 } : { xPercent: 104 }), duration: 0.35, ease: "power2.in", onComplete: done });
    opener?.focus({ preventScroll: true });
  };
  $(".sheet__x").addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => e.key === "Escape" && !$<HTMLDialogElement>(".cinema")?.open && closeSheet());
  // Drag the phone sheet down by its grip to close it.
  {
    const grip = $(".sheet__grip");
    let y0 = -1;
    grip.addEventListener("pointerdown", (e) => {
      y0 = e.clientY;
      grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener("pointermove", (e) => y0 >= 0 && gsap.set(sheetEl, { y: Math.max(0, e.clientY - y0) }));
    grip.addEventListener("pointerup", (e) => {
      if (y0 < 0) return;
      const d = e.clientY - y0;
      y0 = -1;
      if (d > 110) closeSheet();
      else gsap.to(sheetEl, { y: 0, duration: 0.3, ease: "back.out(2)" });
    });
  }

  const pick = (id: string) => {
    if (id === "train") {
      town.toot();
      return toast(`The town line carries what we build: ${MARQUEE.slice(0, 4).join(", ")} and more.`);
    }
    if (id === "kite") {
      town.kiteCut();
      play("pop");
      return toast("Kai po che! You cut the kite. It will be back.");
    }
    if (id === "busstop") play("horn");
    openSheet(id as LotId);
  };
  stage.onPick = (id) => pick(id);
  stage.onHover = (id) => {
    town.setHover(id);
    pinEls.forEach((el, k) => el.classList.toggle("hot", k === id || (id === "busstop" && k === "college")));
  };
  pinEls.forEach((el, id) => {
    el.addEventListener("click", () => {
      opener = el;
      pick(id);
    });
    el.addEventListener("pointerenter", () => town.setHover(id));
    el.addEventListener("pointerleave", () => town.setHover(null));
  });

  /* ---------- play mode on phones: the town takes the whole screen, page scroll waits */
  const playBtn = $<HTMLButtonElement>(".play-btn"), doneBtn = $<HTMLButtonElement>(".play-done");
  const setPlay = (on: boolean) => {
    stage.playMode = on;
    stageEl.classList.toggle("is-play", on);
    document.documentElement.classList.toggle("playing", on);
    playBtn.hidden = on;
    doneBtn.hidden = !on;
    if (on) doneBtn.focus();
    else {
      stage.userPitch = 0;
      playBtn.focus({ preventScroll: true });
    }
  };
  playBtn.addEventListener("click", () => setPlay(true));
  doneBtn.addEventListener("click", () => setPlay(false));

  /* ---------- go */
  measure();
  stage.snap();
  stage.kick();
  stageEl.classList.add("ready");
  town.assemble(reduce).then(() => stageEl.classList.add("built"));
  addEventListener("scroll", measure, { passive: true });
});
