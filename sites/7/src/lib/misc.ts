// Section heads, NUMBERS (dimension lines / score reels), ABOUT (general notes + revision table /
// instruction card), CONTACT (approval stamp / arcade start button), and the reveal motion.
import { COMPANY, FOUNDERS, NUMBERS } from "@shared/content";
import { $, $$, esc, gsap, ScrollTrigger, reduced, rollNumber, watchView, isDark } from "./core";
import { lamps, socialsHTML } from "./chrome";
import { sfx } from "./sound";

export const sh = (no: string, kicker: string, title: string, lede = "", id = "") => `
  <header class="sh">
    ${lamps(16, "sh-lamps")}
    <span class="sh-no" aria-hidden="true">${no}</span>
    <p class="cap sh-k">${kicker}</p>
    <h2 class="sh-t"${id ? ` id="${id}"` : ""}>${title}</h2>
    ${lede ? `<p class="sh-d">${lede}</p>` : ""}
  </header>`;

/* ---------------- NUMBERS ---------------- */
function numFig(i: number) {
  const dim = (x1: number, x2: number, y: number, ext: number) => `
    <path class="nd-ext" d="M${x1} ${y - 8} V${y + ext} M${x2} ${y - 8} V${y + ext}"/>
    <path class="nd-line" d="M${x1} ${y} H${x2}"/>
    <path class="nd-head" d="M${x1} ${y} l9 -3.4 v6.8Z M${x2} ${y} l-9 -3.4 v6.8Z"/>`;
  if (i === 0) return `${dim(20, 280, 26, 30)}
    <g class="nd-obj"><rect x="20" y="58" width="118" height="52" rx="3"/><text x="79" y="89">Aevidine</text></g>
    <g class="nd-obj"><rect x="162" y="58" width="118" height="52" rx="3"/><text x="221" y="89">Campus</text></g>`;
  if (i === 1) return `${dim(20, 280, 26, 30)}${Array.from({ length: 11 }, (_, k) => `<g class="nd-obj"><rect x="${20 + k * 24.4 + 1}" y="58" width="20.4" height="40" rx="3"/><path d="M${20 + k * 24.4 + 8} 63 h6"/></g>`).join("")}`;
  if (i === 2) return `${dim(20, 280, 26, 30)}${Array.from({ length: 5 }, (_, k) => `<g class="nd-obj"><rect x="${20 + k * 54 + 3}" y="58" width="44" height="44" rx="2" transform="rotate(${k % 2 ? 0 : 0})"/><text x="${20 + k * 54 + 25}" y="86">${k + 1}</text></g>`).join("")}`;
  return `<path class="nd-line" d="M10 92 H290"/><path class="nd-ext" d="M10 100 l10 -8 M30 100 l10 -8 M50 100 l10 -8 M70 100 l10 -8 M90 100 l10 -8 M110 100 l10 -8 M130 100 l10 -8 M150 100 l10 -8 M170 100 l10 -8 M190 100 l10 -8 M210 100 l10 -8 M230 100 l10 -8 M250 100 l10 -8 M270 100 l10 -8"/>
    <path class="nd-head" d="M138 92 l12 -18 l12 18Z"/><path class="nd-line" d="M150 74 V44"/>
    <g class="nd-obj"><rect x="134" y="14" width="32" height="30"/><text x="150" y="35">A</text></g>`;
}

export function numbersHTML() {
  return `<ul class="nums">
    ${NUMBERS.map((n, i) => {
      const s = String(n.value);
      return `<li class="num" data-v="${n.value}" data-count="${n.count}">
        ${lamps(10, "num-lamps")}
        <svg class="num-fig" viewBox="0 0 300 120" aria-hidden="true">${numFig(i)}</svg>
        <p class="num-v" aria-hidden="true"><span class="num-roll">${n.count ? "0" : s}</span></p>
        <p class="num-reels" aria-hidden="true">${s.split("").map((d) => `<span class="reel" data-d="${d}"><span class="reel-strip">${Array.from({ length: 30 }, (_, k) => `<i>${k % 10}</i>`).join("")}</span></span>`).join("")}</p>
        <p class="num-l"><span class="sr">${n.value} </span>${esc(n.label)}</p>
      </li>`;
    }).join("")}
  </ul>`;
}

