// The Pass · home. A kitchen ticket system: the hero is printed by a thermal printer, the nav is
// a menu card, services are dishes, process is the line, work hangs on the rail, numbers are on
// the till and contact is the bill.
import "./styles.css";
import { COMPANY, FOR_WHOM, SERVICES, PROCESS, WORK, NUMBERS, FOUNDERS, MARQUEE, productById, media } from "@shared/content";
import { gsap, ScrollTrigger, $, $$, esc, pad, reduced, barcode, reels, rollReels, setReels, once, stamp as now, whileVisible } from "./lib/util";
import { initChrome, head, lamps, sun, tape, perf, order, printKOT, announce, steam, type MenuItem } from "./lib/chrome";
import { printerHTML, railHTML, spikeHTML, mountPrinter, type MiniSpec } from "./lib/printer";
import { initFilms, filmScreen, screensHTML, initScreens } from "./lib/film";
import { monitorHTML, kotChapters, boardHTML, initBoard, billHTML, initBill, bellHTML, initBell, productCopy } from "./lib/blocks";
import { kaching, printLine, stampThud, click, bell } from "./lib/sound";

const MENU: MenuItem[] = [
  { course: "Mains", label: "Aevidine and Campus", href: "#mains" },
  { course: "Chef's specials", label: "What we build", href: "#specials" },
  { course: "The line", label: "How we work", href: "#line" },
  { course: "On the rail", label: "Our work", href: "#work" },
  { course: "The till", label: "Honest numbers", href: "#till" },
  { course: "The house", label: "About us", href: "#house" },
  { course: "The bill", label: "Contact", href: "#bill" },
];

const STATIONS = ["Prep", "Cook", "Plate", "Serve"];

/* ---------------- hero ---------------- */
function ticket(i: number) {
  const n = i + 1, w = FOR_WHOM[i % FOR_WHOM.length], t = now();
  return `
    <div class="ln tk-logo"><img src="${media("aevinite-mark.webp")}" alt="" width="58" height="36"></div>
    <p class="ln tk-brand">AEVINITE</p>
    <p class="ln tk-c">Websites &middot; Software &middot; Automation</p>
    <p class="ln tk-c">${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}</p>
    <p class="ln tk-rule tk-rule--dbl" aria-hidden="true"></p>
    <p class="ln tk-kv"><span>TABLE ${pad(n)}</span><span>KOT ${pad(n, 4)}</span></p>
    <p class="ln tk-kv"><span>${t.date}</span><span>${t.time}</span></p>
    <p class="ln tk-rule" aria-hidden="true"></p>
    <h1 class="ln tk-h1"><span class="tk-qty" aria-hidden="true">1&times;</span>We help businesses grow.</h1>
    <p class="ln tk-rule" aria-hidden="true"></p>
    <p class="ln tk-kv tk-for"><span>FOR</span><span class="tk-dots" aria-hidden="true"></span><b>${w.toUpperCase()}</b></p>
    <p class="ln tk-rule" aria-hidden="true"></p>
    <p class="ln tk-note"><b>Also on the menu:</b> ${SERVICES.map((s) => s.title.toLowerCase()).join(", ")}.</p>
    <div class="ln tk-bar">${barcode(n)}</div>
    <p class="ln tk-c tk-small">*AEV-${pad(n, 4)}* &middot; THANK YOU</p>`;
}

