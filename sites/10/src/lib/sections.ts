// Side B (services), the EP (process), the meters (numbers), the label (about), the booking
// board (contact). Each one has a light record-shop face and a dark club face; the facts are the
// same in both and are always readable without playing.
import { SERVICES, PROCESS, NUMBERS, FOUNDERS, COMPANY } from "@shared/content";
import { getTheme } from "@shared/theme";
import { $, $$, esc, fmt, readTime, onceVisible, reduced, gsap, ScrollTrigger, icon } from "./util";
import * as snd from "./sound";

/* ---------------- Side B: services as a tracklist ---------------- */
export function servicesHTML() {
  const rows = SERVICES.map((s, i) => {
    const d = readTime(`${s.title} ${s.desc} ${s.items.join(" ")}`);
    return `<li class="bs" style="--dur:${d}s">
      <button type="button" class="bs__b" aria-pressed="false">
        <span class="bs__n">B${i + 1}</span>
        <span class="bs__t">${esc(s.title)}</span>
        <span class="bs__tag">${esc(s.tag)}</span>
        <span class="bs__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="bs__dur">${fmt(d)}</span>
      </button>
      <p class="bs__d">${esc(s.desc)}</p>
      <p class="bs__f"><span>feat.</span> ${s.items.map(esc).join(" <i>/</i> ")}</p>
      <i class="bs__prog" aria-hidden="true"></i>
    </li>`;
  }).join("");
  return `<ol class="bside">${rows}
    <li class="bs bs--hidden" hidden>
      <div class="bs__b"><span class="bs__n">B6</span><span class="bs__t">Hidden track: your idea</span><span class="bs__dur">?:??</span></div>
      <p class="bs__d">You played the whole side. The last track is the one you bring us. <a href="${COMPANY.whatsapp}" target="_blank" rel="noopener">Tell us on WhatsApp</a>.</p>
    </li>
  </ol>
  <p class="bside__note">Track lengths are honest: how long each one takes to read.</p>`;
}

export function bindServices(root: HTMLElement) {
  const rows = $$("li.bs:not(.bs--hidden)", root), played = new Set<number>();
  const hidden = $(".bs--hidden", root);
  let timer = 0;
  const stop = () => rows.forEach((r) => { r.classList.remove("is-on"); $(".bs__b", r).setAttribute("aria-pressed", "false"); });
  rows.forEach((r, i) => {
    $(".bs__b", r).addEventListener("click", () => {
      const was = r.classList.contains("is-on");
      stop(); clearTimeout(timer);
      if (was) return;
      snd.needle();
      void r.offsetWidth;
      r.classList.add("is-on");
      $(".bs__b", r).setAttribute("aria-pressed", "true");
      played.add(i);
      const d = parseFloat(getComputedStyle(r).getPropertyValue("--dur")) * 1000;
      timer = window.setTimeout(() => { r.classList.remove("is-on"); r.classList.add("is-done"); snd.stopCrackle(); }, d);
      if (played.size === rows.length && hidden.hidden) {
        hidden.hidden = false;
        snd.chime();
        if (!reduced()) gsap.from(hidden, { opacity: 0, y: -10, duration: 0.6, delay: 0.2 });
      }
    });
  });
}

/* ---------------- The EP: process as four tracks on one waveform ---------------- */
function rand(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
function waveSVG(n: number) {
  const r = rand(7), bars: string[] = [];
  for (let i = 0; i < n; i++) {
    const seg = Math.floor((i / n) * 4), local = (i / n) * 4 - seg;
    const env = (0.32 + seg * 0.2) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, local * 1.15 + 0.05)));
    const h = Math.max(0.06, Math.min(1, env * (0.55 + r() * 0.7)));
    const x = i * 6, y = 50 - h * 46;
    bars.push(`<rect class="s${seg}" x="${x}" y="${y.toFixed(1)}" width="3.6" height="${(h * 92).toFixed(1)}" rx="1.4"/>`);
  }
  return `<svg viewBox="0 0 ${n * 6} 100" preserveAspectRatio="none" aria-hidden="true">${bars.join("")}</svg>`;
}

export function processHTML() {
  const w = waveSVG(160);
  return `<div class="ep">
    <div class="ep__deck">
      <div class="ep__wave">
        <div class="ep__w ep__w--dim">${w}</div>
        <div class="ep__w ep__w--lit">${w}</div>
        <div class="ep__grid" aria-hidden="true">${"<i></i>".repeat(16)}</div>
        <i class="ep__head" aria-hidden="true"></i>
      </div>
      <ol class="ep__marks" aria-hidden="true">${PROCESS.map((p) => `<li>${p.n}</li>`).join("")}</ol>
    </div>
    <ol class="ep__steps">${PROCESS.map((p, i) => `<li class="ep__s" data-i="${i}">
      <span class="ep__n">Track ${p.n}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.desc)}</p>
    </li>`).join("")}</ol>
  </div>`;
}

