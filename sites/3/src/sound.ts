// AevOS system sounds: tiny square-wave beeps made on the fly with WebAudio (no audio files).
// OFF by default; the speaker in the menu bar / status bar switches them on.

let ctx: AudioContext | null = null;
let on = false;
const listeners = new Set<(v: boolean) => void>();

export const soundOn = () => on;
export function setSound(v: boolean) {
  on = v;
  if (v && !ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = AC ? new AC() : null;
  }
  ctx?.resume?.();
  listeners.forEach((l) => l(v));
}
export const onSound = (cb: (v: boolean) => void) => listeners.add(cb);

function tone(freq: number, dur = 0.06, type: OscillatorType = "square", vol = 0.05, delay = 0, slide = 0) {
  if (!on || !ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur = 0.12, vol = 0.04, delay = 0) {
  if (!on || !ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = vol;
  s.buffer = buf;
  s.connect(g).connect(ctx.destination);
  s.start(ctx.currentTime + delay);
}

export const sfx = {
  click: () => tone(1800, 0.015, "square", 0.025),
  open: () => { tone(520, 0.05); tone(780, 0.07, "square", 0.05, 0.045); },
  close: () => { tone(700, 0.05); tone(420, 0.07, "square", 0.05, 0.045); },
  min: () => tone(900, 0.12, "triangle", 0.05, 0, -600),
  beep: () => tone(440, 0.18, "square", 0.06),
  boot: () => { tone(262, 0.5, "triangle", 0.07); tone(392, 0.5, "triangle", 0.05); tone(523, 0.6, "triangle", 0.05, 0.02); },
  crunch: () => noise(0.25, 0.08),
  flag: () => tone(1200, 0.04, "square", 0.04),
  reveal: () => tone(300 + Math.random() * 300, 0.025, "square", 0.025),
  boom: () => { noise(0.4, 0.12); tone(120, 0.4, "sawtooth", 0.06, 0, -80); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "square", 0.05, i * 0.1)),
  power: () => { tone(60, 0.35, "sawtooth", 0.05, 0, 900); noise(0.15, 0.03, 0.05); },
  tick: () => tone(2400, 0.01, "square", 0.02),
};
