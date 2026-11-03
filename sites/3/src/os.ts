// AevOS itself: the desktop (laptops) and the home screen (phones), the window manager, the
// menu bar, the dock, the Trash, toasts, the screensaver and the world switch.
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { COMPANY, FOR_WHOM, FILM_CREDIT, PRODUCTS } from "@shared/content";
import { getTheme, onTheme, setTheme } from "@shared/theme";
import { h, qsa, reduced } from "./dom";
import { icon, glyph } from "./icons";
import { apps, previewDef } from "./apps";
import { wallpaper } from "./wallpaper";
import { refreshDithers } from "./dither";
import { pauseAllFilms } from "./film";
import { sfx, setSound, soundOn, onSound } from "./sound";
import { SOCIALS, rel, forWhomText, type Page } from "./views";
import type { AppDef, AppCtx, Mode, OSApi } from "./types";

gsap.registerPlugin(Draggable);

type Win = {
  id: string; def: AppDef; el: HTMLElement; body: HTMLElement;
  drag?: Draggable; min: boolean; max: boolean; saved?: { x: number; y: number; w: number; h: number };
  cleanup: (() => void)[]; dockItem?: HTMLElement;
};

const isPhone = () => innerWidth < 760 || innerHeight < 480;

export function mountOS(page: Page) {
  const mode: Mode = isPhone() ? "phone" : "desk";
  const defs = apps(page);
  const defOf = (id: string): AppDef | undefined => (id.startsWith("work:") ? previewDef(id.slice(5)) : defs.find((d) => d.id === id));
  const wins = new Map<string, Win>();
  let z = 10;

  const root = h("div", { id: "os", class: `os m-${mode}` });
  const fx = h("div", { class: "fx-layer", "aria-hidden": "true" });
  const toasts = h("div", { class: "toasts", role: "status", "aria-live": "polite" });
  document.body.prepend(root);
  document.body.append(fx);

  /* ---------------- shared bits ---------------- */
  const trashState = {
    items: [] as string[],
    subs: new Set<() => void>(),
    onChange(cb: () => void) { this.subs.add(cb); },
    restoreAll() { this.items.length = 0; this.subs.forEach((s) => s()); toast("Everything is back where it was."); },
  };
  const api: OSApi = {
    page, mode,
    open: (id, from) => open(id, from ?? null),
    close: (id) => close(id),
    toast: (t) => toast(t),
    openCount: () => [...wins.values()].filter((w) => !w.min).length,
    openTitles: () => [...wins.values()].map((w) => w.def.title),
    trash: trashState,
  };

  function toast(text: string) {
    const t = h("div", { class: "toast" }, h("span", { class: "toast-i", html: icon("doc", 20) }), h("span", null, text));
    toasts.append(t);
    gsap.fromTo(t, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" });
    setTimeout(() => gsap.to(t, { opacity: 0, y: -8, duration: 0.2, onComplete: () => t.remove() }), 2800);
  }

  /** Classic zoom rectangles from one box to another (how System 1 opened windows). */
  function zoomRects(a: DOMRect, b: DOMRect, dur = 0.26) {
    if (reduced()) return Promise.resolve();
    const N = 7;
    const tl = gsap.timeline();
    for (let i = 0; i < N; i++) {
      const f = (i + 1) / N;
      const e = 1 - Math.pow(1 - f, 2);
      const r = h("div", { class: "zr" });
      Object.assign(r.style, {
        left: `${a.left + (b.left - a.left) * e}px`, top: `${a.top + (b.top - a.top) * e}px`,
        width: `${a.width + (b.width - a.width) * e}px`, height: `${a.height + (b.height - a.height) * e}px`, opacity: "0",
      });
      fx.append(r);
      tl.set(r, { opacity: 1 }, (i * dur) / N).set(r, { opacity: 0 }, (i * dur) / N + dur / 2.4);
      tl.add(() => r.remove(), dur + 0.05);
    }
    return new Promise<void>((res) => tl.eventCallback("onComplete", () => res()));
  }

  /* ---------------- theme switch: a CRT power cycle ---------------- */
  const themeBtn = h("button", { type: "button", class: "theme-sw" },
    h("span", { class: "tsw", "aria-hidden": "true" },
      h("span", { class: "tsw-screen" }, h("span", { class: "tsw-line" })), h("span", { class: "tsw-base" })),
    h("span", { class: "tsw-label", "aria-hidden": "true" }));
  const paintThemeBtn = () => {
    const dark = getTheme() === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to the light world: 1-bit paper" : "Switch to the dark world: amber phosphor");
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.querySelector(".tsw-label")!.textContent = dark ? "Amber" : "1-bit";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0b0804" : "#f2f0e9");
  };
  paintThemeBtn();
  themeBtn.addEventListener("click", () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next, {
      from: themeBtn,
      transition: (commit) => {
        if (reduced()) return commit();
        sfx.power();
        document.body.classList.add("crt-off");
        const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
        tl.to(root, { scaleY: 0.004, duration: 0.17, ease: "power3.in" })
          .to(root, { scaleX: 0, duration: 0.12, ease: "power2.in" })
          .add(() => commit())
          .set(root, { scaleX: 1, scaleY: 0.004 })
          .to(root, { scaleY: 1, duration: 0.24, ease: "expo.out" });
        if (next === "dark") tl.to(root, { keyframes: { opacity: [1, 0.35, 1, 0.6, 1, 0.85, 1] }, duration: 0.4, ease: "none" });
        else tl.fromTo(root, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.45, ease: "steps(14)" }, "<");
        tl.add(() => { gsap.set(root, { clearProps: "transform,opacity,clipPath" }); document.body.classList.remove("crt-off"); });
      },
    });
  });
  onTheme(() => { paintThemeBtn(); wall?.refresh(); refreshDithers(); });

  const soundBtn = h("button", { type: "button", class: "sound-sw", "aria-pressed": "false", "aria-label": "System sounds off. Switch on", html: glyph("mute", 16) });
  soundBtn.addEventListener("click", () => { setSound(!soundOn()); sfx.click(); });
  onSound((v) => {
    soundBtn.innerHTML = glyph(v ? "sound" : "mute", 16);
    soundBtn.setAttribute("aria-pressed", String(v));
    soundBtn.setAttribute("aria-label", v ? "System sounds on. Switch off" : "System sounds off. Switch on");
  });

  const clockEl = h("time", { class: "clock" });
  const paintClock = () => {
    const d = new Date();
    clockEl.textContent = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    clockEl.dateTime = d.toISOString();
  };
  paintClock();
  setInterval(paintClock, 10000);

  /* ---------------- hero (wallpaper text) ---------------- */
  function hero() {
    const prod = page === "home" ? null : PRODUCTS.find((p) => p.id === page)!;
    const rot = h("span", { class: "rot", "aria-hidden": "true" }, FOR_WHOM[0]);
    const el = h("section", { class: "hero", "aria-labelledby": prod ? undefined : "hero-h", "aria-label": prod ? `${prod.name} desktop` : undefined },
      h("p", { class: "hero-k" }, mode === "phone" ? `${COMPANY.name} · ${COMPANY.city} · since ${COMPANY.foundedYear}` : `${COMPANY.name} · ${COMPANY.city}, ${COMPANY.country} · since ${COMPANY.foundedYear}`),
      prod
        ? h("p", { class: "hero-h", "data-text": prod.name }, prod.name)
        : h("h1", { class: "hero-h", id: "hero-h", "data-text": COMPANY.line }, COMPANY.line),
      prod
        ? h("p", { class: "hero-for" }, prod.line)
        : h("p", { class: "hero-for" }, h("span", { class: "sr" }, `We build for ${forWhomText()}.`),
            h("span", { "aria-hidden": "true" }, "We build for "), rot, h("span", { class: "blink", "aria-hidden": "true" }, "_")),
      prod || mode === "phone" ? null : h("p", { class: "hero-p" }, COMPANY.pitch),
      h("div", { class: "hero-cta" },
        mode === "phone" ? null : prod
          ? h("button", { type: "button", class: "btn btn-main", "data-open": `${prod.id}-page` }, `Open ${prod.name}`)
          : [h("button", { type: "button", class: "btn btn-main tone-aevidine", "data-open": "aevidine" }, h("span", { html: icon("aevidine", 24) }), "Aevidine.app"),
             h("button", { type: "button", class: "btn btn-main tone-campus", "data-open": "campus" }, h("span", { html: icon("campus", 24) }), "Campus.app")],
        h("button", { type: "button", class: "btn", "data-open": prod ? `${prod.id}-page` : "reader" }, h("span", { html: icon("reader", 24) }), "Read as a normal page")),
      prod ? null : h("p", { class: "hero-tip" }, mode === "desk" ? "Double-click any icon. Drag windows by their stripes. Drop an icon in the Trash, if you dare." : "Tap an app. Drag one onto the Trash, if you dare."));
    el.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-open]");
      if (b) open(b.dataset.open!, b);
    });
    if (!prod && !reduced()) {
      let wi = 0;
      const cycle = async () => {
        const word = FOR_WHOM[wi % FOR_WHOM.length];
        for (let i = word.length; i >= 0; i--) { rot.textContent = word.slice(0, i); await wait(28); }
        wi++;
        const nw = FOR_WHOM[wi % FOR_WHOM.length];
        for (let i = 1; i <= nw.length; i++) { rot.textContent = nw.slice(0, i); await wait(62); }
        setTimeout(cycle, 1900);
      };
      setTimeout(cycle, 2600);
    }
    return el;
  }

  /* ---------------- windows (desktop) ---------------- */
  let desk: HTMLElement, winLayer: HTMLElement, dock: HTMLElement, dockMin: HTMLElement, trashIcon: HTMLElement | null = null;
  let wall: ReturnType<typeof wallpaper> | null = null;
  const deskRect = () => desk.getBoundingClientRect();
  const DOCK_SPACE = 84;

  function place(def: AppDef, companion = false) {
    const r = deskRect();
    const W = r.width, H = r.height;
    let w = Math.min(def.w, W - 40), hh = Math.min(def.h, H - DOCK_SPACE - 24);
    const n = [...wins.values()].filter((x) => !x.min).length;
    let x = Math.round(W * 0.52 - w / 2 + (n % 5) * 26);
    let y = Math.round(24 + (n % 5) * 22);
    // products open as a pair: player on the left, screens on the right, both fully visible
    if (def.companion && W >= 1200) { const cw = Math.min(460, W - 228 - 16 - 640 - 28); w = Math.min(def.w, W - 228 - 16 - cw - 12); x = 16; y = 16; }
    if (companion && W >= 1200) { w = Math.min(460, W - 228 - 16 - 640 - 28); x = W - 228 - w; y = 16; hh = Math.min(def.h, H - DOCK_SPACE - 30); }
    else if (companion) { x = Math.round(W - w - 230); y = Math.round(H - DOCK_SPACE - hh - 8); }
    if (def.id === "about") { x = Math.round(W - w - 228); y = 22; }
    x = Math.max(12, Math.min(x, W - w - (W > 1100 ? 228 : 12)));
    y = Math.max(10, Math.min(y, H - hh - DOCK_SPACE));
    return { x, y, w, h: hh };
  }

  function focusWin(w: Win) {
    if (w.el.classList.contains("active") && Number(w.el.style.zIndex) === z) return;
    w.el.style.zIndex = String(++z);
    wins.forEach((o) => o.el.classList.toggle("active", o === w));
  }

  function topWin(): Win | undefined {
    let best: Win | undefined;
    wins.forEach((w) => { if (!w.min && (!best || Number(w.el.style.zIndex) > Number(best.el.style.zIndex))) best = w; });
    return best;
  }

  function makeCtx(w: { cleanup: (() => void)[] }, arg?: string): AppCtx {
    return { os: api, arg, onClose: (fn) => w.cleanup.push(fn) };
  }

  function openDesk(def: AppDef, from: Element | null, opts: { max?: boolean; companion?: boolean; instant?: boolean } = {}) {
    const g = place(def, opts.companion);
    const titleId = `wt-${def.id.replace(/\W/g, "-")}`;
    const closeB = h("button", { type: "button", class: "wb wb-close", "aria-label": `Close ${def.title}` });
    const minB = h("button", { type: "button", class: "wb wb-min", "aria-label": `Minimise ${def.title}` });
    const maxB = h("button", { type: "button", class: "wb wb-max", "aria-label": `Zoom ${def.title}` });
    const bar = h("div", { class: "win-bar" }, closeB, h("div", { class: "win-title", id: titleId }, h("span", null, def.title)), minB, maxB);
    const body = h("div", { class: "win-body" });
    const el = h("section", { class: `win app-${def.id.replace(/\W/g, "-")}`, role: "dialog", "aria-labelledby": titleId, tabindex: "-1" }, bar, body);
    if (!def.noResize) el.append(h("div", { class: "win-grip", "aria-hidden": "true" }));
    const w: Win = { id: def.id, def, el, body, min: false, max: false, cleanup: [] };
    body.append(def.build(makeCtx(w)));
    Object.assign(el.style, { width: `${g.w}px`, height: `${g.h}px` });
    gsap.set(el, { x: g.x, y: g.y });
    winLayer.append(el);
    wins.set(def.id, w);
    focusWin(w);

    let lastGhost = 0;
    w.drag = Draggable.create(el, {
      trigger: bar, type: "x,y", zIndexBoost: false, minimumMovement: 2,
      bounds: { minX: -g.w + 120, maxX: deskRect().width - 120, minY: 0, maxY: deskRect().height - 40 },
      onPress() { focusWin(w); },
      onDragStart() { el.classList.add("dragging"); if (w.max) { w.max = false; el.classList.remove("max"); } },
      onDrag() {
        if (getTheme() !== "dark" || reduced()) return;
        const now = performance.now();
        if (now - lastGhost < 45) return;
        lastGhost = now;
        const r = el.getBoundingClientRect();
        const gh = h("div", { class: "ghost" });
        Object.assign(gh.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        fx.append(gh);
        gsap.to(gh, { opacity: 0, duration: 0.6, ease: "power1.out", onComplete: () => gh.remove() });
      },
      onDragEnd() { el.classList.remove("dragging"); },
    })[0];
    el.addEventListener("pointerdown", () => focusWin(w), true);
    el.addEventListener("focusin", () => focusWin(w));
    bar.addEventListener("dblclick", (e) => { if (!(e.target as HTMLElement).closest("button")) toggleMax(w); });
    closeB.addEventListener("click", () => close(def.id));
    minB.addEventListener("click", () => minimise(w));
    maxB.addEventListener("click", () => toggleMax(w));
    const grip = el.querySelector<HTMLElement>(".win-grip");
    if (grip) {
      grip.addEventListener("pointerdown", (e) => {
        e.preventDefault(); e.stopPropagation();
        grip.setPointerCapture(e.pointerId);
        const sx = e.clientX, sy = e.clientY, sw = el.offsetWidth, sh = el.offsetHeight;
        const mv = (ev: PointerEvent) => {
          el.style.width = `${Math.max(300, sw + ev.clientX - sx)}px`;
          el.style.height = `${Math.max(220, sh + ev.clientY - sy)}px`;
        };
        grip.addEventListener("pointermove", mv);
        grip.addEventListener("pointerup", () => grip.removeEventListener("pointermove", mv), { once: true });
      });
    }

    // shrink-wrap: a window is never taller than what it holds
    if (!opts.max && !def.id.endsWith("-page") && def.id !== "reader") {
      const need = body.scrollHeight + bar.offsetHeight + 6;
      if (need < g.h) el.style.height = `${need}px`;
    }
    if (opts.max) setMax(w, true, true);
    const target = el.getBoundingClientRect();
    if (!opts.instant && !reduced()) {
      el.style.visibility = "hidden";
      const a = from?.getBoundingClientRect() ?? new DOMRect(target.left + target.width / 2 - 20, target.top + target.height / 2 - 20, 40, 40);
      zoomRects(a, target).then(() => {
        el.style.visibility = "";
        gsap.fromTo(el, { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(1.6)" });
        if (getTheme() === "dark") { el.classList.add("glitch"); setTimeout(() => el.classList.remove("glitch"), 320); }
      });
    }
    sfx.open();
    syncDock();
    return w;
  }

  function setMax(w: Win, on: boolean, instant = false) {
    const r = deskRect();
    if (on) {
      w.saved = { x: Number(gsap.getProperty(w.el, "x")), y: Number(gsap.getProperty(w.el, "y")), w: w.el.offsetWidth, h: w.el.offsetHeight };
      const t = { x: 0, y: 0, width: r.width, height: r.height - DOCK_SPACE + 6 };
      instant || reduced() ? gsap.set(w.el, t) : gsap.to(w.el, { ...t, duration: 0.32, ease: "power3.inOut" });
    } else if (w.saved) {
      const s = w.saved;
      gsap.to(w.el, { x: s.x, y: s.y, width: s.w, height: s.h, duration: reduced() ? 0 : 0.3, ease: "power3.inOut" });
    }
    w.max = on;
    w.el.classList.toggle("max", on);
    wall?.pause(on);
  }
  function toggleMax(w: Win) { setMax(w, !w.max); sfx.click(); }

  function minimise(w: Win) {
    if (w.min) return;
    const r = w.el.getBoundingClientRect();
    w.min = true;
    w.el.querySelectorAll("video").forEach((v) => v.pause());
    syncDock();
    const target = w.dockItem?.getBoundingClientRect() ?? new DOMRect(innerWidth / 2, innerHeight - 30, 10, 10);
    sfx.min();
    w.el.hidden = true;
    zoomRects(r, target, 0.22);
    if (w.max) wall?.pause(false);
    const t = topWin();
    if (t) focusWin(t);
  }
  function restore(w: Win) {
    const from = w.dockItem?.getBoundingClientRect();
    w.min = false;
    w.el.hidden = false;
    const r = w.el.getBoundingClientRect();
    focusWin(w);
    if (from) {
      w.el.style.visibility = "hidden";
      zoomRects(from, r, 0.22).then(() => { w.el.style.visibility = ""; });
    }
    if (w.max) wall?.pause(true);
    syncDock();
    sfx.open();
  }

  /* ---------------- sheets (phone) ---------------- */
  let sheets: HTMLElement;
  let home: HTMLElement;
  function openPhone(def: AppDef, from: Element | null, opts: { instant?: boolean; root?: boolean } = {}) {
    const back = h("button", { type: "button", class: "sh-back", "aria-label": opts.root ? "Back to the Aevinite home screen" : "Back to home screen" }, h("span", { html: glyph("left", 14) }), opts.root ? "Aevinite" : "Home");
    const title = h("p", { class: "sh-title", id: `st-${def.id.replace(/\W/g, "-")}` }, def.title);
    const head = h("div", { class: "sh-head" }, h("span", { class: "sh-grab", "aria-hidden": "true" }), back, title, h("span", { class: "sh-ico", html: icon(def.icon, 24) }));
    const body = h("div", { class: "sh-body win-body" });
    const el = h("section", { class: `sheet app-${def.id.replace(/\W/g, "-")}`, role: "dialog", "aria-labelledby": title.id }, head, body);
    const w: Win = { id: def.id, def, el, body, min: false, max: true, cleanup: [] };
    body.append(def.build(makeCtx(w)));
    sheets.append(el);
    wins.set(def.id, w);
    el.style.zIndex = String(++z);
    root.classList.add("sheet-open");
    back.addEventListener("click", () => (opts.root ? navigate(rel(page, "home"), back) : history.state?.sheet === def.id ? history.back() : close(def.id)));
    if (!opts.root) history.pushState({ sheet: def.id }, "");

    // swipe down on the header to close
    let sy = 0, dy = 0, dragging = false;
    head.addEventListener("pointerdown", (e) => { if ((e.target as HTMLElement).closest("button")) return; dragging = true; sy = e.clientY; dy = 0; head.setPointerCapture(e.pointerId); });
    head.addEventListener("pointermove", (e) => { if (!dragging) return; dy = Math.max(0, e.clientY - sy); gsap.set(el, { y: dy }); });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dy > 110) (opts.root ? navigate(rel(page, "home"), back) : history.state?.sheet === def.id ? history.back() : close(def.id));
      else gsap.to(el, { y: 0, duration: 0.3, ease: "back.out(2)" });
    };
    head.addEventListener("pointerup", end);
    head.addEventListener("pointercancel", end);

    if (!opts.instant && !reduced()) {
      const a = from?.getBoundingClientRect();
      if (a) {
        const ins = `inset(${a.top}px ${innerWidth - a.right}px ${innerHeight - a.bottom}px ${a.left}px round 14px)`;
        gsap.fromTo(el, { clipPath: ins }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.42, ease: "expo.out", clearProps: "clipPath" });
        gsap.from(body, { scale: 0.92, opacity: 0, duration: 0.4, ease: "expo.out", clearProps: "all" });
      } else gsap.from(el, { yPercent: 100, duration: 0.4, ease: "expo.out" });
    }
    sfx.open();
    return w;
  }

  /* ---------------- open / close ---------------- */
  function open(id: string, from: Element | null = null, opts: { max?: boolean; instant?: boolean; root?: boolean } = {}) {
    const def = defOf(id);
    if (!def) return;
    if (def.href) { location.href = def.href; return; }
    const existing = wins.get(id);
    if (existing) {
      if (mode === "desk") {
        if (existing.min) restore(existing);
        else {
          focusWin(existing);
          gsap.fromTo(existing.el, { x: `+=6` }, { x: `-=6`, duration: 0.3, ease: "elastic.out(1.5,0.2)" });
        }
        existing.el.focus({ preventScroll: true });
      }
      return;
    }
    if (mode === "phone") { openPhone(def, from, opts); return; }
    const w = openDesk(def, from, { max: opts.max ?? (id === "reader" || id.endsWith("-page")), instant: opts.instant });
    w.el.focus({ preventScroll: true });
    if (def.companion && !wins.has(def.companion)) {
      const cd = defOf(def.companion)!;
      setTimeout(() => { const c = openDesk(cd, w.el.querySelector(".win-bar"), { companion: true }); focusWin(w); void c; }, reduced() ? 0 : 320);
    }
  }

  function close(id: string) {
    const w = wins.get(id);
    if (!w) return;
    w.cleanup.forEach((f) => f());
    w.el.querySelectorAll("video").forEach((v) => v.pause());
    wins.delete(id);
    sfx.close();
    if (page !== "home" && id === `${page}-page`) { navigate(rel(page, "home"), null); return; }
    if (mode === "phone") {
      const ic = home.querySelector(`[data-app="${CSS.escape(id)}"]`);
      const a = ic?.getBoundingClientRect();
      const done = () => { w.el.remove(); if (!sheets.children.length) root.classList.remove("sheet-open"); };
      if (a && !reduced()) {
        const ins = `inset(${a.top}px ${innerWidth - a.right}px ${innerHeight - a.bottom}px ${a.left}px round 14px)`;
        gsap.to(w.el, { clipPath: ins, duration: 0.32, ease: "power3.in", onComplete: done });
      } else if (!reduced()) gsap.to(w.el, { yPercent: 100, duration: 0.3, ease: "power2.in", onComplete: done });
      else done();
      return;
    }
    w.drag?.kill();
    w.dockItem?.remove();
    if (w.max) wall?.pause(false);
    const r = w.el.getBoundingClientRect();
    const ic = desk.querySelector(`.ico[data-app="${CSS.escape(id)}"]`);
    w.el.remove();
    if (ic && !w.min) zoomRects(r, ic.getBoundingClientRect(), 0.22);
    syncDock();
    const t = topWin();
    if (t) { focusWin(t); t.el.focus({ preventScroll: true }); }
  }

  addEventListener("popstate", () => {
    if (mode !== "phone") return;
    const sheetsOpen = [...wins.values()].filter((w) => !(page !== "home" && w.id === `${page}-page`));
    const top = sheetsOpen.sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex))[0];
    if (top) close(top.id);
  });

  /** Leave for another page with a zoom (relative links only). */
  function navigate(href: string, from: Element | null) {
    pauseAllFilms();
    if (reduced()) { location.href = href; return; }
    const a = from?.getBoundingClientRect() ?? new DOMRect(innerWidth / 2 - 20, innerHeight / 2 - 20, 40, 40);
    zoomRects(a, new DOMRect(0, 0, innerWidth, innerHeight), 0.24).then(() => { location.href = href; });
  }
  root.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const href = a.getAttribute("href")!;
    if (href.startsWith("#")) {
      const scope = a.closest(".win-body") ?? document;
      const t = scope.querySelector<HTMLElement>(href);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); }
      return;
    }
    if (/^(https?:|mailto:|tel:)/.test(href)) return;
    e.preventDefault();
    navigate(href, a);
  });

  /* ---------------- dock ---------------- */
  function syncDock() {
    if (mode !== "desk") return;
    qsa<HTMLElement>(".dock-app", dock).forEach((b) => b.classList.toggle("running", wins.has(b.dataset.app!)));
    wins.forEach((w) => {
      if (w.min && !w.dockItem) {
        w.dockItem = h("button", { type: "button", class: "dock-min", "aria-label": `Restore ${w.def.title}` }, h("span", { html: icon(w.def.icon, 24) }), h("span", { class: "dock-min-t" }, w.def.title));
        w.dockItem.addEventListener("click", () => restore(w));
        dockMin.append(w.dockItem);
        gsap.from(w.dockItem, { width: 0, opacity: 0, duration: 0.25, ease: "power2.out" });
      } else if (!w.min && w.dockItem) { w.dockItem.remove(); w.dockItem = undefined; }
    });
    dock.classList.toggle("has-min", dockMin.children.length > 0);
  }

  /* ---------------- Trash gag: nothing is ever really deleted ---------------- */
  function trashIt(ic: HTMLElement, label: string, back: () => void) {
    if (!trashIcon) return;
    const tr = trashIcon.getBoundingClientRect(), r = ic.getBoundingClientRect();
    sfx.crunch();
    gsap.to(ic, {
      x: `+=${tr.left + tr.width / 2 - (r.left + r.width / 2)}`, y: `+=${tr.top + tr.height / 2 - (r.top + r.height / 2)}`, scale: 0.1, opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        trashIcon!.querySelector(".ico-img")!.innerHTML = icon("trashfull", 48);
        gsap.fromTo(trashIcon, { rotate: -8 }, { rotate: 0, duration: 0.6, ease: "elastic.out(1.6,0.25)" });
        setTimeout(() => {
          trashIcon!.querySelector(".ico-img")!.innerHTML = icon("trash", 48);
          back();
          trashState.items.unshift(`${label} came back at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}`);
          trashState.items.splice(6);
          trashState.subs.forEach((s) => s());
          toast(`Nothing is ever really deleted. ${label} is back.`);
          sfx.open();
        }, 1300);
      },
    });
  }

  /* ---------------- desktop icons ---------------- */
  function iconBtn(def: AppDef, size = 48) {
    return h("button", { type: "button", class: "ico", "data-app": def.id, "aria-label": `${def.label}. ${mode === "desk" ? "Double-click or press Enter to open" : "Open"}` },
      h("span", { class: "ico-img", html: icon(def.icon, size) }),
      h("span", { class: "ico-l" }, mode === "phone" ? def.short ?? def.label : def.label));
  }

  function buildDesk() {
    const nav = h("nav", { class: "mb", "aria-label": "Menu bar" });
    const left = h("div", { class: "mb-l" });
    const right = h("div", { class: "mb-r" });
    nav.append(left, right);
    type Item = { label: string; act?: () => void; href?: string; ext?: boolean } | "-";
    const menus: { label: Node | string; aria: string; items: Item[] }[] = [
      { label: h("span", { class: "mb-mark" }, h("i", { class: "mark-mask" }), h("b", null, "AevOS")), aria: "AevOS menu", items: [
        { label: "About AevOS", act: () => open("aboutos") }, "-",
        ...SOCIALS.map((s) => ({ label: s.label, href: s.href, ext: true })), "-",
        { label: "Restart AevOS", act: () => { sessionStorage.removeItem("aev3-booted"); location.reload(); } },
      ] },
      { label: "File", aria: "File menu", items: [
        { label: "Open About Aevinite.txt", act: () => open("about") },
        { label: "New mail message", act: () => open("mail") }, "-",
        { label: "Close window   Esc", act: () => { const t = topWin(); if (t) close(t.id); } },
      ] },
      { label: "Apps", aria: "Apps menu", items: defs.filter((d) => d.desktop || d.id === "trash").map((d) => ({ label: d.label, act: () => open(d.id) })) },
      { label: "Go", aria: "Go menu", items: [
        { label: "Aevinite home", href: rel(page, "home") },
        { label: "Aevidine page", href: rel(page, "aevidine") },
        { label: "Campus Conveyance page", href: rel(page, "campus") },
      ] },
      { label: "Help", aria: "Help menu", items: [
        { label: "Read as a normal page", act: () => open(page === "home" ? "reader" : `${page}-page`) },
        { label: "Tips", act: () => toast("Double-click icons. Drag windows by the title bar. Drag an icon onto the Trash.") },
      ] },
    ];
    let openMenu: HTMLElement | null = null;
    const closeMenus = () => { openMenu?.classList.remove("open"); openMenu?.querySelector("button.mb-btn")?.setAttribute("aria-expanded", "false"); openMenu = null; };
    const show = (m: HTMLElement, focusFirst = false) => {
      if (openMenu && openMenu !== m) closeMenus();
      openMenu = m;
      m.classList.add("open");
      m.querySelector("button.mb-btn")!.setAttribute("aria-expanded", "true");
      if (focusFirst) m.querySelector<HTMLElement>("[role=menuitem]")?.focus();
      sfx.click();
    };
    const wraps: HTMLElement[] = [];
    menus.forEach((m, mi) => {
      const btn = h("button", { type: "button", class: `mb-btn${mi === 0 ? " mb-logo" : ""}`, "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": mi === 0 ? m.aria : undefined }, m.label);
      const list = h("div", { class: "mb-menu", role: "menu", "aria-label": m.aria });
      m.items.forEach((it) => {
        if (it === "-") { list.append(h("hr", { role: "separator" })); return; }
        const el = it.href
          ? h("a", { role: "menuitem", class: "mb-item", href: it.href, tabindex: "-1", ...(it.ext ? { target: "_blank", rel: "noopener" } : {}) }, it.label)
          : h("button", { type: "button", role: "menuitem", class: "mb-item", tabindex: "-1" }, it.label);
        el.addEventListener("click", () => { closeMenus(); it.act?.(); });
        list.append(el);
      });
      const wrap = h("div", { class: "mb-wrap" }, btn, list);
      wraps.push(wrap);
      btn.addEventListener("click", () => (openMenu === wrap ? closeMenus() : show(wrap)));
      btn.addEventListener("pointerenter", () => { if (openMenu && openMenu !== wrap) show(wrap); });
      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); show(wrap, true); }
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = wraps[(mi + (e.key === "ArrowRight" ? 1 : -1) + wraps.length) % wraps.length]; n.querySelector<HTMLElement>(".mb-btn")!.focus(); if (openMenu) show(n); }
      });
      list.addEventListener("keydown", (e) => {
        const items = qsa<HTMLElement>("[role=menuitem]", list);
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
        if (e.key === "Escape") { e.preventDefault(); closeMenus(); btn.focus(); }
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = wraps[(mi + (e.key === "ArrowRight" ? 1 : -1) + wraps.length) % wraps.length]; show(n, true); }
      });
      left.append(wrap);
    });
    document.addEventListener("pointerdown", (e) => { if (openMenu && !openMenu.contains(e.target as Node)) closeMenus(); });

    const readBtn = h("button", { type: "button", class: "mb-read" }, h("span", { html: icon("reader", 20) }), h("span", { class: "mb-read-l" }, "Read as a normal page"));
    readBtn.addEventListener("click", () => open(page === "home" ? "reader" : `${page}-page`, readBtn));
    right.append(readBtn, soundBtn, clockEl, themeBtn);

    desk = h("main", { class: "desk", id: "desk" });
    const wallC = h("canvas", { class: "wall", "aria-hidden": "true" });
    const heroEl = hero();
    const icons = h("div", { class: "icons", role: "group", "aria-label": "Desktop" });
    winLayer = h("div", { class: "wins" });
    const mark = h("p", { class: "watermark" }, `AevOS 1.0 · © 2026 ${COMPANY.name}, ${COMPANY.city} · ${FILM_CREDIT}`);
    desk.append(wallC, heroEl, icons, winLayer, mark);

    dock = h("nav", { class: "dock", "aria-label": "Dock" });
    const dockApps = h("div", { class: "dock-apps" });
    dockMin = h("div", { class: "dock-mins" });
    defs.filter((d) => d.dock).forEach((d) => {
      const b = h("button", { type: "button", class: "dock-app", "data-app": d.id, "aria-label": `Open ${d.label}` }, h("span", { html: icon(d.icon, 32) }), h("span", { class: "dock-tip" }, d.label));
      b.addEventListener("click", () => open(d.id, b));
      dockApps.append(b);
    });
    dock.append(dockApps, dockMin);
    root.append(nav, desk, dock, toasts);

    // icons: placed in two columns on the right, draggable, Trash in the corner
    const deskDefs = defs.filter((d) => d.desktop);
    const all = [...deskDefs, defs.find((d) => d.id === "trash")!];
    const els = all.map((d) => { const b = iconBtn(d); icons.append(b); return b; });
    trashIcon = els[els.length - 1];
    let saved: Record<string, [number, number]> = {};
    try { saved = JSON.parse(localStorage.getItem("aev3-icons") ?? "{}"); } catch { /* ignore */ }
    const homePos = (i: number) => {
      const r = deskRect();
      if (i === all.length - 1) return [r.width - 112, r.height - 118] as [number, number];
      const fit = Math.max(3, Math.floor((r.height - 150) / 96));
      const rows = Math.min(fit, Math.ceil((all.length - 1) / 2));
      const col = Math.floor(i / rows), row = i % rows;
      return [r.width - 112 - col * 108, 14 + row * 96] as [number, number];
    };
    const layout = () => els.forEach((b, i) => {
      const id = b.dataset.app!;
      const r = deskRect();
      const p = saved[id] && i !== all.length - 1 ? saved[id] : homePos(i);
      gsap.set(b, { x: Math.min(Math.max(0, p[0]), r.width - 96), y: Math.min(Math.max(0, p[1]), r.height - 96) });
    });
    layout();
    addEventListener("resize", () => {
      if (isPhone() !== (mode === "phone")) { location.reload(); return; }
      layout();
      wins.forEach((w) => {
        const r = deskRect();
        w.drag?.applyBounds({ minX: -w.el.offsetWidth + 120, maxX: r.width - 120, minY: 0, maxY: r.height - 40 });
        if (w.max) gsap.set(w.el, { width: r.width, height: r.height - DOCK_SPACE + 6 });
      });
    });
    const select = (b: HTMLElement | null) => els.forEach((x) => x.classList.toggle("sel", x === b));
    desk.addEventListener("pointerdown", (e) => { if (e.target === desk || e.target === wallC || (e.target as HTMLElement).classList.contains("hero")) select(null); });
    els.forEach((b, i) => {
      const id = b.dataset.app!;
      Draggable.create(b, {
        type: "x,y", bounds: desk, dragClickables: true, minimumMovement: 5, zIndexBoost: false,
        onPress() { select(b); b.style.zIndex = "3"; },
        onClick(e: PointerEvent) {
          if (e?.pointerType === "touch" || e?.pointerType === "pen") open(id, b);
          else sfx.click();
        },
        onDragEnd() {
          b.style.zIndex = "";
          if (b !== trashIcon && trashIcon && this.hitTest(trashIcon, "35%")) {
            const home = saved[id] ?? homePos(i);
            trashIt(b, all[i].label, () => gsap.fromTo(b, { x: Number(gsap.getProperty(trashIcon!, "x")), y: Number(gsap.getProperty(trashIcon!, "y")), scale: 0.2, opacity: 0 }, { x: home[0], y: home[1], scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.7)" }));
            return;
          }
          // snap to a 4 px grid, remember
          const x = Math.round(Number(gsap.getProperty(b, "x")) / 4) * 4, y = Math.round(Number(gsap.getProperty(b, "y")) / 4) * 4;
          gsap.set(b, { x, y });
          if (b !== trashIcon) { saved[id] = [x, y]; try { localStorage.setItem("aev3-icons", JSON.stringify(saved)); } catch { /* private */ } }
        },
      });
      b.addEventListener("click", (e) => { if (e.detail === 0) open(id, b); });
      b.addEventListener("dblclick", () => open(id, b));
      b.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === "ArrowDown" || k === "ArrowUp" || k === "ArrowLeft" || k === "ArrowRight") {
          e.preventDefault();
          const d = k === "ArrowDown" || k === "ArrowRight" ? 1 : -1;
          els[(i + d + els.length) % els.length].focus();
        }
      });
      b.addEventListener("focus", () => select(b));
    });

    // the hero never reaches the bottom-left corner (the concept badge lives there)
    const fitHero = () => {
      heroEl.classList.remove("tight", "tighter");
      const limit = deskRect().bottom - 76;
      if (heroEl.getBoundingClientRect().bottom > limit) heroEl.classList.add("tight");
      if (heroEl.getBoundingClientRect().bottom > limit) heroEl.classList.add("tighter");
      wall?.refresh();
    };
    addEventListener("resize", fitHero);
    onTheme(() => requestAnimationFrame(fitHero));
    document.fonts?.ready.then(fitHero);
    requestAnimationFrame(fitHero);
    wall = wallpaper(wallC, () => [heroEl.querySelector(".hero-h")!, heroEl.querySelector(".hero-for")!, heroEl.querySelector(".hero-p"), heroEl.querySelector(".hero-cta")!, heroEl.querySelector(".hero-k")!, heroEl.querySelector(".hero-tip")]
      .filter(Boolean).map((e) => (e as HTMLElement).getBoundingClientRect()));
    document.fonts?.ready.then(() => wall?.refresh());

    addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || openMenu) return;
      const t = topWin();
      if (t && (t.el.contains(document.activeElement) || document.activeElement === document.body)) { e.preventDefault(); close(t.id); }
    });
    screensaver();
    cursorTrail();
  }

  /* ---------------- phone home screen ---------------- */
  function buildPhone() {
    const status = h("header", { class: "status" }, clockEl, h("span", { class: "status-os" }, "AevOS"), h("span", { class: "status-r" }, soundBtn, themeBtn));
    const wallC = h("canvas", { class: "wall", "aria-hidden": "true" });
    const heroEl = hero();
    const grid = h("div", { class: "grid", role: "group", "aria-label": "Apps" });
    defs.filter((d) => d.phone).forEach((d) => grid.append(iconBtn(d, 40)));
    trashIcon = grid.querySelector('[data-app="trash"]');
    home = h("main", { class: "home" }, heroEl, grid);
    const foot = h("p", { class: "home-foot" }, `© 2026 ${COMPANY.name}, ${COMPANY.city}. ${FILM_CREDIT}`);
    const pdock = h("nav", { class: "pdock", "aria-label": "Dock" });
    ["call", "whatsapp", "mail", "reader"].forEach((id) => {
      const d = defOf(id)!;
      const el = d.href
        ? h("a", { class: "ico", href: d.href, "data-app": id, ...(id === "whatsapp" ? { target: "_blank", rel: "noopener" } : {}) }, h("span", { class: "ico-img", html: icon(d.icon, 32) }), h("span", { class: "ico-l" }, d.label))
        : iconBtn(d, 32);
      if (!d.href) el.querySelector(".ico-l")!.textContent = d.short ?? d.label;
      pdock.append(el);
    });
    sheets = h("div", { class: "sheets" });
    root.append(wallC, status, home, pdock, foot, sheets, toasts);
    home.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(".ico");
      if (b && (e as MouseEvent).detail === 0) open(b.dataset.app!, b);
    });
    pdock.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("button.ico");
      if (b) open(b.dataset.app!, b);
    });
    // icons: tap opens, drag one onto the Trash for the gag, otherwise it springs home
    qsa<HTMLElement>(".ico", grid).forEach((b) => {
      const id = b.dataset.app!;
      Draggable.create(b, {
        type: "x,y", dragClickables: true, minimumMovement: 8, zIndexBoost: false,
        onPress() { b.style.zIndex = "5"; },
        onClick() { open(id, b); },
        onDragStart() { b.classList.add("lift"); },
        onDragEnd() {
          b.classList.remove("lift");
          b.style.zIndex = "";
          if (b !== trashIcon && trashIcon && this.hitTest(trashIcon, "30%")) {
            trashIt(b, defOf(id)!.short ?? defOf(id)!.label, () => gsap.fromTo(b, { x: 0, y: 0, scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" }));
          } else gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        },
      });
    });
    wall = wallpaper(wallC, () => [heroEl.querySelector(".hero-h")!, heroEl.querySelector(".hero-for")!, heroEl.querySelector(".hero-cta")!, heroEl.querySelector(".hero-tip")!, heroEl.querySelector(".hero-k")!].filter(Boolean).map((e) => (e as HTMLElement).getBoundingClientRect()));
    document.fonts?.ready.then(() => wall?.refresh());
    addEventListener("resize", () => { if (isPhone() !== (mode === "phone")) location.reload(); });
  }

  /* ---------------- screensaver (desktop, after 60 s idle) ---------------- */
  function screensaver() {
    let idle = 0, on = false, raf = 0;
    const box = h("div", { class: "saver", hidden: true, "aria-hidden": "true" });
    const logo = h("div", { class: "saver-logo" }, h("i", { class: "mark-mask" }), h("span", null, COMPANY.line));
    const hits = h("p", { class: "saver-hits" });
    box.append(logo, hits);
    document.body.append(box);
    let x = 80, y = 80, vx = 2.2, vy = 1.7, corners = 0;
    const stop = () => { if (!on) return; on = false; box.hidden = true; cancelAnimationFrame(raf); };
    const step = () => {
      const W = innerWidth - logo.offsetWidth, H = innerHeight - logo.offsetHeight;
      x += vx; y += vy;
      let hx = false, hy = false;
      if (x <= 0 || x >= W) { vx *= -1; x = Math.max(0, Math.min(W, x)); hx = true; }
      if (y <= 0 || y >= H) { vy *= -1; y = Math.max(0, Math.min(H, y)); hy = true; }
      if (hx && hy) { corners++; hits.textContent = `Corners hit: ${corners}`; sfx.win(); }
      if (hx || hy) logo.classList.toggle("alt");
      logo.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (on || reduced() || document.hidden || [...document.querySelectorAll("video")].some((v) => !v.paused && !v.muted)) return;
      on = true; box.hidden = false; raf = requestAnimationFrame(step);
    };
    const reset = () => { idle = 0; stop(); };
    ["pointermove", "pointerdown", "keydown", "wheel"].forEach((ev) => addEventListener(ev, reset, { passive: true }));
    setInterval(() => { idle += 5; if (idle >= 60) start(); }, 5000);
  }

  /* ---------------- dark world: the pointer leaves a phosphor trail ---------------- */
  function cursorTrail() {
    if (!matchMedia("(pointer: fine)").matches) return;
    const c = h("canvas", { class: "trail", "aria-hidden": "true" });
    document.body.append(c);
    const x = c.getContext("2d")!;
    const pts: { x: number; y: number; a: number }[] = [];
    let raf = 0;
    const size = () => { c.width = innerWidth; c.height = innerHeight; };
    size(); addEventListener("resize", size);
    const draw = () => {
      x.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        x.fillStyle = `rgba(255,176,56,${p.a * 0.5})`;
        x.fillRect(Math.round(p.x / 3) * 3, Math.round(p.y / 3) * 3, 3, 3);
        p.a -= 0.045;
      }
      while (pts.length && pts[0].a <= 0) pts.shift();
      raf = pts.length ? requestAnimationFrame(draw) : 0;
    };
    addEventListener("pointermove", (e) => {
      if (getTheme() !== "dark" || reduced() || e.pointerType !== "mouse") return;
      pts.push({ x: e.clientX, y: e.clientY, a: 1 });
      if (pts.length > 60) pts.shift();
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive: true });
  }

  if (mode === "desk") buildDesk(); else buildPhone();

  /* ---------------- start (after boot) ---------------- */
  function hashApp() {
    const k = location.hash.replace("#", "");
    return k ? defs.find((d) => d.hashes?.includes(k)) : undefined;
  }
  function start() {
    if (page !== "home") return;
    const fromHash = hashApp();
    if (fromHash) { open(fromHash.id); return; }
    if (mode === "desk" && innerWidth >= 1200) open("about", trashIcon && desk.querySelector('.ico[data-app="about"]'));
  }
  /** Product pages open their app right away, under the boot screen. */
  if (page !== "home") open(`${page}-page`, null, { max: true, instant: true, root: true });
  addEventListener("hashchange", () => { const d = hashApp(); if (d) open(d.id); });

  return { start, api };
}

function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
