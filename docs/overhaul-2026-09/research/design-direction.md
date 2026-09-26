# Design direction for the learning surfaces: "Werkzeichnung"

Calm paper, precise ink, one red pencil. This takes the Workshop 03 deck's visual language onto the web: courses hub, course landings, workshops hub and detail, demos hub and detail, and the static workshop materials.

Date: 2026-09-26. Scope: visual system and layout. Copy de-slopping is a separate stream; section 11 covers only UI-label rules.

---

## 0. Summary (the ten decisions)

1. **Adopt the deck palette as the site palette on learning surfaces.** Kalkweiß `#f3f0e9` ground, Druckschwarz `#121212` ink, Schiefer `#4f4640` secondary text, and Mennige `#b73a15` as the only accent. This replaces the risograph set (acid, sky, pink, peach, cobalt, teal), the blue-black `#19232d` ink and the indigo `#242342` dark sections.
2. **Use graphit `#141414` only as a band.** The workshop cover band (globe right, cut off, as in the deck) and the footer. There are no dark cards inside paper grids.
3. **Build structure from lines, not boxes.** Two line weights: a 2px ink "Kopflinie" above section heads, and 1px Leinen hairlines between rows. Boxes are kept for things you act on or objects the deck draws as boxes: the question card, the decision lab, previews. A bordered box never sits inside another bordered box.
4. **Let type carry the hierarchy.** Loehrning Sans, which is the same grotesk family as the deck's Typing (verified by rendering both). Headlines are 700 weight, sentence case, tracked -0.01 to -0.015em; the current -0.04 to -0.07em and `font-black` go. Labels are sentence case, 600 weight, +0.02em. Mono appears only for data: file names, code, IDs and timestamps.
5. **Square geometry everywhere (radius 0),** as in the deck (`border-radius: 0 !important` in `lib/tokens.css`). No pills.
6. **Flat.** Elevation comes from surface tone: paper, then a raised sheet `#f9f7f2`, then a recessed Beton `#e5e4e2`. Shadows are reserved for overlays such as menus and dialogs. Offset "stamp" shadows are removed everywhere, including the static HTML materials.
7. **Draw with the deck's pictograms and encodings.** Square line icons with miter joins and filled square details. Hatch means raw or unapproved, solid ink means approved, slate means the database check, and dashed means a known gap. Green (`#205b46`) always comes with its icon and a word. Previews are drawings, not fake app windows.
8. **One "Route" component serves as agenda, path and stepper.** Square stations on a 2px line (future stations outlined, past filled, the current one filled with an inset square), taken directly from `story.css` `.route`.
9. **Show the final state first.** Pages and instruments render the end state without JS; motion is an optional replay. Motion is causal, 120 to 560ms, uses the deck's ease-out `cubic-bezier(0.16,1,0.3,1)`, and runs in one region at a time.
10. **Allow at most one Mennige group per viewport section.** That means one filled Mennige button per page and one Mennige mark per drawing. Everything else is ink.

---

## 1. Research: what calm and precise looks like in 2025-2026

### 1.1 Method and limits

- Sources were WebSearch results plus WebFetch where the egress proxy allowed it. Only GitHub-hosted pages could be fetched. Direct fetches of stripe.press, linear.app, vercel.com, anthropic.com/academy.claude.com, frontendmasters.com, pudding.cool, ciechanow.ski, dev.to, logrocket, smoothui.dev and 925studios.co were **blocked**. The descriptions of those sites below therefore come from search-result summaries and the publishers' own articles as indexed, not from first-hand inspection. None of the external pages could be looked at visually.
- First-hand material: the Workshop 03 deck (CSS read in full, 18 scene screenshots taken), the current site (7 before-screenshots plus source), and the Hallmark anti-pattern reference on GitHub (read in full).

### 1.2 Reference sites: what each does, what we take, what we leave

| Reference | What it does (as reported) | Take | Leave |
|---|---|---|---|
| **Stripe Press** | A near-black ground; each book rendered as a physical 3D object. Small serif labels, a whisper-quiet wordmark, a tiny vertical index at the edge. Covers are generative and tactile. | Treat each **workshop cover as the object**: the hub shows real deck covers the way Stripe shows books. A quiet numbered index (01-04). The dark ground is used only where the object lives. | Three.js scroll carousels. Serif. |
| **Linear** (2024 redesign, March 2026 "calmer interface" refresh) | Themes built from three variables (base, accent, contrast) in LCH. The 2026 refresh moved from cool blue-grey to **warmer, less saturated greys**. It dimmed the sidebar so the content stands out, used **fewer and smaller icons**, removed coloured icon backgrounds, and let borders and separators carry structure. | Three-variable colour thinking (paper, ink, Mennige). Dim chrome with loud content. Fewer icons. Separators over containers. | Dark-first. The gradient and glass look of "Linear-style" imitators. |
| **Vercel Geist** | Monochrome foundation, one functional accent, a systematic grey scale. Geist Mono for technical data. 12/6/4-column grid, generous whitespace. | Mono only for data. A strict 12-column grid. One accent. | Pure `#000`/`#fff` (Hallmark flags pure black and white as synthetic). Blueprint grid backgrounds. |
| **anthropic.com / brand** | Slate `#141413` on ivory `#faf9f5`, **no gradients**, a single clay accent "only at moments of action". Muted accent swatches appear only on specific sub-pages. Styrene display with Tiempos body. The brand skill lists `#141413`, `#faf9f5`, `#b0aea5`, `#e8e6dc` and the accent `#d97757`. | A warm ivory ground with near-black ink. **The accent appears only at an action moment.** Everything else is quiet. | Serif body text: the deck is a grotesk, and the owner likes the deck. |
| **Anthropic Academy** (courses) | 14 free courses in **3 tracks** (AI fluency, product, developer). Each course has a title, a short description and a level or time, and ends in a quiz. | Organise courses in a few named tracks with plain metadata. Fewer, sharper courses. | Nothing to leave; it is plain. |
| **Observable Framework** | The default theme is described as "theme-less": it sets layout and typography and leaves colour to the author. Notebooks put prose next to live cells. | Typography first, colour last. Explanation sits beside the instrument. | Notebook chrome. |
| **Brilliant** | Roughly 15-minute interactive problem sets, a visible branching path showing where you are, heavy gamification (XP, streaks). | A visible path (our Route). Attempt before explanation, which is already the site's Commit, Test, Revise grammar. | XP, streaks, badges: already banned by `konto/page.test.tsx`. |
| **Maven** | The landing hero states who the course is for and what changes. The **syllabus is synced from the real course structure**, and people who read the syllabus convert 5x more. | Put the agenda (the Route) high on the workshop detail page, generated from the deck's own scene list so it cannot drift. | Cohort sales framing. |
| **Reforge Artifacts** | Real work artefacts (templates, examples) as the unit of value. | "You leave with" names a **concrete file**, e.g. the five-field template, and links to it. | Nothing to leave. |
| **Frontend Masters** | Learning paths are ordered course lists with the total time shown. Course pages list lessons with durations. | An ordered list with total time. Plain rows. | Dense marketing cards. |
| **Josh Comeau (Joy of React, CSS for JS)** | A custom platform that alternates illustrated explanations, short videos and exercises; hand-built interactive widgets. | Widgets are **specific to one idea** and hand-built. | Whimsy, pastel and sound. |
| **Bartosz Ciechanowski** | Long-form text with many small interactive figures. The figures support the narrative "without dominating it"; custom code with no framework; a conversational tone. | For demos: **each interactive figure answers one question**, sits inline with its prose, and keeps its controls next to it. A figure is a drawing, not a dashboard. | Nothing to leave. |
| **The Pudding** | Visual essays; scrollytelling where one chart changes as you scroll; vivid solid-colour story cards on the index. | **One chart carried through the steps** (the deck already reuses the Truth Chart in `failure-anatomy` and `resolution`). | Vivid multi-colour cards. |
| **Apple developer tutorials (DocC)** | Tutorials are made of sections and steps. Each step's text is paired with a code or image pane, with an assessment at the end. | For the static learner guide: a step list paired with a visual pane. | Nothing to leave. |
| **Swiss / International style revival** | Strict grids, flush-left ragged-right text, asymmetric composition, grotesk type, whitespace as structure, hierarchy by size and weight only. | **The core of this direction.** The deck already is this: left-aligned 96px margin, grotesk, pictograms in the Otl Aicher lineage. | Helvetica cosplay, oversized red Swiss crosses. |

### 1.3 What makes a site look AI-generated (anti-patterns to keep out)

Combined from the Hallmark anti-pattern reference, the Anti-AI-UI README, and search summaries (the SmoothUI, 925 Studios and DEV "purple gradient problem" articles):

- **Purple-to-blue gradients.** Traced to Tailwind UI's `bg-indigo-500` default; Adam Wathan apologised for it in August 2025. Gradient text (`background-clip:text`). Aurora or mesh blobs and floating orbs behind the hero.
- **Glassmorphism** (`backdrop-blur` panels, frosted navigation) with no depth purpose.
- **Emoji as feature icons** (🚀 ⚡ ✨ 🎯), and mixed icon libraries.
- **A centred full-viewport hero with three feature cards below**, each an icon tile over a two-line heading and three lines of body text. Also generic bento grids of identical rounded cards.
- **Over-rounded everything**: `rounded-2xl` uniformity, pill buttons, pill badges and pill navigation.
- **Soft coloured glows**, shadows on dark backgrounds, and `hover:scale-105` on every card.
- **Card-in-card**, meaning nested bordered containers with no semantic reason.
- **Side-stripe cards**: a thick coloured left border, 4 to 6px.
- **An eyebrow on every section** ("01 / EXAMPLES"), and an **italic accent word** inside a headline.
- **Re-drawn UI chrome**: fake browser bars, phone frames, fake app windows around previews.
- **Animate-on-scroll on everything**, bouncy overshoot easing, `transition-all`.
- **Invented metrics**, such as "10x faster".
- An unchosen default typeface in the same weight everywhere.
- Copy tells: hype verbs (unlock, supercharge, seamless, leverage, empower), negative parallelism ("it's not X, it's Y"), triplet rhythm, em-dash chains.

**How the current site maps onto these:** side stripes, card-in-card, the eyebrow on every section, a two-tone or italic accent word in headlines, re-drawn app chrome in the demo tiles, pill-rounded language and login controls, and offset shadows. It is not purple or glassy. Its problem is the risograph and brutalist decoration layered over an otherwise disciplined system.

