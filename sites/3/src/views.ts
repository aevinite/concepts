// Readable documents built from shared/content.ts: the "Read as a normal page" document (home)
// and the full product app (the /aevidine/ and /campus/ pages). Plain, complete, in order.
import { COMPANY, FOUNDERS, FOR_WHOM, NUMBERS, PROCESS, SERVICES, WORK, PRODUCTS, FILM_CREDIT, type Screen } from "@shared/content";
import { h, ext } from "./dom";
import { filmPlayer, filmShelf } from "./film";
import { photoViewer } from "./viewer";
import { icon } from "./icons";
import { ditherCanvas } from "./dither";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Product = (typeof PRODUCTS)[number];
export type Page = "home" | "aevidine" | "campus";

export const SOCIALS = [
  { label: "Instagram", href: COMPANY.instagram },
  { label: "LinkedIn", href: COMPANY.linkedin },
  { label: "GitHub", href: COMPANY.github },
  { label: "Medium", href: COMPANY.medium },
  { label: "Facebook", href: COMPANY.facebook },
] as const;

export const forWhomText = () => `${FOR_WHOM.slice(0, -1).join(", ")} and ${FOR_WHOM[FOR_WHOM.length - 1]}`;

/** Relative link from the current page to the home page / a product page. */
export function rel(page: Page, target: "home" | "aevidine" | "campus") {
  const pre = page === "home" ? "" : "../";
  return target === "home" ? pre || "./" : `${pre}${target}/`;
}

export function contactButtons(compact = false) {
  return h("div", { class: `cta-row${compact ? " compact" : ""}` },
    h("a", { class: "btn btn-main", href: COMPANY.whatsapp, ...ext }, h("span", { html: icon("chat", 20) }), "Chat on WhatsApp"),
    h("a", { class: "btn", href: `mailto:${COMPANY.email}` }, COMPANY.email),
    h("a", { class: "btn", href: COMPANY.phoneHref }, COMPANY.phoneDisplay));
}

export function socialLinks() {
  return h("ul", { class: "socials" }, SOCIALS.map((s) => h("li", null, h("a", { href: s.href, ...ext }, s.label))));
}

export function footer(page: Page) {
  return h("footer", { class: "doc-foot" },
    h("nav", { "aria-label": "Footer" }, h("ul", { class: "foot-nav" },
      h("li", null, h("a", { href: rel(page, "home") }, "Home")),
      h("li", null, h("a", { href: rel(page, "aevidine") }, "Aevidine")),
      h("li", null, h("a", { href: rel(page, "campus") }, "Campus Conveyance")),
      page === "home" ? [
        h("li", null, h("a", { href: "#r-work" }, "Work")),
        h("li", null, h("a", { href: "#r-services" }, "Services")),
        h("li", null, h("a", { href: "#r-contact" }, "Contact")),
      ] : null)),
    socialLinks(),
    h("p", { class: "credit" }, FILM_CREDIT),
    h("p", { class: "copy" }, `© 2026 ${COMPANY.name}, ${COMPANY.city}.`));
}

function screensList(screens: readonly Screen[], product: string) {
  return h("ul", { class: "doc-screens" }, screens.map((s) => h("li", null,
    h("figure", null,
      h("img", { src: s.img, alt: `${product}, ${s.who}'s screen`, loading: "lazy", decoding: "async", width: "1280", height: "560" }),
      h("figcaption", null, h("b", null, s.who), " ", s.line)))));
}

