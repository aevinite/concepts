import "./fonts";
import "./style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COMPANY, FOUNDERS, FOR_WHOM, NUMBERS, PRODUCTS, PROCESS, SERVICES, WORK } from "@shared/content";
import { initTheme, getTheme, onTheme, prefersReducedMotion } from "@shared/theme";
import { conceptBadge } from "@shared/badge";
import { bath, PIGMENTS, type PigmentId } from "./bath";
import { Tray } from "./tray";
import { plip, chord } from "./sound";
import { header, bindHeader, footer, filmHTML, bindFilms, screensHTML, bindScreens, sheets, toolsHTML, bindTools, w, words, countUp, rotator, remeasure } from "./ui";
import { workDialog, eggs } from "./extras";

initTheme(8);

const SVC_PIG: PigmentId[] = ["indigo", "terracotta", "sap", "saffron", "deep"];
const STEP_EBRU = [
  ["Prepare the bath", "The size is poured and left until it is perfectly still. Nothing is drawn before you know the water.", "Still water", "Before anything glows, we watch where the water is calm and where it is stuck."],
  ["Sprinkle the colours", "One drop at a time. Each new drop pushes the last into a ring, so every colour finds its place.", "First light", "One spark wakes the next. Small fixes, placed where they light up the most."],
  ["Comb the pattern", "One pull of the comb moves every colour at once. The hand does it once; the pattern repeats itself.", "The current", "Let the current carry it. One motion, and every light moves together."],
  ["Lift the print", "Lay the paper, lift it, and the pattern is yours. Then the bath is ready for the next one.", "The whole bay", "The glow spreads without anyone pushing it. Growth that keeps its own light."],
];

const sideBySide = PRODUCTS.map((p, i) => `
  <article class="sheet print-host product product-${p.id}" id="${p.id}-print">
    <div class="paper">
      <div class="product-top">
        <div class="product-text">
          <p class="eyebrow"><span class="plate">${w(`Print ${String(i + 1).padStart(2, "0")}`, `Light ${String(i + 1).padStart(2, "0")}`)}</span> ${p.kind}</p>
          <h3 class="product-name" data-rise>${words(p.name)}</h3>
          <p class="product-head">${p.headline}</p>
          <p class="product-line">${p.line}</p>
          <p class="status"><span class="dot" aria-hidden="true"></span>${p.status}</p>
          <a class="btn btn-ink" href="${p.href}">Open ${p.name}</a>
        </div>
        ${filmHTML(p.film, { big: true })}
      </div>
      <div class="product-screens">
        <p class="eyebrow">${w("Every person gets their own screen", "One screen for every person")}</p>
        ${screensHTML(p.id, p.screens, p.name)}
      </div>
    </div>
  </article>`).join("");

const jars = SERVICES.map((s, i) => `
  <button type="button" class="jar" role="tab" aria-selected="${i === 0}" aria-controls="svc-card" data-i="${i}" style="--pl:${PIGMENTS[SVC_PIG[i]].light};--pd:${PIGMENTS[SVC_PIG[i]].dark}">
    <svg class="jar-pot" viewBox="0 0 64 84" aria-hidden="true">
      <path d="M14 22c-6 6-8 16-8 28 0 18 10 30 26 30s26-12 26-30c0-12-2-22-8-28" fill="#efe5d1" stroke="#3b342a" stroke-width="1.6"/>
      <path d="M12 22h40" stroke="#3b342a" stroke-width="1.6"/>
      <ellipse cx="32" cy="18" rx="22" ry="6" fill="#f7f0e2" stroke="#3b342a" stroke-width="1.6"/>
      <ellipse class="jar-ink" cx="32" cy="19" rx="18" ry="4.2" fill="var(--pl)"/>
      <path d="M10 44c8 3 36 3 44 0" fill="none" stroke="var(--pl)" stroke-width="6" opacity=".9"/>
      <text x="32" y="66" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="15" font-style="italic" fill="#3b342a">${i + 1}</text>
    </svg>
    <svg class="jar-jelly" viewBox="0 0 64 84" aria-hidden="true">
      <path class="bell" d="M8 34C8 16 19 6 32 6s24 10 24 28c-5-3-9-3-12 0-3-3-9-3-12 0-3-3-9-3-12 0-3-3-7-3-12 0z" fill="var(--pd)" fill-opacity=".22" stroke="var(--pd)" stroke-width="1.6"/>
      <path class="ten t1" d="M16 36c-3 10 4 16 0 26s3 14 0 20" stroke="var(--pd)"/>
      <path class="ten t2" d="M26 36c3 10-4 16 0 26s-3 12 0 18" stroke="var(--pd)"/>
      <path class="ten t3" d="M38 36c-3 10 4 16 0 26s3 12 0 18" stroke="var(--pd)"/>
      <path class="ten t4" d="M48 36c3 10-4 16 0 26s-3 14 0 20" stroke="var(--pd)"/>
      <circle cx="32" cy="20" r="4" fill="var(--pd)" opacity=".8"/>
    </svg>
    <span class="jar-name">${s.title}</span>
  </button>`).join("");

