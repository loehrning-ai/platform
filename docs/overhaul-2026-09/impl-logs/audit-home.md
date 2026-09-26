# Home on phones: audit and brief for the globe hero (audit-home)

Read-only audit of `/` and `/en` below `lg`, 2026-09-26. Dev server on :3000. All numbers below were measured in this container with Playwright/Chromium (`isMobile`, `hasTouch`, DPR 3) unless a line says otherwise. Scripts, raw measurements and screenshots are in `scratchpad/mobile/audit-home/` (see section 9).

---

## 0. Summary

1. **Phones get no globe.** `hero.tsx` loads `HeroNetwork` only when `matchMedia("(min-width: 1024px)")` matches. The docs and five tests pin this (`experience-system.md`: "The projection module and SVG tree are not loaded or rendered on mobile"). A phone globe is therefore a policy change. The implementer has to amend the doc section and `motion-policy-contract.test.ts` together.
2. **The first viewport is still in the retired risograph style, and it is weak.**
   - An acid-yellow "ERSTER SCHRITT" continue card comes first.
   - The headline is cut to "KI verstehen." and "Sicher anwenden." exists only in `aria-label`.
   - A 4–5 line intro sits in a rounded, shadowed card.
   - The CTA is a cobalt pill.
   - There is dot grain on the hero and a cobalt/orange 64px grid on `body`.
   - Only the footer has been migrated to Werkzeichnung.
3. **Page length:**

   | Phone | Page height | Usable screens (between top bar and tab bar) |
   |---|---|---|
   | 320×568 | 3,254px | 7.0 |
   | 375×667 | 2,926px | 5.2 |
   | 390×844 | 2,908px | 3.9 |
   | 430×932 | 2,840px | 3.4 |

4. **Do not port `hero-network.tsx` to phones.** At 4× CPU it costs 61.7ms of main thread per frame: 28.9ms script, 11.0ms style and 3.2ms layout, because it writes 277 SVG paths with `setAttribute` on every frame. It runs at 16fps with 50 long tasks in 6s. A minimal Canvas 2D globe draws the same content (graticule, 1,250-point coastline and 2,900 land dots) in **1.2–1.7ms of script per frame at 4×**.
5. **Lighthouse audits `/` as a phone.** `lighthouserc.json` sets no `settings`, so LH 12.6.1 uses its mobile default: 412×823, DPR 1.75, simulated slow 4G, CPU ×4. The limits are TBT ≤ 200ms, LCP ≤ 4.5s, CLS ≤ 0.1, accessibility = 1.00, script ≤ 360 KiB and total ≤ 1 MiB. Every frame the phone globe draws inside the trace counts.
6. **Bug found on the way (EN):** `/en` course cards show German unit labels ("5 BLÖCKE", "4 MODULE"). `offering.tsx` prints `course.unitLabel` from `COURSE_CATALOG` instead of `localizeCatalogCourse(course, locale).unitLabel`. `offering.test.tsx` misses this because its German-token regex has neither `Blöcke` nor `Module`.

---

## 1. What a phone user sees today

### 1.1 First viewport (measured, DE; EN is the same geometry)

The top bar covers 0–48px. The tab bar is a 56px row plus a 1px hairline, so its top edge sits at H−57. The dev-only Next "N" badge sits over the Start tab; ignore it.

| Phone | Continue card | H1 (font) | Intro card | CTA | Hero bottom | Tab bar top |
|---|---|---|---|---|---|---|
| 320×568 | 60–136 | 152–182 (32px) | 198–350 (5 lines) | 370–416 | 436 | 511 |
| 375×667 | 60–136 | 152–182 (32.3px) | 198–324 (4 lines) | 344–390 | 410 | 610 |
| 390×844 | 60–136 | 152–184 (33.5px) | 200–326 (4 lines) | 346–392 | 412 | 787 |
| 430×932 | 60–136 | 152–187 (37px) | 203–329 (DE) / 203–303 (EN) | 349–395 | 415 | 875 |

Reading top to bottom at 390×844, a phone user sees:
1. An acid-yellow rounded card: "ERSTER SCHRITT / Claude Course / Ohne Lernkonto · ca. 2 Std." with a cobalt arrow chip.
2. "KI verstehen." in bold, with a white print drop-shadow.
3. A rounded, bordered, shadowed intro card of 4 lines.
4. A cobalt rounded "Lernroute wählen →" button.
5. The courses section starting at 412px: the "Grundlagenpfad" kicker, a two-tone H2 over two lines, and about 1.3 pastel course cards.

At 320×568 the only thing below the CTA is the kicker and the top of the H2.

### 1.2 Section heights at 390×844, DE

| Section | Height |
|---|---|
| Continue seat | 88px |
| Hero | 276px |
| Courses | 617px |
| Rails | 385px |
| Resources | 513px |
| Principles | 490px |
| Footer | 436px, plus a 56px tab-bar reserve on `body` |

At 320 the courses section alone is 755px, because the uppercase mono meta ("5 BLÖCKE · 18 LEKTIONEN") wraps to two lines and the "Dazu 6 technische Kurse" strip squeezes into a narrow column.

### 1.3 What is weak or dated

- **Missing identity anchor.** `experience-system.md` names "the line globe (homepage hero, workshop cover bands)" as the spatial identity anchor. On phones neither place shows it: `CoverBand` hides its globe below `md` and the home hero has none.
- **The promise is only half stated.** Below `lg` the H1 prints `headline.slice(0, 2)`. The biggest block in the first viewport is explanation text (126–152px), not the promise.
- **The first element is a notification-style card** in retired acid, with an uppercase mono eyebrow, `rounded-2xl` and `shadow-card`. It comes before the hero.
- **Retired risograph remnants across the page:**
  - colours: `brand-cobalt/acid/sky/pink/peach/teal`, `shadow-card`, `rounded-[1.5rem]`, and the offset stamp shadows on the course number badges;
  - type: uppercase mono eyebrows;
  - hero decoration: `berlin-grain`, the white drop-shadow on the H1, lucide icons in coloured chips;
  - global: the cobalt/orange 64px grid on `body` in `globals.css`.

  Count of retired tokens per file: offering 49, workflow 41, hero 23, mobile-rails 15, credibility-strip 15, continue-card 11, course-artwork 4.