---

## 2. What the Workshop 03 deck does

Files read: `lib/tokens.css`, `lib/story.css` (all 1100+ lines), `lib/cover-globe.css`, `slides.html` lines 1-250, and the scene CSS for `cover`, `the-arc`, `resolution` and `honest-no`. Screenshots are in `research/deck-shots/`:

- `01-cover-s1.png`
- `03-the-case-s3.png`
- `04-the-arc-s2.png`
- `05-bad-architecture-s4.png`
- `07-failure-anatomy-s5.png`
- `09-ready-architecture-s4.png`
- `10-semantic-contract-s5.png`
- `12-ready-rematch-s3.png`
- `14-honest-no-s5.png`
- `16-evaluation-s4.png`
- `17-your-data-s5.png`
- `18-resolution-s3.png`
- the rest of the 18 are in the same folder

Why it works, in design terms:

1. **Paper and ink, nothing else.** Every scene after the cover is `#f3f0e9` paper with `#121212` ink. The cards (`--papier #f2f1ee`) are nearly the same value as the ground; they read as objects because of their ink outline, not their colour.
2. **One accent with one meaning.** The spec says Mennige `#b73a15` means "look here now", one element group per step, and "never good or bad". In the screenshots it marks only the focus: the "last complete quarter" underline, the €32,380 sum, the verdict box, "not the AI." in a headline. Green `#205b46` is the one semantic colour and always appears with the pass icon and a word.
3. **Type is sentence case and calm.** Headlines at 60px/1920 are 700 weight with -0.01em tracking and lead with a statement ("Someone asks this every quarter.", "Why is April negative?"). Labels are 600 weight at +0.06em. There is **no mono uppercase**: mono appears only for table names (`monthly_revenue`).
4. **A pictogram system.** Custom square line icons (`symbol#i-*` in the sprite) on a 100-unit grid, square linecaps, miter joins, one filled square detail per icon. They read as one family, in the Aicher and DIN lineage.
5. **Encodings are semantic and constant.** Hatch means export or raw tables, solid ink means approved views, slate means the database check, dashed means a known gap or something unreachable, and the isometric hatched wall means the database permission. A viewer learns the code once.
6. **The Route.** A 6-station progress line in the chrome: square stations, dashed future connectors, solid past ones, and the current station as a filled square with an inset papier square and an underline bar.
7. **Composition.** Flush left on a 96px margin, a title zone at y 112 and content from y 224; lots of empty paper; diagrams sit on the grid and never float decoratively.
8. **The cover.** A graphit `#141414` ground and a line globe (`assets/globe.svg`) placed from x 900 at 1280px wide, 0.72 opacity, masked in from the left, with Germany traced in Mennige. The brand lockup sits top left, then the date kicker, a 104px title, the dark question card with a Mennige left bar, and a quiet meta line.
9. **Motion** (`--m-*` tokens): 200 to 700ms, `--ease-out: cubic-bezier(0.16,1,0.3,1)`, stagger 80ms capped at 4 items, reduced-motion falls back to fades, and without JS the final state shows.

Three things the web version must **soften**. The deck is projected; the web is read at arm's length.

- The 3px ink outlines at 1920px equal 2.25px at 1440. On a page full of objects that becomes heavy, which is the "brutalist" risk. **Web mapping:** 1px lines for structure, 2px ink only for the few focal objects (question card, lab top rule, section Kopflinie), and 6px bars only on the question card.
- The q-card's thick left bar is a side stripe. It stays, but as **the only** left-bar element on the site, used once per page for the workshop's held-fixed question.
- The +0.06em label tracking comes from the wider Typing metrics on a projector. On the web it becomes +0.02em with Loehrning Sans.

---

## 3. Diagnosis of the current web surfaces

From `shots/before/*` and source:

| Surface | What reads as brutalist or AI-generic |
|---|---|
| `/workshops` (`workshops.png`, `app/workshops/workshops-content.tsx`) | A marker-pen highlight on the H1 (`HighlightedText colorVar="--color-brand-sky"`, l.65). Rotated pastel "tape" strips (l.47 `rotate-3 bg-brand-sky/60`, l.51 `-rotate-6 bg-brand-pink/55`). A catalog card with an **offset acid block behind it** (l.79 `translate-x-3 translate-y-3 bg-brand-acid/75`) and pastel index bars (l.22-24). Each workshop card is split into two pastel halves (acid, green, sky, lilac, peach, pink) and holds box-in-box content: a ring card, then a framed preview with a shadow, then an acid callout with a left rule (l.235 `border-l-[3px] … bg-brand-acid/35`), then a `dl` grid. Mono uppercase orange labels everywhere (l.59, 84, 205, 220, 241, 249, 257, 267). Hover lift and a rotated preview (l.174 `hover:-translate-y-0.5`, l.191 `group-hover:-rotate-1`). The Workshop 03 preview frame renders **blank**. |
| `/kurse` (`kurse.png`, `app/kurse/course-ledger-row.tsx`, `learning-atlas.tsx`) | Every row tinted a different pastel (`ROW_TONES` l.44-50, `PLATE_TONES` l.59-65). Orange left rules on in-path rows (l.175). **Durations drawn in input-like boxes**, which read as form fields. The atlas panel contains a tabs box, a path box and a card with an offset border: box-in-box-in-box. The headline is two-tone ("KI verstehen, / einsetzen und prüfen." with the second line orange). |
| Course landing (`course-ds.png`) | An italic orange accent phrase in the H1 ("*aus Daten Entscheidungen abzuleiten*"), which is a named AI tell. A pastel cycle diagram with purple, green and pink nodes. Six outcome boxes with coloured geometric glyphs (◇ ○ △ □ ◈ ×) as icons, which is the "icon-tile feature grid" tell. Chapter cards with coloured dots and coloured left borders. |
| `/demos` (`demos.png`, `app/demos/page.tsx`) | Two-tone headlines (ink sentence, then orange sentence) in the hero and in all 12 tiles. Random dark tiles in a paper masonry grid. Registration-corner marks (`.demo-corner-*` in `globals.css`). Re-drawn app chrome in the previews (an Excel window, a Word document, a CRM card). Mono uppercase chip labels. A dark sidebar block stuck on the hero. |
| Workshop detail (`ws03.png`, `workshop-detail-content.tsx`) | An orange left rule on the header (l.65 `border-l-[3px] border-brand-orange`), a mono uppercase eyebrow (l.67), and the H1 at `font-black tracking-[-0.04em]`. The decision lab is an outer box with an orange 3px top rule (`workshop-decision-lab.tsx` l.412), holding columns, holding **boxed options**. Feedback uses 4px coloured left stripes (l.525, l.541). The "Referenz" section repeats the orange left rule. |
| W03 demo (`ws03-demo.png`, `public/…/demo.html`) | **3px/3px and 1px/1px offset ink shadows** (`box-shadow:3px 3px 0 var(--ink)`, 10+ occurrences). Large empty states ("Press 'Replay on both'"), so the page shows nothing until you act. Mono uppercase kickers. A red filled CTA bar spanning the full column. |
| W01 hub (`ws01-hub.png`) and W02 deck (`ws02-slides.png`) | A dotted background, an orange dash plus mono uppercase kicker, a two-tone "into a **decision**.". W02 chrome uses mono uppercase at 0.18-0.30em tracking (`lib/deck.css`). |
| Global chrome on these pages | An acid DE toggle, a cobalt mono uppercase LOGIN button, a floating shadowed pill nav, and an indigo `#242342` footer with decorative circles. |

---

## 4. Principles

1. **Paper, ink, one red pencil.** Ground and type carry the page. Mennige marks the one thing to look at in a section. If two things are red, one of them is wrong.
2. **Lines before boxes.** Separate with space first, then hairlines, then a Kopflinie. Draw a box only around (a) something you act on, (b) an object (question, preview, lab sheet), or (c) a table. A box never sits in a box.
3. **Type does the hierarchy.** Size and weight, sentence case, left aligned, measure ≤ 64ch. There is one headline style per level site-wide: no second colour in a headline, no italics for emphasis, no marker highlights.
4. **Square and flat.** Radius 0. Elevation is by tone. Shadows appear only on floating overlays.
5. **The drawing explains; decoration is gone.** Each page gets at most one drawing, and it must carry information: the globe on workshop covers, the Route, a pictogram diagram, a real chart. Tape strips, blobs, dots, grids and registration marks are removed.
6. **Show the final state.** Without JS or with reduced motion, every instrument shows its result. Replay is optional. There are no empty "press play" states.
7. **Evidence stays visible and quiet.** "Synthetic", recording dates, sources and limits sit in a caption line next to the thing they qualify, never in a big warning box.
8. **The same parts everywhere.** Courses, workshops, demos and the static HTML materials share one token file and one set of recipes. Route families differ by their drawing and their cover, not by palette.

---

## 5. Tokens

### 5.1 Colour: roles, values and contrast (WCAG 2.2)

All ratios were computed with the WCAG relative-luminance formula (`scratchpad/tmp/contrast.py`).

**Paper (light) surfaces**

| Token (Tailwind `--color-*`) | Name | Value | Was | Role |
|---|---|---|---|---|
| `background` | Kalkweiß | `#f3f0e9` | `#f7f1e7` | Page ground (deck `--paper`) |
| `card` / `paper` | Bogen (raised sheet) | `#f9f7f2` | `#fff9ed` / `#fffcf5` | Objects: question card, previews, selected row |
| `card-hover` | | `#efebe2` | `#f0e7d7` | Row hover |
| `inset` **(new)** | Beton | `#e5e4e2` | none | Recessed bands: decision lab, code, table heads (deck `--beton`) |
| `foreground` | Druckschwarz | `#121212` | `#19232d` | Text, strokes, primary button fill |
| `muted-foreground` | Schiefer | `#4f4640` | `#4f5356` | Secondary text (deck `--slate`) |
| `muted` | Schiefer hell | `#655c54` | `#655c54` | Captions, future Route labels |
| `hairline` **(new)** / `track` | Leinen | `#d4cec5` | `#d9d0c4` | Decorative dividers, table rules, chart grid |
| `border` | Kante | `#827970` | `#827970` | Boundaries of interactive controls (inputs, chips, secondary buttons) |
| `brand-orange` / `kupfer` | Mennige | `#b73a15` | `#a5370f` | The one accent: primary CTA, focus ring, focus mark |
| `kupfer-dark` | Mennige tief | `#97300f` | `#a5370f` | Hover or pressed; Mennige text on Beton |
| `pass` **(new)** | Befund grün | `#205b46` | none | "Matches" or "correct": always with an icon and a word |
| `destructive` / `risk-red` | | `#991b1b` | same | Errors only |

