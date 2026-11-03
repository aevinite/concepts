// Shared pieces for the three Ink pages: header (logo, nav, sound, the moon/drop toggle with its
// wave), footer, films with chapters, screens per person, printed sheets, the marbled card.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COMPANY, FILM_CREDIT, NAV, media, type Film, type Screen } from "@shared/content";
import { getTheme, setTheme, prefersReducedMotion } from "@shared/theme";
import { bath, PIGMENTS, type PigmentId } from "./bath";
import { setSound, soundOn, plip, swish } from "./sound";

gsap.registerPlugin(ScrollTrigger);

/** Text that says one thing on paper and another at sea. */
export const w = (light: string, dark: string) => `<span class="wl">${light}</span><span class="wd">${dark}</span>`;
export const words = (s: string) => s.split(" ").map((x) => `<span class="wm"><span class="w">${x}</span></span>`).join(" ");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

// ---------- header ----------
export function header(base: string, here: "home" | "aevidine" | "campus") {
  const nav = NAV.map((n) => {
    const href = n.href.startsWith("#") ? (here === "home" ? n.href : `${base}${n.href}`) : `${base}${n.href}`;
    const cur = (here === "aevidine" && n.href === "aevidine/") || (here === "campus" && n.href === "campus/");
    return `<a href="${href}"${cur ? ' aria-current="page"' : ""}>${n.label}</a>`;
  }).join("");
  return `
  <header class="top" data-solid>
    <a class="brand" href="${base || "./"}" aria-label="Aevinite, home">
      <img src="${media("aevinite-mark.webp")}" alt="" width="40" height="25">
      <span>Aevinite</span>
    </a>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <div class="top-r">
      <button class="sound" type="button" aria-pressed="false" aria-label="Sound off. Turn sound on">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="s-on" d="M16 8.5c1.2 1 1.8 2.2 1.8 3.5s-.6 2.5-1.8 3.5M18.6 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path class="s-off" d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
      <button class="world" type="button" aria-label="Switch to the night sea">
        <svg viewBox="0 0 48 32" aria-hidden="true">
          <g class="i-drop"><path d="M24 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="currentColor"/><path d="M8 26c5-3 9 3 16 0s11-3 16 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></g>
          <g class="i-moon"><path d="M28 5a10 10 0 1 0 8 15 8 8 0 0 1-8-15z" fill="currentColor"/><circle cx="12" cy="9" r="1.2" fill="currentColor"/><circle cx="17" cy="4.5" r=".8" fill="currentColor"/><path d="M6 27c5-3 9 3 16 0s11-3 16 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>
        </svg>
        <span class="world-l">${w("Night sea", "Paper")}</span>
      </button>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open the menu"><span></span><span></span></button>
    </div>
  </header>
  <div class="menu" id="menu" hidden data-solid>
    <nav aria-label="Menu">${nav}</nav>
  </div>`;
}

export function bindHeader() {
  const world = document.querySelector<HTMLButtonElement>(".world")!;
  const label = () => world.setAttribute("aria-label", getTheme() === "dark" ? "Switch to paper, the light world" : "Switch to the night sea, the dark world");
  label();
  world.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next, { from: world, transition: (commit) => wave(commit, next) });
    label();
    swish(0.9);
  });
  const snd = document.querySelector<HTMLButtonElement>(".sound")!;
  const sync = () => { snd.setAttribute("aria-pressed", String(soundOn())); snd.setAttribute("aria-label", soundOn() ? "Sound on. Turn sound off" : "Sound off. Turn sound on"); };
  document.documentElement.dataset.sound = "off";
  snd.addEventListener("click", () => { setSound(!soundOn()); sync(); plip(); });
  const mb = document.querySelector<HTMLButtonElement>(".menu-btn")!, menu = document.getElementById("menu")!;
  const setMenu = (o: boolean) => { menu.hidden = !o; mb.setAttribute("aria-expanded", String(o)); mb.setAttribute("aria-label", o ? "Close the menu" : "Open the menu"); document.documentElement.classList.toggle("menu-open", o); };
  mb.addEventListener("click", () => setMenu(!!menu.hidden));
  menu.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
  // the header turns to a paper strip once the hero is behind you
  const top = document.querySelector(".top")!;
  const onScroll = () => top.classList.toggle("scrolled", scrollY > 80);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/** The theme switch: a wave sweeps across from the right and leaves the other world behind it. */