const steps = PROCESS.map((p, i) => `
  <li class="step" data-i="${i}">
    <p class="step-n">${p.n}</p>
    <div>
      <h3 class="step-t">${p.title}</h3>
      <p class="step-d">${p.desc}</p>
      <p class="step-e"><b>${w(STEP_EBRU[i][0], STEP_EBRU[i][2])}</b> ${w(STEP_EBRU[i][1], STEP_EBRU[i][3])}</p>
    </div>
  </li>`).join("");

const hangs = WORK.map((p, i) => `
  <div class="hang" role="listitem" style="--d:${(i * 0.37) % 1.3}s">
    <span class="peg" aria-hidden="true"></span>
    <button type="button" class="hang-card" data-work="${p.id}" aria-haspopup="dialog">
      <span class="hang-img">${"video" in p ? `<video muted loop playsinline preload="none" poster="${p.images[0]}" data-src="${p.video}" aria-hidden="true" width="1600" height="900"></video>` : `<img src="${p.images[0]}" alt="" width="1600" height="900" loading="lazy" decoding="async">`}</span>
      <span class="hang-meta"><span class="hang-cat">${p.category}</span><span class="hang-t">${p.title}</span><span class="hang-open">${w("Open the print", "Bring it up")}</span></span>
    </button>
  </div>`).join("");

const nums = NUMBERS.map((n, i) => `
  <li>
    <button type="button" class="num" data-v="${n.value}" data-count="${n.count}" data-pig="${["indigo", "gold", "terracotta", "sap"][i]}" style="--pl:${PIGMENTS[(["indigo", "gold", "terracotta", "sap"] as PigmentId[])[i]].light};--pd:${PIGMENTS[(["indigo", "gold", "terracotta", "sap"] as PigmentId[])[i]].dark}">
      <span class="ping" aria-hidden="true"></span>
      <span class="ed" aria-hidden="true">${i + 1} / ${NUMBERS.length}</span>
      <span class="nv">${n.count ? 0 : n.value}</span>
      <span class="nl">${n.label}</span>
    </button>
  </li>`).join("");

