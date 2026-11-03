// Work = "Previous issues": back-issue covers on a rack, each with a real screenshot as its cover
// art. Pull one out and it opens in a reader: the pages are the project's real screenshots (swipe or
// arrow through them), Sweet Bites plays its scroll film.
import { gsap } from "gsap";
import type { WORK as WorkT } from "@shared/content";
import { $, $$, esc, reduced } from "./util";
import { sfx } from "./sound";
import { pauseAllBut } from "./film";

type Work = (typeof WorkT)[number];
let items: readonly Work[] = [];

export function workHTML(work: readonly Work[], kicker: string) {
  items = work;
  return `<section class="sec rack" id="work" data-page="14" aria-labelledby="wk-t">
    <header class="sec-head"><p class="sec-k">${esc(kicker)}</p><h2 id="wk-t" class="sec-t">Previous issues</h2><p class="sec-s">Our back catalogue. Pull an issue off the rack to read it.</p></header>
    <div class="rack-scroll"><ul class="rack-row">${work.map((w, i) => `<li class="rack-slot pop" style="--i:${i}">
      <button class="issue" type="button" data-i="${i}" aria-haspopup="dialog" aria-label="Read ${esc(w.title)}, ${esc(w.category)}">
        <span class="is-top"><span class="is-no">No. ${i + 2}</span><span class="is-price">₹0</span></span>
        <span class="is-mast">${esc(w.title)}</span>
        <span class="is-art"><img src="${w.images[0]}" alt="" loading="lazy" decoding="async" width="1600" height="900"></span>
        <span class="is-cat">${esc(w.category)}</span>
        ${"video" in w ? `<span class="is-flag">With film!</span>` : ""}
      </button>
    </li>`).join("")}</ul></div>
    <ul class="sr">${work.map((w) => `<li>${esc(w.title)} (${esc(w.category)}): ${esc(w.desc)}</li>`).join("")}</ul>
  </section>
  <dialog class="reader" aria-labelledby="rd-t">
    <div class="rd-in">
      <button class="rd-x" type="button" aria-label="Put the issue back">×</button>
      <p class="rd-k"></p>
      <h3 class="rd-t" id="rd-t"></h3>
      <div class="rd-stage"><div class="rd-pages"></div>
        <button class="rd-nav rd-prev" type="button" aria-label="Previous page">‹</button><button class="rd-nav rd-next" type="button" aria-label="Next page">›</button>
        <p class="rd-count" aria-live="polite"></p></div>
      <p class="rd-d"></p>
      <p class="rd-tech"></p>
      <p class="rd-link"></p>
    </div>
  </dialog>`;
}

export function initReader(base = "") {
  const dlg = $<HTMLDialogElement>("dialog.reader");
  if (!dlg) return;
  const pagesEl = $(".rd-pages", dlg), count = $(".rd-count", dlg);
  let cur = 0, n = 1, from: HTMLElement | null = null;
  const show = (i: number) => {
    cur = (i + n) % n;
    $$(".rd-p", pagesEl).forEach((p, j) => p.classList.toggle("on", j === cur));
    count.textContent = n > 1 ? `Page ${cur + 1} of ${n}` : "";
  };
  const open = (i: number, btn: HTMLElement) => {
    const w = items[i];
    from = btn;
    $(".rd-k", dlg).textContent = `Back issue No. ${i + 2} · ${w.category}`;
    $(".rd-t", dlg).textContent = w.title;
    $(".rd-d", dlg).textContent = w.desc;
    $(".rd-tech", dlg).innerHTML = `<b>Inked with</b> ${w.tech.map((t) => `<span>${esc(t)}</span>`).join("")}`;
    const href = w.link ? (w.link.startsWith("http") ? w.link : base + w.link) : "";
    $(".rd-link", dlg).innerHTML = href ? `<a class="btn btn-ink" href="${href}"${href.startsWith("http") ? ` target="_blank" rel="noopener"` : ""}>${href.startsWith("http") ? "Visit it live" : "Read the full issue"}</a>` : "";
    const imgs = w.images.map((src, j) => `<figure class="rd-p"><img src="${src}" alt="${esc(w.title)}, screenshot ${j + 1}" width="1600" height="900" decoding="async"></figure>`);
    if ("video" in w && w.video) imgs.unshift(`<figure class="rd-p"><video src="${w.video}" poster="${w.images[0]}" controls playsinline muted loop preload="metadata" aria-label="${esc(w.title)} scroll film"></video></figure>`);
    pagesEl.innerHTML = imgs.join("");
    n = imgs.length;
    dlg.classList.toggle("single", n < 2);
    show(0);
    dlg.showModal();
    sfx.swish();
    const v = $<HTMLVideoElement>("video", pagesEl);
    if (v) { pauseAllBut(v); v.play().catch(() => {}); }
    if (!reduced()) {
      const r = btn.getBoundingClientRect(), d = $(".rd-in", dlg).getBoundingClientRect();
      gsap.fromTo(".rd-in", { x: r.left + r.width / 2 - (d.left + d.width / 2), y: r.top + r.height / 2 - (d.top + d.height / 2), scale: r.width / d.width, rotate: -6, opacity: 0.4 }, { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: "back.out(1.3)", clearProps: "transform,opacity" });
    }
  };
  $$<HTMLButtonElement>(".issue").forEach((b) => b.addEventListener("click", () => open(Number(b.dataset.i), b)));
  const close = () => { $$<HTMLVideoElement>("video", pagesEl).forEach((v) => v.pause()); dlg.close(); };
  $(".rd-x", dlg).addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener("close", () => { pagesEl.innerHTML = ""; from?.focus(); });
  $(".rd-prev", dlg).addEventListener("click", () => { show(cur - 1); sfx.flip(); });
  $(".rd-next", dlg).addEventListener("click", () => { show(cur + 1); sfx.flip(); });
  dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
  let sx = 0;
  pagesEl.addEventListener("pointerdown", (e) => (sx = e.clientX));
  pagesEl.addEventListener("pointerup", (e) => { const dx = e.clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); });
}