function wave(commit: () => void, next: "light" | "dark") {
  const d = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (prefersReducedMotion() || !d.startViewTransition) { commit(); return; }
  const frames: Keyframe[] = [];
  const steps = 14, pts = 26;
  for (let f = 0; f <= steps; f++) {
    const p = f / steps;
    const e = 112 - p * 130;
    const poly = ["100% 0%", "100% 100%"];
    for (let i = 0; i <= pts; i++) {
      const y = 100 - (i / pts) * 100;
      const x = e + Math.sin(i * 0.75 + p * 9) * 4 + Math.sin(i * 0.31 - p * 5) * 3;
      poly.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    }
    frames.push({ clipPath: `polygon(${poly.join(",")})` });
  }
  const foam = document.createElement("div");
  foam.className = `foam foam-${next}`;
  foam.innerHTML = `<svg viewBox="0 0 60 400" preserveAspectRatio="none" aria-hidden="true"><path d="M40 0 C10 40 50 80 30 120 S10 200 38 240 S20 330 34 400" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 0 C24 50 58 90 40 140 S22 210 46 260 S30 340 44 400" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".6"/></svg>`;
  const vt = d.startViewTransition(commit);
  vt.ready.then(() => {
    document.documentElement.animate(frames, { duration: 1150, easing: "cubic-bezier(.55,.05,.3,1)", pseudoElement: "::view-transition-new(root)" });
    document.body.append(foam);
    foam.animate([{ transform: "translateX(112vw)" }, { transform: "translateX(-18vw)" }], { duration: 1150, easing: "cubic-bezier(.55,.05,.3,1)" }).finished.then(() => foam.remove());
  }).catch(() => foam.remove());
}

// ---------- footer ----------
export function footer(base: string, withFilm = true) {
  const s = COMPANY;
  return `
  <footer class="foot" data-solid>
    <div class="foot-in">
      <div class="foot-brand">
        <p class="foot-mark">Aevinite</p>
        <p class="foot-line">${w("The beginning with no end.", "The beginning with no end.")}</p>
      </div>
      <nav class="foot-nav" aria-label="Footer">
        <a href="${base || "./"}">Home</a>
        <a href="${base}aevidine/">Aevidine</a>
        <a href="${base}campus/">Campus Conveyance</a>
        <a href="${base}#work">Work</a>
        <a href="${base}#services">Services</a>
        <a href="${base}#contact">Contact</a>
      </nav>
      <ul class="foot-social" aria-label="Aevinite elsewhere">
        <li><a href="${s.instagram}" rel="noopener" target="_blank">Instagram</a></li>
        <li><a href="${s.linkedin}" rel="noopener" target="_blank">LinkedIn</a></li>
        <li><a href="${s.github}" rel="noopener" target="_blank">GitHub</a></li>
        <li><a href="${s.medium}" rel="noopener" target="_blank">Medium</a></li>
        <li><a href="${s.facebook}" rel="noopener" target="_blank">Facebook</a></li>
      </ul>
    </div>
    <div class="foot-base">
      ${withFilm ? `<p>${FILM_CREDIT}</p>` : ""}
      <p>© 2026 Aevinite, ${s.city}</p>
    </div>
  </footer>`;
}