- **The loudest element on the page is the account upsell**: a cobalt slab with an acid "Zum Konto" button in the resources section.
- **The page ends in a different visual system than it starts.** The graphit footer is Werkzeichnung.
- **Old colour on desktop (context only).**
  - `hero-network.tsx` still uses `KUPFER = "#C4431A"`, which `hero-network.test.tsx` asserts via `path[stroke="#C4431A"]`.
  - The desktop H1 is two-colour (cobalt and Mennige); design-direction bans this.
  - The desktop hero also has a pink rotated square and print registration marks.

### 1.4 What the first viewport must achieve

- **One promise:** the full H1 on two lines, "KI verstehen. / Sicher anwenden." (EN: "Understand AI. / Apply it safely.").
- **One supporting line,** at most 2 lines.
- **One primary action,** "Lernroute wählen" → `/kurse`, in the thumb zone.
- **The globe as the emotional anchor.**
- **The tab bar never covers content.** Every piece of hero content ends above H−57 at all four reference sizes.
- **The continue row stays visible** at 390×844 and 430×932 without scrolling. An e2e test pins 320×844 and 390×844.

---

## 2. Map of the home page

`src/app/page.tsx` is a server component. `src/app/en/page.tsx` is a generated re-export of it. It renders:
`ContinueSlot → HeroSection → Offering → MobileRails → Workflow → CredibilityStrip`. `companion-home-contract.test.ts` pins this order.

| File | Role | Notes for phones |
|---|---|---|
| `components/home/continue-slot.tsx` | `"use client"`, `lg:hidden`, `px-6 pt-3`, and a fixed `h-[4.75rem]` seat. It mounts `ContinueCard` via `dynamic(..., {ssr:false})` after mount. | The server HTML reserves 88px. The card is `h-full`, so it causes no CLS. |
| `components/home/continue-card.tsx` | Client card that reads `lib/progress/store` and picks a resume or start target. | Acid, rounded, mono uppercase eyebrow. Must stay 76px tall (e2e). |
| `components/home/continue-courses.ts` | Server-only course facts passed as props. | Keeps the catalog out of the client graph (contract test). |
| `components/home/hero.tsx` | `"use client"`, wrapped in `withMotionProvider`, which gives LazyMotion domAnimation. | See the list below this table. |
| `components/home/hero-network.tsx` | 1,167 lines. **SVG**, not canvas: an orthographic projection (R=500) with a 7° graticule and six countries (DE, BR, CN, US, IN, JP) as Kupfer outlines, hatch and glow. The rAF loop rebuilds every path's `d` each frame. There is a sparse first-paint shell, and a static composition for reduced motion or `mobile`. | 39.0 KB min / **15.6 KB gzip** (esbuild estimate, React and framer excluded). Desktop only. |
| `components/home/hero-network-steps.ts` | Six journey beats: Kurse/Berlin, Bücher/São Paulo, Open Source/Peking, Demos/SF (`rLon -82`), EU AI Act/Mumbai, Blog/Tōkyō. EN words via `heroNetworkSteps(locale)`. | Pinned by `hero-network.test.tsx`. |
| `components/home/offering.tsx` | Courses. Four spine courses (`courseGroupFor !== "deeper"`) as image cards (`CourseArtwork`, 72px thumbnail below `sm`), plus the "deeper" strip linking to `/kurse`. | EN unit-label bug. Four `cover-v3.webp` images must load (e2e). |
| `components/home/course-artwork.tsx` | `next/image` lazy loading, `sizes "(max-width: 639px) 72px"`, `min-h-[4.75rem]`. | Pinned by the contract test. |
| `components/home/mobile-rails.tsx` | `lg:hidden`. Demos rail (6 tiles) and books rail (1 tile). Scroll snap plus `content-visibility:auto`. Zero client JS. | Class list pinned by `mobile-rails.test.tsx`. |
| `components/home/workflow.tsx` | Resources: 5 tiles (Blog, Lernbücher, Praxisbeispiele, Workshops, Open Source) and a cobalt account slab linking to `/konto`. | Hrefs and labels pinned by e2e. |
| `components/home/credibility-strip.tsx` | Four principles as a `dl`. | Texts pinned by e2e. |
| `components/home/home-copy.ts` | All DE/EN copy: hero `headline[3]`, `introduction`, `primaryCta`, `pillars`; plus offering, workflow, companion and credibility copy. | |
| `components/werk/globe-lines.tsx` and `globe-geometry.ts` | Werkzeichnung globe, **server-rendered SVG with no JS**. The graticule is drawn as one elliptical arc per circle (about 4 KB of markup). There is a hand-simplified Germany outline (about 70 vertices) and `projectPoint()`. Styled for graphit: `#f2f1ee` strokes at 0.28/0.16 opacity, Germany in `#b73a15` with fill-opacity 0.14 and stroke-opacity 0.7. | The right basis for the first frame. `globe-geometry` is 1.3 KB gzip. |

What `hero.tsx` does today:
- It holds the one `<h1>`: a phone-only span that prints `headline.slice(0,2)` as one text node, and a desktop span (`hidden lg:inline`) holding the three-part lockup. `aria-label` carries the full promise.
- It adds an inline `<style>` with the H1 clamps.
- The intro is a rounded card and the CTA is a `BrandButton` in cobalt.
- The pillars are hidden below `lg`.
- `useScroll` and `useTransform` run on phones too, even though nothing there uses them.

