// THE signature toy: a thermal printer prints the hero as a receipt, line by line, with the
// little jerks of a stepper motor. Pull the receipt down (it unrolls more blank paper from the
// roll); pull past the tear line and let go to rip it off at the serrated bar. The torn ticket
// flies up onto the ticket rail. Drag a ticket from the rail onto the order spike (or just tap
// it) and it gets spiked with a thunk. In the dark world (9 pm rush) orders keep coming in.
import { getTheme } from "@shared/theme";
import { gsap, Draggable, Flip, $, $$, reduced, clamp, narrow } from "./util";
import { printLine, tear as tearSound, thunk, click, bell } from "./sound";
import { announce } from "./chrome";

export type MiniSpec = { no: string; word: string; label: string };

export function printerHTML(model: string, ticketLabel: string) {
  return `
  <div class="printer">
    <span class="printer__hanger printer__hanger--l" aria-hidden="true"></span>
    <span class="printer__hanger printer__hanger--r" aria-hidden="true"></span>
    <div class="printer__body">
      <span class="printer__lid" aria-hidden="true"></span>
      <span class="printer__brand" aria-hidden="true">${model}<small>Thermal &middot; 80 mm</small></span>
      <span class="printer__leds" aria-hidden="true"><i class="led led--pwr"></i><i class="led led--job"></i></span>
      <button class="printer__feed" type="button" aria-label="Feed the paper a little">Feed</button>
      <span class="printer__slot" aria-hidden="true"><span class="printer__teeth"></span></span>
    </div>
    <div class="paper-well">
      <span class="paper-well__line" aria-hidden="true"><span>Tear line</span></span>
      <article class="paper" aria-label="${ticketLabel}">
        <span class="paper__lead" aria-hidden="true"></span>
        <div class="paper__sheet"><div class="paper__ink"></div>
          <div class="paper__grip" aria-hidden="true"><span>Pull</span></div>
        </div>
        <span class="paper__curl" aria-hidden="true"></span>
      </article>
    </div>
  </div>`;
}

export function railHTML(label = "Ticket rail") {
  return `<div class="rail" role="group" aria-label="${label}">
    <span class="rail__bar" aria-hidden="true"><i></i></span>
    <ol class="rail__list"></ol>
  </div>`;
}

export function spikeHTML() {
  return `<div class="spike">
    <div class="spike__stack" aria-hidden="true"></div>
    <span class="spike__rod" aria-hidden="true"></span>
    <span class="spike__base" aria-hidden="true"></span>
    <p class="spike__count">On the spike <b class="spike__n">0</b></p>
  </div>`;
}

const miniHTML = (m: MiniSpec) =>
  `<button class="mini" type="button" aria-label="${m.label}. Drag it to the spike, or press to spike it">
    <span class="mini__clip" aria-hidden="true"></span>
    <span class="mini__no">${m.no}</span><span class="mini__word">${m.word}</span>
    <span class="mini__lines" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  </button>`;

function zigTop(w: number, h: number, tooth = 9, depth = 6) {
  const pts: string[] = [];
  for (let x = 0; x <= w + tooth; x += tooth) pts.push(`${Math.min(x, w)}px ${(x / tooth) % 2 ? 0 : depth}px`);
  pts.push(`${w}px ${h}px`, `0px ${h}px`);
  return `polygon(${pts.join(",")})`;
}