// ---------- films ----------
export function filmHTML(f: Film, opts: { big?: boolean; label?: string } = {}) {
  const chapters = f.chapters?.length
    ? `<div class="chapters" role="group" aria-label="Jump to a moment in the film">${f.chapters.map((c, i) => `<button type="button" data-t="${c.t}"><span class="cn">${String(i + 1).padStart(2, "0")}</span><span class="cl">${c.label}</span><span class="ct">${fmt(c.t)}</span></button>`).join("")}</div>`
    : "";
  return `
  <figure class="film${opts.big ? " film-big" : ""}" data-film>
    <div class="film-frame print-host">
      <div class="film-screen" data-solid>
        <video playsinline muted loop preload="none" poster="${f.poster}" ${f.preview ? `data-preview="${f.preview}"` : ""} data-src="${f.src}" aria-label="${esc(f.title)}" width="1280" height="720"></video>
        <button class="film-play" type="button" aria-label="Play ${esc(f.title)} with sound, ${f.length}">
          <span class="pi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
          <span class="pt">${opts.label ?? "Play the film"}<small>with sound · ${f.length}</small></span>
        </button>
      </div>
    </div>
    ${chapters}
  </figure>`;
}

const allVideos = new Set<HTMLVideoElement>();
function only(v: HTMLVideoElement) { allVideos.forEach((o) => { if (o !== v && !o.paused) { o.pause(); } }); }

export function bindFilms(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-film]").forEach((fig) => {
    const v = fig.querySelector("video")!;
    allVideos.add(v);
    const btn = fig.querySelector<HTMLButtonElement>(".film-play")!;
    let full = false;
    const goFull = () => {
      if (full) return;
      full = true;
      v.pause();
      v.loop = false; v.muted = false; v.controls = true; v.preload = "auto";
      v.src = v.dataset.src!;
      fig.classList.add("is-full");
    };
    const play = () => { only(v); v.play().catch(() => { /* needs another tap */ }); };
    btn.addEventListener("click", () => { goFull(); play(); });
    v.addEventListener("play", () => { only(v); if (full) fig.classList.add("is-playing"); });
    v.addEventListener("pause", () => fig.classList.remove("is-playing"));
    const chaps = [...fig.querySelectorAll<HTMLButtonElement>(".chapters button")];
    chaps.forEach((b) => b.addEventListener("click", () => {
      const t = Number(b.dataset.t);
      goFull();
      const seek = () => { v.currentTime = t; play(); };
      if (v.readyState >= 1) seek(); else v.addEventListener("loadedmetadata", seek, { once: true });
      chaps.forEach((c) => c.classList.toggle("on", c === b));
    }));
    v.addEventListener("timeupdate", () => {
      if (!full || !chaps.length) return;
      let k = 0;
      chaps.forEach((c, i) => { if (v.currentTime >= Number(c.dataset.t) - 0.2) k = i; });
      chaps.forEach((c, i) => c.classList.toggle("on", i === k));
    });
    // muted preview loop, only while on screen
    if (v.dataset.preview) {
      new IntersectionObserver(([e]) => {
        if (full) { if (!e.isIntersecting && !v.paused) v.pause(); return; }
        if (e.isIntersecting && !prefersReducedMotion()) {
          if (!v.getAttribute("src")) v.src = v.dataset.preview!;
          v.play().catch(() => {});
        } else v.pause();
      }, { threshold: 0.35 }).observe(v);
    } else {
      new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }).observe(v);
    }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) allVideos.forEach((v) => v.pause()); });
}

// ---------- screens per person ----------
export function screensHTML(id: string, screens: readonly Screen[], name: string) {
  return `
  <div class="screens" data-screens>
    <div class="screens-tabs" role="tablist" aria-label="${name}: whose screen">
      ${screens.map((s, i) => `<button type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s.who}</button>`).join("")}
    </div>
    <div class="screens-view" data-solid>
      ${screens.map((s, i) => `<figure class="screen${i === 0 ? " on" : ""}" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}" ${i === 0 ? "" : "hidden"}>
        <img src="${s.img}" alt="${esc(`${name}, the ${s.who.toLowerCase()}'s screen`)}" width="1280" height="560" loading="lazy" decoding="async">
        <figcaption><b>${s.who}</b> ${s.line}</figcaption>
      </figure>`).join("")}
      <p class="swipe-hint" aria-hidden="true">${w("Swipe or tap a name", "Swipe or tap a name")}</p>
    </div>
  </div>`;
}