export function initNumbers() {
  const root = $<HTMLElement>("#numbers");
  for (const li of $$<HTMLElement>(".num", root)) {
    let done = false;
    watchView(li, (v) => {
      if (!v || done) return;
      done = true;
      const val = Number(li.dataset.v);
      const roll = $<HTMLElement>(".num-roll", li);
      if (li.dataset.count === "true") rollNumber(roll, val, 1.4);
      if (!reduced()) {
        gsap.from($$(".nd-line, .nd-ext", li), { drawSVG: "0%", duration: 1.1, ease: "power2.inOut", stagger: 0.08 });
        gsap.from($$(".nd-obj", li), { opacity: 0, y: 6, duration: 0.4, stagger: 0.04, delay: 0.2 });
      }
      // score reels spin to their digit
      $$<HTMLElement>(".reel", li).forEach((r, k) => {
        const d = Number(r.dataset.d), strip = $<HTMLElement>(".reel-strip", r);
        const target = 20 + d; // land on the third run of 0-9
        if (reduced()) { strip.style.transform = `translateY(${(-target * 100) / 30}%)`; return; }
        gsap.fromTo(strip, { yPercent: 0 }, { yPercent: (-target * 100) / 30, duration: 1.4 + k * 0.25, ease: "power3.out", delay: 0.1 });
      });
    }, "-10% 0px");
  }
}

/* ---------------- ABOUT ---------------- */
export function aboutHTML() {
  return `<div class="about">
    <div class="notes">
      <p class="cap notes-k">General notes</p>
      <ol class="notes-l">
        <li><b>Name.</b> ${esc(COMPANY.meaning)}</li>
        <li><b>Studio.</b> ${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}. ${esc(COMPANY.pitch)}</li>
        <li><b>Origin.</b> Founded as ${esc(COMPANY.formerName)} on ${esc(COMPANY.foundedLabel)}. Renamed Aevinite on ${esc(COMPANY.renamedLabel)}.</li>
      </ol>
    </div>
    <div class="revs">
      <table class="rev">
        <caption class="cap">Revision history</caption>
        <thead><tr><th scope="col">Rev</th><th scope="col">Date</th><th scope="col">Change</th></tr></thead>
        <tbody>
          <tr><td>A</td><td>${esc(COMPANY.foundedLabel)}</td><td>Founded as ${esc(COMPANY.formerName)} in ${esc(COMPANY.city)}</td></tr>
          <tr><td>B</td><td>${esc(COMPANY.renamedLabel)}</td><td>Renamed Aevinite</td></tr>
        </tbody>
      </table>
      <div class="sigs">
        ${FOUNDERS.map((f, i) => `<article class="sig">
          ${lamps(8, "sig-lamps")}
          <p class="sig-k"><span class="sig-p">Player ${i + 1}</span><span class="sig-l">Signed</span></p>
          <h3 class="sig-n">${esc(f.name)}</h3>
          <p class="sig-r">${esc(f.role)}</p>
          <p class="sig-b">${esc(f.bio)}</p>
          <p class="sig-links"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p>
        </article>`).join("")}
      </div>
    </div>
      <figure class="inf">
        <svg viewBox="0 0 360 150" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
          <path class="inf-guide" d="M180 75 C 230 15, 330 15, 330 75 S 230 135, 180 75 S 30 15, 30 75 S 130 135, 180 75"/>
          <path class="inf-run" d="M180 75 C 230 15, 330 15, 330 75 S 230 135, 180 75 S 30 15, 30 75 S 130 135, 180 75"/>
          <circle class="inf-start" cx="180" cy="75" r="5"/>
          <path class="inf-lead" d="M183 72 L214 30 H262"/>
          <text class="inf-t" x="218" y="24">Start · ${esc(COMPANY.foundedLabel)}</text>
        </svg>
        <figcaption>A beginning with no end. The line starts once, and keeps going.</figcaption>
      </figure>
  </div>`;
}

