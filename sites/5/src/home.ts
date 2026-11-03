// Concept 5 · Panels: the home page is issue #1 of "The adventures of Aevinite".
import { COMPANY, FOUNDERS, FOR_WHOM, NUMBERS, PROCESS, SERVICES, WORK, media, productById } from "@shared/content";
import { initChrome, footerHTML, pageCounter } from "./lib/chrome";
import { bookHTML, initBook } from "./lib/book";
import { panel, page, storyHead } from "./lib/panel";
import { device } from "./lib/devices";
import { tvHTML, initFilms } from "./lib/film";
import { revealPanels, initPow, countUp } from "./lib/fx";
import { initReader, workHTML } from "./lib/rack";
import { CAST, EMBLEMS, PROCESS_ART, bust, burstPath, cityDawn, coverArt, face, focusLines, infinity, kitchenWall, homeScene, lostTicketScene, printer, rays, restaurantScene, silhouette, windowScene, stopScene, cabScene, boardScene } from "./lib/art";
import { $, $$, esc } from "./lib/util";
import { sfx } from "./lib/sound";

const NAV = [
  { label: "Aevidine", href: "aevidine/" },
  { label: "Campus", href: "campus/" },
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];
initChrome({ base: "./", nav: NAV });

const AV = productById("aevidine"), CC = productById("campus");
const scr = (p: typeof AV | typeof CC, who: string) => p.screens.find((s) => s.who === who)!;

/* ------------------------------ hero: the cover ------------------------------ */
const hero = `<section class="hero" data-page="1" aria-label="Issue number 1, the cover">
  ${bookHTML({
    accent: "brand",
    issue: "No. 1",
    kicker: "The adventures of",
    mast: COMPANY.name,
    line: COMPANY.line,
    starring: FOR_WHOM,
    art: coverArt(),
    ghosts: [{ mast: "Aevidine", kicker: "Special No. 1", href: "aevidine/", tone: "gold" }, { mast: "Campus Conveyance", kicker: "Special No. 1", href: "campus/", tone: "amber" }],
    logo: media("aevinite-mark.webp"),
    burst: "Made in Ahmedabad!",
    backTitle: "Inside cover",
    backLine: COMPANY.pitch,
    cast: [
      { name: "The owner", b: CAST.owner("happy") }, { name: "The cook", b: CAST.cook("calm") }, { name: "The waiter", b: CAST.waiter("talk") },
      { name: "The parent", b: CAST.parent("relief") }, { name: "The student", b: CAST.student("happy") }, { name: "The driver", b: CAST.driver("calm") },
    ],
    indicia: `AEVINITE, Vol. 1, No. 1. Published by Aevinite, ${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}. First printed on ${COMPANY.foundedLabel} under the name ${COMPANY.formerName}. Renamed Aevinite on ${COMPANY.renamedLabel}. Free to read, free to share.`,
    contents: [
      { pg: "2", label: "The Friday Night Rush", sub: "starring Aevidine", href: "#rush" },
      { pg: "6", label: "The 7:10 Bus", sub: "starring Campus Conveyance", href: "#bus" },
      { pg: "10", label: "Meet the team of powers", sub: "five things we build", href: "#services" },
      { pg: "12", label: "Four panels of progress", sub: "how we work", href: "#process" },
      { pg: "14", label: "Previous issues", sub: "our work", href: "#work" },
      { pg: "16", label: "The origin story", sub: "who we are", href: "#about" },
      { pg: "18", label: "Letters page", sub: "write to us", href: "#contact" },
    ],
    note: "The people in these stories are drawn. The screens in their hands are real: Aevidine and Campus Conveyance are two products of our own.",
    start: { label: "Start reading", href: "#rush" },
  })}
  <aside class="hero-side hs-right" aria-hidden="true">
    <p class="hs-hand">Grab the edge<br>and turn it!</p>
    <svg class="hs-arrow" viewBox="0 0 120 80"><path d="M110 10 C80 6 40 20 22 58"/><path d="M8 46 L22 62 L36 46"/></svg>
  </aside>
  <a class="skip-read" href="#rush">Skip the cover, start reading</a>
</section>`;

/* ------------------------------ story 1: the Friday night rush ------------------------------ */
const g = (inner: string, vb = "0 0 800 450", par = "xMidYMid slice") => `<svg class="art scene" viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true">${inner}</svg>`;

