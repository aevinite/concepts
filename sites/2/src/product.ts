// A product page in Tiny Town: the product gets its own little diorama (the restaurant, or the
// college with its bus loop) where every person who uses it stands; tap one to see their screen.
import "./fonts";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/product.css";
import * as THREE from "three";
import gsap from "gsap";
import { COMPANY, productById, type Film, type ProductId } from "@shared/content";
import { $, $$, boot, header, controls, footer, esc, reveals, splitWords, openFilm, openImage, bindPreviews, oneFilmAtATime, stations, syncLine, bindStations, isNarrow, isTouch, reduce, ICON } from "./core/ui";
import { play } from "./core/sound";
import { contactButtons } from "./content-blocks";
import { mountTown } from "./town/mount";
import type { Region } from "./town/stage";

export function productPage(id: ProductId) {
  boot();
  const p = productById(id);
  const slug = (w: string) => `screen-${w.toLowerCase()}`;
  const all: Film[] = [p.film, ...p.extraFilms];
  const byId = Object.fromEntries(all.map((f) => [f.id, f]));
  const place = id === "aevidine" ? "One restaurant, one system" : "The college, the loop road and the 7:10 bus";

  const hero = `
  <section class="phero prod--${p.color}" aria-labelledby="ph">
    <div class="stage phero__stage">
      <div class="sky" aria-hidden="true"><span class="sky__stars"></span><span class="sky__sun"></span><span class="sky__moon"></span></div>
      <canvas class="town" role="img" aria-label="A miniature 3D model of ${esc(p.name)} with everyone who uses it. Drag sideways to spin it; tap a person to see their screen."></canvas>
      <div class="pins" role="group" aria-label="People in the model">${p.screens.map((s) => `<button class="pin" type="button" data-who="${s.who}"><span class="pin__dot" aria-hidden="true"></span><span class="pin__t"><b>${esc(s.who)}</b></span></button>`).join("")}</div>
      <div class="stage__ui"><p class="hint"><span class="hint__icon" aria-hidden="true"><i></i></span><span>${isTouch() ? "Swipe sideways to spin. Tap a person." : "Drag to spin. Click a person to see their screen."}</span></p></div>
    </div>
    <div class="phero__text">
      <a class="back" href="../">${ICON.back}<span>Back to the town</span></a>
      <p class="kicker mono"><span class="kicker__dot" aria-hidden="true"></span>${esc(p.name)} · ${esc(p.kind)}</p>
      <h1 class="h1" id="ph">${esc(p.headline)}</h1>
      <p class="hero__lede">${esc(p.sub)}</p>
      <p class="status"><i aria-hidden="true"></i>${esc(p.status)}</p>
      <div class="hero__cta">
        <button class="btn" type="button" data-open="${p.film.id}">${ICON.play}<span>Watch the film · ${p.film.length}</span></button>
        <a class="btn btn--wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${ICON.wa}<span>Ask for a free demo</span></a>
      </div>
    </div>
  </section>`;

  const film = `
  <section class="pfilm prod--${p.color}" id="film" aria-labelledby="film-h">
    <header class="sec-head"><p class="mono">The film · ${p.film.length}</p><h2 class="h2" id="film-h">${esc(p.film.title)}</h2><p class="lede">${esc(p.film.description)}</p></header>
    <div class="pfilm__screen"><video controls playsinline preload="none" poster="${p.film.poster}" src="${p.film.src}"></video></div>
    ${stations(p.film, "line--big")}
    <p class="pfilm__hint mono">Every station is a chapter. Tap one and the film jumps there.</p>
  </section>`;

  const screens = `
  <section class="pscreens prod--${p.color}" id="screens" aria-labelledby="screens-h">
    <header class="sec-head"><p class="mono">${place}</p><h2 class="h2" id="screens-h">Everyone gets their own screen.</h2><p class="lede">${p.screens.length} people, ${p.screens.length} screens. They are the figures standing in the model above.</p></header>
    <ol class="who">${p.screens
      .map(
        (s, i) => `<li class="who__row rv" id="${slug(s.who)}">
        <button class="who__shot" type="button" data-img="${s.img}" data-alt="${esc(`${p.name}, the ${s.who.toLowerCase()} screen`)}" data-cap="${esc(`${s.who}. ${s.line}`)}" aria-label="Open the ${esc(s.who.toLowerCase())} screen larger"><img src="${s.img}" alt="${esc(`${p.name}, the ${s.who.toLowerCase()} screen`)}" width="1280" height="560" loading="lazy" decoding="async"></button>
        <div class="who__t"><span class="who__fig f${i % 6}" aria-hidden="true"><i></i></span><p class="mono">Figure ${String(i + 1).padStart(2, "0")}</p><h3>${esc(s.who)}</h3><p>${esc(s.line)}</p></div>
      </li>`,
      )
      .join("")}</ol>
  </section>`;

  const panels = `
  <section class="ppanels prod--${p.color}" aria-labelledby="panels-h">
    <header class="sec-head"><p class="mono">Instruction booklet</p><h2 class="h2" id="panels-h">How it fits together, panel by panel.</h2></header>
    <ol class="booklet">${p.panels.map((x, i) => `<li class="page rv" style="--i:${i}"><p class="page__no mono">Step ${String.fromCharCode(65 + i)} · ${esc(x.who)}</p><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join("")}</ol>
  </section>`;

  const features = `
  <section class="pparts prod--${p.color}" aria-labelledby="parts-h">
    <header class="sec-head"><p class="mono">Parts list</p><h2 class="h2" id="parts-h">What is in the box.</h2></header>
    <ol class="partlist">${p.features.map((f, i) => `<li class="rv" style="--i:${i}"><span class="mono">${String.fromCharCode(65 + Math.floor(i / 6))}-${String((i % 6) + 1).padStart(2, "0")}</span><span>${esc(f)}</span></li>`).join("")}</ol>
  </section>`;

  const extras = `
  <section class="pextra prod--${p.color}" aria-labelledby="extra-h">
    <header class="sec-head"><p class="mono">More films</p><h2 class="h2" id="extra-h">${p.extraFilms.length === 1 ? "One more film." : `${["", "One", "Two", "Three", "Four"][p.extraFilms.length]} more films.`}</h2></header>
    <ul class="reels">${p.extraFilms
      .map(
        (f) => `<li class="reel rv"><button class="reel__b" type="button" data-open="${f.id}"><span class="reel__img"><img src="${f.poster}" alt="" width="1280" height="720" loading="lazy" decoding="async"><span class="reel__play">${ICON.play}</span></span><span class="mono">${f.length}</span><span class="reel__title">${esc(f.title.replace(/^[^:]+:\s*/, "").replace(/^./, (c) => c.toUpperCase()))}</span><span class="reel__desc">${esc(f.description)}</span></button></li>`,
      )
      .join("")}</ul>
  </section>`;

  const faq = `
  <section class="pfaq prod--${p.color}" aria-labelledby="faq-h">
    <header class="sec-head"><p class="mono">Questions at the counter</p><h2 class="h2" id="faq-h">Asked and answered.</h2></header>
    <div class="faq">${p.faq.map((q) => `<details class="q"><summary><span>${esc(q.q)}</span><span class="q__i" aria-hidden="true"></span></summary><p>${esc(q.a)}</p></details>`).join("")}</div>
  </section>`;

  const cta = `
  <section class="contact pcta" id="contact" aria-labelledby="cta-h">
    <div class="po">
      <div class="po__text">
        <p class="mono">The post office</p>
        <h2 class="h2" id="cta-h">Want ${esc(p.name)} in your town?</h2>
        <p class="lede">Ask for a free demo and a quote. You talk to the people who build it, in ${COMPANY.city}.</p>
        ${contactButtons()}
      </div>
      <div class="po__art po__art--back">
        <a class="town-link" href="../"><span class="town-link__plate mono">Back to</span><span class="town-link__t">Tiny Town</span>${ICON.back}</a>
      </div>
    </div>
  </section>`;

  $("#app").innerHTML = header("../", id) + `<main id="main">${hero}${film}${screens}${panels}${features}${extras}${faq}${cta}</main>` + footer("../", id) + `<div class="toast" role="status" aria-live="polite"></div>`;
  controls();
  oneFilmAtATime();
  bindPreviews();
  $$<HTMLElement>(".sec-head .h2").forEach(splitWords);
  reveals();
  {
    let a = 29;
    const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    $(".sky__stars").style.boxShadow = Array.from({ length: 120 }, () => `${(r() * 100).toFixed(2)}vw ${(r() * 70).toFixed(2)}vh 0 ${r() > 0.85 ? 1 : 0}px rgba(255,244,214,${(0.35 + r() * 0.6).toFixed(2)})`).join(",");
  }

  // The inline film and its station line.
  const v = $<HTMLVideoElement>(".pfilm video");
  const line = $(".pfilm .line");
  if (line) {
    syncLine(line, v, p.film);
    bindStations(line, v);
  }
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const b = t.closest<HTMLElement>("[data-img]");
    if (b) openImage(b.dataset.img!, b.dataset.alt ?? "", b.dataset.cap ?? "");
    const f = t.closest<HTMLElement>("[data-open]");
    if (f) openFilm(byId[f.dataset.open!]);
  });
  // FAQ: one open at a time, with a little spring.
  $$<HTMLDetailsElement>(".q").forEach((d) =>
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      $$<HTMLDetailsElement>(".q").forEach((o) => o !== d && (o.open = false));
      if (!reduce) gsap.fromTo($("p", d), { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
      play("click");
    }),
  );

  const toastEl = $(".toast");
  let tt = 0;
  const toast = (m: string) => {
    toastEl.textContent = m;
    toastEl.classList.add("on");
    clearTimeout(tt);
    tt = window.setTimeout(() => toastEl.classList.remove("on"), 2600);
  };

  const goTo = (who: string) => {
    const row = document.getElementById(slug(who));
    if (!row) return;
    row.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    row.classList.remove("flash");
    void row.offsetWidth;
    row.classList.add("flash");
    play("pop");
  };

  /* ---------- the diorama */
  const stageEl = $(".phero__stage");
  mountTown(stageEl, $<HTMLCanvasElement>("canvas.town", stageEl), id === "aevidine" ? "aevidine" : "campus").then(({ stage, town }) => {
    const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
    const R = town.radius;
    const region = (): Region => (isNarrow() ? [0.02, 0.06, 0.98, 0.97] : [0.47, 0.1, 0.98, 0.94]);
    stage.director = () => ({ target: V(0, 0.7, id === "aevidine" ? 0.4 : 0), az: 0.0, pitch: 0.62, size: [R + 0.7, (R + 0.7) * 0.62 + 1.6], region: region() });
    stage.spinIdle = 0.06;
    const wp = (o: THREE.Object3D, y: number) => o.getWorldPosition(V()).add(V(0, y, 0));
    const anchors: Record<string, () => THREE.Vector3> = {};
    if (id === "aevidine") {
      const r = town.lots.get("restaurant")!;
      anchors.Guest = () => wp(r.points.table0, 0.9);
      anchors.Kitchen = () => wp(r.points.printer, 0.75);
      anchors.Waiter = () => wp(r.points.waiter, 0.85);
      anchors.Manager = () => wp(r.points.manager, 0.85);
      anchors.Owner = () => wp(r.points.owner, 0.75);
    } else {
      const lot = (k: Parameters<typeof town.lots.get>[0], y: number) => () => {
        const l = town.lots.get(k)!;
        return l.group.localToWorld(l.pin.clone()).add(V(0, y, 0));
      };
      anchors.Student = () => wp(town.lots.get("busstop")!.points.student, 0.7);
      anchors.Parent = lot("parent", 0);
      anchors.Driver = () => wp(town.bus!, 1.0);
      anchors.College = lot("college", -0.3);
      anchors.Agency = lot("agency", 0);
      anchors.Admin = lot("admin", 0);
    }
    const pins = $$<HTMLElement>(".pin", stageEl);
    stage.onFrame(() => {
      stageEl.classList.add("pins-on");
      // Project every person, then nudge labels apart so two never sit on top of each other.
      const placed: { el: HTMLElement; x: number; y: number; w: number; x0: number; left: boolean }[] = [];
      pins.forEach((el) => {
        const a = anchors[el.dataset.who!];
        const pr = a && stage.project(a());
        if (!pr) return void (el.style.visibility = "hidden");
        el.style.visibility = "";
        const w = el.offsetWidth || 90;
        const left = pr.x > stageEl.clientWidth * 0.72;
        placed.push({ el, x: pr.x, y: pr.y, w, x0: left ? pr.x - w + 16 : pr.x - 8, left });
      });
      placed.sort((p, q) => p.y - q.y);
      for (let pass = 0, moved = true; moved && pass < 8; pass++) {
        moved = false;
        for (let i = 0; i < placed.length; i++)
          for (let j = 0; j < placed.length; j++) {
            if (i === j) continue;
            const p = placed[i], q = placed[j];
            if (p.y >= q.y && p.x0 < q.x0 + q.w && q.x0 < p.x0 + p.w && p.y - q.y < 30) {
              p.y = q.y + 30;
              moved = true;
            }
          }
      }
      placed.forEach(({ el, x, y, left }) => {
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.classList.toggle("pin--l", left);
      });
    });
    pins.forEach((el) => el.addEventListener("click", () => goTo(el.dataset.who!)));
    const LOT_WHO: Record<string, string> = { parent: "Parent", college: "College", agency: "Agency", admin: "Admin" };
    stage.onPick = (lid) => {
      if (lid === "restaurant") {
        town.lots.get("restaurant")!.poke?.();
        toast("A new order: the KOT prints in the kitchen.");
      } else if (lid === "busstop") {
        play("horn");
        toast("Beep beep. The driver's phone is the live bus.");
      } else if (LOT_WHO[lid]) goTo(LOT_WHO[lid]);
    };
    stage.onHover = (lid) => town.setHover(lid);
    stage.snap();
    stage.kick();
    stageEl.classList.add("ready");
    // Once the restaurant has landed, its roof lifts off so you can see everyone inside.
    let roofOff = false;
    town.assemble(reduce).then(() => {
      stageEl.classList.add("built");
      if (id === "aevidine") setTimeout(() => ((roofOff = true), town.lift("restaurant")), reduce ? 0 : 500);
    });
    if (id === "aevidine") {
      const pick = stage.onPick;
      stage.onPick = (lid) => {
        if (lid === "restaurant" && !roofOff) {
          roofOff = true;
          town.lift("restaurant");
          return;
        }
        pick(lid);
      };
    }
  });
}
