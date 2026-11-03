// Sound effects, made in the browser (no files). OFF by default; the speaker button in the top
// bar turns them on. Films have their own soundtrack and only play after a press.
let ctx: AudioContext | null = null;
let on = false;
const subs = new Set<(on: boolean) => void>();

export const soundOn = () => on;
export function setSound(v: boolean) {
  on = v;
  if (v) ac();
  if (!v) stopCrackle();
  subs.forEach((f) => f(on));
}
export const onSound = (f: (on: boolean) => void) => subs.add(f);

function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function env(c: AudioContext, g: GainNode, peak: number, a: number, d: number) {
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

/** Short tick: buttons, flicking a sleeve. */
export function tick(pitch = 1) {
  if (!on) return;
  const c = ac(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise(c);
  f.type = "bandpass"; f.frequency.value = 2400 * pitch; f.Q.value = 3;
  s.connect(f).connect(g).connect(c.destination);
  env(c, g, 0.25, 0.002, 0.05);
  s.start(); s.stop(c.currentTime + 0.08);
}

/** Cardboard thud: a sleeve dropping back in the crate. */
export function thud() {
  if (!on) return;
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(140, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.12);
  o.connect(g).connect(c.destination);
  env(c, g, 0.35, 0.004, 0.16);
  o.start(); o.stop(c.currentTime + 0.2);
  tick(0.4);
}

/** The needle landing in the groove. */
export function needle() {
  if (!on) return;
  thud();
  startCrackle();
}

/** Paper tearing (contact tabs, ticket stubs). */
export function tear() {
  if (!on) return;
  const c = ac(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise(c);
  f.type = "highpass"; f.frequency.value = 1800;
  s.connect(f).connect(g).connect(c.destination);
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  for (let i = 0; i < 7; i++) g.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.14, t + 0.02 + i * 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  s.start(); s.stop(t + 0.26);
}

/** Two notes up: a little "you found it". */
export function chime() {
  if (!on) return;
  const c = ac();
  [660, 990].forEach((hz, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.value = hz;
    o.connect(g).connect(c.destination);
    const t = c.currentTime + i * 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.start(t); o.stop(t + 0.4);
  });
}

// Vinyl crackle while a needle is down.
let crackle: { s: AudioBufferSourceNode; g: GainNode } | null = null;
export function startCrackle() {
  if (!on || crackle) return;
  const c = ac();
  const b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.012;
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = b; s.loop = true; f.type = "highpass"; f.frequency.value = 900;
  g.gain.value = 0.22;
  s.connect(f).connect(g).connect(c.destination);
  s.start();
  crackle = { s, g };
}
export function stopCrackle() {
  if (!crackle || !ctx) return;
  const { s, g } = crackle;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  s.stop(ctx.currentTime + 0.3);
  crackle = null;
}

// The scratch: band-passed noise whose pitch and loudness follow how fast the record moves.
let scr: { s: AudioBufferSourceNode; f: BiquadFilterNode; g: GainNode } | null = null;
export function scratch(speed: number) {
  if (!on) return;
  const c = ac();
  if (!scr) {
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise(c); s.loop = true;
    f.type = "bandpass"; f.Q.value = 6;
    g.gain.value = 0;
    s.connect(f).connect(g).connect(c.destination);
    s.start();
    scr = { s, f, g };
  }
  const v = Math.min(1, Math.abs(speed) / 900);
  scr.f.frequency.setTargetAtTime(300 + v * 2600, c.currentTime, 0.02);
  scr.g.gain.setTargetAtTime(v * 0.5, c.currentTime, 0.02);
  scr.s.playbackRate.setTargetAtTime(0.4 + v * 1.4, c.currentTime, 0.02);
}
export function scratchEnd() {
  if (!scr || !ctx) return;
  const { s, g } = scr;
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
  s.stop(ctx.currentTime + 0.2);
  scr = null;
}
