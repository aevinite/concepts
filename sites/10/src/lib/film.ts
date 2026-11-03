// One film on one screen. The poster always shows until a real frame is ready (never a black
// box). Previews are muted loops that run only on screen. Scrubbing is throttled: a new seek is
// sent only when the previous one has landed ("seeked"), so a long film never chokes while the
// record is being spun. One film plays at a time (the two club decks may play together).
import type { Film } from "@shared/content";
import { esc, parseLen, whileVisible, clamp } from "./util";

type Sub = (t: number, playing: boolean) => void;
const all = new Set<Player>();

export function screenHTML(f: Film, cls = "", lazy = true) {
  return `<div class="scr ${cls}" data-film="${f.id}">
    <video playsinline muted preload="none" width="1280" height="720" poster="${f.poster}" aria-label="${esc(f.title)}"></video>
    <img class="scr__poster" src="${f.poster}" alt="${esc(f.title)}" width="1280" height="720" ${lazy ? `loading="lazy"` : `fetchpriority="high"`}>
    <span class="scr__note" hidden>This browser can't play the film here. The poster shows what it is about.</span>
  </div>`;
}

export class Player {
  readonly v: HTMLVideoElement;
  readonly root: HTMLElement;
  film: Film;
  dur: number;
  full = false;
  group: string;
  private target = 0;
  private seeking = false;
  private seekSent = 0;
  private simT = 0;
  private sim = false; // the video cannot play here: keep a clock so the toy still works
  private simOn = false;
  private visible = false;
  private subs = new Set<Sub>();
  scrubbing = false;
  previewOn = false;

  constructor(root: HTMLElement, film: Film, opts: { group?: string; preview?: boolean } = {}) {
    this.root = root;
    this.v = root.querySelector("video")!;
    this.film = film;
    this.group = opts.group ?? "";
    this.dur = parseLen(film.length) || 60;
    all.add(this);
    const v = this.v;
    const frame = () => { if (v.readyState >= 2) root.classList.add("has-frame"); };
    v.addEventListener("loadeddata", frame);
    v.addEventListener("playing", () => { frame(); this.emit(); });
    v.addEventListener("pause", () => this.emit());
    v.addEventListener("timeupdate", () => this.emit());
    v.addEventListener("loadedmetadata", () => { if (this.full && isFinite(v.duration)) this.dur = v.duration; });
    v.addEventListener("seeked", () => {
      frame();
      this.seeking = false;
      if (Math.abs(v.currentTime - this.target) > 0.05 && this.scrubbing) this.sendSeek();
      this.emit();
    });
    v.addEventListener("ended", () => this.emit());
    v.addEventListener("error", () => this.fail());
    whileVisible(root, (vis) => {
      this.visible = vis;
      if (!vis && this.playing) this.pause();
      if (this.previewOn && !this.full) vis ? void v.play().catch(() => {}) : v.pause();
    }, "60px");
    document.addEventListener("visibilitychange", () => { if (document.hidden && this.playing) this.pause(); });
    if (opts.preview && film.preview) this.startPreview();
  }

  on(f: Sub) { this.subs.add(f); return () => this.subs.delete(f); }
  private emit() { const t = this.time, p = this.playing; this.subs.forEach((f) => f(t, p)); }

  get time() {
    if (this.sim) return this.simT;
    if (this.scrubbing || this.seeking) return this.target;
    return this.full ? this.v.currentTime : this.target;
  }
  get playing() { return this.sim ? this.simOn : this.full && !this.v.paused && !this.v.ended; }

  /** Muted preview loop that runs while on screen (the full film comes on a press). */
  startPreview() {
    const f = this.film;
    if (!f.preview) return;
    this.previewOn = true;
    this.v.loop = true;
    this.v.muted = true;
    this.v.src = f.preview;
    this.v.preload = "auto";
    if (this.visible) void this.v.play().catch(() => {});
  }

  /** Swap in the full film (kept muted until a real press asks for sound). */
  goFull() {
    if (this.full) return;
    this.full = true;
    this.previewOn = false;
    this.root.classList.remove("has-frame");
    this.v.pause();
    this.v.loop = false;
    this.v.preload = "auto";
    this.v.src = this.film.src;
    this.root.classList.add("is-full");
  }

  /** Load a different film onto this screen (bonus tracks on the product pages). */
  load(f: Film) {
    this.pause();
    this.film = f;
    this.dur = parseLen(f.length) || 60;
    this.full = false;
    this.sim = false;
    this.simT = 0;
    this.target = 0;
    this.root.classList.remove("has-frame", "is-full", "is-sim");
    (this.root.querySelector(".scr__note") as HTMLElement).hidden = true;
    const img = this.root.querySelector<HTMLImageElement>(".scr__poster")!;
    img.src = f.poster; img.alt = f.title;
    this.v.poster = f.poster;
    this.v.setAttribute("aria-label", f.title);
    this.v.removeAttribute("src");
    this.v.load();
    this.root.dataset.film = f.id;
    this.emit();
  }

  play(from?: number) {
    this.goFull();
    all.forEach((o) => { if (o !== this && o.playing && !(o.group && o.group === this.group)) o.pause(); });
    if (from != null) this.seek(from);
    if (this.sim) { this.simOn = true; this.tickSim(); this.emit(); return; }
    this.v.muted = false;
    const p = this.v.play();
    if (p) p.catch((e: Error) => { if (e.name === "NotSupportedError") this.fail(true); });
    this.emit();
  }

  pause() {
    if (this.sim) { this.simOn = false; this.emit(); return; }
    this.v.pause();
  }

  toggle() { this.playing ? this.pause() : this.play(); }

  /** Throttled seek: only one seek in flight; the newest target wins. */
  seek(t: number) {
    this.target = clamp(t, 0, Math.max(0, this.dur - 0.1));
    if (this.sim) { this.simT = this.target; this.emit(); return; }
    this.goFull();
    if (!this.seeking || performance.now() - this.seekSent > 900) this.sendSeek();
    this.emit();
  }
  private sendSeek() {
    this.seeking = true;
    this.seekSent = performance.now();
    const v = this.v as HTMLVideoElement & { fastSeek?: (t: number) => void };
    if (this.scrubbing && v.fastSeek) v.fastSeek(this.target);
    else v.currentTime = this.target;
  }

  /** Scrub mode: the film holds still while the record is held, and follows it when moved. */
  scrubStart() { this.scrubbing = true; this.target = this.time; this.goFull(); if (!this.sim) this.v.pause(); }
  scrubEnd() {
    this.scrubbing = false;
    if (!this.sim && Math.abs(this.v.currentTime - this.target) > 0.05) { this.v.currentTime = this.target; this.seeking = true; }
  }

  /** Crossfader level 0..1: the picture fades and the sound follows. */
  setLevel(x: number) {
    this.root.style.setProperty("--lvl", String(x));
    this.v.volume = clamp(x, 0, 1);
  }

  private fail(fromPlay = false) {
    if (!this.full && !fromPlay) return;
    if (this.sim) return;
    const wasOn = fromPlay || this.playing;
    this.sim = true;
    this.simT = this.target;
    this.root.classList.add("is-sim");
    (this.root.querySelector(".scr__note") as HTMLElement).hidden = false;
    if (wasOn) { this.simOn = true; this.tickSim(); }
    this.emit();
  }
  private tickSim() {
    let last = performance.now();
    const step = (now: number) => {
      if (!this.simOn) return;
      if (!this.scrubbing) this.simT = Math.min(this.dur, this.simT + (now - last) / 1000);
      last = now;
      if (this.simT >= this.dur) { this.simOn = false; this.emit(); return; }
      this.emit();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
