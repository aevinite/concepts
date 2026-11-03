// What is on the board. Ladders are things Aevinite builds; snakes are business problems in plain
// words. Every card's text comes from shared/content.ts (re-worded only where the board needs a
// short label). A snake never drops you here: it is tamed, turns into a ladder and lifts you.
import { SERVICES, PRODUCTS } from "@shared/content";

const [AV, CC] = PRODUCTS;
const faq = (p: (typeof PRODUCTS)[number], start: string) => p.faq.find((q) => q.q.startsWith(start))!.a;

export type Card = {
  /** Short label painted on the board. */
  label: string;
  /** Who or what the card is about ("Aevidine · Kitchen", "Service"). */
  from: string;
  title: string;
  text: string;
  items?: readonly string[];
  href: string;
  hrefLabel: string;
  tone: "aev" | "gold" | "amber";
};

export type Ladder = Card & { kind: "ladder"; id: string; from_sq: number; to_sq: number; labelAt?: number; labelNudge?: [number, number] };
export type Snake = Card & { kind: "snake"; id: string; head: number; tail: number; tamedTo: number; seed: number; bend?: number; labelNudge?: [number, number] };

const svc = (i: number) => SERVICES[i];
const panel = (p: (typeof PRODUCTS)[number], i: number) => p.panels[i];

export const LADDERS: Ladder[] = [
  { kind: "ladder", id: "l-guest", from_sq: 3, to_sq: 24, label: "Guests order from their phone", from: "Aevidine · Guests", title: panel(AV, 0).title, text: panel(AV, 0).text, href: "aevidine/", hrefLabel: "Open the Aevidine pack", tone: "gold" },
  { kind: "ladder", id: "l-tables", from_sq: 8, to_sq: 31, label: "Every table, live", from: "Aevidine · Waiters", title: panel(AV, 2).title, text: `${panel(AV, 2).text} ${AV.screens[2].line}`, href: "aevidine/", hrefLabel: "Open the Aevidine pack", tone: "gold" },
  { kind: "ladder", id: "l-custom", from_sq: 14, to_sq: 36, label: "Software shaped around you", from: "What we build", title: svc(1).title, text: svc(1).desc, items: svc(1).items, href: "#services", hrefLabel: "All five things we build", tone: "aev" },
  { kind: "ladder", id: "l-book", from_sq: 20, to_sq: 40, label: "Book a seat, pay by UPI", from: "Campus Conveyance · Students and parents", title: panel(CC, 0).title, text: panel(CC, 0).text, href: "campus/", hrefLabel: "Open the Campus pack", tone: "amber" },
  { kind: "ladder", id: "l-3d", from_sq: 28, to_sq: 55, label: "Dishes you can turn in 3D", from: "What we build", title: svc(3).title, text: svc(3).desc, items: svc(3).items, href: "#work", hrefLabel: "See the 4D Dish Explorer", tone: "aev" },
  { kind: "ladder", id: "l-college", from_sq: 44, to_sq: 65, label: "The college sees every bus", from: "Campus Conveyance · Colleges", title: panel(CC, 2).title, text: panel(CC, 2).text, href: "campus/", hrefLabel: "Open the Campus pack", tone: "amber" },
  { kind: "ladder", id: "l-scale", from_sq: 51, to_sq: 75, label: "Stays fast as you grow", from: "What we build", title: svc(4).title, text: svc(4).desc, items: svc(4).items, href: "#services", hrefLabel: "All five things we build", tone: "aev" },
  { kind: "ladder", id: "l-owner", from_sq: 63, to_sq: 86, label: "The owner sees the day", from: "Aevidine · Owner", title: panel(AV, 4).title, text: panel(AV, 4).text, href: "aevidine/", hrefLabel: "Open the Aevidine pack", tone: "gold" },
  { kind: "ladder", id: "l-fleet", from_sq: 71, to_sq: 94, label: "The whole fleet on one screen", from: "Campus Conveyance · Agencies", title: panel(CC, 3).title, text: panel(CC, 3).text, href: "campus/", hrefLabel: "Open the Campus pack", tone: "amber" },
  { kind: "ladder", id: "l-pay", from_sq: 84, to_sq: 99, label: "Every payment, checked", from: "Campus Conveyance · Admin", title: panel(CC, 4).title, text: panel(CC, 4).text, href: "campus/", hrefLabel: "Open the Campus pack", tone: "amber" },
];

export const SNAKES: Snake[] = [
  { kind: "snake", id: "s-online", head: 22, tail: 5, tamedTo: 42, seed: 3, label: "Nobody finds your shop online", from: "Tamed by: Websites & apps", title: svc(0).title, text: svc(0).desc, items: svc(0).items, href: "#services", hrefLabel: "All five things we build", tone: "aev" },
  { kind: "snake", id: "s-kot", head: 34, tail: 12, tamedTo: 54, seed: 6, label: "Lost paper KOT", from: "Tamed by: Aevidine · Kitchen", title: panel(AV, 1).title, text: panel(AV, 1).text, href: "aevidine/", hrefLabel: "Open the Aevidine pack", tone: "gold" },
  { kind: "snake", id: "s-bus", head: 49, tail: 11, tamedTo: 69, seed: 1, bend: 0.8, label: "Where is the bus?", from: "Tamed by: Campus Conveyance · Drivers", title: panel(CC, 1).title, text: `${panel(CC, 1).text} ${faq(CC, "Does the bus need")}`, href: "campus/", hrefLabel: "Open the Campus pack", tone: "amber" },
  { kind: "snake", id: "s-bills", head: 58, tail: 37, tamedTo: 78, seed: 4, label: "Bills by hand", from: "Tamed by: Aevidine · Managers", title: "Bills, GST invoices and discounts", text: `${AV.screens[3].line} ${faq(AV, "Does Aevidine print")}`, href: "aevidine/", hrefLabel: "Open the Aevidine pack", tone: "gold" },
  { kind: "snake", id: "s-report", head: 67, tail: 33, tamedTo: 87, seed: 2, bend: 0.85, label: "Same report, typed every night", from: "Tamed by: Automation & AI", title: svc(2).title, text: svc(2).desc, items: svc(2).items, href: "#services", hrefLabel: "All five things we build", tone: "aev" },
  { kind: "snake", id: "s-offline", head: 79, tail: 60, tamedTo: 98, seed: 5, label: "The internet drops mid-rush", from: "Tamed by: Aevidine", title: "Keeps working on a weak or lost internet connection", text: faq(AV, "What happens if"), href: "aevidine/", hrefLabel: "Open the Aevidine pack", tone: "gold" },
  { kind: "snake", id: "s-child", head: 97, tail: 76, tamedTo: 100, seed: 7, label: "Is my child on the bus?", from: "Tamed by: Campus Conveyance", title: "Parents told the moment the child boards", text: faq(CC, "How do parents"), href: "campus/", hrefLabel: "Open the Campus pack", tone: "amber" },
];

export const SNAKE_COLORS = ["leaf", "indigo", "verm", "ochre", "teal", "maroon", "olive"] as const;