/** The whole home page as one plain document. */
export function readerDoc(page: Page) {
  const toc = [
    ["r-products", "Products"], ["r-services", "Services"], ["r-process", "Process"], ["r-work", "Work"],
    ["r-numbers", "Numbers"], ["r-about", "About"], ["r-contact", "Contact"],
  ];
  return h("article", { class: "doc", "aria-label": "Aevinite, as a normal page" },
    h("nav", { class: "doc-toc", "aria-label": "On this page" }, h("p", null, "Contents"),
      h("ol", null, toc.map(([id, l]) => h("li", null, h("a", { href: `#${id}` }, l))))),
    h("div", { class: "doc-body" },
      h("header", { class: "doc-hero" },
        h("p", { class: "kicker" }, `${COMPANY.name} · ${COMPANY.city}, ${COMPANY.country}`),
        h("h2", { class: "doc-h" }, COMPANY.line),
        h("p", { class: "lede" }, `For ${forWhomText()}.`),
        h("p", null, COMPANY.pitch),
        contactButtons()),

      h("section", { id: "r-products", "aria-labelledby": "rh-products" },
        h("h2", { id: "rh-products", class: "doc-h" }, "Two products of our own"),
        PRODUCTS.map((p) => h("section", { class: `doc-product tone-${p.id}`, "aria-labelledby": `rh-${p.id}` },
          h("p", { class: "kicker" }, `${p.kind} · ${p.status}`),
          h("h3", { id: `rh-${p.id}` }, p.name),
          h("p", { class: "lede" }, p.line),
          filmPlayer(p.film).el,
          h("p", { class: "film-desc" }, p.film.description),
          h("h4", null, "Every person's screen"),
          screensList(p.screens, p.name),
          h("p", null, h("a", { class: "btn", href: rel(page, p.id) }, `Everything about ${p.name}`))))),

      h("section", { id: "r-services", "aria-labelledby": "rh-services" },
        h("h2", { id: "rh-services", class: "doc-h" }, "What we build for you"),
        h("ol", { class: "doc-services" }, SERVICES.map((s, i) => h("li", null,
          h("span", { class: "n" }, String(i + 1).padStart(2, "0")),
          h("div", null, h("h3", null, s.title), h("p", { class: "tag" }, s.tag), h("p", null, s.desc),
            h("p", { class: "items" }, s.items.join(" · "))))))),

      h("section", { id: "r-process", "aria-labelledby": "rh-process" },
        h("h2", { id: "rh-process", class: "doc-h" }, "How we work, in four steps"),
        h("ol", { class: "doc-process" }, PROCESS.map((s) => h("li", null, h("span", { class: "n" }, s.n), h("div", null, h("h3", null, s.title), h("p", null, s.desc)))))),

      h("section", { id: "r-work", "aria-labelledby": "rh-work" },
        h("h2", { id: "rh-work", class: "doc-h" }, "Work"),
        WORK.map((w) => h("article", { class: "doc-work", "aria-labelledby": `rw-${w.id}` },
          h("p", { class: "kicker" }, w.category),
          h("h3", { id: `rw-${w.id}` }, w.title),
          h("p", null, w.desc),
          h("p", { class: "items" }, `Built with ${w.tech.join(", ")}`),
          "video" in w
            ? h("video", { class: "doc-media", src: w.video, poster: w.images[0], controls: true, muted: true, playsinline: true, preload: "none", width: "1600", height: "900", "aria-label": `${w.title}, scroll demo` })
            : h("div", { class: "doc-shots" }, w.images.slice(0, 2).map((src, i) => h("img", { class: "doc-media", src, alt: `${w.title}, screenshot ${i + 1}`, loading: "lazy", decoding: "async", width: "1600", height: "900" }))),
          w.link ? h("p", null, h("a", { href: w.link.startsWith("http") ? w.link : rel(page, "aevidine"), ...(w.link.startsWith("http") ? ext : {}) }, w.link.startsWith("http") ? `Open ${w.title}` : "See Aevidine")) : null))),

      h("section", { id: "r-numbers", "aria-labelledby": "rh-numbers" },
        h("h2", { id: "rh-numbers", class: "doc-h" }, "Numbers, honestly"),
        h("dl", { class: "doc-numbers" }, NUMBERS.map((n) => h("div", null, h("dt", null, n.label), h("dd", null, String(n.value)))))),

      h("section", { id: "r-about", "aria-labelledby": "rh-about" },
        h("h2", { id: "rh-about", class: "doc-h" }, "About Aevinite"),
        h("p", null, COMPANY.meaning),
        h("p", null, `Founded in ${COMPANY.city}, ${COMPANY.region}, on ${COMPANY.foundedLabel} as ${COMPANY.formerName}. Renamed ${COMPANY.name} on ${COMPANY.renamedLabel}.`),
        h("ul", { class: "doc-founders" }, FOUNDERS.map((f) => h("li", null,
          h("h3", null, f.name), h("p", { class: "tag" }, f.role), h("p", null, f.bio),
          h("p", { class: "links" }, h("a", { href: f.linkedin, ...ext }, "LinkedIn"), " · ", h("a", { href: f.instagram, ...ext }, "Instagram")))))),

      h("section", { id: "r-contact", "aria-labelledby": "rh-contact" },
        h("h2", { id: "rh-contact", class: "doc-h" }, "Talk to us"),
        h("p", null, `Message ${FOUNDERS[0].name.split(" ")[0]} on WhatsApp, write an email or call. You talk to the people who build it.`),
        contactButtons()),
      footer(page)));
}

