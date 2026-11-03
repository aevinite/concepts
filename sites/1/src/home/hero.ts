import { gsap } from "gsap";
import { COMPANY, FOR_WHOM } from "@shared/content";
import { getTheme } from "@shared/theme";
import { initSky } from "../lib/sky";
import { COLORS } from "../lib/kitedraw";
import { $, esc, isCoarse, isNarrow, reduced, clamp, kiteSVG } from "../lib/utils";

export function heroHTML() {
  const list = FOR_WHOM.slice(0, -1).join(", ") + " and " + FOR_WHOM[FOR_WHOM.length - 1];
  return `<section class="hero" id="top" aria-labelledby="hero-title">
    <canvas class="hero-sky" aria-hidden="true"></canvas>
    <div class="wrap hero-copy">
      <p class="eyebrow hero-eyebrow"><span class="gu" lang="gu">ઉત્તરાયણ</span><span>Aevinite, ${esc(COMPANY.city)}</span></p>
      <h1 class="hero-title" id="hero-title"><span class="ht ht-a lit">We help</span> <span class="ht ht-b lit">businesses</span> <span class="ht ht-c lit">grow.</span></h1>
      <p class="hero-for">Websites, software and automation for <span class="rot"><span class="rot-word">${esc(FOR_WHOM[0])}</span></span><span class="rot-mark" aria-hidden="true">${kiteSVG()}</span></p>
      <p class="hero-pitch">${esc(COMPANY.pitch)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span class="long">Talk to us on WhatsApp</span><span class="short">WhatsApp us</span></a>
        <a class="btn btn-line" href="#products"><span class="long">See what we have built</span><span class="short">Our work</span></a>
      </div>
      <p class="hero-hint"><span class="hint-dot" aria-hidden="true"></span><span class="hint-text">${isCoarse() ? "Tap the sky to fly." : "Move your pointer to fly the kite."} Cross a string to cut it.</span></p>
      <p class="sr-only">We build for ${esc(list)}.</p>
    </div>
    <div class="tally" role="status" aria-live="polite">
      <span class="tally-label">Kites cut</span>
      <svg class="tally-marks" viewBox="0 0 120 34" aria-hidden="true"></svg>
      <b class="tally-n">0</b>
    </div>
    <div class="kpc-layer" aria-hidden="true"></div>
  </section>`;
}