### Geography data and licence

- **`src/lib/country-polylines-3d.ts`** (26 KB source) is generated by `scripts/extract-country-outlines.mjs` from `world-atlas/countries-50m.json` via `topojson-client`. It holds six countries only, exterior rings only, simplified with Douglas-Peucker at 0.10°. **Germany is scaled 2.2× around its centroid**, so it is not geographic.
- **Both packages are present** in `packages/website/node_modules` as **devDependencies**: `world-atlas ^2.0.2` (ISC; Natural Earth data is public domain) and `topojson-client ^3.1.0` (ISC). The notices are already in `LICENSES/world-atlas-ISC.txt` and `LICENSES/topojson-client-ISC.txt` at the repo root. Use them only in a build-time script that writes a generated `.ts` file, as the existing extractor does. Never import them at runtime.
- **Available files:** `land-110m.json` (55 KB, 125 rings, 5,071 points), `land-50m.json` (546 KB), `countries-110m.json` (108 KB, including 2,807 points of internal borders), and the 50m and 10m variants.
- **Measured sizes for a phone globe** (Int16 lon/lat ×100, gzip):

  | Dataset | Rings / points | Size |
  |---|---|---|
  | land-110m, DP 0.6°, drop rings < 4 deg² | 68 rings / 1,250 points | **4.8 KB gzip** |
  | land-110m, DP 0.35° | 2,050 points | 7.8 KB gzip |
  | land-110m, DP 1° | 768 points | 2.9 KB gzip |
  | Land bitmask on a 2° grid (16,200 cells, 4,791 land) | – | 2.0 KB raw / **0.75 KB gzip** |
  | Land bitmask on a 1.5° grid | – | 1.0 KB gzip |

  An equal-area 2° dot set has about 2,900 land dots. Delta encoding would shrink every figure further.

---

## 3. Brief for the prototype builders

### 3.1 Hero slot geometry

Tokens: top bar `--nav-h-compact` = 48px. Tab bar `--tabbar-h` = 56px, plus a 1px hairline, plus `--safe-area-bottom`, which is 0 in emulation.

The two layout options below have **the same globe area**. The only difference is where the 76px continue row sits.

- **Option A: no test churn.** The continue seat stays first (88px: 12px padding plus the 76px card). The hero slot runs from **136 to H−57**. Render the seat on the same graphit band, so the band visually starts under the top bar and the continue row is its first row.
- **Option B: recommended for the owner's goal.** The hero comes first and the band runs from **48 to H−57**. The continue row docks as the band's last row, directly above the tab bar, so the globe and promise come first and the card sits in the thumb zone. This needs the page-order assertion in `companion-home-contract.test.ts` updated. Check it against the doc line "The first decision on a route comes before its explanation".

| Viewport | Band (48 → tab top) | A: hero slot | B: content above the docked row | Rec. H1 size (see 3.2) | "Sicher anwenden." width / content width at 16px gutters | Text stack (see 3.2) | Globe space if stacked (B / A) |
|---|---|---|---|---|---|---|---|
| 320×568 | 463 | 375 (136–511) | 387 (48–435) | 32.8px | 269 / 288 | ≈247 | 140 / 128 → **must be a backdrop** |
| 375×667 | 562 | 474 (136–610) | 486 (48–534) | 39.1px | 320 / 343 | ≈259 | 227 / 215 → backdrop |
| 390×844 | 739 | 651 (136–787) | 663 (48–711) | 40.9px | 335 / 358 | ≈263 | 400 / 388 |
| 430×932 | 827 | 739 (136–875) | 751 (48–799) | 45.5px | 372 / 398 | ≈272 | 479 / 467 |
| 768×1024 (still < lg) | 919 | 831 | 843 | 48px (cap) | – | ≈277 | 566 / 554 (cap the globe; the hero must end ≤ 1024 per e2e) |

Layout rules that follow from the table:

- **Composition.** At 320×568 and 375×667 a globe stacked above the text gets only 130–230px. **The globe must be a full-bleed backdrop of the band**, cut off by the band edges as on the deck cover, with the text laid over its quiet part. A stacked layout is only acceptable from 390×844 upward.
- **Sizing.** Size the band in CSS only, for example:
  `min-height: calc(100svh - var(--nav-h-compact) - var(--tabbar-band-h))` (Option B). Subtract the seat in Option A.
  - Use `svh`, never `vh` or `dvh`. `dvh` re-lays out while the iOS toolbar collapses.
  - Never hard-code 48 or 56.
  - An optional 24px "peek" of the next section's Kopflinie works as a scroll cue.
- **Landscape and short screens** (`max-height: 30rem`; for example 844×390 has 285px between the bars): the band falls back to auto height, and the globe becomes a smaller side element or is hidden. Text must never overflow.
- **Real iOS Safari** with its toolbars expanded is shorter than the Playwright sizes. Designs that pass 320×568 and 375×667 cover this; check one real device.
- **Thumb zone.** From 390×844 up, put the CTA in the lower half of the band.

### 3.2 What must stay in the first viewport