const app = document.getElementById("app")!;
app.innerHTML = `
${header("", "home")}
<main id="main">
  <section class="hero" id="top" data-bath>
    <div class="hero-in">
      <p class="kicker" data-solid>${w("Aevinite · a software studio in Ahmedabad", "Aevinite · Ahmedabad, after dark")}</p>
      <h1 class="h1" data-obstacle><span class="sr-only">Aevinite. </span>${words("We help businesses")} <em>${words("grow.")}</em></h1>
      <div class="label" data-solid>
        <p class="for">Websites, custom software and automation for <span class="rot-wrap"><span class="rot">${FOR_WHOM[0]}</span></span></p>
        <p class="pitch">${COMPANY.pitch}</p>
        <div class="cta-row">
          <a class="btn btn-ink" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">Talk to us on WhatsApp</a>
          <a class="btn" href="#products">See what we make</a>
        </div>
      </div>
    </div>
    <div class="hero-play">
      ${toolsHTML([{ id: "indigo", label: "Aevinite" }, { id: "gold", label: "Aevidine" }, { id: "amber", label: "Campus" }])}
      <p class="hint" data-solid><span class="h-mouse">${w("Move to push the ink. Hold and drag to paint. Click to drop pigment. Scroll to comb.", "Move and the sea lights up. Hold and drag to paint light. Click to drop a glow. Scroll to leave a wake.")}</span><span class="h-touch">${w("Swipe sideways to paint, tap to drop pigment, or press Paint.", "Swipe sideways to paint light, tap for a glow, or press Paint.")}</span></p>
    </div>
  </section>

  <section class="products" id="products" aria-labelledby="products-h">
    <div class="sec-label" data-solid>
      <p class="eyebrow">${w("Two prints from our own bath", "Two lights of our own")}</p>
      <h2 id="products-h" data-rise>${words("Products we built, and run.")}</h2>
    </div>
    ${sideBySide}
  </section>

  <section class="services" id="services" aria-labelledby="services-h">
    <div class="sec-label" data-solid>
      <p class="eyebrow">${w("Services · five pigments", "Services · five lights in the water")}</p>
      <h2 id="services-h" data-rise>${words("What we make for you.")}</h2>
    </div>
    <div class="svc">
      <div class="pool" data-bath>
        <div class="jars" role="tablist" aria-label="Five services">${jars}</div>
        <p class="pool-hint" data-solid>${w("Tap a jar: its colour drops into the bath and its service is printed.", "Tap a jellyfish: it lets its light into the sea and tells you what it does.")}</p>
      </div>
      <article class="svc-card" id="svc-card" role="tabpanel" aria-live="polite" data-solid>
        <span class="svc-swatch" aria-hidden="true"></span>
        <p class="svc-n">01 / 05</p>
        <h3 class="svc-t">${SERVICES[0].title}</h3>
        <p class="svc-tag">${SERVICES[0].tag}</p>
        <p class="svc-d">${SERVICES[0].desc}</p>
        <ul class="svc-i">${SERVICES[0].items.map((x) => `<li>${x}</li>`).join("")}</ul>
      </article>
    </div>
    <details class="svc-all" data-solid>
      <summary>${w("Just show me all five", "Just show me all five")}</summary>
      <ol>${SERVICES.map((s) => `<li><h3>${s.title} <span>${s.tag}</span></h3><p>${s.desc}</p><p class="svc-all-i">${s.items.join(" · ")}</p></li>`).join("")}</ol>
    </details>
  </section>

  <section class="sheet print-host process" id="process" aria-labelledby="process-h">
    <div class="paper">
      <p class="eyebrow">${w("Process · how a print is made", "Process · how the bay lights up")}</p>
      <h2 id="process-h" data-rise>${words("Four steps, the way a marbler works.")}</h2>
      <div class="proc">
        <div class="proc-stage"><div class="tray-wrap" data-solid><canvas class="tray" aria-hidden="true"></canvas><p class="tray-cap"><span class="tray-n">01</span> <span class="tray-l">Identify</span></p></div></div>
        <ol class="proc-steps">${steps}</ol>
      </div>
    </div>
  </section>

  <section class="sheet print-host work" id="work" aria-labelledby="work-h">
    <div class="paper">
      <div class="work-head">
        <div>
          <p class="eyebrow">${w("Work · hung up to dry", "Work · lights on the line")}</p>
          <h2 id="work-h" data-rise>${words("Things we have made.")}</h2>
        </div>
        <p class="work-sub">${w("Drag the line, or scroll it sideways. Tap a print to see it properly.", "Drag the line, or scroll it sideways. Tap one to bring it up.")}</p>
      </div>
      <div class="line-wrap">
        <svg class="rope" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8 Q500 34 1000 8" fill="none"/></svg>
        <div class="line" role="list" aria-label="Projects" tabindex="0">${hangs}</div>
      </div>
    </div>
  </section>

  <section class="numbers" id="numbers" aria-labelledby="numbers-h" data-bath>
    <div class="sec-label" data-solid>
      <p class="eyebrow">${w("Numbers · signed in pencil", "Numbers · soundings")}</p>
      <h2 id="numbers-h" data-rise>${words("Small, and honest.")}</h2>
    </div>
    <ul class="nums">${nums}</ul>
  </section>

  <section class="sheet print-host about" id="about" aria-labelledby="about-h">
    <div class="paper">
      <p class="eyebrow">About · ${COMPANY.city}, ${COMPANY.region}</p>
      <h2 id="about-h" data-rise>${words("The beginning with no end.")}</h2>
      <div class="about-grid">
        <div class="name">
          <div class="inf-box">
            <svg class="inf" viewBox="0 0 440 220" role="img" aria-label="An infinity loop you can trace">
              <path class="inf-base" d="M220 110 C 270 40, 400 40, 400 110 S 270 180, 220 110 S 40 40, 40 110 S 170 180, 220 110 Z"/>
              <path class="inf-trail" d="M220 110 C 270 40, 400 40, 400 110 S 270 180, 220 110 S 40 40, 40 110 S 170 180, 220 110 Z"/>
              <circle class="inf-bead" cx="220" cy="110" r="13"/>
            </svg>
            <p class="inf-hint">${w("Drag the drop around the loop. It never finds the end.", "Drag the light around the loop. It never finds the end.")} <span class="inf-count" aria-live="polite"></span></p>
          </div>
          <p class="meaning">${COMPANY.meaning}</p>
        </div>
        <div class="story">
          <ol class="time">
            <li><span class="tdate">${COMPANY.foundedLabel}</span><span>Founded in ${COMPANY.city} as <b>${COMPANY.formerName}</b>.</span></li>
            <li><span class="tdate">${COMPANY.renamedLabel}</span><span>Renamed <b>Aevinite</b>.</span></li>
            <li><span class="tdate">Today</span><span>Websites, software and automation, made in-house in ${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}.</span></li>
          </ol>
          <div class="founders">
            ${FOUNDERS.map((f) => `<article class="founder">
              <p class="f-sig" aria-hidden="true">${f.name.split(" ")[0]}</p>
              <h3>${f.name}</h3><p class="f-role">${f.role}</p>
              <p class="f-bio">${f.bio}</p>
              <p class="f-links"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p>
            </article>`).join("")}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="contact" id="contact" aria-labelledby="contact-h">
    <div class="sheet print-host contact-card">
      <div class="paper">
        <p class="eyebrow">Contact</p>
        <h2 id="contact-h" data-rise>${words(getTheme() === "dark" ? "Send a signal." : "Drop us a line.")}</h2>
        <p class="contact-sub">Tell us how your business runs today. You talk to the people who will build it, in ${COMPANY.city}.</p>
        <a class="wa" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">
          <span class="wa-drop" aria-hidden="true"></span>
          <span class="wa-t">Message us on WhatsApp<small>${COMPANY.phoneDisplay}</small></span>
        </a>
        <ul class="contact-list">
          <li><span>Email</span><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
          <li><span>Phone</span><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></li>
          <li><span>Studio</span><b>${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}</b></li>
        </ul>
        <p class="socials"><a href="${COMPANY.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${COMPANY.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${COMPANY.github}" target="_blank" rel="noopener">GitHub</a><a href="${COMPANY.medium}" target="_blank" rel="noopener">Medium</a><a href="${COMPANY.facebook}" target="_blank" rel="noopener">Facebook</a></p>
      </div>
    </div>
  </section>
</main>
${footer("")}`;

