// Films on kite paper: a silent preview loop that starts when it scrolls into view, the full film
// with sound behind a play button, and chapter buttons that jump to a moment. One film at a time.
import type { Film, Screen } from "@shared/content";
import { FILM_CREDIT } from "@shared/content";
import { gsap } from "gsap";
import { esc, fmtTime, kiteSVG, watchView, $, $$, reduced } from "./utils";
import { sound } from "./sound";

const fulls = new Set<HTMLVideoElement>();
const pauseOthers = (v: HTMLVideoElement) => fulls.forEach((o) => o !== v && !o.paused && o.pause());

export function filmHTML(film: Film, opts: { label?: string; compact?: boolean } = {}) {
  const ch = film.chapters ?? [];
  return `<figure class="film${opts.compact ? " film-compact" : ""}" data-film="${esc(film.id)}">
    <div class="film-frame">
      <span class="tie tie-l" aria-hidden="true"></span><span class="tie tie-r" aria-hidden="true"></span>
      <div class="film-stage">
        ${film.preview ? `<video class="film-preview" muted playsinline loop preload="none" poster="${film.poster}" aria-hidden="true" tabindex="-1" data-src="${film.preview}"></video>` : ""}
        <img class="film-poster" src="${film.poster}" alt="" loading="lazy" width="1280" height="720">
        <video class="film-full" playsinline controls preload="none" poster="${film.poster}" hidden aria-label="${esc(film.title)}"></video>
        <button class="film-play" type="button" aria-label="Play the film with sound: ${esc(film.title)}, ${esc(film.length)}">
          <span class="film-play-kite">${kiteSVG("", "var(--paper)", "var(--accent)")}<svg class="tri" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4.5 L15.5 10 L7 15.5Z"/></svg></span>
          <span class="film-play-text"><b>${esc(opts.label ?? "Play the film")}</b><small>${esc(film.length)}, with sound</small></span>
        </button>
      </div>
    </div>
    <figcaption class="film-cap"><b>${esc(film.title)}</b><span>${esc(film.description)}</span></figcaption>
    ${ch.length ? `<div class="chapters" role="group" aria-label="Jump to a moment in the film">${ch.map((c, i) => `<button type="button" class="chap" data-t="${c.t}" data-i="${i}"><span class="chap-knot" aria-hidden="true"></span><span class="chap-label">${esc(c.label)}</span><time>${fmtTime(c.t)}</time></button>`).join("")}</div>` : ""}
    <p class="film-credit">${esc(FILM_CREDIT)}</p>
  </figure>`;
}

