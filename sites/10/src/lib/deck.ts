// The turntable. Spin the record with a finger or mouse to scrub its film; let go and it coasts
// back to normal speed. Tap the record to start or stop. Drag the tonearm to cue a moment.
// The grooves are pressed with the film's real chapters (lighter rings between tracks), and the
// tonearm walks from the outer groove to the inner one as the film plays.
// Built at one design size (560 x 440) and scaled to fit, so the geometry stays exact.
import type { Film } from "@shared/content";
import { Player } from "./film";
import { $, esc, fmt, clamp, loop, reduced, gsap, parseLen } from "./util";
import * as snd from "./sound";

const W = 560, H = 440;
const C = { x: 214, y: 220 };       // platter centre
const P = { x: 490, y: 70 };        // tonearm pivot
const L = 300;                       // pivot to stylus
const R_OUT = 178, R_IN = 84;        // first and last groove

/** Where the stylus is for a tonearm angle (deg, clockwise from straight down). */
const tip = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: P.x - L * Math.sin(a), y: P.y + L * Math.cos(a) };
};
const radiusAt = (deg: number) => { const t = tip(deg); return Math.hypot(t.x - C.x, t.y - C.y); };
/** Angle that puts the stylus at radius r (bisection: radius falls as the arm swings in). */
function angleFor(r: number) {
  let lo = 0, hi = 70;
  for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; radiusAt(m) > r ? (lo = m) : (hi = m); }
  return (lo + hi) / 2;
}
const A_OUT = angleFor(R_OUT), A_IN = angleFor(R_IN), A_REST = -2;

let uid = 0;

export type DeckOpts = {
  side: string;            // "A" / "B": track prefix
  label: string;           // printed round the label
  name: string;            // big word on the label
  mark: string;            // image in the middle of the label
  tone: "brand" | "gold" | "amber";
  hint?: boolean;
};

function recordSVG(f: Film, dur: number, o: DeckOpts, id: string) {
  const grooves: string[] = [];
  for (let r = R_IN; r <= R_OUT + 2; r += 1.9) grooves.push(`<circle r="${r.toFixed(1)}"/>`);
  const gaps = (f.chapters ?? []).slice(1).map((c) => {
    const r = R_OUT - ((R_OUT - R_IN) * c.t) / dur;
    return `<circle r="${r.toFixed(1)}"/>`;
  }).join("");
  const ring = `${o.label} · ${o.label} · `;
  return `<svg class="rec" viewBox="-190 -190 380 380" aria-hidden="true">
    <defs><path id="lp${id}" d="M0,-47 a47,47 0 1,1 -0.01,0"/></defs>
    <circle class="rec__vinyl" r="188"/>
    <g class="rec__grooves">${grooves.join("")}</g>
    <g class="rec__gaps">${gaps}<circle r="${R_OUT + 3}"/><circle r="${R_IN - 3}"/></g>
    <circle class="rec__label" r="66" data-tone="${o.tone}"/>
    <circle class="rec__label-ring" r="61"/>
    <text class="rec__ring"><textPath href="#lp${id}">${esc(ring)}</textPath></text>
    <image href="${o.mark}" x="-21" y="-30" width="42" height="${o.tone === "amber" ? 42 : 26}" preserveAspectRatio="xMidYMid meet"/>
    <text class="rec__name" y="${o.tone === "amber" ? 26 : 14}" text-anchor="middle">${esc(o.name)}</text>
    <text class="rec__side" y="30" text-anchor="middle">${o.tone === "amber" ? "" : `SIDE ${o.side} · 33⅓`}</text>
  </svg>`;
}

