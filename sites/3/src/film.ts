// AevOS Media Player. The muted preview loop is dithered live (1-bit or amber); press Play and
// the real film plays in full colour with sound, framed in the OS chrome. Chapters are a
// playlist: click one and the film jumps there. Only one film ever plays at a time.
import { FILM_CREDIT, type Film } from "@shared/content";
import { h, clock, lengthToSeconds } from "./dom";
import { ditherCanvas, liveDither } from "./dither";
import { glyph } from "./icons";
import { sfx } from "./sound";

const all = new Set<HTMLVideoElement>();
export function pauseAllFilms(except?: HTMLVideoElement) {
  all.forEach((v) => { if (v !== except && !v.paused) v.pause(); });
}

type Opts = { chapters?: boolean; compact?: boolean; label?: string };

export function filmPlayer(film: Film, o: Opts = {}) {
  const dur0 = lengthToSeconds(film.length);
  const chapters = o.chapters === false ? [] : film.chapters ?? [];

  const video = h("video", { class: "fp-video", preload: "none", playsinline: true, poster: film.poster, src: film.src, "aria-label": film.title, hidden: true });
  all.add(video);
  const stage = h("div", { class: "fp-stage" });
  const art = ditherCanvas(film.poster, 480, `${film.title}, poster`);
  art.classList.add("fp-art");
  stage.append(art);

  let preview: HTMLVideoElement | null = null;
  let live: HTMLCanvasElement | null = null;
  let stopLive: (() => void) | null = null;
  if (film.preview) {
    preview = h("video", { class: "fp-preview", muted: true, loop: true, playsinline: true, preload: "none", src: film.preview, "aria-hidden": "true", tabindex: "-1" });
    preview.muted = true;
    live = h("canvas", { class: "fp-live dith", "aria-hidden": "true" });
    stage.append(preview, live);
  }
  const big = h("button", { class: "fp-big", type: "button", "aria-label": `Play film: ${film.title}, ${film.length}` },
    h("span", { class: "fp-big-ico", html: glyph("play", 20) }),
    h("span", { class: "fp-big-t" }, "Play film"),
    h("span", { class: "fp-big-l" }, film.length));
  stage.append(video, big, h("div", { class: "fp-scan", "aria-hidden": "true" }));

  const playBtn = h("button", { class: "fp-btn fp-play", type: "button", "aria-label": "Play", html: glyph("play", 14) });
  const time = h("span", { class: "fp-time" }, "0:00");
  const fill = h("div", { class: "fp-fill" });
  const head = h("div", { class: "fp-head" });
  const track = h("div", { class: "fp-track", role: "slider", tabindex: "0", "aria-label": `Seek in ${film.title}`, "aria-valuemin": "0", "aria-valuemax": String(dur0), "aria-valuenow": "0" }, fill, head);
  chapters.forEach((c) => track.append(h("i", { class: "fp-tick", style: { left: `${(c.t / dur0) * 100}%` } })));
  const durEl = h("span", { class: "fp-time" }, clock(dur0));
  const muteBtn = h("button", { class: "fp-btn", type: "button", "aria-label": "Mute", html: glyph("sound", 14) });
  const fullBtn = h("button", { class: "fp-btn", type: "button", "aria-label": "Full screen", html: glyph("full", 14) });
  const bar = h("div", { class: "fp-bar" }, playBtn, time, track, durEl, muteBtn, fullBtn);

  const list = chapters.length
    ? h("ol", { class: "fp-list", "aria-label": `Chapters of ${film.title}` },
        chapters.map((c, i) => h("li", null, h("button", { type: "button", class: "fp-ch", "data-t": String(c.t) },
          h("span", { class: "fp-n" }, String(i + 1).padStart(2, "0")),
          h("span", { class: "fp-l" }, c.label),
          h("span", { class: "fp-t" }, clock(c.t))))))
    : null;

  const root = h("div", { class: `fp${o.compact ? " fp-compact" : ""}${list ? " fp-has-list" : ""}` },
    h("div", { class: "fp-main" }, stage, bar),
    list ? h("div", { class: "fp-side" }, h("p", { class: "fp-side-h" }, "Playlist"), list) : null,
    h("p", { class: "fp-credit" }, FILM_CREDIT));

  let started = false;
  const start = (t?: number) => {
    if (!started) {
      started = true;
      root.classList.add("on");
      video.hidden = false;
      video.preload = "auto";
      stopLive?.(); preview?.pause();
    }
    if (t !== undefined) {
      const seek = () => { video.currentTime = t; };
      if (video.readyState >= 1) seek(); else video.addEventListener("loadedmetadata", seek, { once: true });
    }
    pauseAllFilms(video);
    video.play().catch(() => {});
    sfx.click();
  };
  big.addEventListener("click", () => start());
  stage.addEventListener("click", (e) => { if (started && e.target === video) video.paused ? video.play() : video.pause(); });
  playBtn.addEventListener("click", () => (!started ? start() : video.paused ? (pauseAllFilms(video), video.play()) : video.pause()));
  muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    muteBtn.innerHTML = glyph(video.muted ? "mute" : "sound", 14);
    muteBtn.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
  });
  fullBtn.addEventListener("click", () => {
    if (!started) start();
    const v = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (v.requestFullscreen) v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.();
  });
  list?.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".fp-ch");
    if (b) start(Number(b.dataset.t));
  });

  const seekAt = (clientX: number) => {
    const r = track.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    start(f * (video.duration || dur0));
  };
  track.addEventListener("pointerdown", (e) => {
    seekAt(e.clientX);
    track.setPointerCapture(e.pointerId);
    const mv = (ev: PointerEvent) => { const r = track.getBoundingClientRect(); video.currentTime = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)) * (video.duration || dur0); };
    track.addEventListener("pointermove", mv);
    track.addEventListener("pointerup", () => track.removeEventListener("pointermove", mv), { once: true });
  });
  track.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k !== "ArrowLeft" && k !== "ArrowRight") return;
    e.preventDefault();
    if (!started) start();
    video.currentTime = Math.max(0, video.currentTime + (k === "ArrowRight" ? 5 : -5));
  });

  const sync = () => {
    const d = video.duration || dur0;
    const t = video.currentTime;
    const f = d ? t / d : 0;
    fill.style.transform = `scaleX(${f})`;
    head.style.left = `${f * 100}%`;
    time.textContent = clock(t);
    track.setAttribute("aria-valuenow", String(Math.round(t)));
    track.setAttribute("aria-valuetext", `${clock(t)} of ${clock(d)}`);
    if (list) {
      let cur = 0;
      chapters.forEach((c, i) => { if (t >= c.t - 0.2) cur = i; });
      list.querySelectorAll(".fp-ch").forEach((b, i) => b.classList.toggle("cur", started && i === cur));
    }
  };
  video.addEventListener("timeupdate", sync);
  video.addEventListener("loadedmetadata", () => { durEl.textContent = clock(video.duration); track.setAttribute("aria-valuemax", String(Math.round(video.duration))); });
  video.addEventListener("play", () => { root.classList.add("playing"); playBtn.innerHTML = glyph("pause", 14); playBtn.setAttribute("aria-label", "Pause"); });
  video.addEventListener("pause", () => { root.classList.remove("playing"); playBtn.innerHTML = glyph("play", 14); playBtn.setAttribute("aria-label", "Play"); });

  // Live dithered preview: only while on screen, the tab is visible and the film hasn't started.
  if (preview && live) {
    const pv = preview, lv = live;
    const io = new IntersectionObserver((es) => {
      const vis = es[es.length - 1].isIntersecting;
      if (vis && !started && !document.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        pv.preload = "auto";
        pv.play().then(() => { if (!stopLive) stopLive = liveDither(pv, lv, o.compact ? 200 : 256); }).catch(() => {});
      } else {
        pv.pause();
      }
    }, { threshold: 0.2 });
    io.observe(stage);
    document.addEventListener("visibilitychange", () => { if (document.hidden) pv.pause(); });
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) video.pause(); });

  return { el: root, video, start, stop: () => { video.pause(); preview?.pause(); } };
}

