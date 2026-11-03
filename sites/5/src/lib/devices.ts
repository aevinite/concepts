// Real app screens inside drawn devices. The shared screenshots are 1280×560 film stills with the
// app on a device in the middle of a dark stage; CROPS cut out just the app so it can sit inside a
// device drawn in this comic's ink. Numbers are pixels in the 1280×560 still.
import { esc } from "./util";

type Crop = [x: number, y: number, w: number, h: number];
export const CROPS: Record<string, Crop> = {
  "aevidine-screens/guest": [830, 74, 208, 468],
  "aevidine-screens/kitchen": [604, 132, 516, 350],
  "aevidine-screens/waiter": [276, 182, 720, 378],
  "aevidine-screens/manager": [942, 96, 248, 440],
  "aevidine-screens/owner": [432, 148, 440, 248],
  "campus-screens/student": [360, 128, 200, 428],
  "campus-screens/parent": [332, 110, 216, 450],
  "campus-screens/parent-note": [680, 233, 438, 112],
  "campus-screens/driver": [234, 128, 192, 428],
  "campus-screens/college": [252, 156, 616, 392],
  "campus-screens/agency": [392, 204, 496, 356],
  "campus-screens/admin": [352, 172, 566, 388],
};

const keyOf = (src: string) => (src.match(/((?:aevidine|campus)-screens\/[\w-]+)\.webp/) ?? [])[1] ?? "";

/** An <img> cropped to one region of a still, inside a box with the crop's exact aspect ratio. */
export function cropImg(src: string, alt: string, key = keyOf(src)) {
  const c = CROPS[key] ?? [0, 0, 1280, 560];
  const [x, y, w, h] = c;
  return `<span class="crop" style="aspect-ratio:${w}/${h}"><img src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async" width="1280" height="560"
    style="width:${((1280 / w) * 100).toFixed(2)}%;left:${(-(x / w) * 100).toFixed(2)}%;top:${(-(y / h) * 100).toFixed(2)}%"></span>`;
}

export type DevKind = "phone" | "tablet" | "laptop" | "receipt" | "note";
export function device(kind: DevKind, src: string, alt: string, key?: string, cls = "") {
  const inner = cropImg(src, alt, key);
  if (kind === "laptop") return `<span class="dev dev-laptop ${cls}"><span class="dev-screen">${inner}</span><span class="dev-base" aria-hidden="true"></span></span>`;
  if (kind === "receipt") return `<span class="dev dev-receipt ${cls}">${inner}</span>`;
  if (kind === "note") return `<span class="dev dev-note ${cls}">${inner}</span>`;
  return `<span class="dev dev-${kind} ${cls}"><span class="dev-screen">${inner}</span></span>`;
}

/** Which device each person's screen lives on. */
export function deviceFor(src: string): { kind: DevKind; key?: string } {
  const k = keyOf(src);
  if (/guest|student|parent|driver/.test(k)) return { kind: "phone" };
  if (/manager/.test(k)) return { kind: "receipt" };
  if (/kitchen|waiter/.test(k)) return { kind: "tablet" };
  return { kind: "laptop" };
}
