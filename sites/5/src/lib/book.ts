// THE SIGNATURE TOY: issue #1 lies on the page, closed. Tap the cover, or grab it and drag it to the
// left, and it opens like a real comic (3D page turn around the spine) onto the inside cover (the
// cast and the small print) and page 1 (the contents). Tap again, or drag back, to close it.
// Easter egg: the barcode scans.
import { gsap } from "gsap";
import { $, $$, clamp, esc, isPhone, reduced } from "./util";
import { barcode, burstPath, face, type Bust } from "./art";
import { sfx } from "./sound";

export type BookOpts = {
  accent: "brand" | "gold" | "amber";
  issue: string;
  mast: string;
  line: string;
  kicker: string;
  starring: readonly string[];
  art: string;
  overlay?: string;
  ghosts?: { mast: string; kicker: string; href: string; tone: "gold" | "amber" | "brand" }[];
  logo: string;
  burst: string;
  backTitle: string;
  backLine: string;
  cast: { name: string; b: Bust }[];
  indicia: string;
  contents: { pg: string; label: string; sub: string; href: string }[];
  note: string;
  start: { label: string; href: string };
};

export function bookHTML(o: BookOpts) {
  return `<div class="hero-stage" data-accent="${o.accent}">
    <p class="hero-kick">${o.accent === "brand" ? "Aevinite Comics presents" : "Aevinite Comics presents a special issue"}</p>
    ${(o.ghosts ?? []).map((g, i) => `<a class="ghost g${i}" data-tone="${g.tone}" href="${g.href}" aria-label="Read ${esc(g.mast)}, ${esc(g.kicker)}"><span class="g-k">${esc(g.kicker)}</span><span class="g-mast">${esc(g.mast)}</span></a>`).join("")}
    <svg class="lamp" viewBox="0 0 600 900" preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs><linearGradient id="p5-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd896" stop-opacity=".34"/><stop offset="1" stop-color="#ffd896" stop-opacity="0"/></linearGradient></defs>
      <path class="lamp-cone" d="M296 128 L352 128 L640 900 L40 900Z" fill="url(#p5-cone)"/>
      <path class="lamp-post" d="M44 900 L44 150 Q44 70 130 62 L300 62"/>
      <path class="lamp-head" d="M282 62 L366 62 L352 120 L296 120Z"/><ellipse class="lamp-bulb" cx="324" cy="122" rx="24" ry="7"/>
      <path class="lamp-base" d="M24 900 L64 900 L58 860 L30 860Z"/>
    </svg>
    <span class="puddle" aria-hidden="true"><i></i><i></i></span>
    <span class="stand-sticker" aria-hidden="true">Free comics<b>Take one!</b></span>
    <div class="book-wrap"><span class="book-shadow" aria-hidden="true"></span>
      <div class="book" style="--p:0">
        <div class="book-page right">
          <p class="pg-kicker">Page 1</p>
          <h2 class="pg-title">In this issue</h2>
          <ol class="contents">${o.contents.map((c) => `<li><a href="${c.href}"><span class="ct-pg">${esc(c.pg)}</span><span class="ct-t">${esc(c.label)}</span><span class="ct-s">${esc(c.sub)}</span></a></li>`).join("")}</ol>
          <p class="pg-note"><b>From the editors:</b> ${esc(o.note)}</p>
          <a class="btn btn-ink pg-start" href="${o.start.href}">${esc(o.start.label)}</a>
          <span class="pg-num" aria-hidden="true">1</span>
        </div>
        <div class="book-cover">
          <div class="cover-front">
            <button class="cover-hit" type="button" aria-label="Open the comic" aria-expanded="false"></button>
            <div class="cv-top">
              <span class="cv-issue">${esc(o.issue)}</span>
              <span class="cv-kicker">${esc(o.kicker)}</span>
              <span class="cv-price"><b>₹0</b><small>Free issue</small></span>
            </div>
            <h1 class="cv-h1"><span class="cv-mast">${esc(o.mast)}</span><span class="cv-line">${esc(o.line)}</span></h1>
            <div class="cv-art">${o.art}</div>${o.overlay ? `<div class="cv-phone">${o.overlay}</div>` : ""}
            <div class="cv-burst" aria-hidden="true"><svg viewBox="-60 -60 120 120"><path d="${burstPath(0, 0, 40, 58, 16, 4)}"/></svg><img src="${o.logo}" alt="" width="96" height="96"><b>${esc(o.burst)}</b></div>
            <p class="cv-starring"><span class="cv-st-k">Starring</span> <span class="cv-rot" aria-hidden="true"><span class="cv-rot-w">${esc(o.starring[0])}</span></span><span class="sr">${esc(o.starring.join(", "))}</span></p>
            <div class="cv-bottom">
              <button class="barcode" type="button" aria-label="Scan the barcode">${barcode()}</button>
              <span class="cv-hint" aria-hidden="true">Tap the cover or drag its edge to open</span>
            </div>
            <span class="curl" aria-hidden="true"></span>
            <span class="scan-toast" role="status" aria-live="polite"></span>
          </div>
          <div class="cover-back" aria-hidden="true">
            <p class="cb-title">${esc(o.backTitle)}</p>
            <p class="cb-line">${esc(o.backLine)}</p>
            <p class="cb-k">This issue's cast</p>
            <ul class="cast">${o.cast.map((c) => `<li><span class="cast-face">${face(c.b)}</span><span>${esc(c.name)}</span></li>`).join("")}</ul>
            <p class="cb-fine">All characters are drawn for the story. The software in their hands is real.</p>
            <p class="cb-indicia">${esc(o.indicia)}</p>
          </div>
          <span class="turn-shade" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  </div>`;
}

