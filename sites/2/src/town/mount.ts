// Mounts a town (or a single-product diorama) into a stage element and wires it to the page:
// theme (day/night), sound, and the lighter phone path.
import * as THREE from "three";
import { media } from "@shared/content";
import { getTheme, onTheme } from "@shared/theme";
import { Stage } from "./stage";
import { buildTown, type Mode, type Town } from "./town";
import { play } from "../core/sound";
import { reduce } from "../core/ui";

export const liteDevice = () => matchMedia("(pointer: coarse)").matches || innerWidth < 760;

export async function mountTown(host: HTMLElement, canvas: HTMLCanvasElement, mode: Mode): Promise<{ stage: Stage; town: Town }> {
  const lite = liteDevice();
  // Shop signs are painted with the page fonts, so wait for them (but never for long).
  await Promise.race([
    Promise.all(['700 64px "Bricolage Grotesque Variable"', '400 64px "Gloock"', '600 32px "JetBrains Mono Variable"'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 1500)),
  ]);
  const stage = new Stage({ canvas, host, lite, reduce, night: getTheme() === "dark" });
  const loader = new THREE.TextureLoader();
  const tex = (path: string) => {
    if (lite) return null;
    const t = loader.load(media(path));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    stage.kit.textures.push(t);
    return t;
  };
  const town = buildTown({ kit: stage.kit, tex, sound: (n) => play(n) }, mode);
  stage.turntable.add(town.root);
  stage.pickables = town.pickables;
  stage.onFrame((dt, t) => town.update(dt, t, stage.night));
  onTheme((t) => stage.setNight(t === "dark"));
  return { stage, town };
}