| Element | Spec | Why |
|---|---|---|
| H1 | Exactly one `<h1>`. Two lines on phones: "KI verstehen." / "Sicher anwenden." (EN: "Understand AI." / "Apply it safely.").<br>Recommended size: `clamp(2rem, 11.5vw - 0.25rem, 3rem)`, 700 weight, line-height 1.0, tracking -0.01 to -0.015em.<br>Measured in Loehrning Sans 700: "Sicher anwenden." = 8.19 × font-size px; "Understand AI." = 6.83×.<br>Keep `text-wrap: balance` and let it wrap without overflowing if the fallback font is wider. | `hero.test.tsx` needs text nodes "KI", "verstehen." and "Sicher anwenden." in the DOM. The desktop lockup spans already provide them; if they are restructured, keep three parts. Heading name must be "Understand AI. Apply it safely.". The `responsive.spec` requires the H1 inside 320px. |
| Supporting line | One sentence, ≤ 2 lines at 17px/1.45 (≤ 50px). Plain text: no card, no border, no shadow. The current intro is 4–5 lines. Shortening it is a copy decision, and the facts "frei, zweisprachig" stay on the page in the principles section. | Doc: "Keep the globe, core claim, one supporting sentence, and one primary action." |
| Primary CTA | "Lernroute wählen" → `/kurse`; EN "Choose a learning route" → `/en/kurse`. Must be the **first `a[href$="/kurse"]` inside `[data-section="hero"]`**. On graphit use `ButtonLink tone="dark" variant="primary"`: a paper fill with ink text, square, `min-h-11`. Minimum 44×44. | `route-home-locales` needs it fully in the viewport at 320/390/768/1440 × 844 (tighten to above the tab bar). `funnel-homepage-to-journey` clicks the first "Lernroute wählen". `hero.test.tsx` checks the link. |
| Continue row | Stays 76px (`h-[4.75rem]` seat). Fully between the header bottom and the tab bar top, unobscured, at 320×844 and 390×844, for both locales. Restyle it to Werkzeichnung on graphit or paper: hairline, sentence-case label, no fill colour. | `mobile-access-disclosure.spec.ts` (`cardBox.height === 76`, `expectReadable`), `continue-slot.test.tsx`. |
| Globe | `aria-hidden`, decorative. No information lives only in the globe. | Accessibility score must be 1.00. |
| Section marker | Keep `data-section="hero"` on the section. Keep the hero pillars in the DOM: `max-lg:hidden` is allowed, because `hero.test.tsx` checks their links. | Tests and scans key on it. |

Fonts: only Loehrning Sans 400 and 700 are preloaded, and every face uses `font-display: optional`.
- `ButtonLink` uses 600 (`font-semibold`), which is not preloaded. On a cold, slow first visit the CTA and the 600-weight labels can render in the fallback face (Arial with metric overrides; in this container the fallback is DejaVu, visible on a cold `/workshops` load).
- Keep hero text to 400 and 700, or accept the fallback.
- Never draw text inside a canvas.
- **Warm the cache (load twice) before judging screenshots.**

### 3.3 Visual rules (Werkzeichnung, from design-direction.md)

- **Band colours.** A full-width graphit `#141414` band (`.dark-section` tokens). Text `#f2f1ee` at 16.3:1, secondary Leinen `#d4cec5`, accent text `#e07050`.
- **Globe strokes.** Paper `#f2f1ee`: graticule at about 0.16 opacity, limb at about 0.28, coastline or dots at about 0.45–0.6.
- **One Mennige mark per drawing:** for example Germany in `#b73a15`, fill-opacity about 0.14 and stroke about 0.7, as in `GlobeLines`. **No `#C4431A`.**
- **Geometry and type.** Radius 0, no shadows, no gradients or glow blobs, no grain. No two-colour headline, no `font-black`, no drop-shadow, no uppercase. Mono only for data.
- **One filled Mennige button per page.** On graphit the CTA is the paper button.
- **Scope the dark tokens to phones correctly.** `.dark-section` is plain CSS inside `@layer utilities`, so `max-lg:dark-section` will not exist in Tailwind v4. Either define an `@utility`, or scope the tokens with `@media (width < 64rem) { [data-section="hero"] { … } }` so desktop stays paper. Remove `berlin-grain` and the white drop-shadow below `lg`.
- **Visual-regression smoke** (`/` at 390×844, reduced motion) still needs luminance std-dev ≥ 8, dominant colour < 95% of pixels, and edge ratio > 0.01. A mostly graphit viewport passes only if the globe lines, text and paper bars stay visible.

### 3.4 Performance budget for the phone globe

Baselines measured here: the current desktop SVG globe at 1280×800 on `/en`, and a minimal Canvas 2D probe (`probe.html`) at 390×844, DPR 3, with the backing store capped at DPR 2. The probe draws the graticule (10°), 1,250 coastline points, about 2,900 land dots and the limb.

| Budget item | Limit | Reference |
|---|---|---|
| JS for the globe (code + land data, gzip) | **≤ 12 KB**, loaded by dynamic import after hydration and idle. **0 KB added to the initial client graph** of the home route. No new runtime npm dependency. Never import `world-atlas` or `topojson-client` at runtime. | Current desktop chunk: 15.6 KB gzip. `globe-geometry.ts`: 1.3 KB gzip. Land data: 0.75–4.8 KB gzip (section 2). |
| Server first-frame markup | ≤ 12 KB of HTML (≈ 4–5 KB gzip). No `id` attributes. | `GlobeLines` graticule ≈ 4 KB. |
| Init (decode data, precompute unit vectors) | ≤ 10ms per task at 4× (≈ 3ms at 1×). **No task ≥ 50ms at 4×, ever.** | – |
| Script per frame (rAF callback) | **p95 ≤ 3ms at 4× CPU** | Probe: 1.2–1.7ms at 4×; 0.2–0.6ms at 1×.<br>Current SVG globe: 28.9ms script + 11.0ms style + 3.2ms layout per frame at 4×. |
| Style and layout per frame | **0**: no per-frame DOM or SVG attribute writes. Canvas, or compositor-only `transform`/`opacity`. | The SVG globe rewrites 277 paths per frame. |
| Total main-thread task per frame in **this** container | **≤ 12ms p95 at 1×**, so that Lighthouse's ×4 simulation keeps every frame under the 50ms long-task line. If over: drop the backing cap to 1.5, shrink the canvas to the visible globe region, or run at 30fps. | This container has no GPU, so canvas raster runs on the main thread and dominates.<br>Probe: 9.0–10.2ms at 1×; 27–32ms at 4× with cap 2; 7.3ms at 4× with cap 1.<br>Current SVG globe: 20.5ms at 1× (37fps) and 61.7ms at 4× (16fps, 50 long tasks in 6s). |
| Frame rate | Target 60fps on a mid-range phone and cap at 60 on 120Hz screens. Motion is **time-based**, so a dropped frame never slows the rotation. | – |
| Canvas memory | Backing store DPR ≤ 2 and ≤ 1.2 MP (390×739 CSS at DPR 2 ≈ 1.15 MP). | – |
| Page-level (Lighthouse, mobile) | LCP ≤ 4.5s, TBT ≤ 200ms, CLS ≤ 0.1, script ≤ 360 KiB, total ≤ 1 MiB, accessibility 1.00, performance ≥ 0.80. | `lighthouserc.json` (root). CI's first route is `/`. |

