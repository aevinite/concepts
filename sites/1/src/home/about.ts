// About: the founders, the name (a kite flying an endless loop: a beginning with no end), and
// the two dates. Give the loop some wind and the kite races round.
import { gsap } from "gsap";
import { COMPANY, FOUNDERS, media } from "@shared/content";
import { $, esc, gu, watchView, reduced } from "../lib/utils";
import { sound } from "../lib/sound";

function lemniscate(n = 160) {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2, d = 1 + Math.sin(t) ** 2;
    pts.push(`${(200 + (170 * Math.cos(t)) / d).toFixed(1)} ${(100 + (170 * Math.sin(t) * Math.cos(t)) / d).toFixed(1)}`);
  }
  return "M" + pts.join("L");
}

export function aboutHTML() {
  const d = lemniscate();
  const initials = (n: string) => n.split(" ").map((w) => w[0]).join("");
  return `<section class="about" id="about" aria-labelledby="about-h">
    <div class="wrap">
      <header class="sec-head">
        <p class="eyebrow"><span class="gu" lang="gu">${gu(6)}</span><span>About</span></p>
        <h2 class="h2" id="about-h" data-split>Uttarayan is never a one-person job.</h2>
        <p class="lede" data-reveal>One flies, one holds the firki. Aevinite has two founders in ${esc(COMPANY.city)}, ${esc(COMPANY.region)}. Everything is made in-house, by the people you talk to.</p>
      </header>
      <div class="about-grid">
        <div class="name-card kite-paper" data-reveal>
          <div class="loop">
            <svg class="loop-svg" viewBox="0 0 400 200" aria-hidden="true">
              <path d="${d}" class="loop-ghost"/>
              <path d="${d}" class="loop-trail"/>
              <g class="loop-kite"><path d="M0 14 L-4.5 22 L4.5 22Z" class="k-b"/><path d="M0 -16 L15.7 -1 L0 16.3 L-15.7 -1Z" class="k-a"/><path d="M0 -16 L15.7 -1 L0 16.3Z" class="k-b"/><path d="M0 -16 L0 16.3 M-15.7 -1 Q0 -12.8 15.7 -1" class="k-s"/></g>
            </svg>
            <button type="button" class="btn btn-line loop-btn"><span>Give it wind</span></button>
          </div>
          <div class="name-text">
            <p class="name-kicker"><img src="${media("aevinite-mark.webp")}" alt="" width="40" height="25" loading="lazy"> The name</p>
            <p class="name-meaning">${esc(COMPANY.meaning)}</p>
          </div>
        </div>
        <ol class="dates" data-reveal>
          <li><time>${esc(COMPANY.foundedLabel)}</time><b>Founded as ${esc(COMPANY.formerName)}</b><span>${esc(COMPANY.city)}, ${esc(COMPANY.country)}</span></li>
          <li><time>${esc(COMPANY.renamedLabel)}</time><b>Renamed ${esc(COMPANY.name)}</b><span>New name, same city</span></li>
        </ol>
        <div class="founders">
          ${FOUNDERS.map((f, i) => `<article class="founder kite-paper" data-reveal style="--tilt:${i ? 1.2 : -1.4}deg">
            <span class="founder-pin" aria-hidden="true"></span>
            <p class="founder-mono" aria-hidden="true"><span>${initials(f.name)}</span></p>
            <p class="founder-role">${esc(f.role)}</p>
            <h3 class="founder-name">${esc(f.name)}</h3>
            <p class="founder-bio">${esc(f.bio)}</p>
            <p class="founder-links"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p>
          </article>`).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

export function initAbout() {
  const svg = $<SVGSVGElement>(".loop-svg");
  const ghost = $<SVGPathElement>(".loop-ghost", svg);
  const trail = $<SVGPathElement>(".loop-trail", svg);
  const kite = $<SVGGElement>(".loop-kite", svg);
  const L = ghost.getTotalLength();
  const TR = 110;
  trail.style.strokeDasharray = `${TR} ${L}`;
  const st = { pos: 0, speed: 0.11, boost: 0 };
  let raf = 0, last = 0;
  const place = () => {
    const at = ((st.pos % 1) + 1) % 1 * L;
    const p = ghost.getPointAtLength(at), q = ghost.getPointAtLength((at + 2) % L);
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    kite.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(ang + 90).toFixed(1)})`);
    trail.style.strokeDashoffset = `${-(at - TR)}`;
  };
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    st.pos += dt * (st.speed + st.boost);
    place();
  };
  $<HTMLButtonElement>(".loop-btn").addEventListener("click", () => {
    sound.whoosh();
    gsap.fromTo(st, { boost: 0.9 }, { boost: 0, duration: 2.6, ease: "power2.out" });
    if (reduced()) { st.pos += 0.25; place(); }
  });
  place();
  watchView(svg, (v) => {
    cancelAnimationFrame(raf);
    if (v && !reduced()) { last = 0; raf = requestAnimationFrame(frame); }
  });
}