export function bindScreens(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-screens]").forEach((box) => {
    const tabs = [...box.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panes = [...box.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    let cur = 0;
    const show = (i: number, focus = false) => {
      i = (i + tabs.length) % tabs.length;
      if (i === cur) return;
      const from = panes[cur], to = panes[i];
      const dir = i > cur ? 1 : -1;
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      to.hidden = false;
      if (!prefersReducedMotion()) {
        gsap.fromTo(to, { opacity: 0, x: 40 * dir, filter: "blur(6px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out", clearProps: "filter,transform" });
        gsap.to(from, { opacity: 0, x: -30 * dir, duration: 0.3, onComplete: () => { from.hidden = true; gsap.set(from, { clearProps: "all" }); } });
      } else from.hidden = true;
      cur = i;
      if (focus) tabs[i].focus();
      plip(1 + i * 0.06);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(i));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1, true); }
      });
    });
    const view = box.querySelector<HTMLElement>(".screens-view")!;
    let sx = 0, sy = 0, on = false;
    view.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; on = true; });
    view.addEventListener("pointerup", (e) => {
      if (!on) return; on = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) show(cur + (dx < 0 ? 1 : -1));
    });
    view.addEventListener("pointercancel", () => (on = false));
  });
}

// ---------- prints: every sheet is pulled off the bath ----------
/** Paint a frozen piece of the bath into a sheet's border (mirror-tiled, so no seams). */
export function pullPrint(host: HTMLElement) {
  // Drawn offscreen and applied as a background image: extra canvas layers confuse the compositor
  // into skipping parts of the bath behind them.
  const r = host.getBoundingClientRect();
  const s = 0.5;
  const W = Math.max(2, Math.round(r.width * s)), H = Math.max(2, Math.round(r.height * s));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const tile = Math.round(Math.min(560, Math.max(260, Math.min(W, H) * 0.9)));
  const th = Math.round(tile * (bath.H / bath.W > 1 ? 1.2 : 0.7));
  const region = { x: Math.random() * 0.4, y: Math.random() * 0.4, w: 0.6, h: 0.6 };
  const snap = bath.snapshot(tile, th, region);
  const x = c.getContext("2d")!;
  for (let j = 0; j * th < H; j++) for (let i = 0; i * tile < W; i++) {
    x.save();
    x.translate(i * tile + (i % 2 ? tile : 0), j * th + (j % 2 ? th : 0));
    x.scale(i % 2 ? -1 : 1, j % 2 ? -1 : 1);
    x.drawImage(snap, 0, 0);
    x.restore();
  }
  host.style.setProperty("--print", `url(${c.toDataURL("image/jpeg", 0.86)})`);
  host.classList.add("printed");
}

export function sheets(root: ParentNode = document) {
  const reduce = prefersReducedMotion();
  root.querySelectorAll<HTMLElement>(".print-host").forEach((host) => {
    ScrollTrigger.create({
      trigger: host, start: "top 92%", once: true,
      onEnter: () => {
        pullPrint(host);
        if (host.classList.contains("sheet")) bath.refresh(2);
      },
    });
  });
  if (reduce) return;
  root.querySelectorAll<HTMLElement>(".sheet").forEach((el) => {
    const dark = () => getTheme() === "dark";
    gsap.set(el, { "--peel": 0 });
    ScrollTrigger.create({
      trigger: el, start: "top 86%", once: true,
      onEnter: () => {
        el.classList.add("in");
        if (dark()) gsap.fromTo(el, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", clearProps: "transform,opacity" });
        else gsap.fromTo(el, { clipPath: "inset(0% 0% 100% 0%)", y: 30, "--peel": 0 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, "--peel": 1, duration: 1.15, ease: "power3.inOut", clearProps: "clipPath,transform" });
      },
    });
  });
  // headings rise word by word
  root.querySelectorAll<HTMLElement>("[data-rise]").forEach((h) => {
    const ws = h.querySelectorAll(".w");
    if (!ws.length) return;
    gsap.set(ws, { yPercent: 110 });
    ScrollTrigger.create({ trigger: h, start: "top 90%", once: true, onEnter: () => gsap.to(ws, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, onComplete: () => h.classList.add("risen") }) });
  });
}