function hero() {
  return `<section class="hero" id="hero" aria-label="Aevinite. We help businesses grow.">
    ${lamps(3, "lamps--hero")}
    <span class="hero__window" aria-hidden="true"></span>
    ${railHTML("Ticket rail. Torn tickets hang here")}
    <div class="hero__grid wrap">
      <div class="hero__copy">
        <p class="eyebrow"><span>Ahmedabad</span><span>Since 2024</span><span class="eyebrow__open"><i aria-hidden="true"></i>Kitchen open</span></p>
        <p class="sign" aria-hidden="true"><span>Order</span> <em>up.</em></p>
        <p class="hero__pitch">${esc(COMPANY.pitch)}</p>
        <p class="hero__for">On today's tickets: ${FOR_WHOM.map((w, i) => `<span class="fw${i === 0 ? " is-on" : ""}" data-i="${i}">${w}</span>`).join(", ").replace(/, (<span[^>]*>your business<\/span>)$/, " and $1")}.</p>
        <div class="hero__cta">
          <a class="btn btn--pri" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">WhatsApp the kitchen</a>
          <button class="btn btn--sec" type="button" data-open-menu>Read the menu</button>
        </div>
      </div>
      <div class="station">
        ${printerHTML("AEV-80", "Ticket printed by Aevinite")}
        <div class="station__ctl">
          <button class="btn-tear" type="button">Tear it off</button>
          <p class="station__hint">Pull the ticket down. Past the tear line, let go.</p>
        </div>
      </div>
      <aside class="hero__side" aria-label="How to play with the printer">
        <ol class="howto">
          <li><b>Pull</b> the ticket down</li>
          <li><b>Tear</b> it at the teeth</li>
          <li><b>Spike</b> a ticket from the rail</li>
        </ol>
        ${spikeHTML()}
      </aside>
    </div>
  </section>`;
}

/* ---------------- mains: the two products ---------------- */
function mains() {
  const a = productById("aevidine"), c = productById("campus");
  return `<section class="mains" id="mains">
    ${lamps(2, "lamps--mains")}${sun(1)}
    <div class="wrap">
      ${head({ course: "Course 02 · Mains", title: "Two house <em>specialities.</em>", lede: "Our own products, cooked here and served every day. Each comes with its film, chapter by chapter, and a screen for every person who uses it.", stamp: "Fresh" })}
      <article class="prod prod--aev" aria-label="${a.name}" data-case="Main No. 1">
        <div class="prod__media rv">${monitorHTML(a.film)}</div>
        ${productCopy("aevidine", "aevidine/")}
        <div class="prod__kot">${kotChapters(a.film)}</div>
        <div class="prod__screens rv">
          <p class="mini-h">Who is on shift: one screen each</p>
          ${screensHTML("aev", a.screens, { label: "Aevidine, a screen for each person", kind: "kot" })}
        </div>
      </article>
      <article class="prod prod--cc" aria-label="${c.name}" data-case="Main No. 2">
        ${productCopy("campus", "campus/")}
        <div class="prod__board">${boardHTML(c.film, { k: "Today's special", name: c.name, kind: c.kind, line: c.line })}</div>
        <div class="prod__media rv">
          <div class="platform"><p class="platform__h" aria-hidden="true"><span>Platform 1</span><span>${esc(c.film.title.replace("Campus Conveyance: ", ""))}</span></p>${filmScreen(c.film)}</div>
        </div>
        <div class="prod__screens rv">
          <p class="mini-h">Every seat on the bus: one screen each</p>
          ${screensHTML("cc", c.screens, { label: "Campus Conveyance, a screen for each person", kind: "pass" })}
        </div>
      </article>
    </div>
  </section>`;
}

/* ---------------- chef's specials: services ---------------- */
function specials() {
  return `<section class="specials" id="specials">
    ${lamps(5, "lamps--specials")}${sun(2)}
    <div class="wrap">
      ${head({ course: "Course 03 · Chef's specials", title: "Five things we <em>cook</em> for you.", lede: "Each one made to order. Add what you are hungry for and it goes on your bill at the end of the page.", stamp: "Made to order", chalk: true })}
      <div class="menu-card rv">
        <p class="menu-card__top" aria-hidden="true"><span>Chef's specials</span><span>Served all day</span></p>
        <span class="stamp menu-card__stamp" data-stamp data-rot="-12" aria-hidden="true">Made fresh</span>
        <span class="specials__bar" aria-hidden="true"></span>
        <ol class="dishes">
          ${SERVICES.map((s, i) => `<li class="dish" style="--i:${i}">
            <span class="dish__clip" aria-hidden="true"></span>
            <p class="dish__no">No. ${i + 1}</p>
            <h3 class="dish__name">${esc(s.title)}</h3>
            <span class="dish__dots" aria-hidden="true"></span>
            <button class="dish__add" type="button" aria-pressed="false" data-title="${esc(s.title)}">
              <span class="da da--l">Add to order</span><span class="da da--d">Fire it</span><span class="da da--on">On your bill</span>
            </button>
            <p class="dish__prep"><span>Prep</span>${esc(s.tag)}</p>
            <p class="dish__desc">${esc(s.desc)}</p>
            <p class="dish__ing"><span>Ingredients</span>${s.items.map(esc).join(", ")}</p>
          </li>`).join("")}
        </ol>
        <p class="menu-card__foot" aria-live="polite"><span class="mcf__n">Nothing</span> on your order yet. <a href="#bill">See the bill</a></p>
      </div>
    </div>
  </section>`;
}