const armSVG = `<svg class="arm__svg" viewBox="-40 -64 80 ${L + 70}" width="80" height="${L + 70}" aria-hidden="true">
  <rect class="arm__weight" x="-15" y="-60" width="30" height="34" rx="4"/>
  <rect class="arm__weight-band" x="-15" y="-38" width="30" height="5"/>
  <line class="arm__tube" x1="0" y1="-26" x2="0" y2="${L - 40}"/>
  <path class="arm__lift" d="M10 ${L - 34} h12 v4 h-12z"/>
  <rect class="arm__shell" x="-11" y="${L - 42}" width="22" height="38" rx="3"/>
  <rect class="arm__cart" x="-7" y="${L - 22}" width="14" height="18" rx="1.5"/>
  <circle class="arm__tip" cx="0" cy="${L - 1}" r="1.6"/>
  <line class="arm__hit" x1="0" y1="-56" x2="0" y2="${L}"/>
</svg>`;

export function deckHTML(f: Film, o: DeckOpts, cls = "") {
  const id = String(++uid);
  const dur = parseLen(f.length) || 74;
  return `<div class="tt ${cls}" data-tone="${o.tone}" data-deck="${id}">
    <div class="tt__fit"><div class="tt__body" style="width:${W}px;height:${H}px">
      <div class="tt__plinth"></div>
      <span class="tt__brand" aria-hidden="true">Aevinite Records <i>Direct drive</i></span>
      <div class="tt__well" style="left:${C.x - 204}px;top:${C.y - 204}px"></div>
      <div class="tt__platter" role="slider" tabindex="0" aria-label="Record: spin it to move through the film, tap to play or stop"
        aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
        style="left:${C.x - 198}px;top:${C.y - 198}px">
        <div class="tt__spin">
          <div class="tt__rim"></div>
          <div class="tt__rec">${recordSVG(f, dur, o, id)}</div>
        </div>
        <div class="tt__sheen"></div>
        <div class="tt__spindle"></div>
      </div>
      <span class="tt__strobe" aria-hidden="true" style="left:${C.x - 222}px;top:${C.y + 150}px"></span>
      <div class="tt__base" style="left:${P.x - 34}px;top:${P.y - 34}px"></div>
      <div class="tt__rest" style="left:${P.x - 8}px;top:${P.y + L - 46}px"></div>
      <div class="arm" style="left:${P.x}px;top:${P.y}px" title="Drag the arm to cue a moment">${armSVG}</div>
      <div class="tt__ctrl">
        <button type="button" class="tt__start" aria-label="Start or stop">
          <span class="on">Stop</span><span class="off">Start</span></button>
        <div class="tt__speed" role="group" aria-label="Speed">
          <button type="button" data-rpm="33" aria-pressed="true">33</button>
          <button type="button" data-rpm="45" aria-pressed="false">45</button>
        </div>
      </div>
      ${o.hint ? `<div class="tt__hint" aria-hidden="true"><span>Spin me</span><svg viewBox="0 0 70 46"><path d="M4 8 C 30 2, 54 14, 60 38"/><path d="M50 32 L60 40 L65 28"/></svg></div>` : ""}
    </div></div>
  </div>`;
}

export class Deck {
  el: HTMLElement;
  player: Player;
  angle = Math.random() * 360;
  vel = 0;
  rpm = 33;
  private body: HTMLElement;
  private plat: HTMLElement;
  private spin: HTMLElement;
  private arm: HTMLElement;
  private armA = A_REST;
  private armHeld = false;
  private dragging = false;
  private coasting = false;
  private wasPlaying = false;
  private lastA = 0;
  private lastT = 0;
  private dragVel = 0;
  private moved = 0;
  private downAt = 0;
  private touched = false;
  onUse?: () => void;

  constructor(el: HTMLElement, player: Player) {
    this.el = el;
    this.player = player;
    this.body = $(".tt__body", el);
    this.plat = $(".tt__platter", el);
    this.spin = $(".tt__spin", el);
    this.arm = $(".arm", el);
    this.fit();
    new ResizeObserver(() => requestAnimationFrame(() => this.fit())).observe(el);
    this.bindRecord();
    this.bindArm();
    this.bindButtons();
    player.on((t, playing) => this.onTime(t, playing));
    this.onTime(0, false);
    loop(el, (dt) => this.tick(dt));
  }

  get normal() { return (this.rpm / 60) * 360; }
  /** Seconds of film per full turn while scrubbing. */
  get spr() { return clamp(this.player.dur / 10, 5, 12); }

