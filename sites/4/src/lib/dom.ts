export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const pad2 = (n: number) => String(n).padStart(2, "0");
export const fmtTime = (t: number) => `${Math.floor(t / 60)}:${pad2(Math.floor(t % 60))}`;

/** Variable-font settings string for Anybody (wdth 50..150, wght 100..900). */
export const fv = (w: number, g: number) => `"wdth" ${w.toFixed(1)}, "wght" ${g.toFixed(0)}`;

/** Upper-cases for display only (the DOM keeps the real words for screen readers via aria-label). */
export const up = (s: string) => s.toLocaleUpperCase("en-IN");

export const ICON = {
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M20 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`,
  out: `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" fill="currentColor"/></svg>`,
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true" class="ico"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>`,
};
