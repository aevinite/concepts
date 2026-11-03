// Every sound is synthesised with WebAudio (no files). Off by default; the toggle in the top-right
// cluster turns it on. Nothing plays until the visitor has switched sound on.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;
const KEY = "aev-c7-sound";
const listeners = new Set<(on: boolean) => void>();

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export const soundOn = () => on;
export function setSound(v: boolean) {
  on = v;
  try { sessionStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
  if (v) ac();
  listeners.forEach((l) => l(v));
}
export const onSound = (cb: (on: boolean) => void) => { listeners.add(cb); cb(on); return () => listeners.delete(cb); };

// remember within the tab session only (sound is never on for a fresh visit)
try { on = sessionStorage.getItem(KEY) === "1"; } catch { on = false; }

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
  const c = ac(), t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function hiss(dur: number, vol: number, freq: number, q = 1, delay = 0, type: BiquadFilterType = "bandpass") {
  const c = ac(), t = c.currentTime + delay;
  const s = noise(c), f = c.createBiquadFilter(), g = c.createGain();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(t);
  s.stop(t + dur + 0.02);
}

let lastPing = 0;
export const sfx = {
  /** pop bumper */
  ping(pitch = 1) {
    if (!on) return;
    const now = performance.now();
    if (now - lastPing < 40) return;
    lastPing = now;
    tone("sine", 1320 * pitch, 880 * pitch, 0.18, 0.35);
    tone("triangle", 2640 * pitch, 1760 * pitch, 0.09, 0.12);
    hiss(0.03, 0.25, 3000, 2);
  },
  /** flipper solenoid */
  clack() {
    if (!on) return;
    hiss(0.05, 0.5, 1800, 0.8);
    tone("square", 140, 60, 0.07, 0.18);
  },
  /** soft wooden knock: letter blocks, drawer stops */
  knock(v = 1) {
    if (!on) return;
    tone("sine", 220 + Math.random() * 60, 90, 0.09, 0.22 * v);
    hiss(0.03, 0.12 * v, 1200, 1.5);
  },
  /** rubber stamp */
  stamp() {
    if (!on) return;
    tone("sine", 120, 45, 0.25, 0.6);
    hiss(0.08, 0.45, 500, 0.7, 0, "lowpass");
  },
  /** gear tooth */
  tick() {
    if (!on) return;
    hiss(0.015, 0.25, 4200, 4);
  },
  /** paper sliding out of a drawer */
  slide() {
    if (!on) return;
    hiss(0.28, 0.18, 900, 0.5, 0, "lowpass");
  },
  /** lever / switch */
  lever() {
    if (!on) return;
    tone("square", 300, 120, 0.05, 0.12);
    hiss(0.04, 0.3, 2500, 1);
  },
  /** a lane lit, a target down */
  blip(n = 0) {
    if (!on) return;
    tone("square", 660 * Math.pow(1.122, n), 660 * Math.pow(1.122, n), 0.08, 0.08);
  },
  /** completion arpeggio */
  chime() {
    if (!on) return;
    [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, f, 0.22, 0.18, i * 0.08));
  },
  /** ball lost */
  drain() {
    if (!on) return;
    tone("sawtooth", 440, 110, 0.6, 0.08);
  },
  /** coin in: theme switch to the pinball world */
  coin() {
    if (!on) return;
    tone("sine", 1567, 1567, 0.09, 0.2);
    tone("sine", 2093, 2093, 0.3, 0.2, 0.09);
  },
  /** pencil scratch: theme switch back to the drawing */
  pencil() {
    if (!on) return;
    hiss(0.18, 0.15, 5200, 2);
    hiss(0.14, 0.12, 4600, 2, 0.2);
  },
};
