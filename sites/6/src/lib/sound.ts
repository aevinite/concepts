// Every sound in The Pass is synthesised with WebAudio (no files): the thermal printer's
// stepper-motor chatter, paper tearing, the spike's thunk, a rubber stamp, the desk bell,
// split-flap clicks and the till's drawer. Sound is OFF until the visitor turns it on.

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;
const subs = new Set<(on: boolean) => void>();

function ac() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.55;
    out.connect(ctx.destination);
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
    if (on) ac();
    subs.forEach((s) => s(on));
  },
  sub(cb: (on: boolean) => void) { subs.add(cb); },
};

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function burst(t: number, dur: number, freq: number, q: number, peak: number, type: BiquadFilterType = "bandpass") {
  const c = ctx!, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noise;
  src.loopStart = Math.random() * 0.5;
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  env(g, t, peak, 0.002, dur);
  src.connect(f).connect(g).connect(out!);
  src.start(t, Math.random() * 0.8, dur + 0.05);
}

function tone(t: number, freq: number, dur: number, peak: number, type: OscillatorType = "sine", to?: number) {
  const c = ctx!, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  env(g, t, peak, 0.004, dur);
  o.connect(g).connect(out!);
  o.start(t); o.stop(t + dur + 0.05);
}

/** One printed line: the stepper motor's buzz plus the head's dry click. */
export function printLine(fast = false) {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(t, fast ? 1450 : 1180, 0.05, 0.035, "square", fast ? 1700 : 1400);
  burst(t, 0.035, 5200, 1.2, 0.12, "highpass");
  burst(t + 0.02, 0.03, 2400, 3, 0.08);
}

/** Paper tearing at the serrated bar: a crackly noise that falls in pitch. */
export function tear() {
  if (!enabled) return;
  const c = ac(), t = c.currentTime;
  for (let i = 0; i < 14; i++) burst(t + i * 0.017 + Math.random() * 0.008, 0.03, 3600 - i * 160, 2.2, 0.16 + Math.random() * 0.1);
  burst(t, 0.26, 1800, 0.7, 0.06);
}

/** The order spike: a dull thunk with a metal tick on top. */
export function thunk() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(t, 150, 0.16, 0.5, "sine", 48);
  burst(t, 0.05, 900, 1, 0.25, "lowpass");
  tone(t + 0.005, 2900, 0.07, 0.05, "triangle");
}

/** A rubber stamp hitting paper. */
export function stampThud() {
  if (!enabled) return;
  const t = ac().currentTime;
  burst(t, 0.09, 380, 0.8, 0.4, "lowpass");
  tone(t, 95, 0.12, 0.3, "sine", 60);
}

/** The desk bell: inharmonic partials with a long ring. */
export function bell() {
  if (!enabled) return;
  const t = ac().currentTime, f = 1318;
  [[1, 0.32, 2.4], [2.76, 0.12, 1.4], [5.4, 0.06, 0.8], [8.93, 0.03, 0.5], [1.007, 0.16, 2.6]].forEach(([m, p, d]) => tone(t, f * m, d, p));
  burst(t, 0.02, 6000, 1, 0.12, "highpass");
}

/** A split-flap leaf falling. */
export function flap() {
  if (!enabled) return;
  const t = ac().currentTime;
  burst(t, 0.018, 3800 + Math.random() * 1200, 1.5, 0.09);
}

/** The till's drawer: a ring and the drawer rolling out. */
export function kaching() {
  if (!enabled) return;
  const t = ac().currentTime;
  [[2093, 0.18], [2637, 0.12], [3136, 0.08]].forEach(([f, p], i) => tone(t + i * 0.035, f, 0.9, p, "triangle"));
  for (let i = 0; i < 6; i++) burst(t + 0.12 + i * 0.03, 0.04, 700, 1, 0.18, "lowpass");
  tone(t + 0.3, 120, 0.12, 0.25, "sine", 70);
}

/** A light switch / pull cord click. */
export function click(hi = false) {
  if (!enabled) return;
  const t = ac().currentTime;
  burst(t, 0.02, hi ? 4200 : 2500, 2, 0.22);
  tone(t, hi ? 1800 : 900, 0.03, 0.06, "square");
}

/** Heat lamps warming up: a low hum that rises. */
export function lampHum() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(t, 55, 0.9, 0.08, "sawtooth", 62);
  burst(t, 0.6, 140, 0.6, 0.05, "lowpass");
}
