// Tiny synthesised sounds (no audio files). Always OFF until the visitor turns them on.
let ctx: AudioContext | null = null;
export const sound = { on: false };
const listeners = new Set<(on: boolean) => void>();
export const onSound = (fn: (on: boolean) => void) => listeners.add(fn);

export function setSound(on: boolean) {
  sound.on = on;
  if (on && !ctx) ctx = new AudioContext();
  if (on) void ctx?.resume();
  listeners.forEach((l) => l(on));
}

let last = 0;
/** A short tuned blip. `f` = pitch in Hz. Rate-limited so drags never machine-gun. */
export function blip(f = 520, dur = 0.06, vol = 0.08, type: OscillatorType = "triangle") {
  if (!sound.on || !ctx) return;
  const now = ctx.currentTime;
  if (now - last < 0.028) return;
  last = now;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  o.frequency.exponentialRampToValueAtTime(f * 1.5, now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g).connect(ctx.destination);
  o.start(now);
  o.stop(now + dur + 0.02);
}

/** A soft low "thock", like a heavy letter landing. */
export function thock(f = 140, vol = 0.18) {
  if (!sound.on || !ctx) return;
  const now = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(f * 2, now);
  o.frequency.exponentialRampToValueAtTime(f, now + 0.12);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  o.connect(g).connect(ctx.destination);
  o.start(now);
  o.stop(now + 0.35);
}

/** A rising chord, for little wins. */
export function chime() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 0.06, "sine"), i * 70));
}