**Contrast on paper**

| Foreground | on Kalkweiß `#f3f0e9` | on Bogen `#f9f7f2` | on Beton `#e5e4e2` | Use |
|---|---|---|---|---|
| Ink `#121212` | **16.46** | 17.50 | 14.74 | All text |
| Schiefer `#4f4640` | **8.08** | 8.59 | 7.24 | Secondary text (AAA) |
| Schiefer hell `#655c54` | **5.74** | 6.11 | 5.15 | Captions (AA) |
| Mennige `#b73a15` | **5.08** | 5.40 | 4.55 (AA, borderline) | Accent text, focus ring. On Beton, use `#97300f` (6.02) for small text |
| Mennige tief `#97300f` | 6.72 | 7.14 | 6.02 | Hover, text on Beton |
| Pass `#205b46` | 6.97 | 7.41 | 6.25 | Pass state |
| Kante `#827970` | **3.75** | 3.99 | 3.36 | ≥ 3:1 non-text (1.4.11), so it can be the only boundary of a control |
| Leinen `#d4cec5` | 1.37 | 1.46 | 1.23 | **Decorative only.** Never the sole indicator of a control or state |
| Paper text on a Mennige button | 5.40 (`#f9f7f2` on `#b73a15`) | | | Primary button (AA) |
| Paper text on the Mennige-tief hover | 7.14 | | | |
| Paper text on an ink button | 17.50 | | | Ink button |
| Ink on `card-hover` `#efebe2` | 15.75 | | | Hover row |

**Graphit (dark band) surfaces.** `.dark-section` is rewritten from indigo to graphit.

| Token in `.dark-section` | Value | Was | Contrast on `#141414` | Use |
|---|---|---|---|---|
| `background` / `dark-bg` | `#141414` | `#242342` | | Cover band, footer, slide-preview frames |
| `foreground` / `dark-fg` | `#f2f1ee` | `#f7f1e7` | **16.31** | Text |
| `muted-foreground` | `#d4cec5` (Leinen) | `#d7d0e4` (lavender) | **11.79** | Secondary text, kicker |
| `muted` / `dark-muted` | `#a8a097` | `#9c8f85` | **7.14** | Captions |
| `brand-orange` / `kupfer` (text on dark) | `#e07050` | same | **5.79** | Accent text, focus ring on dark |
| Mennige `#b73a15` as a **bar** | | | 3.18 (≥ 3:1 non-text) | The question-card bar and the globe's Germany trace only. Never text |
| `border` (controls on dark) | `rgb(242 241 238 / 0.4)`, about `#6d6c6b` | same alpha | **3.52** | Outline button, inputs |
| `hairline` on dark | `rgb(242 241 238 / 0.16)`, about `#383737` | `0.14` | 1.55 | Decorative dividers |
| `pass` on dark | `#6fbf9a` | none | 8.42 | Pass state on dark |

The graphit band against Kalkweiß is 16.19:1, so the band edge needs no rule.

**Retire on learning surfaces:** `brand-acid`, `brand-sky`, `brand-pink`, `brand-peach`, `brand-cobalt`, `brand-teal`, `kupfer-mist` (selection becomes ink fill or ink marker instead of a tint), `brand-sand`, `brand-amber`, `.bg-dot-pattern`, `.bg-grid`, `.berlin-grain`, `.glow-*`, `.demo-corner-*`. Keep the tokens defined until other routes (home, books, about) are migrated. Ban them on the learning surfaces by lint (section 10).

### 5.2 Type

The face stays Loehrning Sans, which is visually the same grotesk as the deck's Typing (`research/font-compare.png`); Typing has slightly looser default spacing. Code and data use Geist Mono. This is a scale derived from the deck's ratios (104/60/40/32/26/24/22 at 1920px, multiplied by 0.75 for 1440px), then tuned for reading.

| Token (`--text-*` in `@theme`) | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `display` **(new)** | `clamp(2.75rem, 1.6rem + 4.2vw, 4.75rem)` (44 to 76px) | 1.0 | -0.015em | 700 | Cover band H1 only |
| `fluid-h1` (update) | `clamp(2.25rem, 1.5rem + 2.6vw, 3.25rem)` (36 to 52px) | 1.05 (was 0.95) | -0.012em | 700 | Page H1 on paper |
| `fluid-h2` (update) | `clamp(1.625rem, 1.3rem + 1.2vw, 2.25rem)` (26 to 36px) | 1.15 | -0.01em | 700 | Section heads |
| `fluid-h3` (update) | `clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)` (20 to 24px) | 1.2 | -0.005em | 700 | Card titles, row titles |
| `lead` **(new)** | 1.25rem (20px) | 1.45 | 0 | 400 | Intro paragraph, max 56ch |
| `body` **(new)** | 1.0625rem (17px) | 1.6 | 0 | 400 | Running text, max 64ch |
| `label` **(new)** | 0.875rem (14px) | 1.3 | +0.02em | 600 | Kickers, `dt`, chip text, table heads. Sentence case |
| `caption` **(new)** | 0.8125rem (13px) | 1.45 | 0 | 400 | Provenance, footnotes (≥ 12px per contract) |
| `num-lg` **(new)** | 2.5rem (40px) | 1.0 | -0.01em | 700 | Stat values, `tabular-nums` |
| mono | 0.875rem Geist Mono | 1.5 | 0 | 400/700 | File names, code, IDs, SQL, timestamps only |

Rules:

- No `font-black`.
- Headline tracking is never below -0.015em.
- No `uppercase` except true abbreviations (EUR, SQL, CSV) written that way in the copy.
- No two-colour headlines and no italic emphasis.
- Numbers in tables, stats and time get `tabular-nums`.
- `text-wrap: balance` on headings (already in base) and `text-pretty` on leads.

### 5.3 Spacing and grid

- **8px module** (deck `--s*`). Allowed steps in Tailwind units: 2 (8), 3 (12), 4 (16), 6 (24), 8 (32), 12 (48), 16 (64), 24 (96).
- Container: `max-w-[75rem]` (1200px), gutter `px-4` (16px) on phone and `px-6` from `sm`. A 12-column grid with 24px gaps. Reading measure `max-w-[64ch]`.
- Vertical rhythm: section `py-12` on mobile and `py-16` on desktop. Cover band `py-16` / `lg:py-24`. Vary it deliberately: the lab band is tighter (`py-8`/`py-10`) and the cover more generous. Hallmark flags "every section padded equally".
- Section head: a Kopflinie (`border-t-2 border-foreground`), then `pt-4`, the H2, then `mt-2` for an optional one-line description. The content starts `mt-8`.
- Flush left. Nothing is centred except the numerals inside a Route station.

### 5.4 Radii

- `rounded-none` on every learning surface: buttons, chips, cards, inputs, previews, the language toggle. This matches the deck's `border-radius:0 !important`.
- The existing contract allows 0-8px; this direction narrows it to 0 for the learning surfaces. Do not change Tailwind's global `--radius-*` tokens (other routes use them). Just stop using `rounded-*` in these files.
- The only circle is where the drawing needs one: the `i-clock` and `i-person` pictograms, and the globe.

### 5.5 Borders and hairlines