export function initFilms(root: ParentNode = document) {
  for (const fig of $$<HTMLElement>(".film", root)) {
    if (fig.dataset.ready) continue;
    fig.dataset.ready = "1";
    const pv = $<HTMLVideoElement>(".film-preview", fig);
    const full = $<HTMLVideoElement>(".film-full", fig);
    const btn = $<HTMLButtonElement>(".film-play", fig);
    const chaps = $$<HTMLButtonElement>(".chap", fig);
    fulls.add(full);
    let started = false;
    const poster = $<HTMLImageElement>(".film-poster", fig);

    // Films open on dark frames. Keep the poster on top until the silent preview is at least as
    // bright as the poster, and bring it back over the dark stretches of the loop.
    if (pv) {
      const cv = document.createElement("canvas");
      cv.width = 16; cv.height = 9;
      const cx = cv.getContext("2d", { willReadFrequently: true })!;
      const lum = (src: CanvasImageSource) => {
        try {
          cx.drawImage(src, 0, 0, 16, 9);
          const d = cx.getImageData(0, 0, 16, 9).data;
          let s = 0;
          for (let i = 0; i < d.length; i += 4) s += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          return s / (d.length / 4);
        } catch { return 255; }
      };
      let target = -1, timer = 0;
      const ref = () => { if (target < 0 && poster.complete && poster.naturalWidth) target = Math.max(50, lum(poster) * 1.25); };
      const check = () => {
        ref();
        if (started || pv.readyState < 2 || target < 0) return;
        poster.classList.toggle("off", lum(pv) >= target);
      };
      pv.addEventListener("play", () => { clearInterval(timer); timer = window.setInterval(check, 280); });
      pv.addEventListener("pause", () => clearInterval(timer));
    }

    if (pv) {
      watchView(fig, (v) => {
        if (v && !started && !reduced()) {
          if (!pv.src) pv.src = pv.dataset.src!;
          pv.play().catch(() => {});
        } else pv.pause();
      }, "100px");
    }
    watchView(fig, (v) => { if (!v && !full.paused) full.pause(); });

    const start = (at?: number) => {
      if (!started) {
        started = true;
        full.src = fig.dataset.full!;
        full.hidden = false;
        btn.hidden = true;
        if (pv) { pv.pause(); pv.hidden = true; }
        poster.hidden = true;
        fig.classList.add("is-playing");
        sound.whoosh();
      }
      if (at !== undefined) {
        const seek = () => { full.currentTime = at; };
        if (full.readyState >= 1) seek(); else full.addEventListener("loadedmetadata", seek, { once: true });
      }
      pauseOthers(full);
      full.play().catch(() => {});
    };
    btn.addEventListener("click", () => start());
    full.addEventListener("play", () => { pauseOthers(full); fig.classList.add("is-playing"); });
    full.addEventListener("pause", () => fig.classList.remove("is-playing"));
    chaps.forEach((c) => c.addEventListener("click", () => {
      start(Number(c.dataset.t));
      gsap.fromTo(c, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    }));
    if (chaps.length) {
      full.addEventListener("timeupdate", () => {
        let idx = 0;
        chaps.forEach((c, i) => { if (full.currentTime + 0.25 >= Number(c.dataset.t)) idx = i; });
        chaps.forEach((c, i) => c.classList.toggle("on", i === idx));
      });
    }
  }
}

/** Films carry their source on the figure, so the HTML stays light until someone presses play. */
export function film(f: Film, opts: { label?: string; compact?: boolean } = {}) {
  return filmHTML(f, opts).replace(`data-film="${esc(f.id)}"`, `data-film="${esc(f.id)}" data-full="${f.src}"`);
}

/** Every person's screen, as tabs: a row of paper tags, the screenshot, and the plain line. */
export function screensHTML(id: string, screens: readonly Screen[], product: string) {
  return `<div class="screens" data-screens="${id}">
    <div class="screens-tabs" role="tablist" aria-label="${esc(product)} screens, one for each person">
      ${screens.map((s, i) => `<button type="button" role="tab" id="${id}-tab-${i}" aria-controls="${id}-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="tag-tab"><span class="tag-hole" aria-hidden="true"></span>${esc(s.who)}</button>`).join("")}
    </div>
    <div class="screens-view" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-tab-0">
      <div class="screens-img"><img src="${screens[0].img}" alt="${esc(product)} screen for the ${esc(screens[0].who.toLowerCase())}" width="1280" height="560" loading="lazy"></div>
      <p class="screens-line"><b>${esc(screens[0].who)}</b><span>${esc(screens[0].line)}</span></p>
    </div>
  </div>`;
}

export function initScreens(root: ParentNode, screens: readonly Screen[], product: string) {
  for (const box of $$<HTMLElement>(".screens", root)) {
    const tabs = $$<HTMLButtonElement>("[role=tab]", box);
    const view = $<HTMLElement>(".screens-view", box);
    const img = $<HTMLImageElement>("img", view);
    const line = $<HTMLElement>(".screens-line", view);
    screens.forEach((s) => { const i = new Image(); i.decoding = "async"; i.loading = "lazy"; i.src = s.img; });
    let cur = 0;
    const show = (i: number, focus = false) => {
      if (i === cur) return;
      const dir = i > cur ? 1 : -1;
      cur = i;
      tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      view.setAttribute("aria-labelledby", tabs[i].id);
      sound.pluck(i);
      const s = screens[i];
      const tl = gsap.timeline();
      tl.to([img, line], { opacity: 0, x: -24 * dir, rotateY: -8 * dir, duration: 0.18, ease: "power2.in" })
        .add(() => {
          img.src = s.img;
          img.alt = `${product} screen for the ${s.who.toLowerCase()}`;
          line.innerHTML = `<b>${esc(s.who)}</b><span>${esc(s.line)}</span>`;
        })
        .fromTo([img, line], { opacity: 0, x: 30 * dir, rotateY: 10 * dir }, { opacity: 1, x: 0, rotateY: 0, duration: 0.5, ease: "back.out(1.6)", stagger: 0.05 });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(i));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); show((cur + 1) % tabs.length, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); show((cur - 1 + tabs.length) % tabs.length, true); }
      });
    });
  }
}
