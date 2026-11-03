// The sections, each with its own small typographic toy.
import { COMPANY, FOUNDERS, NUMBERS, SERVICES, PROCESS, WORK, MARQUEE, FOR_WHOM, type Screen } from "@shared/content";
import { gsap, ScrollTrigger, onFrame, scroll, reduced, coarse, whenVisible, isNarrow, onResize, lenis } from "./core";
import { esc, $, $$, clamp, pad2, ICON } from "./dom";
import { fit } from "./fit";
import { blip, thock, chime } from "./sound";
import { loopWhenVisible } from "./film";
import { magnetic, toast } from "./chrome";

const W = (w: number, k: number) => `"wdth" ${w}, "wght" ${k}`;

/* ---------------------------------------------------------------- marquee */
export function marqueeHTML() {
  const a = MARQUEE.map((m) => `<span class="mq-i">${esc(m)}</span><span class="mq-s"></span>`).join("");
  const b = FOR_WHOM.map((m) => `<span class="mq-i">for ${esc(m)}</span><span class="mq-s"></span>`).join("");
  return `<div class="mq">
  <p class="sr">We build ${MARQUEE.map(esc).join(", ")}.</p>
  <div class="mq-row" aria-hidden="true"><div class="mq-t">${a}${a}</div></div>
  <div class="mq-row mq-row--o" aria-hidden="true"><div class="mq-t">${b}${b}</div></div>
</div>`;
}
export function wireMarquee(root: HTMLElement) {
  const rows = $$(".mq-row", root).map((row, i) => ({ row, t: $(".mq-t", row), x: 0, half: 0, tilt: 0, dir: i ? 1 : -1 }));
  const measure = () => rows.forEach((r) => (r.half = r.t.scrollWidth / 2));
  measure();
  document.fonts.ready.then(measure);
  onResize(measure);
  let vis = false;
  whenVisible(root, (v) => (vis = v));
  onFrame((dt) => {
    if (!vis) return;
    for (const r of rows) {
      const sp = reduced ? 0 : 50 * (1 + scroll.speed * 14) * r.dir * (scroll.dir < 0 ? -1 : 1);
      r.x = (r.x + sp * dt) % (r.half || 1);
      if (r.x > 0) r.x -= r.half;
      const want = reduced ? 0 : clamp(scroll.v * 0.0016, -7, 7) * (r.dir < 0 ? 1 : -1);
      r.tilt += (want - r.tilt) * Math.min(1, dt * 5);
      r.row.style.transform = `rotate(${r.tilt.toFixed(2)}deg)`;
      r.t.style.transform = `translate3d(${r.x.toFixed(1)}px,0,0)`;
    }
  });
}

/** Scroll-scrubbed growth: thin and narrow when it enters, full width and black when it lands. */
export function growOnScroll(el: HTMLElement, from: [number, number] = [50, 100], to: [number, number] = [150, 900]) {
  if (reduced) { el.style.setProperty("--w", String(to[0])); el.style.setProperty("--k", String(to[1])); return; }
  gsap.fromTo(el, { "--w": from[0], "--k": from[1] }, { "--w": to[0], "--k": to[1], ease: "none", scrollTrigger: { trigger: el, start: "top 98%", end: "top 45%", scrub: 0.5 } });
}