const rush = `<section class="story" id="rush" data-page="2" aria-labelledby="rush-t">
  ${storyHead("rush-t", "Story one · starring Aevidine", "The Friday Night Rush", AV.line, "gold")}
  ${page([
    panel({ span: 4, ard: "16/9", ar: "3/2", label: "A full restaurant on a Friday night", art: restaurantScene(),
      caps: [{ text: "Friday, 9:04 pm. Every table in the house is full.", pos: "left:2.5%;top:3.5%;max-width:46%" }],
      bubbles: [{ text: "Excuse me! Our order?", pos: "left:3%;top:30%;width:25%", tail: "bl" }, { text: "Is that our naan?", pos: "right:3%;top:26%;width:22%", tail: "br", cls: "dt-only" }],
      sfx: [{ text: "CLATTER!", pos: "left:52%;top:16%", rot: -10, size: 7 }] }),
    panel({ span: 2, ar: "4/3", label: "A paper kitchen ticket falling under the counter", art: lostTicketScene(),
      caps: [{ text: "Somewhere between table 4 and the kitchen, a paper KOT slips away.", pos: "left:4%;top:4%;right:4%" }],
      sfx: [{ text: "flutter...", pos: "right:8%;bottom:28%", rot: 12, size: 7, cls: "sfx-soft" }] }),
  ])}
  ${page([
    panel({ span: 2, ard: "1/1", ar: "1/1", label: "The cook, confused", art: kitchenWall(`<g transform="translate(272 194) scale(1.27)">${bust(CAST.cook("worried", -1))}</g>`),
      bubbles: [{ text: "Table 4? I never got table 4!", pos: "left:6%;top:6%;width:54%", tail: "br" }] }),
    panel({ span: 2, ar: "1/1", label: "The owner, panicking", art: g(`<rect class="f-red-bg ns" width="800" height="450"/><path class="f-focus2 ns" d="${focusLines(400, 260, 800, 450, 70, 12)}"/><g transform="translate(272 194) scale(1.27)">${bust(CAST.owner("panic"))}</g>`),
      bubbles: [{ text: "Six different things, and we still lose an order!", pos: "right:5%;top:5%;width:58%", tail: "bl" }] }),
    panel({ span: 2, ar: "1/1", cls: "splash gold", label: "Enter Aevidine", art: g(`<rect class="f-gold-bg ns" width="800" height="450"/><path class="f-rays2 ns" d="${rays(400, 225, 26)}"/><path class="f-burst" d="${burstPath(400, 225, 150, 230, 18, 8)}"/>`),
      caps: [{ text: "Then, one system.", pos: "left:5%;top:5%" }, { text: "QR ordering, the kitchen screen and KOT, live tables, GST bills and reports. One system instead of six different things.", pos: "left:5%;bottom:5%;right:5%", cls: "cap-light" }],
      html: `<p class="splash-word" aria-hidden="true">AEVIDINE!</p>` }),
  ], "tight")}
  ${page([
    panel({ span: 3, ard: "4/3", ar: "4/3", label: "A guest orders from her phone", art: g(`<rect class="f-blue-bg ns" width="800" height="600"/><rect class="f-dots ns" width="800" height="600" opacity=".5"/><rect class="f-white" x="-10" y="470" width="820" height="140"/><g transform="translate(70 270) scale(1.6)">${bust(CAST.guest("happy", 1))}</g>`, "0 0 800 600"),
      devs: [{ html: device("phone", scr(AV, "Guest").img, "Aevidine guest menu on a phone: categories, dishes and prices"), pos: "left:57%;top:7%;width:27%", cls: "tilt-r" }],
      caps: [{ text: scr(AV, "Guest").line, pos: "left:3%;top:3.5%;max-width:48%" }],
      sfx: [{ text: "TAP!", pos: "left:46%;top:56%", rot: -12, size: 9, sound: "pow" }] }),
    panel({ span: 3, ar: "4/3", label: "The kitchen screen gets the order and the printer prints the KOT", art: kitchenWall(`${printer(110, 300, 0.9)}<g transform="translate(560 248) scale(1.02)">${bust(CAST.cook("happy", -1))}</g>`),
      devs: [{ html: device("tablet", scr(AV, "Kitchen").img, "Aevidine kitchen screen with new orders and a printed kitchen ticket"), pos: "left:16%;top:8%;width:56%" }],
      caps: [{ text: scr(AV, "Kitchen").line, pos: "left:3%;bottom:3.5%;max-width:52%" }],
      bubbles: [{ text: "Table 4. Got it!", pos: "right:3%;top:30%;width:24%", tail: "b" }],
      sfx: [{ text: "DING!", pos: "right:4%;top:5%", rot: 10, size: 11, sound: "ding" }, { text: "KA-CHUNK", pos: "left:2%;top:46%", rot: -14, size: 6.5, sound: "chunk" }] }),
  ])}
  ${page([
    panel({ span: 3, ard: "4/3", ar: "4/3", label: "The waiter sees every table live", art: g(`<rect class="f-yel-bg ns" width="800" height="600"/><path class="f-focus ns" d="${focusLines(400, 220, 800, 600, 50, 15)}"/><g transform="translate(250 60) scale(1.5)">${bust(CAST.waiter("talk", 1))}</g>`, "0 0 800 600"),
      devs: [{ html: device("tablet", scr(AV, "Waiter").img, "Aevidine waiter table view: each table's status in colour"), pos: "left:6%;top:47%;width:60%", cls: "tilt-l" }],
      caps: [{ text: scr(AV, "Waiter").line, pos: "right:3%;bottom:4%;max-width:30%" }],
      bubbles: [{ text: "T4 is cooking. T1 just ordered.", pos: "right:3%;top:4%;width:30%", tail: "bl" }],
      sfx: [{ text: "SWOOSH", pos: "left:3%;top:8%", rot: -8, size: 6.5, sound: "swish" }] }),
    panel({ span: 3, ar: "4/3", label: "A bill with GST worked out", art: g(`<rect class="f-grn-bg ns" width="800" height="600"/><rect class="f-dots ns" width="800" height="600" opacity=".5"/><g transform="translate(470 250) scale(1.45)">${bust(CAST.manager("happy", -1))}</g>`, "0 0 800 600"),
      devs: [{ html: device("receipt", scr(AV, "Manager").img, "An Aevidine tax invoice with CGST and SGST worked out"), pos: "left:9%;top:6%;width:33%", cls: "tilt-l" }],
      caps: [{ text: scr(AV, "Manager").line, pos: "right:3%;top:4%;max-width:46%" }],
      sfx: [{ text: "KA-CHING!", pos: "left:42%;top:40%", rot: -10, size: 8, sound: "ding" }] }),
  ])}
  ${page([
    panel({ span: 6, ard: "21/9", ar: "4/3", cls: "wide-home", label: "Later, the owner relaxes at home and checks the day on a laptop", art: homeScene() + `<svg class="art scene over" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g transform="translate(318 132) scale(1.3)">${bust(CAST.owner("relief"))}</g></svg>`,
      devs: [{ html: device("laptop", scr(AV, "Owner").img, "Aevidine owner reports on a laptop: the day's sales chart"), pos: "left:41%;top:57%;width:21%" }],
      caps: [{ text: "Later. Home. Feet up.", pos: "left:2%;top:4%" }, { text: scr(AV, "Owner").line, pos: "right:2%;bottom:5%;max-width:28%" }],
      bubbles: [{ text: "Friday, handled.", pos: "left:64%;top:10%;width:18%", tail: "bl" }] }),
  ])}
  <div class="tv-panel panel pow-zone" data-page="5">
    <div class="tvp-head"><p class="tvp-k">On TV tonight</p><h3 class="tvp-t">Watch the whole Aevidine episode</h3></div>
    ${tvHTML(AV.film, { label: "Watch the episode", chapterTitle: "Chapters of the Aevidine film" })}
    <a class="btn btn-gold tvp-more" href="aevidine/">Read the Aevidine special issue</a>
  </div>
</section>`;

