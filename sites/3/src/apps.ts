// Every AevOS app. Each one is a section of the Aevinite site, rebuilt as a program:
// About = a text file, products = media players + photo viewers, Work = a folder, Services = a
// control panel, Process = an installer, Numbers = a system monitor, Contact = Mail.
import gsap from "gsap";
import { COMPANY, FOUNDERS, NUMBERS, PROCESS, SERVICES, WORK, PRODUCTS, FILM_CREDIT, media } from "@shared/content";
import { h, ext, reduced, clock } from "./dom";
import { icon, glyph } from "./icons";
import { filmPlayer } from "./film";
import { photoViewer, lensImage } from "./viewer";
import { ditherCanvas } from "./dither";
import { bugSweeper } from "./sweeper";
import { readerDoc, productDoc, rel, socialLinks, forWhomText } from "./views";
import { sfx } from "./sound";
import type { AppDef, AppCtx } from "./types";

type Product = (typeof PRODUCTS)[number];

/* ---------- About Aevinite.txt: a text editor that types itself ---------- */
export function typewriter(root: HTMLElement, cps = 1500) {
  if (reduced()) return;
  const nodes: [Text, string][] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode as Text;
    if (t.data.trim()) { nodes.push([t, t.data]); t.data = ""; }
  }
  const caret = h("span", { class: "caret", "aria-hidden": "true" });
  root.setAttribute("aria-busy", "true");
  let ni = 0, ci = 0, last = performance.now(), raf = 0, done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    nodes.forEach(([t, s]) => (t.data = s));
    root.removeAttribute("aria-busy");
    caret.remove();
    root.append(caret);
  };
  const step = (now: number) => {
    let n = Math.max(1, Math.round(((now - last) * cps) / 1000));
    last = now;
    while (n > 0 && ni < nodes.length) {
      const [t, s] = nodes[ni];
      const take = Math.min(n, s.length - ci);
      ci += take; n -= take;
      t.data = s.slice(0, ci);
      if (ci >= s.length) { ni++; ci = 0; }
    }
    const cur = nodes[Math.min(ni, nodes.length - 1)];
    if (cur) cur[0].after(caret);
    if (ni < nodes.length) raf = requestAnimationFrame(step);
    else finish();
  };
  raf = requestAnimationFrame(step);
  root.addEventListener("pointerdown", finish, { once: true });
  root.addEventListener("keydown", finish, { once: true });
}

function aboutApp(): HTMLElement {
  const text = h("div", { class: "ed-text" },
    h("p", { class: "ed-h1" }, h("span", { class: "md" }, "# "), COMPANY.line),
    h("p", null, `Aevinite makes websites, software and automation built around how your business really works. Made in-house in ${COMPANY.city} by the people you talk to.`),
    h("p", null, h("span", { class: "md" }, "> "), `For ${forWhomText()}.`),
    h("h3", null, h("span", { class: "md" }, "## "), "The name"),
    h("p", null, COMPANY.meaning),
    h("h3", null, h("span", { class: "md" }, "## "), "The story"),
    h("dl", { class: "ed-dates" },
      h("dt", null, COMPANY.foundedLabel), h("dd", null, `Founded in ${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}, as ${COMPANY.formerName}.`),
      h("dt", null, COMPANY.renamedLabel), h("dd", null, `Renamed ${COMPANY.name}. The beginning with no end.`)),
    h("h3", null, h("span", { class: "md" }, "## "), "The people"),
    FOUNDERS.map((f) => h("div", { class: "ed-person" },
      h("p", null, h("strong", null, f.name), ` · ${f.role}`),
      h("p", null, f.bio),
      h("p", { class: "ed-links" }, h("a", { href: f.linkedin, ...ext }, "LinkedIn"), "  ", h("a", { href: f.instagram, ...ext }, "Instagram")))),
    h("p", { class: "ed-sign" }, h("span", { class: "md" }, "-- "), `${COMPANY.name}, ${COMPANY.city}`));
  const chars = (COMPANY.meaning.length + COMPANY.line.length + FOUNDERS.reduce((a, f) => a + f.bio.length, 0) + 420);
  const root = h("div", { class: "ed" },
    h("div", { class: "ed-ruler", "aria-hidden": "true" }),
    text,
    h("div", { class: "ed-status" }, h("span", null, "About Aevinite.txt"), h("span", null, `${chars.toLocaleString("en-IN")} characters`), h("span", null, "UTF-8")));
  requestAnimationFrame(() => typewriter(text));
  return root;
}

