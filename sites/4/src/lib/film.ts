// Films: a silent preview loops while the frame is on screen; "Play" swaps in the full film
// with sound; chapter buttons jump to a moment. Only one film plays at a time.
import type { Film } from "@shared/content";
import { esc, fmtTime, pad2, ICON, $, $$ } from "./dom";
import { whenVisible } from "./core";
import { blip } from "./sound";

const players = new Set<FilmPlayer>();

export function filmHTML(film: Film, opts: { label?: string; big?: boolean } = {}) {
  const ch = film.chapters ?? [];
  return `<figure class="film${opts.big ? " film--big" : ""}" data-film="${esc(film.id)}">
  <div class="film-frame">
    <video class="film-v" playsinline muted preload="none" poster="${esc(film.poster)}" width="1280" height="720" aria-label="${esc(film.title)}"></video>
    <div class="film-cover">
      <button class="film-go" type="button">
        <span class="film-go-i">${ICON.play}</span>
        <span class="film-go-t">${esc(opts.label ?? "Play the film")}</span>
        <span class="film-go-l">${esc(film.length)} · sound on</span>
      </button>
    </div>
    <div class="film-ui" hidden>
      <button class="film-pp" type="button" aria-label="Pause">${ICON.pause}</button>
      <span class="film-tc"><span class="film-now">0:00</span> / <span class="film-dur">${esc(film.length)}</span></span>
      <input class="film-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Position in the film">
      <button class="film-mute" type="button" aria-pressed="false">Mute</button>
    </div>
    <span class="film-tag" aria-hidden="true">${ch.length ? `${ch.length} chapters` : "Film"} · ${esc(film.length)}</span>
  </div>
  ${ch.length ? `<ol class="chap" aria-label="Chapters of ${esc(film.title)}">${ch
    .map((c, i) => `<li><button type="button" class="chap-b" data-t="${c.t}"><span class="chap-n">${pad2(i + 1)}</span><span class="chap-l">${esc(c.label)}</span><span class="chap-t">${fmtTime(c.t)}</span><span class="chap-bar" aria-hidden="true"><i></i></span></button></li>`)
    .join("")}</ol>` : ""}
  <figcaption class="film-cap"><span class="film-title">${esc(film.title)}</span> <span class="film-desc">${esc(film.description)}</span></figcaption>
</figure>`;
}

export class FilmPlayer {
  fig: HTMLElement;
  v: HTMLVideoElement;
  film: Film;
  mode: "idle" | "preview" | "full" = "idle";
  onScreen = false;
  private pendingT: number | null = null;

  constructor(fig: HTMLElement, film: Film) {
    this.fig = fig;
    this.film = film;
    this.v = $("video", fig) as HTMLVideoElement;
    players.add(this);
    const v = this.v;
    $(".film-go", fig).addEventListener("click", () => { blip(660); this.full(this.v.ended ? 0 : null); });
    $(".film-pp", fig).addEventListener("click", () => (v.paused ? this.play() : v.pause()));
    v.addEventListener("click", () => { if (this.mode === "full") v.paused ? this.play() : v.pause(); });
    const seek = $(".film-seek", fig) as HTMLInputElement;
    seek.addEventListener("input", () => { if (v.duration) v.currentTime = (Number(seek.value) / 1000) * v.duration; });
    const mute = $(".film-mute", fig);
    mute.addEventListener("click", () => {
      v.muted = !v.muted;
      mute.setAttribute("aria-pressed", String(v.muted));
      mute.textContent = v.muted ? "Sound" : "Mute";
    });
    $$(".chap-b", fig).forEach((b) => b.addEventListener("click", () => { blip(520 + Number(b.dataset.t) * 6); this.full(Number(b.dataset.t)); }));
    v.addEventListener("timeupdate", () => this.sync());
    v.addEventListener("play", () => {
      if (this.mode !== "full") return;
      players.forEach((p) => p !== this && p.mode === "full" && !p.v.paused && p.v.pause());
      this.ui();
    });
    v.addEventListener("pause", () => this.ui());
    v.addEventListener("ended", () => { fig.classList.remove("is-playing"); fig.classList.add("is-ended"); $(".film-go-t", fig).textContent = "Play again"; });
    v.addEventListener("loadedmetadata", () => {
      if (this.pendingT != null && this.mode === "full") { v.currentTime = this.pendingT; this.pendingT = null; }
      if (this.mode === "full") $(".film-dur", fig).textContent = fmtTime(v.duration);
    });
    whenVisible(fig, (on) => {
      this.onScreen = on;
      if (on && this.mode !== "full") this.preview();
      else if (!on) { if (!v.paused) v.pause(); }
    }, "0px");
  }