/** One player with a list of films to pick from (the product pages' "more films"). */
export function filmShelf(films: readonly Film[]) {
  let cur = filmPlayer(films[0], { chapters: false });
  const slot = h("div", { class: "shelf-slot" }, cur.el);
  const desc = h("p", { class: "shelf-desc" }, films[0].description);
  const list = h("ol", { class: "shelf-list" },
    films.map((f, i) => h("li", null, h("button", { type: "button", class: `shelf-item${i === 0 ? " cur" : ""}`, "aria-pressed": i === 0 ? "true" : "false", "data-i": String(i) },
      ditherCanvas(f.poster, 160),
      h("span", { class: "shelf-t" }, ((t) => t.charAt(0).toUpperCase() + t.slice(1))(f.title.replace(/^[^:]+:\s*/, ""))),
      h("span", { class: "shelf-l" }, f.length)))));
  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".shelf-item");
    if (!b) return;
    const i = Number(b.dataset.i);
    cur.stop();
    cur = filmPlayer(films[i], { chapters: false });
    slot.replaceChildren(cur.el);
    desc.textContent = films[i].description;
    list.querySelectorAll(".shelf-item").forEach((x, j) => { x.classList.toggle("cur", j === i); x.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    cur.start();
  });
  return h("div", { class: `shelf${films.length > 1 ? " multi" : ""}` }, h("div", { class: "shelf-main" }, slot, desc), films.length > 1 ? list : null);
}
