// Shared pieces for all three pages of Tiny Town: header, the day/night dial, the sound switch,
// the cinema (films with chapters drawn as stations on a railway line), the lightbox, reveals,
// rolling numbers, the skyline strip and the footer.
import gsap from "gsap";
import { COMPANY, FILM_CREDIT, type Film } from "@shared/content";
import { initTheme, setTheme, getTheme, onTheme, prefersReducedMotion, type Theme } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { setSound, soundOn, onSound, play } from "./sound";

export const reduce = prefersReducedMotion();
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll(sel)] as T[];
export const isNarrow = () => innerWidth < 760;
export const isTouch = () => matchMedia("(pointer: coarse)").matches;

export const ICON = {
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8.6c0 3 2.4 5.6 5.5 6.2l1.2-1.3-1.8-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-1.8z" fill="currentColor"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.8l2.6.4 1 4-1.8 1.3a10 10 0 0 0 5.7 5.7l1.3-1.8 4 1 .4 2.6c-.2 1.3-1.3 2.2-2.6 2.1A15.5 15.5 0 0 1 4.9 6.4C4.8 5.1 5.7 4 7 3.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  ext: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const SOCIALS = [
  ["Instagram", COMPANY.instagram],
  ["LinkedIn", COMPANY.linkedin],
  ["GitHub", COMPANY.github],
  ["Medium", COMPANY.medium],
  ["Facebook", COMPANY.facebook],
] as const;

/* ------------------------------------------------------------------ boot */
export function boot(name = "Tiny Town") {
  initTheme(2);
  conceptBadge(2, name);
  document.documentElement.classList.toggle("reduce", reduce);
  document.documentElement.classList.toggle("touch", isTouch());
}