/** The full product app: every fact of a product page, in the product's colour. */
export function productDoc(p: Product, page: Page) {
  const other = PRODUCTS.find((x) => x.id !== p.id)!;
  const sections = [
    ["p-film", "The film"], ["p-more", p.extraFilms.length > 1 ? "More films" : "Another film"], ["p-screens", "Screens"],
    ["p-panels", "Who uses what"], ["p-features", "Features"], ["p-faq", "Questions"], ["p-demo", "Get a demo"],
  ];
  const nav = h("nav", { class: "pd-nav", "aria-label": `${p.name} sections` },
    h("a", { class: "pd-home", href: rel(page, "home") }, h("span", { html: icon("folder", 20) }), "Aevinite home"),
    h("ol", null, h("li", null, h("a", { href: "#p-top", class: "cur" }, "Overview")), sections.map(([id, l]) => h("li", null, h("a", { href: `#${id}` }, l)))));

  const body = h("div", { class: "pd-body" },
    h("header", { class: "pd-hero", id: "p-top" },
      h("div", { class: "pd-hero-t" },
        h("p", { class: "kicker" }, `${p.name} · ${p.kind}`),
        h("h1", { class: "pd-h1" }, p.headline),
        h("p", { class: "lede" }, p.sub),
        h("p", { class: "pd-status" }, h("i", { "aria-hidden": "true" }), p.status),
        h("div", { class: "cta-row" },
          h("a", { class: "btn btn-main", href: COMPANY.whatsapp, ...ext }, "Ask for a free demo"),
          h("a", { class: "btn", href: "#p-film" }, "Watch the film"))),
      h("div", { class: "pd-mark" }, ditherCanvas(p.mark, 192, `${p.name} mark`))),

    h("section", { id: "p-film", "aria-labelledby": "ph-film" },
      h("h2", { id: "ph-film", class: "doc-h" }, cap(p.film.title.replace(/^[^:]+:\s*/, ""))),
      h("p", null, p.line),
      filmPlayer(p.film).el,
      h("p", { class: "film-desc" }, p.film.description)),

    h("section", { id: "p-more", "aria-labelledby": "ph-more" },
      h("h2", { id: "ph-more", class: "doc-h" }, p.extraFilms.length > 1 ? `${p.extraFilms.length} more films` : "One more film"),
      filmShelf(p.extraFilms)),

    h("section", { id: "p-screens", "aria-labelledby": "ph-screens" },
      h("h2", { id: "ph-screens", class: "doc-h" }, `${p.screens.length} people, ${p.screens.length} screens`),
      photoViewer(p.screens.map((s) => ({ img: s.img, who: s.who, line: s.line })), p.name),
      h("ul", { class: "pd-who" }, p.screens.map((s) => h("li", null, h("b", null, s.who), " ", s.line)))),

    h("section", { id: "p-panels", "aria-labelledby": "ph-panels" },
      h("h2", { id: "ph-panels", class: "doc-h" }, "Who uses what"),
      h("ol", { class: "pd-panels" }, p.panels.map((x) => h("li", null,
        h("p", { class: "kicker" }, x.who), h("h3", null, x.title), h("p", null, x.text))))),

    h("section", { id: "p-features", "aria-labelledby": "ph-features" },
      h("h2", { id: "ph-features", class: "doc-h" }, "What it does"),
      h("ol", { class: "pd-features" }, p.features.map((f, i) => h("li", null, h("span", { class: "n" }, String(i + 1).padStart(2, "0")), h("span", null, f))))),

    h("section", { id: "p-faq", "aria-labelledby": "ph-faq" },
      h("h2", { id: "ph-faq", class: "doc-h" }, "Questions"),
      h("div", { class: "pd-faq" }, p.faq.map((q, i) => h("details", { open: i === 0 }, h("summary", null, q.q), h("p", null, q.a))))),

    h("section", { id: "p-demo", class: "pd-demo", "aria-labelledby": "ph-demo" },
      h("h2", { id: "ph-demo", class: "doc-h" }, `See ${p.name} working`),
      h("p", null, `For a free demo, message us on WhatsApp, email ${COMPANY.email} or call ${COMPANY.phoneDisplay}.`),
      contactButtons(),
      h("p", { class: "pd-also" }, "Also from Aevinite: ", h("a", { href: rel(page, other.id) }, `${other.name}, ${other.kind.toLowerCase()}`), ". ",
        h("a", { href: rel(page, "home") }, "Back to the Aevinite desktop"), ".")),
    footer(page));

  const root = h("div", { class: `pd tone-${p.id}` }, nav, body);
  // scroll-spy for the side list
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("ol a"));
  const targets = links.map((a) => body.querySelector<HTMLElement>(a.getAttribute("href")!)).filter(Boolean) as HTMLElement[];
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("cur", a.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  targets.forEach((t) => io.observe(t));
  return root;
}