/* ---------------- the line: process ---------------- */
function line() {
  return `<section class="line" id="line">
    <div class="line__stage">
      ${lamps(4, "lamps--line")}
      <div class="wrap">
        ${head({ course: "Course 04 · The line", title: "Four stations, <em>one plate.</em>", lede: "How every job moves through our kitchen. Scroll, and follow the plate down the line." })}
        <div class="line__floor">
          <div class="line__track" aria-hidden="true">
            <span class="line__rail"></span>
            <div class="plate">
              <svg viewBox="0 0 120 120"><ellipse class="plate__rim" cx="60" cy="82" rx="54" ry="20"/><ellipse class="plate__well" cx="60" cy="80" rx="36" ry="12"/>
                <image class="plate__food" href="${media("aevinite-mark.webp")}" x="34" y="56" width="52" height="32"/>
                <g class="plate__cloche"><path d="M18 80 Q20 30 60 28 Q100 30 102 80 Z"/><path class="plate__shine" d="M34 66 Q38 44 56 38"/><circle cx="60" cy="24" r="6"/></g>
              </svg>
            </div>
          </div>
          <ol class="stations">
            ${PROCESS.map((p, i) => `<li class="stn" data-i="${i}">
              <span class="stn__fire" aria-hidden="true"><i></i><i></i><i></i></span>
              <p class="stn__k"><span>Station ${p.n}</span><span>${STATIONS[i]}</span></p>
              <h3 class="stn__t">${p.title}</h3>
              <p class="stn__d">${esc(p.desc)}</p>
              <span class="stn__done" aria-hidden="true">${i === 3 ? "Served" : "Done"}</span>
            </li>`).join("")}
          </ol>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------------- on the rail: work ---------------- */
function work() {
  return `<section class="work" id="work">
    ${lamps(3, "lamps--work")}
    <div class="wrap">
      ${head({ course: "Course 05 · On the rail", title: "Tickets we have <em>cooked.</em>", lede: "Work for clients and for ourselves. Pull a ticket down off the rail to read it." })}
      <div class="wrail">
        <span class="wrail__bar" aria-hidden="true"></span>
        <div class="wrail__list" role="tablist" aria-label="Projects">
          ${WORK.map((w, i) => `<button class="wt" type="button" role="tab" id="wt-${i}" aria-selected="${i === 0}" aria-controls="wpanel" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">
            <span class="wt__clip" aria-hidden="true"></span>
            <span class="wt__no">No. ${pad(i + 1)}</span>
            <span class="wt__title">${esc(w.title)}</span>
            <span class="wt__cat">${esc(w.category)}</span>
            <span class="wt__pull" aria-hidden="true">Pull</span>
          </button>`).join("")}
        </div>
      </div>
      <div class="wread" id="wpanel" role="tabpanel" aria-labelledby="wt-0"></div>
    </div>
  </section>`;
}

function workTicket(i: number) {
  const w = WORK[i];
  const video = "video" in w ? w.video : "";
  const imgs = w.images as readonly string[];
  const link = w.link ? `<a class="btn btn--sec" href="${w.link}" ${w.link.startsWith("http") ? `target="_blank" rel="noopener"` : ""}>${w.link.startsWith("http") ? "Open it live" : "See the Aevidine page"}</a>` : "";
  return `<article class="wticket">
    <div class="wticket__media">
      <div class="wticket__frame">
        ${video
          ? `<video class="wticket__v" muted loop playsinline preload="none" poster="${imgs[0]}" width="1600" height="900" data-src="${video}" aria-label="${esc(w.title)}: the scroll story in motion"></video>`
          : `<img class="wticket__img" src="${imgs[0]}" alt="${esc(w.title)}, screenshot 1 of ${imgs.length}" width="1600" height="${w.id === "dish-explorer-4d" ? 732 : 900}" decoding="async">`}
      </div>
      ${imgs.length > 1 ? `<div class="wticket__thumbs" role="group" aria-label="Screenshots">${imgs.map((src, k) => `<button type="button" class="${k === 0 ? "is-on" : ""}" data-src="${src}" aria-label="Screenshot ${k + 1} of ${imgs.length}" aria-pressed="${k === 0}"><img src="${src}" alt="" width="160" height="90" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="wticket__text">
      <p class="wticket__k"><span>Ticket No. ${pad(i + 1)}</span><span>${esc(w.category)}</span></p>
      <h3 class="wticket__t">${esc(w.title)}</h3>
      <p class="wticket__d">${esc(w.desc)}</p>
      <p class="wticket__made"><span>Made with</span>${w.tech.map((t) => `<b>${esc(t)}</b>`).join("")}</p>
      ${link}
      <span class="wticket__stamp stamp" aria-hidden="true">Served</span>
    </div>
  </article>`;
}

/* ---------------- the till: numbers ---------------- */
function till() {
  const keys = ["Products", "Screens", "Services", "Founded"];
  return `<section class="tillsec" id="till">
    <div class="wrap">
      ${head({ course: "Course 06 · The till", title: "Honest <em>numbers.</em>", lede: "Only what is true today. You will not find an invented client count on this till.", stamp: "Checked", align: "center" })}
      <div class="till rv">
        <div class="till__head" aria-hidden="true"><span class="till__brand">AEVINITE</span><span class="till__model">Register No. 6</span><i class="till__led"></i></div>
        <div class="till__display">
          ${NUMBERS.map((n, i) => `<div class="tc" data-i="${i}" data-count="${n.count}">
            <p class="tc__v" aria-hidden="true">${reels(n.value)}</p>
            <p class="tc__l"><span class="sr-only">${n.value}: </span>${esc(n.label)}</p>
          </div>`).join("")}
        </div>
        <div class="till__deck">
          <div class="till__keys">
            ${keys.map((k, i) => `<button class="key" type="button" data-i="${i}" aria-label="Ring up: ${esc(NUMBERS[i].label)}"><span>${k}</span></button>`).join("")}
            <button class="key key--ns" type="button" aria-expanded="false" aria-controls="drawer"><span>No sale</span></button>
            <p class="till__hint">Press a key to ring it up on the tape. No sale opens the drawer.</p>
          </div>
          <div class="till__tape" aria-live="polite"><p class="tt__h">AEVINITE REGISTER</p><ol class="tt__lines"></ol></div>
        </div>
        <div class="till__drawer" id="drawer" hidden>
          <div class="drawer__coins" aria-hidden="true">${Array.from({ length: 5 }, () => "<i></i>").join("")}</div>
          <p>Nothing hidden in here. Every number on this till is real, and the year is a date, not a count.</p>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------------- the house: about ---------------- */
function house() {
  return `<section class="house" id="house">
    ${lamps(2, "lamps--house")}${sun(3)}
    <div class="wrap">
      ${head({ course: "Course 07 · The house", title: "Who runs <em>this kitchen.</em>", stamp: "Est. 2024", chalk: true })}
      <div class="house__grid">
        <div class="plaque rv">
          <p class="plaque__k">Established</p>
          <p class="plaque__d">${COMPANY.foundedLabel}</p>
          <p class="plaque__n">Aevinite</p>
          <p class="plaque__c">${COMPANY.city} &middot; ${COMPANY.region} &middot; ${COMPANY.country}</p>
        </div>
        <div class="meaning rv" data-d="0.1">
          <p class="meaning__k">On the name</p>
          <p class="meaning__t">${esc(COMPANY.meaning)}</p>
          <ol class="history" aria-label="Our history">
            <li><span>${COMPANY.foundedLabel}</span><span>Opened as ${COMPANY.formerName}, in ${COMPANY.city}</span></li>
            <li><span>${COMPANY.renamedLabel}</span><span>Renamed Aevinite</span></li>
            <li><span>Today</span><span>Websites, software and automation, plus two products of our own</span></li>
          </ol>
        </div>
        <div class="brigade">
          ${FOUNDERS.map((f, i) => `<article class="tcard rv" data-d="${0.1 * i}">
            <p class="tcard__h"><span>Time card</span><span>No. ${pad(i + 1)}</span></p>
            <h3 class="tcard__name">${esc(f.name)}</h3>
            <p class="tcard__role">${esc(f.role)}</p>
            <p class="tcard__bio">${esc(f.bio)}</p>
            <p class="tcard__links"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p>
            <button class="tcard__punch" type="button">Punch in</button>
            <span class="tcard__in" aria-hidden="true"></span>
          </article>`).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------------- the bill: contact ---------------- */
function bill() {
  return `<section class="billsec" id="bill">
    ${lamps(1, "lamps--bill")}${sun(2)}
    <div class="wrap">
      ${head({ course: "Course 08 · The bill", title: "Ready when <em>you are.</em>", lede: "No form and no account. Message, write or call, and you talk straight to the people who build it.", align: "center" })}
      <div class="bill__grid">
        ${billHTML({})}
        <div class="bill__side">
          ${bellHTML()}
          <div class="findus"><p class="findus__h">Find us</p>
            <ul>${[["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]].map(([n, h]) => `<li><a href="${h}" target="_blank" rel="noopener">${n}</a></li>`).join("")}</ul>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ================= mount ================= */
const app = document.getElementById("app")!;
app.innerHTML = `<main id="main">${hero()}${tape(MARQUEE)}${mains()}${specials()}${perf("Tear here")}${line()}${work()}${tape(MARQUEE.slice().reverse())}${till()}${house()}${perf("Tear here, keep the bill")}${bill()}</main>`;
initChrome({ home: "./", menu: MENU });

/* hero printer */
let rushN = 1;
const heroEl = $(".hero");
mountPrinter({
  root: heroEl,
  ticket,
  mini: (i): MiniSpec => ({ no: `T${pad(i + 1)}`, word: FOR_WHOM[i % FOR_WHOM.length].toUpperCase(), label: `Ticket ${i + 1}, for ${FOR_WHOM[i % FOR_WHOM.length]}` }),
  prehung: [
    { no: "Last night", word: "BRANDS", label: "Last night's ticket, for brands" },
    { no: "Last night", word: "EVENTS", label: "Last night's ticket, for events" },
  ],
  rush: () => {
    const w = FOR_WHOM[Math.floor(Math.random() * FOR_WHOM.length)];
    return { no: `Rush ${pad(rushN++)}`, word: w.toUpperCase(), label: `Rush order, for ${w}` };
  },
  onPrinted: (i) => {
    $$(".fw").forEach((s) => s.classList.toggle("is-on", Number(s.dataset.i) === i % FOR_WHOM.length));
  },
});
{
    const hs = document.createElement("span");
    hs.className = "hero__steam";
    hs.setAttribute("aria-hidden", "true");
    $(".station", heroEl).prepend(hs);
    steam(hs, [0.5, 0.18, 0.82], { rate: 0.45, size: 34, minWidth: 900 });
  }

initFilms();
initScreens();
initBoard();

/* specials: add dishes to the order */
$$<HTMLButtonElement>(".dish__add").forEach((b) => b.addEventListener("click", () => {
  const t = b.dataset.title!;
  const added = order.toggle(t);
  b.setAttribute("aria-pressed", String(added));
  b.closest(".dish")!.classList.toggle("is-ordered", added);
  if (added) printKOT([`1 × ${t.toUpperCase()}`, "FIRE: NOW", "BILL: UPDATED"]);
  else click();
  announce(added ? `${t} added to your order.` : `${t} taken off your order.`);
  if (!reduced()) gsap.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
}));
order.sub((items) => {
  const n = $(".mcf__n");
  if (n) n.textContent = items.length ? `${items.length} dish${items.length > 1 ? "es" : ""}` : "Nothing";
});

/* the line: the plate travels from station to station */
{
  const stage = $(".line__floor"), plate = $(".plate"), track = $(".line__track"), stns = $$(".stn"), cloche = $(".plate__cloche");
  let lastI = -1;
  const setStation = (i: number) => {
    if (i === lastI) return;
    const forward = i > lastI;
    lastI = i;
    stns.forEach((s, k) => { s.classList.toggle("is-here", k === i); s.classList.toggle("is-done", k < i || (k === 3 && i === 3)); });
    if (forward && i >= 0) { printLine(); if (i === 3) { bell(); } else stampThud(); }
    gsap.to(cloche, { y: i === 3 ? -46 : 0, rotation: i === 3 ? -12 : 0, duration: 0.6, ease: i === 3 ? "back.out(2)" : "power2.inOut" });
  };
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
    const run = () => (track.clientWidth - plate.clientWidth);
    const st = ScrollTrigger.create({
      trigger: ".line__stage", start: "top top", end: "+=1400", pin: true, scrub: 0.6, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(plate, { x: p * run() });
        setStation(p < 0.06 ? -1 : Math.min(3, Math.floor(p * 4.0 - 0.01 + 0.04)));
      },
    });
    return () => st.kill();
  });
  mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
    const st = ScrollTrigger.create({
      trigger: stage, start: "top 60%", end: "bottom 60%", scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(plate, { y: p * (stage.clientHeight - plate.clientHeight) });
        setStation(p < 0.04 ? -1 : Math.min(3, Math.floor(p * 4)));
      },
    });
    return () => st.kill();
  });
  mm.add("(prefers-reduced-motion: reduce)", () => { stns.forEach((s) => s.classList.add("is-done")); });
  const ps = document.createElement("span");
  ps.className = "plate__steam";
  ps.setAttribute("aria-hidden", "true");
  plate.prepend(ps);
  steam(ps, [0.5], { rate: 0.35, size: 16, minWidth: 900 });
}