conceptBadge(8, "Ink");
const hero = document.querySelector<HTMLElement>(".hero")!;
bath.init({ palette: ["indigo", "gold", "amber"], seedSet: ["indigo", "gold", "amber", "terracotta", "sap", "cream", "saffron"], hero });
bindHeader();
bindTools(hero);
bindFilms();
bindScreens();
sheets();
rotator(document.querySelector(".rot")!, FOR_WHOM);
workDialog();
eggs();
remeasure();

// ---------- hero intro ----------
if (!prefersReducedMotion()) {
  const tl = gsap.timeline({ onComplete: () => { document.querySelector(".hero .h1")!.classList.add("risen"); bath.buildMask(); } });
  tl.from(".hero .h1 .w", { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.07 }, 0.15)
    .from(".hero .kicker", { opacity: 0, y: 10, duration: 0.6 }, 0.1)
    .from(".hero .label", { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" }, 0.55)
    .from(".hero-play > *", { opacity: 0, y: 16, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 0.7);
} else { document.querySelector(".hero .h1")!.classList.add("risen"); bath.buildMask(); }

// the contact heading follows the world
onTheme((t) => {
  const h = document.getElementById("contact-h")!;
  h.innerHTML = words(t === "dark" ? "Send a signal." : "Drop us a line.");
});

// ---------- services: jars / jellyfish ----------
{
  const tabs = [...document.querySelectorAll<HTMLButtonElement>(".jar")];
  const card = document.getElementById("svc-card")!;
  let cur = 0;
  const fill = (i: number) => {
    const s = SERVICES[i];
    card.style.setProperty("--pl", PIGMENTS[SVC_PIG[i]].light);
    card.style.setProperty("--pd", PIGMENTS[SVC_PIG[i]].dark);
    card.querySelector(".svc-n")!.textContent = `${String(i + 1).padStart(2, "0")} / 05`;
    card.querySelector(".svc-t")!.textContent = s.title;
    card.querySelector(".svc-tag")!.textContent = s.tag;
    card.querySelector(".svc-d")!.textContent = s.desc;
    card.querySelector(".svc-i")!.innerHTML = s.items.map((x) => `<li>${x}</li>`).join("");
  };
  fill(0);
  const choose = (i: number) => {
    const jar = tabs[i];
    tabs.forEach((t, k) => t.setAttribute("aria-selected", String(k === i)));
    const r = jar.getBoundingClientRect();
    const pool = document.querySelector<HTMLElement>(".pool")!.getBoundingClientRect();
    const dark = getTheme() === "dark";
    const reduce = prefersReducedMotion();
    // the drop falls from the jar's mouth (or the jellyfish lets go of its light) into the bath
    const drop = document.createElement("span");
    drop.className = "falling";
    drop.style.setProperty("--c", dark ? PIGMENTS[SVC_PIG[i]].dark : PIGMENTS[SVC_PIG[i]].light);
    const sx = r.left + r.width / 2, sy = r.top + r.height * 0.25;
    const tx = pool.left + pool.width * (0.15 + Math.random() * 0.7), ty = Math.max(r.bottom + 40, pool.top + pool.height * (0.62 + Math.random() * 0.25));
    drop.style.left = `${sx}px`; drop.style.top = `${sy}px`;
    document.body.append(drop);
    if (!dark) gsap.fromTo(jar.querySelector(".jar-pot"), { rotate: 0 }, { rotate: -28, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 90%" });
    else gsap.fromTo(jar.querySelector(".jar-jelly"), { scaleY: 1 }, { scaleY: 0.82, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.inOut", transformOrigin: "50% 30%" });
    gsap.to(drop, {
      x: tx - sx, y: ty - sy, duration: reduce ? 0 : 0.55, ease: dark ? "sine.inOut" : "power2.in",
      onComplete: () => { drop.remove(); bath.dropAt(tx, ty, SVC_PIG[i], 0.075); },
    });
    if (i !== cur) {
      cur = i;
      gsap.timeline()
        .to(card.querySelectorAll(".svc-t,.svc-tag,.svc-d,.svc-i,.svc-n"), { opacity: 0, y: -8, duration: reduce ? 0 : 0.18, stagger: 0.02 })
        .add(() => fill(i))
        .fromTo(card.querySelectorAll(".svc-t,.svc-tag,.svc-d,.svc-i,.svc-n"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: reduce ? 0 : 0.5, ease: "power3.out", stagger: 0.04 })
        .fromTo(card.querySelector(".svc-swatch"), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "expo.out" }, "<");
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => choose(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = (cur + (e.key === "ArrowRight" ? 1 : -1) + 5) % 5; tabs[n].focus(); choose(n); }
    });
  });
}

// ---------- process: scroll-scrubbed tray ----------
{
  const tray = new Tray(document.querySelector<HTMLCanvasElement>(".tray")!);
  const items = [...document.querySelectorAll<HTMLElement>(".step")];
  const capN = document.querySelector(".tray-n")!, capL = document.querySelector(".tray-l")!;
  let k = -1;
  const set = (p: number) => {
    tray.draw(p);
    const i = Math.min(3, Math.floor(p * 4 + 0.02));
    if (i !== k) {
      k = i;
      items.forEach((el, j) => el.classList.toggle("on", j === i));
      capN.textContent = PROCESS[i].n; capL.textContent = PROCESS[i].title;
    }
  };
  set(0);
  ScrollTrigger.create({
    trigger: ".proc-steps", start: "top 65%", end: "bottom 55%", scrub: true,
    onUpdate: (s) => set(s.progress),
  });
  onTheme(() => { const p = k < 0 ? 0 : (k + 0.99) / 4; tray.draw(-1); tray.draw(Math.min(1, p)); });
}

// ---------- work: the drying line ----------
{
  const line = document.querySelector<HTMLElement>(".line")!;
  const hangs = [...line.querySelectorAll<HTMLElement>(".hang")];
  const quick = hangs.map((h) => gsap.quickTo(h, "rotate", { duration: 0.9, ease: "elastic.out(1,0.35)" }));
  let lastX = line.scrollLeft, lastT = performance.now();
  line.addEventListener("scroll", () => {
    const now = performance.now();
    const v = (line.scrollLeft - lastX) / Math.max(8, now - lastT);
    lastX = line.scrollLeft; lastT = now;
    if (prefersReducedMotion()) return;
    const ang = Math.max(-14, Math.min(14, -v * 9));
    quick.forEach((q) => q(ang));
    clearTimeout((line as unknown as { _t: number })._t);
    (line as unknown as { _t: number })._t = window.setTimeout(() => quick.forEach((q) => q(0)), 90);
  }, { passive: true });
  // mouse drag to pull the line
  let down = false, sx = 0, sl = 0, moved = false;
  line.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = line.scrollLeft; });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 6) { moved = true; line.classList.add("dragging"); }
    if (moved) line.scrollLeft = sl - dx;
  });
  addEventListener("pointerup", () => { down = false; line.classList.remove("dragging"); });
  line.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  // Sweet Bites plays its scroll demo while it hangs in view
  const v = line.querySelector<HTMLVideoElement>("video");
  if (v) new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !prefersReducedMotion()) { if (!v.getAttribute("src")) v.src = v.dataset.src!; v.play().catch(() => {}); } else v.pause();
  }, { threshold: 0.4 }).observe(v);
}

