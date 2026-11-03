// The AevOS start-up screen. Once per browser session, at most ~1.5 s, skippable with any key,
// a click or a tap. Light: a 1-bit "happy computer" splash. Dark: a quick amber start-up log.
import gsap from "gsap";
import { media, PRODUCTS } from "@shared/content";
import { getTheme } from "@shared/theme";
import { h, reduced } from "./dom";
import { ditherCanvas } from "./dither";
import { sfx } from "./sound";

export function boot(done: () => void) {
  let seen = false;
  try { seen = sessionStorage.getItem("aev3-booted") === "1"; sessionStorage.setItem("aev3-booted", "1"); } catch { /* private */ }
  if (seen) { done(); return; }

  const dark = getTheme() === "dark";
  const fill = h("i", { class: "boot-fill" });
  const log = h("pre", { class: "boot-log", "aria-hidden": "true" });
  const skip = h("button", { type: "button", class: "boot-skip" }, "Skip");
  const el = h("div", { class: "boot", role: "progressbar", "aria-label": "AevOS is starting", "aria-valuemin": "0", "aria-valuemax": "100" },
    dark ? log : h("div", { class: "boot-logo" }, ditherCanvas(media("logo-transparent.png"), 200)),
    h("p", { class: "boot-name" }, "AevOS"),
    h("p", { class: "boot-sub" }, "Aevinite, as an operating system"),
    h("div", { class: "boot-bar" }, fill),
    h("p", { class: "boot-hint" }, "Press any key to skip"),
    skip);
  document.body.append(el);

  let finished = false;
  const tl = gsap.timeline();
  const finish = () => {
    if (finished) return;
    finished = true;
    tl.kill();
    removeEventListener("keydown", finish);
    el.removeEventListener("pointerdown", finish);
    gsap.to(el, { opacity: 0, duration: reduced() ? 0 : 0.18, onComplete: () => el.remove() });
    done();
  };
  addEventListener("keydown", finish);
  el.addEventListener("pointerdown", finish);

  if (reduced()) { tl.to({}, { duration: 0.4 }).add(finish); return; }
  if (dark) {
    const lines = [
      "AEVINITE WORKSTATION",
      "AevOS 1.0   Ahmedabad, India",
      "",
      `Loading ${PRODUCTS[0].name} ........ ok`,
      `Loading ${PRODUCTS[1].name} ... ok`,
      "Loading desktop ............. ok",
    ];
    lines.forEach((l, i) => tl.add(() => { log.textContent += `${l}\n`; sfx.tick(); }, 0.05 + i * 0.12));
  }
  tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1.25, ease: "steps(12)" }, 0.1)
    .add(() => sfx.boot(), 1.1)
    .add(finish, 1.45);
}
