// The 3D CSS die. Six real faces (opposite faces add up to 7, like every die), tumbled with GSAP
// to land on the number the fair roll picked. It never fakes the face: the cube's final rotation
// is computed from the number, so what you see is what you rolled.
import { gsap, reduced } from "./util";
import { rattle, land } from "./sound";

const PIPS: Record<number, number[]> = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Cube rotation (x, y in degrees) that brings each face to the front.
const FACE: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] };

export const dieHTML = (cls = "") => `<div class="die ${cls}" aria-hidden="true">
  <div class="die__shadow"></div>
  <div class="die__toss"><div class="die__cube">
    ${[1, 2, 3, 4, 5, 6].map((n) => `<div class="die__f die__f--${n}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i + 1) ? "on" : ""}"></i>`).join("")}</div>`).join("")}
    <div class="die__core"></div>
  </div></div>
</div>`;

export class Die {
  cube: HTMLElement; toss: HTMLElement; shadow: HTMLElement;
  rx = -18; ry = 24; rz = 0; value = 1; busy = false;
  constructor(public el: HTMLElement) {
    this.cube = el.querySelector(".die__cube")!;
    this.toss = el.querySelector(".die__toss")!;
    this.shadow = el.querySelector(".die__shadow")!;
    this.rx = -16; this.ry = 22;
    gsap.set(this.cube, { rotationX: this.rx, rotationY: this.ry });
  }
  /** Idle pose: a slight tilt so it reads as a cube, showing the current face mostly front-on. */
  rest() {
    const [fx, fy] = FACE[this.value];
    this.rx = fx - 14; this.ry = fy + 18;
    gsap.to(this.cube, { rotationX: this.rx, rotationY: this.ry, duration: 0.5, ease: "power2.out" });
  }
  /** Tumble and land on `n`. Resolves when it is still. */
  roll(n: number): Promise<void> {
    this.value = n;
    const [fx, fy] = FACE[n];
    const spinX = 360 * (2 + Math.floor(Math.random() * 2)), spinY = 360 * (1 + Math.floor(Math.random() * 2));
    // Land exactly on the face (plus whole turns), then settle with a little natural twist.
    const toX = Math.ceil((this.rx + spinX - fx) / 360) * 360 + fx - 11;
    const toY = Math.ceil((this.ry + spinY - fy) / 360) * 360 + fy + 14;
    const twist = (Math.random() - 0.5) * 24;
    this.rx = toX; this.ry = toY;
    if (reduced()) {
      gsap.set(this.cube, { rotationX: toX, rotationY: toY });
      gsap.set(this.toss, { rotationZ: twist });
      gsap.fromTo(this.el, { opacity: 0.35 }, { opacity: 1, duration: 0.25 });
      land();
      return new Promise((r) => setTimeout(r, 260));
    }
    rattle(700);
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: () => { land(); resolve(); } });
      tl.to(this.toss, { y: -90, scale: 1.12, rotationZ: (Math.random() - 0.5) * 120, duration: 0.42, ease: "power2.out" }, 0)
        .to(this.toss, { y: 0, scale: 1, duration: 0.6, ease: "bounce.out" }, 0.42)
        .to(this.toss, { rotationZ: twist, duration: 0.7, ease: "power3.out" }, 0.42)
        .to(this.cube, { rotationX: toX, rotationY: toY, duration: 1.0, ease: "power3.out" }, 0)
        .to(this.shadow, { scale: 0.55, opacity: 0.35, duration: 0.42, ease: "power2.out" }, 0)
        .to(this.shadow, { scale: 1, opacity: 1, duration: 0.6, ease: "bounce.out" }, 0.42);
    });
  }
}