/* ---------- Aevidine.app / Campus.app: media player (+ Screens viewer) ---------- */
function productApp(p: Product, ctx: AppCtx): HTMLElement {
  const fp = filmPlayer(p.film, { compact: true });
  ctx.onClose(() => fp.stop());
  const screensBtn = h("button", { type: "button", class: "btn" }, h("span", { html: icon("photo", 20) }), `Screens (${p.screens.length})`);
  screensBtn.addEventListener("click", () => ctx.os.open(`${p.id}-screens`, screensBtn));
  const root = h("div", { class: `pa tone-${p.id}` },
    h("header", { class: "pa-head" },
      h("span", { class: "pa-ico", html: icon(p.id, 40) }),
      h("div", null, h("p", { class: "pa-name" }, p.name), h("p", { class: "pa-kind" }, `${p.kind} · ${p.status}`)),
      h("a", { class: "btn btn-main pa-open", href: rel(ctx.os.page, p.id), "data-nav": p.id }, `Open the ${p.id === "aevidine" ? "Aevidine" : "Campus"} page`, h("span", { html: glyph("arrow", 12) }))),
    fp.el,
    h("p", { class: "pa-line" }, p.line),
    ctx.os.mode === "phone"
      ? h("div", { class: "pa-screens" }, h("h3", { class: "doc-h" }, "Every person's screen"), photoViewer(p.screens.map((s) => ({ ...s })), p.name))
      : h("div", { class: "pa-actions" }, screensBtn, h("span", { class: "pa-hint" }, "Press a chapter in the playlist to jump to that moment.")));
  return root;
}

function screensApp(p: Product): HTMLElement {
  return h("div", { class: `ps tone-${p.id}` }, photoViewer(p.screens.map((s) => ({ ...s })), p.name));
}

/* ---------- Work: a folder of projects ---------- */
function workApp(ctx: AppCtx): HTMLElement {
  const status = h("p", { class: "fb-status", "aria-live": "polite" }, `${WORK.length} items`);
  const grid = h("ul", { class: "fb-grid", role: "listbox", "aria-label": "Projects" },
    WORK.map((w) => h("li", { role: "none" }, h("button", { type: "button", role: "option", class: "fb-file", "data-id": w.id, "aria-label": `${w.title}, ${w.category}. Open` },
      h("span", { class: "fb-thumb" }, ditherCanvas(w.images[0], 220), "video" in w ? h("span", { class: "fb-badge", html: glyph("play", 10) }) : null),
      h("span", { class: "fb-name" }, w.title),
      h("span", { class: "fb-kind" }, w.category)))));
  let lastClick = 0, lastId = "";
  grid.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".fb-file");
    if (!b) return;
    const id = b.dataset.id!;
    const w = WORK.find((x) => x.id === id)!;
    grid.querySelectorAll(".fb-file").forEach((x) => x.classList.toggle("sel", x === b));
    b.setAttribute("aria-selected", "true");
    status.textContent = `${w.title} · ${w.category} · ${w.tech.join(", ")}`;
    const now = performance.now();
    const dbl = now - lastClick < 450 && lastId === id;
    lastClick = now; lastId = id;
    if (ctx.os.mode === "phone" || dbl || (e as PointerEvent).detail === 0) ctx.os.open(`work:${id}`, b);
    else sfx.click();
  });
  return h("div", { class: "fb" },
    h("div", { class: "fb-path" }, h("span", { html: icon("folder", 20) }), h("span", null, "Aevinite HD"), h("span", { class: "sep" }, "/"), h("b", null, "Work"),
      h("span", { class: "fb-tip" }, ctx.os.mode === "phone" ? "Tap a file to open it" : "Double-click a file to open it")),
    grid, status);
}