  private lastW = 0;
  private fit() {
    const w = this.el.clientWidth;
    if (!w || w === this.lastW) return;
    this.lastW = w;
    const s = Math.min(1.25, w / W);
    this.body.style.transform = `scale(${s})`;
    (this.el.firstElementChild as HTMLElement).style.height = `${H * s}px`;
  }

  /** Re-press the record for a different film (bonus tracks). */
  relabel(f: Film, o: DeckOpts) {
    const tmp = document.createElement("div");
    tmp.innerHTML = deckHTML(f, o);
    const rec = $(".tt__rec", tmp);
    $(".tt__rec", this.el).replaceWith(rec);
    this.el.dataset.tone = o.tone;
  }

  private ang(e: PointerEvent) {
    const r = this.plat.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  }
  private inside(e: PointerEvent) {
    const r = this.plat.getBoundingClientRect();
    return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) <= r.width / 2;
  }

  private bindRecord() {
    const p = this.plat, pl = this.player;
    p.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || !this.inside(e)) return;
      p.setPointerCapture(e.pointerId);
      this.firstUse();
      if (!this.coasting) this.wasPlaying = pl.playing;
      this.coasting = false;
      this.dragging = true;
      this.moved = 0;
      this.dragVel = 0;
      this.downAt = this.lastT = performance.now();
      this.lastA = this.ang(e);
      pl.scrubStart();
      this.el.classList.add("is-held");
    });
    p.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const a = this.ang(e), now = performance.now();
      let d = a - this.lastA;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      const dt = Math.max(1, now - this.lastT) / 1000;
      this.lastA = a; this.lastT = now;
      this.angle += d;
      this.moved += Math.abs(d);
      this.dragVel = this.dragVel * 0.5 + (d / dt) * 0.5;
      pl.seek(pl.time + (d / 360) * this.spr);
      if (this.moved > 4) { this.el.classList.add("is-scratching"); snd.scratch(d / dt); }
    });
    const up = (cancel: boolean) => {
      if (!this.dragging) return;
      this.dragging = false;
      snd.scratchEnd();
      this.el.classList.remove("is-held", "is-scratching");
      const tap = this.moved < 3 && performance.now() - this.downAt < 350;
      if (tap && !cancel) {
        pl.scrubEnd();
        this.wasPlaying ? pl.pause() : this.start();
        return;
      }
      const idle = performance.now() - this.lastT > 90;
      this.vel = idle || cancel ? 0 : clamp(this.dragVel, -2400, 2400);
      this.coasting = true;
      if (reduced()) this.vel = 0;
    };
    p.addEventListener("pointerup", () => up(false));
    p.addEventListener("pointercancel", () => up(true));
    p.addEventListener("keydown", (e) => {
      const k = e.key;
      if (k === " " || k === "Enter") { e.preventDefault(); this.firstUse(); pl.toggle(); if (pl.playing) this.dropArm(); return; }
      const step = k === "ArrowRight" || k === "ArrowUp" ? 5 : k === "ArrowLeft" || k === "ArrowDown" ? -5 : 0;
      if (!step) return;
      e.preventDefault();
      this.firstUse();
      pl.seek(pl.time + step);
      gsap.to(this, { angle: this.angle + (step / this.spr) * 360, duration: 0.35, ease: "power2.out" });
    });
  }

  private bindArm() {
    const a = this.arm, pl = this.player;
    const toAngle = (e: PointerEvent) => {
      const r = this.body.getBoundingClientRect();
      const s = r.width / W;
      const x = (e.clientX - r.left) / s - P.x, y = (e.clientY - r.top) / s - P.y;
      return (Math.atan2(-x, y) * 180) / Math.PI;
    };
    const timeFor = (deg: number) => {
      const r = radiusAt(clamp(deg, A_OUT, A_IN));
      return ((R_OUT - r) / (R_OUT - R_IN)) * pl.dur;
    };
    a.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      a.setPointerCapture(e.pointerId);
      this.firstUse();
      this.armHeld = true;
      this.el.classList.add("is-cueing");
      pl.scrubStart();
    });
    a.addEventListener("pointermove", (e) => {
      if (!this.armHeld) return;
      const d = clamp(toAngle(e), A_REST, A_IN + 2);
      this.setArm(d);
      if (d >= A_OUT - 1) pl.seek(timeFor(d));
    });
    const up = () => {
      if (!this.armHeld) return;
      this.armHeld = false;
      this.el.classList.remove("is-cueing");
      pl.scrubEnd();
      if (this.armA >= A_OUT - 1) { snd.needle(); pl.play(timeFor(this.armA)); }
      else { pl.pause(); this.liftArm(); }
    };
    a.addEventListener("pointerup", up);
    a.addEventListener("pointercancel", up);
  }

  private bindButtons() {
    $(".tt__start", this.el).addEventListener("click", () => {
      this.firstUse();
      snd.tick();
      if (this.player.playing) this.player.pause(); else this.start();
    });
    this.el.querySelectorAll<HTMLButtonElement>("[data-rpm]").forEach((b) => b.addEventListener("click", () => {
      snd.tick(1.4);
      this.setRpm(Number(b.dataset.rpm));
    }));
  }

  setRpm(rpm: number) {
    this.rpm = rpm;
    this.el.querySelectorAll<HTMLButtonElement>("[data-rpm]").forEach((x) => x.setAttribute("aria-pressed", String(Number(x.dataset.rpm) === rpm)));
    const v = this.player.v as HTMLVideoElement & { preservesPitch?: boolean };
    v.preservesPitch = false;
    v.playbackRate = rpm === 45 ? 1.35 : 1;
    this.el.classList.toggle("is-45", rpm === 45);
  }

  /** Swing the arm in and start the film (from t, if given). */
  start(t?: number) {
    this.firstUse();
    const pl = this.player;
    if (t == null && pl.time >= pl.dur - 0.5) t = 0;
    pl.play(t);
    this.dropArm();
  }

  private dropArm() {
    snd.needle();
    this.el.classList.add("is-down");
  }
  private liftArm() {
    snd.stopCrackle();
    this.el.classList.remove("is-down");
  }

  private firstUse() {
    if (this.touched) return;
    this.touched = true;
    this.el.classList.add("is-used");
    this.onUse?.();
  }

  private setArm(deg: number) {
    this.armA = deg;
    this.arm.style.transform = `rotate(${deg}deg)`;
  }

  private armTarget() {
    const pl = this.player;
    if (!pl.full || (!pl.playing && pl.time >= pl.dur - 0.3 && !pl.scrubbing)) return A_REST;
    const k = clamp(pl.time / pl.dur, 0, 1);
    return angleFor(R_OUT - (R_OUT - R_IN) * k);
  }

  private onTime(t: number, playing: boolean) {
    const pl = this.player;
    this.el.classList.toggle("is-playing", playing);
    if (playing) this.el.classList.add("is-down");
    this.plat.setAttribute("aria-valuenow", String(Math.round((t / pl.dur) * 100)));
    this.plat.setAttribute("aria-valuetext", `${fmt(t)} of ${fmt(pl.dur)}`);
    if (!playing) snd.stopCrackle();
  }

  private tick(dt: number) {
    const pl = this.player;
    if (!this.dragging) {
      const target = pl.playing && !this.coasting ? this.normal : this.coasting && this.wasPlaying ? this.normal : 0;
      if (this.coasting) {
        // with the motor on (needle down) the platter pulls back to speed fast; free-spinning it coasts
        this.vel += (target - this.vel) * (1 - Math.exp(-dt * (this.wasPlaying ? 5.5 : 2.2)));
        const excess = this.vel - target;
        if (Math.abs(excess) > 28) {
          pl.seek(pl.time + (excess / 360) * this.spr * dt + (this.wasPlaying ? dt : 0));
        } else {
          this.coasting = false;
          pl.scrubEnd();
          if (this.wasPlaying) pl.play();
        }
      } else {
        const k = pl.playing ? 2.6 : 1.4; // spins up quicker than it winds down, like a real deck
        this.vel += (target - this.vel) * (1 - Math.exp(-dt * k));
        if (Math.abs(this.vel) < 0.5 && target === 0) this.vel = 0;
      }
      this.angle += this.vel * dt;
    }
    this.spin.style.transform = `rotate(${this.angle}deg)`;
    if (!this.armHeld) {
      const goal = this.el.classList.contains("is-down") ? this.armTarget() : A_REST;
      const d = goal - this.armA;
      if (Math.abs(d) > 0.02) this.setArm(this.armA + d * (1 - Math.exp(-dt * (Math.abs(d) > 3 ? 5 : 12))));
    }
    if (pl.full && !pl.playing && !pl.scrubbing && !this.coasting && pl.time >= pl.dur - 0.3) this.el.classList.remove("is-down");
  }
}

