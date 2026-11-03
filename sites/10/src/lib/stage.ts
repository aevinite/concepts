// The two hero stages. Side A (light): a listening station in a record shop, one deck and its
// screen. Side B (dark): a club booth, Aevidine on deck A, Campus on deck B, a mixer between them
// and a crossfader that blends both the picture and the sound.
import type { Film } from "@shared/content";
import { onTheme, getTheme } from "@shared/theme";
import { Player, screenHTML } from "./film";
import { Deck, deckHTML, tracksHTML, bindTracks, readoutHTML, bindReadout, type DeckOpts } from "./deck";
import { $, $$, esc, clamp, gsap, loop, reduced } from "./util";
import * as snd from "./sound";

export type StageDeck = { deck: Deck; player: Player };

export function shopStageHTML(f: Film, o: DeckOpts, cls = "") {
  return `<div class="stage stage--shop ${cls}">
    <div class="shop__light" aria-hidden="true"></div>
    <div class="shop__screen">
      <div class="shop__bezel">${screenHTML(f, "shop__scr", false)}</div>
      <p class="shop__cap"><span class="shop__dot" aria-hidden="true"></span><span>Listening booth</span><span>${esc(f.length)}</span></p>
    </div>
    <div class="shop__deck">${deckHTML(f, { ...o, hint: true })}</div>
    <div class="shop__side">
      ${readoutHTML("shop__ro")}
      <p class="tl__h"><span>Side ${o.side}</span><span>Pick a track</span></p>
      ${tracksHTML(f, o.side, "tracks--shop")}
    </div>
  </div>`;
}

export function bindShopStage(el: HTMLElement, f: Film, side: string): StageDeck {
  const player = new Player($(".scr", el), f);
  const deck = new Deck($(".tt", el), player);
  bindTracks($(".tracks", el), deck);
  bindReadout($(".ro", el), player, side);
  $(".shop__scr", el).addEventListener("click", () => { if (player.playing) player.pause(); else deck.start(); });
  return { deck, player };
}

export function clubStageHTML(a: Film, b: Film, oa: DeckOpts, ob: DeckOpts) {
  const ch = (k: "a" | "b") => `<div class="mixer__ch mixer__ch--${k}">
      <span class="mixer__lbl">${k.toUpperCase()}</span>
      <span class="mixer__vu" aria-hidden="true">${"<i></i>".repeat(12)}</span>
    </div>`;
  const deck = (k: "a" | "b", f: Film, o: DeckOpts) => `<div class="cdeck cdeck--${k}" data-tone="${o.tone}" id="deck-${k}" role="tabpanel" aria-label="Deck ${k.toUpperCase()}">
      <p class="cdeck__h"><b>Deck ${k.toUpperCase()}</b><span>${esc(o.name)}</span></p>
      ${deckHTML(f, o)}
      ${readoutHTML("cdeck__ro")}
      <p class="cdeck__cue">Hot cues</p>
      ${tracksHTML(f, k.toUpperCase(), "tracks--pads")}
    </div>`;
  return `<div class="stage stage--club">
    <div class="beams" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="club__screen">
      <div class="club__layer club__layer--a">${screenHTML(a, "", true)}</div>
      <div class="club__layer club__layer--b">${screenHTML(b, "", true)}</div>
      <p class="club__now"><span class="club__na">${esc(oa.name)}</span><span class="club__nb">${esc(ob.name)}</span></p>
    </div>
    <div class="mixer">
      ${ch("a")}
      <div class="xf">
        <label class="xf__l" for="xf">Crossfader</label>
        <div class="xf__track"><input id="xf" class="xf__in" type="range" min="0" max="100" value="0" step="1"
          aria-valuetext="All Aevidine" aria-label="Crossfader, from deck A (Aevidine) to deck B (Campus Conveyance)"></div>
        <p class="xf__ends"><span>A · ${esc(oa.name)}</span><span>${esc(ob.name)} · B</span></p>
      </div>
      ${ch("b")}
    </div>
    <div class="club__decks">
      <div class="club__tabs" role="tablist" aria-label="Decks">
        <button type="button" role="tab" aria-selected="true" aria-controls="deck-a" data-k="a">Deck A<small>${esc(oa.name)}</small></button>
        <button type="button" role="tab" aria-selected="false" aria-controls="deck-b" data-k="b">Deck B<small>${esc(ob.name)}</small></button>
      </div>
      <div class="club__rail">${deck("a", a, oa)}${deck("b", b, ob)}</div>
    </div>
  </div>`;
}

