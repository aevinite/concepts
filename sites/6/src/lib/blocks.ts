// Product blocks shared by the home page and the product pages: Aevidine's wall-mounted
// kitchen monitor, Campus's chalkboard that flips into a split-flap departures board (its rows
// are the film's chapters), the bill (contact) and the desk bell.
import { COMPANY, productById, type Film } from "@shared/content";
import { gsap, $, $$, esc, reduced, once, stamp as now } from "./util";
import { filmScreen, chapterList, fmt } from "./film";
import { flap, bell as bellSound, stampThud, click } from "./sound";
import { order, announce } from "./chrome";

/* ---------- Aevidine: the kitchen monitor ---------- */
export function monitorHTML(f: Film, label = "Kitchen 01") {
  return `<div class="monitor">
    <span class="monitor__arm" aria-hidden="true"><i></i></span>
    <div class="monitor__bezel">${filmScreen(f)}</div>
    <span class="monitor__chin" aria-hidden="true"><span>${esc(label)}</span><i class="monitor__led"></i></span>
  </div>`;
}

export function kotChapters(f: Film) {
  return `<div class="kotlist">
    <p class="kotlist__h"><span>KOT &middot; The film</span><span>${esc(f.length)}</span></p>
    ${chapterList(f, "chapters--kot")}
    <p class="kotlist__f">Press a line to jump the film there.</p>
  </div>`;
}

/* ---------- Campus: chalkboard -> departures board ---------- */
export function boardHTML(f: Film, front: { k: string; name: string; kind: string; line: string }) {
  const rows = (f.chapters ?? []).map((c, i) =>
    `<li><button class="dep__row" type="button" data-seek="${f.id}" data-t="${c.t}" data-i="${i}" aria-label="${fmt(c.t)}, ${esc(c.label)}. Jump the film here">
      <span class="fl fl--t" data-text="${fmt(c.t)}"></span><span class="fl fl--l" data-text="${esc(c.label.toUpperCase())}"></span><span class="fl fl--s" data-text="ON TIME"></span>
    </button></li>`).join("");
  return `<div class="board" data-board>
    <div class="board__bar"><span class="board__label" aria-hidden="true">The board</span><button class="board__flip" type="button" aria-pressed="false">Show departures</button></div>
    <div class="board__inner">
      <div class="board__face board__front">
        <p class="chalk__k">${esc(front.k)}</p>
        <p class="chalk__name">${esc(front.name)}</p>
        <p class="chalk__kind">${esc(front.kind)}</p>
        <p class="chalk__line">${esc(front.line)}</p>
        <span class="chalk__smudge" aria-hidden="true"></span>
      </div>
      <div class="board__face board__back">
        <p class="dep__h"><span>Departures</span><span>${esc(f.title.replace(/^Campus Conveyance: /, ""))} &middot; ${esc(f.length)}</span></p>
        <p class="dep__cols" aria-hidden="true"><span>Time</span><span>Destination</span><span>Status</span></p>
        <ol class="dep__rows">${rows}</ol>
      </div>
    </div>
  </div>`;
}

const FLAPS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:?.";
function setFlaps(cell: HTMLElement, text: string, delay = 0, animate = true) {
  const n = Number(cell.dataset.n ?? text.length);
  const target = text.padEnd(n, " ").slice(0, n);
  const spans = $$("i", cell);
  const gen = String(Number(cell.dataset.gen ?? 0) + 1);
  cell.dataset.gen = gen;
  spans.forEach((s, k) => {
    const ch = target[k];
    if (!animate || reduced()) { s.textContent = ch; return; }
    let steps = 4 + Math.floor(Math.random() * 7);
    const go = () => {
      if (cell.dataset.gen !== gen) return;
      if (steps-- <= 0) { s.textContent = ch; s.classList.remove("is-flip"); return; }
      s.textContent = FLAPS[Math.floor(Math.random() * FLAPS.length)];
      s.classList.remove("is-flip"); void s.offsetWidth; s.classList.add("is-flip");
      if (k % 3 === 0) flap();
      setTimeout(go, 55 + Math.random() * 30);
    };
    setTimeout(go, delay + k * 22);
  });
}

