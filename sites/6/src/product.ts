// The Pass · product pages (Aevidine, Campus Conveyance). Same kitchen, the product's own
// colour: the printer prints the product's ticket, the film plays on the kitchen monitor
// (Aevidine) or beside the departures board (Campus), then every screen, every panel, every
// feature on one long receipt, the extra films, the FAQ and the bill.
import "./styles.css";
import { productById, media, MARQUEE, type ProductId } from "@shared/content";
import { gsap, $, $$, esc, pad, reduced, barcode, once, stamp as now } from "./lib/util";
import { initChrome, head, lamps, sun, tape, perf, steam, type MenuItem } from "./lib/chrome";
import { printerHTML, railHTML, spikeHTML, mountPrinter } from "./lib/printer";
import { initFilms, filmScreen, screensHTML, initScreens } from "./lib/film";
import { monitorHTML, kotChapters, boardHTML, initBoard, billHTML, initBill, bellHTML, initBell } from "./lib/blocks";
import { printLine } from "./lib/sound";

export function productPage(id: ProductId) {
  const p = productById(id);
  const isA = id === "aevidine";
  const other = productById(isA ? "campus" : "aevidine");
  const MENU: MenuItem[] = [
    { course: "The film", label: isA ? "One platform" : "The 7:10 bus", href: "#film" },
    { course: "On shift", label: "A screen for each person", href: "#screens" },
    { course: "Stations", label: "Who uses it", href: "#panels" },
    { course: "The receipt", label: "Every feature", href: "#features" },
    { course: "More films", label: isA ? "The guest menu" : "Four more", href: "#more" },
    { course: "Questions", label: "From the floor", href: "#faq" },
    { course: "The bill", label: "Free demo", href: "#bill" },
    { course: "Back to the pass", label: "Aevinite home", href: "../" },
  ];
  const who = p.screens.map((s) => s.who);

  const ticket = (i: number) => {
    const n = i + 1, t = now();
    const items = isA ? p.features.slice(0, 5) : ["Book a seat", "Pay by UPI", "Watch the bus live", "Know when your child boards", "QR pass at the door"];
    return `
      <p class="ln tk-band">${isA ? "AEVIDINE" : "CAMPUS"}<small>${isA ? "Restaurant software" : "Conveyance &middot; bus pass"}</small></p>
      <p class="ln tk-kv"><span>${isA ? `TABLE ${pad(n)}` : `PASS ${pad(n, 4)}`}</span><span>${isA ? `KOT ${pad(n, 4)}` : who[i % who.length].toUpperCase()}</span></p>
      <p class="ln tk-kv"><span>${t.date}</span><span>${t.time}</span></p>
      <p class="ln tk-rule" aria-hidden="true"></p>
      <h1 class="ln tk-h1 tk-h1--prod"><span class="tk-qty" aria-hidden="true">1&times;</span>${esc(p.headline)}</h1>
      <p class="ln tk-rule" aria-hidden="true"></p>
      ${items.map((x) => `<p class="ln tk-item"><span>1&times;</span><span>${esc(x)}</span></p>`).join("")}
      <p class="ln tk-rule" aria-hidden="true"></p>
      <p class="ln tk-kv"><span>STATUS</span><b>${esc(p.status.toUpperCase())}</b></p>
      <div class="ln tk-bar">${barcode(n + (isA ? 40 : 90))}</div>
      <p class="ln tk-c tk-small">MADE BY AEVINITE &middot; AHMEDABAD</p>`;
  };

  const hero = `<section class="hero hero--prod" id="hero" aria-label="${esc(p.name)}">
    ${lamps(3, "lamps--hero")}
    <span class="hero__window" aria-hidden="true"></span>
    ${railHTML()}
    <div class="hero__grid wrap">
      <div class="hero__copy">
        <p class="eyebrow"><span>${esc(p.kind)}</span><span class="eyebrow__open"><i aria-hidden="true"></i>${esc(p.status)}</span></p>
        <p class="sign" aria-hidden="true"><span>${isA ? "Order" : "All"}</span> <em>${isA ? "in." : "aboard."}</em></p>
        <p class="hero__pitch"><b>${esc(p.name)}.</b> ${esc(p.sub)}</p>
        <div class="hero__cta">
          <a class="btn btn--pri" href="#film">Watch the film</a>
          <a class="btn btn--sec" href="#bill">Book a free demo</a>
        </div>
        <a class="back-home" href="../"><i aria-hidden="true"></i>Back to the pass</a>
      </div>
      <div class="station">
        ${printerHTML(isA ? "AEV-KOT" : "CC-PASS", `${p.name} ticket`)}
        <div class="station__ctl">
          <button class="btn-tear" type="button">Tear it off</button>
          <p class="station__hint">Pull the ticket down. Past the tear line, let go.</p>
        </div>
      </div>
      <aside class="hero__side" aria-label="How to play with the printer">
        <ol class="howto"><li><b>Pull</b> the ticket down</li><li><b>Tear</b> it at the teeth</li><li><b>Spike</b> a ticket from the rail</li></ol>
        ${spikeHTML()}
      </aside>
    </div>
  </section>`;

  const filmSec = `<section class="psec psec--tiles" id="film">
    ${lamps(2)}${sun(1)}
    <div class="wrap">
      ${head({ course: "01 · The film", title: isA ? "One platform, <em>the whole restaurant.</em>" : "The 7:10 bus, <em>by the clock.</em>", lede: p.film.description, stamp: isA ? "Now showing" : "On time" })}
      ${isA
        ? `<div class="pfilm"><div class="rv">${monitorHTML(p.film, "Kitchen 01")}</div><div>${kotChapters(p.film)}</div></div>`
        : `<div class="pfilm pfilm--cc"><div>${boardHTML(p.film, { k: "Today's special", name: p.name, kind: p.kind, line: p.line })}</div><div class="rv"><div class="platform"><p class="platform__h" aria-hidden="true"><span>Platform 1</span><span>The 7:10 bus</span></p>${filmScreen(p.film)}</div></div></div>`}
    </div>
  </section>`;

  const screensSec = `<section class="psec psec--wood" id="screens">
    <div class="wrap">
      ${head({ course: "02 · On shift", title: `${p.screens.length} people, <em>${p.screens.length} screens.</em>`, lede: isA ? "Everyone in the restaurant gets their own screen, made for their job." : "Everyone around the bus gets their own screen, made for their part of the ride." })}
      ${screensHTML(id, p.screens, { label: `${p.name}, a screen for each person`, kind: isA ? "kot" : "pass" })}
    </div>
  </section>`;

  const panelsSec = `<section class="psec" id="panels">
    ${lamps(3)}${sun(2)}
    <div class="wrap">
      ${head({ course: "03 · Stations", title: "Who uses it, <em>and for what.</em>", chalk: true })}
      <ol class="panels">${p.panels.map((x, i) => `<li class="panel rv" data-d="${(i % 3) * 0.08}">
        <p class="panel__who"><span>${esc(x.who)}</span><span>No. ${pad(i + 1)}</span></p>
        <h3 class="panel__t">${esc(x.title)}</h3>
        <p class="panel__x">${esc(x.text)}</p>
      </li>`).join("")}</ol>
    </div>
  </section>`;

  const featSec = `<section class="psec psec--steel" id="features">
    <div class="wrap fgrid">
      ${head({ course: "04 · The receipt", title: `Everything <em>on the ticket.</em>`, lede: `${p.features.length} things ${p.name} does, printed in full. Nothing hidden in the small print.`, stamp: "Itemised" })}
      <div class="freceipt" data-receipt>
        <p class="freceipt__h"><span>${esc(p.name)}</span><span>Features</span></p>
        <ol>${p.features.map((f) => `<li><span>${esc(f)}</span></li>`).join("")}</ol>
        <p class="freceipt__t"><span>ITEMS</span><span>${p.features.length}</span></p>
        <div class="tk-bar">${barcode(isA ? 7 : 11)}</div>
      </div>
    </div>
  </section>`;

  const moreSec = `<section class="psec psec--terrazzo" id="more">
    <div class="wrap">
      ${head({ course: "05 · More films", title: isA ? "From the table <em>to the kitchen.</em>" : "Four more <em>mornings.</em>", lede: isA ? "The long version of what a guest sees." : "Same series as the 7:10 bus. Pick one and press play." })}
      <div class="extras ${p.extraFilms.length === 1 ? "extras--one" : ""}">
        ${p.extraFilms.map((f, i) => `<figure class="extra rv" data-d="${(i % 2) * 0.1}">
          ${filmScreen(f, { preview: false })}
          <figcaption><p class="extra__k">Film ${pad(i + 2)} &middot; ${esc(f.length)}</p><p class="extra__t">${esc(f.title.replace(/^[^:]+: /, ""))}</p><p class="extra__d">${esc(f.description)}</p></figcaption>
        </figure>`).join("")}
      </div>
    </div>
  </section>`;

  const faqSec = `<section class="psec" id="faq">
    ${lamps(2)}${sun(3)}
    <div class="wrap">
      ${head({ course: "06 · Questions", title: "Asked at <em>the counter.</em>", align: "center", chalk: true })}
      <div class="faq">${p.faq.map((f, i) => `<details class="rv"><summary data-n="Q${pad(i + 1)}">${esc(f.q)}</summary><p class="faq__a">${esc(f.a)}</p></details>`).join("")}</div>
    </div>
  </section>`;

  const billSec = `<section class="billsec" id="bill">
    ${lamps(1, "lamps--bill")}${sun(2)}
    <div class="wrap">
      ${head({ course: "07 · The bill", title: "See it running <em>at your place.</em>", lede: "Free demo and a quote. Message, write or call: you talk straight to the people who build it.", align: "center" })}
      <div class="bill__grid">
        ${billHTML({ table: isA ? "Your restaurant" : "Your college", items: [["1 × Free demo", "0.00"], ["1 × Quote", "free"]] })}
        <div class="bill__side">${bellHTML()}</div>
      </div>
      <div class="cta-home">
        <a class="btn btn--sec" href="../">Back to the pass</a>
        <a class="btn btn--sec" href="../${other.href}">Next course: ${esc(other.name)}</a>
      </div>
    </div>
  </section>`;

  const app = document.getElementById("app")!;
  app.innerHTML = `<main id="main">${hero}${tape(MARQUEE)}${filmSec}${screensSec}${panelsSec}${featSec}${moreSec}${perf("Tear here")}${faqSec}${perf("Tear here, keep the bill")}${billSec}</main>`;
  initChrome({ home: "../", menu: MENU });

  const heroEl = $(".hero");
  let rushN = 1;
  mountPrinter({
    root: heroEl,
    ticket,
    mini: (i) => ({ no: isA ? `T${pad(i + 1)}` : `Pass ${pad(i + 1)}`, word: who[i % who.length].toUpperCase(), label: `Ticket ${i + 1}, ${who[i % who.length]}` }),
    prehung: [{ no: "Last night", word: who[1].toUpperCase(), label: `Last night's ticket, ${who[1]}` }],
    rush: () => {
      const w = who[Math.floor(Math.random() * who.length)];
      return { no: `Rush ${pad(rushN++)}`, word: w.toUpperCase(), label: `Rush order, ${w}` };
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
  initBill();
  initBell();

  // the feature receipt prints itself when it comes into view
  const rec = $("[data-receipt]");
  if (rec && !reduced()) {
    const rows = $$("li", rec);
    gsap.set(rows, { autoAlpha: 0 });
    once(rec, () => {
      rows.forEach((r, i) => gsap.to(r, { autoAlpha: 1, duration: 0.01, delay: 0.1 + i * 0.09, onStart: () => { if (i % 2 === 0) printLine(true); } }));
      gsap.fromTo(rec, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.1 + rows.length * 0.09 + 0.3, ease: `steps(${rows.length + 3})`, clearProps: "clipPath" });
    }, "0px 0px -20% 0px");
  }
  void media;
}
