# Aevinite: ten concepts — the plan

The owner asked for ten completely different, fully working versions of aevinite.com, each
crazy, premium and above all **fun**: someone reading about Aevinite should be entertained
while they learn. Each one has a light world and a dark world that are two different places,
not a colour swap. They will be compared side by side; the winner becomes aevinite.com.

- Concepts live at `aevinite.github.io/concepts/<n>/` (1–10), plus `/11/` (the site before
  31 Oct 2026) and `/12/` (the current aevinite.com), and a hub at `/concepts/`.
- Later the chosen one moves to aevinite.com and subdomains are added.

---

## Part A — the rules every concept follows

### A1. Pages and content (all real, from `shared/content.ts`)
Each concept is three pages minimum: `/` (home), `/aevidine/`, `/campus/`.
Every fact comes from `shared/content.ts`. You may re-word headlines to fit your concept's
world ("Today's specials" for services in a kitchen concept), but **never invent** a number, a
client name, a testimonial, a rating, an award or a quote. No "10+ clients", no "trusted by",
no star ratings. If it isn't in content.ts, it isn't on the page.

The home page must contain, in an order that suits the concept:
1. **Hero**: Aevinite, "We help businesses grow." and who for (`FOR_WHOM`). The hero has the
   concept's signature moment, the thing people remember.
2. **The two products**: Aevidine and Campus Conveyance, each with its film (preview loop
   + full film with sound + chapter buttons that jump to a moment), and its screens per person.
3. **Services** (5, `SERVICES`), **Process** (4, `PROCESS`), **Work** (`WORK`, real screenshots,
   Sweet Bites has a video), **Numbers** (`NUMBERS`, honest only), **About** (the founders, the
   meaning of the name, Ahmedabad, founded 28 July 2024 as Infinite), **Contact**.
4. **Contact** = WhatsApp button, email, phone, socials. No form (no personal data is collected,
   so no privacy page is needed).
5. **Footer**: nav, socials, `FILM_CREDIT` (the music credit must appear on any page with a film
   that plays with sound), © 2026 Aevinite, Ahmedabad.

Product pages (`/aevidine/`, `/campus/`): hero in the product's colour, the main film with chapters,
extra films (`extraFilms`), every person's screen (`screens`), the panels (`panels`), features,
FAQ (`faq`), a call to action, and a way back home. Same concept world as the home page.

Product colours: Aevidine = **gold**, Campus = **amber**, Aevinite = the concept's own brand colour.
Each concept tunes these to its palette, but Aevidine reads gold-ish and Campus amber-ish.

### A2. Light and dark are two different worlds
- **Light is the default, always.** The OS setting is never read. The toggle sits **top right**,
  fixed, always reachable, ≥ 44 px tap target, `aria-label`, keyboard-operable. Each concept
  designs its own toggle as an object from its world (a light switch, a kite string, a record
  sleeve flip…) and its own switch animation.
- Light = professional, calm, premium, but still playful. Dark = the same site gone wild.
- The two worlds differ in: background imagery/texture, the hero scene, the ambient effects,
  often the display typeface, the motion personality, sometimes the signature toy itself.
  Content and structure stay the same.
- Use `shared/theme.ts` (`initTheme(n)`, `setTheme`, `onTheme`) and put the pre-paint line from
  its header comment in every page's `<head>` (with your concept number), so dark never flashes
  light on reload.

### A3. Fun is the brief
- One **signature toy** in the hero, plus **at least three more** playful interactions spread
  through the page. Each must work with a mouse AND a finger.
- Reading must stay easy: every toy has a plain, readable result. A visitor who doesn't play
  still gets every fact. Never hide content behind a game without a "just show me" path.
- Motion explains, delights, rewards. One hero motion per view; the rest supports it.
- Little rewards: a counter that rolls, a sound you can switch on, a hidden easter egg.
- Sound is always **off by default**, with a visible sound toggle; never autoplay audio.