/* --------------------------------------------------- "every person" toy */
export function whoHTML(screens: readonly Screen[], name: string) {
  return `<div class="who">
  <div class="who-list" role="group" aria-label="${esc(name)}: one screen for each person">
    ${screens.map((s, i) => `<button type="button" class="who-b" aria-pressed="${i === 0}" data-i="${i}"><span class="who-n">${pad2(i + 1)}</span><span class="who-w">${esc(s.who)}</span></button>`).join("")}
  </div>
  <div class="who-view">
    <div class="who-imgs">${screens.map((s, i) => `<img src="${esc(s.img)}" alt="${esc(name)}, the ${esc(s.who.toLowerCase())}'s screen" width="1280" height="560" loading="lazy" decoding="async"${i === 0 ? ' class="on"' : ""}>`).join("")}</div>
    <p class="who-line" aria-live="polite"><b>${esc(screens[0].who)}.</b> ${esc(screens[0].line)}</p>
  </div>
</div>`;
}
export function wireWho(root: HTMLElement, screens: readonly Screen[]) {
  const bs = $$(".who-b", root), imgs = $$("img", root), line = $(".who-line", root);
  let cur = 0, touched = false, vis = false, timer = 0;
  const go = (i: number, user: boolean) => {
    if (user) touched = true;
    if (i === cur && user) return;
    cur = i;
    bs.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    imgs.forEach((im, j) => im.classList.toggle("on", j === i));
    line.innerHTML = `<b>${esc(screens[i].who)}.</b> ${esc(screens[i].line)}`;
    if (!reduced) gsap.fromTo(line, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" });
    if (user) blip(440 + i * 70, 0.05);
  };
  bs.forEach((b, i) => {
    b.addEventListener("click", () => go(i, true));
    if (!coarse) b.addEventListener("pointerenter", () => go(i, true));
  });
  whenVisible(root, (v) => (vis = v), "0px");
  timer = window.setInterval(() => { if (vis && !touched && !reduced) go((cur + 1) % screens.length, false); }, 3600);
  void timer;
}

/* --------------------------------------------------------------- services */
const SPLIT: Record<string, string[]> = {
  "Websites & apps": ["Websites &", "apps"],
  "Custom software": ["Custom", "software"],
  "Automation & AI": ["Automation", "& AI"],
  "3D & immersive web": ["3D &", "immersive", "web"],
  "Cloud & growth systems": ["Cloud &", "growth", "systems"],
};
const longest = (ls: string[]) => ls.reduce((a, b) => (b.length > a.length ? b : a), "");

export function servicesHTML() {
  return `<ol class="svc">${SERVICES.map((s, i) => `<li class="svc-i">
    <button type="button" class="svc-b" aria-expanded="false" aria-controls="svc-p${i}">
      <span class="svc-m"><span class="svc-n">${pad2(i + 1)}</span><span class="svc-tag">${esc(s.tag)}</span><span class="svc-plus" aria-hidden="true">+</span></span>
      <span class="svc-t" data-title="${esc(s.title)}">${esc(s.title)}</span>
    </button>
    <div class="svc-p" id="svc-p${i}" inert><div class="svc-pi">
      <p class="svc-d">${esc(s.desc)}</p>
      <ul class="svc-items">${s.items.map((it, j) => `<li><span>${String.fromCharCode(97 + j)}</span>${esc(it)}</li>`).join("")}</ul>
    </div></div>
  </li>`).join("")}</ol>`;
}
export function wireServices(root: HTMLElement) {
  const ts = $$(".svc-t", root);
  const lay = () => ts.forEach((t) => {
    const title = t.dataset.title!;
    const lines = isNarrow() ? SPLIT[title] ?? [title] : [title];
    t.innerHTML = lines.map((l) => `<span class="svc-ln">${esc(l)}</span>`).join("");
    t.dataset.fitText = longest(lines);
  });
  lay();
  const refits = ts.map((t) => fit(t, { max: () => (isNarrow() ? 120 : innerHeight * 0.2) }));
  onResize(() => { lay(); refits.forEach((r) => r()); });
  document.fonts.ready.then(() => refits.forEach((r) => r()));

  let vis = false;
  whenVisible(root, (v) => (vis = v));
  let lastY = -1;
  onFrame(() => {
    if (!vis || (scroll.y === lastY && lastY >= 0)) return;
    lastY = scroll.y;
    const mid = innerHeight * 0.5;
    for (const t of ts) {
      const r = t.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid) / (innerHeight * 0.42);
      const p = reduced ? 1 : 1 - clamp(d, 0, 1);
      const e = p * p * (3 - 2 * p);
      t.style.setProperty("--w", (50 + 100 * e).toFixed(1));
      t.style.setProperty("--k", (220 + 680 * e).toFixed(0));
    }
  });

  $$(".svc-b", root).forEach((b, i) => b.addEventListener("click", () => {
    const li = b.closest(".svc-i")!;
    const open = !li.classList.contains("open");
    $$(".svc-i.open", root).forEach((o) => { if (o !== li) { o.classList.remove("open"); $(".svc-b", o).setAttribute("aria-expanded", "false"); $(".svc-p", o).setAttribute("inert", ""); } });
    li.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
    $(".svc-p", li).toggleAttribute("inert", !open);
    thock(open ? 150 + i * 20 : 100, 0.12);
    if (open && !reduced) gsap.fromTo($$(".svc-items li", li), { opacity: 0, x: -14, "--k": 100 }, { opacity: 1, x: 0, "--k": 600, stagger: 0.06, duration: 0.6, ease: "expo.out", delay: 0.1 });
  }));
}