/* ------------------------------ story 2: the 7:10 bus ------------------------------ */
const busStory = `<section class="story" id="bus" data-page="6" aria-labelledby="bus-t">
  ${storyHead("bus-t", "Story two · starring Campus Conveyance", "The 7:10 Bus", CC.line, "amber")}
  ${page([
    panel({ span: 3, ard: "4/3", ar: "4/3", label: "A worried parent at the window at 7:05", art: windowScene(),
      caps: [{ text: "7:05 am. The bus is due at 7:10.", pos: "right:3%;bottom:4%;max-width:40%" }],
      bubbles: [{ text: "Where is the bus?", pos: "left:4%;top:5%;width:30%", tail: "br", big: true }] }),
    panel({ span: 3, ar: "4/3", label: "A student waits at the bus stop", art: stopScene(),
      caps: [{ text: "At the stop, nobody knows where the bus is.", pos: "left:3%;bottom:4%;max-width:50%" }],
      bubbles: [{ text: "Is it even coming?", pos: "left:6%;top:6%;width:30%", think: true }] }),
  ])}
  ${page([
    panel({ span: 2, ard: "3/4", ar: "4/5", label: "The driver goes online", art: cabScene(),
      devs: [{ html: device("phone", scr(CC, "Driver").img, "Campus Conveyance driver app: online, with the live map"), pos: "left:6%;top:47%;width:30%", cls: "tilt-l" }],
      caps: [{ text: "The driver goes online. His phone becomes the bus, live on every map.", pos: "left:4%;top:3%;right:4%" }],
      bubbles: [{ text: "Online. Let's roll!", pos: "right:4%;top:28%;width:40%", tail: "bl" }],
      sfx: [{ text: "VROOM!", pos: "right:5%;bottom:6%", rot: -8, size: 10 }] }),
    panel({ span: 2, ar: "4/5", label: "The parent's phone buzzes: your bus is 10 minutes away", art: g(`<rect class="f-blue-bg ns" width="600" height="800"/><path class="f-focus2 ns" d="${focusLines(300, 340, 600, 800, 60, 41)}"/>`, "0 0 600 800"),
      devs: [{ html: device("phone", scr(CC, "Parent").img, "Campus Conveyance parent app with the notification: your bus is 10 min away"), pos: "left:26%;top:12%;width:48%", cls: "buzz" }, { html: device("note", scr(CC, "Parent").img, "Notification: your bus is 10 min away", "campus-screens/parent-note"), pos: "left:5%;top:62%;width:90%", cls: "tilt-r" }],
      caps: [{ text: "Then the phone buzzes.", pos: "left:4%;top:3%" }],
      sfx: [{ text: "BZZT!", pos: "right:4%;top:4%", rot: 12, size: 10, sound: "buzz" }] }),
    panel({ span: 2, ar: "4/5", label: "The student boards and her QR pass is scanned at the door", art: boardScene(),
      devs: [{ html: device("phone", scr(CC, "Student").img, "Campus Conveyance student app: seat booking and pass"), pos: "left:58%;top:10%;width:32%", cls: "tilt-r" }],
      caps: [{ text: "A QR scan at the bus door.", pos: "left:4%;top:3%;max-width:50%" }],
      sfx: [{ text: "BEEP!", pos: "left:6%;top:20%", rot: -12, size: 13, sound: "beep" }] }),
  ], "tight")}
  ${page([
    panel({ span: 3, ard: "4/3", ar: "4/3", label: "The parent, relieved", art: g(`<rect class="f-yel-bg ns" width="800" height="600"/><path class="f-rays2 ns" d="${rays(400, 330, 24)}"/><g transform="translate(252 210) scale(1.95)">${bust(CAST.parent("happy"))}</g>`, "0 0 800 600"),
      bubbles: [{ text: "She's on board!", pos: "right:4%;top:6%;width:36%", tail: "bl", big: true }],
      caps: [{ text: "The family is told the second she boards.", pos: "left:3%;top:4%;max-width:34%" }] }),
    panel({ span: 3, ar: "4/3", cls: "trio", label: "The college, the agency and the admin each see their part",
      html: `<div class="trio-in">${(["College", "Agency", "Admin"] as const).map((w) => `<div class="trio-i"><span class="trio-l">${w}</span>${device("laptop", scr(CC, w).img, `Campus Conveyance ${w.toLowerCase()} panel`)}</div>`).join("")}</div>`,
      caps: [{ text: "Meanwhile, the college, the agency and the admin each see their part.", pos: "left:3%;top:4%;right:3%" }] }),
  ])}
  <div class="tv-panel panel pow-zone amber" data-page="9">
    <div class="tvp-head"><p class="tvp-k">On TV tonight</p><h3 class="tvp-t">Watch the whole 7:10 bus episode</h3></div>
    ${tvHTML(CC.film, { label: "Watch the episode", chapterTitle: "Chapters of the Campus Conveyance film" })}
    <a class="btn btn-amber tvp-more" href="campus/">Read the Campus Conveyance special issue</a>
  </div>
</section>`;