/* ------------------------------------------------------------------ header */
export function header(base: string, here: "home" | "aevidine" | "campus") {
  const on = (h: typeof here) => (h === here ? ' aria-current="page"' : "");
  const anchor = (id: string) => (here === "home" ? `#${id}` : `${base}#${id}`);
  const links = [
    ["Aevidine", `${base}aevidine/`, on("aevidine")],
    ["Campus", `${base}campus/`, on("campus")],
    ["Work", anchor("work"), ""],
    ["Services", anchor("services"), ""],
    ["Contact", anchor("contact"), ""],
  ];
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="brand" href="${base || "./"}" aria-label="Aevinite, home">
    <svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="31" rx="15" ry="4.2" class="brand__base"/><path d="M9 29V18l5-4 5 4v11z" class="brand__a"/><path d="M19 29V13l6-5 6 5v16z" class="brand__b"/><rect x="22.6" y="16" width="4.8" height="4.8" rx="1" class="brand__w"/></svg>
    <span class="brand__word">Aevinite</span>
  </a>
  <nav class="nav" aria-label="Main">
    ${links.map(([l, h, c]) => `<a href="${h}"${c}>${l}</a>`).join("")}
  </nav>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mapmenu"><span class="menu-btn__fold" aria-hidden="true"></span>Map</button>
  <div class="mapmenu" id="mapmenu" hidden>
    <p class="mapmenu__title">Town map</p>
    ${links.map(([l, h, c], i) => `<a href="${h}"${c}><span class="mono">0${i + 1}</span>${l}</a>`).join("")}
  </div>
</header>`;
}

function bindMenu() {
  const btn = $(".menu-btn");
  const m = $("#mapmenu");
  if (!btn || !m) return;
  const set = (open: boolean) => {
    btn.setAttribute("aria-expanded", String(open));
    m.hidden = !open;
    if (open && !reduce) gsap.fromTo(m, { y: -8, opacity: 0, rotateX: -12 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.35, ease: "back.out(2)" });
  };
  btn.addEventListener("click", () => set(m.hidden !== false));
  m.addEventListener("click", (e) => (e.target as HTMLElement).closest("a") && set(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && !m.hidden && (set(false), btn.focus()));
  document.addEventListener("click", (e) => !m.hidden && !(e.target as HTMLElement).closest(".mapmenu,.menu-btn") && set(false));
}

/* ------------------------------------------------------------------ fixed controls: sound + day/night dial */
export function controls() {
  const wrap = document.createElement("div");
  wrap.className = "controls";
  wrap.innerHTML = `
  <button class="sound" type="button" aria-pressed="false" aria-label="Sound is off. Turn town sounds on">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="sound__box" d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path class="sound__w1" d="M15 9.5a3.5 3.5 0 0 1 0 5"/><path class="sound__w2" d="M17.5 7a7 7 0 0 1 0 10"/><path class="sound__x" d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>
  </button>
  <button class="dial" type="button">
    <span class="dial__ring" aria-hidden="true">
      <span class="dial__disk">
        <svg class="dial__sun" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4.6"/>${Array.from({ length: 8 }, (_, i) => `<rect x="9.2" y="1.2" width="1.6" height="3" rx=".8" transform="rotate(${i * 45} 10 10)"/>`).join("")}</svg>
        <svg class="dial__moon" viewBox="0 0 20 20"><path d="M13.5 3.5a7 7 0 1 0 3 9.6A5.6 5.6 0 0 1 13.5 3.5z"/><circle cx="4" cy="5" r=".8"/><circle cx="16.5" cy="5.5" r=".6"/></svg>
      </span>
      <svg class="dial__hills" viewBox="0 0 40 20" preserveAspectRatio="none"><path d="M0 9 C6 4 10 4 15 8 S24 3 30 6 S37 8 40 6 V20 H0z"/><rect x="6" y="3.5" width="2.2" height="5" /><rect x="27" y="1.5" width="2.6" height="5.5"/></svg>
    </span>
  </button>`;
  document.body.append(wrap);
  const dial = $<HTMLButtonElement>(".dial", wrap);
  const label = (t: Theme) => dial.setAttribute("aria-label", t === "dark" ? "Night in town. Switch to day" : "Day in town. Switch to night");
  label(getTheme());
  dial.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    play("chime");
    setTheme(next, {
      transition: (commit) => {
        document.documentElement.classList.add("theme-anim");
        commit();
        setTimeout(() => document.documentElement.classList.remove("theme-anim"), 1300);
      },
    });
  });
  onTheme(label);
  const snd = $<HTMLButtonElement>(".sound", wrap);
  const paint = (v: boolean) => {
    snd.setAttribute("aria-pressed", String(v));
    snd.setAttribute("aria-label", v ? "Sound is on. Turn town sounds off" : "Sound is off. Turn town sounds on");
    snd.classList.toggle("is-on", v);
  };
  snd.addEventListener("click", () => {
    setSound(!soundOn());
    play("pop");
  });
  onSound(paint);
  bindMenu();
}

/* ------------------------------------------------------------------ films */
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Chapters drawn as stations on a little railway line; a train marks where the film is. */
export function stations(film: Film, cls = "") {
  if (!film.chapters?.length) return "";
  return `<div class="line ${cls}" data-film="${film.id}">
    <span class="line__track" aria-hidden="true"><span class="line__train"></span></span>
    <ol>${film.chapters.map((c, i) => `<li><button type="button" class="station" data-t="${c.t}" data-i="${i}"><span class="station__dot" aria-hidden="true"></span><span class="station__t mono">${fmt(c.t)}</span><span class="station__l">${esc(c.label)}</span></button></li>`).join("")}</ol>
  </div>`;
}

/** Keep a station line in sync with a playing video (train position + current station). */
export function syncLine(line: HTMLElement, video: HTMLVideoElement, film: Film) {
  const ch = film.chapters ?? [];
  const train = $(".line__train", line);
  const btns = $$<HTMLButtonElement>(".station", line);
  const tick = () => {
    const d = video.duration || 1;
    const t = video.currentTime;
    let cur = 0;
    ch.forEach((c, i) => t >= c.t - 0.2 && (cur = i));
    btns.forEach((b, i) => b.classList.toggle("is-here", i === cur && t > 0));
    // The train runs between the station dots, so it never sits off the line.
    const i = cur, a = ch[i]?.t ?? 0, b = ch[i + 1]?.t ?? d;
    const f = Math.min(1, Math.max(0, (t - a) / Math.max(0.1, b - a)));
    const p0 = btns[i] ? btns[i].offsetLeft + 9 : 0;
    const p1 = btns[i + 1] ? btns[i + 1].offsetLeft + 9 : line.clientWidth - 12;
    if (train) train.style.transform = `translateX(${p0 + (p1 - p0) * f}px)`;
  };
  video.addEventListener("timeupdate", tick);
  video.addEventListener("seeked", tick);
  addEventListener("resize", tick);
  tick();
}

let cinemaEl: HTMLDialogElement | null = null;
function cinema() {
  if (cinemaEl) return cinemaEl;
  const d = document.createElement("dialog");
  d.className = "cinema";
  d.setAttribute("aria-labelledby", "cinema-title");
  d.innerHTML = `<div class="cinema__box">
    <header class="cinema__head"><div><p class="mono cinema__len"></p><h2 id="cinema-title" class="cinema__title"></h2></div>
    <button class="icon-btn cinema__x" type="button" aria-label="Close the film">${ICON.close}</button></header>
    <div class="cinema__screen"><video controls playsinline preload="none"></video></div>
    <div class="cinema__line"></div>
    <p class="cinema__desc"></p>
    <p class="cinema__credit mono">${esc(FILM_CREDIT)}</p>
  </div>`;
  document.body.append(d);
  const v = $<HTMLVideoElement>("video", d);
  const close = () => {
    v.pause();
    d.close();
  };
  $(".cinema__x", d).addEventListener("click", close);
  d.addEventListener("click", (e) => e.target === d && close());
  d.addEventListener("close", () => v.pause());
  cinemaEl = d;
  return d;
}

export function openFilm(film: Film, t = 0) {
  const d = cinema();
  const v = $<HTMLVideoElement>("video", d);
  $(".cinema__title", d).textContent = film.title;
  $(".cinema__len", d).textContent = `Film · ${film.length}`;
  $(".cinema__desc", d).textContent = film.description;
  const holder = $(".cinema__line", d);
  if (v.dataset.id !== film.id) {
    v.dataset.id = film.id;
    v.poster = film.poster;
    v.src = film.src;
    holder.innerHTML = stations(film);
    const line = $(".line", holder);
    if (line) {
      syncLine(line, v, film);
      bindStations(line, v);
    }
  }
  if (!d.open) d.showModal();
  const go = () => {
    v.currentTime = t;
    v.play().catch(() => {});
  };
  if (v.readyState >= 1) go();
  else v.addEventListener("loadedmetadata", go, { once: true }), v.load();
}

export function bindStations(line: HTMLElement, v: HTMLVideoElement) {
  line.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".station");
    if (!b) return;
    const t = Number(b.dataset.t);
    const go = () => {
      v.currentTime = t;
      v.play().catch(() => {});
    };
    if (v.readyState >= 1) go();
    else {
      v.preload = "metadata";
      v.addEventListener("loadedmetadata", go, { once: true });
      v.load();
    }
    play("click");
  });
}

/** A muted preview loop that only plays while on screen, with a big play button for the real film. */
export function previewTV(film: Film, label = "Play the film") {
  return `<div class="tv" data-film="${film.id}">
    <video class="tv__v" muted playsinline loop preload="none" poster="${film.poster}" data-src="${film.preview ?? film.src}" aria-hidden="true" tabindex="-1"></video>
    <button class="tv__play" type="button" data-open="${film.id}"><span class="tv__icon">${ICON.play}</span><span><b>${label}</b><span class="mono"> with sound · ${film.length}</span></span></button>
  </div>`;
}

export function bindPreviews(root: ParentNode = document) {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting && !document.hidden) {
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          if (!reduce) v.play().catch(() => {});
        } else v.pause();
      }),
    { threshold: 0.25 },
  );
  $$<HTMLVideoElement>("video[data-src]", root).forEach((v) => io.observe(v));
  document.addEventListener("visibilitychange", () => document.hidden && $$<HTMLVideoElement>("video[data-src]", root).forEach((v) => v.pause()));
}

/** Only one film with sound at a time. */
export function oneFilmAtATime() {
  document.addEventListener(
    "play",
    (e) => {
      const v = e.target as HTMLVideoElement;
      if (v.muted) return;
      $$<HTMLVideoElement>("video").forEach((o) => o !== v && !o.muted && o.pause());
    },
    true,
  );
}

/* ------------------------------------------------------------------ lightbox */
let lb: HTMLDialogElement | null = null;
export function openImage(src: string, alt: string, caption = "") {
  if (!lb) {
    lb = document.createElement("dialog");
    lb.className = "lightbox";
    lb.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure><button class="icon-btn lightbox__x" type="button" aria-label="Close picture">${ICON.close}</button>`;
    document.body.append(lb);
    $(".lightbox__x", lb).addEventListener("click", () => lb!.close());
    lb.addEventListener("click", (e) => e.target === lb && lb!.close());
  }
  const img = $<HTMLImageElement>("img", lb);
  img.src = src;
  img.alt = alt;
  $("figcaption", lb).textContent = caption;
  lb.showModal();
  if (!reduce) gsap.fromTo($("figure", lb), { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" });
}

/* ------------------------------------------------------------------ reveals, numbers */
export function reveals(root: ParentNode = document) {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  $$(".rv, .words", root).forEach((el) => io.observe(el));
}

/** Split a heading into words that rise out of a mask. */
export function splitWords(el: HTMLElement) {
  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent?.trim() ?? "");
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(" ");
  el.classList.add("words");
}