/* ---------------- CONTACT ---------------- */
export function contactHTML(line = "Tell us how your business works today. We will tell you honestly what would help, and build it here in Ahmedabad.") {
  return `<div class="appr">
    <div class="appr-pad" role="button" tabindex="0" aria-label="Stamp the sheet: approved for growth">
      ${lamps(20, "appr-lamps")}
      <span class="appr-grid" aria-hidden="true"></span>
      <div class="imp first" aria-hidden="true"><b class="imp-l">Approved</b><small class="imp-l">for growth</small><b class="imp-d">Special</b><small class="imp-d">Approved for growth</small><i>Aevinite · ${esc(COMPANY.city)}</i></div>
      <p class="cap appr-cap">Tap the sheet to stamp it</p>
    </div>
    <div class="appr-tb">
      <p class="appr-line">${esc(line)}</p>
      <a class="btn btn-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span class="btn-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.4z"/></svg></span><span>Talk on WhatsApp</span></a>
      <dl class="appr-rows">
        <div><dt>Email</dt><dd><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></dd></div>
        <div><dt>Phone</dt><dd><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></dd></div>
        <div><dt>Studio</dt><dd>${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}</dd></div>
        <div><dt>Elsewhere</dt><dd>${socialsHTML("appr-soc")}</dd></div>
      </dl>
    </div>
  </div>`;
}

export function initContact() {
  for (const pad of $$<HTMLElement>(".appr-pad")) {
    const first = $<HTMLElement>(".imp.first", pad);
    let stamped = false;
    const slam = (el: HTMLElement) => {
      sfx.stamp();
      if (reduced()) return;
      gsap.fromTo(el, { scale: 1.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: "power4.in", onComplete: () => {
        gsap.fromTo(pad, { x: -3 }, { x: 0, duration: 0.3, ease: "elastic.out(1,0.3)" });
      } });
    };
    watchView(pad, (v) => { if (v && !stamped) { stamped = true; first.classList.add("in"); slam(first); } }, "-25% 0px");
    const impressions: HTMLElement[] = [];
    const stampAt = (x: number, y: number) => {
      const el = first.cloneNode(true) as HTMLElement;
      el.classList.remove("first");
      el.classList.add("in", "more");
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.setProperty("--r", `${(Math.random() * 24 - 12).toFixed(1)}deg`);
      pad.append(el);
      impressions.push(el);
      if (impressions.length > 4) impressions.shift()!.remove();
      slam(el);
      if (isDark()) { pad.classList.remove("flash"); void pad.offsetWidth; pad.classList.add("flash"); }
    };
    pad.addEventListener("click", (e) => {
      const r = pad.getBoundingClientRect();
      stampAt(e.clientX - r.left, e.clientY - r.top);
    });
    pad.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const r = pad.getBoundingClientRect();
      stampAt(r.width * (0.3 + Math.random() * 0.4), r.height * (0.3 + Math.random() * 0.4));
    });
  }
}

/* ---------------- reveal motion ---------------- */
export function initReveal() {
  if (reduced()) return;
  for (const h of $$<HTMLElement>(".sh-t, .prod-h")) {
    if (h.dataset.split) continue;
    h.dataset.split = "1";
    // split by word, keep inline markup simple (text-only headings)
    const words = (h.textContent ?? "").trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent!.trim());
    h.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span>${esc(w)}</span></span>`).join(" ");
    const inner = $$(".w > span", h);
    gsap.set(inner, { yPercent: 105 });
    ScrollTrigger.create({ trigger: h, start: "top 88%", once: true, onEnter: () => gsap.to(inner, { yPercent: 0, duration: 0.8, ease: "power4.out", stagger: 0.05 }) });
  }
  for (const el of $$<HTMLElement>("[data-rise]")) {
    gsap.set(el, { opacity: 0, y: 24 });
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }) });
  }
}
