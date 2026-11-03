// Every fact the ten concepts are allowed to say, written ONCE. Copied from aevinite.com
// (src/lib/company.ts, src/data/*, the /aevidine and /campus pages) on 2026-11-03.
// RULE: a concept may re-word for its theme, but never invent a number, a client, a quote or a
// testimonial. If a concept needs a fact that isn't here, it doesn't say it.

/** Absolute URL of a shared media file (films, screenshots, logos). */
export const media = (path: string) => `${import.meta.env.VITE_MEDIA_BASE ?? "/concepts/media/"}${path.replace(/^\//, "")}`;

export const COMPANY = {
  name: "Aevinite",
  line: "We help businesses grow.",
  meaning: "Aevinite comes from Aevum, a dimension of existence with a beginning but no end, and echoes Infinite, the company's first name. The beginning with no end.",
  formerName: "Infinite",
  foundedLabel: "28 July 2024",
  foundedYear: 2024,
  renamedLabel: "16 June 2026",
  city: "Ahmedabad",
  region: "Gujarat",
  country: "India",
  email: "rishi@aevinite.com",
  phoneDisplay: "+91 90997 23703",
  phoneHref: "tel:+919099723703",
  whatsapp: "https://wa.me/919099723703?text=Hi%20Aevinite%2C%20I%27d%20like%20to%20talk%20about%20a%20project.",
  instagram: "https://www.instagram.com/aevinite/",
  linkedin: "https://www.linkedin.com/company/aevinite/",
  github: "https://github.com/aevinite",
  medium: "https://medium.com/@aevinite",
  facebook: "https://www.facebook.com/61595132492927",
  site: "https://www.aevinite.com",
  /** Short honest pitch, usable as a hero sub-line. */
  pitch: "Websites, software and automation built around how your business really works. Made in-house in Ahmedabad by the people you talk to.",
} as const;

export const FOUNDERS = [
  {
    name: "Rishi Nakrani",
    role: "Founder",
    bio: "Started the company as Infinite in Ahmedabad on 28 July 2024 and led its rename to Aevinite in June 2026. Leads Aevinite and is the first person new clients talk to.",
    linkedin: "https://www.linkedin.com/in/rishinakrani/",
    instagram: "https://www.instagram.com/rishi._.nakrani/",
  },
  {
    name: "Jenish Patel",
    role: "Co-Founder",
    bio: "Co-founded Aevinite and works alongside Rishi helping businesses grow through the websites, software and automation the company delivers.",
    linkedin: "https://www.linkedin.com/in/jenish-patel-a5608a398/",
    instagram: "https://www.instagram.com/jenish.16/",
  },
] as const;

/** Honest numbers only. Do NOT add client counts, revenue, ratings or "projects delivered". */
export const NUMBERS = [
  { value: 2, label: "Products of our own", count: true },
  { value: 11, label: "App screens across them", count: true },
  { value: 5, label: "Things we build for you", count: true },
  { value: 2024, label: "Founded in Ahmedabad", count: false },
] as const;

/** Who we build for (rotating words in heroes). */
export const FOR_WHOM = ["restaurants", "schools", "hospitals", "brands", "events", "your business"] as const;

export const MARQUEE = ["Websites", "Custom software", "Automation", "AI integration", "3D web", "Restaurant tech", "Apps", "Dashboards"] as const;

export const SERVICES = [
  { title: "Websites & apps", tag: "Concept to launch", desc: "Fast, polished websites and web apps, built around your workflow and found on Google.", items: ["Company websites", "Web apps", "Mobile-first", "Local SEO"] },
  { title: "Custom software", tag: "Shaped around you", desc: "Software that fits how your business already runs: bookings, billing, dashboards and internal tools.", items: ["Dashboards", "Billing", "Admin panels", "Multi-branch"] },
  { title: "Automation & AI", tag: "Unblock your team", desc: "We map your operations and hand the repetitive work to automation, with AI where it turns data into decisions.", items: ["Workflow automation", "AI assistants", "Reports that write themselves", "Integrations"] },
  { title: "3D & immersive web", tag: "Make it unforgettable", desc: "Interactive 3D products, scroll stories and AR previews that people remember and share.", items: ["3D product views", "AR", "Scroll stories", "WebGL"] },
  { title: "Cloud & growth systems", tag: "Built to scale", desc: "Backends and cloud setup that stay fast and secure as you add customers, branches and staff.", items: ["Databases", "Realtime", "Offline-ready", "Security"] },
] as const;