export function bindProcess(root: HTMLElement) {
  const lit = $(".ep__w--lit", root), head = $(".ep__head", root), steps = $$(".ep__s", root), marks = $$(".ep__marks li", root);
  const set = (p: number) => {
    lit.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)`;
    head.style.left = `${(p * 100).toFixed(2)}%`;
    const k = Math.min(3, Math.floor(p * 4 + 0.02));
    steps.forEach((s, i) => { s.classList.toggle("is-on", i === k); s.classList.toggle("is-past", i < k); });
    marks.forEach((s, i) => s.classList.toggle("is-on", i <= k));
  };
  set(0.04);
  ScrollTrigger.create({
    trigger: $(".ep__steps", root), start: "top 75%", end: "bottom 55%", scrub: true,
    onUpdate: (st) => set(0.04 + st.progress * 0.96),
  });
}

/* ---------------- The meters: honest numbers ---------------- */
export function numbersHTML() {
  const ticks: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (-50 + i * 10) * (Math.PI / 180), r1 = 78, r2 = i % 2 ? 72 : 68;
    ticks.push(`<line x1="${(100 + r1 * Math.sin(a)).toFixed(1)}" y1="${(104 - r1 * Math.cos(a)).toFixed(1)}" x2="${(100 + r2 * Math.sin(a)).toFixed(1)}" y2="${(104 - r2 * Math.cos(a)).toFixed(1)}" class="${i >= 8 ? "hot" : ""}"/>`);
  }
  const levels = [0.62, 0.86, 0.74, 0.96];
  return `<div class="rack">${NUMBERS.map((n, i) => `<figure class="vu" data-to="${n.value}" data-count="${n.count}" data-lvl="${levels[i]}">
      <div class="vu__face">
        <svg class="vu__dial" viewBox="0 0 200 120" aria-hidden="true">
          <path class="vu__arc" d="M40.2 54 A78 78 0 0 1 159.8 54"/>
          <path class="vu__red" d="M144.6 40.2 A78 78 0 0 1 159.8 54"/>
          ${ticks.join("")}
          <text x="100" y="86" text-anchor="middle" class="vu__vu">VU</text>
          <g class="vu__needle"><line x1="100" y1="112" x2="100" y2="30"/><circle cx="100" cy="112" r="6"/></g>
        </svg>
        <div class="vu__led" aria-hidden="true">${"<i></i>".repeat(14)}</div>
      </div>
      <figcaption><b class="vu__num">${n.count ? 0 : n.value}</b><span>${esc(n.label)}</span></figcaption>
    </figure>`).join("")}</div>
    <p class="rack__note">Tap a meter to give it a kick.</p>`;
}

export function bindNumbers(root: HTMLElement) {
  $$(".vu", root).forEach((vu, i) => {
    const needle = $(".vu__needle", vu), num = $(".vu__num", vu), leds = $$(".vu__led i", vu);
    const lvl = Number(vu.dataset.lvl), to = Number(vu.dataset.to);
    const setLed = (x: number) => leds.forEach((l, k) => l.classList.toggle("on", k < Math.round(x * leds.length)));
    const swing = (x: number, d = 1.4) => {
      gsap.to(needle, { rotate: -50 + x * 100, svgOrigin: "100 112", duration: d, ease: "elastic.out(1, 0.35)" });
      const o = { v: 0 };
      gsap.fromTo(o, { v: x * 0.3 }, { v: x, duration: d * 0.5, ease: "power2.out", onUpdate: () => setLed(o.v) });
    };
    gsap.set(needle, { rotate: -50, svgOrigin: "100 112" });
    onceVisible(vu, () => {
      setTimeout(() => {
        if (reduced()) { gsap.set(needle, { rotate: -50 + lvl * 100, svgOrigin: "100 112" }); setLed(lvl); return; }
        swing(lvl);
        if (vu.dataset.count === "true") {
          const o = { v: 0 };
          gsap.to(o, { v: to, duration: 1.1, ease: "power2.out", onUpdate: () => (num.textContent = String(Math.round(o.v))) });
        }
      }, i * 140);
    });
    vu.addEventListener("click", () => {
      snd.tick(0.6 + i * 0.15);
      gsap.timeline().to(needle, { rotate: 48, svgOrigin: "100 112", duration: 0.12, ease: "power2.out" }).add(() => swing(lvl, 1.6));
      setLed(1);
      setTimeout(() => setLed(lvl), 160);
    });
    vu.tabIndex = 0;
    vu.setAttribute("role", "button");
    vu.setAttribute("aria-label", `${vu.querySelector("figcaption span")!.textContent}: ${to}. Press to kick the meter.`);
    vu.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); vu.click(); } });
  });
}

/* ---------------- About the label ---------------- */
export function aboutHTML() {
  return `<div class="about">
    <div class="about__notes">
      <p class="kick">About the label</p>
      <h2 class="h2">The beginning <em>with no end.</em></h2>
      <p class="about__lead">${esc(COMPANY.meaning)}</p>
      <p>Based in ${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}. Websites, custom software and automation, and two products of our own.</p>
      <ol class="disco" aria-label="Label history">
        <li><span class="disco__y">2024</span><span class="disco__t"><b>Founded as Infinite</b> ${esc(COMPANY.foundedLabel)}, ${esc(COMPANY.city)}</span></li>
        <li><span class="disco__y">2026</span><span class="disco__t"><b>Renamed Aevinite</b> ${esc(COMPANY.renamedLabel)}</span></li>
      </ol>
    </div>
    <div class="duo" aria-label="The founders">
      ${FOUNDERS.map((f, i) => `<article class="pass" data-i="${i}">
        <span class="pass__strap" aria-hidden="true"></span>
        <div class="pass__card">
          <p class="pass__k"><span class="only-l">Credits</span><span class="only-d">All access</span><span>${esc(f.role)}</span></p>
          <p class="pass__ini" aria-hidden="true">${f.name.split(" ").map((w) => w[0]).join("")}</p>
          <h3 class="pass__n">${esc(f.name)}</h3>
          <p class="pass__b">${esc(f.bio)}</p>
          <p class="pass__l"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p>
        </div>
      </article>`).join("")}
    </div>
  </div>`;
}

/** The passes swing on their lanyards when pushed (dark), and tilt like pinned cards (light). */
export function bindAbout(root: HTMLElement) {
  $$(".pass", root).forEach((p) => {
    const card = $(".pass__card", p);
    let sx = 0, on = false;
    const swing = (v: number) => {
      if (reduced()) return;
      const dark = getTheme() === "dark";
      gsap.fromTo(card, { rotate: v }, { rotate: 0, duration: dark ? 2.2 : 1.1, ease: dark ? "elastic.out(1, 0.18)" : "elastic.out(1, 0.4)", overwrite: true });
    };
    p.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") swing((Math.random() > 0.5 ? 1 : -1) * 5); });
    p.addEventListener("pointerdown", (e) => { on = true; sx = e.clientX; });
    p.addEventListener("pointerup", (e) => { if (!on) return; on = false; const d = e.clientX - sx; swing(Math.max(-16, Math.min(16, d / 6 || 7))); snd.tick(0.5); });
    p.addEventListener("pointercancel", () => (on = false));
  });
}

/* ---------------- Book us for a show ---------------- */
export function contactHTML() {
  const tabs = [
    { l: "WhatsApp", s: COMPANY.phoneDisplay, h: COMPANY.whatsapp, ext: true },
    { l: "Email", s: COMPANY.email, h: `mailto:${COMPANY.email}`, ext: false },
    { l: "Call", s: COMPANY.phoneDisplay, h: COMPANY.phoneHref, ext: false },
    { l: "Instagram", s: "@aevinite", h: COMPANY.instagram, ext: true },
    { l: "LinkedIn", s: "Aevinite", h: COMPANY.linkedin, ext: true },
  ];
  return `<div class="board">
    <div class="flyer">
      <span class="flyer__pin" aria-hidden="true"></span>
      <p class="flyer__k"><span>Now booking</span><span>${esc(COMPANY.city)}</span></p>
      <h2 class="flyer__h">Book Aevinite <em>for a show.</em></h2>
      <p class="flyer__p">Your website, your software, your automation. Tell us how your business really works and we'll play it back to you, built. You talk to the people who make it.</p>
      <div class="flyer__cta">
        <a class="btn btn--main" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${icon.wa}<span>Message us on WhatsApp</span></a>
        <p class="flyer__plain"><a href="mailto:${COMPANY.email}">${esc(COMPANY.email)}</a><a href="${COMPANY.phoneHref}">${esc(COMPANY.phoneDisplay)}</a></p>
      </div>
      <p class="flyer__tear" aria-hidden="true">Take a tab</p>
      <ul class="tabs">${tabs.map((t) => `<li><a class="tab" href="${t.h}" ${t.ext ? `target="_blank" rel="noopener"` : ""}><b>${esc(t.l)}</b><small>${esc(t.s)}</small></a></li>`).join("")}</ul>
    </div>
  </div>`;
}

export function bindContact(root: HTMLElement) {
  $$<HTMLAnchorElement>(".tab", root).forEach((t) => {
    t.addEventListener("click", () => {
      if (t.classList.contains("is-torn")) return;
      snd.tear();
      t.classList.add("is-torn");
      if (!reduced()) {
        gsap.timeline()
          .to(t, { y: 30, rotate: 180 + (Math.random() - 0.5) * 30, duration: 0.18, ease: "power2.out" })
          .to(t, { y: 260, rotate: 180 + (Math.random() - 0.5) * 80, opacity: 0, duration: 0.7, ease: "power2.in" })
          .set(t, { y: -30, rotate: 180 })
          .to(t, { y: 0, opacity: 1, duration: 0.6, delay: 1.2, ease: "back.out(1.6)", onComplete: () => t.classList.remove("is-torn") });
      } else t.classList.remove("is-torn");
    });
  });
}