/* ------------------------------ services: the team of powers ------------------------------ */
const services = `<section class="sec powers" id="services" data-page="10" aria-labelledby="pw-t">
  <header class="sec-head"><p class="sec-k">Page 10</p><h2 id="pw-t" class="sec-t">Meet the team of powers</h2><p class="sec-s">Five things we build for you. Tap a card to flip it and read its abilities.</p>
  <button class="btn btn-ink flip-all" type="button" aria-pressed="false">Flip them all</button></header>
  <ul class="cards">${SERVICES.map((s, i) => `<li class="card-slot pop" style="--i:${i}">
    <button class="card" type="button" aria-pressed="false" aria-label="${esc(s.title)}: show its abilities">
      <span class="card-in">
        <span class="card-f">
          <span class="card-no">No. ${i + 1} of 5</span>
          <span class="card-emb"><svg class="art" viewBox="0 0 100 100" aria-hidden="true"><path class="f-burst2 ns" d="${burstPath(50, 50, 38, 50, 12, i + 3)}"/>${EMBLEMS[i]}</svg></span>
          <span class="card-t">${esc(s.title)}</span>
          <span class="card-tag">${esc(s.tag)}</span>
          <span class="card-d">${esc(s.desc)}</span>
          <span class="card-flip">Flip for abilities</span>
        </span>
        <span class="card-b" aria-hidden="true">
          <span class="card-bk">Abilities</span>
          <span class="card-bt">${esc(s.title)}</span>
          <span class="card-abl">${s.items.map((it) => `<span>${esc(it)}</span>`).join("")}</span>
        </span>
      </span>
    </button>
    <p class="sr">Abilities: ${esc(s.items.join(", "))}.</p>
  </li>`).join("")}</ul>
</section>`;