/** Track list for a film's chapters. Click a track to drop the needle there. */
export function tracksHTML(f: Film, side: string, cls = "") {
  const name = f.title.replace(/^[^:]+:\s*/, "");
  const ch = f.chapters ?? [{ label: name[0].toUpperCase() + name.slice(1), t: 0 }];
  return `<ol class="tracks ${cls}" aria-label="Chapters of ${esc(f.title)}">${ch.map((c, i) => {
    const next = ch[i + 1]?.t;
    return `<li><button type="button" class="tracks__b" data-t="${c.t}" data-i="${i}" title="${esc(c.label)}, ${fmt(c.t)}" aria-label="${side}${i + 1}, ${esc(c.label)}, at ${fmt(c.t)}">
      <span class="tracks__n">${side}${i + 1}</span><span class="tracks__l">${esc(c.label)}</span>
      <span class="tracks__t">${fmt(c.t)}</span><span class="tracks__bar" aria-hidden="true"><i data-from="${c.t}" data-to="${next ?? ""}"></i></span></button></li>`;
  }).join("")}</ol>`;
}

export function bindTracks(list: HTMLElement, deck: { start: (t?: number) => void; player: Player }) {
  const btns = Array.from(list.querySelectorAll<HTMLButtonElement>(".tracks__b"));
  btns.forEach((b) => b.addEventListener("click", () => { snd.tick(); deck.start(Number(b.dataset.t)); }));
  const upd = (t: number) => {
    const dur = deck.player.dur;
    let cur = 0;
    btns.forEach((b, i) => { if (t >= Number(b.dataset.t) - 0.05) cur = i; });
    btns.forEach((b, i) => {
      const on = i === cur && (deck.player.full);
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-current", on ? "true" : "false");
      const bar = b.querySelector<HTMLElement>(".tracks__bar i")!;
      const from = Number(bar.dataset.from), to = bar.dataset.to ? Number(bar.dataset.to) : dur;
      bar.style.transform = `scaleX(${clamp((t - from) / Math.max(0.1, to - from), 0, 1)})`;
    });
  };
  const off = deck.player.on((t) => upd(t));
  upd(deck.player.time);
  return () => { off(); };
}

/** "A2 · Guests order   0:31 / 1:14" under a deck. */
export function bindReadout(el: HTMLElement, player: Player, side: string) {
  const upd = (t: number, playing: boolean) => {
    const ch = player.film.chapters ?? [];
    let i = 0;
    ch.forEach((c, k) => { if (t >= c.t - 0.05) i = k; });
    const name = ch.length ? `${side}${i + 1} · ${ch[i].label}` : `${side}1 · ${player.film.title.replace(/^[^:]+:\s*/, "")}`;
    el.querySelector(".ro__track")!.textContent = name;
    el.querySelector(".ro__time")!.textContent = `${fmt(t)} / ${fmt(player.dur)}`;
    el.classList.toggle("is-playing", playing);
  };
  player.on(upd);
  upd(0, false);
}
export const readoutHTML = (cls = "") =>
  `<div class="ro ${cls}" aria-live="off"><span class="ro__led" aria-hidden="true"></span><span class="ro__track"></span><span class="ro__time"></span></div>`;
