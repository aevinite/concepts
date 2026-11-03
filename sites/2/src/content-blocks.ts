// HTML blocks built from shared/content.ts, reused by the tour cards, the side sheet and the
// product pages. Every fact on the page passes through here; nothing is typed by hand.
import { COMPANY, FOUNDERS, WORK, type Film, type Screen } from "@shared/content";
import { esc, previewTV, stations, ICON } from "./core/ui";

type Product = { id: string; name: string; href: string; kind: string; line: string; headline: string; sub: string; status: string; film: Film; screens: readonly Screen[] };
export type WorkItem = (typeof WORK)[number];

export const people = (p: Product, cls = "") => `<ul class="people ${cls}">${p.screens
  .map(
    (s) => `<li class="person">
      <button class="person__shot" type="button" data-img="${s.img}" data-alt="${esc(`${p.name}: the ${s.who.toLowerCase()} screen`)}" data-cap="${esc(`${s.who}. ${s.line}`)}" aria-label="Open the ${esc(s.who.toLowerCase())} screen larger">
        <img src="${s.img}" alt="${esc(`${p.name}, ${s.who.toLowerCase()} screen`)}" width="1280" height="560" loading="lazy" decoding="async">
      </button>
      <div class="person__t"><b>${esc(s.who)}</b><p>${esc(s.line)}</p></div>
    </li>`,
  )
  .join("")}</ul>`;

export const productBody = (p: Product, base = "") => `
  <p class="kind mono">${esc(p.kind)}</p>
  <h2 class="h2">${esc(p.headline)}</h2>
  <p class="lede">${esc(p.sub)}</p>
  ${previewTV(p.film)}
  ${stations(p.film, "line--card")}
  <h3 class="mini">Everyone gets their own screen</h3>
  ${people(p)}
  <div class="card__foot"><span class="status"><i aria-hidden="true"></i>${esc(p.status)}</span><a class="btn" href="${base}${p.href}">Visit ${esc(p.name)} ${ICON.arrow}</a></div>`;

export const aboutBody = () => `
  <h2 class="h2">Made in Ahmedabad by the people you talk to.</h2>
  <p class="lede">${esc(COMPANY.pitch)}</p>
  <p>${esc(COMPANY.meaning)}</p>
  <dl class="facts">
    <div><dt class="mono">Founded</dt><dd>${COMPANY.foundedLabel}, as ${COMPANY.formerName}</dd></div>
    <div><dt class="mono">Renamed</dt><dd>Aevinite, ${COMPANY.renamedLabel}</dd></div>
    <div><dt class="mono">Address</dt><dd>${COMPANY.city}, ${COMPANY.region}, ${COMPANY.country}</dd></div>
  </dl>
  <ul class="founders">${FOUNDERS.map(
    (f, i) => `<li class="founder">
      <span class="founder__fig fig--${i}" aria-hidden="true"><i></i></span>
      <div><p class="founder__name">${esc(f.name)}</p><p class="mono founder__role">${esc(f.role)}</p><p>${esc(f.bio)}</p>
      <p class="founder__links"><a href="${f.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="${f.instagram}" target="_blank" rel="noopener">Instagram</a></p></div>
    </li>`,
  ).join("")}</ul>`;

export const workBody = (w: WorkItem) => {
  const video = "video" in w ? w.video : "";
  return `
  <p class="kind mono">${esc(w.category)}</p>
  <h2 class="h2">${esc(w.title)}</h2>
  <p class="lede">${esc(w.desc)}</p>
  ${video ? `<div class="tv tv--plain"><video class="tv__v" muted playsinline loop preload="none" poster="${w.images[0]}" data-src="${video}" aria-label="${esc(w.title)} scroll demo"></video></div>` : ""}
  <div class="shots">${w.images
    .map((src, i) => `<button class="shot" type="button" data-img="${src}" data-alt="${esc(`${w.title}, screenshot ${i + 1}`)}" data-cap="${esc(w.title)}" aria-label="Open screenshot ${i + 1} larger"><img src="${src}" alt="${esc(`${w.title}, screenshot ${i + 1}`)}" width="1600" height="900" loading="lazy" decoding="async"></button>`)
    .join("")}</div>
  <p class="parts"><span class="mono">Parts</span> ${w.tech.map(esc).join(" · ")}</p>
  ${w.link ? `<a class="btn" href="${w.link}" ${w.link.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${w.link.startsWith("http") ? `Open it live ${ICON.ext}` : `See it ${ICON.arrow}`}</a>` : ""}`;
};

export const contactButtons = () => `
  <div class="post-btns">
    <a class="btn btn--wa js-post" href="${COMPANY.whatsapp}" target="_blank" rel="noopener">${ICON.wa}<span>Message us on WhatsApp</span></a>
    <a class="btn btn--ghost" href="mailto:${COMPANY.email}">${ICON.mail}<span>${COMPANY.email}</span></a>
    <a class="btn btn--ghost" href="${COMPANY.phoneHref}">${ICON.phone}<span>${COMPANY.phoneDisplay}</span></a>
  </div>`;