/* ------------------------------ process: four panels ------------------------------ */
const process = `<section class="sec process" id="process" data-page="12" aria-labelledby="pr-t">
  <header class="sec-head"><p class="sec-k">Page 12</p><h2 id="pr-t" class="sec-t">Four panels of progress</h2><p class="sec-s">How every job goes, in the order it happens.</p></header>
  <ol class="strip">${PROCESS.map((s, i) => `<li class="panel strip-p" style="--i:${i}">
    <div class="p-art">${PROCESS_ART[i]}</div>
    <p class="strip-n" aria-hidden="true">${s.n}</p>
    <div class="strip-txt"><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div>
  </li>`).join("")}</ol>
</section>`;

/* ------------------------------ numbers ------------------------------ */
const numbers = `<section class="sec facts" id="numbers" data-page="13" aria-labelledby="nm-t">
  <header class="sec-head"><p class="sec-k">Page 13</p><h2 id="nm-t" class="sec-t">The fact file</h2><p class="sec-s">Honest numbers only.</p></header>
  <ul class="fact-row">${NUMBERS.map((n, i) => `<li class="fact pop" style="--i:${i}">
    <svg class="fact-burst" viewBox="-60 -60 120 120" aria-hidden="true"><path d="${burstPath(0, 0, 44, 58, 15, i + 20)}"/></svg>
    <span class="fact-v"${n.count ? ` data-count="${n.value}"` : ""}>${n.value}</span>
    <span class="fact-l">${esc(n.label)}</span>
  </li>`).join("")}</ul>
</section>`;

/* ------------------------------ about: the origin story ------------------------------ */
const [rishi, jenish] = FOUNDERS;
const about = `<section class="sec origin" id="about" data-page="16" aria-labelledby="or-t">
  <header class="sec-head"><p class="sec-k">Page 16</p><h2 id="or-t" class="sec-t">The origin story</h2><p class="sec-s">Every hero has one. Ours is short, because it has only just begun.</p></header>
  ${page([
    panel({ span: 2, ard: "4/5", ar: "4/3", label: "Ahmedabad at dawn", art: cityDawn(), caps: [{ text: `${COMPANY.city}, ${COMPANY.foundedLabel}.`, pos: "left:4%;top:4%" }, { text: `A small company called ${COMPANY.formerName} is born.`, pos: "right:4%;bottom:5%;max-width:70%", cls: "cap-light" }] }),
    panel({ span: 4, ar: "4/5", cls: "founders", label: "The two founders, drawn as silhouettes",
      art: g(`<rect class="f-blue-bg ns" width="800" height="450"/><path class="f-spot ns" d="M220 0 L120 450 L360 450 L280 0Z M540 0 L440 450 L680 450 L600 0Z"/><rect class="f-dots ns" width="800" height="450" opacity=".4"/>${silhouette(240, 1.2)}${silhouette(560, 1.2)}`, "0 0 800 450", "xMidYMax slice"),
      html: `<div class="fd">${[rishi, jenish].map((f) => `<div class="fd-i"><p class="fd-n">${esc(f.name)}</p><p class="fd-r">${esc(f.role)}</p><p class="fd-b">${esc(f.bio)}</p><p class="fd-l"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p></div>`).join("")}</div>`,
      caps: [{ text: "Two founders. No capes.", pos: "left:2.5%;top:3%" }] }),
  ])}
  ${page([
    panel({ span: 3, ard: "16/10", ar: "4/3", cls: "rename", label: "Infinite becomes Aevinite", art: g(`<rect class="f-red-bg ns" width="800" height="500"/><path class="f-focus2 ns" d="${focusLines(400, 260, 800, 500, 64, 77)}"/>`, "0 0 800 500"),
      html: `<div class="rn"><span class="rn-old">${esc(COMPANY.formerName)}</span><span class="rn-new">${esc(COMPANY.name)}</span></div>`,
      caps: [{ text: `${COMPANY.renamedLabel}. A new name for a bigger story.`, pos: "left:3%;top:4%" }],
      sfx: [{ text: "KA-BLAM!", pos: "right:4%;bottom:6%", rot: -8, size: 8 }] }),
    panel({ span: 3, ar: "4/3", cls: "meaning", label: "What the name means",
      html: `<div class="mn">${infinity()}<p class="mn-t">${esc(COMPANY.meaning)}</p></div>`,
      caps: [{ text: "The name, decoded.", pos: "left:3%;top:4%" }] }),
  ])}
</section>`;