export const PROCESS = [
  { n: "01", title: "Identify", desc: "We find the bottlenecks, the slow handovers and the missed opportunities." },
  { n: "02", title: "Improve", desc: "We fix what slows you down, with systems designed around how you really work." },
  { n: "03", title: "Automate", desc: "We take the repetitive work off your team's plate, so it runs on its own." },
  { n: "04", title: "Scale", desc: "You grow on systems built to last, without hiring for every new task." },
] as const;

export type Chapter = { label: string; t: number };
export type Film = { id: string; title: string; length: string; src: string; poster: string; preview?: string; description: string; chapters?: Chapter[] };

export const FILM_CREDIT = "Music by Sascha Ende at ende.app (CC BY 4.0)";

export const FILMS = {
  onePlatform: {
    id: "one-platform",
    title: "Aevidine: one platform for the whole restaurant",
    length: "1 min 14 s",
    src: media("films/aevidine-one-platform.mp4"),
    preview: media("films/aevidine-preview.mp4"),
    poster: media("films/aevidine-one-platform.jpg"),
    description: "From paper tickets to one system: the guest orders by QR code, the kitchen gets the KOT, every table shows its status live, and the owner sees the day.",
    chapters: [
      { label: "The problem", t: 0 },
      { label: "Guests order", t: 24.5 },
      { label: "Kitchen", t: 37.5 },
      { label: "Every table, live", t: 42 },
      { label: "Bill and GST", t: 55.5 },
      { label: "Owner", t: 58 },
    ],
  },
  guestMenu: {
    id: "guest-menu",
    title: "Aevidine guest menu: from the QR code on the table to the kitchen",
    length: "3 min 24 s",
    src: media("films/aevidine-guest-menu.mp4"),
    poster: media("films/aevidine-guest-menu.jpg"),
    description: "The guest scans the QR sticker, browses the menu with search and filters, opens each dish with its allergens, sees it in 3D, and orders; the allergy note reaches the kitchen ticket. Six languages.",
  },
  campus: {
    id: "campus-7-10-bus",
    title: "Campus Conveyance: the 7:10 bus",
    length: "1 min 26 s",
    src: media("films/campus-7-10-bus.mp4"),
    preview: media("films/campus-preview.mp4"),
    poster: media("films/campus-7-10-bus.jpg"),
    description: "One school morning by the clock: a student books her seat and pays by UPI, the driver's phone becomes the live bus, a parent gets \"your bus is 10 minutes away\", a QR scan at the door tells the family the child is on board, and the college, the agency and the admin each see their part.",
    chapters: [
      { label: "Where is the bus?", t: 0 },
      { label: "Book and pay", t: 23 },
      { label: "Live bus", t: 35.5 },
      { label: "On board", t: 50 },
      { label: "College", t: 58.5 },
      { label: "Agency", t: 67.5 },
      { label: "Admin", t: 74 },
    ],
  },
  /** Four more Campus Conveyance films (same series as "The 7:10 bus"). No chapters. */
  campusFollowThePin: { id: "follow-the-pin", title: "Campus Conveyance: follow the pin", length: "1 min 21 s", src: media("films/campus-extra/02-follow-the-pin.mp4"), poster: media("films/campus-extra/02-follow-the-pin.jpg"), description: "Follow one bus pin across the city, from the driver going online to the stop." },
  campusTwoMornings: { id: "two-mornings", title: "Campus Conveyance: two mornings", length: "1 min 5 s", src: media("films/campus-extra/05-two-mornings.mp4"), poster: media("films/campus-extra/05-two-mornings.jpg"), description: "The same school morning, without the app and with it." },
  campusMissionControl: { id: "mission-control", title: "Campus Conveyance: mission control", length: "52 s", src: media("films/campus-extra/08-mission-control.mp4"), poster: media("films/campus-extra/08-mission-control.jpg"), description: "The agency's view: every bus, route and rider on one screen." },
  campusOneRide: { id: "one-ride-one-shot", title: "Campus Conveyance: one ride, one shot", length: "52 s", src: media("films/campus-extra/10-one-ride-one-shot.mp4"), poster: media("films/campus-extra/10-one-ride-one-shot.jpg"), description: "One ride from booking to boarding, in a single take." },
} satisfies Record<string, Film>;