export function bindClub(el: HTMLElement, a: Film, b: Film) {
  const pa = new Player($(".club__layer--a .scr", el), a, { group: "club" });
  const pb = new Player($(".club__layer--b .scr", el), b, { group: "club" });
  const da = new Deck($(".cdeck--a .tt", el), pa), db = new Deck($(".cdeck--b .tt", el), pb);
  bindTracks($(".cdeck--a .tracks", el), da);
  bindTracks($(".cdeck--b .tracks", el), db);
  bindReadout($(".cdeck--a .ro", el), pa, "A");
  bindReadout($(".cdeck--b .ro", el), pb, "B");

  const xf = $<HTMLInputElement>(".xf__in", el), scr = $(".club__screen", el);
  let x = 0;
  const apply = (v: number) => {
    x = clamp(v, 0, 1);
    xf.value = String(Math.round(x * 100));
    scr.style.setProperty("--x", String(x));
    pa.setLevel(Math.cos((x * Math.PI) / 2));
    pb.setLevel(Math.sin((x * Math.PI) / 2));
    xf.setAttribute("aria-valuetext", x < 0.05 ? "All Aevidine" : x > 0.95 ? "All Campus Conveyance" : `${Math.round((1 - x) * 100)}% Aevidine, ${Math.round(x * 100)}% Campus`);
  };
  let lastTick = 0;
  xf.addEventListener("input", () => {
    apply(Number(xf.value) / 100);
    const now = performance.now();
    if (now - lastTick > 60) { snd.tick(1.6); lastTick = now; }
  });
  apply(0);

  // Start a deck that is faded out and the fader glides over to it, like a DJ bringing it in.
  const bring = (k: "a" | "b") => {
    const goal = k === "a" ? 0 : 1;
    if (Math.abs(goal - x) < 0.7) return;
    const o = { v: x };
    gsap.to(o, { v: goal, duration: reduced() ? 0 : 1.4, ease: "power2.inOut", onUpdate: () => apply(o.v) });
  };
  pa.on((_, p) => { if (p) bring("a"); });
  pb.on((_, p) => { if (p) bring("b"); });

  // Mixer meters follow each deck's level (decorative, they read the fader and the transport).
  const vus = [$$(".mixer__ch--a i", el), $$(".mixer__ch--b i", el)];
  const lv = [0, 0];
  loop($(".mixer", el), (_, now) => {
    [pa, pb].forEach((p, k) => {
      const gain = k === 0 ? Math.cos((x * Math.PI) / 2) : Math.sin((x * Math.PI) / 2);
      const beat = 0.5 + 0.5 * Math.max(0, Math.sin(now / 76 + k)) * (0.6 + 0.4 * Math.sin(now / 311 + k * 2));
      const want = p.playing ? gain * (0.45 + 0.5 * beat) : 0;
      lv[k] += (want - lv[k]) * (want > lv[k] ? 0.5 : 0.12);
      const n = Math.round(lv[k] * vus[k].length);
      vus[k].forEach((l, i) => l.classList.toggle("on", i < n));
    });
  });

  // Phones: one deck at a time; swipe the rail or tap a tab.
  const rail = $(".club__rail", el), tabs = $$<HTMLButtonElement>(".club__tabs button", el);
  const mark = (k: string) => tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.k === k)));
  tabs.forEach((t) => t.addEventListener("click", () => {
    const target = $(`#deck-${t.dataset.k}`, el);
    rail.scrollTo({ left: target.offsetLeft - rail.offsetLeft, behavior: reduced() ? "auto" : "smooth" });
    mark(t.dataset.k!);
  }));
  rail.addEventListener("scroll", () => mark(rail.scrollLeft > rail.clientWidth / 2 ? "b" : "a"), { passive: true });

  return { da, db, pa, pb };
}

/** Hidden world = silent world: leaving a theme pauses the films on its stage. */
export function pauseOnTheme(world: "light" | "dark", players: Player[]) {
  onTheme((t) => { if (t !== world) players.forEach((p) => p.pause()); });
  return getTheme();
}
