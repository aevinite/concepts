// Films play on a TV drawn into a panel. A silent preview loops while the TV is on screen; "Watch
// the episode" swaps in the full film with sound; caption-box chapter buttons jump to a moment.
// One film plays at a time; anything off screen or in a hidden tab pauses.
import type { Film } from "@shared/content";
import { FILM_CREDIT } from "@shared/content";
import { $, $$, esc, fmtTime, reduced, watchView } from "./util";
import { sfx } from "./sound";

const all = new Set<HTMLVideoElement>();
export const pauseAllBut = (v?: HTMLVideoElement) => all.forEach((o) => o !== v && !o.paused && o.pause());
document.addEventListener("visibilitychange", () => document.hidden && pauseAllBut());

export function tvHTML(film: Film, opts: { label?: string; small?: boolean; chapterTitle?: string } = {}) {
  const ch = film.chapters ?? [];
  return `<figure class="tv-wrap${opts.small ? " tv-small" : ""}" data-full="${film.src}">
    <div class="tv no-pow">
      <span class="tv-ant" aria-hidden="true"></span>
      <div class="tv-body">
        <div class="tv-screen">
          ${film.preview ? `<video class="tv-preview" muted playsinline loop preload="none" poster="${film.poster}" data-src="${film.preview}" aria-hidden="true" tabindex="-1"></video>` : `<img class="tv-poster" src="${film.poster}" alt="" loading="lazy" width="1280" height="720">`}
          <video class="tv-full" playsinline controls preload="none" poster="${film.poster}" hidden aria-label="${esc(film.title)}"></video>
          <button class="tv-play" type="button" aria-label="Play with sound: ${esc(film.title)}, ${esc(film.length)}">
            <span class="tv-play-burst" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6 3.5 L16 10 L6 16.5Z"/></svg></span>
            <span class="tv-play-text"><b>${esc(opts.label ?? "Watch the episode")}</b><small>${esc(film.length)}, with sound</small></span>
          </button>
          <span class="tv-glare" aria-hidden="true"></span>
        </div>
        <div class="tv-knobs" aria-hidden="true"><i></i><i></i><span></span></div>
      </div>
      <span class="tv-legs" aria-hidden="true"></span>
    </div>
    <figcaption class="tv-cap"><b>${esc(film.title)}</b> <span>${esc(film.description)}</span></figcaption>
    ${ch.length ? `<div class="chapters" role="group" aria-label="${esc(opts.chapterTitle ?? "Jump to a moment in the film")}">${ch.map((c, i) => `<button type="button" class="chap" data-t="${c.t}"><span class="chap-n">Ch. ${i + 1}</span><span class="chap-l">${esc(c.label)}</span><time>${fmtTime(c.t)}</time></button>`).join("")}</div>` : ""}
    <p class="credit">${esc(FILM_CREDIT)}</p>
  </figure>`;
}

export function initFilms(root: ParentNode = document) {
  for (const fig of $$(".tv-wrap", root)) {
    if (fig.dataset.ready) continue;
    fig.dataset.ready = "1";
    const pv = $<HTMLVideoElement>(".tv-preview", fig);
    const full = $<HTMLVideoElement>(".tv-full", fig);
    const btn = $<HTMLButtonElement>(".tv-play", fig);
    const chaps = $$<HTMLButtonElement>(".chap", fig);
    all.add(full);
    if (pv) all.add(pv);
    let started = false;
    if (pv) watchView(fig, (v) => {
      if (v && !started && !reduced()) { if (!pv.src) pv.src = pv.dataset.src!; pv.play().catch(() => {}); }
      else pv.pause();
    }, "80px");
    watchView(fig, (v) => { if (!v && !full.paused) full.pause(); });

    const start = (at?: number) => {
      if (!started) {
        started = true;
        full.src = fig.dataset.full!;
        full.hidden = false;
        btn.hidden = true;
        if (pv) { pv.pause(); pv.hidden = true; }
        fig.classList.add("is-on");
        sfx.click();
      }
      pauseAllBut(full);
      // play() right away (it starts the download and keeps the tap's permission to play sound);
      // the seek lands as soon as the film knows its length
      if (at != null) {
        if (full.readyState >= 1) full.currentTime = at;
        else full.addEventListener("loadedmetadata", () => (full.currentTime = at), { once: true });
      }
      full.play().catch(() => {});
    };
    btn.addEventListener("click", () => start());
    full.addEventListener("play", () => pauseAllBut(full));
    chaps.forEach((c) => c.addEventListener("click", () => { start(Number(c.dataset.t)); full.focus({ preventScroll: true }); }));
    if (chaps.length) full.addEventListener("timeupdate", () => {
      const t = full.currentTime;
      let cur = 0;
      chaps.forEach((c, i) => { if (t >= Number(c.dataset.t) - 0.05) cur = i; });
      chaps.forEach((c, i) => c.classList.toggle("on", i === cur));
    });
  }
}