/* ---------------------------------------------------------------- process */
export function processHTML() {
  return `<div class="pc">
  <div class="pc-stage">
    <div class="pc-num" aria-hidden="true"><span class="pc-0">0</span><span class="pc-d">1</span></div>
    <div class="pc-side">
      <p class="pc-k" aria-hidden="true"><span class="pc-step">Step 1 of 4</span></p>
      <h3 class="pc-t" aria-hidden="true">${esc(PROCESS[0].title)}</h3>
      <p class="pc-desc" aria-hidden="true">${esc(PROCESS[0].desc)}</p>
      <ol class="pc-list">${PROCESS.map((p, i) => `<li${i === 0 ? ' class="on"' : ""}><button type="button" class="pc-jump" data-i="${i}"><span class="pc-ln">${p.n}</span><span class="pc-lt">${esc(p.title)}</span></button><span class="pc-ld">${esc(p.desc)}</span></li>`).join("")}</ol>
      <div class="pc-bar" aria-hidden="true">${PROCESS.map(() => "<i><b></b></i>").join("")}</div>
    </div>
  </div>
</div>`;
}
export function wireProcess(root: HTMLElement) {
  const num = $(".pc-num", root), d = $(".pc-d", root), t = $(".pc-t", root), desc = $(".pc-desc", root), step = $(".pc-step", root);
  const lis = $$(".pc-list li", root), bars = $$(".pc-bar b", root);
  fit(num, { widest: W(150, 900), max: () => (isNarrow() ? innerHeight * 0.3 : innerHeight * 0.62) / 0.8, slack: 0.96 });
  let cur = 0;
  const show = (i: number) => {
    if (i === cur) return;
    cur = i;
    lis.forEach((l, j) => l.classList.toggle("on", j === i));
    step.textContent = `Step ${i + 1} of 4`;
    blip(300 + i * 120, 0.08);
    if (reduced) { d.textContent = String(i + 1); t.textContent = PROCESS[i].title; desc.textContent = PROCESS[i].desc; return; }
    gsap.to(d, { duration: 0.45, scrambleText: { text: String(i + 1), chars: "0123456789", speed: 0.9 } });
    gsap.to(t, { duration: 0.6, scrambleText: { text: PROCESS[i].title, chars: "upperAndLowerCase", speed: 0.6 } });
    gsap.fromTo(desc, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", onStart: () => { desc.textContent = PROCESS[i].desc; } });
  };
  if (reduced) {
    root.classList.add("pc--static");
    $$(".pc-jump", root).forEach((b) => b.addEventListener("click", () => show(Number(b.dataset.i))));
    num.style.setProperty("--w", "150"); num.style.setProperty("--k", "900");
    return;
  }
  const stage = $(".pc-stage", root);
  const st = ScrollTrigger.create({
    trigger: stage, start: () => `top ${isNarrow() ? 60 : 72}px`, end: () => `+=${Math.round(innerHeight * 2.4)}`, pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = self.progress * 4;
      const i = Math.min(3, Math.floor(p));
      const q = p - i;
      // The numeral is fat mid-step and goes hairline at each change: that is the morph.
      let edge = Math.min(q, 1 - q) / 0.2;
      if (i === 0 && q < 0.5) edge = 1;
      if (i === 3 && q > 0.5) edge = 1;
      const e = clamp(edge, 0, 1);
      num.style.setProperty("--w", (50 + 100 * e).toFixed(1));
      num.style.setProperty("--k", (100 + 800 * e).toFixed(0));
      bars.forEach((b, j) => (b.style.transform = `scaleX(${clamp(p - j, 0, 1).toFixed(3)})`));
      show(i);
    },
  });
  $$(".pc-jump", root).forEach((b) => b.addEventListener("click", () => {
    const i = Number(b.dataset.i);
    const y = st.start + ((st.end - st.start) * (i + 0.5)) / 4;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else scrollTo({ top: y, behavior: "smooth" });
  }));
}

