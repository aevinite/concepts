// Films: the poster is always on show first, then a muted preview loop runs only while the frame
// is on screen; "Play with sound" swaps in the full film. Chapter squares anywhere on the page
// ([data-seek]) jump the film to a moment and light up as it plays. One film plays at a time and
// everything pauses off screen or when the tab is hidden.
import type { Film, Screen } from "@shared/content";
import { gsap, $, $$, esc, reduced, icon } from "./util";
import { tap } from "./sound";

type Rec = { el: HTMLElement; v: HTMLVideoElement; id: string; full: boolean; visible: boolean; marks: number[] };
const films = new Map<string, Rec>();

export const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export function filmHTML(f: Film, o: { cls?: string; preview?: boolean; label?: string } = {}) {
  const prev = o.preview !== false && f.preview;
  return `<figure class="film ${o.cls ?? ""}" data-film="${f.id}">
    <div class="film__screen">
      <video class="film__v" playsinline muted preload="none" ${prev ? "loop" : ""} poster="${f.poster}" width="1280" height="720"
        data-src="${f.src}" data-preview="${prev ? f.preview : ""}" aria-label="${esc(f.title)}"></video>
      <button class="film__play" type="button" aria-label="Play ${esc(f.title)} with sound, ${esc(f.length)}">
        <span class="film__ic">${icon.play}</span><span class="film__pl"><b>Play with sound</b><small>${esc(f.length)}</small></span>
      </button>
      ${prev ? `<span class="film__tag" aria-hidden="true">Preview, no sound</span>` : ""}
    </div>
    ${o.label === "" ? "" : `<figcaption class="film__cap"><b>${esc(o.label ?? f.title)}</b><span>${esc(f.description)}</span></figcaption>`}
  </figure>`;
}

/** Chapter squares: a little track of board squares; the token sits on the playing chapter. */
export function chaptersHTML(f: Film, cls = "") {
  if (!f.chapters) return "";
  return `<div class="chap ${cls}" data-chap="${f.id}">
    <ol class="chap__list" aria-label="Chapters of ${esc(f.title)}">${f.chapters.map((c, i) =>
      `<li><button type="button" class="chap__sq" data-seek="${f.id}" data-t="${c.t}" data-i="${i}">
        <span class="chap__n">${i + 1}</span><span class="chap__l">${esc(c.label)}</span><span class="chap__t">${fmt(c.t)}</span></button></li>`).join("")}</ol>
  </div>`;
}

function goFull(r: Rec) {
  if (r.full) return;
  r.full = true;
  r.v.pause();
  r.v.loop = false;
  r.v.muted = false;
  r.v.controls = true;
  r.v.preload = "metadata";
  r.v.src = r.v.dataset.src!;
  r.el.classList.add("is-full");
}

function pauseOthers(id: string) {
  films.forEach((o) => { if (o.id !== id && !o.v.paused) o.v.pause(); });
}

export function seek(id: string, t: number, scroll = true) {
  const r = films.get(id);
  if (!r) return;
  goFull(r);
  pauseOthers(id);
  const go = () => { r.v.currentTime = t; void r.v.play().catch(() => {}); };
  if (r.v.readyState >= 1) go(); else r.v.addEventListener("loadedmetadata", go, { once: true });
  if (scroll && !r.visible) r.el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
}

export function currentChapter(id: string) {
  const r = films.get(id);
  return r ? Number(r.el.dataset.ch ?? -1) : -1;
}