export type Screen = { who: string; line: string; img: string };

export const PRODUCTS = [
  {
    id: "aevidine",
    name: "Aevidine",
    href: "aevidine/",
    color: "gold",
    mark: media("aevinite-mark.webp"),
    kind: "Restaurant software",
    line: "QR ordering, kitchen screen and KOT, live tables, GST bills and owner reports, in one system.",
    headline: "Aevidine runs the whole restaurant.",
    sub: "QR ordering at the table, the kitchen screen and KOT printing, live tables, GST bills and the owner's reports. One system instead of six different things.",
    status: "Live at its first restaurant",
    film: FILMS.onePlatform,
    extraFilms: [FILMS.guestMenu],
    screens: [
      { who: "Guest", line: "Scans the QR on the table and orders from their own phone. No app to download.", img: media("films/aevidine-screens/guest.webp") },
      { who: "Kitchen", line: "Gets every order the moment it's placed, on the kitchen screen and as a printed KOT.", img: media("films/aevidine-screens/kitchen.webp") },
      { who: "Waiter", line: "Sees every table live: new order, cooking, served, bill still open.", img: media("films/aevidine-screens/waiter.webp") },
      { who: "Manager", line: "Runs the floor and the day's bills. GST is worked out on every bill.", img: media("films/aevidine-screens/manager.webp") },
      { who: "Owner", line: "Sees the day's sales and reports live, from anywhere.", img: media("films/aevidine-screens/owner.webp") },
    ] as Screen[],
    panels: [
      { who: "Guests", title: "QR code menu and ordering", text: "Guests scan the QR code on their table and order from their phone. No app to download: the menu opens in the browser, with categories, search, veg and non-veg filters, and a page for every dish with photos, price and nutrition." },
      { who: "Kitchen", title: "Kitchen screen and KOT printing", text: "Every order reaches the kitchen the moment it is placed, as a KOT (kitchen order ticket) on the kitchen screen and on the kitchen printer, so nothing is lost between the table and the cook." },
      { who: "Waiters", title: "Waiter tablet", text: "Waiters take orders at the table, see which tables are busy, move orders and close bills from a tablet or phone." },
      { who: "Managers", title: "Manager panel", text: "Managers edit the menu, prices and categories, and run the floor and the day's bills." },
      { who: "Owner", title: "Owner reports", text: "The owner sees sales, bills and how the day is going, from anywhere, with daily reports and GST summaries." },
    ],
    features: [
      "QR code ordering at the table",
      "Kitchen screen and KOT printing",
      "Table management for waiters",
      "Bills, GST invoices and discounts",
      "Daily sales and owner reports",
      "Keeps working on a weak or lost internet connection",
      "Live updates on every screen",
      "Each restaurant's own name, colours and branding",
      "Menu in more than one language",
      "Optional 3D view of dishes",
    ],
    faq: [
      { q: "What is Aevidine?", a: "Aevidine is restaurant management software. Guests order from a QR code menu at the table; the kitchen receives each order as a KOT on a screen and a printer; waiters, managers and the owner run tables, bills and reports from their own screens." },
      { q: "Do guests need to download an app?", a: "No. Guests scan the QR code on the table and the menu opens in their phone's browser." },
      { q: "Does Aevidine print KOTs and bills?", a: "Yes. Orders print as KOTs (kitchen order tickets) in the kitchen, and bills and GST invoices print at the counter." },
      { q: "What happens if the internet goes down?", a: "The screens keep working. Orders taken while offline are saved and sent as soon as the connection is back." },
      { q: "Where is Aevidine available?", a: "Aevidine is built in Ahmedabad and is available to restaurants, cafés and bakeries across India." },
      { q: "How much does Aevidine cost, and can I see a demo?", a: "Pricing depends on the restaurant. For a free demo and a quote, email rishi@aevinite.com or call or WhatsApp +91 90997 23703." },
    ],
  },
  {
    id: "campus",
    name: "Campus Conveyance",
    href: "campus/",
    color: "amber",
    mark: media("campus-mark.webp"),
    kind: "Student transport app",
    line: "Book a seat, pay by UPI, watch the bus live, and know the moment your child is on board.",
    headline: "Every school ride, on one screen.",
    sub: "Students and parents book and pay, the driver's phone becomes the live bus, a QR scan at the door tells the family, and the college, the transport agency and the admin each see their part.",
    status: "Built for the web and Android",
    film: FILMS.campus,
    extraFilms: [FILMS.campusFollowThePin, FILMS.campusTwoMornings, FILMS.campusMissionControl, FILMS.campusOneRide],
    screens: [
      { who: "Student", line: "Picks her college, route and seat, pays by UPI, and carries her pass as a QR code.", img: media("films/campus-screens/student.webp") },
      { who: "Parent", line: "Gets \"your bus is 10 minutes away\", and a notice the second the child boards.", img: media("films/campus-screens/parent.webp") },
      { who: "Driver", line: "Goes online and their phone becomes the bus, live on every map. Scans passes at the door.", img: media("films/campus-screens/driver.webp") },
      { who: "College", line: "Watches every bus on its way to campus, with every rider and route.", img: media("films/campus-screens/college.webp") },
      { who: "Agency", line: "Runs the whole fleet: routes, buses, riders, bookings, refunds and every rupee.", img: media("films/campus-screens/agency.webp") },
      { who: "Admin", line: "Checks every payment before a seat is confirmed.", img: media("films/campus-screens/admin.webp") },
    ] as Screen[],
    panels: [
      { who: "Students and parents", title: "Book, pay, track", text: "Pick the college, the route and the stop, choose a seat and pay by UPI. The pass is a QR code on the phone. Parents can book for more than one child, and get \"your bus is 10 minutes away\"." },
      { who: "Drivers", title: "The phone becomes the bus", text: "The driver goes online and the bus shows up live on every map. At the door, the driver scans each pass, and the family is told the child is on board." },
      { who: "Schools and colleges", title: "Every bus coming in", text: "The college sees every bus on its way to campus, with its riders and routes, without calling anyone." },
      { who: "Transport agencies", title: "The whole fleet on one screen", text: "Routes, buses, drivers, riders, bookings, refunds and revenue. The agency assigns each rider to a bus and can move a route to another bus." },
      { who: "Admin", title: "Every payment, checked", text: "Each UPI payment is checked before a seat is confirmed, and an agency's badge appears only after its proof is checked." },
    ],
    features: [
      "Seat booking by college, route and stop",
      "UPI payment, checked before the seat is confirmed",
      "Live bus location from the driver's phone, no GPS box",
      "\"Your bus is 10 minutes away\" alerts",
      "QR pass scanned at the bus door",
      "Parents told the moment the child boards",
      "One parent, more than one child",
      "A college view of every bus coming in",
      "Fleet, routes, riders and refunds for agencies",
      "Routes on Indian maps",
      "Aadhaar kept as the last 4 digits only",
      "Web app and Android app",
    ],
    faq: [
      { q: "What is Campus Conveyance?", a: "Campus Conveyance is a student transport app. Students and parents book a seat on a school or college bus and pay by UPI, watch the bus live on a map, and are told when the child boards. Drivers, colleges, transport agencies and an admin each have their own panel." },
      { q: "How do parents know the child is on the bus?", a: "Every rider has a QR pass. The driver scans it at the bus door, and the parent gets a notice on their phone at that moment." },
      { q: "Does the bus need a GPS device?", a: "No. The driver's phone shares the bus's live location while the driver is online, so there is no hardware to buy or fit." },
      { q: "How do students pay?", a: "By UPI, inside the app. The payment is checked before the seat is confirmed, and refunds are handled by the transport agency." },
      { q: "Is it available now? Can I see a demo?", a: "It runs on the web and on Android, and is ready for its first schools, colleges and transport agencies in Ahmedabad and Gandhinagar. For a free demo, email rishi@aevinite.com or call or WhatsApp +91 90997 23703." },
    ],
  },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];