/* ------------------------------ letters page ------------------------------ */
const letters = `<section class="sec letters" id="contact" data-page="18" aria-labelledby="lt-t">
  <div class="lt-paper pop">
    <header class="lt-head"><p class="sec-k">Page 18</p><h2 id="lt-t" class="lt-t">Letters page</h2><p class="lt-s">Write to us! WhatsApp, email or a phone call, whichever you like.</p></header>
    <div class="lt-cols">
      <div class="lt-col">
        <p class="lt-dear">Dear reader,</p>
        <p>Got a slow handover, a paper notebook, or a website nobody finds? Tell us how your business really works, and we will tell you, honestly, what we would build. The first person you talk to is ${esc(rishi.name)}, the founder.</p>
        <p class="lt-sign">Yours, the Aevinite team, ${esc(COMPANY.city)}</p>
      </div>
      <div class="lt-col lt-ways">
        <a class="stamp stamp-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span class="stamp-k">Fastest</span><span class="stamp-t">WhatsApp us</span><span class="stamp-s">${esc(COMPANY.phoneDisplay)}</span></a>
        <a class="stamp stamp-mail" href="mailto:${COMPANY.email}"><span class="stamp-k">Write a letter</span><span class="stamp-t">${esc(COMPANY.email)}</span></a>
        <a class="stamp stamp-tel" href="${COMPANY.phoneHref}"><span class="stamp-k">Ring us</span><span class="stamp-t">${esc(COMPANY.phoneDisplay)}</span></a>
        <p class="lt-soc">${[["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]].map(([l, h]) => `<a href="${h}" target="_blank" rel="noopener">${l}</a>`).join("")}</p>
      </div>
    </div>
  </div>
</section>`;

const app = $("#app");
app.innerHTML = `<main id="main">${hero}${rush}${busStory}${services}${process}${numbers}${workHTML(WORK, "Page 14")}${about}${letters}</main>${footerHTML("./", NAV)}`;

initBook($(".hero"), FOR_WHOM);
initFilms();
initReader();
revealPanels();
initPow();
countUp();
pageCounter();

/* service cards flip */
const cards = $$<HTMLButtonElement>(".card");
const flip = (c: HTMLButtonElement, v?: boolean) => {
  const on = v ?? c.getAttribute("aria-pressed") !== "true";
  c.setAttribute("aria-pressed", String(on));
  c.setAttribute("aria-label", `${c.querySelector(".card-t")!.textContent}: ${on ? "show the front" : "show its abilities"}`);
};
cards.forEach((c) => c.addEventListener("click", () => { flip(c); sfx.swish(); }));
const fa = $<HTMLButtonElement>(".flip-all");
fa.addEventListener("click", () => {
  const on = fa.getAttribute("aria-pressed") !== "true";
  fa.setAttribute("aria-pressed", String(on));
  fa.textContent = on ? "Flip them back" : "Flip them all";
  cards.forEach((c, i) => setTimeout(() => flip(c, on), i * 90));
  sfx.swish();
});