export function initBoard(root: ParentNode = document) {
  $$("[data-board]", root).forEach((board) => {
    const btn = $<HTMLButtonElement>(".board__flip", board);
    const front = $(".board__front", board), back = $(".board__back", board);
    // build the flap cells, already showing their words: the board is readable before any animation
    $$(".fl", board).forEach((cell) => {
      const text = cell.dataset.text ?? "";
      const n = cell.classList.contains("fl--l") ? 17 : cell.classList.contains("fl--s") ? 8 : text.length;
      cell.dataset.n = String(n);
      cell.innerHTML = text.padEnd(n, " ").slice(0, n).split("").map((ch) => `<i>${ch === " " ? "&nbsp;" : esc(ch)}</i>`).join("");
      cell.setAttribute("aria-hidden", "true");
    });
    let flipped = false;
    // a flip ripple: every leaf turns over in place, row by row, without ever hiding its letter
    const ripple = () => {
      if (reduced()) return;
      $$(".dep__row", board).forEach((row, r) => setTimeout(() => {
        $$(".fl i", row).forEach((leaf, k) => setTimeout(() => { leaf.classList.remove("is-flip"); void leaf.offsetWidth; leaf.classList.add("is-flip"); if (k % 4 === 0) flap(); }, k * 18));
      }, 380 + r * 70));
    };
    const flip = (v: boolean) => {
      flipped = v;
      board.classList.toggle("is-flipped", v);
      btn.setAttribute("aria-pressed", String(v));
      btn.textContent = v ? "Show today's special" : "Show departures";
      front.inert = v; back.inert = !v;
      click(v);
      if (v) ripple();
    };
    back.inert = true;
    btn.addEventListener("click", () => flip(!flipped));
    once(board, () => setTimeout(() => { if (!flipped) flip(true); }, reduced() ? 0 : 1400), "0px 0px -30% 0px");
    window.addEventListener("film:chapter", (e) => {
      const { i } = (e as CustomEvent<{ id: string; i: number }>).detail;
      if (!flipped) flip(true);
      $$(".dep__row", board).forEach((row, r) => {
        row.classList.toggle("is-now", r === i);
        const s = $(".fl--s", row);
        const want = r === i ? "BOARDING" : r < i ? "DEPARTED" : "ON TIME";
        if ((s.dataset.cur ?? "ON TIME") !== want) { s.dataset.cur = want; setFlaps(s, want, r * 40); }
      });
    });
  });
}

/* ---------- the bill ---------- */
export function billHTML(o: { items?: [string, string][]; id?: string; server?: string; table?: string }) {
  return `<div class="bill" data-bill ${o.items ? `data-fixed="1"` : ""}>
    <div class="bill__paper">
      <p class="b-c b-brand">AEVINITE</p>
      <p class="b-c">${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}</p>
      <p class="b-rule" aria-hidden="true"></p>
      <p class="b-kv"><span>Table</span><span>${esc(o.table ?? "Yours")}</span></p>
      <p class="b-kv"><span>Served by</span><span>${esc(o.server ?? "Rishi Nakrani")}</span></p>
      <p class="b-kv b-now"><span></span><span></span></p>
      <p class="b-rule" aria-hidden="true"></p>
      <ul class="b-items">${(o.items ?? []).map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join("")}</ul>
      <p class="b-kv b-sc"><span>Service charge</span><span>none</span></p>
      <p class="b-rule b-rule--dbl" aria-hidden="true"></p>
      <p class="b-kv b-total"><span>To pay</span><span>One conversation</span></p>
      <p class="b-rule" aria-hidden="true"></p>
      <a class="bill__pay" href="${COMPANY.whatsapp}" target="_blank" rel="noopener"><span>Pay on WhatsApp</span><small>${COMPANY.phoneDisplay}</small></a>
      <p class="b-other">Other ways to pay</p>
      <ul class="b-ways">
        <li><span>Email</span><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
        <li><span>Call</span><a href="${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></li>
      </ul>
      <p class="b-c b-thanks">No form. No account. Just people.</p>
      <span class="stamp bill__paid" aria-hidden="true">Paid</span>
    </div>
  </div>`;
}

