// The crate: every product and project is a record sleeve with its real screenshot as cover art.
// Flick through with drag, swipe, the wheel, arrow keys or the buttons; pull the front sleeve out
// to read its liner notes. The liner notes of the front sleeve are always on show, and the
// catalogue under the crate jumps straight to any release ("just show me").
import { PRODUCTS, WORK } from "@shared/content";
import { $, $$, esc, clamp, reduced, gsap, whileVisible } from "./util";
import * as snd from "./sound";

type Item = {
  id: string; cat: string; title: string; kind: string; desc: string;
  credits: string[]; personnel?: string[]; images: string[]; video?: string;
  href?: string; hrefLabel?: string; ext?: boolean; tone: string; cover: string; design: number;
};

const INSTR = ["drums", "bass", "keys", "guitar", "vocals"];

function items(root: string): Item[] {
  const [a, c] = PRODUCTS;
  const list: Item[] = [
    { id: a.id, cat: "AEV 01", title: a.name, kind: a.kind, desc: a.sub, credits: [], personnel: a.panels.map((p) => p.who),
      images: [a.film.poster, ...a.screens.map((s) => s.img)], href: `${root}aevidine/`, hrefLabel: "Open the Aevidine release", tone: "gold", cover: a.film.poster, design: 0 },
    { id: c.id, cat: "AEV 02", title: c.name, kind: c.kind, desc: c.sub, credits: [], personnel: c.panels.map((p) => p.who),
      images: [c.film.poster, ...c.screens.map((s) => s.img)], href: `${root}campus/`, hrefLabel: "Open the Campus release", tone: "amber", cover: c.film.poster, design: 1 },
  ];
  const tones = ["teal", "cream", "ink", "red", "gold"];
  WORK.forEach((w, i) => {
    const ext = !!w.link && /^https?:/.test(w.link);
    list.push({
      id: w.id, cat: `AEV ${String(i + 3).padStart(2, "0")}`, title: w.title, kind: w.category, desc: w.desc,
      credits: [...w.tech], images: [...w.images], video: "video" in w ? w.video : undefined,
      href: w.link ? (ext ? w.link : `${root}${w.link}`) : undefined,
      hrefLabel: w.link ? (ext ? "Visit the live site" : "Open the Aevidine release") : undefined, ext,
      tone: tones[i % tones.length], cover: w.images[0], design: (i + 2) % 4,
    });
  });
  return list;
}

function sleeveHTML(it: Item, i: number) {
  return `<button type="button" class="sl" data-i="${i}" data-tone="${it.tone}" data-design="${it.design}" aria-label="${esc(`${it.cat}, ${it.title}. ${it.kind}`)}" tabindex="-1">
    <span class="sl__art"><img src="${it.cover}" alt="" width="640" height="360" loading="lazy"></span>
    <span class="sl__type"><i>${esc(it.cat)}</i><b>${esc(it.title)}</b><em>${esc(it.kind)}</em></span>
    <span class="sl__ring" aria-hidden="true"></span>
    <span class="sl__price" aria-hidden="true">${it.id === "aevidine" || it.id === "campus" ? "Our own label" : "Studio cut"}</span>
  </button>`;
}

function notesHTML(it: Item) {
  const credits = it.credits.length
    ? `<dl class="ln__credits"><div><dt>Produced by</dt><dd>Aevinite, Ahmedabad</dd></div>${it.credits.map((t, k) =>
        `<div><dt>${esc(t)}</dt><dd>on ${INSTR[k % INSTR.length]}</dd></div>`).join("")}</dl>`
    : `<dl class="ln__credits"><div><dt>Produced by</dt><dd>Aevinite, Ahmedabad</dd></div><div><dt>Featuring</dt><dd>${esc((it.personnel ?? []).join(", "))}</dd></div></dl>`;
  return `<p class="ln__cat"><span>${esc(it.cat)}</span><span>${esc(it.kind)}</span></p>
    <h3 class="ln__t">${esc(it.title)}</h3>
    <p class="ln__d">${esc(it.desc)}</p>
    ${credits}
    <div class="ln__media">
      ${it.video ? `<video class="ln__vid" src="${it.video}" poster="${it.images[0]}" muted loop playsinline preload="none" aria-label="${esc(it.title)}: the scroll story, moving"></video>` : ""}
      <div class="ln__thumbs">${it.images.map((im, k) => `<button type="button" class="ln__th" data-src="${im}" aria-label="Show picture ${k + 1} of ${esc(it.title)}"><img src="${im}" alt="" width="160" height="90" loading="lazy"></button>`).join("")}</div>
    </div>
    ${it.href ? `<a class="ln__go" href="${it.href}" ${it.ext ? `target="_blank" rel="noopener"` : ""}>${esc(it.hrefLabel ?? "Open")} <span aria-hidden="true">&rarr;</span></a>` : `<p class="ln__private">Private project: the pictures are the public part.</p>`}`;
}