// ---------- numbers ----------
{
  const btns = [...document.querySelectorAll<HTMLButtonElement>(".num")];
  ScrollTrigger.create({
    trigger: ".nums", start: "top 85%", once: true,
    onEnter: () => btns.forEach((b, i) => setTimeout(() => {
      if (b.dataset.count === "true") countUp(b.querySelector(".nv")!, Number(b.dataset.v));
      b.classList.add("pinged");
    }, i * 160)),
  });
  btns.forEach((b) => b.addEventListener("click", () => {
    const r = b.getBoundingClientRect();
    if (b.dataset.count === "true") countUp(b.querySelector(".nv")!, Number(b.dataset.v), 0.9);
    b.classList.remove("pinged"); void b.offsetWidth; b.classList.add("pinged");
    gsap.fromTo(b, { rotate: -2 }, { rotate: 0, duration: 0.8, ease: "elastic.out(1,.3)" });
    const side = r.left > innerWidth / 2 ? r.left - 30 : r.right + 30;
    bath.dropAt(Math.max(20, Math.min(innerWidth - 20, side)), r.top + r.height / 2, b.dataset.pig as PigmentId, 0.05);
  }));
}

// ---------- about: trace the loop ----------
{
  const svg = document.querySelector<SVGSVGElement>(".inf")!;
  const base = svg.querySelector<SVGPathElement>(".inf-base")!;
  const trail = svg.querySelector<SVGPathElement>(".inf-trail")!;
  const bead = svg.querySelector<SVGCircleElement>(".inf-bead")!;
  const count = document.querySelector(".inf-count")!;
  const L = base.getTotalLength();
  const S = 400;
  const pts = Array.from({ length: S }, (_, i) => base.getPointAtLength((i / S) * L));
  trail.style.strokeDasharray = `${L}`;
  let pos = 0, total = 0, loops = 0, drag = false;
  const draw = () => {
    const p = pts[Math.floor(((pos % S) + S) % S)];
    bead.setAttribute("cx", String(p.x)); bead.setAttribute("cy", String(p.y));
    const shown = Math.min(1, total / S);
    trail.style.strokeDashoffset = String(L * (1 - shown));
  };
  draw();
  // the scroll draws the first loop for anyone who doesn't play
  ScrollTrigger.create({ trigger: svg, start: "top 80%", end: "bottom 30%", scrub: 0.6, onUpdate: (s) => { if (drag || loops) return; pos = Math.floor(s.progress * (S - 1)); total = Math.max(total, pos); draw(); } });
  const toLocal = (e: PointerEvent) => { const m = svg.getScreenCTM()!.inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return p; };
  bead.addEventListener("pointerdown", (e) => { drag = true; bead.setPointerCapture(e.pointerId); svg.classList.add("tracing"); });
  bead.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = toLocal(e);
    // search near the current position, so the crossing in the middle never makes it jump loops
    let best = pos, bd = Infinity;
    for (let d = -40; d <= 40; d++) {
      const i = pos + d;
      const q = pts[((i % S) + S) % S];
      const dist = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (dist < bd) { bd = dist; best = i; }
    }
    if (best > pos) {
      total += best - pos;
      const nl = Math.floor(total / S);
      if (nl > loops) {
        loops = nl;
        count.textContent = loops === 1 ? "Once round. Again?" : `${loops} times round, and still no end.`;
        chord();
        gsap.fromTo(trail, { strokeWidth: 9 }, { strokeWidth: 5, duration: 1.2, ease: "expo.out" });
      }
    }
    pos = best;
    draw();
  });
  const up = () => { drag = false; svg.classList.remove("tracing"); };
  bead.addEventListener("pointerup", up); bead.addEventListener("pointercancel", up);
  bead.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowDown") { pos += 8; total += 8; draw(); } });
  bead.setAttribute("tabindex", "0");
  bead.setAttribute("role", "slider");
  bead.setAttribute("aria-label", "Trace the infinity loop with the arrow keys");
  bead.setAttribute("aria-valuemin", "0");
  bead.setAttribute("aria-valuemax", "100");
  bead.setAttribute("aria-valuenow", "0");
  bead.addEventListener("keydown", () => bead.setAttribute("aria-valuenow", String(Math.round(((total % S) / S) * 100))));
}

// a drop sound on the WhatsApp button
document.querySelector(".wa")?.addEventListener("pointerenter", () => plip(0.8));
