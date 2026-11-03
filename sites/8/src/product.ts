import "./fonts";
import "./style.css";
import { gsap } from "gsap";
import { COMPANY, productById, type ProductId } from "@shared/content";
import { initTheme, prefersReducedMotion } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { bath, PIGMENTS, type PigmentId } from "./bath";
import { header, bindHeader, footer, filmHTML, bindFilms, screensHTML, bindScreens, sheets, toolsHTML, bindTools, w, words, remeasure } from "./ui";
import { eggs } from "./extras";

initTheme(8);
const id = document.body.dataset.product as ProductId;
const p = productById(id);
const gold = id === "aevidine";
const palette: { id: PigmentId; label: string }[] = gold
  ? [{ id: "gold", label: "Gold" }, { id: "terracotta", label: "Terracotta" }, { id: "deep", label: "Lamp black" }]
  : [{ id: "amber", label: "Amber" }, { id: "saffron", label: "Saffron" }, { id: "indigo", label: "Indigo" }];
const seedSet: PigmentId[] = gold ? ["gold", "saffron", "terracotta", "cream", "gold", "deep"] : ["amber", "saffron", "indigo", "cream", "amber", "terracotta"];

const cap = (t: string) => { const x = t.replace(/^[^:]+:\s*/, ""); return x[0].toUpperCase() + x.slice(1); };
const extra = p.extraFilms.map((f) => `
  <article class="xfilm">
    ${filmHTML(f, { label: "Play" })}
    <h3>${cap(f.title)}</h3>
    <p>${f.description}</p>
  </article>`).join("");

const app = document.getElementById("app")!;
app.innerHTML = `
${header("../", id)}
<main id="main">
  <section class="hero hero-product" id="top" data-bath>
    <div class="hero-in">
      <p class="kicker" data-solid><img class="pmark" src="${p.mark}" alt="" width="28" height="${gold ? 17 : 28}"> ${p.name} · ${p.kind}</p>
      <h1 class="h1 h1-product" data-obstacle><span class="sr-only">${p.name}. </span>${words(p.headline)}</h1>
      <div class="label" data-solid>
        <p class="pitch">${p.sub}</p>
        <p class="status"><span class="dot" aria-hidden="true"></span>${p.status}</p>
        <div class="cta-row">
          <a class="btn btn-ink" href="#film">Watch the film</a>
          <a class="btn" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">Ask for a demo on WhatsApp</a>
        </div>
      </div>
    </div>
    <div class="hero-play">
      ${toolsHTML(palette)}
      <p class="hint" data-solid><span class="h-mouse">${w("Move to push the ink. Hold and drag to paint. Click to drop pigment.", "Move and the sea lights up. Hold and drag to paint light. Click to drop a glow.")}</span><span class="h-touch">${w("Swipe sideways to paint, tap to drop pigment, or press Paint.", "Swipe sideways to paint light, tap for a glow, or press Paint.")}</span></p>
    </div>
  </section>

  <section class="sheet print-host pfilm" id="film" aria-labelledby="film-h">
    <div class="paper">
      <div class="pfilm-head">
        <div>
          <p class="eyebrow">${w("The film", "The film, after dark")} · ${p.film.length}</p>
          <h2 id="film-h" data-rise>${words(cap(p.film.title))}</h2>
        </div>
        <p class="pfilm-d">${p.film.description}</p>
      </div>
      ${filmHTML(p.film, { big: true })}
    </div>
  </section>

  <section class="sheet print-host pscreens" id="screens" aria-labelledby="screens-h">
    <div class="paper">
      <p class="eyebrow">${w("Every person, their own screen", "One light for every person")}</p>
      <h2 id="screens-h" data-rise>${words(`${p.screens.length} people, one system.`)}</h2>
      ${screensHTML(p.id, p.screens, p.name)}
    </div>
  </section>

  <section class="sheet print-host ppanels" id="panels" aria-labelledby="panels-h">
    <div class="paper">
      <p class="eyebrow">${w("The panels", "The panels")}</p>
      <h2 id="panels-h" data-rise>${words("Who does what.")}</h2>
      <ol class="plates">
        ${p.panels.map((x, i) => `<li class="plate-row" style="--pl:${PIGMENTS[palette[i % 3].id].light};--pd:${PIGMENTS[palette[i % 3].id].dark}">
          <span class="pr-n">${String(i + 1).padStart(2, "0")}</span>
          <div><p class="pr-who">${x.who}</p><h3>${x.title}</h3></div>
          <p class="pr-t">${x.text}</p>
        </li>`).join("")}
      </ol>
    </div>
  </section>

  <section class="sheet print-host pfeat" id="features" aria-labelledby="feat-h">
    <div class="paper">
      <p class="eyebrow">Features</p>
      <h2 id="feat-h" data-rise>${words(`What ${p.name} does.`)}</h2>
      <ul class="feats">${p.features.map((f, i) => `<li><span class="fn">${String(i + 1).padStart(2, "0")}</span>${f}</li>`).join("")}</ul>
    </div>
  </section>

  <section class="sheet print-host pmore" id="more" aria-labelledby="more-h">
    <div class="paper">
      <p class="eyebrow">${w("More films", "More films")}</p>
      <h2 id="more-h" data-rise>${words(p.extraFilms.length > 1 ? "Watch it from other sides." : "Watch it from the guest's side.")}</h2>
      <div class="xfilms xfilms-${p.extraFilms.length}">${extra}</div>
    </div>
  </section>

  <section class="sheet print-host pfaq" id="faq" aria-labelledby="faq-h">
    <div class="paper">
      <p class="eyebrow">Questions</p>
      <h2 id="faq-h" data-rise>${words("Asked, and answered.")}</h2>
      <div class="faq">${p.faq.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join("")}</div>
    </div>
  </section>

  <section class="contact" id="contact" aria-labelledby="contact-h">
    <div class="sheet print-host contact-card">
      <div class="paper">
        <p class="eyebrow">${p.name}</p>
        <h2 id="contact-h" data-rise>${words("See it running.")}</h2>
        <p class="contact-sub">For a free demo, talk to the people who built it.</p>
        <a class="wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">
          <span class="wa-drop" aria-hidden="true"></span>
          <span class="wa-t">Message us on WhatsApp<small>${COMPANY.phoneDisplay}</small></span>
        </a>
        <ul class="contact-list">
          <li><span>Email</span><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
          <li><span>Phone</span><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></li>
        </ul>
        <p class="back"><a href="../">Back to Aevinite</a><a href="../${gold ? "campus" : "aevidine"}/">See ${gold ? "Campus Conveyance" : "Aevidine"}</a></p>
      </div>
    </div>
  </section>
</main>
${footer("../")}`;

conceptBadge(8, "Ink");
const hero = document.querySelector<HTMLElement>(".hero")!;
bath.init({ palette: palette.map((x) => x.id), seedSet, hero });
bindHeader();
bindTools(hero);
bindFilms();
bindScreens();
sheets();
eggs();
remeasure();

if (!prefersReducedMotion()) {
  gsap.timeline({ onComplete: () => { document.querySelector(".hero .h1")!.classList.add("risen"); bath.buildMask(); } })
    .from(".hero .h1 .w", { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.06 }, 0.15)
    .from(".hero .kicker", { opacity: 0, y: 10, duration: 0.6 }, 0.1)
    .from(".hero .label", { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" }, 0.5)
    .from(".hero-play > *", { opacity: 0, y: 16, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.65);
} else { document.querySelector(".hero .h1")!.classList.add("risen"); bath.buildMask(); }