/* on the rail: pull a work ticket down to read it */
{
  const tabs = $$<HTMLButtonElement>(".wt"), panel = $("#wpanel");
  let cur = -1;
  const show = (i: number, focus = false) => {
    if (i === cur) return;
    cur = i;
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; t.classList.toggle("is-pulled", k === i); });
    panel.setAttribute("aria-labelledby", tabs[i].id);
    if (focus) tabs[i].focus();
    panel.innerHTML = workTicket(i);
    const tk = $(".wticket", panel);
    const v = $<HTMLVideoElement>(".wticket__v", panel);
    if (v) whileVisible(v, () => { if (!v.src) v.src = v.dataset.src!; if (!reduced()) void v.play().catch(() => {}); }, () => v.pause(), 0.3);
    $$<HTMLButtonElement>(".wticket__thumbs button", panel).forEach((b, k, all) => b.addEventListener("click", () => {
      const img = $<HTMLImageElement>(".wticket__img", panel);
      img.src = b.dataset.src!;
      img.alt = `${WORK[i].title}, screenshot ${k + 1} of ${all.length}`;
      all.forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      if (!reduced()) gsap.fromTo(img, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.5, ease: "steps(8)" });
      printLine();
    }));
    if (!reduced()) {
      gsap.fromTo(tk, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "steps(12)", onStart: () => { printLine(); setTimeout(printLine, 200); } });
      gsap.fromTo($(".wticket__stamp", panel), { scale: 2.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, delay: 0.75, ease: "power4.in", onComplete: stampThud });
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); show((cur + 1) % tabs.length, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); show((cur - 1 + tabs.length) % tabs.length, true); }
    });
    // pull it down by hand (mouse or finger): a short tug is enough
    let y0 = 0, dragging = false, moved = 0;
    t.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") return; y0 = e.clientY; dragging = true; moved = 0; t.setPointerCapture(e.pointerId); });
    t.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      moved = Math.max(0, Math.min(70, e.clientY - y0));
      gsap.set(t, { y: moved * 0.8, rotation: (e.clientY - y0) * 0.02 });
    });
    const up = () => {
      if (!dragging) return;
      dragging = false;
      gsap.to(t, { y: 0, rotation: 0, duration: 0.8, ease: "elastic.out(1,0.4)", clearProps: "transform" });
      if (moved > 30) show(i);
    };
    t.addEventListener("pointerup", up);
    t.addEventListener("pointercancel", up);
  });
  show(0);
}

