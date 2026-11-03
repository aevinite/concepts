// Comic sound effects, synthesised with WebAudio (no files). OFF until the reader turns it on.
let ctx: AudioContext | null = null;
let on = false;
const listeners = new Set<(on: boolean) => void>();

export const soundOn = () => on;
export function setSound(v: boolean) {
  on = v;
  if (on && !ctx) ctx = new AudioContext();
  if (on) ctx?.resume();
  listeners.forEach((l) => l(on));
}
export const onSound = (cb: (on: boolean) => void) => listeners.add(cb);

function noise(dur: number) {
  const c = ctx!, b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}
function env(g: GainNode, t: number, peak: number, a: number, r: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
}
function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.2, delay = 0) {
  const c = ctx!, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, vol, 0.005, dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
function hiss(dur: number, f: number, q: number, vol = 0.2, delay = 0, type: BiquadFilterType = "bandpass") {
  const c = ctx!, t = c.currentTime + delay, s = noise(dur), fl = c.createBiquadFilter(), g = c.createGain();
  fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  env(g, t, vol, 0.01, dur);
  s.connect(fl).connect(g).connect(c.destination); s.start(t); s.stop(t + dur + 0.05);
}

export const sfx = {
  pow() { if (!on || !ctx) return; tone("sine", 160, 40, 0.28, 0.5); hiss(0.18, 1200, 0.7, 0.35); },
  flip() { if (!on || !ctx) return; hiss(0.32, 2400, 0.6, 0.18); hiss(0.2, 800, 1, 0.1, 0.12); },
  ding() { if (!on || !ctx) return; tone("sine", 1568, 1560, 0.9, 0.18); tone("sine", 3136, 3130, 0.5, 0.05); },
  chunk() { if (!on || !ctx) return; hiss(0.06, 500, 2, 0.4); hiss(0.08, 300, 2, 0.4, 0.14); tone("square", 90, 60, 0.08, 0.12, 0.14); },
  beep() { if (!on || !ctx) return; tone("square", 1760, 1760, 0.12, 0.08); tone("square", 2349, 2349, 0.14, 0.08, 0.13); },
  buzz() { if (!on || !ctx) return; tone("sawtooth", 140, 140, 0.35, 0.06); },
  click() { if (!on || !ctx) return; hiss(0.03, 3000, 1, 0.3); },
  thunder() { if (!on || !ctx) return; hiss(1.6, 120, 0.4, 0.6, 0, "lowpass"); hiss(0.25, 900, 0.5, 0.25); },
  swish() { if (!on || !ctx) return; hiss(0.35, 1800, 0.8, 0.15); },
};