// ---------- hero tools ----------
export function toolsHTML(palette: { id: PigmentId; label: string }[]) {
  return `
  <div class="tools" role="toolbar" aria-label="Ink tools" data-solid>
    <div class="wells" role="radiogroup" aria-label="Pigment">
      ${palette.map((p, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-pig="${p.id}" style="--pl:${PIGMENTS[p.id].light};--pd:${PIGMENTS[p.id].dark}"><span class="well" aria-hidden="true"></span><span class="wn">${p.label}</span></button>`).join("")}
    </div>
    <span class="tsep" aria-hidden="true"></span>
    <button type="button" class="tool" data-tool="comb">${w("Comb", "Current")}</button>
    <button type="button" class="tool" data-tool="tulip">${w("Tulip", "Bloom")}</button>
    <button type="button" class="tool" data-tool="skim">${w("Skim", "Calm")}</button>
    <button type="button" class="tool tool-brush" data-tool="brush" aria-pressed="false">${w("Paint", "Paint")}</button>
    <button type="button" class="tool tool-card" data-tool="card">${w("Marble your card", "Night card")}</button>
  </div>`;
}

export function bindTools(hero: HTMLElement) {
  const wells = [...hero.querySelectorAll<HTMLButtonElement>("[data-pig]")];
  wells.forEach((b) => b.addEventListener("click", () => {
    wells.forEach((o) => o.setAttribute("aria-checked", String(o === b)));
    bath.current = b.dataset.pig as PigmentId;
    const r = b.getBoundingClientRect();
    gsap.fromTo(b.querySelector(".well"), { scale: 0.7 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,.4)" });
    plip(1.1);
    void r;
  }));
  hero.querySelector('[data-tool="comb"]')!.addEventListener("click", () => bath.comb());
  hero.querySelector('[data-tool="tulip"]')!.addEventListener("click", () => bath.tulip());
  hero.querySelector('[data-tool="skim"]')!.addEventListener("click", () => bath.skim());
  const brush = hero.querySelector<HTMLButtonElement>('[data-tool="brush"]')!;
  brush.addEventListener("click", () => {
    bath.brush = !bath.brush;
    brush.setAttribute("aria-pressed", String(bath.brush));
    hero.classList.toggle("brushing", bath.brush);
  });
  hero.querySelector('[data-tool="card"]')!.addEventListener("click", () => openCard());
}

// ---------- the marbled card ----------
let dlg: HTMLDialogElement | null = null;
function openCard() {
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.className = "card-modal";
    dlg.setAttribute("aria-label", "Your marbled card");
    dlg.innerHTML = `
      <div class="card-box" data-solid>
        <p class="card-k">${w("Pulled from the bath just now", "Caught from the sea just now")}</p>
        <canvas class="card-c" width="1400" height="800" role="img" aria-label="A business card: Aevinite, We help businesses grow, on the marbled pattern you made"></canvas>
        <div class="card-a">
          <button type="button" class="btn btn-ink" data-save>Save as PNG</button>
          <button type="button" class="btn" data-again>${w("Pull another", "Catch another")}</button>
          <button type="button" class="btn btn-quiet" data-close>Close</button>
        </div>
        <p class="card-n">${w("Every card is the bath at the second you pressed the button. Nobody else will get this one.", "Every card is the sea at the second you pressed the button. Nobody else will get this one.")}</p>
      </div>`;
    document.body.append(dlg);
    const c = dlg.querySelector<HTMLCanvasElement>("canvas")!;
    dlg.querySelector("[data-close]")!.addEventListener("click", () => dlg!.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg!.close(); });
    dlg.querySelector("[data-again]")!.addEventListener("click", () => { bath.comb(); setTimeout(() => { bath.refresh(3); drawCard(c); }, 1000); });
    dlg.querySelector("[data-save]")!.addEventListener("click", () => {
      c.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `aevinite-marbled-card-${Date.now().toString(36)}.png`;
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, "image/png");
    });
  }
  drawCard(dlg.querySelector("canvas")!);
  dlg.showModal();
  plip(0.8);
}

export function drawCard(c: HTMLCanvasElement) {
  const W = c.width, H = c.height;
  const x = c.getContext("2d")!;
  const dark = getTheme() === "dark";
  const snap = bath.snapshot(W, H);
  x.drawImage(snap, 0, 0);
  const pw = 640, ph = 640, px = 80, py = (H - ph) / 2;
  if (dark) {
    x.fillStyle = "rgba(2,16,19,.93)"; x.fillRect(px, py, pw, ph);
    x.strokeStyle = "rgba(80,240,220,.75)"; x.lineWidth = 2; x.shadowColor = "rgba(80,240,220,.8)"; x.shadowBlur = 18;
    x.strokeRect(px + 1, py + 1, pw - 2, ph - 2); x.shadowBlur = 0;
  } else {
    x.shadowColor = "rgba(50,35,10,.22)"; x.shadowBlur = 30; x.shadowOffsetY = 8;
    x.fillStyle = "#fbf6ea"; x.fillRect(px, py, pw, ph);
    x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetY = 0;
    x.strokeStyle = "rgba(28,26,23,.35)"; x.lineWidth = 1.2; x.strokeRect(px + 18, py + 18, pw - 36, ph - 36);
  }
  const ink = dark ? "#dffcf4" : "#1c1a17", muted = dark ? "#8fc9bd" : "#5d554a", accent = dark ? "#3cf2dc" : "#2a3c72";
  const L = px + 64;
  x.fillStyle = ink;
  x.font = dark ? "700 104px 'Syne Variable', sans-serif" : "600 132px 'Cormorant Garamond', serif";
  x.fillText("Aevinite", L, py + 210);
  x.fillStyle = accent;
  x.font = dark ? "500 40px 'Syne Variable', sans-serif" : "italic 500 56px 'Cormorant Garamond', serif";
  x.fillText(dark ? "We help businesses" : "We help businesses grow.", L, py + 290);
  if (dark) x.fillText("grow.", L, py + 340);
  x.fillStyle = muted; x.fillRect(L, py + 390, 80, 2);
  x.fillStyle = ink;
  x.font = "600 25px 'Manrope Variable', sans-serif";
  const lines = [COMPANY.email, COMPANY.phoneDisplay, "aevinite.com"];
  lines.forEach((l, i) => x.fillText(l, L, py + 448 + i * 38));
  x.fillStyle = muted;
  x.font = "600 17px 'Manrope Variable', sans-serif";
  const d = new Date();
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  x.fillText(`${COMPANY.city.toUpperCase()}, INDIA  ·  ${dark ? "CAUGHT" : "MARBLED"} ${date.toUpperCase()}`, L, py + ph - 58);
}

// ---------- small helpers ----------
export function countUp(el: HTMLElement, to: number, dur = 1.4) {
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: prefersReducedMotion() ? 0 : dur, ease: "power2.out", onUpdate: () => (el.textContent = String(Math.round(o.v))) });
}

export function rotator(el: HTMLElement, list: readonly string[], every = 2400) {
  let i = 0;
  if (prefersReducedMotion()) return;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % list.length;
    gsap.to(el, {
      yPercent: -60, opacity: 0, filter: "blur(4px)", duration: 0.35, ease: "power2.in",
      onComplete: () => { el.textContent = list[i]; gsap.fromTo(el, { yPercent: 60, opacity: 0, filter: "blur(4px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }); },
    });
  }, every);
}

/** Re-measure scroll-driven things once fonts are in and after the world changes. */
export function remeasure() {
  const go = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(go);
  addEventListener("load", go);
}
