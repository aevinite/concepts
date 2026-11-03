// Films drawn as a detail on the sheet (light) or a lit backglass (dark). A silent preview loop
// starts only when in view and stays hidden under the poster until its frame is as bright as the
// poster (the films open on dark frames); the full film with sound plays behind the play button;
// chapters sit on a time ruler and as a list, and both jump to their moment. One film at a time.
import { FILM_CREDIT, type Film, type Screen } from "@shared/content";
import { $, $$, esc, fmtTime, parseLength, reduced, watchView, gsap } from "./core";
import { lamps } from "./chrome";
import { sfx } from "./sound";

const fulls = new Set<HTMLVideoElement>();
export const pauseAllFilms = (except?: HTMLVideoElement) => fulls.forEach((v) => v !== except && !v.paused && v.pause());

export function filmHTML(film: Film, opts: { label?: string; compact?: boolean; dims?: boolean } = {}) {
  const ch = film.chapters ?? [];
  const len = parseLength(film.length) || 60;
  const ticks = Math.floor(len / 5);
  return `<figure class="film${opts.compact ? " film-compact" : ""}" data-film="${esc(film.id)}" data-len="${len}">
    <div class="film-frame">
      ${lamps(opts.compact ? 18 : 30, "film-lamps")}
      ${opts.dims === false ? "" : `<span class="dimh film-dw" aria-hidden="true"><i>1280</i></span><span class="dimv film-dh" aria-hidden="true"><i>720</i></span>`}
      <div class="film-stage">
        ${film.preview ? `<video class="film-pv" muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" data-src="${film.preview}"></video>` : ""}
        <img class="film-poster" src="${film.poster}" alt="" loading="lazy" decoding="async" width="1280" height="720">
        <video class="film-full" playsinline controls preload="none" poster="${film.poster}" data-src="${film.src}" hidden aria-label="${esc(film.title)}"></video>
        <button class="film-play" type="button" aria-label="Play with sound: ${esc(film.title)}, ${esc(film.length)}">
          <span class="fp-ring" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/><path d="M16 12.5 L28 20 L16 27.5Z"/></svg></span>
          <span class="fp-t"><b>${esc(opts.label ?? "Play the film")}</b><small>${esc(film.length)} · sound on</small></span>
        </button>
      </div>
    </div>
    ${ch.length ? `<div class="film-ruler" role="group" aria-label="Jump to a moment in the film">
      <div class="rl-track" aria-hidden="true">
        ${Array.from({ length: ticks + 1 }, (_, i) => `<i class="${i % 2 ? "" : "mj"}" style="left:${((i * 5) / len) * 100}%"></i>`).join("")}
        <span class="rl-cur"></span>
      </div>
      <div class="rl-marks">
        ${ch.map((c, i) => `<button type="button" class="rl-mk" data-t="${c.t}" style="left:${(c.t / len) * 100}%" tabindex="-1" aria-hidden="true"><span>${i + 1}</span></button>`).join("")}
      </div>
      <ol class="chaps">
        ${ch.map((c, i) => `<li><button type="button" class="chap" data-t="${c.t}" data-i="${i}"><span class="chap-n" aria-hidden="true">${i + 1}</span><span class="chap-l">${esc(c.label)}</span><time>${fmtTime(c.t)}</time></button></li>`).join("")}
      </ol>
    </div>` : ""}
    <figcaption class="film-cap"><b>${esc(film.title)}</b><span>${esc(film.description)}</span><small>${esc(FILM_CREDIT)}</small></figcaption>
  </figure>`;
}

export function initFilms(root: ParentNode = document) {
  for (const fig of $$<HTMLElement>(".film", root)) {
    if (fig.dataset.ready) continue;
    fig.dataset.ready = "1";
    const pv = $<HTMLVideoElement>(".film-pv", fig);
    const full = $<HTMLVideoElement>(".film-full", fig);
    const poster = $<HTMLImageElement>(".film-poster", fig);
    const btn = $<HTMLButtonElement>(".film-play", fig);
    const chaps = $$<HTMLButtonElement>(".chap", fig);
    const marks = $$<HTMLButtonElement>(".rl-mk", fig);
    const cur = $<HTMLElement>(".rl-cur", fig);
    const len = Number(fig.dataset.len) || 60;
    fulls.add(full);
    let started = false;

    // keep the poster over the preview until the preview's frame is about as bright as it
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
      const check = () => {
        if (target < 0 && poster.complete && poster.naturalWidth) target = Math.max(40, lum(poster) * 0.9);
        if (started || pv.readyState < 2 || target < 0) return;
        poster.classList.toggle("off", pv.currentTime > 0.4 && lum(pv) >= target);
      };
      pv.addEventListener("play", () => { clearInterval(timer); timer = window.setInterval(check, 250); });
      pv.addEventListener("pause", () => clearInterval(timer));
      watchView(fig, (v) => {
        if (v && !started && !reduced()) {
          if (!pv.src) pv.src = pv.dataset.src!;
          pv.play().catch(() => {});
        } else if (!pv.paused) pv.pause();
      }, "60px");
    }
    watchView(fig, (v) => { if (!v && !full.paused) full.pause(); });

    const begin = (t?: number) => {
      pauseAllFilms(full);
      document.querySelectorAll<HTMLVideoElement>("video.wk-vid").forEach((v) => v.pause());
      if (!started) {
        started = true;
        fig.classList.add("playing");
        if (pv) { pv.pause(); pv.removeAttribute("src"); pv.load(); }
        full.hidden = false;
        full.src = full.dataset.src!;
        btn.hidden = true;
      }
      // preload="none": play() starts the load; the jump happens as soon as the length is known
      if (t !== undefined) {
        if (full.readyState >= 1) full.currentTime = t;
        else full.addEventListener("loadedmetadata", () => { full.currentTime = t; }, { once: true });
      }
      full.play().catch(() => {});
      full.focus({ preventScroll: true });
    };
    btn.addEventListener("click", () => { sfx.lever(); begin(); });
    [...chaps, ...marks].forEach((c) => c.addEventListener("click", () => {
      sfx.blip(Number(c.dataset.i ?? 0));
      begin(Number(c.dataset.t));
      gsap.fromTo(c, { scale: 0.94 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
    }));
    const times = chaps.map((c) => Number(c.dataset.t));
    full.addEventListener("timeupdate", () => {
      const t = full.currentTime;
      if (cur) cur.style.transform = `translateX(${Math.min(100, (t / (full.duration || len)) * 100)}cqw)`;
      let a = -1;
      times.forEach((tt, i) => { if (t >= tt - 0.2) a = i; });
      chaps.forEach((c, i) => c.classList.toggle("on", i === a));
      marks.forEach((c, i) => c.classList.toggle("on", i <= a));
    });
  }
}

/** Screens per person: tabbed "detail views" (home page). */
export function screensHTML(screens: readonly Screen[], name: string) {
  const id = name.toLowerCase().replace(/\W+/g, "");
  return `<div class="scr" data-scr>
    <div class="scr-tabs" role="tablist" aria-label="${esc(name)} screens, one for each person">
      ${screens.map((s, i) => `<button type="button" role="tab" id="t-${id}-${i}" aria-controls="p-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="scr-tab"><span class="scr-k" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span class="scr-w">${esc(s.who)}</span></button>`).join("")}
    </div>
    <div class="scr-view" role="tabpanel" id="p-${id}" aria-labelledby="t-${id}-0">
      ${lamps(22, "scr-lamps")}
      <div class="scr-fig">
        ${screens.map((s, i) => `<img src="${s.img}" alt="${esc(name)} screen for the ${esc(s.who.toLowerCase())}: ${esc(s.line)}" loading="lazy" decoding="async" width="1280" height="560" class="${i === 0 ? "on" : ""}">`).join("")}
        <span class="scr-callout" aria-hidden="true"><i></i></span>
      </div>
      <p class="scr-line"><b>Detail ${String.fromCharCode(65)} · ${esc(screens[0].who)}</b><span>${esc(screens[0].line)}</span></p>
    </div>
  </div>`;
}

export function initScreens(root: ParentNode = document, data: Record<string, readonly Screen[]> = {}) {
  for (const box of $$<HTMLElement>("[data-scr]", root)) {
    const tabs = $$<HTMLButtonElement>(".scr-tab", box);
    const imgs = $$<HTMLImageElement>(".scr-fig img", box);
    const line = $<HTMLElement>(".scr-line", box);
    const panel = $<HTMLElement>(".scr-view", box);
    const list = data[box.dataset.key ?? ""] ?? [];
    let cur = 0;
    const show = (i: number, focus = false) => {
      if (i === cur) return;
      const prev = cur;
      cur = i;
      tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      panel.setAttribute("aria-labelledby", tabs[i].id);
      imgs[prev].classList.remove("on");
      imgs[i].classList.add("on");
      const s = list[i];
      if (s) line.innerHTML = `<b>Detail ${String.fromCharCode(65 + i)} · ${esc(s.who)}</b><span>${esc(s.line)}</span>`;
      sfx.blip(i);
      if (!reduced()) {
        gsap.fromTo(imgs[i], { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.55, ease: "power3.out" });
        gsap.fromTo(line, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 });
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(i));
      t.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); show((cur + 1) % tabs.length, true); }
        if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); show((cur - 1 + tabs.length) % tabs.length, true); }
      });
    });
    // swipe the picture to change person
    let x0 = 0, y0 = 0;
    const fig = $<HTMLElement>(".scr-fig", box);
    fig.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; });
    fig.addEventListener("pointerup", (e) => {
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show((cur + (dx < 0 ? 1 : -1) + tabs.length) % tabs.length);
    });
  }
}
