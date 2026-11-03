// One comic panel: drawn art at the back, real devices on top, then captions, bubbles and SFX.
// Every text is real DOM text. Positions are % of the panel; type sizes use container units so a
// panel keeps its lettering in proportion from a laptop down to a 390 px phone.
import { esc } from "./util";

type Pos = string; // inline CSS, e.g. "left:4%;top:6%;width:40%"
export type PanelSpec = {
  cls?: string;
  span?: number; // desktop columns out of 6
  ard?: string; // desktop aspect ratio (only the panel that sets a row's height needs it)
  ar?: string; // phone aspect ratio
  label?: string; // what the panel shows, for screen readers
  art?: string;
  caps?: { text: string; pos: Pos; cls?: string }[];
  bubbles?: { text: string; pos: Pos; tail?: "bl" | "br" | "tl" | "tr" | "b" | "l" | "r"; think?: boolean; big?: boolean; cls?: string }[];
  sfx?: { text: string; pos: Pos; rot?: number; size?: number; sound?: string; cls?: string }[];
  devs?: { html: string; pos: Pos; cls?: string }[];
  html?: string;
};

export function panel(p: PanelSpec) {
  const style = [`--span:${p.span ?? 6}`, p.ard ? `--ard:${p.ard}` : "", p.ar ? `--ar:${p.ar}` : ""].filter(Boolean).join(";");
  return `<figure class="panel ${p.cls ?? ""}" style="${style}"${p.label ? ` aria-label="${esc(p.label)}"` : ""}>
    ${p.art ? `<div class="p-art">${p.art}</div>` : ""}
    ${(p.devs ?? []).map((d) => `<div class="p-dev ${d.cls ?? ""}" style="${d.pos}">${d.html}</div>`).join("")}
    ${p.html ?? ""}
    ${(p.sfx ?? []).map((s) => `<span class="sfx ${s.cls ?? ""}" aria-hidden="true" data-rot="${s.rot ?? -8}"${s.sound ? ` data-sfx="${s.sound}"` : ""} style="${s.pos};--fs:${s.size ?? 9}">${esc(s.text)}</span>`).join("")}
    ${(p.bubbles ?? []).map((b) => `<div class="bubble ${b.think ? "think" : `t-${b.tail ?? "bl"}`} ${b.big ? "big" : ""} ${b.cls ?? ""}" style="${b.pos}"><p class="bubble-text">${esc(b.text)}</p></div>`).join("")}
    ${(p.caps ?? []).map((c) => `<p class="cap ${c.cls ?? ""}" style="${c.pos}">${esc(c.text)}</p>`).join("")}
  </figure>`;
}

/** A row of panels laid out as a comic page. */
export const page = (panels: string[], cls = "") => `<div class="cpage ${cls}">${panels.join("")}</div>`;

/** Story title like a chapter splash. */
export function storyHead(id: string, kicker: string, title: string, sub: string, accent = "") {
  return `<header class="story-head ${accent}">
    <p class="sh-k">${esc(kicker)}</p>
    <h2 class="sh-t" id="${id}"><span>${esc(title)}</span></h2>
    <p class="sh-s">${esc(sub)}</p>
  </header>`;
}