### A4. It must not look generated (the owner's "vibe-coded" list)
Never: purple + black, decorative radial glow orbs, dot-grid backgrounds (unless they ARE the
concept's imagery, like a blueprint), glass blur on everything, three identical cards in a row,
bento grids, rainbow gradients, the same corner radius on every element, bouncing arrows,
sparkle icons, emojis in the UI, ✓ checkmark bullet lists, Inter / Geist / Space Grotesk,
pure `#fff` page backgrounds, heavy drop shadows.
Copy: **no em dashes (—) in any visible text**, no "seamless / elevate / unlock / supercharge /
effortless / cutting-edge / next-level", no "It's not X, it's Y", no fake testimonials.
Layout follows the content (5 services, 4 steps, 5 or 6 screens), never a template grid.
Every concept looks like a person with taste spent a month on it: a real type scale, real
spacing rhythm, details that reward a second look.

### A5. Phones are first-class
- 390 px wide must look designed, not squeezed. No sideways scroll, ever.
- Every hover effect has a touch equivalent. Drag toys work with touch (pointer events,
  `touch-action` set correctly so the page can still scroll).
- Heavy scenes (WebGL, physics) get a lighter phone version if needed, never a broken one.

### A6. Speed and care
- Animate transform and opacity. Pause every `requestAnimationFrame` loop and video when off
  screen or when the tab is hidden. Cap WebGL pixel ratio at 2 (1.5 on phones).
- Films: `muted playsinline loop` previews start only when in view; full films use
  `preload="none"` (or metadata) and a poster; one film plays at a time.
- `prefers-reduced-motion`: big motion becomes fades or still frames; toys still work.
- Images: `loading="lazy"`, real `alt` text, width/height set to avoid jumping.
- Semantic HTML: one `h1` per page, real `<button>`s, visible focus rings, contrast ≥ 4.5:1.
- No network requests outside the site: no CDNs, no Google Fonts, no remote images.
  Fonts come from the installed `@fontsource` packages (`import "@fontsource/bangers"` in your TS).
  Libraries available: `gsap` (every plugin is free: ScrollTrigger, SplitText, Flip, Draggable,
  InertiaPlugin, MorphSVGPlugin, DrawSVGPlugin, Observer, MotionPathPlugin, ScrambleTextPlugin,
  Physics2DPlugin, CustomEase…), `lenis`, `three`, `matter-js`. No new npm packages.
- Every page `<head>`: `<meta name="robots" content="noindex">` (these are drafts; they must not
  compete with aevinite.com on Google), a title `Aevinite · Concept <n> · <Name>`, a description,
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
  `theme-color`, and a favicon (draw an SVG favicon in your concept's style).
- Call `conceptBadge(n, "<Name>")` from `shared/badge.ts` on every page (bottom-left tag back to
  the hub). Keep your own UI clear of the bottom-left 80×44 px corner.

### A7. How a concept is built (engineering contract)
- Only write inside `sites/<n>/`. Never edit `shared/`, `scripts/`, `media/`, `package.json`,
  `vite.config.ts`, or another concept's folder. If you need something shared, say so in your report.
- Structure: `sites/<n>/index.html`, `sites/<n>/aevidine/index.html`, `sites/<n>/campus/index.html`,
  `sites/<n>/src/…` (TypeScript), optional `sites/<n>/public/` (copied as is).
- Import shared code with `@shared/content`, `@shared/theme`, `@shared/badge`.
  Media paths always through `media()` or the URLs already in content.ts.
- Links between pages are **relative** (`aevidine/`, `../`, `../campus/`), because the base path
  changes when the winner moves to aevinite.com.
- Vanilla TypeScript + GSAP/three/matter as needed. No framework.
- Check your work yourself, by looking:
  - `SITE=<n> npx vite build --logLevel warn` must pass.
  - `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "sites/<n>/"` must print nothing.
  - `node scripts/look.mjs <n>` (add `--page aevidine/` or `--page campus/`, `--theme`, `--device`,
    `--steps`) starts the dev server, screenshots light + dark, laptop + phone while scrolling,
    lists page errors and sideways scroll, and stops the server. **Open the screenshots with
    the Read tool and judge them like a demanding art director.** Iterate until they are great.
  - For clicks and drags, write a throwaway Playwright script in `shots/<n>/` (gitignored) using
    `import { startDev } from "../../scripts/dev-server.mjs"`; always `await s.close()`.
  - Never leave a server running. Never start anything in the background.

---

## Part B — the ten concepts

Each is a different world, a different technology, a different kind of fun.

| # | Name | World | Main technology | Light | Dark |
|---|---|---|---|---|---|
| 1 | Patang | Ahmedabad's kite festival | Canvas 2D, GSAP | Uttarayan day sky over pol rooftops | Uttarayan night, rising tukkal lanterns |
| 2 | Tiny Town | A miniature 3D Ahmedabad | three.js | Clay diorama, sunny morning | The town at night, every window lit |
| 3 | AevOS | The site is an operating system | DOM windows, Draggable | 1-bit classic desktop | Amber phosphor workstation |
| 4 | Big Type | Kinetic typography | Variable fonts, SplitText | Swiss poster | Chrome type on a stage, liquid distortion |
| 5 | Panels | A comic book | SVG, halftone, GSAP | Sunday colour comic | Noir graphic novel in the rain |
| 6 | The Pass | A kitchen's ticket rail | DOM + GSAP, paper physics | Café counter, thermal receipts | The line at 9 pm, heat lamps |
| 7 | Drafting Table | Engineering drawings that come alive | matter-js | Blueprint on drafting paper | A pinball machine you can play |
| 8 | Ink | Fluid you paint with | WebGL fluid simulation | Ebru marbling on paper | Bioluminescent sea at night |
| 9 | Saap Sidi | Snakes and ladders | DOM board, 3D CSS dice | Hand-painted Moksha Patam cloth | Diwali night, glow board and diyas |
| 10 | Side A | A record label | Video scrubbing, 3D CSS | Record shop, crate digging | Club night, two decks and a crossfader |

---

### 1 · Patang — "Every business deserves to fly."
Ahmedabad's biggest day is Uttarayan, 14 January: the whole city on its rooftops, the sky full of
kites. The company is from here; the site flies.

**Signature toy (hero):** you fly a kite. The kite follows the pointer/finger on a string from the
bottom of the screen, with real string physics (verlet rope, wind gusts). Other kites drift in
the sky; each carries a word from `FOR_WHOM` on its tail. Cross your string with one and it gets
**cut** ("Kai po che!" in big hand-lettered type, the kite tumbles away spinning) and the rotating
hero word changes to the one it carried. Score of kites cut in a corner, like a rooftop tally.

**More toys:** services are five kites tied to a rooftop manja (string) line; tap one to launch it
and it opens the service card as it climbs. Process = the four stages of a kite launch (hold, lift,
climb, soar) drawn as one continuous string path that draws itself on scroll. Work = kites caught
on a neem tree, each with a project screenshot on the sail; shake the tree. Numbers on fluttering
paper flags (pataka) on a string across the section. Footer = a fireworks-free sunset of rooftops.

**Light — "Uttarayan day":** warm morning sky (cream to pale saffron, not a rainbow), pol house
rooftops in silhouette with water tanks and railings at the bottom, people-shaped silhouettes on
roofs, kites in brand colours (deep indigo, saffron, vermilion, leaf green, Aevidine gold, Campus
amber), clean paper-white content cards that feel like kite paper (slightly translucent, crisp
creases). Type: `Baloo Bhai 2` display (it has Gujarati: put a small Gujarati line like
"ઉત્તરાયણ" as decoration), `Hind Vadodara` body.
**Dark — "Uttarayan night":** deep night sky (ink blue, not purple), the city lights below,
**tukkal**: paper lanterns tied in chains to kite strings, glowing warm and rising; the hero
kite becomes a lantern kite that lights the text it passes. Cutting a string releases a lantern
that floats up and becomes a star. Display type switches to `Rozha One`.

**Products:** Aevidine = a rooftop restaurant terrace scene; Campus = a kite whose string is the
bus route on a map of the city. Each film plays on a kite-paper frame that flutters gently.

---

### 2 · Tiny Town — "A whole town that runs on our software."
A miniature 3D town (built in code: boxes, cylinders, extruded shapes, no downloaded models).
On scroll, the camera tours it like a drone over a model railway.

**Signature toy (hero):** the town assembles itself from falling blocks when the page opens
(buildings drop in and bounce, trees pop up, roads roll out). Then you can **drag to spin** the
whole diorama on its round base, and **click any building** to fly the camera in.

**Buildings:** Aevidine's restaurant (open front, tables with tiny QR stands, a kitchen with a
ticket printer that spits a tiny paper ticket on a loop, a waiter that walks between tables);
the college with Campus buses that **drive the road loop** and stop at a bus stop where a
student blob waits, a QR flash on boarding; the Aevinite studio HQ (Ahmedabad) with two little
figures (the founders) at desks; a hospital (the hospital website), a bakery kiosk (Sweet Bites),
a hackathon hall (HackJudge). Each building = a project/section. Clicking opens a side sheet
(bottom sheet on phones) with the real content, screenshots and film.

**Scroll story:** hero (whole town) → restaurant close-up (Aevidine) → follow a bus (Campus) →
studio (About) → zoom out to the "map" (Services as districts, Process as the road being built
in four stages) → contact = the town's post office; tap it and a paper plane flies to WhatsApp.

**Light — "Clay morning":** matte clay materials (`MeshStandardMaterial` roughness 1), warm sun,
soft shadows, tilt-shift depth of field feeling (blur top and bottom via CSS mask overlay), off-
white sky. Type: `Bricolage Grotesque` (variable, use its optical size / width).
**Dark — "Night shift":** same town at night: emissive windows, street lamps casting pools of
light, bus headlights sweeping, a moon, a few fireflies, the kitchen glowing warm. Display type
`Gloock` serif. A day/night toggle literally swings the sun under the horizon and the moon up.

**Phones:** lower poly count, no shadows, one-finger orbit, two-finger page scroll guard
(use a "tap to play with the town" layer so the page scroll never gets trapped).

---

### 3 · AevOS — "Aevinite, the operating system."
The whole site is a computer. On desktop it is a desktop; on phones it becomes a phone home screen.

**Signature toy:** a boot sequence (2 s max, skippable, only on first visit per session):
"AevOS" splash with a progress bar, then the desktop. Every section is an **app or a file**:
- `About Aevinite.txt` in a text editor window (typewriter-reveals itself).
- `Aevidine.app` and `Campus.app` open a **media player** window playing the film, with the
  chapters as a playlist; plus a "Screens" photo viewer with each person's screenshot.
- `Work` folder in a file browser window: each project a file icon; double click opens a preview.
- `Services` = a Control Panel with five panels; `Process` = an installer wizard
  ("Step 2 of 4: Improve" with Next/Back buttons and a progress bar).
- `Numbers` = a system monitor app with counters and live little graphs.
- `Mail` = contact (compose window pre-filled, the Send button opens WhatsApp or email).
- A Trash can (drag things into it; they come back with "nothing is ever really deleted").
- A tiny game: **Bug Sweeper** (Minesweeper rules, 8×8, bugs instead of mines). Win screen
  says "Zero bugs shipped".
Windows drag (GSAP Draggable), focus on click, minimise to a dock, close, open with a genie
scale animation. Desktop icons can be rearranged. Everything also reachable from a top menu
bar (keyboard accessible). There is a "Read as a normal page" button in the menu bar that opens
all content in one long document window, for people who don't want to play.

**Light — "System 1-bit":** pure 1-bit black and white (off-white `#f2f0e9` paper, near-black),
dithered images (canvas Floyd–Steinberg dithering of the real screenshots and film posters; the
film itself plays in colour when you press play, framed in 1-bit chrome), pixel fonts
`Silkscreen` (titles) + `Pixelify Sans` (UI), striped title bars, checkerboard desktop pattern
(it IS the imagery), chunky pixel cursor.
**Dark — "Amber phosphor":** the same OS on an amber monochrome CRT workstation at night:
`VT323` font, amber on near-black, scanlines, slight screen curvature vignette, phosphor glow
trail on moving windows, a power-on flicker when you switch to dark. Not a command-line:
still windows and icons, rendered in amber.

**Phones:** a phone home screen (status bar with real time, app icon grid, dock). Apps open
full screen with a zoom from the icon, swipe down or a back button closes them. Same apps.

---

### 4 · Big Type — "WE HELP BUSINESSES GROW." (and you can watch them grow)
Typography is the whole design. Huge words, perfect grid, motion driven by scroll and pointer.

**Signature toy (hero):** "GROW" set gigantic in the variable font `Anybody` (width 50–150,
weight 100–900). Letters swell with pointer proximity (each letter's width/weight follows
distance to the pointer, spring-smoothed), and **scroll velocity stretches the whole line**
(fast scroll = ultra-wide, stop = springs back). Drag a letter up and it grows taller.

**More toys:** **"Grow your name"**: an input, type your business name, and it's set as a poster
that grows from thin to heavy, with your name repeated in a staggered grid; a button saves it
as a PNG (canvas render). Services = five words on five lines, each line stretches to full width
as it passes the centre of the screen (scroll-scrubbed); hover/tap a word to reveal its items.
Process = 01→04 giant numerals that morph into each other (SplitText chars, scramble).
Marquee lines that tilt with scroll velocity. Numbers count up in a monospace with tabular
figures. Work = project names as huge type; hovering reveals the screenshot masked INSIDE the
letters (CSS `background-clip: text` with the image).

**Light — "Swiss poster":** International Typographic Style: warm paper white, black, and one
signal red; strict 12-column grid with visible fine rules, flush-left ragged-right text, numbers
in the margin, tiny captions in `JetBrains Mono`. Rigour that suddenly moves.
**Dark — "Stage":** black stage, type in a polished chrome look (layered text gradients done
with restraint, a moving specular highlight following the pointer), an SVG `feTurbulence` +
`feDisplacementMap` liquid wobble on the hero that reacts to scroll speed, heavy weight
`Unbounded` for display. A spotlight beam follows the pointer.

**Phones:** device tilt (with permission button on iOS) or touch position drives the letter
widths; type sizes in `vw`/`clamp`, never overflowing.

---

### 5 · Panels — "The adventures of Aevinite."
The site is a comic book. You read it panel by panel; the stories are real.

**Signature toy (hero):** the cover of issue #1: "AEVINITE: We help businesses grow!" with a
price tag ("₹0, free issue"), a barcode, the logo in a burst. Click/tap the cover and it **opens
like a real comic** (3D page turn), revealing page 1.

**Stories (drawn in SVG/CSS with real screenshots inside drawn phone/laptop frames):**
- "**The Friday Night Rush**" (Aevidine): a packed restaurant, a lost paper KOT, the owner
  panicking; then the QR menu, the kitchen screen, the waiter tablet, the bill with GST, the
  owner relaxed checking sales at home. Panels animate in on scroll (pop with slight overshoot),
  speech bubbles type in, SFX lettering ("DING!" for a new order, "KA-CHUNK" for the KOT
  printer). The film plays inside a TV in one panel; chapter buttons styled as caption boxes.
- "**The 7:10 Bus**" (Campus): a parent at the window at 7:05, "where is the bus?", then the
  live bus, "10 minutes away", the QR scan beep, "She's on board!". Film in a panel.
- **Services** = "Meet the team of powers": five hero cards (each service a superpower with
  its items as abilities), flip on tap.
- **Process** = four-panel strip: Identify, Improve, Automate, Scale.
- **Work** = "Previous issues": back-issue covers for each project.
- **About** = "The origin story" (Infinite, 2024, Ahmedabad, rename 2026, the founders).
- **Contact** = the "letters page": "Write to us!" with WhatsApp / email.
Click any panel to get a "POW / ZAP / BAM" burst with a tiny screen shake (rate limited).

**Light — "Sunday colour":** newsprint-yellow paper with fibres, CMYK halftone (Ben-Day dots)
shading done with SVG patterns, bold black inks, bright primaries tuned not to be garish,
`Bangers` for SFX/titles, `Kalam` handwriting for bubbles.
**Dark — "Noir":** the same pages redrawn as a noir graphic novel: heavy blacks, white ink,
one spot colour (amber), screentone instead of colour, **rain** falling across the page
(canvas streaks), lightning flash on theme switch, captions in `Special Elite` typewriter.

**Phones:** one panel per screen, swipe/scroll vertically like a webtoon.

---

### 6 · The Pass — "Order up."
"The pass" is the counter where finished plates leave the kitchen. The whole site is a kitchen
ticket system, which is exactly what Aevidine replaces.

**Signature toy (hero):** a **thermal printer**. The page opens with it printing the hero as a
receipt: "AEVINITE · TABLE 01 · We help businesses grow." line by line with the printer's
little jerks, then the paper curls. You can **pull the receipt** (drag down, it unrolls with
physics) and **tear it off** at the serrated edge; torn tickets fly onto a rail at the top.

**Ordering the site:** the nav is a **menu card**: "Starters (About), Mains (Products), Chef's
specials (Services), The bill (Contact)". Choosing an item prints that section as a KOT ticket
and the page scrolls to it. Services are dishes with "ingredients" (the items) and "prep time".
Process = a 4-station kitchen line (Identify = prep, Improve = cook, Automate = plate, Scale =
serve), a plate slides station to station on scroll. Work = tickets pinned on a ticket rail;
pull one down to read it. Numbers = a till with rolling digits. Contact = **the bill**: an
itemised receipt of what you get ("1 × Website, 1 × Honest advice, Service charge: none"),
with "Pay" = WhatsApp. A desk bell you can ring (sound only if sound is on).
**Spike:** drag a finished ticket onto the order spike and it gets spiked with a satisfying thunk.

**Light — "Café counter, 10 am":** white-ish thermal paper (warm, not #fff) on a stainless
steel counter (subtle brushed texture in CSS), blue rubber-stamp marks ("PAID", "SERVED")
stamped as you scroll, receipts in `Courier Prime`, headings in `Fraunces` (soft, warm).
**Dark — "The line, 9 pm":** the kitchen at rush hour: heat lamps casting orange cones of light
on tickets that sway on the rail, steam curling up (canvas), the printer LED blinking, tickets
coming in faster, `Rubik Mono One` headings stencilled like kitchen labels. The theme switch is
a heat-lamp pull cord.

**Products:** Aevidine section shows the real kitchen screen film inside a wall-mounted
monitor in the scene; Campus = a "today's specials" chalkboard flipped into a bus timetable
board (split-flap departures board: "7:10 · Route 4 · ON TIME"), with its film.

---

### 7 · Drafting Table — "Engineered to grow."
Every section is a technical drawing on a drafting table. Things are physical (matter-js).

**Signature toy (hero):** the word **AEVINITE** is built from physical letter blocks resting on a
drawn shelf. Pull the "release" lever (or press the big button) and the shelf drops; letters
tumble with real physics. Drag and throw them; they bounce off the drawing's dimension lines.
A "reassemble" button flies them back into place (tweened to their home positions).

**More toys:** **Process** is a machine: four gears labelled Identify, Improve, Automate, Scale;
scrolling turns the crank and the gears drive each other; each gear that turns lights its step.
**Services** are five parts in an exploded-view assembly drawing that assembles on scroll
(callout lines with numbered balloons, like a real parts drawing). **Numbers** are measured
with dimension arrows that draw themselves. **Work** = drawing sheets in a flat file drawer:
pull a drawer to slide a sheet out (the screenshot inside a title block with "Drawn by
Aevinite, Scale 1:1, Sheet 3 of 5"). Contact = a stamped approval block, "Approved for growth".

**Light — "Blueprint":** drafting paper (warm off-white with a fine blue grid, it is the
imagery), blue and graphite linework, hand-lettered technical captions in `JetBrains Mono`,
titles in `Barlow Condensed`, everything annotated with leader lines and measurements.
**Dark — "Pinball":** the drawing comes alive as a **playable pinball machine**: the hero is a
pinball table (matter-js) where the five bumpers are the five services (hit one: it lights up,
scores, and shows that service), flippers on ← → keys / left-right screen halves on phones,
a backglass scoreboard with `Bungee` / `Bungee Shade` lettering, lamps that flash in sequence,
chasing lights around sections. Content sections below become pinball "playfield inserts".

**Phones:** smaller physics worlds, big flipper touch zones, everything still readable.

---

### 8 · Ink — "Make your mark."
A real-time WebGL fluid simulation fills the page background; the pointer is a brush.

**Signature toy (hero):** move/drag anywhere and you push ink through water. The hero title
"We help businesses grow." is printed on top, and the ink flows around the letters (the text
is an obstacle in the simulation, or the ink is masked to avoid it). Tap = a drop of pigment.
A palette of three pigments to choose from (brand colours).

**More toys:** scrolling stirs the fluid (scroll velocity adds a combing force, the way Ebru
artists drag a comb through the bath to make patterns). Each section enters as a "print" pulled
off the bath (a paper sheet peels upward revealing the content printed with the marbling
pattern as its border). Products: the films sit in frames of marbled paper. **"Marble your
card"**: a button captures the current fluid as a unique business card with "Aevinite · We help
businesses grow" and lets you save it as a PNG. Services: five pigment jars; tap a jar to drop
its colour into the bath and read the service. Process: four stages of making an Ebru print.

**Light — "Ebru":** cream marbling paper, pigments in indigo, saffron, terracotta, sap green,
gold; sharp elegant serif `Cormorant Garamond` with `Manrope` body; generous margins, very
calm and luxurious. The simulation renders as opaque pigment on paper (subtractive look).
**Dark — "Bioluminescence":** night sea: near-black teal water, the fluid becomes glowing
plankton (additive, cyan/teal/amber light), little sparks trail the pointer, slow drifting
particles; display type `Syne` wide. Theme switch = a wave sweeping across.

**Phones:** lower simulation resolution, touch drag paints; scroll still works (paint only
with a deliberate drag on the hero, or a "paint" toggle; never trap scrolling).

---

### 9 · Saap Sidi — "Climb the ladders. We'll handle the snakes."
Snakes and ladders was invented in India (Moksha Patam). Growth = ladders; business problems =
snakes; Aevinite = the one who tames snakes.

**Signature toy (hero):** a real playable board (10×10, 100 squares). A big 3D CSS **die**: tap
to roll (it tumbles in 3D and lands on the true number). Your token (the Aevinite infinity mark)
hops square by square. **Ladders** are labelled with what we do ("Website found on Google",
"Kitchen gets every order", "Parents see the bus live"…) and climbing one opens a card with that
service or product. **Snakes** are real problems ("Lost paper KOT", "Where is the bus?", "Bills
by hand", "Nobody finds your shop online") and landing on one doesn't drop you: the snake gets
**tamed** (it turns into a ladder with a little animation) and shows how we solve it. Reaching
100 = "You grew!" and a confetti of tiny kites and diyas (theme dependent), plus the contact card.
"**Skip the game, show me everything**" button always visible: it scrolls to the normal page.

**Below the board** the regular sections are styled as game cards / rule booklet pages:
"Rules of growth" (Process as numbered rules), "Players" (founders), "Expansion packs"
(Aevidine, Campus with films and screens), "Previous games" (Work).

**Light — "Painted cloth":** the traditional hand-painted board look: cloth texture, Indian
miniature palette (vermilion, indigo, ochre, leaf green, ivory), decorative borders
(SVG patterns), snakes and ladders drawn as illustrations, `Yatra One` display, `Martel` body.
**Dark — "Diwali night":** the board glows: squares outlined in warm light, snakes in glowing
scales, diyas (oil lamps) flickering along the borders, rangoli patterns that draw themselves
in light as you scroll, `Rozha One` headings. Win = fireworks of light.

**Phones:** the board fits the width (squares ~37 px), die button big at the bottom, cards
open as bottom sheets.

---

### 10 · Side A — "Aevinite Records. Hits for businesses."
A record label. Every project is a release; the films are on vinyl.

**Signature toy (hero):** a turntable with a record on it. **Spin the record with your
finger or mouse to scrub the film** (drag rotation maps to `video.currentTime`; let go and it
spins up to normal speed with inertia; scratch back and forth). The tonearm swings in when you
press play. The label in the middle is the Aevinite mark.

**More toys:** the **Crate**: a crate of record sleeves (3D CSS), flick through them with drag/
swipe/wheel; the sleeves are the products and projects with their real screenshots as cover
art; pull one out to see its "liner notes" (description, tech as credits: "Produced by
Aevinite, Next.js on drums"). **Tracklist** = the film chapters ("A1 The problem 0:00, A2
Guests order 0:24…"); click a track to drop the needle there. Services = a **B-side
tracklist** with durations. Process = a 4-track EP. Numbers on a VU meter that swings up.
Contact = "Book us for a show" (WhatsApp).

**Light — "Record shop, Saturday afternoon":** cardboard and paper textures, warm shop light,
sleeve art grids, price stickers, `Fraunces` with soft optical sizes, `Archivo` (use its width
axis) for track lists. Calm, tactile, premium.
**Dark — "Club night":** **two decks and a crossfader**: Aevidine's film on deck A, Campus's on
deck B; drag the crossfader to blend between them (video opacity + audio volume). VU meters,
strobing beat-synced light bars along the section edges (subtle, not seizure-level, and off
for reduced motion), smoke-like noise in the light beams, `Archivo Black` headings. The theme
switch is the record sleeve flipping to Side B.

**Phones:** one deck at a time with a swipe to switch decks; the crossfader becomes a big
slider; spin-to-scrub still works with a finger.

---

## Part C — order of work and checking
- Concepts are built one at a time or a few side by side, each in its own folder.
- Every concept is screenshotted in light and dark, laptop and phone, on all three pages, and
  checked for errors and sideways scroll before it counts as done.
- After all ten: a hub page lists all twelve (1–10, 11 = the old site, 12 = the current site),
  then everything is published to `aevinite.github.io/concepts/`.
