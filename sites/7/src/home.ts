import "./fonts";
import { COMPANY, PRODUCTS, SERVICES } from "@shared/content";
import { esc } from "./lib/core";
import { headerHTML, footerHTML, initChrome } from "./lib/chrome";
import { heroHTML, initHero, rotWord } from "./lib/hero";
import { filmHTML, initFilms, screensHTML, initScreens } from "./lib/film";
import { servicesHTML, initServices, SVC_SHORT } from "./lib/services";
import { processHTML, initProcess } from "./lib/process";
import { workHTML, initWork } from "./lib/work";
import { sh, numbersHTML, initNumbers, aboutHTML, contactHTML, initContact, initReveal } from "./lib/misc";

const SHEETS = 8;
const k = (n: number, what: string) => `Sheet ${String(n).padStart(2, "0")} of ${String(SHEETS).padStart(2, "0")} · ${what}`;

const productBlock = (p: (typeof PRODUCTS)[number], letter: string) => `
  <article class="prod" id="${p.id}-sec" data-tone="${p.color}" aria-labelledby="${p.id}-h">
    <div class="prod-head">
      <p class="cap">Product ${letter} · ${esc(p.kind)}</p>
      <p class="prod-name">${p.id === "campus" ? `<img src="${p.mark}" alt="" width="40" height="40" loading="lazy">` : ""}<span>${esc(p.name)}</span></p>
      <h3 class="prod-h" id="${p.id}-h">${esc(p.headline)}</h3>
      <p class="prod-sub">${esc(p.sub)}</p>
      <p class="prod-status">${esc(p.status)}</p>
      <div class="prod-link"><a class="btn btn-ghost" href="${p.href}">Open the ${esc(p.name.split(" ")[0])} drawing set <span class="arrow" aria-hidden="true">→</span></a></div>
    </div>
    <div class="prod-film">${filmHTML(p.film)}</div>
    <div class="prod-scr" data-rise>
      <p class="cap">${p.screens.length} detail views · one screen for each person</p>
      ${screensHTML(p.screens, p.name).replace("data-scr", `data-scr data-key="${p.id}"`)}
    </div>
  </article>`;

document.querySelector("#app")!.innerHTML = `
  ${headerHTML("")}
  <main id="main">
    ${heroHTML({
      kicker: k(1, "Ahmedabad, Gujarat"),
      h1: `We help businesses <span class="mk">grow.</span>`,
      word: "Aevinite",
      lead: `Websites, custom software and automation for ${rotWord()}.`,
      pitch: COMPANY.pitch,
      ctas: `<a class="btn" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span>Talk on WhatsApp</span></a>
             <a class="btn btn-ghost" href="#products"><span>See the two products</span><span class="arrow" aria-hidden="true">↓</span></a>`,
      sheet: "01 / 08",
      readoutIntro: "Five bumpers, five things we build. Hit one to read it.",
    })}

    <section class="sec prods" id="products" aria-labelledby="prods-t">
      <div class="wrap">
        <div>${sh("02", k(2, "Our own products"), "Two machines we built ourselves.", "Aevidine for restaurants, Campus Conveyance for school and college buses. Each has a film with chapters you can jump to, and a screen for every person who uses it.", "prods-t")}</div>
        ${productBlock(PRODUCTS[0], "A")}
        ${productBlock(PRODUCTS[1], "B")}
      </div>
    </section>

    <section class="sec" id="services" aria-labelledby="svc-t" style="--sc:#39d0ff">
      <div class="wrap">
        ${servicesHTML(sh("03", k(3, "Services"), "Five parts. One machine.", `<span class="only-light">Everything we build for a business, drawn as one assembly. Scroll and it puts itself together; point at a part to read its specification.</span><span class="only-dark">Everything we build for a business, as a bank of five drop targets. Knock one down and its insert lights up.</span>`, "svc-t"))}
      </div>
    </section>

    <section class="sec" id="process" aria-labelledby="proc-t" style="--sc:#b5f23b">
      <div class="wrap">
        ${sh("04", k(4, "Process"), "Four gears, one drive.", "How every project runs. Scroll, or grab the crank on the first gear, and watch each step take the next one with it.", "proc-t")}
        ${processHTML()}
      </div>
    </section>

    <section class="sec" id="work" aria-labelledby="work-t" style="--sc:#ff5fa8">
      <div class="wrap">
        ${sh("05", k(5, "Work"), "From the flat file.", `Real projects, real screenshots. <span class="only-light">Pull a drawer and its sheet slides out.</span><span class="only-dark">Hit a lane and its backglass lights up.</span>`, "work-t")}
        ${workHTML("")}
      </div>
    </section>

    <section class="sec" id="numbers" aria-labelledby="num-t" style="--sc:#ff7a2f">
      <div class="wrap">
        <div class="num-layout">${sh("06", k(6, "Numbers"), "Measured, not guessed.", `<span class="only-light">Only figures we can stand behind, each one dimensioned against the things it counts.</span><span class="only-dark">Only figures we can stand behind, rolled up on the score reels.</span>`, "num-t")}${numbersHTML()}</div>
      </div>
    </section>

    <section class="sec" id="about" aria-labelledby="about-t" style="--sc:#39d0ff">
      <div class="wrap">
        ${sh("07", k(7, "About"), "Drawn in Ahmedabad.", "Two founders, one city, and a name with a beginning but no end.", "about-t")}
        ${aboutHTML()}
      </div>
    </section>

    <section class="sec" id="contact" aria-labelledby="contact-t" style="--sc:#ff5fa8">
      <div class="wrap">
        ${sh("08", k(8, "Contact"), "Approved for growth.", "No forms. Message or call, and you talk to the people who build it.", "contact-t")}
        ${contactHTML()}
      </div>
    </section>
  </main>
  ${footerHTML("")}
`;

initChrome();
initHero({
  word: "Aevinite",
  name: "Aevinite",
  bumpers: SERVICES.map((s, i) => ({ short: SVC_SHORT[i], title: s.title, text: s.desc })),
  readoutIntro: "Five bumpers, five things we build. Hit one to read it.",
});
initFilms();
initScreens(document, { aevidine: PRODUCTS[0].screens, campus: PRODUCTS[1].screens });
initServices();
initProcess();
initWork("");
initNumbers();
initContact();
initReveal();