export function initBook(root: HTMLElement, starring: readonly string[]) {
  const book = $(".book", root), cover = $(".book-cover", root), hit = $<HTMLButtonElement>(".cover-hit", root);
  const back = $(".cover-back", root);
  let p = 0, open = false, touched = false;
  const set = (v: number) => { p = v; book.style.setProperty("--p", v.toFixed(4)); book.classList.toggle("past-half", v > 0.5); };
  const to = (target: number, dur = 1.05) => {
    gsap.killTweensOf(book);
    const o = { v: p };
    if (reduced()) { set(target); after(target); return; }
    gsap.to(o, { v: target, duration: dur * Math.max(0.35, Math.abs(target - p)), ease: "power3.inOut", onUpdate: () => set(o.v), onComplete: () => after(target) });
  };
  const after = (t: number) => {
    const was = open;
    open = t > 0.5;
    // the cast and the contents pop in the first moment the comic lies open
    if (open && !was && !reduced()) {
      gsap.fromTo($$(".cast li", root), { scale: 0.3, opacity: 0, rotate: -12 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.5, stagger: 0.06, ease: "back.out(2.4)" });
      gsap.fromTo($$(".contents li", root), { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power3.out" });
    }
    root.classList.toggle("is-open", open);
    hit.setAttribute("aria-expanded", String(open));
    hit.setAttribute("aria-label", open ? "Close the comic" : "Open the comic");
    back.setAttribute("aria-hidden", String(!open || isPhone()));
  };
  const toggle = () => { touched = true; sfx.flip(); to(open ? 0 : 1); };

  // tap
  hit.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); return; } toggle(); });
  back.addEventListener("click", () => { if (!dragged && open) toggle(); });

  // drag the cover around its spine (pointer + touch; vertical scroll still works: touch-action pan-y)
  let sx = 0, sy = 0, sp = 0, dragging = false, dragged = false, id = -1;
  cover.addEventListener("pointerdown", (e) => {
    if ((e.target as Element).closest(".barcode")) return;
    sx = e.clientX; sy = e.clientY; sp = p; dragging = false; dragged = false; id = e.pointerId;
  });
  cover.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      dragging = true; dragged = true; touched = true;
      cover.setPointerCapture(e.pointerId);
      gsap.killTweensOf(book);
      root.classList.add("dragging");
    }
    if (dragging) set(clamp(sp - dx / cover.offsetWidth, 0, 1));
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    if (dragging) { dragging = false; root.classList.remove("dragging"); const target = p > (sp > 0.5 ? 0.75 : 0.25) ? 1 : 0; if ((target > 0.5) !== open) sfx.flip(); to(target, 0.7); }
    setTimeout(() => (dragged = false), 0);
  };
  cover.addEventListener("pointerup", end);
  cover.addEventListener("pointercancel", end);

  // an idle reader gets a little peek under the cover, until they touch it
  if (!reduced()) {
    const peek = () => { if (touched || open) return; gsap.timeline().to({}, { duration: 0 }).add(() => { const o = { v: 0 }; gsap.to(o, { v: 0.09, duration: 0.55, ease: "power2.out", yoyo: true, repeat: 1, onUpdate: () => !touched && set(o.v) }); }); };
    setTimeout(peek, 2200);
    const iv = setInterval(() => (touched ? clearInterval(iv) : peek()), 7000);
  }

  // starring: the role changes like a flipped caption
  const w = $(".cv-rot-w", root);
  let i = 0;
  if (!reduced()) setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % starring.length;
    gsap.timeline().to(w, { rotateX: 90, duration: 0.18, ease: "power2.in" }).add(() => (w.textContent = starring[i])).to(w, { rotateX: 0, duration: 0.3, ease: "back.out(2)" });
  }, 2100);

  // barcode easter egg
  const toast = $(".scan-toast", root);
  $(".barcode", root).addEventListener("click", (e) => {
    e.stopPropagation();
    sfx.beep();
    toast.textContent = "BEEP! Price: ₹0.00. It's yours to keep.";
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show");
    $(".barcode", root).classList.remove("scan"); void root.offsetWidth; $(".barcode", root).classList.add("scan");
  });

  // keyboard: Esc closes
  root.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) toggle(); });
  $$(".contents a, .pg-start", root).forEach((a) => a.addEventListener("click", () => (touched = true)));
}