| Kind | Spec | Use |
|---|---|---|
| Hairline | `1px solid var(--color-hairline)` (`#d4cec5`) | Between list rows, table rows, chart gridlines, the footer divider |
| Control edge | `1px solid var(--color-border)` (`#827970`) | Secondary buttons, filter chips, inputs, radio squares at rest |
| Ink line | `1px solid var(--color-foreground)` | Preview frames, the question card, the outline of the lab sheet if one is needed |
| Kopflinie | `2px solid var(--color-foreground)` on top | Section heads, the top of the decision-lab band, table heads |
| Gap or draft | `1px dashed var(--color-foreground)` (dasharray about 6/4) | "Known gap", "not approved", placeholder. Semantic only |
| Question bar | 6px left bar, ink on paper or Mennige on graphit | **Only** the question card. Once per page |
| Hatch | 45° ink hatch, 1.5px stroke on a 10px pitch (the web equivalent of the deck's 3px on 14px) | "Raw or export data" in drawings and legends only |

### 5.6 Elevation

- Level 0 is Kalkweiß (page). Level +1 is Bogen `#f9f7f2` (raised object). Level -1 is Beton `#e5e4e2` (recessed band).
- Shadows are for overlays only (nav menu, dialogs, popovers). Add `--shadow-overlay: 0 1px 2px rgb(18 18 18 / .06), 0 12px 32px rgb(18 18 18 / .10)`.
- Delete `--shadow-tile`. Stop using `shadow-card` and `shadow-card-hover` on learning surfaces: the workshop hub, course rows, demo tiles, detail pages. On the other routes that use them, remap `shadow-card` to `--shadow-overlay` later.
- Structure uses real borders, not shadows, so it survives Windows forced-colors mode. Box-shadow outlines disappear there; borders do not.

### 5.7 Motion (from the deck's `--m-*` tokens, scaled for reading)

| Token | Value | Use |
|---|---|---|
| `--ease-deck` **(new, not overriding Tailwind's `--ease-out`)** | `cubic-bezier(0.16, 1, 0.3, 1)` | Everything that enters or moves |
| `--ease-fade` | `cubic-bezier(0.4, 0, 0.2, 1)` | Opacity-only |
| `--dur-press` | 120ms | Hover or press colour change |
| `--dur-fade` | 200ms | Fades, feedback appearing |
| `--dur-rise` | 320ms | An element entering with an 8px rise (deck: 16px) |
| `--dur-draw` | 560ms | The Route line drawing once, chart bars growing |
| `--stagger` | 80ms, max 4 items | Stations, bars |

Policy:

- One moving region at a time.
- No scroll-reveal on sections. The only first-view animation allowed per page is the Route drawing on the workshop detail page, once.
- No hover lifts, rotations or scale. Hover changes colour or underline, and the existing `.arrow-nudge` (3px) is fine.
- No overshoot: the deck's stamp keyframe overshoot is projector-only.
- `prefers-reduced-motion`: fades only, or static. This is already global in `globals.css`.

### 5.8 Proposed `@theme` changes (Tailwind v4, `src/app/globals.css`)

```css
@theme {
  /* Werkzeichnung palette: the Workshop 03 deck (public/workshops/datenbereitschaft-fuer-ki/lib/tokens.css) */
  --color-background: #f3f0e9;        /* Kalkweiß */
  --color-foreground: #121212;        /* Druckschwarz */
  --color-card: #f9f7f2;              /* Bogen: raised sheet */
  --color-card-hover: #efebe2;
  --color-paper: #f9f7f2;             /* alias kept for existing classes */
  --color-inset: #e5e4e2;             /* Beton */
  --color-muted-foreground: #4f4640;  /* Schiefer, 8.08:1 */
  --color-muted: #655c54;             /* 5.74:1 */
  --color-hairline: #d4cec5;          /* Leinen, decorative only */
  --color-track: #d4cec5;
  --color-border: #827970;            /* control edge, 3.75:1 */

  --color-brand-orange: #b73a15;      /* Mennige, 5.08:1 */
  --color-kupfer: #b73a15;
  --color-kupfer-dark: #97300f;
  --color-kupfer-light: #e07050;      /* accent text on graphit, 5.79:1 */
  --color-pass: #205b46;              /* with icon + word only */

  --color-dark-bg: #141414;           /* Graphit */
  --color-dark-fg: #f2f1ee;
  --color-dark-muted: #a8a097;
  --color-dark-border: rgb(242 241 238 / 0.4);
  --color-dark-track: rgb(242 241 238 / 0.16);

  --shadow-overlay: 0 1px 2px rgb(18 18 18 / 0.06), 0 12px 32px rgb(18 18 18 / 0.1);
  /* delete --shadow-tile */

  --text-display: clamp(2.75rem, 1.6rem + 4.2vw, 4.75rem);
  --text-display--line-height: 1;
  --text-display--letter-spacing: -0.015em;
  --text-display--font-weight: 700;
  --text-fluid-h1: clamp(2.25rem, 1.5rem + 2.6vw, 3.25rem);
  --text-fluid-h1--line-height: 1.05;
  --text-fluid-h1--letter-spacing: -0.012em;
  --text-fluid-h2: clamp(1.625rem, 1.3rem + 1.2vw, 2.25rem);
  --text-fluid-h2--line-height: 1.15;
  --text-fluid-h2--letter-spacing: -0.01em;
  --text-fluid-h3: clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem);
  --text-fluid-h3--line-height: 1.2;
  --text-lead: 1.25rem;
  --text-lead--line-height: 1.45;
  --text-body: 1.0625rem;
  --text-body--line-height: 1.6;
  --text-label: 0.875rem;
  --text-label--line-height: 1.3;
  --text-label--letter-spacing: 0.02em;
  --text-label--font-weight: 600;
  --text-caption: 0.8125rem;
  --text-caption--line-height: 1.45;
  --text-num-lg: 2.5rem;
  --text-num-lg--line-height: 1;

  --ease-deck: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-fade: cubic-bezier(0.4, 0, 0.2, 1);
}
```

`.dark-section` becomes:

```css
.dark-section {
  --color-background: #141414;
  --color-foreground: #f2f1ee;
  --color-muted-foreground: #d4cec5;   /* 11.79:1 */
  --color-muted: #a8a097;              /* 7.14:1 */
  --color-brand-orange: #e07050;       /* 5.79:1 */
  --color-kupfer: #e07050;
  --color-pass: #6fbf9a;               /* 8.42:1 */
  --color-border: rgb(242 241 238 / 0.4);    /* 3.52:1 */
  --color-hairline: rgb(242 241 238 / 0.16);
  --color-track: rgb(242 241 238 / 0.16);
  --color-card: #1c1b1a;
  --color-card-hover: #242321;
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

Focus:

```css
:focus-visible {
  outline: 3px solid var(--color-brand-orange);
  outline-offset: 2px;
}
```

This already exists. With the new Mennige it is 5.08:1 on paper and 5.79:1 (`#e07050`) on dark. Next to an ink button the ring is 3.24:1 against the button, which is above 3:1.

The foreground change from `#19232d` to `#121212` is global and near-invisible outside the learning surfaces, both ≥ 14:1. If the implementer wants zero risk to other routes, scope the new values under a `.surface-werk` wrapper class on the learning routes' root elements first, then promote them.

### 5.9 Static materials (`public/workshops/*`)

Create `public/workshops/_shared/tokens.css`, a copy of the deck's `lib/tokens.css` palette, fonts and motion without the `* {border-radius:0 !important}` sledgehammer (use `border-radius:0` on the components instead). Add `_shared/web.css` with the recipes from section 6 in plain CSS (`.w-kicker`, `.w-kopf`, `.w-row`, `.w-chip`, `.w-btn`, `.w-route`, `.w-qcard`, `.w-callout`, `.w-stat`). Every material page (hub, guide, demo, builder, field card, homework) links both, so W01 to W04 materials look like one series. The decks keep `story.css`.

---

## 6. Component recipes

Class strings are Tailwind v4 against the tokens above. Where a recipe is shared with the static HTML, the CSS class name is given too.

### 6.1 Kicker (replaces the eyebrow)

```tsx
<p className="text-label text-muted-foreground tabular-nums">Workshop 03 · 75 Minuten</p>
```

- Sentence case, Schiefer, no orange, no leading dash, no mono, no uppercase.
- Only in a page hero or cover, plus inside object headers (e.g. "Entscheidung 1 von 1" in the lab). **Section heads get no kicker**: the Kopflinie does that job.
- Static CSS: `.w-kicker`.

### 6.2 Section head with Kopflinie

```tsx
<header className="border-t-2 border-foreground pt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
  <h2 className="text-fluid-h2 font-bold">Material</h2>
  <p className="text-caption text-muted-foreground">Kostenlos, ohne Konto · Material auf Englisch</p>
</header>
```

- The right-hand note is optional and factual.
- This replaces the orange-left-rule headers and the "Referenz" block style.

### 6.3 Buttons

| Variant | Classes | Rule |
|---|---|---|
| Primary (Mennige) | `inline-flex min-h-11 items-center gap-2 bg-brand-orange px-5 text-[0.9375rem] font-semibold text-card hover:bg-kupfer-dark transition-colors duration-[120ms]` | **Max one per page.** The hero or cover action. Text 5.40:1, hover 7.14:1 |
| Ink | `… bg-foreground text-card hover:bg-[#2b2a28]` | The lab's submit, and the primary action inside content when the page's Mennige is already used |
| Secondary | `… border border-foreground bg-transparent text-foreground hover:bg-card-hover` | Second action |
| Text link | `inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-hairline underline-offset-4 hover:decoration-foreground` plus `<ArrowRight className="arrow-nudge size-4"/>` | Card and row actions ("Workshop öffnen →") |
| On graphit | primary: `bg-card text-foreground hover:bg-[#e8e5de]`; secondary: `border border-[rgb(242_241_238/.4)] text-dark-fg hover:bg-[#242321]` | Cover band |

- All buttons: `rounded-none`, a 44px target, a visible label, and an arrow only when the button navigates.
- External and new-tab destinations get `↗` plus an `sr-only` "(öffnet neues Fenster)".

### 6.4 Chips

| Variant | Classes | Use |
|---|---|---|
| Meta (static) | `inline-flex h-7 items-center gap-1.5 border border-border px-2.5 text-label text-muted-foreground` | Format and language ("HTML · EN"), mode ("Synthetisch") |
| Pass | `… border-pass text-pass` plus `i-pass` icon plus the word ("Passt", "Matches") | Verdicts |
| Gap | `… border-dashed border-foreground text-foreground` plus `i-gap` icon | "Bekannte Lücke" |
| Filter (interactive) | `inline-flex min-h-11 items-center gap-2 border border-border px-3 text-label text-foreground hover:border-foreground aria-pressed:bg-foreground aria-pressed:text-card aria-pressed:border-foreground` plus a `tabular-nums` count in `text-muted` | The demos filter and the course goals |

- No `rounded-full`, and no pastel or `kupfer-mist` fills.
- The selected state is ink fill, which carries meaning without colour and holds 17.5:1.

### 6.5 Stat row (evidence, not marketing)

```tsx
<dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
  <div className="pr-6 sm:border-l sm:border-hairline sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
    <dt className="text-label text-muted-foreground">Szenen</dt>
    <dd className="mt-1 text-num-lg font-bold tabular-nums">26</dd>
    <dd className="mt-1 text-caption text-muted">75 Min. mit Fragen</dd>
  </div>
  …
</dl>
```

- Two to four stats. Every value is **derived from data**: `steps.length`, `materials.length`, duration, account count in the case. Hallmark bans invented metrics.
- No boxes and no icons.
- On graphit, the hairline becomes the dark hairline.

### 6.6 List row (ledger): courses, materials, demos (list view), chapters

```
┌────┬──────────────────────────────────────────┬──────────────────┬────────────────┐
│ 01 │ Titel (h3 20-24px, 700)                  │ ca. 1 Std. 40    │ Öffnen →       │
│    │ Ein Satz, was du danach kannst (Schiefer)│ HTML · DE+EN     │                │
└────┴──────────────────────────────────────────┴──────────────────┴────────────────┘
 hairline bottom · hover bg-card-hover · whole row is one link (stretched ::after)
```

```tsx
<li className="group relative grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 border-b border-hairline py-5 hover:bg-card-hover sm:grid-cols-[3rem_1fr_auto_auto] sm:items-baseline">
  <span className="text-label text-muted tabular-nums">01</span>
  <div><h3 className="text-fluid-h3 font-bold">…</h3><p className="mt-1 text-body text-muted-foreground max-w-[60ch]">…</p></div>
  <p className="col-start-2 text-caption text-muted-foreground tabular-nums sm:col-start-auto">ca. 1 Std. 40 Min.</p>
  <a className="col-start-2 sm:col-start-auto … after:absolute after:inset-0">Öffnen <ArrowRight/></a>
</li>
```

- Duration is plain text, never an input-looking box.
- Sub-links such as "2 Praxisbeispiele" sit above the stretched link with `relative z-10`.
- The row that is part of the chosen path gets **an ink square marker** (`size-2.5 bg-foreground`) before the number instead of an orange left rule. Its label "Teil deines Pfads" is sentence-case caption, not mono uppercase.

### 6.7 Workshop card with cover preview (hub)

A two-column sheet; the cover is the object.

```
┌───────────────────────────────┐   Workshop 03 · 75 Min.                 ← kicker
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   Sind deine Daten bereit für KI?       ← h3, 28px
│▓ real deck cover (webp, 16:9)▓│   Eine Frage, zwei Datenstände, zwei    ← body, Schiefer, ≤ 56ch
│▓ graphit + globe + title     ▓│   Antworten.
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   [?] „100 Euro plus 20 Euro. Wirklich 120?"  ← question line, i-question 20px
└───────────────────────────────┘   Du gehst mit: Fünf-Felder-Vorlage     ← caption: label + value
 Deck · 26 Szenen   (caption)       Deck · Lernbegleiter · Demo           ← caption
                                    Workshop öffnen →                     ← text link
──────────────────────────────────────────────────────────────────────── hairline
```

- Grid: `grid gap-6 border-b border-hairline py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10`.
- Cover: `<figure className="aspect-video overflow-hidden bg-dark-bg outline outline-1 outline-foreground">` with `<Image … className="size-full object-cover">`.
  - The image is the real deck cover, rendered by Playwright from `slides.html#cover/0` at 1920×1080 and downscaled to 960×540 webp, **at build or publish time**, so it never drifts. The W03 blank preview bug disappears with this.
  - Fallback when no image exists: a CSS mini-cover with graphit, the globe at the right, and the title in `text-dark-fg` 20px.
- No rotation, no shadow, no inner white mat, no hover lift. Hover underlines the title and nudges the arrow; `focus-within` puts the Mennige ring on the whole card via `has-[:focus-visible]:outline`.
- All cards are uniform (cover left). No zigzag alternation, which is also a template tell.
- A new workshop gets a caption chip "Neu" as a meta chip. It is not a coloured badge.

### 6.8 Question card (the deck's `q-card`, once per page)

```tsx
<figure className="relative grid grid-cols-[2rem_1fr] gap-4 border border-foreground bg-card py-5 pl-7 pr-6 before:absolute before:inset-y-[-1px] before:left-[-1px] before:w-1.5 before:bg-foreground">
  <PictoQuestion className="size-8" aria-hidden />
  <div>
    <figcaption className="text-label text-muted-foreground">Eine Frage, fest gehalten</figcaption>
    <blockquote className="mt-1 text-[1.375rem] font-semibold leading-snug">Zeige den MRR zum Monatsende für das letzte abgeschlossene Quartal.</blockquote>
  </div>
</figure>
```

- The dark variant for the cover band: `bg-dark-bg border-[#f2f1ee]` with `before:bg-[#b73a15]`, exactly as in the deck cover.
- This is the **only** element with a left bar.

### 6.9 Cover band with globe (workshops hub and workshop detail)

```tsx
<section className="dark-section relative isolate overflow-hidden">
  <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(62vw,960px)] md:block
       bg-[url('/images/workshop-globe.svg')] bg-no-repeat bg-[length:960px_auto] bg-[position:0_50%] opacity-70
       [mask-image:linear-gradient(to_right,transparent,black_28%)]" />
  <div className="relative mx-auto max-w-[75rem] px-4 py-16 sm:px-6 lg:py-24">
    <p className="text-label text-muted-foreground">Workshop 03 · Datenbereitschaft</p>
    <h1 className="mt-4 max-w-[14ch] text-display font-bold">Sind deine Daten bereit für KI?</h1>
    <QuestionCard dark className="mt-8 max-w-[40rem]" />
    <div className="mt-8 flex flex-wrap gap-3"><PrimaryOnDark>Deck öffnen ↗</PrimaryOnDark><SecondaryOnDark>Demo starten</SecondaryOnDark></div>
    <p className="mt-10 text-caption text-muted tabular-nums">75 Min. · 26 Szenen · synthetischer Fall · Material auf Englisch · kein Konto</p>
  </div>
</section>
```

- **Globe asset:** copy `public/workshops/datenbereitschaft-fuer-ki/assets/globe.svg` (158 KB) to `public/images/workshop-globe.svg`, run it through svgo (target < 60 KB), and load it as a CSS background. It must not be the LCP element; the H1 text is.
- Hidden below `md` to keep phone bytes and layout calm. The deck's crop was x 900 of 1920 at 1280px wide, 0.72 opacity, masked in from the left, and the recipe mirrors that.
- The globe is static. The homepage globe keeps its narrow motion exception; this one does not move.
- The hub uses the same band with a hub title and the 01-04 index row (section 7.1).

### 6.10 Agenda timeline: "Route" (from `story.css` `.route`)

Desktop is horizontal and phone is vertical, with the same DOM (`<ol>`).

```
 ■━━━━━━━━━━━━━━■━━━━━━━━━━━━━━□- - - - - - - -□- - - - - - - -□- - - - - - - -□
 Falsche        Warum          Die             Nochmal         Ehrliche         Du bist
 Antwort        falsch         Reparatur       fragen          Grenzen          dran
 10 Min.        15 Min.        15 Min.         10 Min.         10 Min.          15 Min.
 ↓ unten ausprobieren
```

- `<ol className="grid grid-flow-col auto-cols-fr">`. Each `<li>` holds a station square:
  - future: `size-3 border-2 border-foreground bg-card`
  - past or active: `bg-foreground`
  - "here": `size-4 bg-foreground` with an inner `size-1.5 bg-card` square
- Connectors: halves drawn with `::before`/`::after`, `border-t-2`. Solid ink up to the active station, then `border-dashed border-muted`.
- Station label `text-label` (ink for active, `text-muted` for future). Time `text-caption tabular-nums text-muted-foreground`.
- On the workshop detail page every station shows its minutes. The station that matches the lab below gets the inset "here" square plus a caption link "unten ausprobieren".
- Below `sm`: `grid-flow-row`. The line runs vertically on the left (`border-l-2`) and label, time and a one-line description sit to the right.
- Motion: on first view the line draws for 560ms with `--ease-deck` and stations fade with an 80ms stagger capped at 4. Reduced motion leaves it static.
- Also used for: the "how every workshop runs" strip on the hub, the goal path in the course atlas (vertical), the demo stepper (W03 demo "Behind the answer", 5 stations), and course landing chapter progress.
- Accessibility: the current station has `aria-current="step"`, and each item's accessible name includes its state ("erledigt", "aktuell", "offen") in `sr-only` text.

### 6.11 Material list

```
━━ Material ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Kostenlos, ohne Konto
[▣]  Deck · 26 Szenen            Pfeiltasten, P öffnet die       HTML · EN    Öffnen ↗
                                 Moderationsansicht
──────────────────────────────────────────────────────────────────────────────
[▤]  Lernbegleiter               Die Geschichte zum Nachlesen,    HTML · EN    Öffnen ↗
                                 auch fürs Smartphone
──────────────────────────────────────────────────────────────────────────────
[⇩]  Readiness-Kit               Vorlagen, SQL und Prüfliste      ZIP · 1,1 MB Laden ↓
```

- This is a list row (6.6) with a 32px pictogram in place of the number.
- Pictograms come from the deck sprite: `i-app`/`i-canvas` for the deck, `i-book` for the guide, `i-chart` for the demo, `i-export` for downloads, `i-table` for CSV. Export the sprite once to `src/components/pictograms/*.tsx` so web and deck share glyphs. **Lucide icons are replaced on these surfaces** so there is one icon family (Hallmark: mismatched icon sets).
- Format, language and size go in a meta chip.
- Download rows show the byte size and use `download`.
- Order follows the workshop sequence: deck, guide, demo, kit.

### 6.12 Callout (no left bar)

| Variant | Classes | Use |
|---|---|---|
| Note | `flex gap-3 border border-hairline bg-card px-5 py-4 text-body` plus a 20px pictogram | Short context |
| Gap or limit | `… border-dashed border-foreground bg-transparent` plus `i-gap`, title "Grenzen der Daten" | Data limitations, known gaps (the deck's dashed "Known gap") |
| Boundary line | `flex items-start gap-2 text-caption text-muted-foreground` plus `i-shield` 16px, **no box** | Privacy and access notes ("Läuft nur auf dieser Seite …") |

- Never a coloured fill, never a left stripe.
- At most one boxed callout per section.

### 6.13 Decision-lab card (the web "room vote")

This mirrors the deck's `.room-vote`: a Beton band with a 3px ink top rule, the question as an h2, and answer options as square-bulleted words. The design removes box-in-box.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  2px ink
░ Entscheidung 1 · läuft nur auf dieser Seite   ░ Deine Entscheidung                     ░
░                                               ░ □ 120 Euro übernehmen: Zwei Zahlen …    ░
░ 100 Euro plus 20 Euro.                        ░ ────────────────────────────────────── ░
░ Wirklich 120?                (h2)             ░ ■ 100 Euro verwenden und zuerst die …   ░  ← selected: ink square + bg-card
░                                               ░ ────────────────────────────────────── ░
░ Ein Datensatz enthält den Monatsendbestand …  ░ □ Ohne weitere Prüfung ein größeres …    ░
░                                               ░                                         ░
░ Endbestand   Veränderung   KI-Antwort         ░ Stärkster Beleg                         ░
░ 100 €        +20 €         120 €              ░ □ Die Antwort klingt sicher …           ░
░ ─────────── hairline fact table ──────────    ░ □ Beide Zahlen stehen in derselben …    ░
░                                               ░ □ Der Endbestand enthält die …          ░
░ [shield] Auswahl bleibt in deinem Browser.    ░ [Entscheidung prüfen]  Zurücksetzen     ░
░ ─────────────────────────────────────────────────────────────────────────────────────── ░
░ [✓ Passt]  Der Endbestand enthält die Veränderung bereits. Noch einmal addieren …     ░  ← feedback row
░            Was du als Nächstes prüfst: die Definition des Feldes in der Quelle.       ░
```

- Wrapper: `border-t-2 border-foreground bg-inset px-4 py-8 sm:px-8 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-12`. No outer border and no orange top rule.
- Options: `<fieldset>` with `<legend className="text-label">`.
  - Each option is a full-width `<label>` row: `flex min-h-12 items-start gap-3 border-b border-hairline py-3 hover:bg-card has-[:checked]:bg-card`.
  - The custom radio is a square: `appearance-none size-5 border-2 border-foreground checked:bg-foreground` with an inset `size-2 bg-card` pseudo-square, the same shape as the Route's current station.
  - **No per-option boxes.** The selected row text weight goes to 600.
- Facts: a three-column `<dl>` with a hairline top rule and values in `tabular-nums`. Mono is not needed; Loehrning Sans tabular figures suffice.
- Feedback: appears below a hairline inside the same band, with a 200ms fade and 8px rise.
  - The verdict chip is pass (green, icon, word), "Teilweise" (ink, dashed, `i-gap`), or "Nicht belegt" (ink, `i-fail`).
  - It is followed by one to two sentences: what changed, why, and what to inspect next (existing contract).
  - The Mennige mark goes on **one thing**: the strongest-evidence option's square gets a `outline outline-2 outline-brand-orange outline-offset-2` after submit.
- Submit is the ink button, and "Zurücksetzen" is a text button.
- Mobile: a single column, question first, options full width, submit sticky at the end of the band (not fixed).

### 6.14 Demo tile

Uniform 3/2/1 columns with no masonry heights and no dark tiles.

```
┌─────────────────────────────────┐
│ ░░░ Beton inset, 4:3 ░░░░░░░░░░ │  ← schematic drawing in pictogram style:
│ ░ [xls]→[Claude]→[▦ Prognose] ░ │     ink lines, hatch for raw input, one Mennige mark
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     NO fake app window chrome
└─────────────────────────────────┘
 04 · Agents                          ← kicker (label, Schiefer)
 Agent-Pipeline: vier Rollen,         ← h3, one colour
 ein Memo
 Scout recherchiert, Analyst …        ← body 2 lines max (line-clamp-2)
 [Aufgezeichnet] [Fortgeschritten]    ← meta chips
 Beispiel öffnen →                    ← text link
```

- The grid uses `gap-x-6 gap-y-12` with no tile borders. Tiles are separated by whitespace, and the preview panel is the only box.
- Hover-only micro-motion (the existing `.demo-pv-*` classes) may stay inside the preview panel; it complies with the motion contract.

### 6.15 Pictograms

- Export the deck sprite's 30-odd `i-*` symbols as React components (100-unit viewBox, `stroke="currentColor"`, `strokeLinecap="square"`, `strokeLinejoin="miter"`, `vector-effect: non-scaling-stroke`).
- Stroke is 2px at 32px and above, 1.5px at 16-24px.
- Use one family per surface. No emoji, no coloured icon tiles, no geometric glyph "icons" (◇ ○ △).

---

## 7. Page blueprints

### 7.1 Workshops hub (`/workshops`, `/en/workshops`), desktop 1440

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ loehrning.ai   Lernen  Praxis  Blog  Open Source  Über mich          DE | EN   Login │  nav: paper, hairline
├──────────────────────────────────────────────────────────────────────────────────────┤  bottom, no pill/shadow
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Workshops · 4 Fälle · je 75-90 Minuten                     ╱‾‾‾‾ globe ‾‾‾‾╲      ▓│  kicker
│▓                                                           │ line drawing    │     ▓│
│▓ Eine Frage. Ein Fehler.                                   │ static, 0.7     │     ▓│  display, ≤ 14ch
│▓ Eine Vorlage für deinen Fall.                              ╲ cut at right  ╱      ▓│
│▓                                                                                   ▓│
│▓ Jeder Workshop beginnt mit einer echten Frage, zeigt, wie eine KI sie falsch      ▓│  lead, 56ch, Leinen
│▓ beantwortet, und endet mit einer Vorlage für deine eigenen Daten.                 ▓│
│▓                                                                                   ▓│
│▓ [ Mit Workshop 04 beginnen → ]   Alle Materialien kostenlos, ohne Konto           ▓│  1 primary (paper-on-dark)
│▓ ────────────────────────────────────────────────────────────────────────────────  ▓│  dark hairline
│▓ 01 Prognosen   02 Geschäftsberichte   03 Datenbereitschaft   04 ESG-Berichte      ▓│  index = anchor links
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  Kopflinie
│  So läuft jeder Workshop                                          75-90 Minuten      │  h2 + caption
│                                                                                      │
│  ■━━━━━━━━━━━━━━■━━━━━━━━━━━━━━■━━━━━━━━━━━━━━■━━━━━━━━━━━━━━■                       │  Route (all solid:
│  Die Frage      Die falsche    Warum sie      Die Reparatur  Deine Vorlage           │  it's a description,
│                 Antwort        falsch ist                                            │  not progress)
│  Ein echter     Die KI         Vier fehlende  Freigegebene   Eine Seite für          │  caption, Schiefer
│  Anlass         antwortet      Entscheidungen Definitionen   deinen Fall             │
│                                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Workshops                                                          4 · kostenlos    │
│                                                                                      │
│  ┌──────────────────────────────┐  Workshop 04 · 90 Min.   [Neu]                     │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ESG-Berichte mit KI: von Rohdaten zu klaren       │  h3 28px
│  │▓ deck cover, 16:9 webp      ▓│  Aussagen                                          │
│  │▓ (graphit, globe, title)    ▓│  Aus Zählerständen, Rechnungen und Tabellen wird   │  body, Schiefer
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  eine Kennzahl, deren Herkunft du zeigen kannst.   │
│  └──────────────────────────────┘  [?] „Stimmt die Scope-2-Zahl, und woher kommt sie?"│  question line
│   Deck · 24 Szenen                 Du gehst mit: Belegtabelle                        │  caption
│                                    Deck · Lernbegleiter · Demo · Kit                 │  caption
│                                    Workshop öffnen →                                 │  text link
│  ──────────────────────────────────────────────────────────────────────────────────  │  hairline
│  ┌──────────────────────────────┐  Workshop 03 · 75 Min.                             │
│  │▓ cover                      ▓│  Sind deine Daten bereit für KI?                   │
│  │                              │  …                                                 │
│  └──────────────────────────────┘                                                    │
│  ──────────────────────────────────────────────────────────────────────────────────  │
│  (02, 01 …)                                                                          │
│                                                                                      │
│  [shield] Alle Fälle sind erfunden. Gezeigte KI-Antworten sind Aufzeichnungen mit    │  boundary line
│           Datum, keine Live-Abfragen.                                                │
├──────────────────────────────────────────────────────────────────────────────────────┤
│▓ footer: graphit #141414, Leinen text, hairlines, no decorative circles             ▓│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Order: newest first, or the recommended start first. The index row in the cover band links to `#workshop-04` and so on.
- Phone (390): cover band without the globe; H1 at 44px; the index row becomes a horizontal rail per the site's mobile contract; the Route becomes vertical; cards stack with the cover on top and full width.

### 7.2 Workshop detail (`/workshops/[slug]`), desktop 1440

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ← Alle Workshops                                                                     │  44px row, hairline
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ Workshop 03 · Datenbereitschaft                                  ╱‾‾ globe ‾‾╲    ▓│  kicker
│▓ Sind deine Daten                                                │            │    ▓│  display
│▓ bereit für KI?                                                   ╲          ╱     ▓│
│▓ ┃┌───────────────────────────────────────────────┐                                ▓│
│▓ ┃│ [?] Eine Frage, fest gehalten                 │                                ▓│  q-card dark,
│▓ ┃│ Zeige den MRR zum Monatsende für das letzte   │                                ▓│  Mennige bar
│▓ ┃│ abgeschlossene Quartal.                       │                                ▓│
│▓  └───────────────────────────────────────────────┘                                ▓│
│▓ [ Deck öffnen ↗ ]  [ Demo starten ]                                               ▓│  primary + secondary
│▓ 75 Min. · 26 Szenen · synthetischer Fall · Material auf Englisch · kein Konto      ▓│  caption
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Ablauf                                                               75 Minuten     │
│  ▣━━━━━━━━━━━━□- - - - - - -□- - - - - - -□- - - - - - -□- - - - - - -□              │  Route; ▣ = "here"
│  Falsche      Warum        Die          Nochmal       Ehrliche      Du bist          │
│  Antwort      falsch       Reparatur    fragen        Grenzen       dran             │
│  10 Min.      15 Min.      15 Min.      10 Min.       10 Min.       15 Min.          │
│  ↓ unten ausprobieren                                                                │
│                                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│░ DECISION LAB BAND (Beton), see recipe 6.13                                        ░│
│░ left: kicker, h2 question, prompt, fact table · right: two fieldsets, submit      ░│
│░ feedback row under a hairline                                                     ░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Material                                       Kostenlos, ohne Konto · auf Englisch │
│  [▣] Deck · 26 Szenen        Pfeiltasten; P für Moderation      HTML · EN   Öffnen ↗ │
│  ──────────────────────────────────────────────────────────────────────────────────  │
│  [▤] Lernbegleiter           Die Geschichte zum Nachlesen       HTML · EN   Öffnen ↗ │
│  ──────────────────────────────────────────────────────────────────────────────────  │
│  [◈] Demo · 10 Min.          Rohtabellen gegen Sichten          HTML · EN   Öffnen ↗ │
│  ──────────────────────────────────────────────────────────────────────────────────  │
│  [⇩] Readiness-Kit           Vorlagen, SQL, Prüfliste           ZIP · 1,1 MB Laden ↓ │
│                                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Der Fall                                                                            │
│  FOLDLINE · erfundenes SaaS-Unternehmen · Q2 2026   │ Konten   │ Exporttab. │ Sichten│  stat row (derived)
│  Narrative, 2-3 sentences, 64ch.                    │ 144      │ 7          │ 5      │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                                     │  gap callout (dashed)
│    [gap] Grenzen der Daten: … · …                                                    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                                     │
│  Echter Anlass: <company> · Quelle ↗ · veröffentlicht 12. März 2026 · geprüft 20.8.  │  caption line
│                                                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  two columns
│  Für wen                                      Du gehst mit                           │
│  ■ Analyst:innen, die KI-Zahlen weitergeben   ■ Fünf-Felder-Vorlage (HTML, druckbar) │  ink square bullets
│  ■ Teams, die Daten für KI freigeben          ■ Prüfliste für freigegebene Sichten   │  (deck room-vote style)
│                                                                                      │
│  ──────────────────────────────────────────────────────────────────────────────────  │
│  Tim Löhr · KI-Antworten aufgezeichnet am 23. Aug. 2026 · synthetische Daten · Lizenz│  provenance caption
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- The page's single Mennige use is the cover's primary button and the q-card bar, which are the same group. Inside the lab, Mennige appears only after submit, on the strongest-evidence mark.
- Phone: in the cover, the q-card goes full width and the buttons stack; the Route is vertical; lab options come after the question; material rows stack as [icon + name], then [description], then [meta chip, action]; the stat row becomes 2×2.
- Remove the accordion "Referenz" block (four `<details>`): its content becomes the "Der Fall", "Für wen" and "Du gehst mit" sections above. The steps list becomes the Route.

### 7.3 Courses hub (`/kurse`)

- Paper hero (no band): kicker "Kurse · 10 · kostenlos", H1 "KI verstehen, einsetzen und prüfen." in ink only, one lead sentence, and "Unsicher, wo du stehst? In fünf Minuten einordnen →" as a text link.
- Lernatlas: a goal selector as square filter chips (ink fill when selected; replaces `kupfer-mist`), the chosen path as a **vertical Route** (4 stations: number, title, "offen"/"erledigt" state as a word), and the one recommended next step as a single text-link row. **The right-hand offset card box is removed.**
- The course list uses tracks as Kopflinie sections ("Grundlagen · 4 Kurse · fester Ablauf", "Technik · 6 Kurse"), each holding ledger rows (6.6) with no tonal fills, durations as plain text, and repo/commit provenance as a caption line in mono (a code identifier, so mono is correct).
- The "Warum kostenlos" `<details>` becomes a plain two-sentence paragraph above the footer, or a single boundary line.

### 7.4 Course landing (e.g. `/kurse/data-science-fundamentals`)

- Paper hero in two columns:
  - Left: kicker "Kurs · Data Science Fundamentals · Version 8", H1 in ink roman (no italic orange phrase), lead, primary "Kapitel 1 beginnen", and a stat row (12 Kapitel · 22 Simulationen · ca. 2 Std.).
  - Right: the course's working cycle drawn as a Route or loop in pictogram style: square nodes (Daten, Exploration, Bereinigung, Merkmale, Modell, Evaluation), ink connectors, a dashed return arrow labelled "Rückmeldung", and one Mennige node for "you start here". This replaces the pastel purple, green and pink node diagram.
- "Was du danach kannst": a two-column list of six outcomes, each a bold sentence plus one line of Schiefer, separated by hairlines. No icons and no boxes.
- "Lehrplan": 12 chapters as a Swiss grid, `grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline` with cells `bg-background p-6`. Each cell: chapter number (tabular), title (h3), subtitle (caption), one line, "Kapitel öffnen →". No coloured dots and no coloured left borders; completed chapters get an ink check pictogram and the word.
- "Werkzeuge": a hairline table with the name in mono (a code identifier) and the purpose in Schiefer.
- The side chapter navigation keeps its function; the active item becomes an ink square marker plus 600 weight instead of a `kupfer-mist` fill.

### 7.5 Demos hub (`/demos`)

- Paper hero: kicker "Praxisbeispiele · 12", H1 "Arbeitsabläufe prüfen" (single colour), lead. A stat row derived from data: 12 Beispiele · 4 Ausführungsmodi · 0 externe Aktionen. The dark "Was hier geprüft wird" sidebar becomes a three-item list with an ink-square bullet under the lead.
- Filters: one Kopflinie section with labelled chip groups (Reifegrad, Kategorie) and the context `<select>` (square, `border-border`, 44px).
- Grid of demo tiles (6.14): uniform, no dark tiles, no registration corners, previews redrawn as schematics.

### 7.6 Demo detail (`/demos/[slug]`)

- Header: kicker "Praxisbeispiel 04 · Agents", H1, lead.
- "So läuft dieses Beispiel": a four-row hairline `dl` (Daten, Ausführung, Externe Aktionen, Abbruch), with values in body and mono only for timestamps.
- The instrument full width on `bg-card` with a 1px ink frame, showing its final state first.
- "Was du prüfen kannst": a two-to-three item list. "Quellen": caption rows.
- A dark demo does not flip the page band to dark (drop the `demo.dark` band switch). If the instrument itself is dark (e.g. a terminal), only its frame is graphit.

### 7.7 Static workshop materials (`public/workshops/*`)

- Shared material bar (all workshops): lockup at left, then "Workshop 03" (label), then material tabs (Deck, Lernbegleiter, Demo, Kit) as text tabs with a 3px ink underline on the active one, then a right-aligned "← Zur Workshop-Seite" and the language switch. This replaces the current filled-black "01 Hub" boxes and the mono numbers.
- W01 hub, hands-on, case study, field card and homework: remove the dotted background, the orange dash with mono uppercase kicker, the two-tone "into a **decision**." and the white shadowed link boxes (use list rows). Keep the forecast drawing, redrawn in ink with one Mennige forecast line.
- W02 deck (`lib/deck.css`): replace mono uppercase chrome at 0.18-0.30em tracking with sentence-case 600 labels. Adopt `story.css` components where they already exist (Route, q-card, stamps, chart encodings), and the graphit cover with the canonical globe crop.
- W03 demo (`demo.html`): remove every `box-shadow: 3px 3px 0` and `1px 1px 0` stamp shadow. Render the final state first (both answers and the definition check visible on load; "Replay" is optional). Rebuild the layout as:
  1. the q-card with the question selector as square tabs;
  2. two lanes side by side using the deck's `ev-run` card, with hatch for export tables and ink for approved views;
  3. the `resolution` Truth Chart with an `ev-db` check;
  4. "Behind the answer" as a 5-station Route stepper next to one drawing pane.
  The full-width red CTA bar becomes one ink button.
- W04 (new, ESG): build it on the W03 system from day one: the deck with `story.css` plus a cover with the globe, and materials on `_shared/`. Suggested encodings that fit the existing grammar:
  - hatch = raw input (meter reading, invoice, spreadsheet export)
  - solid ink = the reported, approved figure
  - slate = the recomputed check
  - dashed = the estimate or proxy
  - Mennige = the one figure under discussion

  Suggested pictograms to add in the same style: `i-meter`, `i-invoice`, `i-factor` (emission factor), `i-scope`.

---

## 8. What to remove (exact current patterns)

| # | Pattern | Where (examples) | Replace with |
|---|---|---|---|
| 1 | **Offset "stamp" shadows**: `--shadow-tile: 4px 4px 0`, `translate-x-3 translate-y-3 bg-brand-acid/75` blocks behind cards, `shadow-[…]` hard offsets, CSS `box-shadow: 3px 3px 0 var(--ink)` / `1px 1px 0` | `globals.css` `--shadow-tile`; `workshops-content.tsx` l.79; 88 `shadow-[` hits in 42 `src` files (audit each); `datenbereitschaft-fuer-ki/demo.html` (10+) | Flat. Tone for elevation; `--shadow-overlay` for overlays only |
| 2 | **Pastel highlight blocks**: `HighlightedText` marker bands, rotated tape strips, pastel index bars | `workshops-content.tsx` l.47, l.51, l.65, `INDEX_BARS` l.22-24; `buecher-content.tsx` also uses `HighlightedText` (out of scope, same fix later) | Plain ink headline; the cover object carries the colour |
| 3 | **Pastel row and panel fills**: `bg-brand-acid/10 … cobalt/10`, plate tones, two-colour workshop card halves, `bg-brand-acid/35` callouts, `bg-kupfer-mist` selections | `course-ledger-row.tsx` `ROW_TONES` l.44-50, `PLATE_TONES` l.59-65, l.221; `workshops-content.tsx` l.15-17, 32-34, 235; `learning-atlas.tsx` | Paper rows with hairlines; ink fill or ink marker for selection |
| 4 | **Mono uppercase everywhere**: `font-mono text-xs font-bold uppercase tracking-[0.08-0.16em] text-brand-orange` eyebrows and `dt` labels; `font-ui-mono … uppercase` in nav, footer and "Datenstand" | `workshops-content.tsx` l.59, 84, 205, 220, 241, 249, 257, 267; `demos/page.tsx` l.157, 176, 204; `workshop-detail-content.tsx` l.67; `components/nav.tsx` l.99, 166, 503; W02 `lib/deck.css` letter-spacing 0.18-0.3em; W01 `hub.html` | Sentence-case `text-label` in Schiefer; mono only for data |
| 5 | **Box-in-box density**: ring card, then framed preview, then callout, then `dl` grid; the lab's outer box, then column boxes, then boxed options; the atlas box holding boxes; demo tiles with framed previews, corner marks and chip boxes | `workshops-content.tsx` l.174-270; `workshop-decision-lab.tsx` l.173-182, 412, 428-432; `learning-atlas.tsx`; `demos/page.tsx` | One containment layer; lines and space inside |
| 6 | **Orange (and coloured) left rules**: `border-l-[3px] border-brand-orange`, `border-l-[4px] ${outcome.border}`, `border-l-[3px] border-foreground` callouts | `workshop-detail-content.tsx` l.65; `course-ledger-row.tsx` l.175; `workshop-decision-lab.tsx` l.525, 541; "Referenz" header; 187 `border-l-*` hits in 107 `src` files (audit the learning surfaces) | The Kopflinie for sections; an ink square marker for "in path"; verdict chips for feedback. The q-card bar is the single exception |
| 7 | **Two-tone and italic accent headlines**: ink clause plus orange clause; italic orange phrase; `.text-gradient` naming | Demos hero and 12 tiles; `/kurse` hero; course-DS landing; W01 hub "into a **decision**."; W02 deck "Make **Decisions**" | One colour, roman; emphasis by structure |
| 8 | **Hover gimmicks**: `hover:-translate-y-0.5`, `group-hover:-rotate-1`, `shadow-card-hover` lifts | `workshops-content.tsx` l.174, 191 | Colour, underline, `.arrow-nudge` |
| 9 | **Crushed display type**: `font-black`, `tracking-[-0.04em]` to `[-0.07em]`, `leading-[0.9]`, `--text-fluid-h1--line-height: 0.95` | `workshops-content.tsx` l.63, 87, 218; `workshop-detail-content.tsx` l.70; `globals.css` | Scale from 5.2 |
| 10 | **Decorative textures and marks**: `.bg-dot-pattern`, `.bg-grid`, `.berlin-grain`, `.demo-corner-*`, `.glow-*`; the W01 hub dotted background; the footer's decorative circles | `globals.css`; `demos/page.tsx`; `ki-prognosen-einschaetzen/hub.html`; `components/footer.tsx` | Nothing. Paper is enough |
| 11 | **Random dark tiles and the indigo dark scope** (`#242342`) | `demos/page.tsx` tiles 04, 05, 08; `.dark-section`; the footer | Graphit only as a full-width band |
| 12 | **Coloured glyph "feature icons" and per-chapter colour coding**: ◇ ○ △ □ ◈ ×, coloured dots, coloured left borders, the pastel cycle diagram | `components/data-science/chapters/de/ch-overview.tsx` and its siblings | Deck pictograms in ink; a list without icons |
| 13 | **Input-looking duration boxes** | `course-ledger-row.tsx` (duration cell) | Plain `tabular-nums` caption text |
| 14 | **Re-drawn app chrome in previews** (Excel window, Word doc, CRM card) | `components/demos/demo-gallery-previews.tsx` | Schematic pictogram drawings on a Beton panel |
| 15 | **Pills and loud chrome**: acid DE toggle, cobalt LOGIN button, floating shadowed pill nav, `rounded-full` | `components/nav.tsx`; 37 `rounded-full` hits | A square ink-underline language switch; login as a secondary ink button; a flat paper nav with a hairline |
| 16 | **Empty "press play" states** | W03 `demo.html` ("Press 'Replay on both'") | Final state rendered on load |

---

## 9. Accessibility

- **Contrast** (computed, section 5.1):
  - All text tokens pass AA on every surface they are allowed on. Ink and Schiefer pass AAA.
  - Mennige text is 5.08:1 on paper and 4.55:1 on Beton. On Beton, use Mennige tief `#97300f` (6.02) for text below 18.66px bold or 24px regular.
  - On graphit: `#f2f1ee` 16.31, Leinen 11.79, `#a8a097` 7.14, accent `#e07050` 5.79. Mennige `#b73a15` is 3.18 on graphit, so it is used only for non-text bars (≥ 3:1 under 1.4.11), never for text.
  - Control boundaries: `#827970` reaches 3.75 on paper and 3.36 on Beton. On dark, `rgb(242 241 238/.4)` reaches 3.52. Leinen hairlines (1.37) are decorative and never the only cue for a control or state.
  - The primary button's paper-on-Mennige text is 5.40 (7.14 on hover). The ink button is 17.50.
- **Focus:** a 3px Mennige outline with a 2px offset (5.08 on paper, 5.79 `#e07050` on dark, 3.24 against an adjacent ink button). It is never animated (instant). Whole-card links show the ring on the card through `has-[:focus-visible]`.
- **Not colour alone (1.4.1):** pass is always icon plus word; selection is ink fill or an inset square plus weight change; hatch and solid encodings always carry a text legend; the Route state is also a word in `sr-only`.
- **Targets:** 44×44 minimum (site contract), including filter chips, radio rows (`min-h-12`), text links (`min-h-11`) and the language switch.
- **Text:** labels ≥ 13px (contract ≥ 12). Body 17px. Measure ≤ 64ch. No uppercase runs, which also helps screen-reader pronunciation of German.
- **Structure:** each page has one H1; the cover band is a `<section>` with `aria-labelledby`; the Route is an `<ol>` with `aria-current="step"`; the decision lab uses `<fieldset>`/`<legend>` with native radios restyled (`appearance-none`) so keyboard and screen-reader behaviour stay native; feedback lands in `role="status"`; the globe is `aria-hidden`.
- **Motion:** as in 5.7. `prefers-reduced-motion` is fades only or static. The Route draws once. No scroll-triggered reveals elsewhere.
- **Forced colours:** structure is carried by borders, not shadows or fills, so it survives. The pictograms use `currentColor`. Hatch patterns need an `@media (forced-colors: active)` fallback to a dashed border.
- **Language:** English-only materials get `hreflang="en"` and "EN" in the meta chip; the German page keeps `lang="de"`.

---

## 10. Implementation notes for the build agents

1. **Order:** tokens (`globals.css` `@theme`, `.dark-section`), then shared primitives (Kicker, SectionHead, Button variants, Chip, StatRow, LedgerRow, Route, QuestionCard, CoverBand, MaterialList, Callout, Pictograms), then workshop hub and detail, then decision lab, then courses hub and atlas, then course landings, then demos hub and detail, then static `_shared/` CSS and the materials.
2. **Tests that pin the old look and will need deliberate updates** (update the assertion, do not delete the intent):
   - `app/kurse/learning-atlas.test.tsx` l.375 (`bg-kupfer-mist`), l.610-617 (plate tones `bg-brand-*`), l.663 (`border-l-brand-orange`)
   - `components/ui/highlighted-text.test.tsx`
   - `app/workshops/workshops-content.test.tsx`
   - `app/workshops/[slug]/workshop-decision-lab.test.tsx`
   - `workshop-detail-content.test.tsx`
   - `lib/learning-surface-density-contract.test.ts` (keep: it bans `transition-all`, infinite animations and labels below 12px, all compatible)
   - `access-surfaces-density.test.ts` and `public-information-density.test.ts` (compatible: they ban shadows and `rounded-full`)
   - `docs/experience-system.md` "Identity" lists the expressive palette. Update that paragraph so the contract matches.
3. **New lint or contract test** (extend `learning-surface-density-contract.test.ts` for the learning surfaces): fail on `bg-brand-(acid|sky|pink|peach|cobalt|teal)`, `shadow-tile`, `shadow-\[\d+px_\d+px_0`, `translate-[xy]-3`, `rotate-\d`, `uppercase` combined with `tracking-\[0\.`, `border-l-\[[3-9]px\]`, `rounded-(full|xl|2xl)`, `font-black`, `tracking-\[-0\.0[4-9]em\]`, `italic` in headline elements. For `public/workshops/**/*.{html,css}`: fail on `box-shadow:\s*\d+px \d+px 0`.
4. **Workshop type:** `Workshop.number` is typed `"01" | "02" | "03"` in `src/lib/workshops.ts`. Extend it for W04. Covers: add a Playwright script that renders `slides.html#cover/0` for each workshop into `card-preview.webp` (fixes the blank W03 card).
5. **Performance:** the globe SVG is 158 KB. Optimise it and keep it out of LCP. The cover-preview webps already exist at about 37 KB. There are no new fonts; Loehrning Sans stays.
6. **Pictograms:** generate the React components from the deck's `<symbol id="i-*">` sprite in `slides.html` rather than redrawing, so web and deck never diverge.

---

## 11. UI-label voice (for components; the copy stream owns the rest)

- **Labels are nouns:** "Ablauf", "Material", "Der Fall", "Für wen", "Du gehst mit".
- **Buttons are verb plus object:** "Deck öffnen", "Kit herunterladen (1,1 MB)", "Entscheidung prüfen".
- **Numbers with units, as data:** "75 Min.", "26 Szenen", "144 Konten".
- **Avoid:**
  - hype verbs (entfesseln, revolutionieren, nahtlos, unlock, supercharge, leverage, empower, delve)
  - "nicht X, sondern Y" or "not X, it's Y" antitheses
  - automatic triplets
  - em-dash chains
  - rhetorical questions as headings unless it is the workshop's real question
  - "KI-gestützt" as decoration
- **Provenance is stated, not dramatised:** "Aufgezeichnet am 23. Aug. 2026. Keine Live-Abfrage."

---

## 12. Artefacts produced for this report

- Deck scene screenshots (1440×900, final step of each scene, reached by ArrowRight; the last one by hash): `research/deck-shots/01-cover-s1.png` to `18-resolution-s3.png` (18 files).
- Font comparison of Loehrning Sans and Typing: `research/font-compare.png`.
- Contrast calculator: `tmp/contrast.py`. Capture scripts: `tmp/deckshots.mjs`, `tmp/deckres.mjs`, `tmp/fontcmp.mjs`. All are in the scratchpad; nothing was written to the repo.

## 13. Sources

- Hallmark anti-patterns reference (fetched in full): https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/anti-patterns.md
- Anti-AI-UI README (fetched): https://github.com/Vanszs/Anti-AI-UI
- Anthropic brand guidelines skill (fetched): https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md
- AI design tells (search summaries): https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65 · https://www.925studios.co/blog/ai-slop-design-tells · https://smoothui.dev/blog/ai-design-slop · https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p · https://vibecodekit.dev/ai-slop-design
- Linear: https://linear.app/now/how-we-redesigned-the-linear-ui · https://linear.app/now/behind-the-latest-design-refresh · https://linear.app/changelog/2026-03-12-ui-refresh
- Vercel Geist: https://vercel.com/geist/introduction · https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design
- Anthropic design and Academy: https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42 · https://type.today/en/journal/anthropic · https://anthropic.skilljar.com/ · https://www.termdock.com/en/blog/anthropic-academy-claude-courses-guide
- Stripe Press: https://press.stripe.com/ · https://siiimple.com/stripe-press/ · https://yuinchien.com/p/stripe-press · https://www.webgpu.com/showcase/3d-books-by-stripe-press/
- Observable Framework themes: https://observablehq.github.io/framework/themes
- Brilliant: https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations
- Maven: https://maven.com/resources/connected-syllabus · https://help.maven.com/en/articles/6739349-landing-page-hero-section
- Frontend Masters: https://frontendmasters.com/learn/ · https://frontendmasters.com/faq/learning-paths/
- Josh Comeau: https://www.joshwcomeau.com/courses/ · https://courses.joshwcomeau.com/joy-of-react
- Bartosz Ciechanowski: https://ciechanow.ski/ · https://ericholscher.com/blog/2025/jan/7/everything-bartosz-ciechanowski-makes/ · https://css-tricks.com/bartosz-ciechanowskis-interactive-blog-posts/
- The Pudding: https://pudding.cool/ · https://pudding.cool/process/how-to-make-dope-shit-part-3/
- Apple DocC tutorials: https://developer.apple.com/videos/play/wwdc2021/10235/
- Swiss style revival: https://www.printmag.com/featured/swiss-style-principles-typefaces-designers/ · https://www.ideaflow.studio/en/blog/minimalism-reloaded-how-swiss-style-design-is-shaping-websites-in-2025
- 2026 trend summaries (warm neutrals, hairlines, anti-AI): https://www.figma.com/resource-library/web-design-trends/ · https://graphicdesignjunction.com/2025/12/web-design-trends-of-2026/
- AI writing tells: https://www.ignorance.ai/p/the-field-guide-to-ai-slop · https://copyadscontent.com/signs-of-ai-writing/