/* the till */
{
  const till = $(".till"), tape = $(".tt__lines"), drawer = $("#drawer"), ns = $<HTMLButtonElement>(".key--ns");
  const cells = $$(".tc");
  once(till, () => cells.forEach((c, i) => {
    if (c.dataset.count === "true") rollReels(c, i * 0.15);
    else $$(".reel", c).forEach((r) => { (r.firstElementChild as HTMLElement).style.transform = `translateY(${-Number(r.dataset.d) * 10}%)`; });
  }), "0px 0px -25% 0px");
  const ring = (line: string) => {
    const li = document.createElement("li");
    li.innerHTML = line;
    tape.append(li);
    while (tape.children.length > 6) tape.firstElementChild!.remove();
    if (!reduced()) gsap.fromTo(li, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.35, ease: "steps(10)" });
    printLine(true);
  };
  $$<HTMLButtonElement>(".key[data-i]").forEach((k) => k.addEventListener("click", () => {
    const i = Number(k.dataset.i), n = NUMBERS[i], c = cells[i];
    if (n.count) {
      const host = $(".tc__v", c);
      setReels(host, 0, String(n.value).length);
      setTimeout(() => setReels(host, n.value, String(n.value).length), reduced() ? 0 : 160);
    }
    if (!reduced()) gsap.fromTo(c, { y: 4 }, { y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
    ring(`<span>${esc(n.label.toUpperCase())}</span><b>${n.value}</b>`);
    click();
  }));
  ns.addEventListener("click", () => {
    const open = drawer.hidden;
    ns.setAttribute("aria-expanded", String(open));
    if (open) {
      drawer.hidden = false;
      kaching();
      ring(`<span>NO SALE</span><b>${now().time}</b>`);
      if (!reduced()) gsap.fromTo(drawer, { yPercent: -100, autoAlpha: 0.4 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: "back.out(1.4)" });
      if (!reduced()) gsap.fromTo(till, { y: -6 }, { y: 0, duration: 0.6, ease: "elastic.out(1,0.3)" });
    } else {
      click();
      if (reduced()) drawer.hidden = true;
      else gsap.to(drawer, { yPercent: -100, autoAlpha: 0, duration: 0.3, ease: "power2.in", onComplete: () => { drawer.hidden = true; } });
    }
  });
}

/* the house: punch in */
$$<HTMLButtonElement>(".tcard__punch").forEach((b) => b.addEventListener("click", () => {
  const card = b.closest(".tcard")!, inEl = $(".tcard__in", card);
  inEl.textContent = `In ${now().time}`;
  card.classList.add("is-punched");
  b.textContent = "On shift";
  b.disabled = true;
  stampThud();
  announce(`${$(".tcard__name", card).textContent} punched in.`);
  if (!reduced()) {
    gsap.timeline().to(card, { y: 18, duration: 0.18, ease: "power2.in" }).to(card, { y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
    gsap.fromTo(inEl, { scale: 2.2, autoAlpha: 0, rotation: -18 }, { scale: 1, autoAlpha: 1, rotation: -8, duration: 0.28, delay: 0.16, ease: "power4.in" });
  }
}));

initBill();
initBell();
