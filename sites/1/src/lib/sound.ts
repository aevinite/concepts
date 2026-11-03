// Every sound is made in the browser (Web Audio), nothing is downloaded. Off by default; the
// speaker button top right turns it on. Nothing ever plays before that.

let ac: AudioContext | null = null;
let on = false;
let noise: AudioBuffer | null = null;
const subs = new Set<(on: boolean) => void>();

function ctx() {
  if (!ac) ac = new AudioContext();
  if (ac.state === "suspended") void ac.resume();
  return ac;
}
function noiseBuf(a: AudioContext) {
  if (noise) return noise;
  noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}
function env(a: AudioContext, peak: number, attack: number, decay: number, at = a.currentTime) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  g.connect(a.destination);
  return g;
}
function burst(a: AudioContext, type: BiquadFilterType, freq: number, q: number, peak: number, attack: number, decay: number, at = a.currentTime, sweepTo?: number) {
  const src = a.createBufferSource();
  src.buffer = noiseBuf(a);
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, at);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + attack + decay);
  f.Q.value = q;
  src.connect(f).connect(env(a, peak, attack, decay, at));
  src.start(at);
  src.stop(at + attack + decay + 0.05);
}
function tone(a: AudioContext, type: OscillatorType, from: number, to: number, peak: number, attack: number, decay: number, at = a.currentTime) {
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, at);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, at + attack + decay);
  o.connect(env(a, peak, attack, decay, at));
  o.start(at);
  o.stop(at + attack + decay + 0.05);
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export const sound = {
  get on() { return on; },
  toggle() {
    on = !on;
    if (on) { ctx(); this.chime(); }
    subs.forEach((f) => f(on));
  },
  sub(f: (on: boolean) => void) { subs.add(f); return () => subs.delete(f); },
  /** The manja snapping: a twang and a paper rip. */
  snap() {
    if (!on) return;
    const a = ctx();
    tone(a, "triangle", 1500, 160, 0.16, 0.004, 0.22);
    burst(a, "bandpass", 2800, 1.2, 0.3, 0.003, 0.09);
    burst(a, "highpass", 5000, 0.7, 0.08, 0.01, 0.25, a.currentTime + 0.05);
  },
  /** A kite catching the wind. */
  whoosh() {
    if (!on) return;
    const a = ctx();
    burst(a, "bandpass", 400, 0.8, 0.22, 0.12, 0.45, a.currentTime, 2400);
  },
  pluck(i = 0) {
    if (!on) return;
    const a = ctx();
    const f = PENTA[((i % PENTA.length) + PENTA.length) % PENTA.length];
    tone(a, "triangle", f, f, 0.14, 0.004, 0.5);
    tone(a, "sine", f * 2, f * 2, 0.05, 0.004, 0.3);
  },
  rustle() {
    if (!on) return;
    const a = ctx();
    for (let i = 0; i < 4; i++) burst(a, "highpass", 3200 + Math.random() * 2000, 0.6, 0.07, 0.03, 0.18, a.currentTime + i * 0.07);
  },
  chime() {
    if (!on) return;
    const a = ctx();
    tone(a, "sine", 1318.5, 1318.5, 0.09, 0.005, 0.9);
    tone(a, "sine", 1975.5, 1975.5, 0.04, 0.005, 0.7, a.currentTime + 0.06);
  },
  tick() {
    if (!on) return;
    const a = ctx();
    burst(a, "bandpass", 1800, 4, 0.12, 0.002, 0.04);
  },
};
