import "./fonts";
import { COMPANY, productById, type ProductId } from "@shared/content";
import { esc, $$, watchView } from "./lib/core";
import { headerHTML, footerHTML, initChrome } from "./lib/chrome";
import { heroHTML, initHero } from "./lib/hero";
import { filmHTML, initFilms } from "./lib/film";
import { sh, contactHTML, initContact, initReveal } from "./lib/misc";

const SHORT: Record<ProductId, string[]> = {
  aevidine: ["Guests", "Kitchen", "Waiters", "Managers", "Owner"],
  campus: ["Students", "Drivers", "Colleges", "Agencies", "Admin"],
};

const id = (document.body.dataset.product ?? "aevidine") as ProductId;
const p = productById(id);
const word = id === "aevidine" ? "Aevidine" : "Campus";
const short = p.name.split(" ")[0];
const N = 8;
const k = (n: number, what: string) => `${esc(short)} · Sheet ${String(n).padStart(2, "0")} of ${String(N).padStart(2, "0")} · ${what}`;

document.querySelector("#app")!.innerHTML = `
  ${headerHTML("../", p.href)}
  <main id="main">
    ${heroHTML({
      kicker: `Drawing set · ${esc(p.kind)} · ${esc(p.status)}`,
      h1: esc(p.headline),
      word,
      lead: esc(p.sub),
      pitch: "",
      ctas: `<a class="btn" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span>Ask for a free demo</span></a>
             <a class="btn btn-ghost" href="#film"><span>Watch the film</span><span class="arrow" aria-hidden="true">↓</span></a>`,
      sheet: "01 / 08",
      readoutIntro: `Five bumpers, five people ${short} serves. Hit one to read their part.`,
    })}

    <section class="sec" id="film" aria-labelledby="film-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("02", k(2, "The film"), "Watch it run.", `${esc(p.film.description)} Jump straight to any chapter.`, "film-t")}
        <div style="max-width:1080px">${filmHTML(p.film)}</div>
      </div>
    </section>

    <section class="sec" id="screens" aria-labelledby="scr-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("03", k(3, "Every person's screen"), `${p.screens.length} people, ${p.screens.length} screens.`, "Each person gets the screen that fits their job, and nothing they don't need.", "scr-t")}
        <div class="persons">
          ${p.screens.map((s, i) => `<article class="person" data-rise>
            <figure class="person-fig"><img src="${s.img}" alt="${esc(p.name)} screen for the ${esc(s.who.toLowerCase())}" width="1280" height="560" loading="lazy" decoding="async"></figure>
            <div>
              <p class="person-k"><span>${String.fromCharCode(65 + i)}</span><b>Detail ${String.fromCharCode(65 + i)}</b></p>
              <h3>${esc(s.who)}</h3>
              <p>${esc(s.line)}</p>
            </div>
          </article>`).join("")}
        </div>
      </div>
    </section>

    <section class="sec" id="panels" aria-labelledby="pan-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("04", k(4, "Section views"), "Cut through, panel by panel.", `What each panel of ${esc(p.name)} does, and who it is for.`, "pan-t")}
        <ol class="panels">
          ${p.panels.map((x, i) => `<li class="panel" data-rise><p class="panel-k"><span>Section ${String.fromCharCode(65 + i)}-${String.fromCharCode(65 + i)}</span><b>${esc(x.who)}</b></p><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join("")}
        </ol>
      </div>
    </section>

    <section class="sec" id="spec" aria-labelledby="spec-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("05", k(5, "Specification"), "What is in the box.", "", "spec-t")}
        <ul class="spec">${p.features.map((f, i) => `<li><span>S-${String(i + 1).padStart(2, "0")}</span>${esc(f)}</li>`).join("")}</ul>
      </div>
    </section>

    <section class="sec" id="more-films" aria-labelledby="mf-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("06", k(6, "More films"), p.extraFilms.length > 1 ? "More from the series." : "One more film.", "", "mf-t")}
        <div class="more-films${p.extraFilms.length === 1 ? " one" : ""}">${p.extraFilms.map((f) => filmHTML(f, { compact: true, dims: false })).join("")}</div>
      </div>
    </section>

    <section class="sec" id="faq" aria-labelledby="faq-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("07", k(7, "Notes"), "Questions people ask.", "", "faq-t")}
        <div class="faq">${p.faq.map((q, i) => `<details${i === 0 ? " open" : ""}><summary><span>Q${String(i + 1).padStart(2, "0")}</span><b>${esc(q.q)}</b><i aria-hidden="true"></i></summary><p>${esc(q.a)}</p></details>`).join("")}</div>
      </div>
    </section>

    <section class="sec" id="contact" aria-labelledby="contact-t" style="--sc:var(--pcf)">
      <div class="wrap">
        ${sh("08", k(8, "See it working"), "Ask for a free demo.", "", "contact-t")}
        ${contactHTML(id === "aevidine"
          ? "Pricing depends on the restaurant. Message or call for a free demo and a quote."
          : "Ready for its first schools, colleges and transport agencies in Ahmedabad and Gandhinagar. Ask for a free demo.")}
        <div class="home-back" style="margin-top:clamp(56px,7vw,96px)">
          <p>Back to the full drawing set.</p>
          <a class="btn btn-ghost" href="../"><span class="arrow" aria-hidden="true">←</span><span>Aevinite home</span></a>
        </div>
      </div>
    </section>
  </main>
  ${footerHTML("../")}
`;

initChrome();
initHero({
  word,
  name: word,
  bumpers: p.panels.map((x, i) => ({ short: SHORT[id][i], title: x.title, text: x.text })),
  readoutIntro: `Five bumpers, five people ${short} serves. Hit one to read their part.`,
});
initFilms();
initContact();
initReveal();
// spec lamps light one by one as they scroll in (dark world)
$$<HTMLElement>(".spec li").forEach((li, i) => watchView(li, (v) => { if (v) setTimeout(() => li.classList.add("lit"), (i % 2) * 120); }, "-12% 0px"));
