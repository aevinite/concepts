// Every sound in Saap Sidi is synthesised with WebAudio, no files: the die rattling in a cupped
// hand, the token's hop ticks, a rising climb up a ladder (Bhupali scale: Sa Re Ga Pa Dha), the
// snake charmer's been when a snake is tamed, cowrie shells, temple bells and festival pops.
// Sound is OFF until the visitor turns it on, and the choice is remembered for the session.

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;
const subs = new Set<(on: boolean) => void>();
const KEY = "aev-c9-sound";

function ac() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    out.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const sound = {
  get on() { return enabled; },
  set(on: boolean) {
    enabled = on;
    try { sessionStorage.setItem(KEY, on ? "1" : "0"); } catch { /* private */ }
    if (on) ac();
    subs.forEach((s) => s(on));
  },
  sub(cb: (on: boolean) => void) { subs.add(cb); cb(enabled); },
  /** Restore the visitor's choice within this tab session (it never starts on by itself). */
  restore() { try { if (sessionStorage.getItem(KEY) === "1") enabled = true; } catch { /* */ } },
};

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function burst(t: number, dur: number, freq: number, q: number, peak: number, type: BiquadFilterType = "bandpass") {
  const c = ctx!, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noise;
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  env(g, t, peak, 0.002, dur);
  src.connect(f).connect(g).connect(out!);
  src.start(t, Math.random() * 0.8, dur + 0.05);
}

function tone(t: number, freq: number, dur: number, peak: number, type: OscillatorType = "sine", to?: number, attack = 0.004) {
  const c = ctx!, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  env(g, t, peak, attack, dur);
  o.connect(g).connect(out!);
  o.start(t); o.stop(t + attack + dur + 0.05);
}

// Bhupali: Sa Re Ga Pa Dha, from C4.
const BHUPALI = [261.63, 293.66, 329.63, 392, 440];
const note = (i: number) => BHUPALI[((i % 5) + 5) % 5] * 2 ** Math.floor(i / 5);

/** A die shaken in a cupped hand: wooden clicks, irregular, then a gap. */
export function rattle(ms = 900) {
  if (!enabled) return;
  const t0 = ac().currentTime;
  let t = t0;
  while (t < t0 + ms / 1000 * 0.75) {
    burst(t, 0.025, 1800 + Math.random() * 2400, 4, 0.12 + Math.random() * 0.12);
    tone(t, 700 + Math.random() * 500, 0.02, 0.03, "triangle");
    t += 0.03 + Math.random() * 0.07;
  }
}

/** The die lands on the board: a knock and two small bounces. */
export function land() {
  if (!enabled) return;
  const t = ac().currentTime;
  [0, 0.11, 0.18].forEach((d, i) => {
    burst(t + d, 0.05, 900, 1.5, 0.35 / (i + 1), "lowpass");
    tone(t + d, 210 - i * 20, 0.08, 0.18 / (i + 1), "sine", 120);
  });
}

/** One hop of the token: a wooden tick that rises a little with every square. */
export function hop(i: number) {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(t, note(i + 5), 0.09, 0.12, "triangle");
  burst(t, 0.02, 3200, 3, 0.06);
}

/** Climbing a ladder: a quick run up the Bhupali scale. */
export function climb(steps = 6) {
  if (!enabled) return;
  const t = ac().currentTime;
  for (let i = 0; i < steps; i++) {
    tone(t + i * 0.075, note(i + 7), 0.22, 0.1, "triangle");
    tone(t + i * 0.075, note(i + 12), 0.12, 0.03, "sine");
  }
}

/** The snake charmer's been: a reedy wavering phrase, then a bell when it is tamed. */
export function charm() {
  if (!enabled) return;
  const c = ac(), t = c.currentTime;
  const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  o.type = "sawtooth";
  f.type = "bandpass"; f.frequency.value = 1300; f.Q.value = 2.5;
  lfo.frequency.value = 6.2; lg.gain.value = 9;
  lfo.connect(lg).connect(o.frequency);
  const phrase = [note(8), note(9), note(8), note(7), note(8), note(10), note(9)];
  phrase.forEach((fq, i) => o.frequency.setValueAtTime(fq, t + i * 0.12));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.setValueAtTime(0.09, t + phrase.length * 0.12 - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + phrase.length * 0.12 + 0.15);
  o.connect(f).connect(g).connect(out!);
  o.start(t); lfo.start(t);
  o.stop(t + phrase.length * 0.12 + 0.2); lfo.stop(t + phrase.length * 0.12 + 0.2);
}

/** A small temple bell (ghanta). */
export function bell(pitch = 1) {
  if (!enabled) return;
  const t = ac().currentTime, f = 880 * pitch;
  [[1, 0.16, 2], [2.76, 0.06, 1.2], [5.4, 0.03, 0.7], [1.006, 0.08, 2.2]].forEach(([m, p, d]) => tone(t, f * m, d, p));
}

/** Reaching 100: bells and a rising run. */
export function win(dark: boolean) {
  if (!enabled) return;
  const t = ac().currentTime;
  for (let i = 0; i < 10; i++) tone(t + i * 0.07, note(i + 5), 0.4, 0.08, "triangle");
  setTimeout(() => bell(1), 650);
  setTimeout(() => bell(1.5), 900);
  if (dark) for (let i = 0; i < 9; i++) setTimeout(pop, 900 + i * 260 + Math.random() * 160);
}

/** A festival firework: a thump then a crackle. */
export function pop() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(t, 120, 0.18, 0.2, "sine", 50);
  for (let i = 0; i < 9; i++) burst(t + 0.05 + Math.random() * 0.35, 0.03, 2500 + Math.random() * 3000, 2, 0.05 + Math.random() * 0.05);
}

/** A matchstick striking, then a soft whoosh of flame (lighting the diya). */
export function strike(lighting: boolean) {
  if (!enabled) return;
  const t = ac().currentTime;
  if (lighting) {
    burst(t, 0.12, 2600, 0.8, 0.22);
    burst(t + 0.08, 0.5, 600, 0.5, 0.08, "lowpass");
  } else {
    burst(t, 0.35, 900, 0.6, 0.14, "lowpass");
  }
}

/** Cowrie shells thrown on cloth. */
export function cowries() {
  if (!enabled) return;
  const t = ac().currentTime;
  for (let i = 0; i < 12; i++) burst(t + Math.random() * 0.45, 0.02, 4200 + Math.random() * 2000, 5, 0.08 + Math.random() * 0.1);
  burst(t + 0.48, 0.06, 1200, 1, 0.12, "lowpass");
}

/** A card dealt from a stack. */
export function deal() {
  if (!enabled) return;
  const t = ac().currentTime;
  burst(t, 0.09, 2400, 0.7, 0.14);
  burst(t + 0.06, 0.03, 900, 1, 0.1, "lowpass");
}

/** A counter wheel clicking past a digit. */
export function tick() {
  if (!enabled) return;
  const t = ac().currentTime;
  burst(t, 0.012, 5200, 4, 0.05);
}

/** A soft UI tap. */
export function tap() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(t, 660, 0.06, 0.06, "triangle");
}