/** Odometer digits that roll to a value. */
export function odometer(el: HTMLElement, value: number) {
  const s = String(value);
  el.setAttribute("aria-label", s);
  el.innerHTML = [...s].map(() => `<span class="odo" aria-hidden="true"><span class="odo__s">${"0123456789".split("").map((d) => `<span>${d}</span>`).join("")}</span></span>`).join("");
  const roll = (spins = 1) => {
    $$(".odo__s", el).forEach((strip, i) => {
      const d = Number(s[i]);
      if (reduce) return void (strip.style.transform = `translateY(${-d * 10}%)`);
      gsap.fromTo(strip, { yPercent: 0 }, { yPercent: -d * 10, duration: 1.1 + i * 0.25 + spins * 0.2, ease: "power3.out", delay: i * 0.08 });
    });
  };
  return roll;
}

/* ------------------------------------------------------------------ skyline strip (light: clay; dark: lit windows) */
export function skyline(seed = 3, cls = "") {
  let a = seed;
  const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  let x = 0;
  let rects = "", wins = "";
  while (x < 1440) {
    const w = 34 + Math.floor(r() * 70), h = 22 + Math.floor(r() * 62);
    rects += `<rect x="${x}" y="${90 - h}" width="${w}" height="${h}" rx="2"/>`;
    if (r() > 0.55) rects += `<rect x="${x + w * 0.62}" y="${90 - h - 9}" width="${Math.min(14, w * 0.3)}" height="9" rx="4"/>`;
    for (let wy = 90 - h + 8; wy < 84; wy += 13)
      for (let wx = x + 7; wx < x + w - 10; wx += 13) if (r() > 0.42) wins += `<rect x="${wx}" y="${wy}" width="6" height="7" rx="1"/>`;
    x += w + 2 + Math.floor(r() * 14);
  }
  return `<svg class="skyline ${cls}" viewBox="0 0 1440 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="skyline__b">${rects}</g><g class="skyline__w">${wins}</g></svg>`;
}

