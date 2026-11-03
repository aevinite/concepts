// Little synthesised sounds (no audio files): a "plip" for an ink drop on the size, a soft
// swish for the comb, a glassy chime at night. OFF by default; the toggle in the header turns it on.
import { getTheme } from "@shared/theme";

let ctx: AudioContext | null = null;
let on = false;
let last = 0;
const KEY = "aev-c8-sound";

export const soundOn = () => on;

export function setSound(v: boolean) {
  on = v;
  try { sessionStorage.setItem(KEY, v ? "1" : "0"); } catch { /* private */ }
  if (v && !ctx) ctx = new AudioContext();
  if (v && ctx?.state === "suspended") ctx.resume();
  document.documentElement.dataset.sound = v ? "on" : "off";
}

function ok(gap = 40) {
  if (!on || !ctx) return false;
  const now = performance.now();
  if (now - last < gap) return false;
  last = now;
  return true;
}

export function plip(pitch = 1) {
  if (!ok()) return;
  const c = ctx!, t = c.currentTime;
  const dark = getTheme() === "dark";
  const o = c.createOscillator(), g = c.createGain();
  o.type = "sine";
  const f0 = (dark ? 1400 : 980) * pitch;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * (dark ? 0.82 : 0.32), t + (dark ? 0.5 : 0.12));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(dark ? 0.06 : 0.12, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (dark ? 0.9 : 0.2));
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 1);
  if (dark) { // a second, detuned partial: glassy
    const o2 = c.createOscillator(), g2 = c.createGain();
    o2.frequency.value = f0 * 2.01;
    g2.gain.setValueAtTime(0.025, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o2.connect(g2).connect(c.destination); o2.start(t); o2.stop(t + 0.8);
  }
}

export function swish(len = 0.45) {
  if (!ok(120)) return;
  const c = ctx!, t = c.currentTime;
  const n = Math.floor(c.sampleRate * len);
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / n) * Math.PI);
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 0.8;
  f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2200, t + len);
  const g = c.createGain(); g.gain.value = 0.08;
  s.connect(f).connect(g).connect(c.destination); s.start(t);
}

export function chord() {
  if (!ok(200)) return;
  [1, 1.25, 1.5, 2].forEach((m, i) => setTimeout(() => { last = 0; plip(m * 0.9); }, i * 90));
}
