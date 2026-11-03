// AevOS Photo Viewer. Screenshots are shown dithered (1-bit / amber); move the pointer or drag a
// finger over one and a "colour lens" shows the real colours underneath. "Colour" shows it all.
import { h } from "./dom";
import { ditherCanvas } from "./dither";
import { glyph } from "./icons";
import { sfx } from "./sound";

export type Pic = { img: string; who: string; line: string; alt?: string };

/** One image with the colour lens. */
export function lensImage(src: string, alt: string, w = 640, ratio = "16 / 7") {
  const color = h("img", { class: "ln-color", src, alt, loading: "lazy", decoding: "async", width: "1280", height: "560" });
  const dith = ditherCanvas(src, w);
  dith.classList.add("ln-dith");
  const ring = h("div", { class: "ln-ring", "aria-hidden": "true" });
  const box = h("div", { class: "ln", style: { aspectRatio: ratio } }, color, dith, ring);
  const set = (e: PointerEvent) => {
    const r = box.getBoundingClientRect();
    box.style.setProperty("--x", `${e.clientX - r.left}px`);
    box.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  box.addEventListener("pointerenter", (e) => { set(e); box.classList.add("lens"); });
  box.addEventListener("pointermove", set);
  box.addEventListener("pointerdown", (e) => { set(e); box.classList.add("lens"); });
  box.addEventListener("pointerleave", () => box.classList.remove("lens"));
  box.addEventListener("pointercancel", () => box.classList.remove("lens"));
  box.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") setTimeout(() => box.classList.remove("lens"), 900); });
  return box;
}

export function photoViewer(pics: Pic[], label: string) {
  let i = 0;
  const stage = h("div", { class: "pv-stage" });
  const cap = h("p", { class: "pv-cap", "aria-live": "polite" });
  const count = h("span", { class: "pv-count" });
  const mode = h("button", { type: "button", class: "pv-mode", "aria-pressed": "false" }, "Colour");
  const prev = h("button", { type: "button", class: "pv-nav", "aria-label": "Previous screen", html: glyph("left", 14) });
  const next = h("button", { type: "button", class: "pv-nav", "aria-label": "Next screen", html: glyph("right", 14) });
  const thumbs = h("ol", { class: "pv-thumbs", "aria-label": `${label}: pick a person` },
    pics.map((p, k) => h("li", null, h("button", { type: "button", class: "pv-th", "data-k": String(k), "aria-label": `${p.who} screen` },
      ditherCanvas(p.img, 140), h("span", null, p.who)))));
  const root = h("div", { class: "pv" },
    stage,
    h("div", { class: "pv-tools" }, prev, count, next, h("span", { class: "pv-hint" }, "Point at the picture to see it in colour"), mode),
    cap, thumbs);
  const imgs = pics.map((p) => lensImage(p.img, p.alt ?? `${label}, ${p.who}'s screen: ${p.line}`));

  const show = (k: number, anim = true) => {
    i = (k + pics.length) % pics.length;
    const p = pics[i];
    stage.replaceChildren(imgs[i]);
    if (anim) imgs[i].animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 260, easing: "steps(8, end)" });
    cap.replaceChildren(h("b", null, p.who), " ", p.line);
    count.textContent = `${i + 1} / ${pics.length}`;
    thumbs.querySelectorAll(".pv-th").forEach((b, j) => { b.classList.toggle("cur", j === i); b.setAttribute("aria-current", j === i ? "true" : "false"); });
  };
  prev.addEventListener("click", () => { sfx.click(); show(i - 1); });
  next.addEventListener("click", () => { sfx.click(); show(i + 1); });
  thumbs.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".pv-th");
    if (b) { sfx.click(); show(Number(b.dataset.k)); }
  });
  mode.addEventListener("click", () => {
    const on = root.classList.toggle("colour");
    mode.setAttribute("aria-pressed", on ? "true" : "false");
    sfx.click();
  });
  root.tabIndex = -1;
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
  });
  // swipe on the caption/thumb area (the picture itself is the lens)
  let sx = 0;
  cap.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  cap.addEventListener("pointerup", (e) => { const dx = e.clientX - sx; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); });
  show(0, false);
  return root;
}
