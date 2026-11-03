// Films: a muted preview loop that only runs while on screen, then the full film with sound on
// demand. Chapter buttons anywhere on the page ([data-seek]) jump the film to a moment.
// One film plays at a time; everything pauses off screen and when the tab is hidden.
import type { Film, Screen } from "@shared/content";
import { gsap, $, $$, esc, reduced } from "./util";

type Rec = { el: HTMLElement; v: HTMLVideoElement; f: Film; full: boolean; visible: boolean };
const films = new Map<string, Rec>();

export const fmt = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export function filmScreen(f: Film, o: { cls?: string; preview?: boolean } = {}) {
  const prev = o.preview !== false && f.preview;
  return `<div class="film ${o.cls ?? ""}" data-film="${f.id}">
    <video class="film__v" playsinline muted preload="none" ${prev ? "loop" : ""} poster="${f.poster}" width="1280" height="720"
      data-src="${f.src}" data-preview="${prev ? f.preview : ""}" aria-label="${esc(f.title)}"></video>
    <button class="film__play" type="button" aria-label="Play ${esc(f.title)} with sound, ${esc(f.length)}">
      <span class="film__ic" aria-hidden="true"></span><span class="film__pl">Play with sound</span><small>${esc(f.length)}</small>
    </button>
    ${prev ? `<span class="film__tag" aria-hidden="true">Preview &middot; no sound</span>` : ""}
  </div>`;
}

export function chapterList(f: Film, cls = "") {
  if (!f.chapters) return "";
  return `<ol class="chapters ${cls}" aria-label="Chapters of ${esc(f.title)}">${f.chapters.map((c, i) =>
    `<li><button type="button" data-seek="${f.id}" data-t="${c.t}" data-i="${i}"><span class="ch__t">${fmt(c.t)}</span><span class="ch__l">${esc(c.label)}</span></button></li>`).join("")}</ol>`;
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
  films.forEach((o) => { if (o.f.id !== id && o.full && !o.v.paused) o.v.pause(); });
}

export function seek(id: string, t: number) {
  const r = films.get(id);
  if (!r) return;
  goFull(r);
  const go = () => { r.v.currentTime = t; void r.v.play().catch(() => {}); };
  if (r.v.readyState >= 1) go(); else r.v.addEventListener("loadedmetadata", go, { once: true });
  if (!r.visible) r.el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
}

export function initFilms(root: ParentNode = document) {
  $$(".film", root).forEach((el) => {
    const v = $<HTMLVideoElement>("video", el);
    const f: Film = { id: el.dataset.film!, title: v.getAttribute("aria-label") ?? "", length: "", src: v.dataset.src!, poster: v.poster, description: "" };
    const r: Rec = { el, v, f, full: false, visible: false };
    films.set(f.id, r);
    const chapters = $$<HTMLButtonElement>(`[data-seek="${f.id}"]`).map((b) => Number(b.dataset.t));
    if (chapters.length) f.chapters = chapters.map((t) => ({ label: "", t }));
    $(".film__play", el).addEventListener("click", () => {
      goFull(r);
      pauseOthers(f.id);
      void v.play().catch(() => {});
    });
    v.addEventListener("play", () => { if (r.full) { pauseOthers(f.id); el.classList.add("is-playing"); } });
    v.addEventListener("pause", () => el.classList.remove("is-playing"));
    v.addEventListener("timeupdate", () => {
      if (!r.full || !chapters.length) return;
      let i = 0;
      chapters.forEach((t, k) => { if (v.currentTime >= t - 0.2) i = k; });
      if (el.dataset.ch === String(i)) return;
      el.dataset.ch = String(i);
      $$<HTMLButtonElement>(`[data-seek="${f.id}"]`).forEach((b) => {
        const on = Number(b.dataset.i) === i;
        b.classList.toggle("is-now", on);
        if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      window.dispatchEvent(new CustomEvent("film:chapter", { detail: { id: f.id, i } }));
    });
    const io = new IntersectionObserver(([e]) => {
      r.visible = e.isIntersecting;
      if (!r.visible || document.hidden) { v.pause(); return; }
      if (!r.full && v.dataset.preview) {
        if (!v.src) v.src = v.dataset.preview;
        if (!reduced()) void v.play().catch(() => {});
      }
    }, { threshold: 0.35 });
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
    if (b) seek(b.dataset.seek!, Number(b.dataset.t));
  });
}

/* ---------- each person's screen ---------- */
export function screensHTML(id: string, screens: readonly Screen[], o: { label: string; kind: "kot" | "pass" }) {
  return `<div class="screens screens--${o.kind}" data-screens>
    <div class="screens__tabs" role="tablist" aria-label="${esc(o.label)}">
      ${screens.map((s, i) => `<button type="button" role="tab" id="tab-${id}-${i}" aria-controls="pane-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">
        <span class="st__no">${o.kind === "kot" ? `T${String(i + 1).padStart(2, "0")}` : `Seat ${i + 1}`}</span><span class="st__who">${esc(s.who)}</span></button>`).join("")}
    </div>
    <figure class="screens__view" id="pane-${id}" role="tabpanel" aria-labelledby="tab-${id}-0">
      <div class="screens__frame">
        ${screens.map((s, i) => `<img src="${s.img}" alt="${esc(`${s.who} screen: ${s.line}`)}" width="1280" height="560" loading="lazy" decoding="async" class="${i === 0 ? "is-on" : ""}">`).join("")}
        <span class="screens__scan" aria-hidden="true"></span>
      </div>
      <figcaption>${screens.map((s, i) => `<p class="${i === 0 ? "is-on" : ""}" ${i === 0 ? "" : "hidden"}><b>${esc(s.who)}</b> ${esc(s.line)}</p>`).join("")}</figcaption>
    </figure>
  </div>`;
}

export function initScreens(root: ParentNode = document, onSwitch?: () => void) {
  $$("[data-screens]", root).forEach((box) => {
    const tabs = $$<HTMLButtonElement>('[role="tab"]', box), imgs = $$("img", box), caps = $$("figcaption p", box), scan = $(".screens__scan", box), pane = $('[role="tabpanel"]', box);
    let cur = 0;
    const show = (i: number, focus = false) => {
      if (i === cur) return;
      const prev = cur; cur = i;
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      pane.setAttribute("aria-labelledby", tabs[i].id);
      if (focus) tabs[i].focus();
      caps.forEach((c, k) => { c.hidden = k !== i; c.classList.toggle("is-on", k === i); });
      imgs[prev].classList.remove("is-on");
      imgs[i].classList.add("is-on");
      onSwitch?.();
      if (reduced()) return;
      gsap.fromTo(imgs[i], { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.55, ease: "steps(9)" });
      gsap.fromTo(scan, { top: "0%", autoAlpha: 1 }, { top: "100%", duration: 0.55, ease: "steps(9)", onComplete: () => { gsap.set(scan, { autoAlpha: 0 }); } });
      gsap.fromTo(caps[i], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.35 });
      gsap.fromTo(tabs[i], { y: -4 }, { y: 0, duration: 0.5, ease: "back.out(3)" });
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
