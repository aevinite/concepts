// Light / dark for every concept. Light is ALWAYS the default; the OS setting is never read.
// Each concept stores its own choice (key aev-c<N>-theme) so the owner sees every concept in
// light first. Each concept draws its OWN toggle (top right); this file only holds the state.
//
// Every page's <head> carries the pre-paint line (so there is never a light→dark flash):
// <script>try{document.documentElement.dataset.theme=localStorage.getItem("aev-c1-theme")==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}</script>

export type Theme = "light" | "dark";

let key = "aev-theme";
const listeners = new Set<(t: Theme) => void>();

export function initTheme(concept: number) {
  key = `aev-c${concept}-theme`;
  const t = getTheme();
  document.documentElement.dataset.theme = t;
  return t;
}

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * Switch theme. Pass the button so the View Transition can grow from it.
 * `transition` lets a concept supply its own swap animation (a page turn, a power-cut...);
 * it receives the commit function and must call it once.
 */
export function setTheme(next: Theme, opts: { from?: HTMLElement; transition?: (commit: () => void) => void } = {}) {
  const commit = () => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(key, next); } catch { /* private window */ }
    listeners.forEach((l) => l(next));
  };
  if (opts.transition) return opts.transition(commit);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const d = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!d.startViewTransition || reduce) return commit();
  const r = opts.from?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth - 40;
  const y = r ? r.top + r.height / 2 : 40;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = d.startViewTransition(commit);
  vt.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

export const toggleTheme = (from?: HTMLElement) => setTheme(getTheme() === "dark" ? "light" : "dark", { from });

export function onTheme(cb: (t: Theme) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
