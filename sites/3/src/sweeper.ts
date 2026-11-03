// Bug Sweeper: Minesweeper rules, 8x8, 10 bugs. Click to check a square, right-click (or press
// and hold, or switch on Flag mode) to flag a bug. The first square you open is always safe.
import { h } from "./dom";
import { icon, glyph } from "./icons";
import { sfx } from "./sound";
import gsap from "gsap";

const N = 8, BUGS = 10;

export function bugSweeper() {
  let bugs: boolean[] = [], open: boolean[] = [], flag: boolean[] = [];
  let started = false, over = false, t0 = 0, timer = 0, flagMode = false;

  const left = h("output", { class: "bs-lcd", "aria-label": "Bugs left" }, "010");
  const clockEl = h("output", { class: "bs-lcd", "aria-label": "Seconds" }, "000");
  const face = h("button", { type: "button", class: "bs-face", "aria-label": "New game", html: icon("bug", 28) });
  const flagBtn = h("button", { type: "button", class: "bs-flagmode", "aria-pressed": "false" }, h("span", { html: glyph("flag", 14) }), "Flag mode");
  const grid = h("div", { class: "bs-grid", role: "grid", "aria-label": "Bug Sweeper board, 8 by 8" });
  const msg = h("div", { class: "bs-msg", hidden: true, role: "status" });
  const cells: HTMLButtonElement[] = [];
  for (let r = 0; r < N; r++) {
    const row = h("div", { role: "row", class: "bs-row" });
    for (let c = 0; c < N; c++) {
      const b = h("button", { type: "button", class: "bs-c", role: "gridcell", "data-i": String(r * N + c), "aria-label": `Row ${r + 1}, column ${c + 1}, hidden`, tabindex: r + c === 0 ? "0" : "-1" });
      cells.push(b);
      row.append(b);
    }
    grid.append(row);
  }
  const root = h("div", { class: "bs" },
    h("div", { class: "bs-top" }, left, face, clockEl),
    h("div", { class: "bs-board" }, grid, msg),
    h("div", { class: "bs-foot" }, flagBtn, h("p", { class: "bs-help" }, "Right-click, or press and hold, to flag a bug.")));

  const nb = (i: number) => {
    const r = Math.floor(i / N), c = i % N, out: number[] = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
    }
    return out;
  };
  const count = (i: number) => nb(i).filter((j) => bugs[j]).length;
  const pad = (n: number) => String(Math.max(0, Math.min(999, n))).padStart(3, "0");

  function reset() {
    bugs = Array(N * N).fill(false); open = Array(N * N).fill(false); flag = Array(N * N).fill(false);
    started = false; over = false; clearInterval(timer);
    left.textContent = pad(BUGS); clockEl.textContent = "000";
    msg.hidden = true; root.classList.remove("won", "lost");
    cells.forEach((b, i) => { b.className = "bs-c"; b.textContent = ""; b.disabled = false; b.setAttribute("aria-label", `Row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}, hidden`); });
  }
  function place(safe: number) {
    const no = new Set([safe, ...nb(safe)]);
    let k = 0;
    while (k < BUGS) {
      const i = Math.floor(Math.random() * N * N);
      if (no.has(i) || bugs[i]) continue;
      bugs[i] = true; k++;
    }
    started = true; t0 = performance.now();
    timer = window.setInterval(() => { clockEl.textContent = pad(Math.floor((performance.now() - t0) / 1000)); }, 500);
  }
  function paint(i: number) {
    const b = cells[i];
    if (open[i]) {
      const n = count(i);
      b.classList.add("open");
      if (n) { b.textContent = String(n); b.dataset.n = String(n); }
      b.setAttribute("aria-label", `Row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}, ${n ? `${n} bugs next to it` : "clear"}`);
    } else {
      b.classList.toggle("flag", flag[i]);
      b.innerHTML = flag[i] ? glyph("flag", 14) : "";
      b.setAttribute("aria-label", `Row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}, ${flag[i] ? "flagged" : "hidden"}`);
    }
  }
  function reveal(i: number) {
    if (over || open[i] || flag[i]) return;
    if (!started) place(i);
    if (bugs[i]) return lose(i);
    const stack = [i];
    let n = 0;
    while (stack.length) {
      const j = stack.pop()!;
      if (open[j] || flag[j]) continue;
      open[j] = true; n++;
      paint(j);
      if (count(j) === 0) nb(j).forEach((k) => { if (!open[k]) stack.push(k); });
    }
    sfx.reveal();
    if (n > 1) {
      const opened = cells.filter((_, k) => open[k] && !cells[k].dataset.anim);
      opened.forEach((c) => (c.dataset.anim = "1"));
      gsap.from(opened, { scale: 0.4, duration: 0.25, stagger: 0.008, ease: "back.out(2)", clearProps: "scale" });
    }
    if (open.filter(Boolean).length === N * N - BUGS) win();
  }
  function toggleFlag(i: number) {
    if (over || open[i]) return;
    flag[i] = !flag[i];
    paint(i);
    sfx.flag();
    left.textContent = pad(BUGS - flag.filter(Boolean).length);
    gsap.fromTo(cells[i], { scale: 1.3 }, { scale: 1, duration: 0.3, ease: "back.out(3)", clearProps: "scale" });
  }
  function lose(i: number) {
    over = true; clearInterval(timer);
    cells[i].classList.add("boom");
    sfx.boom();
    bugs.forEach((bug, k) => { if (bug) { cells[k].classList.add("bug"); cells[k].innerHTML = icon("bug", 22); } });
    root.classList.add("lost");
    gsap.fromTo(root, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1.2, 0.2)" });
    msg.replaceChildren(h("strong", null, "One got through."), h("span", null, "Tap the bug at the top to play again."));
    msg.hidden = false;
  }
  function win() {
    over = true; clearInterval(timer);
    root.classList.add("won");
    sfx.win();
    const secs = Math.floor((performance.now() - t0) / 1000);
    msg.replaceChildren(h("strong", null, "Zero bugs shipped."), h("span", null, `Board cleared in ${secs} seconds.`),
      h("button", { type: "button", class: "btn", onclick: reset }, "Play again"));
    msg.hidden = false;
    gsap.from(msg, { scale: 0.6, opacity: 0, duration: 0.45, ease: "back.out(2)" });
  }

  // pointer: tap / click reveals, right-click or long-press flags
  let press = 0, longFired = false;
  grid.addEventListener("contextmenu", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".bs-c");
    if (!b) return;
    e.preventDefault();
    if (!longFired) toggleFlag(Number(b.dataset.i));
  });
  grid.addEventListener("pointerdown", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".bs-c");
    longFired = false;
    if (!b || e.pointerType === "mouse") return;
    press = window.setTimeout(() => { longFired = true; toggleFlag(Number(b.dataset.i)); navigator.vibrate?.(20); }, 420);
  });
  const cancel = () => clearTimeout(press);
  grid.addEventListener("pointerup", cancel);
  grid.addEventListener("pointercancel", cancel);
  grid.addEventListener("pointerleave", cancel);
  grid.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".bs-c");
    if (!b) return;
    if (longFired) { longFired = false; return; }
    const i = Number(b.dataset.i);
    flagMode ? toggleFlag(i) : reveal(i);
  });
  grid.addEventListener("keydown", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".bs-c");
    if (!b) return;
    let i = Number(b.dataset.i);
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: N, ArrowUp: -N };
    if (e.key in moves) {
      e.preventDefault();
      const j = i + moves[e.key];
      if (j < 0 || j >= N * N || (Math.abs(moves[e.key]) === 1 && Math.floor(j / N) !== Math.floor(i / N))) return;
      cells[i].tabIndex = -1; cells[j].tabIndex = 0; cells[j].focus(); i = j;
    } else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFlag(i); }
  });
  face.addEventListener("click", () => { reset(); sfx.click(); gsap.fromTo(face, { rotate: -20 }, { rotate: 0, duration: 0.5, ease: "elastic.out(1.4,0.3)" }); });
  flagBtn.addEventListener("click", () => { flagMode = !flagMode; flagBtn.setAttribute("aria-pressed", String(flagMode)); root.classList.toggle("flagging", flagMode); });
  reset();
  return { el: root, destroy: () => clearInterval(timer) };
}