export function initHero() {
  const section = $<HTMLElement>(".hero");
  const canvas = $<HTMLCanvasElement>(".hero-sky", section);
  const copy = $<HTMLElement>(".hero-copy", section);
  const rot = $<HTMLElement>(".rot", section);
  const mark = $<HTMLElement>(".rot-mark", section);
  const marks = $<SVGSVGElement>(".tally-marks", section);
  const tallyN = $<HTMLElement>(".tally-n", section);
  const layer = $<HTMLElement>(".kpc-layer", section);
  const hint = $<HTMLElement>(".hero-hint", section);
  const lit = Array.from(section.querySelectorAll<HTMLElement>(".lit"));
  let current: string = FOR_WHOM[0];
  const fitRot = () => { rot.style.width = `${$<HTMLElement>(".rot-word", rot).offsetWidth}px`; };
  fitRot();
  document.fonts?.ready.then(fitRot);
  let firstCut = false;
  const cutWords = new Set<string>();
  let rewarded = false;

  const swapWord = (w: string, color?: string) => {
    if (w === current && !color) return;
    current = w;
    const words = Array.from(rot.querySelectorAll<HTMLElement>(".rot-word"));
    const old = words[words.length - 1];
    words.slice(0, -1).forEach((x) => { gsap.killTweensOf(x); x.remove(); });
    gsap.killTweensOf(old);
    const nw = document.createElement("span");
    nw.className = "rot-word";
    nw.textContent = w;
    rot.append(nw);
    const from = rot.offsetWidth, to = nw.offsetWidth;
    if (color) mark.style.setProperty("--k-a", color);
    if (reduced()) { old.remove(); rot.style.width = `${to}px`; return; }
    gsap.fromTo(rot, { width: from }, { width: to, duration: 0.5, ease: "power3.inOut" });
    gsap.to(old, { yPercent: -110, rotate: -6, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => old.remove() });
    gsap.fromTo(nw, { yPercent: 110, rotate: 6, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.6, ease: "back.out(2)", delay: 0.12 });
    gsap.fromTo(mark, { rotate: -30, y: 6 }, { rotate: 0, y: 0, duration: 0.8, ease: "elastic.out(1,.4)" });
  };

  // Until somebody cuts a kite, the word turns over by itself so every reader sees them all.
  let i = 0;
  const auto = gsap.delayedCall(2.8, function loop() {
    if (firstCut) return;
    i = (i + 1) % FOR_WHOM.length;
    swapWord(FOR_WHOM[i]);
    auto.restart(true);
  });

  const drawTally = (n: number) => {
    const shown = Math.min(n, 15);
    let s = "";
    for (let k = 0; k < shown; k++) {
      const g = Math.floor(k / 5), j = k % 5, x0 = g * 40 + 4;
      s += j < 4 ? `<path d="M${x0 + j * 7} 6 L${x0 + j * 7 + 1} 28"/>` : `<path d="M${x0 - 3} 24 L${x0 + 26} 9"/>`;
    }
    marks.innerHTML = s;
    const lastMark = marks.lastElementChild as SVGPathElement | null;
    if (lastMark && !reduced()) {
      const L = lastMark.getTotalLength();
      gsap.fromTo(lastMark, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" });
    }
    const obj = { v: Number(tallyN.textContent) || 0 };
    gsap.to(obj, { v: n, duration: 0.5, ease: "power2.out", onUpdate: () => { tallyN.textContent = String(Math.round(obj.v)); } });
    gsap.fromTo(".tally", { scale: 1.15, rotate: -3 }, { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1,.45)" });
  };

  const kaiPoChe = (x: number, y: number) => {
    layer.querySelectorAll<HTMLElement>(".kpc").forEach((o) => { gsap.killTweensOf(o); gsap.to(o, { opacity: 0, scale: 0.8, duration: 0.15, onComplete: () => o.remove() }); });
    const el = document.createElement("div");
    el.className = "kpc";
    el.innerHTML = `<span>Kai po che!</span>`;
    layer.append(el);
    const W = section.clientWidth;
    const cx = clamp(x, 140, W - 140), cy = clamp(y, 90, section.clientHeight - 200);
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    const tl = gsap.timeline({ onComplete: () => el.remove() });
    if (reduced()) tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }).to(el, { opacity: 0, duration: 0.4, delay: 0.8 });
    else tl.fromTo(el, { scale: 0.2, rotate: -18, opacity: 0 }, { scale: 1, rotate: -7, opacity: 1, duration: 0.55, ease: "back.out(2.6)" })
      .to(el, { y: -50, opacity: 0, rotate: -3, duration: 0.6, ease: "power2.in", delay: 0.55 });
  };

  let h1Off: { el: HTMLElement; x: number; y: number }[] = [];
  const measure = () => {
    const s = section.getBoundingClientRect();
    h1Off = lit.map((el) => { const r = el.getBoundingClientRect(); return { el, x: r.left - s.left, y: r.top - s.top }; });
  };
  new ResizeObserver(measure).observe(section);

  initSky({
    section, canvas, words: FOR_WHOM,
    zone: (W, H) => {
      if (!isNarrow()) return { left: W * 0.5, right: W * 0.95, top: H * 0.12, bottom: H * 0.56 };
      const roof = Math.min(140, Math.max(104, H * 0.15));
      const bottom = H - roof - 56;
      const copyBottom = copy.offsetTop + copy.offsetHeight - 260;
      const top = Math.min(Math.max(copyBottom + 30, H * 0.4), bottom - 60);
      return { left: W * 0.12, right: W * 0.88, top, bottom };
    },
    flyerX: (W) => (isNarrow() ? W * 0.56 : W * 0.6),
    auto: (W, H) => {
      if (isNarrow()) {
        const roof = Math.min(140, Math.max(104, H * 0.15));
        const top = copy.offsetTop + copy.offsetHeight - 260, bottom = H - roof - 40;
        return { cx: W * 0.5, ax: W * 0.3, cy: (top + bottom) / 2, ay: (bottom - top) * 0.35 };
      }
      const right = Math.max(...lit.filter((el) => !el.classList.contains("ht-a")).map((el) => el.offsetLeft + el.offsetWidth)) + copy.offsetLeft;
      const free = Math.max(W * 0.22, W - right);
      return { cx: W - free / 2, ax: free * 0.3, cy: H * 0.3, ay: H * 0.12 };
    },
    far: (W, H) => (isNarrow()
      ? { left: W * 0.08, right: W * 0.92, top: copy.offsetTop + copy.offsetHeight - 250, bottom: H * 0.78 }
      : { left: W * 0.74, right: W * 0.98, top: H * 0.06, bottom: H * 0.6 }),
    onFly: () => gsap.to(hint, { opacity: 0.8, duration: 0.6 }),
    onCut: (word, look, x, y, total) => {
      firstCut = true;
      auto.kill();
      const color = look.a === COLORS.cream ? look.b : look.a;
      swapWord(word, color);
      kaiPoChe(x, y);
      drawTally(total);
      cutWords.add(word);
      if (!rewarded && cutWords.size === FOR_WHOM.length) {
        rewarded = true;
        const t = $<HTMLElement>(".hint-text", hint);
        gsap.to(hint, { opacity: 0, y: -6, duration: 0.25, onComplete: () => {
          t.textContent = `You cut a kite for every one of them: ${FOR_WHOM.join(", ")}. We build for all of them.`;
          hint.classList.add("won");
          gsap.fromTo(hint, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(2)" });
        } });
      }
    },
    onLight: (x, y) => {
      if (getTheme() !== "dark") return;
      for (const o of h1Off) {
        o.el.style.setProperty("--lx", `${(x - o.x).toFixed(0)}px`);
        o.el.style.setProperty("--ly", `${(y - o.y).toFixed(0)}px`);
      }
    },
  });

  if (!reduced()) {
    gsap.from(".hero .ht", { yPercent: 60, opacity: 0, rotate: 3, duration: 1, ease: "power4.out", stagger: 0.09, delay: 0.1, clearProps: "transform,opacity" });
    gsap.from([".hero-eyebrow", ".hero-for", ".hero-pitch", ".hero-cta", ".hero-hint"], { y: 20, opacity: 0, duration: 0.8, stagger: 0.07, ease: "power3.out", delay: 0.35 });
  }
}