export function crateHTML(root: string) {
  const list = items(root);
  return `<div class="crate-wrap">
    <div class="crate" tabindex="0" role="group" aria-roledescription="record crate" aria-label="Crate of releases. Use the arrow keys to flip through">
      <div class="crate__floor" aria-hidden="true"></div>
      <div class="crate__back" aria-hidden="true"></div>
      <div class="crate__stack">${list.map(sleeveHTML).join("")}</div>
      <div class="crate__front" aria-hidden="true"><span class="crate__hole"></span><span class="crate__stencil">Aevinite Records · New in</span></div>
      <div class="crate__divider" aria-hidden="true"><span></span></div>
    </div>
    <div class="crate__ctl">
      <button type="button" class="crate__nav" data-d="-1" aria-label="Previous sleeve">&larr;</button>
      <p class="crate__pos" aria-live="polite"><b>1</b> / ${list.length}</p>
      <button type="button" class="crate__nav" data-d="1" aria-label="Next sleeve">&rarr;</button>
      <button type="button" class="crate__pull">Pull it out</button>
    </div>
    <article class="ln" aria-live="polite"><div class="ln__in">${notesHTML(list[0])}</div><figure class="ln__big" hidden><img alt="" width="1600" height="900"><button type="button" class="ln__close" aria-label="Close picture">Close</button></figure></article>
    <nav class="cat" aria-label="Catalogue">
      <p class="cat__h">Catalogue</p>
      <ol>${list.map((it, i) => `<li><button type="button" data-i="${i}"><span>${esc(it.cat)}</span>${esc(it.title)}<em>${esc(it.kind)}</em></button></li>`).join("")}</ol>
    </nav>
  </div>`;
}

