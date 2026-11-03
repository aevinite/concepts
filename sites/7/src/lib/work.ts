// WORK as a flat-file cabinet: each drawer holds one drawing sheet. Pull a drawer (click, or drag
// its handle sideways) and its sheet slides up into the viewer with a proper title block.
// Dark: the cabinet becomes a column of lit lane buttons and the viewer a backglass.
import { WORK } from "@shared/content";
import { $, $$, esc, gsap, reduced } from "./core";
import { lamps } from "./chrome";
import { sfx } from "./sound";

type W = (typeof WORK)[number];
const linkFor = (w: W, base: string) => !w.link ? "" : w.link.startsWith("http") ? w.link : `${base}${w.link}`;

function sheetHTML(w: W, i: number, base: string) {
  const link = linkFor(w, base);
  const vid = "video" in w ? w.video : "";
  return `
    <div class="sheet-fig">
      ${vid ? `<video class="wk-vid" muted loop playsinline preload="none" poster="${w.images[0]}" src="${vid}" aria-label="${esc(w.title)}: a scroll through the 3D story"></video>
        <button type="button" class="wk-play"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8 L10.4 6 L3 10.2Z"/></svg> Play the scroll demo</button>`
      : `<img class="sheet-main" src="${w.images[0]}" alt="${esc(w.title)}: screenshot 1 of ${w.images.length}" width="1600" height="900" decoding="async">`}
      <span class="dimh sheet-dw" aria-hidden="true"><i>Scale 1:1</i></span>
    </div>
    ${w.images.length > 1 ? `<div class="sheet-thumbs" role="group" aria-label="Details">${w.images.map((src, k) => `<button type="button" class="sheet-th${k === 0 ? " on" : ""}" data-src="${src}" data-k="${k}" aria-label="Detail ${k + 1} of ${w.images.length}"><img src="${src}" alt="" width="160" height="90" loading="lazy" decoding="async"><span>${String.fromCharCode(65 + k)}</span></button>`).join("")}</div>` : ""}
    <div class="sheet-tb">
      <div class="stb-title"><small>Title</small><h3>${esc(w.title)}</h3></div>
      <div><small>Type</small><span>${esc(w.category)}</span></div>
      <div><small>Materials</small><span>${w.tech.map(esc).join(" · ")}</span></div>
      <div><small>Drawn by</small><span>Aevinite</span></div>
      <div><small>Scale</small><span>1:1</span></div>
      <div><small>Sheet</small><span>${i + 1} of ${WORK.length}</span></div>
      <p class="stb-d">${esc(w.desc)}</p>
      ${link ? `<a class="stb-link" href="${link}" ${link.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${link.startsWith("http") ? "Open the live site" : "See Aevidine"}<span aria-hidden="true"> →</span></a>` : ""}
    </div>`;
}

export function workHTML(base: string) {
  return `
  <div class="cab">
    <div class="cab-drawers" role="tablist" aria-label="Projects, one per drawer">
      ${WORK.map((w, i) => `<button type="button" role="tab" class="drawer" id="dr-${i}" aria-controls="sheet" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">
        <span class="dr-front">
          <span class="dr-label"><small>Drawer ${String(i + 1).padStart(2, "0")} · ${esc(w.category)}</small><b>${esc(w.title)}</b></span>
          <span class="dr-handle" aria-hidden="true"></span>
        </span>
      </button>`).join("")}
      <p class="cap cab-cap">Flat file · pull a drawer</p>
    </div>
    <div class="sheet" id="sheet" role="tabpanel" aria-labelledby="dr-0">
      ${lamps(36, "sheet-lamps")}
      <div class="sheet-in">${sheetHTML(WORK[0], 0, base)}</div>
    </div>
  </div>`;
}

export function initWork(base: string) {
  const root = $<HTMLElement>("#work");
  const drawers = $$<HTMLButtonElement>(".drawer", root);
  const sheet = $<HTMLElement>(".sheet", root);
  const inner = $<HTMLElement>(".sheet-in", root);
  let cur = 0;
  drawers[0].classList.add("open");

  const wire = () => {
    const main = $<HTMLImageElement>(".sheet-main", inner);
    $$<HTMLButtonElement>(".sheet-th", inner).forEach((b) => b.addEventListener("click", () => {
      if (!main) return;
      $$(".sheet-th", inner).forEach((x) => x.classList.toggle("on", x === b));
      main.src = b.dataset.src!;
      main.alt = `${WORK[cur].title}: screenshot ${Number(b.dataset.k) + 1} of ${WORK[cur].images.length}`;
      sfx.blip(Number(b.dataset.k));
      if (!reduced()) gsap.fromTo(main, { opacity: 0.3, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.4 });
    }));
    const v = $<HTMLVideoElement>(".wk-vid", inner), pb = $<HTMLButtonElement>(".wk-play", inner);
    if (v && pb) pb.addEventListener("click", () => {
      document.querySelectorAll<HTMLVideoElement>(".film-full").forEach((f) => f.pause());
      v.controls = true; v.play().catch(() => {}); pb.hidden = true;
    });
  };
  wire();

  const open = (i: number, focus = false) => {
    if (i === cur) return;
    const prev = cur;
    cur = i;
    drawers.forEach((d, j) => { d.setAttribute("aria-selected", String(j === i)); d.tabIndex = j === i ? 0 : -1; d.classList.toggle("open", j === i); });
    if (focus) drawers[i].focus();
    sheet.setAttribute("aria-labelledby", drawers[i].id);
    sfx.slide();
    const swap = () => { inner.innerHTML = sheetHTML(WORK[i], i, base); wire(); };
    if (reduced()) { swap(); return; }
    const dark = document.documentElement.dataset.theme === "dark";
    if (dark) {
      gsap.timeline()
        .to(inner, { opacity: 0, duration: 0.12, ease: "steps(2)" })
        .add(swap)
        .to(inner, { opacity: 1, duration: 0.3, ease: "steps(4)" });
      sheet.classList.remove("flash"); void sheet.offsetWidth; sheet.classList.add("flash");
    } else {
      const dir = i > prev ? 1 : -1;
      gsap.timeline()
        .to(inner, { yPercent: 6 * dir, opacity: 0, duration: 0.2, ease: "power2.in" })
        .add(swap)
        .fromTo(inner, { yPercent: -10 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    }
  };
  drawers.forEach((d, i) => {
    d.addEventListener("click", () => open(i));
    d.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); open((cur + 1) % drawers.length, true); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); open((cur - 1 + drawers.length) % drawers.length, true); }
    });
    // drag the drawer out sideways
    let x0 = -1;
    d.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    d.addEventListener("pointermove", (e) => {
      if (x0 < 0) return;
      const dx = Math.max(0, Math.min(40, e.clientX - x0));
      d.style.setProperty("--pull", `${dx}px`);
      if (dx > 26) { open(i); x0 = -1; d.style.removeProperty("--pull"); }
    });
    const end = () => { x0 = -1; d.style.removeProperty("--pull"); };
    d.addEventListener("pointerup", end);
    d.addEventListener("pointercancel", end);
    d.addEventListener("pointerleave", end);
  });
}
