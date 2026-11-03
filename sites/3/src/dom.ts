// Tiny DOM helpers. Everything AevOS shows is built from shared/content.ts through these,
// so every fact lives in the real DOM (readable, selectable, findable), never only in a canvas.

export type Kid = Node | string | number | null | undefined | false | Kid[];
type Attrs = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...kids: Kid[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = String(v);
      else if (k === "html") el.innerHTML = String(v);
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    }
  }
  append(el, kids);
  return el;
}

function append(el: Node, kids: Kid[]) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else el.appendChild(typeof k === "object" ? k : document.createTextNode(String(k)));
  }
}

/** Parse an HTML/SVG string into one element. Only used for our own static markup. */
export function frag<T extends Element = HTMLElement>(markup: string): T {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as T;
}

export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T | null;
export const qsa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** "1 min 14 s" / "52 s" -> seconds */
export function lengthToSeconds(s: string) {
  const m = s.match(/(\d+)\s*min/);
  const sec = s.match(/(\d+)\s*s\b/);
  return (m ? Number(m[1]) * 60 : 0) + (sec ? Number(sec[1]) : 0);
}

export const clock = (t: number) => {
  if (!isFinite(t)) t = 0;
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const ext = { target: "_blank", rel: "noopener" };
