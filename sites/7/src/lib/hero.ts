// The hero: one copy block (a drawing's notes in light, a lit backglass in dark) plus the toy,
// which is the letter-block shelf in light and the pinball table in dark. Switching worlds
// unmounts one physics world and mounts the other.
import { FOR_WHOM } from "@shared/content";
import { $, esc, reduced, gsap, themed, rollNumber } from "./core";
import { lamps } from "./chrome";
import { mountLetters } from "./letters";
import { mountPinball, type BumperDef, type PinEvent } from "./pinball";

type HeroOpts = {
  kicker: string;
  h1: string;
  word: string; // the letter blocks / backglass name
  lead: string; // html
  pitch: string;
  ctas: string; // html
  sheet: string; // title-block sheet text
  readoutIntro: string;
  rotate?: boolean;
};

export function heroHTML(o: HeroOpts) {
  return `<section class="hero" id="top" aria-labelledby="h1">
    <div class="hero-in">
      <div class="bglass">
        ${lamps(34, "bg-lamps")}
        <p class="cap hero-k">${o.kicker}</p>
        <p class="bg-brand" aria-hidden="true">${esc(o.word)}</p>
        <h1 class="h1" id="h1">${o.h1}</h1>
        <p class="hero-for">${o.lead}</p>
        ${o.pitch ? `<p class="hero-p">${esc(o.pitch)}</p>` : ""}
        <div class="hero-cta">${o.ctas}</div>
        <div class="dmd" aria-live="polite">
          <div class="dmd-row"><span class="dmd-lbl">Score</span><b class="dmd-score" data-v="0">0</b><span class="dmd-ball">Ball 0 of 3</span></div>
          <p class="dmd-msg"><b>Press start</b><span>or just watch it play</span></p>
          <div class="dmd-read"><b>${esc(o.word)}</b><span>${esc(o.readoutIntro)}</span></div>
        </div>
        <p class="pb-help">Flippers: <kbd>←</kbd> <kbd>→</kbd> or tap either half of the table. Launch: hold <kbd>Space</kbd> or the lane.</p>
      </div>
      <div class="hero-toy">
        <div class="toy toy-light"></div>
        <div class="toy toy-dark"></div>
        <dl class="tblock" aria-label="Title block">
          <div><dt>Title</dt><dd>${esc(o.word)}</dd></div>
          <div><dt>Drawn by</dt><dd>Aevinite</dd></div>
          <div><dt>Scale</dt><dd>1:1</dd></div>
          <div><dt>Sheet</dt><dd>${esc(o.sheet)}</dd></div>
        </dl>
      </div>
    </div>
  </section>`;
}

export const rotWord = () => `<span class="rot" aria-live="off"><span class="rot-w">${FOR_WHOM[0]}</span></span>`;

export function initHero(o: { word: string; name: string; bumpers: BumperDef[]; readoutIntro: string }) {
  const hero = $<HTMLElement>(".hero");
  const tl = $<HTMLElement>(".toy-light", hero), td = $<HTMLElement>(".toy-dark", hero);
  const score = $<HTMLElement>(".dmd-score", hero), ballEl = $<HTMLElement>(".dmd-ball", hero);
  const msg = $<HTMLElement>(".dmd-msg", hero), read = $<HTMLElement>(".dmd-read", hero);

  // rotating "for whom" word
  const rw = $<HTMLElement>(".rot-w", hero);
  if (rw && !reduced()) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % FOR_WHOM.length;
      gsap.to(rw, { yPercent: -100, opacity: 0, duration: 0.28, ease: "power2.in", onComplete: () => {
        rw.textContent = FOR_WHOM[i];
        gsap.fromTo(rw, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.42, ease: "back.out(1.6)" });
      } });
    }, 2300);
  }

  const emit = (e: PinEvent) => {
    if (e.type === "score") rollNumber(score, e.score, 0.5);
    if (e.type === "state") ballEl.textContent = e.state === "attract" ? "Attract mode" : e.state === "over" ? "Game over" : `Ball ${e.ball} of ${e.balls}`;
    if (e.type === "msg") {
      msg.innerHTML = `<b>${esc(e.text)}</b>${e.sub ? `<span>${esc(e.sub)}</span>` : ""}`;
      gsap.fromTo(msg, { opacity: 0.2 }, { opacity: 1, duration: 0.3, ease: "steps(3)" });
    }
    if (e.type === "hit") {
      const b = o.bumpers[e.index];
      read.innerHTML = `<b><i>${String(e.index + 1).padStart(2, "0")}</i> ${esc(b.title)}</b><span>${esc(b.text)}</span>`;
      read.dataset.c = String(e.index);
    }
  };

  let lettersApi: ReturnType<typeof mountLetters> | null = null;
  let pinApi: ReturnType<typeof mountPinball> | null = null;
  themed((t) => {
    if (t === "dark") {
      lettersApi?.destroy(); lettersApi = null;
      if (!pinApi) {
        pinApi = mountPinball(td, { bumpers: o.bumpers, emit, name: o.name });
        read.innerHTML = `<b>${esc(o.word)}</b><span>${esc(o.readoutIntro)}</span>`;
        score.dataset.v = "0"; score.textContent = "0";
      }
    } else {
      pinApi?.destroy(); pinApi = null;
      if (!lettersApi) lettersApi = mountLetters(tl, { word: o.word });
    }
  });
}