export function initFilms(root: ParentNode = document) {
  $$(".film", root).forEach((el) => {
    const v = $<HTMLVideoElement>("video", el);
    const id = el.dataset.film!;
    const marks = $$<HTMLButtonElement>(`[data-seek="${id}"]`).map((b) => Number(b.dataset.t));
    const r: Rec = { el, v, id, full: false, visible: false, marks };
    films.set(id, r);
    $(".film__play", el).addEventListener("click", () => {
      tap();
      goFull(r);
      pauseOthers(id);
      void v.play().catch(() => {});
      v.focus({ preventScroll: true });
    });
    v.addEventListener("play", () => { pauseOthers(id); el.classList.add("is-playing"); });
    v.addEventListener("pause", () => el.classList.remove("is-playing"));
    v.addEventListener("timeupdate", () => {
      if (!r.full || !marks.length) return;
      let i = 0;
      marks.forEach((t, k) => { if (v.currentTime >= t - 0.25) i = k; });
      if (el.dataset.ch === String(i)) return;
      el.dataset.ch = String(i);
      $$<HTMLButtonElement>(`[data-seek="${id}"]`).forEach((b) => {
        const on = Number(b.dataset.i) === i;
        b.classList.toggle("is-now", on);
        if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      window.dispatchEvent(new CustomEvent("film:chapter", { detail: { id, i } }));
    });
    const io = new IntersectionObserver(([e]) => {
      r.visible = e.isIntersecting;
      if (!r.visible || document.hidden) { if (!v.paused) v.pause(); return; }
      if (!r.full && v.dataset.preview && !reduced()) {
        if (!v.getAttribute("src")) v.src = v.dataset.preview;
        void v.play().catch(() => {});
      }
    }, { threshold: 0.3 });
    io.observe(el);
  });
  document.addEventListener("visibilitychange", () => {
    films.forEach((r) => {
      if (document.hidden) r.v.pause();
      else if (r.visible && !r.full && r.v.dataset.preview && !reduced()) void r.v.play().catch(() => {});
    });
  });
  document.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-seek]");
    if (!b) return;
    tap();
    seek(b.dataset.seek!, Number(b.dataset.t));
    if (!reduced()) gsap.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  });
}

/* ------------------------------------------------------------------ each person's screen */

const PAWN_TONES = ["verm", "indigo", "leaf", "ochre", "teal", "maroon"];

export function screensHTML(id: string, screens: readonly Screen[], label: string) {
  return `<div class="players" data-screens>
    <div class="players__tabs" role="tablist" aria-label="${esc(label)}">
      ${screens.map((s, i) => `<button type="button" role="tab" id="tab-${id}-${i}" aria-controls="pane-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}" class="pt pt--${PAWN_TONES[i % PAWN_TONES.length]}">
        <svg class="pt__pawn" viewBox="0 0 24 30" aria-hidden="true"><path d="M5 27c0-4 2.4-6 4.2-8.2A5.4 5.4 0 1 1 14.8 18.8C16.6 21 19 23 19 27Z"/></svg>
        <span class="pt__who">${esc(s.who)}</span></button>`).join("")}
    </div>
    <figure class="players__view" id="pane-${id}" role="tabpanel" aria-labelledby="tab-${id}-0">
      <div class="players__frame">
        ${screens.map((s, i) => `<img src="${s.img}" alt="${esc(`${s.who} screen: ${s.line}`)}" width="1280" height="560" loading="lazy" decoding="async" class="${i === 0 ? "is-on" : ""}">`).join("")}
      </div>
      <figcaption>${screens.map((s, i) => `<p class="${i === 0 ? "is-on" : ""}" ${i === 0 ? "" : "hidden"}><b>${esc(s.who)}</b> ${esc(s.line)}</p>`).join("")}</figcaption>
    </figure>
  </div>`;
}

export function initScreens(root: ParentNode = document) {
  $$("[data-screens]", root).forEach((box) => {
    const tabs = $$<HTMLButtonElement>('[role="tab"]', box), imgs = $$("img", box), caps = $$("figcaption p", box), pane = $('[role="tabpanel"]', box);
    let cur = 0;
    const show = (i: number, focus = false) => {
      if (i === cur) return;
      const prev = cur; cur = i;
      tap();
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      pane.setAttribute("aria-labelledby", tabs[i].id);
      if (focus) tabs[i].focus();
      caps.forEach((c, k) => { c.hidden = k !== i; c.classList.toggle("is-on", k === i); });
      imgs[prev].classList.remove("is-on");
      imgs[i].classList.add("is-on");
      if (reduced()) return;
      const dir = i > prev ? 1 : -1;
      gsap.fromTo(imgs[i], { xPercent: 8 * dir, opacity: 0, rotation: 1.5 * dir }, { xPercent: 0, opacity: 1, rotation: 0, duration: 0.55, ease: "power3.out" });
      gsap.fromTo(caps[i], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 });
      const pawn = $(".pt__pawn", tabs[i]);
      gsap.fromTo(pawn, { y: 0 }, { keyframes: [{ y: -9, duration: 0.16, ease: "power2.out" }, { y: 0, duration: 0.3, ease: "bounce.out" }] });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(i));
      t.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); show((cur + 1) % tabs.length, true); }
        if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); show((cur - 1 + tabs.length) % tabs.length, true); }
      });
    });
  });
}
