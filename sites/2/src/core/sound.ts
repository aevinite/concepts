// Tiny synthesised sounds for the town (no audio files). OFF by default; the speaker button
// in the corner turns them on. Nothing ever plays before the visitor asks for it.
export type SoundName = "tick" | "thud" | "horn" | "toot" | "chime" | "pop" | "whoosh" | "click";

let ctx: AudioContext | null = null;
let on = false;
const last: Record<string, number> = {};
const listeners = new Set<(on: boolean) => void>();

export const soundOn = () => on;
export function setSound(v: boolean) {
  on = v;
  if (on && !ctx) ctx = new AudioContext();
  if (on && ctx?.state === "suspended") ctx.resume();
  listeners.forEach((l) => l(on));
}
export const onSound = (fn: (on: boolean) => void) => listeners.add(fn);

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, peak, 0.005, dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(t: number, dur: number, peak: number, freq: number) {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = c.createGain();
  env(g, t, peak, 0.004, dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export function play(name: SoundName) {
  if (!on || !ctx) return;
  const now = ctx.currentTime;
  const gap = name === "thud" ? 0.07 : 0.04;
  if (last[name] && now - last[name] < gap) return;
  last[name] = now;
  switch (name) {
    case "tick":
      for (let i = 0; i < 5; i++) noise(now + i * 0.06, 0.03, 0.12, 3200);
      break;
    case "thud":
      tone("sine", 140, 48, now, 0.18, 0.35);
      noise(now, 0.05, 0.05, 400);
      break;
    case "horn":
      tone("square", 440, 440, now, 0.12, 0.05);
      tone("square", 554, 554, now + 0.16, 0.14, 0.05);
      break;
    case "toot":
      tone("triangle", 660, 640, now, 0.35, 0.12);
      tone("triangle", 830, 810, now, 0.35, 0.08);
      tone("triangle", 660, 600, now + 0.42, 0.5, 0.12);
      break;
    case "chime":
      tone("sine", 880, 878, now, 0.9, 0.12);
      tone("sine", 1320, 1318, now + 0.12, 0.9, 0.08);
      break;
    case "pop":
      tone("sine", 420, 980, now, 0.09, 0.14);
      break;
    case "whoosh":
      noise(now, 0.5, 0.08, 1200);
      break;
    case "click":
      tone("sine", 1800, 1200, now, 0.03, 0.05);
      break;
  }
}