export function bindCrate(wrap: HTMLElement, root: string) {
  const list = items(root);
  const crate = $(".crate", wrap), sleeves = $$<HTMLButtonElement>(".sl", wrap);
  const notes = $(".ln__in", wrap), pos = $(".crate__pos b", wrap), big = $(".ln__big", wrap);
  const catBtns = $$<HTMLButtonElement>(".cat button", wrap);
  let cur = 0, pulled = false;

  const layout = (instant = false) => {
    const S = sleeves[0].offsetHeight || 360;
    const gap = S < 330 ? 11 : 15;
    sleeves.forEach((s, i) => {
      const k = i - cur;
      let y = 0, z = 0, rx = 0, o = 1, sh = 0;
      if (k < 0) { // flipped forward, leaning on the front of the crate
        rx = -62 - Math.min(2, -k - 1) * 5; y = 6; z = 40 + k * 4; o = k < -2 ? 0 : 1; sh = 0.45;
      } else if (k === 0) {
        rx = -3; y = pulled ? -S * 0.3 : 0; z = 40;
      } else { // waiting behind, leaning back
        rx = 7; y = -k * gap; z = 40 - k * 30; o = k > 5 ? 0 : 1; sh = Math.min(0.62, 0.12 + k * 0.1);
      }
      s.style.zIndex = String(100 - Math.abs(k) * 2 + (k < 0 ? -1 : 0));
      s.style.setProperty("--sh", String(sh));
      s.classList.toggle("is-front", k === 0);
      s.classList.toggle("is-pulled", k === 0 && pulled);
      s.tabIndex = k === 0 ? 0 : -1;
      const tf = `translate3d(0, ${y.toFixed(1)}px, ${z}px) rotateX(${rx}deg)`;
      if (instant || reduced()) { s.style.transform = tf; s.style.opacity = String(o); }
      else gsap.to(s, { transform: tf, opacity: o, duration: 0.55, ease: k === 0 ? "back.out(1.4)" : "power3.out", overwrite: true });
    });
    pos.textContent = String(cur + 1);
    catBtns.forEach((b, i) => b.setAttribute("aria-current", i === cur ? "true" : "false"));
  };

  const showNotes = () => {
    const it = list[cur];
    const done = () => { notes.innerHTML = notesHTML(it); bindNotes(); };
    if (reduced()) return done();
    gsap.to(notes, { opacity: 0, y: 8, duration: 0.14, onComplete: () => { done(); gsap.to(notes, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }); } });
  };
  const bindNotes = () => {
    $$<HTMLButtonElement>(".ln__th", notes).forEach((b) => b.addEventListener("click", () => {
      snd.tick(1.3);
      const img = $<HTMLImageElement>("img", big);
      img.src = b.dataset.src!;
      img.alt = `${list[cur].title}, picture`;
      big.hidden = false;
      gsap.fromTo(big, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.3 });
    }));
    const v = $<HTMLVideoElement>(".ln__vid", notes);
    if (v) whileVisible(v, (on) => (on ? void v.play().catch(() => {}) : v.pause()));
  };
  $(".ln__close", wrap).addEventListener("click", () => { big.hidden = true; });

  const go = (i: number, sound = true) => {
    const n = clamp(i, 0, list.length - 1);
    if (n === cur) return false;
    cur = n; pulled = false; big.hidden = true;
    if (sound) snd.tick(0.7 + Math.random() * 0.3);
    layout(); showNotes();
    return true;
  };
  const pull = () => {
    pulled = !pulled;
    pulled ? snd.tick(0.5) : snd.thud();
    layout();
    if (pulled && innerWidth < 900) $(".ln", wrap).scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };

  sleeves.forEach((s, i) => s.addEventListener("click", () => { if (Math.abs(dragged) > 6) return; i === cur ? pull() : go(i); }));
  $$<HTMLButtonElement>(".crate__nav", wrap).forEach((b) => b.addEventListener("click", () => go(cur + Number(b.dataset.d))));
  $(".crate__pull", wrap).addEventListener("click", pull);
  catBtns.forEach((b) => b.addEventListener("click", () => { go(Number(b.dataset.i)); crate.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); }));

  // Drag / swipe: every ~56 px flips one sleeve. Vertical page scroll stays free on phones.
  let down = false, sx = 0, sy = 0, acc = 0, dragged = 0;
  crate.addEventListener("pointerdown", (e) => { down = true; sx = e.clientX; sy = e.clientY; acc = 0; dragged = 0; });
  crate.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.pointerType === "mouse" ? e.clientY - sy : 0;
    const d = Math.abs(dx) > Math.abs(dy) ? -dx : dy;
    dragged = Math.max(Math.abs(dx), Math.abs(dy));
    const steps = Math.trunc((d - acc) / 56);
    if (steps) { acc += steps * 56; go(cur + steps); }
  });
  const end = () => { down = false; setTimeout(() => (dragged = 0), 0); };
  crate.addEventListener("pointerup", end);
  crate.addEventListener("pointercancel", end);
  crate.addEventListener("pointerleave", () => { down = false; });

  // Wheel: flips while there is something to flip; at either end the page scrolls on.
  let wacc = 0, wt = 0;
  crate.addEventListener("wheel", (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if ((d > 0 && cur >= list.length - 1) || (d < 0 && cur <= 0)) return;
    e.preventDefault();
    const now = performance.now();
    if (now - wt > 260) wacc = 0;
    wt = now;
    wacc += d;
    if (Math.abs(wacc) > 60) { go(cur + Math.sign(wacc)); wacc = 0; }
  }, { passive: false });

  crate.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(cur + 1); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(cur - 1); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pull(); }
  });

  layout(true);
  bindNotes();
  new ResizeObserver(() => layout(true)).observe(crate);
}