function previewApp(id: string, ctx: AppCtx): HTMLElement {
  const w = WORK.find((x) => x.id === id) ?? WORK[0];
  let main: HTMLElement;
  if ("video" in w) {
    const v = h("video", { class: "pw-video", src: w.video, poster: w.images[0], controls: true, playsinline: true, preload: "none", width: "1600", height: "900", "aria-label": `${w.title}, scroll demo` });
    ctx.onClose(() => v.pause());
    main = h("div", { class: "pw-stage" }, v);
  } else {
    const stage = h("div", { class: "pw-stage" }, lensImage(w.images[0], `${w.title}, screenshot 1`, 640, "16 / 9"));
    const th = w.images.length > 1 ? h("ol", { class: "pw-thumbs" }, w.images.map((src, i) => h("li", null, h("button", { type: "button", class: i === 0 ? "cur" : "", "aria-label": `Screenshot ${i + 1}`, onclick: (e: Event) => {
      stage.replaceChildren(lensImage(src, `${w.title}, screenshot ${i + 1}`, 640, "16 / 9"));
      (e.currentTarget as HTMLElement).parentElement!.parentElement!.querySelectorAll("button").forEach((b) => b.classList.toggle("cur", b === e.currentTarget));
    } }, ditherCanvas(src, 120))))) : null;
    main = h("div", null, stage, th);
  }
  const link = w.link
    ? w.link.startsWith("http")
      ? h("a", { class: "btn btn-main", href: w.link, ...ext }, `Visit ${w.title}`)
      : h("a", { class: "btn btn-main", href: rel(ctx.os.page, "aevidine") }, "See Aevidine")
    : null;
  return h("div", { class: "pw" }, main,
    h("div", { class: "pw-info" },
      h("p", { class: "kicker" }, w.category),
      h("h3", { class: "pw-title" }, w.title),
      h("p", null, w.desc),
      h("ul", { class: "chips", "aria-label": "Built with" }, w.tech.map((t) => h("li", null, t))),
      link));
}