Lighthouse TBT is the budget most at risk. Under simulated throttling, if frames keep producing long tasks, TTI never settles, and every long task until the end of the trace counts toward TBT. **Never start the loop before `load` plus `requestIdleCallback`** (timeout of about 2.5s), **and keep each frame under the 12ms-at-1× line above.** The canvas is not an LCP candidate and a paths-only SVG is not either, so the H1 text stays the LCP element. Never fade it in.

### 3.5 First-frame strategy

1. **Server-render the first frame as an inline SVG, with no client JS.** Draw the graticule with `werk/globe-geometry` (`graticulePath`, `projectPoint`) and the coastline or dots projected on the server at the opening view. Size it with CSS (`aspect-ratio` or the band's `calc(... svh ...)`), so there is zero CLS and no hydration flip. Use `vector-effect="non-scaling-stroke"`. This frame is what users with reduced motion, no JS, or Save-Data keep.
2. **Load the live renderer only below `lg`**, only when motion is allowed and `navigator.connection?.saveData` is not set, and only after `load` plus idle. Load it with a dynamic import from a `useEffect`; never from the server tree.
3. **Draw frame 0 into a canvas stacked exactly over the SVG,** using the same projection, colours and widths. Then hide the SVG in the same frame, or cross-fade over at most 120ms. No visual jump.
4. **Start the opening motion ≥ 1.5s after first paint** (desktop uses 2s), easing in with `cubic-bezier(0.16,1,0.3,1)`.
5. **H1, supporting line and CTA are never animated in:** no `opacity:0` in the SSR HTML. The `a11y-reduced-motion` and `reduced-motion-reveals` tests check this.
6. **New attribute namespace:** `data-home-globe`, `data-home-globe-motion="static|running|paused"`. **Do not use `data-hero-globe-*` or `data-hero-network-*` below `lg`.** `route-home-locales` and `motion-control` assert those names are absent at phone widths, and `motion-control` / `hero-responsive-network` assert that `data-hero-network-shell`, `data-hero-globe-motion` and `data-hero-globe-poster` never appear in the SSR HTML.

### 3.6 Motion and pause rules

- **Reduced motion** (`prefers-reduced-motion: reduce`): show the static SVG only. The module never loads and no pause control is rendered. Check the media query directly inside the effect, as `hero-network.tsx` does, so no live frame runs while React syncs the preference.
- **When to stop:**
  - the band is less than about 10% visible (`IntersectionObserver`);
  - `document.visibilityState === "hidden"`;
  - `pagehide`;
  - Save-Data or `prefers-reduced-data`.

  Resume from the same angle: keep a clock that excludes paused time, as the desktop globe does.
- **Governor:** if the measured frame interval stays above 20ms for about 30 frames, drop to 30fps. If it stays above 40ms, freeze on the current frame.
- **WCAG 2.2.2 (Pause, Stop, Hide):** motion that lasts more than 5s next to other content needs a pause mechanism. Pick one of two options:
  - **(a)** A finite opening of ≤ 5s, after which the globe rests. Any further motion is user-initiated only (drag to spin, or tap to replay), so no pause control is needed.
  - **(b)** Continuous slow rotation plus a pause control. The control must be a real `<button>`, ≥ 44×44, focusable, with a visible focus ring. It must not overlap the H1, CTA or continue row. Reuse the copy "Globus anhalten/fortsetzen" and "Pause/Resume globe motion" (both exist in `hero.tsx`). Do not reuse the name pattern `/globe motion/` below `lg` unless `hero-responsive-network.test.tsx` is updated, because that test asserts no such button exists below 1024px.

  Every prototype must say whether it chose (a) or (b).
- **One moving region.** The continue row, text and tab bar stay static. No scroll-linked JS on phones: `hero.tsx` should stop running `useScroll` below `lg`. The phone shell uses `scroll-behavior: auto` on purpose.
- **Drag to spin**, if a prototype adds it: use pointer events, `touch-action: pan-y` on the globe so vertical page scroll still works, passive listeners, and inertia that is time-based and decays in ≤ 1.2s.

### 3.7 Constraints to design against

- **CSP for `/`.** The page is shared-cacheable, so it gets only the baseline policy, verified on the dev server:
  - `script-src 'self' 'unsafe-inline'` (dev adds `'unsafe-eval'`; **prod does not**, so no eval or `new Function`);
  - `script-src-attr 'none'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`, `connect-src 'self'`, and no `worker-src`.

  Consequences:
  - Canvas 2D, WebGL, inline `<style>` and `style=""` are allowed.
  - `blob:` workers and images are blocked.
  - A same-origin worker file would pass the baseline, but it adds bundling risk, and the nonce/`strict-dynamic` report-only policy used on other routes may log console reports. Several e2e specs fail on console errors. **Prefer a main-thread canvas.**
- **WebGL** only if the builder shows context creation plus shader compile ≤ 50ms at 4× and a static fallback. Any library must be ≤ 6 KB gzip, MIT or ISC, and added to the licence audit. Default to Canvas 2D.
- **No `100vh`, no hard-coded 48/56px, no JS-measured layout, no state that changes at hydration** (`experience-system.md` "Not allowed").
- **Targets and labels:** 44×44 minimum targets and 12px minimum labels, including the pause control (`learning-surface-density-contract.test.ts` bans `text-[<12px]`, `transition-all`, infinite CSS animation and `animate-pulse/bounce` in `hero.tsx`).

### 3.8 Suggested spread for three prototypes (optional)

- **P1: live line globe (Canvas 2D).**
  - Content: graticule hairlines, land-110m coastline (DP 0.6°), Germany in Mennige.
  - Motion: a slow eastward drift (about 4–8°/s) that settles facing Europe. Option (b) with a pause button, or option (a) as a finite 4s arc.
- **P2: halftone dot globe (Canvas 2D).**
  - Content: land as equal-area 2° paper dots (bitmask under 1 KB gzip), plus a single Mennige route arc from Berlin that draws once.
  - Motion: drag to spin with inertia; option (a).
- **P3: zero-JS cover (server SVG only).**
  - Content: `globe-geometry` graticule, coastline path and Germany.
  - Motion: a finite CSS draw-in of at most 1.2s (stroke-dashoffset on a few paths) and a compositor-only scale/translate.
  - Adds 0 KB of JS. This is also the fallback if P1 or P2 miss the budgets.

### 3.9 How to measure, so results are comparable

- Use `probe-run.mjs` and `globe-cost.mjs` in `scratchpad/mobile/audit-home/`. They show CDP `Emulation.setCPUThrottlingRate`, `Performance.getMetrics` (TaskDuration, ScriptDuration, LayoutDuration, RecalcStyleDuration) and rAF interval sampling.
- Report for each prototype:
  - script ms per frame at 1× and 4×;
  - TaskDuration per frame at 1× and 4×;
  - backing-store DPR cap;
  - gzip KB for code and data;
  - init ms at 4×;
  - screenshots at the four phone sizes, first viewport in DE and EN.
- Warm the font cache before screenshots. Hide the dev "N" badge (`nextjs-portal{display:none}`) when framing.

---

## 4. Constraints table

| # | Source | Rule | Consequence for the phone hero |
|---|---|---|---|
| 1 | `companion-home-contract.test.ts` | Page order `ContinueSlot < HeroSection < Offering < MobileRails < Workflow < CredibilityStrip`. | Option B needs this assertion changed. |
| 2 | same | `hero.tsx` must contain the desktop strings `-mt-16`, `pt-24`, `md:px-12`, `md:pb-10`, `md:pt-24`, `lg:min-h-[38rem]`, `lg:pb-12`; the companion strings `max-lg:mt-0`, `max-lg:pb-5`, `max-lg:pt-4`; the phone H1 clamp `clamp(2rem, 8.6vw, 2.75rem)`; the desktop clamp byte-identical; the `max-height: 680px` rule; exactly one `<h1`; `drop-shadow-[0_3px_0_rgba(255,255,255,0.45)] lg:hidden`; `<span className="hidden lg:inline">`; `aria-label={copy.headline.join(" ")}`; and on the pillars `max-lg:hidden`, `sm:grid-cols-3`, `md:mt-8 lg:mt-10`. | Keep the desktop strings. Update the phone pins deliberately: the new H1 clamp, and dropping the drop-shadow span class. Phone changes stay `max-lg:` overrides or live in phone-only decorative elements. |
| 3 | same | Offering, workflow and credibility keep `lg:py-24`, `md:py-20`, `max-lg:py-5`. No `overflow-x-auto` or `snap-x` there. Artwork keeps `min-h-[4.75rem]`, `loading="lazy"` and `(max-width: 639px) 72px`. The continue seat keeps `h-[4.75rem]`, `{ ssr: false }` and `lg:hidden`. The continue modules do not import the catalog, the resume resolver or the course config, and import access only as a type. | Compact course rows need the artwork pins updated. |
| 4 | `hero.test.tsx` | Text nodes "KI", "verstehen." and "Sicher anwenden." exist. The EN heading name is "Understand AI. Apply it safely.". CTA links `/kurse` and `/en/kurse`. Pillar links go to `/kurse`, `/demos` and `/workshops` (DOM). No "Open Source" link in the hero. The intro `<p>` has no opacity 0 and no clip-path. | Keep the three-part headline in the DOM. |
| 5 | `hero-responsive-network.test.tsx` | SSR HTML has no `data-hero-globe-poster`, `data-testid="hero-network"` or `data-hero-network-shell`. Below 1024 there is no `hero-network` and no button named `/globe motion/`. | Use new attributes and names for the phone globe, or update this test. |
| 6 | `hero-network.test.tsx` | Cadence constants 60/7/0.78/2, the STEPS data, and `path[stroke="#C4431A"]` in mobile and reduced-motion renders. | Changing Kupfer to Mennige on desktop means updating this test. |
| 7 | `motion-policy-contract.test.ts` | `.berlin-hero` = `background: var(--color-paper)`. The hero imports `@/components/home/hero-network` and uses `networkMode === "desktop" ?` plus the surface control and localized names. The network uses matchMedia reduced motion, IntersectionObserver, `frozen?.on("change"`, `visibilitychange` and the constants. The doc contains "Homepage globe: narrow continuous-motion exception" and "The projection module and SVG tree are not loaded or rendered on mobile". Production source has no `transition-all`. | Add a "Phone globe" subsection to `docs/experience-system.md` with its own boundaries (section 3.6), and update the doc sentence and this test in the same change. Keep the `.berlin-hero` rule, or scope the dark band under a media query. |
| 8 | `learning-surface-density-contract.test.ts` | `hero.tsx`, `offering.tsx`, `workflow.tsx`, `credibility-strip.tsx`: no `text-[<12px]`, no `transition-all`, no infinite CSS animation, no `animate-pulse/bounce`. | – |
| 9 | `reduced-motion-reveals.test.tsx`; `mobile-rails.test.tsx`; `continue-card.test.tsx` / `continue-slot.test.tsx` | Offering and credibility SSR have no `opacity:0` or `scaleX(0)`. Rail class pins, six demo tiles, books only from `books`, no `img`, no `animate-`. The card is `h-full` and `overflow-hidden` with no `min-h-[`; the seat is `h-[4.75rem]`. | – |
| 10 | e2e `route-home-locales.spec.ts` (320/390/768/1440; DE and EN; chromium) | 200 status and `lang`; `main h1` visible. The first `[data-section="hero"] a[href$="/kurse"]` sits inside the viewport. No horizontal overflow. Every visible `main a` / `footer a` is ≥ 44×44. Card rects stay inside the width. **Below 1024 `[data-hero-globe-motion]` count is 0.** At 390 and 768 the hero bottom ≤ H. EN text contains "Understand", "Four courses." and "Operating principles", no German tokens, and only `/en` hrefs. | Checked against the full viewport height, not the tab bar top. Tighten the spec to the tab bar top. |
| 11 | e2e `mobile-access-disclosure.spec.ts` (mobile projects; 320 and 390 × 844; DE and EN) | The continue card is visible with no scroll, 76px tall, between the header bottom and the tab bar top, unobscured (`elementFromPoint`), with its text inside; tapping it reaches the lesson. | The globe or band must never overlay the card. |
| 12 | e2e `motion-control.spec.ts` (1280×800) | The `/en` SSR has no `data-hero-network-shell`, `data-hero-globe-motion` or `data-hero-globe-poster`. Desktop pause and resume work. Reduced motion is static. **Resizing to 390 leaves 0 `[data-hero-globe-motion]` and 0 `[data-hero-network-motion]`.** | Add phone globe cases here: SSR static frame, stops offscreen, static under reduced motion. |
| 13 | e2e `responsive.spec.ts` | At 320×900 with reduced motion the hero H1 stays within 0–321px. The compact bar is exactly `--nav-h-compact` and main starts under it. | – |
| 14 | e2e `a11y-reduced-motion.spec.ts` | Home: the H1 is visible, the three static sections and their headings are visible before scroll, and no reveal is stuck (hero, svg and aria-hidden are excluded). | – |
| 15 | e2e `homepage-methodology.spec.ts` | Courses show "Vier Kurse" and "KI-Führerschein", and 4 `[data-course-artwork] img` load with `cover-v3.webp`. Resources and principles texts are present. The reduced-motion smoke finds the in-flow hero CTA. | – |
| 16 | e2e `home-journey`, `funnel-homepage-to-journey`, `journey-a11y`, `a11y-keyboard`, `a11y-target-size`, `qa-sweep` | Resources heading "Nachlesen, prüfen, übertragen." with 5 links and "Zum Konto". The first "Lernroute wählen" leads to `/kurse`. Skip link; hamburger ≥ 44px. | – |
| 17 | e2e `mobile-shell.spec.ts` | Tab bar row 56px plus hairline, z-40, `body` bottom padding equal to the row, skip link above the bar. | The shell is owned by another agent; do not touch it. |
| 18 | e2e `a11y.spec.ts` | axe on `/`; focus not obscured over 15 tab stops on `/` (WCAG 2.4.11); no reflow at 320. | A pause button must not end up under the tab bar when focused. |
| 19 | e2e `visual-regression.spec.ts` | `/` smoke at desktop and 390×844 with reduced motion: ≥ 2 visible regions, luminance std-dev ≥ 8, dominant colour < 0.95, edges > 0.01. | – |
| 20 | e2e `qa-visuals.spec.ts` (opt-in) | Expects `[data-hero-network-motion]` attached on `/` at every review width, including 390 and 768. This already conflicts with the mobile policy. | Fix it when adding the phone globe. |
| 21 | `lighthouserc.json` (root), LH 12.6.1 default mobile | 412×823, DPR 1.75, simulated slow 4G (150ms RTT, 1.6 Mbps), CPU ×4. Accessibility 1.00; performance ≥ 0.80; LCP ≤ 4.5s; CLS ≤ 0.1; TBT ≤ 200ms; script ≤ 360 KiB; total ≤ 1 MiB; third-party ≤ 8. | See section 3.4. |
| 22 | CSP (`security-headers.ts`, `next.config.ts`) | See section 3.7. | Canvas yes. No blob: worker or image. No eval in prod. |
| 23 | Fonts (`layout.tsx`, `globals.css`) | Only 400 and 700 are preloaded; all faces use `font-display: optional`; fallback is `local(Arial)` with metric overrides. | Hero text 400/700; no canvas text. |
| 24 | `docs/experience-system.md` | Shell tokens only, `svh`/`dvh` not `vh`. No JS layout, no hydration flips. One moving region. 44px targets, 12px labels. Do not drop facts or destinations that desktop shows. No duplicate link sets. `scroll-behavior: auto` below `lg`. Route responsibility for Home: "globe, core claim, one supporting sentence, one primary action". | – |
| 25 | `design-direction.md` | Palette, graphit only as a full-width band, radius 0, flat, sentence case, tracking ≥ -0.015em, one Mennige group per viewport section, one filled Mennige button per page. | See section 3.3. |
| 26 | WCAG 2.2.2 | Automatic motion longer than 5s needs pause, stop or hide. | See section 3.6. |

---

## 5. Files and tests the implementer must touch

**Code**
- `src/components/home/hero.tsx`
  - A phone graphit band scoped below `lg`; the full two-line H1 on phones.
  - Remove on phones: `berlin-grain`, the drop-shadow, the rounded intro card and the cobalt `BrandButton`. Use `ButtonLink tone="dark"`.
  - Gate `useScroll` to desktop.
  - Mount the phone globe (SSR static frame plus a lazy live island).
- **New** `src/components/home/phone-globe.tsx` (server static frame) and `src/components/home/phone-globe-live.tsx` (client, dynamic import), with unit tests. Keep them under `home/`, because `werk/` is shared.
- **New** generated data, for example `src/lib/globe-land-110m.ts`, and `scripts/extract-land-outline.mjs`. Build time only; the header cites world-atlas (ISC), topojson-client (ISC) and Natural Earth (public domain) and points to `LICENSES/`.
- `src/app/globals.css`: a phone-only dark scope for the hero, or `@utility dark-section`, plus any finite keyframes. Also decide on the global cobalt/orange `body` grid, but that is a global change, so coordinate it.
- `src/components/home/continue-slot.tsx` and `continue-card.tsx`: Werkzeichnung restyle, still 76px. Move the seat if Option B is chosen.
- `src/app/page.tsx`: only for Option B's order change.
- `src/components/home/home-copy.ts`: the one-sentence supporting line if copy agrees. Everything must keep DE/EN parity.
- `src/components/home/offering.tsx`: **fix the EN unit label** by using `localizeCatalogCourse(course, locale).unitLabel`. Compact phone rows, for example a `werk/Route`-style list, which needs the artwork pins revisited.
- `course-artwork.tsx`, `mobile-rails.tsx`, `workflow.tsx`, `credibility-strip.tsx`: restyle to hairline rows, square corners, sentence-case labels, deck pictograms, and no pastel fills.
- `docs/experience-system.md`: a "Phone globe" exception subsection, and an update to the "not loaded or rendered on mobile" sentence.
- Optional, desktop: `hero-network.tsx` `KUPFER` → Mennige `#b73a15`.

**Unit tests to update or add**
- `companion-home-contract.test.ts`: phone pins, and the order if Option B is chosen.
- `hero.test.tsx`
- `hero-responsive-network.test.tsx`: phone globe allowed, desktop projection still absent.
- `hero-network.test.tsx`: only if the colour changes.
- `src/lib/motion-policy-contract.test.ts`
- `offering.test.tsx`: add `Blöcke|Module` to the EN German-token regex.
- `continue-card.test.tsx` and `continue-slot.test.tsx`: if the markup changes.
- `mobile-rails.test.tsx`: if the rails change.
- New tests for the phone globe:
  - the SSR static frame renders below `lg` and is `aria-hidden` with no `id`s;
  - reduced motion means the live module is never imported;
  - pause control names and a 44px size, if option (b) is used.

**E2E to update**
- `route-home-locales.spec.ts`: measure the CTA and hero against the tab bar top; assert the phone globe marker.
- `motion-control.spec.ts`: add phone globe cases.
- `mobile-access-disclosure.spec.ts`: only if the card moves or is restyled; keep 76px.
- `qa-visuals.spec.ts`: fix the `[data-hero-network-motion]` expectation.
- `homepage-methodology.spec.ts`: only if the course artwork changes.
- Must stay green unchanged: `a11y*.spec.ts`, `mobile-shell.spec.ts`, `responsive.spec.ts`, `visual-regression.spec.ts`, `home-journey.spec.ts`, `funnel-homepage-to-journey.spec.ts`.

**Do not touch** (other agents): the nav, header, footer and tab bar components, `src/components/course/**`, `src/app/demos/**`, `src/components/demos/**`, `src/lib/demos*.ts`, and the W04 slides and scripts.

---

## 6. Rest of the page: target on phones (≈ 2.5 usable screens at 390×844, down from 3.9)

| Section | Now at 390, DE | Target |
|---|---|---|
| Hero and continue row | 364px (seat + hero), no globe | One band of 739px, including the globe and the 76px row |
| Courses | 617px: 4 pastel image cards of 150–170px each, plus the strip | About 330px: a Kopflinie head, then 4 hairline rows of 64px (number, title, "5 Blöcke · 1 Std. 40 Min." in sentence case, a 56–72px thumbnail if the artwork test stays), then one text link "Alle Kurse ansehen". |
| Rails | 385px, with the books rail holding 1 tile | About 220px: one rail, or the demos rail plus a single book row. |
| Resources | 513px: pastel icon tiles and a cobalt account slab | About 280px: five 48px hairline rows with deck pictograms, and the account line as a text link. |
| Principles | 490px: 4 pastel cards | About 260px: a `dl` with hairline rows, label and title; the body in `caption`. |

---

## 7. Artifacts (all in `scratchpad/mobile/audit-home/`)

- `first-{de,en}-{320x568,375x667,390x844,430x932}.png`: first viewports at DPR 3.
- `full-{de,en}-{320x568,390x844,430x932}.png`, plus `part{0,1,2}-full-de-{320x568,390x844}.png`: full pages cut into thirds. In a full-page capture the fixed tab bar appears mid-page; that is a capture artefact.
- `measure.json`: per-phone rects and section heights. `shoot.mjs` produces it.
- `globe-cost.mjs`: cost of the existing desktop globe per frame at 1× and 4×.
- `probe.html`, `probe-run.mjs`, `probe-run2.mjs`, `probe-both.png`: the Canvas 2D cost probe. It is a cost calibration, not a design.
- `land.json`: land-110m at DP 0.6° plus the equal-area 2° dot set used by the probe.
- `hn.js`, `gg.js`: esbuild minified bundles used for the size estimates.
- `ref-workshops-390.png`: the Werkzeichnung cover band on a phone (no globe below `md`), shot on a cold cache so it shows the fallback font.
- `ref-home-desktop-1440.png`: the current desktop hero, for context.