export function initBill(root: ParentNode = document) {
  $$("[data-bill]", root).forEach((bill) => {
    const t = now();
    const nowEl = $(".b-now", bill);
    nowEl.children[0].textContent = t.date;
    nowEl.children[1].textContent = t.time;
    const list = $(".b-items", bill), pay = $<HTMLAnchorElement>(".bill__pay", bill), paid = $(".bill__paid", bill);
    if (!bill.dataset.fixed) {
      order.sub((items) => {
        const rows: [string, string][] = items.length ? items.map((x) => [`1 × ${x}`, "quote"]) : [["1 × Website", "quote"]];
        rows.push(["1 × Honest advice", "free"]);
        list.innerHTML = rows.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join("");
        pay.href = items.length ? `${COMPANY.whatsapp}%20I%27m%20hungry%20for%3A%20${encodeURIComponent(items.join(", "))}.` : COMPANY.whatsapp;
        if (!reduced()) gsap.fromTo($$("li", list), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, stagger: 0.05, duration: 0.3 });
      });
    }
    pay.addEventListener("click", () => {
      bill.classList.add("is-paid");
      stampThud();
      if (!reduced()) gsap.fromTo(paid, { scale: 2.4, autoAlpha: 0, rotation: -24 }, { scale: 1, autoAlpha: 1, rotation: -14, duration: 0.3, ease: "power4.in" });
    });
  });
}

/* ---------- the desk bell ---------- */
export function bellHTML() {
  return `<div class="bellbox">
    <button class="bell" type="button" aria-label="Ring the desk bell">
      <svg viewBox="0 0 160 120" aria-hidden="true">
        <g class="bell__waves"><path d="M30 40 Q16 58 30 76"/><path d="M18 30 Q-2 58 18 86"/><path d="M130 40 Q144 58 130 76"/><path d="M142 30 Q162 58 142 86"/></g>
        <rect class="bell__base" x="22" y="96" width="116" height="14" rx="4"/>
        <path class="bell__dome" d="M36 96 Q36 48 80 46 Q124 48 124 96 Z"/>
        <path class="bell__shine" d="M52 84 Q54 62 72 56"/>
        <g class="bell__plunger"><rect x="76" y="30" width="8" height="18" rx="2"/><ellipse cx="80" cy="30" rx="12" ry="4"/></g>
      </svg>
    </button>
    <p class="bellbox__l">Ring for service</p>
    <p class="bellbox__n" aria-live="polite">Rung <b>0</b> times</p>
  </div>`;
}

export function initBell(root: ParentNode = document) {
  $$(".bellbox", root).forEach((box) => {
    const b = $(".bell", box), plunger = $(".bell__plunger", box), dome = $(".bell__dome", box), waves = $$(".bell__waves path", box), n = $(".bellbox__n b", box);
    let count = 0;
    b.addEventListener("click", () => {
      count++;
      n.textContent = String(count);
      bellSound();
      if (count === 7) announce("Seven rings. The kitchen heard you. WhatsApp is the fastest way to reach us.");
      if (reduced()) return;
      gsap.timeline()
        .to(plunger, { y: 8, duration: 0.06, ease: "power3.in" })
        .to(plunger, { y: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
      gsap.fromTo(dome, { rotation: 0 }, { keyframes: [{ rotation: 2 }, { rotation: -1.5 }, { rotation: 1 }, { rotation: 0 }], duration: 0.5, transformOrigin: "50% 100%" });
      gsap.fromTo(waves, { autoAlpha: 1, scale: 0.6, transformOrigin: "50% 50%" }, { autoAlpha: 0, scale: 1.25, duration: 0.8, stagger: 0.05, ease: "power2.out" });
      gsap.fromTo(n, { y: -6 }, { y: 0, duration: 0.4, ease: "back.out(3)" });
    });
  });
}

/* ---------- the product block used on the home page ---------- */
export function productCopy(id: "aevidine" | "campus", link: string) {
  const p = productById(id);
  return `<div class="prod__copy">
    <p class="prod__kind"><span class="dot" aria-hidden="true"></span>${esc(p.kind)}</p>
    <h3 class="prod__name">${esc(p.name)}</h3>
    <p class="prod__head">${esc(p.headline)}</p>
    <p class="prod__line">${esc(p.sub)}</p>
    <p class="prod__status"><span class="tag-status">${esc(p.status)}</span></p>
    <a class="link-go" href="${link}"><span>Open the ${esc(p.name)} page</span><i aria-hidden="true"></i></a>
  </div>`;
}