/* ---------- Services: a Control Panel ---------- */
const SVC_ICONS = ["globe", "control", "gear", "cube", "cloud"];
function controlApp(ctx: AppCtx): HTMLElement {
  const pane = h("div", { class: "cp-pane", role: "tabpanel", id: "cp-pane" });
  const tabs = h("div", { class: "cp-list", role: "tablist", "aria-label": "Services", "aria-orientation": "vertical" },
    SERVICES.map((s, i) => h("button", { type: "button", role: "tab", class: "cp-tab", "data-i": String(i), "aria-controls": "cp-pane", "aria-selected": i === 0 ? "true" : "false", tabindex: i === 0 ? "0" : "-1" },
      h("span", { class: "cp-ico", html: icon(SVC_ICONS[i], 32) }),
      h("span", { class: "cp-t" }, s.title),
      h("span", { class: "cp-tag" }, s.tag))));
  const show = (i: number) => {
    const s = SERVICES[i];
    const sw = s.items.map((it) => {
      const b = h("button", { type: "button", role: "switch", class: "sw", "aria-checked": "false" }, h("span", { class: "sw-k", "aria-hidden": "true" }), h("span", { class: "sw-l" }, it));
      return b;
    });
    const ready = h("p", { class: "cp-ready", "aria-live": "polite" });
    const apply = h("button", { type: "button", class: "btn btn-main" }, "Talk to us about this");
    apply.addEventListener("click", () => {
      sessionStorage.setItem("aev3-mail-subject", `${s.title} for my business`);
      ctx.os.open("mail", apply);
    });
    const upd = () => {
      const on = sw.filter((b) => b.getAttribute("aria-checked") === "true").length;
      ready.textContent = on === sw.length ? `All ${sw.length} switched on. That is the whole ${s.title.toLowerCase()} package.` : on ? `${on} of ${sw.length} on.` : "Switch on what you need.";
    };
    sw.forEach((b) => b.addEventListener("click", () => {
      b.setAttribute("aria-checked", b.getAttribute("aria-checked") === "true" ? "false" : "true");
      sfx.click();
      upd();
    }));
    upd();
    pane.replaceChildren(
      h("div", { class: "cp-head" }, h("span", { html: icon(SVC_ICONS[i], 48) }), h("div", null, h("p", { class: "kicker" }, s.tag), h("h3", { class: "cp-title" }, s.title))),
      h("p", { class: "cp-desc" }, s.desc),
      h("fieldset", { class: "cp-sw" }, h("legend", null, "Includes"), sw),
      ready, apply);
    gsap.from(pane.children, { y: 8, opacity: 0, duration: 0.25, stagger: 0.04, ease: "power2.out" });
    tabs.querySelectorAll<HTMLElement>(".cp-tab").forEach((t, j) => { t.setAttribute("aria-selected", j === i ? "true" : "false"); t.tabIndex = j === i ? 0 : -1; });
  };
  tabs.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(".cp-tab");
    if (t) { sfx.click(); show(Number(t.dataset.i)); }
  });
  tabs.addEventListener("keydown", (e) => {
    const cur = Number((document.activeElement as HTMLElement)?.dataset?.i ?? 0);
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (cur + d + SERVICES.length) % SERVICES.length;
    show(n);
    tabs.querySelectorAll<HTMLElement>(".cp-tab")[n].focus();
  });
  show(0);
  return h("div", { class: "cp" }, h("p", { class: "cp-intro" }, `${SERVICES.length} things we build for you. Pick one.`), h("div", { class: "cp-split" }, tabs, pane));
}