/* ------------------------------------------------------------------ footer */
export function footer(base: string, here: "home" | "aevidine" | "campus") {
  const anchor = (id: string) => (here === "home" ? `#${id}` : `${base}#${id}`);
  return `<footer class="foot">
  ${skyline(11)}
  <div class="foot__in">
    <div class="foot__brand">
      <p class="foot__word">Aevinite</p>
      <p class="foot__line">${esc(COMPANY.line)}</p>
      <a class="btn btn--wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${ICON.wa}<span>WhatsApp us</span></a>
    </div>
    <nav class="foot__col" aria-label="Footer">
      <p class="mono">Town map</p>
      <a href="${base || "./"}">Home</a><a href="${base}aevidine/">Aevidine</a><a href="${base}campus/">Campus Conveyance</a><a href="${anchor("work")}">Work</a><a href="${anchor("services")}">Services</a><a href="${anchor("contact")}">Contact</a>
    </nav>
    <div class="foot__col">
      <p class="mono">Elsewhere</p>
      ${SOCIALS.map(([l, h]) => `<a href="${h}" target="_blank" rel="noopener">${l}</a>`).join("")}
    </div>
    <div class="foot__col">
      <p class="mono">Post</p>
      <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>
      <a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a>
      <span>${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}</span>
    </div>
  </div>
  <div class="foot__base">
    <p>© 2026 Aevinite, ${COMPANY.city}.</p>
    <p class="mono">${esc(FILM_CREDIT)}</p>
    <p class="mono">Every building here is drawn in code with three.js. No models were downloaded.</p>
  </div>
</footer>`;
}

export const socials = SOCIALS;