/* ------------------------------------------------------------------- work */
const WORK_SHOW: Record<string, { word: string; split: string[] }> = {
  "hospital-website": { word: "Hospital", split: ["Hospital"] },
  "dish-explorer-4d": { word: "4D Dish Explorer", split: ["4D Dish", "Explorer"] },
  hackjudge: { word: "HackJudge", split: ["HackJudge"] },
  "sweet-bites": { word: "Sweet Bites", split: ["Sweet", "Bites"] },
  "aevidine-menu": { word: "Guest Menu", split: ["Guest", "Menu"] },
};
export function workHTML(prefix = "") {
  return `<ol class="wk">${WORK.map((w, i) => {
    const show = WORK_SHOW[w.id];
    const link = w.link ? (w.link.startsWith("http") ? `<a class="wk-link" href="${esc(w.link)}" target="_blank" rel="noopener">Visit the live site ${ICON.out}</a>` : `<a class="wk-link" href="${prefix}${esc(w.link)}">Open Aevidine ${ICON.arrow}</a>`) : "";
    const video = "video" in w && w.video ? `<video class="wk-vid" muted playsinline loop preload="none" poster="${esc(w.images[0])}" width="1600" height="900" data-src="${esc(w.video)}" aria-label="${esc(w.title)}, scroll demo"></video>` : "";
    return `<li class="wk-i" data-img="${esc(w.images[0])}">
    <button type="button" class="wk-b" aria-expanded="false" aria-controls="wk-p${i}">
      <span class="wk-m"><span class="wk-n">${pad2(i + 1)}</span><span class="wk-c">${esc(w.category)}</span><span class="wk-full">${esc(w.title)}</span></span>
      <span class="wk-t" data-word="${esc(show.word)}" data-split="${esc(show.split.join("|"))}">${esc(show.word)}</span>
    </button>
    <div class="wk-p" id="wk-p${i}" inert><div class="wk-pi">
      <div class="wk-txt"><p class="wk-d">${esc(w.desc)}</p>
        <p class="wk-tech">${w.tech.map((x) => `<span>${esc(x)}</span>`).join("")}</p>${link}</div>
      <div class="wk-shots">${video}${w.images.map((src, j) => `<img src="${esc(src)}" alt="${esc(w.title)}, screenshot ${j + 1}" width="1600" height="900" loading="lazy" decoding="async">`).join("")}</div>
    </div></div>
  </li>`;
  }).join("")}</ol>`;
}
export function wireWork(root: HTMLElement) {
  const ts = $$(".wk-t", root);
  const lay = () => ts.forEach((t) => {
    const lines = isNarrow() ? t.dataset.split!.split("|") : [t.dataset.word!];
    t.innerHTML = lines.map((l) => `<span class="wk-ln">${esc(l)}</span>`).join("");
    t.dataset.fitText = longest(lines);
  });
  lay();
  const refits = ts.map((t) => fit(t, { widest: W(150, 900), max: () => (isNarrow() ? 110 : innerHeight * 0.24) }));
  onResize(() => { lay(); refits.forEach((r) => r()); });
  document.fonts.ready.then(() => refits.forEach((r) => r()));

  $$(".wk-i", root).forEach((li, i) => {
    const b = $(".wk-b", li);
    // The screenshot only loads when its row comes near the screen.
    const io = whenVisible(li, (on) => { if (on) { li.style.setProperty("--img", `url("${li.dataset.img}")`); io.disconnect(); } }, "400px");
    // The screenshot slides around INSIDE the letters as the pointer moves.
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      li.style.setProperty("--bx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      li.style.setProperty("--by", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
    b.addEventListener("pointerenter", () => blip(380 + i * 60, 0.04, 0.04));
    b.addEventListener("click", () => {
      const open = !li.classList.contains("open");
      $$(".wk-i.open", root).forEach((o) => { if (o !== li) { o.classList.remove("open"); $(".wk-b", o).setAttribute("aria-expanded", "false"); $(".wk-p", o).setAttribute("inert", ""); } });
      li.classList.toggle("open", open);
      b.setAttribute("aria-expanded", String(open));
      $(".wk-p", li).toggleAttribute("inert", !open);
      thock(open ? 170 : 100, 0.12);
      if (open) {
        const v = $(".wk-vid", li) as HTMLVideoElement | null;
        if (v && !v.dataset.wired) { v.dataset.wired = "1"; loopWhenVisible(v, v.dataset.src!); }
        if (!reduced) gsap.fromTo($$(".wk-shots > *", li), { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.7, ease: "expo.out", delay: 0.12 });
      }
    });
  });
}

/* ---------------------------------------------------------------- numbers */
export function numbersHTML() {
  return `<ul class="nm">${NUMBERS.map((n) => {
    const digits = String(n.value).split("");
    return `<li class="nm-i">
      <button type="button" class="nm-b" aria-label="${n.value}, ${esc(n.label)}. Roll it again">
        <span class="odo" aria-hidden="true">${digits.map(() => `<span class="odo-d"><span class="odo-s">${"0123456789".repeat(3).split("").map((x) => `<span>${x}</span>`).join("")}</span></span>`).join("")}</span>
      </button>
      <span class="nm-l">${esc(n.label)}</span>
    </li>`;
  }).join("")}</ul>`;
}
export function wireNumbers(root: HTMLElement) {
  const items = $$(".nm-i", root);
  const roll = (li: HTMLElement, idx: number, first: boolean) => {
    const n = NUMBERS[idx];
    const digits = String(n.value).split("").map(Number);
    $$(".odo-s", li).forEach((s, i) => {
      const d = digits[i];
      const from = first ? 0 : d;
      let last = -1;
      const o = { v: from };
      gsap.fromTo(o, { v: from }, {
        v: 20 + d, duration: reduced ? 0 : 1.5 + i * 0.25 + (first ? 0.2 : 0), ease: "power4.out", delay: first ? 0.08 * idx : 0,
        onUpdate: () => {
          s.style.transform = `translateY(${(-(o.v / 30) * 100).toFixed(3)}%)`;
          const iv = Math.round(o.v);
          if (iv !== last) { last = iv; if (!first) blip(900 - i * 120, 0.02, 0.025, "square"); }
        },
        onComplete: () => { s.style.transform = `translateY(${(-(d / 30) * 100).toFixed(3)}%)`; },
      });
    });
  };
  items.forEach((li, i) => {
    const n = NUMBERS[i];
    const digits = String(n.value).split("").map(Number);
    void digits;
    $$(".odo-s", li).forEach((s) => (s.style.transform = "translateY(0%)"));
    $(".nm-b", li).addEventListener("click", () => { roll(li, i, false); thock(200, 0.08); });
  });
  ScrollTrigger.create({ trigger: root, start: "top 80%", once: true, onEnter: () => items.forEach((li, i) => roll(li, i, true)) });
}

/* ------------------------------------------------------------------ about */
export function aboutHTML() {
  return `<div class="ab">
  <div class="ab-morph">
    <button type="button" class="ab-sw" aria-pressed="true" aria-label="Show the old name and the new name">
      <span class="ab-word" aria-hidden="true"><span class="ab-slot"><span class="ab-a">Inf</span><span class="ab-b">Aev</span></span><span class="ab-rest">inite</span></span>
    </button>
    <div class="ab-dates">
      <p class="ab-d ab-d1"><span class="mono">${esc(COMPANY.foundedLabel)}</span> Founded in ${esc(COMPANY.city)} as ${esc(COMPANY.formerName)}.</p>
      <p class="ab-d ab-d2"><span class="mono">${esc(COMPANY.renamedLabel)}</span> Renamed ${esc(COMPANY.name)}.</p>
    </div>
  </div>
  <p class="ab-mean">${esc(COMPANY.meaning)}</p>
  <div class="ab-city"><span class="mono">Where</span><p>${esc(COMPANY.city)}, ${esc(COMPANY.region)}, ${esc(COMPANY.country)}. ${esc(COMPANY.pitch)}</p></div>
  <ul class="fd">${FOUNDERS.map((f, i) => `<li class="fd-i">
    <span class="fd-n mono">${pad2(i + 1)} · ${esc(f.role)}</span>
    <h3 class="fd-name"><span class="fd-w">${esc(f.name)}</span></h3>
    <p class="fd-bio">${esc(f.bio)}</p>
    <p class="fd-links"><a href="${esc(f.linkedin)}" target="_blank" rel="noopener">LinkedIn ${ICON.out}</a><a href="${esc(f.instagram)}" target="_blank" rel="noopener">Instagram ${ICON.out}</a></p>
  </li>`).join("")}</ul>
</div>`;
}
export function wireAbout(root: HTMLElement) {
  const word = $(".ab-word", root), a = $(".ab-a", root), b = $(".ab-b", root), sw = $(".ab-sw", root);
  fit(word, { widest: W(150, 900), max: () => innerHeight * 0.3, slack: 0.97 });
  $$(".fd-w", root).forEach((w) => fit(w, { widest: W(150, 900), max: () => (isNarrow() ? 70 : 150), slack: 0.97 }));
  let now = false; // false = shows Infinite
  const set = (aev: boolean, quick = false) => {
    now = aev;
    sw.setAttribute("aria-pressed", String(aev));
    const out = aev ? a : b, inn = aev ? b : a;
    const d = quick || reduced ? 0 : 1;
    gsap.to(out, { "--w": 50, "--k": 100, yPercent: aev ? -110 : 110, opacity: 0, duration: 0.55 * d, ease: "power3.in" });
    gsap.fromTo(inn, { "--w": 150, "--k": 900, yPercent: aev ? 110 : -110, opacity: 0 }, { "--w": 100, "--k": 800, yPercent: 0, opacity: 1, duration: 1.1 * d, ease: "elastic.out(1,.5)", delay: 0.35 * d });
    root.classList.toggle("is-aev", aev);
  };
  set(false, true);
  ScrollTrigger.create({ trigger: word, start: "top 70%", once: true, onEnter: () => setTimeout(() => set(true), 500) });
  sw.addEventListener("click", () => { set(!now); thock(now ? 180 : 110, 0.14); });
}

/* ---------------------------------------------------------------- contact */
export function contactHTML() {
  return `<div class="ct">
  <h2 class="ct-h"><span class="sr">Let's talk.</span><span class="ct-kw"></span></h2>
  <div class="ct-grid">
    <a class="ct-wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${ICON.wa}<span class="ct-wa-t">WhatsApp us</span><span class="ct-wa-s">${esc(COMPANY.phoneDisplay)}</span></a>
    <div class="ct-links">
      <a class="ct-big" href="mailto:${COMPANY.email}"><span class="mono">Email</span><span class="ct-bw">${esc(COMPANY.email)}</span></a>
      <a class="ct-big" href="${COMPANY.phoneHref}"><span class="mono">Call</span><span class="ct-bw">${esc(COMPANY.phoneDisplay)}</span></a>
    </div>
    <ul class="ct-soc">${[["Instagram", COMPANY.instagram], ["LinkedIn", COMPANY.linkedin], ["GitHub", COMPANY.github], ["Medium", COMPANY.medium], ["Facebook", COMPANY.facebook]]
      .map(([l, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${l} ${ICON.out}</a></li>`).join("")}</ul>
    <p class="ct-note">No forms here. Write or call, and you talk straight to the people who build it.</p>
  </div>
</div>`;
}
export function wireContact(root: HTMLElement) {
  magnetic($(".ct-wa", root));
  $$(".ct-bw", root).forEach((w) => fit(w, { widest: W(150, 900), max: () => (isNarrow() ? 48 : 96), slack: 0.97 }));
}

export { toast, chime };
