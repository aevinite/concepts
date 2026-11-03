// A release: a film in its sleeve (muted preview loop, then the full film with sound), its
// tracklist, a transport bar, and the "featuring" line-up of every person's screen.
import type { Film, Screen } from "@shared/content";
import { Player, screenHTML } from "./film";
import { tracksHTML, bindTracks } from "./deck";
import { $, $$, esc, fmt, icon, whileVisible, reduced } from "./util";
import * as snd from "./sound";

export function filmBlockHTML(f: Film, side: string, tone: string) {
  return `<div class="fb" data-tone="${tone}">
    <div class="fb__sleeve">
      <span class="fb__vinyl" aria-hidden="true"><span></span></span>
      ${screenHTML(f, "fb__scr")}
      <button type="button" class="fb__big" aria-label="Play ${esc(f.title)} with sound, ${esc(f.length)}">
        <span class="fb__bigic">${icon.play}</span><span><b>Play the full film</b><small>${esc(f.length)}, with sound</small></span>
      </button>
      ${f.preview ? `<span class="fb__tag" aria-hidden="true">Preview, no sound</span>` : ""}
    </div>
    <div class="fb__tp">
      <button type="button" class="fb__pp" aria-label="Play">${icon.play}${icon.pause}</button>
      <input class="fb__seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Position in the film">
      <span class="fb__time">0:00 / ${fmt(0)}</span>
    </div>
    ${tracksHTML(f, side, "tracks--fb")}
  </div>`;
}

export function bindFilmBlock(el: HTMLElement, f: Film, group = "") {
  const p = new Player($(".scr", el), f, { preview: true, group });
  const pp = $<HTMLButtonElement>(".fb__pp", el), seek = $<HTMLInputElement>(".fb__seek", el), time = $(".fb__time", el);
  const start = (t?: number) => { snd.tick(); p.play(t); };
  $(".fb__big", el).addEventListener("click", () => start(p.full ? undefined : 0));
  $(".fb__scr", el).addEventListener("click", () => (p.full ? p.toggle() : start(0)));
  pp.addEventListener("click", () => (p.playing ? p.pause() : start(p.full ? undefined : 0)));
  let held = false;
  seek.addEventListener("pointerdown", () => { held = true; p.scrubStart(); });
  seek.addEventListener("input", () => { p.seek((Number(seek.value) / 1000) * p.dur); });
  const rel = () => { if (held) { held = false; p.scrubEnd(); } };
  seek.addEventListener("pointerup", rel);
  seek.addEventListener("change", rel);
  p.on((t, playing) => {
    el.classList.toggle("is-playing", playing);
    el.classList.toggle("is-full", p.full);
    pp.setAttribute("aria-label", playing ? "Pause" : "Play");
    if (!held) seek.value = String(Math.round((t / p.dur) * 1000));
    time.textContent = `${fmt(t)} / ${fmt(p.dur)}`;
  });
  time.textContent = `0:00 / ${fmt(p.dur)}`;
  bindTracks($(".tracks", el), { start, player: p });
  return p;
}

/** Featuring: each person's screen. Plays through like a playlist until someone picks one. */
export function lineupHTML(screens: readonly Screen[], product: string) {
  return `<div class="lu">
    <figure class="lu__stage">
      ${screens.map((s, i) => `<img src="${s.img}" alt="${esc(`${product}: the ${s.who.toLowerCase()}'s screen`)}" width="1280" height="560" loading="lazy" class="${i === 0 ? "is-on" : ""}">`).join("")}
      <figcaption class="lu__cap"><b>${esc(screens[0].who)}</b><span>${esc(screens[0].line)}</span></figcaption>
    </figure>
    <ol class="lu__list" aria-label="Who uses ${esc(product)}">
      ${screens.map((s, i) => `<li><button type="button" class="lu__b ${i === 0 ? "is-on" : ""}" aria-pressed="${i === 0}" data-i="${i}">
        <span class="lu__n">feat. ${String(i + 1).padStart(2, "0")}</span>
        <span class="lu__who">${esc(s.who)}</span>
        <span class="lu__line">${esc(s.line)}</span>
        <i class="lu__prog" aria-hidden="true"></i>
      </button></li>`).join("")}
    </ol>
  </div>`;
}

export function bindLineup(el: HTMLElement, screens: readonly Screen[]) {
  const imgs = $$<HTMLImageElement>(".lu__stage img", el), btns = $$<HTMLButtonElement>(".lu__b", el);
  const cap = $(".lu__cap", el);
  let cur = 0, auto = !reduced(), vis = false, timer = 0;
  const show = (i: number) => {
    cur = i;
    imgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
    btns.forEach((b, k) => { b.classList.toggle("is-on", k === i); b.setAttribute("aria-pressed", String(k === i)); });
    cap.innerHTML = `<b>${esc(screens[i].who)}</b><span>${esc(screens[i].line)}</span>`;
    el.classList.remove("is-run"); void el.offsetWidth; if (auto && vis) el.classList.add("is-run");
  };
  btns.forEach((b, i) => b.addEventListener("click", () => {
    auto = false; el.classList.remove("is-run"); clearInterval(timer);
    snd.tick(1.2); show(i);
  }));
  const run = () => { clearInterval(timer); if (auto && vis) { el.classList.add("is-run"); timer = window.setInterval(() => show((cur + 1) % screens.length), 4600); } };
  whileVisible(el, (v) => { vis = v; if (v) run(); else { clearInterval(timer); el.classList.remove("is-run"); } });
}