  preview() {
    if (!this.film.preview) return;
    if (this.mode === "idle") {
      this.mode = "preview";
      this.v.src = this.film.preview;
      this.v.loop = true;
      this.v.muted = true;
      this.v.preload = "auto";
    }
    if (this.mode === "preview") void this.v.play().catch(() => undefined);
  }

  /** Switch to the full film with sound, optionally at a time. */
  full(t: number | null) {
    const v = this.v;
    if (this.mode !== "full") {
      this.mode = "full";
      v.pause();
      v.loop = false;
      v.src = this.film.src;
      v.preload = "metadata";
      this.pendingT = t ?? 0;
      this.fig.classList.add("is-full");
      ($(".film-ui", this.fig) as HTMLElement).hidden = false;
    } else if (t != null) {
      if (v.readyState >= 1) v.currentTime = t; else this.pendingT = t;
    }
    v.muted = false;
    const mute = $(".film-mute", this.fig);
    mute.setAttribute("aria-pressed", "false");
    mute.textContent = "Mute";
    this.fig.classList.remove("is-ended");
    this.play();
  }

  play() { void this.v.play().catch(() => undefined); }

  /** Load a different film into this frame (the extra-films switcher). */
  swap(film: Film, autoplay: boolean) {
    this.v.pause();
    this.film = film;
    this.mode = "idle";
    this.fig.classList.remove("is-full", "is-playing", "is-ended");
    this.v.removeAttribute("src");
    this.v.poster = film.poster;
    this.v.setAttribute("aria-label", film.title);
    this.v.load();
    ($(".film-ui", this.fig) as HTMLElement).hidden = true;
    $(".film-title", this.fig).textContent = film.title;
    $(".film-desc", this.fig).textContent = film.description;
    $(".film-go-l", this.fig).textContent = `${film.length} · sound on`;
    $(".film-go-t", this.fig).textContent = "Play the film";
    $(".film-tag", this.fig).textContent = `Film · ${film.length}`;
    $(".film-dur", this.fig).textContent = film.length;
    if (autoplay) this.full(0);
  }

  private ui() {
    const playing = !this.v.paused && this.mode === "full";
    this.fig.classList.toggle("is-playing", playing);
    const pp = $(".film-pp", this.fig);
    pp.innerHTML = playing ? ICON.pause : ICON.play;
    pp.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  private sync() {
    if (this.mode !== "full") return;
    const v = this.v, t = v.currentTime, d = v.duration || 1;
    $(".film-now", this.fig).textContent = fmtTime(t);
    ($(".film-seek", this.fig) as HTMLInputElement).value = String(Math.round((t / d) * 1000));
    this.fig.style.setProperty("--prog", String(t / d));
    const ch = this.film.chapters ?? [];
    const bs = $$(".chap-b", this.fig);
    ch.forEach((c, i) => {
      const end = ch[i + 1]?.t ?? d;
      const on = t >= c.t && t < end;
      bs[i]?.toggleAttribute("aria-current", on);
      const f = Math.min(1, Math.max(0, (t - c.t) / (end - c.t)));
      (bs[i]?.querySelector(".chap-bar i") as HTMLElement | null)?.style.setProperty("transform", `scaleX(${f.toFixed(3)})`);
    });
  }
}

export function wireFilms(root: ParentNode, films: Film[]) {
  return $$(".film", root).map((fig) => {
    const f = films.find((x) => x.id === fig.dataset.film)!;
    return new FilmPlayer(fig, f);
  });
}

/** Loops a silent clip (e.g. the Sweet Bites scroll demo) only while it is on screen. */
export function loopWhenVisible(v: HTMLVideoElement, src: string) {
  let loaded = false;
  whenVisible(v, (on) => {
    if (on) {
      if (!loaded) { v.src = src; loaded = true; }
      void v.play().catch(() => undefined);
    } else v.pause();
  }, "0px");
}