export const productById = (id: ProductId) => PRODUCTS.find((p) => p.id === id)!;

/** Client and studio work besides the two products. Images are real screenshots. */
export const WORK = [
  {
    id: "hospital-website",
    title: "Multispeciality Hospital Website",
    category: "Healthcare website",
    tech: ["Next.js", "Supabase", "Tailwind", "SEO"],
    desc: "A trust-first website for a multispeciality hospital: departments, doctor profiles, OPD timings and an always-visible way to book an appointment.",
    images: [media("projects/hospital/1-hero.webp"), media("projects/hospital/2-section.webp"), media("projects/hospital/3-section.webp")],
    link: "",
  },
  {
    id: "dish-explorer-4d",
    title: "4D Dish Explorer",
    category: "3D web experience",
    tech: ["Next.js", "Three.js", "model-viewer", "AR"],
    desc: "Every signature dish as a real 3D model: rotate it, zoom in, read the ingredients pinned onto it, and place it on your own table in AR before you order.",
    images: [media("projects/aevidine-3d/3d-waffle.webp"), media("projects/aevidine-3d/3d-croissant.webp")],
    link: "",
  },
  {
    id: "hackjudge",
    title: "HackJudge",
    category: "Hackathon platform",
    tech: ["Next.js", "Supabase", "Tailwind"],
    desc: "Run a hackathon end to end: events, teams, judges, scoring against your own criteria, and a live leaderboard you publish when you're ready.",
    images: [media("projects/hackathon/1-landing.webp"), media("projects/hackathon/3-users.webp"), media("projects/hackathon/2-leaderboard.webp"), media("projects/hackathon/4-create.webp")],
    link: "https://hacathon-1301.vercel.app/",
  },
  {
    id: "sweet-bites",
    title: "Sweet Bites",
    category: "3D scroll story",
    tech: ["Next.js", "Three.js", "GSAP", "WebGL"],
    desc: "A bakery kiosk modelled in 3D; scrolling moves the camera around it, one beat of the story per section. What we do for product brands.",
    images: [media("projects/sweet-bites/poster.webp")],
    video: media("projects/sweet-bites/scroll-demo.mp4"),
    link: "https://3-d-demo-webiste.vercel.app/",
  },
  {
    id: "aevidine-menu",
    title: "Aevidine guest menu",
    category: "Restaurant platform",
    tech: ["Next.js", "Supabase", "Realtime"],
    desc: "The menu guests open from the QR code on the table: live categories, search, veg and non-veg filters, and a page for every dish.",
    images: [media("projects/aevidine/1-home.webp"), media("projects/aevidine/2-grid.webp"), media("projects/aevidine/3-desserts.webp"), media("projects/aevidine/4-dish.webp")],
    link: "aevidine/",
  },
] as const;

export const NAV = [
  { label: "Aevidine", href: "aevidine/" },
  { label: "Campus", href: "campus/" },
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
] as const;
