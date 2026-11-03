// "Set to the measure": a line of display type is sized so that, at its WIDEST variable-font
// state, it exactly spans its column. Big type can stretch all it likes and never overflow.
import { onResize, ScrollTrigger } from "./core";
import { onTheme } from "@shared/theme";

type Fit = { el: HTMLElement; widest: string; max: () => number; min: number; slack: number };
const fits: Fit[] = [];
let meter: HTMLSpanElement | null = null;

function measure(el: HTMLElement, widest: string) {
  if (!meter) {
    meter = document.createElement("span");
    meter.setAttribute("aria-hidden", "true");
    meter.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;white-space:pre;font-size:100px;line-height:1;pointer-events:none";
    document.body.append(meter);
  }
  const cs = getComputedStyle(el);
  meter.style.fontFamily = cs.fontFamily;
  meter.style.letterSpacing = cs.letterSpacing.endsWith("em") || cs.letterSpacing === "normal" ? cs.letterSpacing : `${parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)}em`;
  meter.style.textTransform = cs.textTransform;
  meter.style.fontVariationSettings = widest;
  meter.textContent = el.dataset.fitText ?? el.textContent ?? "";
  return meter.getBoundingClientRect().width;
}

function apply(f: Fit) {
  const avail = f.el.clientWidth;
  if (!avail) return;
  const m = measure(f.el, f.widest);
  if (!m) return;
  const size = Math.max(f.min, Math.min(f.max(), (100 * avail * f.slack) / m));
  f.el.style.fontSize = `${size.toFixed(2)}px`;
  f.el.style.setProperty("--fs", `${size.toFixed(2)}px`);
}

/** Register a block element (white-space: nowrap) to be fitted. Returns a re-fit function. */
export function fit(el: HTMLElement, opts: { widest?: string; max?: number | (() => number); min?: number; slack?: number } = {}) {
  const max = typeof opts.max === "function" ? opts.max : () => (opts.max as number | undefined) ?? 9999;
  const f: Fit = { el, widest: opts.widest ?? `"wdth" 150, "wght" 900`, max, min: opts.min ?? 10, slack: opts.slack ?? 0.985 };
  fits.push(f);
  apply(f);
  return () => apply(f);
}

let stTimer = 0;
export function refitAll() {
  fits.forEach(apply);
  // Sizes changed, so pinned sections must re-measure where they start and end.
  clearTimeout(stTimer);
  stTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
}
onResize(refitAll);
onTheme(() => requestAnimationFrame(refitAll));
// Fonts arrive after first paint: measure again once they do.
document.fonts.ready.then(refitAll);
document.fonts.addEventListener?.("loadingdone", () => requestAnimationFrame(refitAll));