export function mountPrinter(o: {
  root: HTMLElement;
  ticket: (i: number) => string;
  mini: (i: number) => MiniSpec;
  prehung?: MiniSpec[];
  rush?: () => MiniSpec;
  onPrinted?: (i: number) => void;
}) {
  const root = o.root;
  const printer = $(".printer", root), body = $(".printer__body", root), well = $(".paper-well", root);
  const paper = $(".paper", root), sheet = $(".paper__sheet", root), ink = $(".paper__ink", root), curl = $(".paper__curl", root);
  const rail = $(".rail__list", root), spike = $(".spike", root), stack = spike ? $(".spike__stack", spike) : null;
  const tearBtn = $<HTMLButtonElement>(".btn-tear", root), feedBtn = $<HTMLButtonElement>(".printer__feed", root);
  const st = { pull: 0, sway: 0 };
  let idx = 0, printing = false, dragging = false, spiked = 0;
  const tearAt = () => (narrow() ? 110 : 150);

  const apply = () => {
    gsap.set(paper, { y: st.pull, rotation: st.sway });
    const k = clamp(st.pull / tearAt(), 0, 1.2);
    well.style.setProperty("--tension", String(Math.min(1, k)));
    well.classList.toggle("is-ready", k >= 1);
  };

  /* ----- printing ----- */
  function print(i: number) {
    printing = true;
    ink.innerHTML = o.ticket(i);
    root.classList.add("is-printing");
    gsap.set(curl, { rotationX: 0, autoAlpha: 0 });
    if (reduced()) {
      gsap.set(sheet, { "--shown": `${sheet.offsetHeight}px` });
      gsap.set(curl, { rotationX: -62, autoAlpha: 1 });
      printing = false; root.classList.remove("is-printing"); o.onPrinted?.(i);
      return;
    }
    const steps: number[] = [];
    $$(".ln", ink).forEach((el) => {
      const top = el.offsetTop, h = el.offsetHeight;
      const lh = parseFloat(getComputedStyle(el).lineHeight) || h;
      const k = Math.max(1, Math.round(h / lh));
      for (let j = 1; j <= k; j++) steps.push(top + (h * j) / k);
    });
    steps.push(sheet.offsetHeight);
    gsap.set(sheet, { "--shown": "0px" });
    const fast = getTheme() === "dark";
    const dt = fast ? 0.055 : 0.085;
    const tl = gsap.timeline({ onComplete: () => {
      printing = false; root.classList.remove("is-printing");
      gsap.to(curl, { autoAlpha: 1, rotationX: -62, duration: 0.7, ease: "back.out(2)" });
      o.onPrinted?.(i);
    } });
    steps.forEach((y, k) => {
      tl.to(sheet, { "--shown": `${y + 2}px`, duration: dt, ease: "steps(3)", onStart: () => { if (k % 2 === 0) printLine(fast); } });
      tl.to(body, { y: -1.2, duration: dt / 2, yoyo: true, repeat: 1, ease: "none" }, "<");
      if (k % 4 === 3) tl.to({}, { duration: dt * 0.8 });
    });
  }

  /* ----- pulling ----- */
  let y0 = 0, x0 = 0, last = 0, lastT = 0, vel = 0;
  paper.addEventListener("pointerdown", (e) => {
    if (printing || e.button > 0) return;
    if (e.pointerType === "touch" && !(e.target as HTMLElement).closest(".paper__grip")) return;
    dragging = true;
    paper.setPointerCapture(e.pointerId);
    gsap.killTweensOf(st);
    y0 = e.clientY - st.pull / 1; x0 = e.clientX; last = e.clientY; lastT = performance.now(); vel = 0;
    root.classList.add("is-pulling");
  });
  paper.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - y0, T = tearAt();
    st.pull = dy <= 0 ? dy * 0.12 : dy < T ? dy : T + (dy - T) * 0.35;
    st.sway = clamp((e.clientX - x0) * 0.03, -5, 5);
    const now = performance.now();
    vel = (e.clientY - last) / Math.max(1, now - lastT); last = e.clientY; lastT = now;
    apply();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove("is-pulling");
    if (st.pull >= tearAt() || (st.pull > tearAt() * 0.6 && vel > 1.2)) { rip(); return; }
    gsap.to(st, { pull: 0, sway: 0, duration: 1.1, ease: "elastic.out(1,0.38)", onUpdate: apply });
  };
  paper.addEventListener("pointerup", release);
  paper.addEventListener("pointercancel", release);

  feedBtn.addEventListener("click", () => {
    if (printing || dragging) return;
    printLine(); setTimeout(() => printLine(), 70);
    gsap.timeline().to(st, { pull: 34, duration: 0.18, ease: "steps(4)", onUpdate: apply }).to(st, { pull: 0, duration: 1, ease: "elastic.out(1,0.35)", onUpdate: apply }, "+=0.25");
  });
  tearBtn?.addEventListener("click", () => {
    if (printing || dragging) return;
    gsap.to(st, { pull: tearAt() * 0.7, duration: reduced() ? 0 : 0.22, ease: "power2.in", onUpdate: apply, onComplete: rip });
  });

  /* ----- the rail ----- */
  const cap = () => (narrow() ? 4 : 7);
  function hang(m: MiniSpec, from?: "printer" | "right") {
    const before = Flip.getState($$(".rail__t", rail));
    // rail full: the oldest ticket falls off the end
    const all = $$(".rail__t", rail);
    if (all.length >= cap()) dropOff(all[0]);
    const li = document.createElement("li");
    li.className = "rail__t";
    li.style.setProperty("--sw", `${(Math.random() * 1.4 + 0.8).toFixed(2)}s`);
    li.innerHTML = miniHTML(m);
    rail.append(li);
    Flip.from(before, { duration: reduced() ? 0 : 0.5, ease: "power2.inOut", targets: $$(".rail__t", rail).filter((x) => x !== li) });
    wire(li);
    if (from === "right" && !reduced()) {
      gsap.fromTo(li, { x: 220, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" });
      gsap.fromTo($(".mini", li), { rotation: -14 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1,0.25)", delay: 0.3 });
    }
    return li;
  }
  function dropOff(li: HTMLElement) {
    li.classList.add("is-leaving");
    const r = li.getBoundingClientRect();
    const ghost = li.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, margin: "0", zIndex: "60", pointerEvents: "none" });
    ghost.setAttribute("aria-hidden", "true");
    document.body.append(ghost);
    li.remove();
    gsap.to(ghost, { y: 260, rotation: -30 - Math.random() * 40, autoAlpha: 0, duration: reduced() ? 0 : 0.9, ease: "power2.in", onComplete: () => ghost.remove() });
  }
  function wire(li: HTMLElement) {
    const btn = $<HTMLButtonElement>(".mini", li);
    btn.addEventListener("click", (e) => { if ((e as MouseEvent).detail === 0) spikeIt(li); });
    if (!spike) return;
    Draggable.create(btn, {
      type: "x,y",
      dragClickables: true,
      zIndexBoost: true,
      minimumMovement: 4,
      onPress() { li.classList.add("is-held"); gsap.to(btn, { scale: 1.08, rotation: -5, duration: 0.2 }); },
      onDrag() { spike.classList.toggle("is-target", this.hitTest(spike, "20%")); },
      onRelease() { li.classList.remove("is-held"); },
      onDragEnd() {
        spike.classList.remove("is-target");
        if (this.hitTest(spike, "20%")) spikeIt(li);
        else gsap.to(btn, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.9, ease: "elastic.out(1,0.45)" });
      },
      onClick() { gsap.to(btn, { scale: 1, rotation: 0, duration: 0.2 }); spikeIt(li); },
    });
  }

  /* ----- the spike ----- */
  function spikeIt(li: HTMLElement) {
    if (!spike || !stack || li.classList.contains("is-spiking")) return;
    li.classList.add("is-spiking");
    const btn = $(".mini", li), r = btn.getBoundingClientRect();
    const rod = $(".spike__rod", spike).getBoundingClientRect();
    const ghost = btn.cloneNode(true) as HTMLElement;
    ghost.removeAttribute("style");
    Object.assign(ghost.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: "0", zIndex: "70", pointerEvents: "none" });
    ghost.setAttribute("aria-hidden", "true");
    ghost.classList.add("mini--ghost");
    document.body.append(ghost);
    const before = Flip.getState($$(".rail__t", rail));
    li.remove();
    Flip.from(before, { duration: reduced() ? 0 : 0.45, ease: "power2.inOut" });
    const n = spiked;
    const tipX = rod.left + rod.width / 2 - (r.left + r.width / 2);
    const tipY = rod.top - 20 - (r.top + r.height / 2);
    const restY = rod.bottom - 22 - Math.min(n, 9) * 5 - (r.top + r.height / 2);
    const rot = (n % 2 ? 1 : -1) * (8 + Math.random() * 22);
    const done = () => {
      ghost.remove();
      thunk();
      spiked++;
      const s = document.createElement("span");
      s.className = "spiked";
      s.style.setProperty("--r", `${rot}deg`);
      s.style.setProperty("--y", `${Math.min(n, 9) * -5}px`);
      s.innerHTML = btn.innerHTML;
      stack.append(s);
      if (stack.children.length > 10) stack.firstElementChild!.remove();
      $(".spike__n", spike).textContent = String(spiked);
      gsap.fromTo(spike, { rotation: -2 }, { rotation: 0, duration: 0.6, ease: "elastic.out(1,0.3)", transformOrigin: "50% 100%" });
      gsap.fromTo($(".spike__n", spike), { scale: 1.6 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
      announce(`Ticket spiked. ${spiked} on the spike.`);
      if (spiked === 5) {
        bell();
        spike.classList.add("is-cleared");
        setTimeout(() => spike.classList.remove("is-cleared"), 2400);
      }
    };
    if (reduced()) { done(); return; }
    gsap.timeline({ onComplete: done })
      .to(ghost, { x: tipX, duration: 0.55, ease: "power2.inOut" }, 0)
      .to(ghost, { y: tipY, rotation: rot * 0.4, duration: 0.55, ease: "back.out(1.1)" }, 0)
      .to(ghost, { y: restY, rotation: rot, scale: 0.92, duration: 0.16, ease: "power4.in" });
  }

  /* ----- tearing ----- */
  function rip() {
    if (printing) return;
    tearSound();
    const sr = sheet.getBoundingClientRect(), wr = well.getBoundingClientRect();
    const top = wr.top, h = sr.bottom - top, w = sr.width;
    const piece = document.createElement("div");
    piece.className = "torn";
    piece.setAttribute("aria-hidden", "true");
    Object.assign(piece.style, { left: `${sr.left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px`, clipPath: zigTop(w, h) });
    const copy = sheet.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    copy.querySelectorAll("h1").forEach((h1) => { const d = document.createElement("div"); d.className = h1.className; d.innerHTML = h1.innerHTML; h1.replaceWith(d); });
    copy.style.removeProperty("--shown");
    copy.classList.add("is-copy");
    copy.style.marginTop = `${sr.top - top}px`;
    piece.append(copy);
    document.body.append(piece);
    // reset the real paper behind it
    gsap.killTweensOf(st);
    st.pull = 0; st.sway = 0; apply();
    gsap.set(sheet, { "--shown": "0px" });
    gsap.set(curl, { autoAlpha: 0 });
    const m = o.mini(idx);
    const li = hang(m, "printer");
    const mini = $(".mini", li);
    gsap.set(li, { autoAlpha: 0 });
    const tr = mini.getBoundingClientRect();
    const s = tr.width / w;
    const done = () => {
      piece.remove();
      gsap.set(li, { autoAlpha: 1 });
      if (!reduced()) gsap.fromTo(mini, { rotation: 16 }, { rotation: 0, duration: 1.6, ease: "elastic.out(1,0.22)" });
      click(true);
    };
    idx++;
    announce(`Ticket torn off and hung on the rail. Printing ticket ${idx + 1}.`);
    if (reduced()) { done(); print(idx); return; }
    gsap.timeline({ onComplete: done })
      .to(piece, { y: 14, rotation: -3, duration: 0.12, ease: "power2.out" })
      .to(piece, { x: tr.left - sr.left, duration: 0.8, ease: "power1.inOut" })
      .to(piece, { y: tr.top - top, duration: 0.8, ease: "back.in(1.4)" }, "<")
      .to(piece, { scale: s, rotation: 360 * (Math.random() > 0.5 ? 1 : -1) + (Math.random() * 20 - 10), transformOrigin: "0% 0%", duration: 0.8, ease: "power2.inOut" }, "<")
      .to(piece, { autoAlpha: 0, duration: 0.12 }, "-=0.1");
    gsap.delayedCall(0.55, () => print(idx));
  }

  /* ----- the 9 pm rush: orders keep coming in ----- */
  let rushT: gsap.core.Tween | null = null, visible = false;
  const rushTick = () => {
    rushT = gsap.delayedCall(4.2 + Math.random() * 2.5, rushTick);
    if (!o.rush || getTheme() !== "dark" || !visible || document.hidden || dragging || printing || reduced()) return;
    hang(o.rush(), "right");
    root.classList.remove("is-rush"); void root.offsetWidth; root.classList.add("is-rush");
    printLine(true);
  };
  if (o.rush) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);
    rushT = gsap.delayedCall(3, rushTick);
  }

  (o.prehung ?? []).forEach((m) => hang(m));
  gsap.set(sheet, { "--shown": "0px" });
  // start printing once fonts are in, so line positions are measured right
  const start = () => print(0);
  (document.fonts?.ready ?? Promise.resolve()).then(() => setTimeout(start, reduced() ? 0 : 450));
  void rushT;
}