/* ---------- Process: the Grow Installer ---------- */
function installerApp(ctx: AppCtx): HTMLElement {
  let step = -1; // -1 welcome, 0..3 steps, 4 done
  const side = h("ol", { class: "wiz-steps" }, PROCESS.map((p) => h("li", null, h("span", { class: "n" }, p.n), p.title)));
  const main = h("div", { class: "wiz-main", "aria-live": "polite" });
  const back = h("button", { type: "button", class: "btn" }, "Back");
  const next = h("button", { type: "button", class: "btn btn-main" }, "Next");
  const bar = h("div", { class: "wiz-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "4", "aria-label": "Installer progress" }, h("i"), h("i"), h("i"), h("i"));
  let busy = false;
  const render = () => {
    side.querySelectorAll("li").forEach((li, i) => { li.classList.toggle("cur", i === step); li.classList.toggle("done", i < step); });
    bar.querySelectorAll("i").forEach((s, i) => s.classList.toggle("on", i < Math.max(0, step + (step >= 0 && step < 4 ? 1 : 0)) || step === 4));
    bar.setAttribute("aria-valuenow", String(Math.max(0, Math.min(4, step + 1))));
    back.disabled = step <= -1;
    next.textContent = step === -1 ? "Start" : step < 3 ? "Next" : step === 3 ? "Finish" : "Run again";
    if (step === -1) {
      main.replaceChildren(h("p", { class: "kicker" }, "Welcome"), h("h3", { class: "wiz-h" }, "Grow Installer"),
        h("p", null, "This sets your business up to grow, in the four steps we follow on every project."),
        h("p", { class: "wiz-small" }, "Press Start. You can go back at any step."));
    } else if (step < 4) {
      const p = PROCESS[step];
      main.replaceChildren(h("p", { class: "kicker" }, `Step ${step + 1} of ${PROCESS.length}`), h("h3", { class: "wiz-h" }, p.title), h("p", null, p.desc));
    } else {
      main.replaceChildren(h("p", { class: "kicker" }, "Complete"), h("h3", { class: "wiz-h" }, "Ready to grow."),
        h("p", null, `Identify, improve, automate, scale. That is the whole install. The next step is a conversation.`),
        h("button", { type: "button", class: "btn", onclick: (e: Event) => ctx.os.open("mail", e.currentTarget as Element) }, "Talk to us"));
    }
    gsap.from(main.children, { x: 10, opacity: 0, duration: 0.28, stagger: 0.05, ease: "power2.out" });
  };
  const run = (to: number) => {
    if (busy) return;
    if (to > step && step >= -1 && to <= 4 && !reduced()) {
      busy = true;
      const load = h("div", { class: "wiz-load" }, h("span", null, to === 4 ? "Finishing" : `Installing ${PROCESS[Math.min(3, to)].title}`), h("div", { class: "wiz-lbar" }, h("i")));
      main.replaceChildren(load);
      sfx.tick();
      gsap.fromTo(load.querySelector("i"), { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "steps(9)", onComplete: () => { busy = false; step = to; render(); sfx.click(); } });
    } else { step = to; render(); }
  };
  next.addEventListener("click", () => run(step === 4 ? -1 : step + 1));
  back.addEventListener("click", () => { if (step > -1) { step--; render(); } });
  render();
  return h("div", { class: "wiz" },
    h("aside", { class: "wiz-side" }, h("span", { class: "wiz-disk", html: icon("installer", 64) }), side),
    h("div", { class: "wiz-right" }, main, bar, h("div", { class: "wiz-btns" }, back, next)));
}

/* ---------- Numbers: System Monitor (our 4 numbers + live graphs that measure YOU) ---------- */
function odometer(value: number) {
  const digits = String(value).split("");
  const el = h("span", { class: "odo", "aria-label": String(value), role: "img" },
    digits.map(() => h("span", { class: "odo-d", "aria-hidden": "true" }, h("span", { class: "odo-s" }, "0123456789".split("").map((d) => h("span", null, d))))));
  const roll = () => {
    el.querySelectorAll<HTMLElement>(".odo-s").forEach((s, i) => {
      gsap.fromTo(s, { yPercent: 0 }, { yPercent: -Number(digits[i]) * 10, duration: reduced() ? 0 : 1.2 + i * 0.25, ease: "power3.out", delay: 0.15 });
    });
  };
  return { el, roll };
}

function monitorApp(ctx: AppCtx): HTMLElement {
  const odos = NUMBERS.map((n) => ({ n, o: odometer(n.value) }));
  const counters = h("ul", { class: "mon-n" }, odos.map(({ n, o }) => h("li", null, o.el, h("span", { class: "mon-l" }, n.label))));
  setTimeout(() => odos.forEach(({ o }) => o.roll()), 120);

  const graphs = [
    { k: "ptr", label: ctx.os.mode === "phone" ? "Your finger" : "Your pointer", unit: "px/s" },
    { k: "fps", label: "Frames per second", unit: "fps" },
    { k: "win", label: "Windows open", unit: "" },
  ].map((g) => {
    const c = h("canvas", { class: "mon-g", width: "240", height: "56", "aria-hidden": "true" });
    const v = h("output", { class: "mon-v" }, "0");
    return { ...g, c, v, data: [] as number[], el: h("li", null, h("div", { class: "mon-gh" }, h("span", null, g.label), v), c) };
  });
  const uptime = h("output", { class: "mon-v" }, "0:00");
  const t0 = performance.now();
  let lx = 0, ly = 0, dist = 0, frames = 0, lastT = performance.now(), raf = 0, alive = true;
  const mv = (e: PointerEvent) => { if (lx) dist += Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; };
  addEventListener("pointermove", mv, { passive: true });
  const ink = () => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#171614";
  const sample = () => {
    const now = performance.now();
    const dt = (now - lastT) / 1000;
    lastT = now;
    const vals: Record<string, number> = { ptr: Math.round(dist / dt), fps: Math.round(frames / dt), win: ctx.os.openCount() };
    dist = 0; frames = 0;
    const col = ink();
    graphs.forEach((g) => {
      g.data.push(vals[g.k]);
      if (g.data.length > 40) g.data.shift();
      g.v.textContent = `${vals[g.k]}${g.unit ? ` ${g.unit}` : ""}`;
      if (g.c.clientWidth && g.c.width !== Math.round(g.c.clientWidth / 2)) { g.c.width = Math.round(g.c.clientWidth / 2); g.c.height = 28; }
      const x = g.c.getContext("2d")!;
      const W = g.c.width, H = g.c.height;
      x.clearRect(0, 0, W, H);
      x.fillStyle = col;
      const max = Math.max(g.k === "fps" ? 60 : g.k === "win" ? 6 : 1500, ...g.data);
      const bw = Math.max(3, W / 40);
      g.data.forEach((d, i) => {
        const bh = Math.max(1, Math.round((d / max) * (H - 4)));
        const xx = Math.round(W - (g.data.length - i) * bw);
        // dithered bars: every other pixel row, 1-bit style
        for (let yy = H - bh; yy < H; yy++) for (let xq = xx; xq < xx + Math.ceil(bw) - 1; xq++) if ((xq + yy) % 2 === 0) x.fillRect(xq, yy, 1, 1);
        x.fillRect(xx, H - bh, Math.ceil(bw) - 1, 1);
      });
    });
    uptime.textContent = clock((now - t0) / 1000);
  };
  const tick = () => { if (!alive) return; frames++; raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const iv = window.setInterval(() => { if (!document.hidden) sample(); }, 500);
  ctx.onClose(() => { alive = false; cancelAnimationFrame(raf); clearInterval(iv); removeEventListener("pointermove", mv); });

  return h("div", { class: "mon" },
    h("section", { "aria-label": "Aevinite in numbers" }, h("p", { class: "mon-h" }, "Aevinite"), counters),
    h("section", { "aria-label": "This page, live" }, h("p", { class: "mon-h" }, "This page, live on your device"),
      h("ul", { class: "mon-graphs" }, graphs.map((g) => g.el), h("li", { class: "mon-up" }, h("div", { class: "mon-gh" }, h("span", null, "Time here"), uptime)))),
    h("p", { class: "mon-note" }, "The four numbers are ours and they are real. The graphs measure this page while you use it, nothing else."));
}

/* ---------- Mail: Contact. Nothing is sent from here; Send opens your own app. ---------- */
function mailApp(ctx: AppCtx): HTMLElement {
  const subject = h("input", { class: "mail-in", id: "mail-subj", value: sessionStorage.getItem("aev3-mail-subject") ?? "A project for my business", "aria-label": "Subject" });
  sessionStorage.removeItem("aev3-mail-subject");
  const body = h("textarea", { class: "mail-body", rows: "6", "aria-label": "Message" });
  body.value = "Hi Aevinite, I'd like to talk about a project.\n\n";
  const choose = h("div", { class: "mail-choose", hidden: true },
    h("span", null, "Send with"),
    h("a", { class: "btn btn-main", href: COMPANY.whatsapp, ...ext, "data-k": "wa" }, h("span", { html: icon("chat", 20) }), "WhatsApp"),
    h("a", { class: "btn", href: `mailto:${COMPANY.email}`, "data-k": "mail" }, h("span", { html: icon("mail", 20) }), "Email"));
  const sync = () => {
    const msg = `${subject.value}\n\n${body.value.trim()}`;
    choose.querySelector<HTMLAnchorElement>('[data-k="wa"]')!.href = `https://wa.me/919099723703?text=${encodeURIComponent(msg)}`;
    choose.querySelector<HTMLAnchorElement>('[data-k="mail"]')!.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(body.value)}`;
  };
  subject.addEventListener("input", sync); body.addEventListener("input", sync); sync();
  const send = h("button", { type: "button", class: "btn btn-main mail-send", "aria-expanded": "false" }, "Send", h("span", { html: glyph("down", 12) }));
  send.addEventListener("click", () => {
    choose.hidden = !choose.hidden;
    send.setAttribute("aria-expanded", String(!choose.hidden));
    if (!choose.hidden) gsap.from(choose.children, { y: -6, opacity: 0, stagger: 0.05, duration: 0.2 });
    sfx.click();
  });
  void ctx;
  return h("div", { class: "mail" },
    h("div", { class: "mail-compose" },
      h("div", { class: "mail-row" }, h("span", { class: "mail-k" }, "To"), h("span", { class: "mail-to" }, `${FOUNDERS[0].name} <${COMPANY.email}>`)),
      h("label", { class: "mail-row", for: "mail-subj" }, h("span", { class: "mail-k" }, "Subject"), subject),
      body,
      h("div", { class: "mail-acts" }, send, choose),
      h("p", { class: "mail-note" }, "Nothing is sent from this page. Send opens your own WhatsApp or mail app with this message in it.")),
    h("aside", { class: "mail-side" },
      h("p", { class: "mon-h" }, "Or reach us directly"),
      h("ul", { class: "mail-direct" },
        h("li", null, h("span", null, "WhatsApp"), h("a", { href: COMPANY.whatsapp, ...ext }, COMPANY.phoneDisplay)),
        h("li", null, h("span", null, "Call"), h("a", { href: COMPANY.phoneHref }, COMPANY.phoneDisplay)),
        h("li", null, h("span", null, "Email"), h("a", { href: `mailto:${COMPANY.email}` }, COMPANY.email)),
        h("li", null, h("span", null, "Studio"), h("span", null, `${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}`))),
      h("p", { class: "mon-h" }, "Follow"), socialLinks()));
}

/* ---------- Trash ---------- */
function trashApp(ctx: AppCtx): HTMLElement {
  const list = h("ul", { class: "tr-list" });
  const paint = () => {
    const items = ctx.os.trash.items;
    list.replaceChildren(...(items.length ? items.map((t) => h("li", null, h("span", { html: icon("doc", 20) }), t)) : [h("li", { class: "tr-empty" }, "The Trash is empty.")]));
  };
  ctx.os.trash.onChange(paint);
  paint();
  return h("div", { class: "tr" },
    h("span", { class: "tr-ico", html: icon("trash", 64) }),
    h("p", { class: "tr-big" }, "Nothing is ever really deleted."),
    h("p", null, "Aevinite comes from Aevum: a beginning with no end. Drag any icon in here and watch it come back."),
    list,
    h("button", { type: "button", class: "btn", onclick: () => ctx.os.trash.restoreAll() }, "Put everything back"));
}

/* ---------- About AevOS (the Aevinite menu) ---------- */
function aboutOsApp(): HTMLElement {
  const logo = ditherCanvas(media("logo-transparent.png"), 220, "Aevinite logo");
  return h("div", { class: "ao" }, h("div", { class: "ao-logo" }, logo),
    h("p", { class: "ao-name" }, "AevOS"),
    h("p", null, "Aevinite, as an operating system. Version 1.0."),
    h("p", null, COMPANY.pitch),
    socialLinks(),
    h("p", { class: "credit" }, FILM_CREDIT),
    h("p", { class: "copy" }, `© 2026 ${COMPANY.name}, ${COMPANY.city}.`));
}

/* ---------- registry ---------- */
const [AEV, CAM] = PRODUCTS;
export function apps(page: "home" | "aevidine" | "campus"): AppDef[] {
  const list: AppDef[] = [
    { id: "about", title: "About Aevinite.txt", label: "About Aevinite.txt", short: "About", icon: "doc", w: 520, h: 600, desktop: true, phone: true, hashes: ["about"], build: () => aboutApp() },
    { id: "aevidine", title: "Aevidine.app", label: "Aevidine.app", short: "Aevidine", icon: "aevidine", w: 820, h: 700, desktop: true, phone: true, dock: true, companion: "aevidine-screens", hashes: ["aevidine"], build: (c) => productApp(AEV, c) },
    { id: "campus", title: "Campus.app", label: "Campus.app", short: "Campus", icon: "campus", w: 820, h: 700, desktop: true, phone: true, dock: true, companion: "campus-screens", hashes: ["campus"], build: (c) => productApp(CAM, c) },
    { id: "aevidine-screens", title: "Aevidine Screens", label: "Aevidine Screens", icon: "photo", w: 640, h: 620, build: () => screensApp(AEV) },
    { id: "campus-screens", title: "Campus Screens", label: "Campus Screens", icon: "photo", w: 640, h: 620, build: () => screensApp(CAM) },
    { id: "work", title: "Work", label: "Work", icon: "folder", w: 680, h: 470, desktop: true, phone: true, dock: true, hashes: ["work"], build: (c) => workApp(c) },
    { id: "control", title: "Control Panel: Services", label: "Services", icon: "control", w: 760, h: 520, desktop: true, phone: true, hashes: ["services"], build: (c) => controlApp(c) },
    { id: "installer", title: "Grow Installer: Process", label: "Process", icon: "installer", w: 680, h: 420, desktop: true, phone: true, hashes: ["process"], build: (c) => installerApp(c) },
    { id: "monitor", title: "System Monitor: Numbers", label: "Numbers", icon: "monitor", w: 640, h: 540, desktop: true, phone: true, hashes: ["numbers"], build: (c) => monitorApp(c) },
    { id: "mail", title: "Mail: New message", label: "Mail", icon: "mail", w: 760, h: 500, desktop: true, phone: false, dock: true, hashes: ["contact", "mail"], build: (c) => mailApp(c) },
    { id: "sweeper", title: "Bug Sweeper", label: "Bug Sweeper", short: "Sweeper", icon: "bug", w: 372, h: 540, desktop: true, phone: true, dock: true, noResize: true, hashes: ["sweeper"], build: (c) => { const g = bugSweeper(); c.onClose(g.destroy); return g.el; } },
    { id: "reader", title: "Read Me: Aevinite as a normal page", label: "Read Me", short: "Read Me", icon: "reader", w: 880, h: 700, desktop: true, phone: false, dock: true, hashes: ["reader", "read"], build: () => readerDoc(page) },
    { id: "trash", title: "Trash", label: "Trash", icon: "trash", w: 420, h: 440, phone: true, hashes: ["trash"], build: (c) => trashApp(c) },
    { id: "aboutos", title: "About AevOS", label: "About AevOS", icon: "doc", w: 420, h: 520, noResize: true, build: () => aboutOsApp() },
    // phone dock shortcuts that are plain links
    { id: "call", title: "Call", label: "Call", icon: "phone", w: 0, h: 0, href: COMPANY.phoneHref, build: () => h("div") },
    { id: "whatsapp", title: "WhatsApp", label: "WhatsApp", icon: "chat", w: 0, h: 0, href: COMPANY.whatsapp, build: () => h("div") },
  ];
  if (page !== "home") {
    const p = page === "aevidine" ? AEV : CAM;
    list.push({ id: `${p.id}-page`, title: `${p.name}.app`, label: `${p.name}`, icon: p.id, w: 1100, h: 760, build: () => productDoc(p, page) });
  }
  return list;
}

export function previewDef(id: string): AppDef {
  const w = WORK.find((x) => x.id === id) ?? WORK[0];
  return { id: `work:${w.id}`, title: `${w.title}: Preview`, label: w.title, icon: "photo", w: 760, h: 600, build: (c) => previewApp(w.id, c) };
}

