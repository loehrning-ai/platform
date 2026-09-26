# Design-contract map: courses, workshops, demos

Scope: every automated check that constrains the visual design and markup of `/kurse`, the course landings (the shared `TechnicalCourse*` primitives, the four native landings and the five open-source technical landings that reuse them), `/workshops` and `/workshops/[slug]`, and `/demos` and `/demos/[slug]`. Repo state: `/home/user/platform` at HEAD, clean tree, 2026-09-26.

The planned restyle is called "calm editorial" in this report. It removes the offset shadow tiles, pastel fills and highlight blocks, and adds a 6 to 8px radius, hairline borders, a dark hero band and quieter eyebrows.

## 0. Summary

- **Baseline is green.** All 38 relevant vitest files (1,186 tests) pass on the unmodified tree. I ran them with a scratch Vitest config whose `cacheDir` is outside the repo, so no file in `/home/user/platform` was written. `git status` stayed clean.
- **Measured blast radius.** I applied a representative restyle to a scratch copy of `packages/website` (`scratchpad/sim/`, script `scratchpad/tmp/sim_restyle.py`) and ran the full vitest suite (8,195 tests). Only 6 test files failed because of the restyle, with 9 assertions:
  - `learning-atlas.test.tsx`: 4 assertions
  - `technical-course-landing.test.tsx`: 2
  - `workshops-content.test.tsx`: 1. It fails on `rounded-lg`. Once that is changed to `rounded-md`, it fails on `dark-section` instead.
  - `demo-design-contract.test.ts`: 1
  - `demo-tile.test.tsx`: 1
  - `catalog-surfaces-mobile.test.ts`: 1. This was my own artifact: a bare `hidden` with no breakpoint restore. It is a real trap to avoid.

  All other suite failures in the scratch copy were environment-only: files I did not copy, such as `supabase/`, `scripts/`, `next.config.ts` and `LICENSE_POLICY.md`.
- **The biggest hidden risk is contrast, not the regex contracts.** `.dark-section` remaps `--color-brand-orange` to `#e07050`. White text on it is **3.18:1**, which fails AA.
  - Any `bg-brand-orange text-white` primary placed inside a dark hero band fails axe (`a11y.spec.ts`) and the Lighthouse `categories:accessibility = 1.00` budget on every course landing, `/kurse`, `/workshops/*` and `/demos`.
  - Use dark ink instead: `#242342` on `#e07050` is 4.74:1, and `#141414` on `#e07050` is 5.79:1. The alternative is to keep the CTA outside the dark scope.
  - The primary **must keep** the `bg-brand-orange` class and stay inside `<header>`. `foundation-course-entry.test.tsx` and `technical-course-landings.spec.ts` select it that way.
- **Some e2e checks pin the old look without being "design contracts".**
  - `heading-band-geometry.spec.ts` requires the `HighlightedText` marker (`h1 span.box-decoration-clone`) on `/workshops` and `/en/workshops`.
  - `visual-regression.spec.ts` holds a pixel baseline for `/kurse` (`courses-desktop.png`, 3% tolerance). Changing global token values moves all 4 baselines: courses, books, open-source and legal.
- **Radius choice decides most of the contract churn.**
  - Square geometry (radius 0, as in the W03 deck and the sibling `design-direction.md`) needs **zero** radius-related edits.
  - A 6px `rounded-md` passes the workshop and demo contracts as they stand. It fails only the technical-course primitive test, which bans any `\brounded`, and `technical-course-progress.test.tsx`, which bans `rounded` in the rendered HTML.
  - 8px `rounded-lg` additionally fails `workshops-content.test.tsx` and `workshop-detail-content.test.tsx`.
- **First-viewport headroom is the binding layout constraint for a dark hero band.** I measured on the dev server with `iPhone 13` (390x664), the viewport the mobile projects use.
  - `/workshops/ki-prognosen-einschaetzen` and `/workshops/geschaeftsberichte-mit-ki-lesen` have the decision lab starting at y=484, so there is **180px** of headroom (`learning-density.spec.ts`).
  - `/kurse` has the gallery at y=236, which leaves 428px.
  - The technical landing CTAs end at y=382-511. They are measured at 390x844 and 1440x900, which leaves 333px or more.

---

## 1. Method

1. I read every file named in the brief and every test that references these surfaces: 122 vitest files use `readFileSync`, plus the render tests next to each component. I also read all e2e specs that navigate these routes, `lighthouserc.json`, `perf-budgets.md` and `docs/experience-system.md`. The last one is the written policy that the tests enforce, and it says: *"Change the contract first, in the open, if the policy should change."*
2. Baseline run (read-only): `node node_modules/vitest/vitest.mjs run --configLoader native --config scratchpad/tmp/vitest.contracts.config.mjs <38 files>`. Result: 38 of 38 files and 1,186 of 1,186 tests pass.
3. Simulation: I copied `src`, `content`, `public`, `docs` and `ASSET_MANIFEST.json` to `scratchpad/sim/platform/`, symlinked `node_modules`, applied `sim_restyle.py` and ran the full suite with `scratchpad/tmp/vitest.sim.config.mjs`. Results are in `scratchpad/tmp/sim-results.json`. I then ran a second pass: `rounded-lg` to `rounded-md` in workshops, and removal of the `hidden` stand-ins.
4. Contrast: `scratchpad/tmp/contrast.mjs` and `contrast2.mjs` use the same WCAG formula as `globals-css.test.ts`. They cover the current palette and the sibling-proposed deck palette.
5. Headroom: `scratchpad/tmp/measure-headroom.mjs` ran Playwright against `http://localhost:3000` at 390x664, 390x844, 1280x720 and 1440x900. Output is in `scratchpad/tmp/headroom.json`.

Legend used below:
- **Violates?** Yes / No / Only-if (a specific choice).
- **Class**:
  - **OLD-LOOK**: pins the risograph or brutalist look. Legitimate to update.
  - **KEEP**: protects accessibility or behaviour, such as contrast, target size, focus, reduced motion, hydration, overflow or performance.
  - **MIXED**: an old-look literal wrapped around a real rule. Update the literal and keep the rule.

---

## 2. Constraints table: vitest source contracts (they read `.tsx`/`.css` as text)

| # | File | What it enforces (quoted) | Surfaces | Calm-editorial violates? | Class |
|---|---|---|---|---|---|
| 1 | `src/app/globals-css.test.ts` | `:where(h1, h2, h3)` has `text-wrap: balance`. Tap highlight `rgba(183, 58, 21, 0.18)`. No `user-scalable=no`. Each of `--color-brand-sand`, `-brand-amber`, `-destructive`, `-risk-green/yellow/red` must be `>= 4.5` against `--color-background`, `--color-card` and its own 20% tint on card. `--color-brand-orange` and those six must have `.dark-section` overrides `>= 4.5` against `--color-dark-bg`. Six-digit hex values are required (`parseHex`). | Global | No. Computed for both the current palette and the proposed deck palette (`#f3f0e9`/`#f9f7f2`/dark `#141414`): every pair passes (section 7). | KEEP |
| 2 | `src/lib/learning-instrument-design-contract.test.ts` | `--color-border` != `--color-track`. `contrast(border, background) >= 3` and `contrast(border, card) >= 3`. `contrast(track, background) < 2`. Exact strings: `"--color-dark-border: rgba(247, 241, 231, 0.4)"`, `"--color-dark-track: rgba(247, 241, 231, 0.14)"`, `"--color-track: rgba(247, 241, 231, 0.14)"`, `"background-color: var(--color-track)"`, `":where(.grid.gap-px, .h-px, .w-px).bg-border"`. `.overline` is `font-size: 0.875rem`. `.ai-marginalia` is `12px`. No `animation: … infinite`. No `transition: all`. | Global tokens | No. Hairlines at `#827970` give 3.75:1 on `#f3f0e9`. Do not make hairlines lighter than about 3:1. Use `--color-track` for decorative rules only. | KEEP |
| 3 | `src/lib/dark-surface-contract.test.ts` | Pins exact classNames in `components/ai-native/demos/{observ,agent,logistics,excel}-demo.tsx` and `ai-native/debug-panel.tsx`, e.g. `'className="dark-section max-h-[150px] overflow-y-auto bg-[var(--color-dark-bg)]'`. Dark ink on copper badges (`text-[var(--color-dark-bg)]`). Bans `text-[var(--color-dark-muted)]/(50\|60\|80)`. | `/ai-native/demos` engines (adjacent to scope) | Only-if you restyle the AI-Native demo engines. Every class edit there breaks an exact-string pin. | MIXED (the literals are old look; "dark scope before status colours" and "no sub-AA muted" are KEEP) |
| 4 | `src/lib/semantic-status-color-contract.test.ts` | Bans `/\btext-red-(?:50…950)\b/` in all production `.ts/.tsx/.css` under `src`. | All | No | KEEP |
| 5 | `src/lib/interface-typography-contract.test.ts` | Bans `/\btext-\[(?:[0-9](?:\.\d+)?\|1[01](?:\.\d+)?)px\]\|\btext-\[0\.(?:[0-6]\d*\|7[0-4]?)rem\]/` in **every** production `.tsx`. Only 3 SVG annotation files are exempt. | All | No, as long as quiet eyebrows stay at 12px or more (`text-xs` = 12px). | KEEP |
| 6 | `src/app/passive-state-design-contract.test.ts` | For `demos/error.tsx`, `demos/[slug]/error.tsx`, all foundation `kurs/**/error.tsx`, the technical course error and not-found states, `completion-certificate-cta.tsx` and `certificate-page.tsx`: `not.toMatch(/shadow-\[/)`, `not.toMatch(/hover:-?translate-[xy]/)`, and the count of `min-h-11` must be at least the count of `<button\|Link`. | Demo and course error/empty states | No. Flat is the target. Keep `min-h-11` on every control. | KEEP |
| 7 | `src/app/public-information-density.test.ts` | Only `hilfe`, `neuigkeiten` and `einstieg`. Bans `shadow-card\|tile`, `shadow-[`, `hover:-translate`, `transition-all`, `rounded-(xl\|2xl\|3xl\|full)`. Frame padding `pb-12 pt-(6\|8)`. | Not in scope | No | Reference only: shows that the house style bans rounded xl and above and pills. |
| 8 | `src/app/access-surfaces-density.test.ts` | Only `/konto`, `/login` and `/feedback`. Bans `shadow-card\|card-hover\|tile`, `shadow-[`, `hover:-translate`, `active:translate`, `transition-all`, `rounded-full`. | Not in scope | No | Reference only |
| 9 | `src/app/catalog-surfaces-mobile.test.ts` | For `demos/page.tsx` and `workshops/workshops-content.tsx` (plus buecher and open-source):<br>(a) **no `"use client"`**;<br>(b) every class list with `order-first`/`-order-1` also has `/(sm\|md\|lg\|xl):order-none/`;<br>(c) every class list with `hidden` also has `/(sm\|md\|lg\|xl\|group-open\/details):(block\|flex\|inline\|inline-flex\|inline-block\|grid)/`;<br>(d) `reordering` must `toEqual(["buecher/buecher-content.tsx","workshops/workshops-content.tsx"])`;<br>(e) workshops: `<h3 id={headingId} className="…">` contains `order-first`, `md:order-none`, `text-2xl`, `sm:text-4xl`, and the decision `<p data-workshop-decision>` has `font-semibold` and no `order-first`;<br>(f) exact strings `'<ol className="mt-5 hidden space-y-2 sm:block">'`, `"py-6 sm:py-14"`, `"gap-6 sm:gap-12"`;<br>(g) demos exact strings `'className="border-b border-border px-3 py-4 sm:px-6 sm:py-8 md:px-10"'`, `"lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]"`, `"px-3 py-2 sm:block sm:px-5 sm:py-3"`, `'className="text-xl font-bold tracking-[-0.04em] text-foreground sm:mt-1 sm:text-3xl"'`, `"sm:grid-cols-3"`. | `/workshops` hub, `/demos` hub | Only-if the hero or row geometry is rebuilt. A dark band can be applied to the existing containers without touching the pinned strings. Never leave a bare `hidden` (my simulation tripped (c)). Keep one phone reorder on the workshop row, or (d) fails. | MIXED. (a), (b), (c) are KEEP (server rendering, paired breakpoints). (d) to (g) pin the old geometry and are OLD-LOOK. |
| 10 | `src/components/demos/demo-design-contract.test.ts` | Surfaces: `app/demos/page.tsx`, `demo-grid`, `demo-tile`, `demo-detail-layout`, `animated-meta-table`, `evidence-badge`, `demo-shell`, `demo-cta`.<br>(1) no `/\btext-\[(?:9\|10\|10\.5\|11)px\]\b\|fontSize:\s*(?:9\|10\|11)\b/`;<br>(2) no `/(?:hover:-translate\|active:translate\|transition-all\|rounded-full\|linear-gradient\|demo-corner)/`;<br>(3) no `/\b(?:py-(?:14\|16\|20\|24\|28\|32)\|(?<!scroll-)mt-(…)\|gap-(…))\b/`, i.e. scene gaps of 48px at most;<br>(4) grid has `lg:grid-cols-4` and `data-demo-filter-console`; tile has `tileSizeClass(demo.size)`, `case "s-hero"`, `data-demo-preview`; hub has `copy.catalog.stats.map`;<br>(5) tile **contains `"transition-[border-color,box-shadow]"` and `"transition-transform"`**, `motion-reduce:transition-none` and `motion-reduce:transform-none`, and no `/animate-\|repeat\|autoplay/`;<br>(6) the meta table has no `requestAnimationFrame\|IntersectionObserver\|useMotionAllowed`. | `/demos`, `/demos/[slug]` | **Yes**, for (5): removing the offset hover shadow makes `box-shadow` meaningless (confirmed in the simulation). No for (2): `rounded-md/lg` is allowed, only `rounded-full` and gradients are banned. (3) forbids a hero band with `py-14` or more. | (5) OLD-LOOK (it pins the hover-shadow recipe). (1), (2), (3), (6) KEEP. They are also good anti-slop rules: no pills, no gradients. |
| 11 | `src/components/demos/demo-bento-tiling.test.ts` | `tileSizeClass` must return exactly `"sm:col-span-2 lg:col-span-2 lg:row-span-2"`, `"lg:row-span-2"` and `"sm:col-span-2 lg:col-span-2"`. Size mix `{s-hero:1, s-tall:3, s-wide:2, s-med:6}`, area 20, 4-column packing with no holes, `sizes[0]==="s-hero"`, `sizes[2]==="s-tall"`. | `/demos` grid | Only-if the gallery stops being a bento, e.g. a uniform editorial list or grid. | MIXED. The layout choice is OLD-LOOK, but the "no holes in the painted grid" guard is worth keeping while a bento exists. |
| 12 | `src/components/demos/public-demo-interface-floor.test.ts` | For every engine in `demo-component-registry.ts`: no visible type under 12px (`fontSize`, `font-size`, `text-[…px]`, `clamp(<12px`), except inside `aria-hidden` SVG. Every `button/input/select/textarea/a/Link` has `min-h-11\|h-11\|h-12\|min-h-12\|min-h-[>=44px]\|min-h-[>=2.75rem]` or inline `minHeight >= 44`. The prompt scanner must not contain `outline: "none"`. | Every `/demos/[slug]` engine | No. Applies to any restyled or rebuilt demo engine, including a new ESG demo if it goes through the registry. | KEEP |
| 13 | `src/components/course/interaction-design-contract.test.ts` | For `kurs/*` quiz, assessment and verification pages and the three `kurs/kurs-content.tsx` overviews: `min-h-11` count must be at least the controls count; no `shadow-[` or `hover:-translate`; no spacing token above 48px (`[mp][trblxy]?\|gap)-(14…96)`); `min-h-[100svh]` on quiz and verification. | Foundation course `/…/kurs` overviews (the hub behind each landing) | No | KEEP |
| 14 | `src/components/interaction-target-design-contract.test.ts` | 44px target on controls in 35 learner-interaction files (codex, data-infra, claude widgets). | Lesson widgets (adjacent) | No | KEEP |
| 15 | `src/lib/learning-surface-density-contract.test.ts` | For `app/kurse/learning-atlas.tsx`, `app/workshops/workshops-content.tsx` (plus nav, footer, home and the UI primitives): no sub-12px text, no `transition-all`, no `animation: … infinite`, no `animate-(pulse\|bounce)`. | `/kurse`, `/workshops` | No | KEEP |
| 16 | `src/lib/motion-policy-contract.test.ts` | No `transition-all` or `transition: all` anywhere in `src`. `globals.css` has `prefers-reduced-motion: reduce`, `animation-iteration-count: 1 !important` and `scroll-behavior: auto !important`. `.berlin-hero` is `background: var(--color-paper)` (so **`--color-paper` must stay**). Formerly ambient demos have no `setInterval(`, `setStage(0), 8500`, `const restart`, `setLeadIdx`, `usePhasedLoop\|Auto-Play`. | Global and demo engines | No | KEEP |
| 17 | `src/lib/semantic-landmark-contract.test.ts` | Only `app/layout.tsx` may open `<main`. Tab-bar mount order. | Global | No. Do not wrap a new hero in `<main>`. | KEEP |
| 18 | `src/app/font-loading.test.ts` | `globals.css` has **exactly 4** `font-display: optional` and the four Loehrning Sans weights. Geist Mono is bundled via `--font-mono: var(--font-geist-mono), monospace;`. Only regular and bold are preloaded. | Global | Only-if a new web font is added through `globals.css`: the count changes and weight is added against the Lighthouse size budget. | KEEP |
| 19 | `src/app/web-app-manifest.test.ts` | `manifest.theme_color` and `background_color` equal the `@theme --color-background` value. `layout.tsx` `themeColor: "#f7f1e7"` equals it too. | Global | Only-if `--color-background` changes, e.g. to `#f3f0e9`. Then update both locale manifests and `layout.tsx` `themeColor`. The test itself stays. | KEEP |
| 20 | `src/app/kurse/open-source/technical-course-landings.design.test.ts` | For the 5 open-source landing `page.tsx` files (codex, claude, data-infrastructure, data-engineering-fundamentals, ai-native-operator): they use `<TechnicalCourseFrame`, `<TechnicalCourseHeader` and `<TechnicalCourseSectionHeading`, with exactly one `className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}` and one `…SECONDARY…`. `not.toMatch(/text-\[(?:[0-9]\|1[01])(?:\.\d+)?px\]/)`, `/shadow-(?!none)/`, `/hover:-translate\|transition-all\|transition-transform/`, **`/\brounded(?:-\|\b)/`**, `/(?<!scroll-)mt-(?:14…32)\b/`, `/\b(?:pt\|pb)-(?:14…32)\b/`. | Technical course landings | Only-if those page files get their own `rounded-*` classes. If the radius lives only inside the shared constants in `technical-course-landing.tsx`, this file needs **no** edit. | MIXED. The `rounded` ban is OLD-LOOK (brutalist squareness). Shadow, translate and spacing are KEEP. |
| 21 | `src/app/foundation-course-entry.test.tsx` (source half) | For `ai-native`, `eu-ai-act-kurs`, `ki-fuehrerschein` and `ki-und-gesellschaft` `page.tsx`: no sub-12px text, no `shadow-[`, no `hover:-translate`, no `transition-all`, no `(mt\|mb\|gap)-(14…32)`. `TECHNICAL_COURSE_PRIMARY_ACTION_CLASS` appears **exactly 2** times (import plus one use). | Native course landings | No. Rounded is not banned here. | KEEP |
| 22 | `src/app/ai-native/supplementary-hubs.design.test.tsx` | For `demos-gallery-view.tsx`, `glossary-view.tsx`, `fluency-test.tsx` and `capstone-gallery/page.tsx`: no `\bshadow-`, **no `\brounded(?:-\|\b)`**, no `hover:-translate`, no `transition-all`, no `bg-dot-pattern`, no `(mt\|mb\|gap\|py)-(14…32)`, no `BrandButton`. | `/ai-native/*` sub-hubs, including the AI-Native demo gallery | Only-if these are restyled with a radius. | MIXED |
| 23 | `src/components/course/technical-course-landing.test.tsx` | The header has class **`border border-foreground overflow-hidden`**. The section heading has **`grid-cols-[0.25rem_minmax(0,1fr)]`** (the orange bar). PRIMARY contains `min-h-12` and **`text-xs`**. SECONDARY contains `min-h-12`. LEDGER contains `min-h-14`. For all three constants: `not.toMatch(/shadow\|translate\|transition-all/)`, **`not.toMatch(/\brounded(?:-\|\b)/)`** and `toContain("motion-reduce:transition-none")`. The facts `<aside>` is labelled, with `[data-course-onboarding-checklist]` and `[data-course-progress-card]`. | All 9 landings, via the shared primitives | **Yes** (confirmed): the header border colour, the orange section bar, and the CTA label size if it changes from `text-xs`. **Yes** for any radius. | MIXED. Border colour, orange bar, `text-xs` and `rounded` are OLD-LOOK. `min-h-12/14`, "no shadow/translate/transition-all" and `motion-reduce` are KEEP. |
| 24 | `src/components/course/technical-course-progress.test.tsx` | `container.innerHTML` `not.toMatch(/shadow\|rounded/)`. Three `.bg-track` rails. | Progress bars in landing headers | Only-if the progress rails get a radius. | MIXED |

## 3. Constraints table: vitest render tests with class or markup pins

| # | File | Pins (quoted) | Surfaces | Violates? | Class |
|---|---|---|---|---|---|
| 25 | `src/app/workshops/workshops-content.test.tsx` | Source: contains `from "next/image"` and `card-preview.webp`. `not.toContain("transition-all")`. `not.toMatch(/text-\[(?:9\|10\|11)(?:\.\d+)?px\]/)`. **`not.toMatch(/rounded-(?:lg\|xl\|2xl\|3xl\|full)/)`**. **`not.toContain("dark-section")`** (test name: "…without black hub panels"). `not.toContain("data-workshop-bento")`.<br>Render: `[data-workshop-editorial-spread]` present; `[data-decision-card]` x3; 3 `<img>`, the first `loading="eager"` with `fetchpriority="high"`, the second `lazy`; each row `toHaveClass("motion-reduce:transition-none")`; exactly one link per row, `min-h-11`, name `^Open workshop:`, an `svg[aria-hidden=true]` inside; `[data-workshop-decision]`, `[data-workshop-output]`, row ids `workshop-<slug>`; complementary "In the catalogue" with links whose text is `"01Forecasts"` and so on; 3 rows (W04 adds a 4th); h1 regex `/Self-study workshops[\s\S]*for concrete decisions/`; `role=status` empty state. | `/workshops` | **Yes** for a dark band implemented with the literal `dark-section` in this file (confirmed). Yes for `rounded-lg` (confirmed). No for `rounded-md` (6px). | MIXED. `dark-section`, `rounded-lg`, "3 previews" and `editorial-spread` are OLD-LOOK. `min-h-11`, `aria-hidden` icons, eager LCP image, no sub-12px text, one action per row and `motion-reduce` are KEEP. |
| 26 | `src/app/workshops/[slug]/workshop-detail-content.test.tsx` | Source: no sub-12px text, **no `motion-safe\|motion-reduce\|animate-`**, **no `rounded-(lg\|xl\|2xl\|3xl\|full)`**, **no `shadow-`** (any), not `"use client"`.<br>Render: summary inside `<header>`; `header dl` with "Material:6"; facts before the access note; the lab `section` before the materials `section`; 4 closed `<details>`, the first starting with "Worum es geht"; no `mailto:`; zip gets `download=""`, html has no `target`. | Workshop detail | No, for a dark header (`dark-section` is allowed here; tested in the simulation). Yes for `rounded-lg`. No for `rounded-md`. Any `shadow-*` is banned. | MIXED |
| 27 | `src/app/workshops/[slug]/workshop-decision-lab.test.tsx` | Source: `not.toMatch(/motion-safe\|motion-reduce\|animate-\|shadow-/)`, no sub-12px text, contains `"grid grid-cols-1 border-y border-border sm:grid-cols-3"`. Choice `<label>` `toHaveClass("transition-colors")` with no `translate`. **Kicker `toHaveClass("text-xs", "text-brand-orange")`**. Outcomes `border-destructive` / **`border-brand-teal`** / `border-brand-amber`. The correct option's label has `border-brand-teal`. `data-outcome`, `data-option-mark`, accessible descriptions ("Your pick · correct"), focus moves to Reset / Decide again, polite live region, option order reshuffles, nothing persisted or transmitted. The same lab labels are used across **all** workshops (W04 must use "Entscheidung 01 · …", "Deine erste Entscheidung" and so on). | Workshop detail lab | Only-if eyebrows are made quiet (the kicker colour pin) or "correct" moves from teal to a new pass-green token. | MIXED. Kicker colour and teal token are OLD-LOOK literals. Distinct right/wrong by icon + colour + word, focus management and the live region are KEEP. |
| 28 | `src/app/workshops/[slug]/workshop-material-link.test.tsx` | Behaviour: same-tab HTML, `download` for zip/csv, analytics vocabulary. | Workshop detail | No | KEEP |
| 29 | `src/app/kurse/learning-atlas.test.tsx` | Goal buttons `min-h-14`, and `min-h-11` + `lg:min-h-14` in a `grid-cols-2 lg:grid-cols-4` group with `-ml-px/-mt-px` hairline joins. **Next-proof card `toHaveClass("bg-paper", "border-t-brand-orange")`**; next-proof has no `.dark-section`. **Row action link `toHaveClass("border-brand-orange", "bg-paper", "text-foreground")`** and `h-11 w-11 lg:h-auto lg:w-auto lg:min-h-11`. **Completed status badge `toHaveClass("border-brand-orange", "bg-kupfer-mist", "text-brand-orange")`**. **Plate tone: the plate must carry a class starting `bg-brand-`, and the action cell must carry the same tone plus `lg:bg-transparent`**. In-path rows `toHaveClass("border-l-brand-orange")`. Level filter `sticky top-[var(--nav-h-compact)] lg:hidden js-shell-only`. Rows `hidden lg:list-item` when filtered. `sr-only lg:not-sr-only` labels. 10 rows, no `role=progressbar`, no `[data-progress-fill]`. | `/kurse` | **Yes** (4 assertions confirmed): `bg-paper` next-proof, `bg-paper` action, `kupfer-mist` badge, pastel plate tone. Also `.dark-section` if the next-proof becomes a dark card. | MIXED. The bolded colour pins are OLD-LOOK. Target sizes, phone filter behaviour, sr-only naming and the aria-live count are KEEP. |
| 30 | `src/app/kurse/page.test.tsx` | h1 `/KI verstehen,\s*einsetzen und prüfen\./`; diagnostic link before the atlas; data attributes for access. | `/kurse` | No (copy aside) | KEEP |
| 31 | `src/components/demos/demo-tile.test.tsx` | Link class `demo-gallery-tile`; hero tile `sm:col-span-2 lg:row-span-2`; link `motion-reduce:transition-none`; **`[data-demo-preview-content]` `toHaveClass("motion-reduce:transform-none", "motion-reduce:transition-none")`**; light badge ink `#166534`; dark badge `text-[var(--color-risk-green)]`; preview before h2. | `/demos` tiles | Only-if the preview hover-scale is removed (confirmed), or dark tiles are retired (the dark-badge test then has no production path). | MIXED. The badge contrast pairing is KEEP. The transform class and dark tiles are OLD-LOOK. |
| 32 | `src/components/demos/demo-shell.test.tsx` | Light demo: `bg-background` and no `dark-section`. Dark demo: `dark-section` + `border-border`, not `bg-foreground`/`bg-background`. | `/demos/[slug]` engine frame | No | KEEP (dark scope for dark engines) |
| 33 | `src/components/demos/demo-cta.test.tsx` | Primary: `bg-brand-orange`, `min-h-11`, `border-brand-orange`, **no `shadow-`**. Secondary: no `bg-brand-orange`, no `border-2`, `border-border`, `min-h-11`. | Demo detail CTAs | No | KEEP |
| 34 | `src/components/demos/demo-detail-layout.test.tsx` | Order `[data-demo-instrument]` then `[data-demo-notes]` then `[data-demo-continuation]`. Continuation has exactly 1 link, class `bg-brand-orange`. `[data-demo-detail-hero]` and `[data-demo-detail-layout]` present. Text labels ("Praxisbeispiel 01 · Grundlagen · Einstieg", "Stufe 3: Anwenden"). | Demo detail | No. If the continuation sits in a dark band, apply the contrast fix from section 7. | KEEP |
| 35 | `src/components/demos/demo-grid.test.tsx` | Level filters `lastElementChild` has `flex flex-wrap` and no `overflow-x-auto`. `[data-demo-filter-console]` and `[data-demo-atlas]` present. | `/demos` | No | KEEP |
| 36 | `src/app/demos/page.test.tsx` | `[data-demo-atlas-hero]` and filter data attributes. | `/demos` | No | KEEP |
| 37 | `src/app/foundation-course-entry.test.tsx` (render half) | For each of the 4 native landings (EN): the `[data-technical-course]` frame; **the links that have class `bg-brand-orange` equal exactly `[primary]`**; the primary is inside the frame `header`; `data-prefetch="false"`; a `role=progressbar` exists; a `<details>` exists; **no `<img>` in the frame**; every link starts with `/en/`; every block or module heading is visible. | Native landings | No, provided a dark band does not add a second orange-filled link (e.g. an orange secondary) and does not add a cover image inside the frame. | KEEP |
| 38 | `src/app/foundation-course-block-actions.test.tsx` | Block "Start block" links have `min-h-11` and a unique aria-label. | Foundation `/kurs` hubs | No | KEEP |
| 39 | `src/components/course/open-with-your-ai-mounts.test.ts` | `app/workshops/[slug]/page.tsx` imports `open-with-your-ai-region`, renders `<OpenWithYourAiRegion kind="workshop"` and uses `workshopUri(`. | Workshop detail | No | KEEP |
| 40 | `src/lib/workshops-data-readiness.test.ts` | W03: `getWorkshops(locale)[2]` is `datenbereitschaft-fuer-ki`; exactly 3 materials (`slides.html`, `guide.html`, `demo.html`). **`bundle-manifest.json` sizes and sha256 must match every file in `public/workshops/datenbereitschaft-fuer-ki/`, and the file list must be exact.** Every relative `src/href/url()` resolves. `slides.html` scene 2 is `#host` with `./assets/tim-loehr.jpg` (hash pinned) plus CV words. The demo adapter starts in replay mode with 0 fetches. | W03 static materials | Only-if you edit **any** W03 file (demo.html, slides.html, CSS): regenerate `bundle-manifest.json`. The W03 index must stay `[2]` (append W04, do not insert). | KEEP (integrity) |
| 41 | `src/lib/workshops-static-links.test.ts` | No relative `href` ending in `/` in any `public/workshops/**/*.html`. | All static workshop HTML (W04 too) | No | KEEP |
| 42 | `src/lib/workshops.test.ts` | Content pins that intersect the hub: `number` equals `["01","02","03"]`; formats list per index; `eyebrow === "Workshop NN · topic"`; `duration` "~90 Minuten" / "~90 minutes"; summary 160 characters or fewer; access note 2 sentences or fewer; material labels without "(", "English" or "Open"; lab `facts.length === 3`; files exist; DE/EN aligned. | Workshop data (W04) | No (visual). W04 must extend the pinned arrays. | KEEP (content) |

## 4. Constraints table: Playwright e2e specs

Mandatory projects: `chromium` (Desktop Chrome 1280x720), `mobile-chromium` and `mobile-webkit` (iPhone 13, **390x664**). `qa-visuals.spec.ts` only runs with `PLAYWRIGHT_CAPTURE_VISUALS=1`.

| # | Spec | What it asserts (geometry / colour / class) | Surfaces | Violates? | Class |
|---|---|---|---|---|---|
| E1 | `tests/e2e/heading-band-geometry.spec.ts` | On `/buecher`, `/en/buecher`, **`/workshops`, `/en/workshops`** at 390x844 and 1440x900: `page.locator("h1 span.box-decoration-clone").first()` **must be visible**, and the marker bands derived from `HIGHLIGHT_BAND_HEIGHT_EM`/`OFFSET_EM` must not overlap between lines. | `/workshops` h1 | **Yes.** Removing the `HighlightedText` marker (the "highlight block") makes the locator fail. | OLD-LOOK for the workshop routes (drop them and keep `/buecher`) |
| E2 | `tests/e2e/learning-density.spec.ts` | `/kurse`: `[data-learning-gallery]` must **start** at y < viewport height (default project viewport). `/workshops/ki-prognosen-einschaetzen` and `/workshops/geschaeftsberichte-mit-ki-lesen`: `[data-workshop-decision-lab]` must **start** in the first viewport. There is exactly one `[data-scroll-progress]` with a top fill. | `/kurse`, W01, W02 | Only-if the hero grows too much. Measured headroom at 390x664: **W01/W02 lab top y=484, so 180px**; `/kurse` gallery y=236, so 428px. At 1280x720: lab y=416 (304px); gallery y=263 (457px). | KEEP (the first action appears without scrolling; `experience-system.md` §"first meaningful action") |
| E3 | `tests/e2e/responsive.spec.ts` | `/kurse` and `/ki-fuehrerschein` at 320, 360, 390, 768, 1024 and 1440 (height 900): `scrollWidth <= innerWidth + 1`, zero browser errors. Nav breakpoint handover at `lg`. | `/kurse`, `/ki-fuehrerschein` | No. Avoid `w-screen`/`100vw` bands, because classic scrollbars in headless Chromium make 100vw wider than the layout. | KEEP |
| E4 | `tests/e2e/route-german-foundations-responsive.spec.ts` | Chromium only. The 4 native landings at 320, 390, 768, 1024 and 1440: **no element rect and no text rect outside `[0, innerWidth]` (±0.5px)**, ignoring `.sr-only`, `aria-hidden` and `[data-course-horizontal-scroll]`. Same for verification pages at 320. | Native landings | Only-if a full-bleed band is built with negative margins, `100vw` or translate. Make the band a normal full-width block, or mark decorative overhangs `aria-hidden`. | KEEP |
| E5 | `tests/e2e/technical-course-landings.spec.ts` | At 1440x900 and 390x844, for all technical landings: the frame (`[data-technical-course=…]`, or `.ds-v8-scope` for data-science) is visible; **`header a.bg-brand-orange` count is 1** and its **bottom < viewport height**; overflow of 1px or less; **no leaf text under 12px computed**; **every `a, button, select, summary` in the frame is at least 44x44** (both dimensions); zero console errors; Enter on the primary opens the first unit. | Technical landings | No, provided the primary keeps the `bg-brand-orange` class inside `<header>` (with dark ink if the header is `.dark-section`) and no small inline links are added in the frame. Headroom at 390x844 is 333px or more. | KEEP |
| E6 | `tests/e2e/visual-regression.spec.ts` | Smoke on `/kurse`, `/ki-fuehrerschein` and `/demos` (desktop) and `/kurse` mobile (390x844): at least 2 visible content regions; PNG size; colour buckets >= 8; luminance range >= 40; std-dev >= 8; **dominant colour < 95%**; edge ratio > 0.01; opaque. **Pixel baselines at 1440x900, `maxDiffPixelRatio: 0.03`**: `courses-desktop.png` (`/kurse`), `books-desktop.png`, `open-source-desktop.png`, `legal-desktop.png`. | `/kurse` (pixels); `/kurse`, `/ki-fuehrerschein`, `/demos` (smoke) | **Yes** for `courses-desktop.png`: re-baseline. If global tokens change (background or ink), all 4 baselines move. The smoke statistics pass for a dark band plus paper. A near-monochrome page is fine as long as no single colour exceeds 95% of the viewport. | Pixel baselines are OLD-LOOK (re-record with `--update-snapshots` after review). Smoke is KEEP. |
| E7 | `tests/e2e/qa-visuals.spec.ts` (opt-in) | For `/kurse`, `/en/kurse`, `/ai-native`, `/eu-ai-act-kurs`, technical landings, `/workshops` and `/demos` at 390x844, 768x1024, 1024x900 and 1440x900: overflow of 1px or less, h1 visible, screenshots attached. | All | No | Review tool. Reuse it for after-shots. |
| E8 | `tests/e2e/a11y-target-size.spec.ts` | At 390x844, on `/kurse`: the 4 goal buttons **and the `next-proof` link are at least 44x44**. On `/ai-native`: the "Mit Modul 1 beginnen" and "Kursstand öffnen" links are at least 44x44. Also covers the AI-Native demo and glossary breadcrumbs. | `/kurse`, `/ai-native` | No | KEEP |
| E9 | `tests/e2e/a11y.spec.ts` | Axe WCAG 2.0/2.1/2.2 A+AA (includes **color-contrast**) after opening all `<details>`, on `/demos`, `/demos/prompt-scanner`, `/workshops/geschaeftsberichte-mit-ki-lesen`, `/ai-native`, `/ki-fuehrerschein`, `/eu-ai-act-kurs`, `/ki-und-gesellschaft`, `/kurse` and `/kurse/open-source/data-engineering-fundamentals`. Exactly one h1. Focus not obscured by the sticky nav (`/kurse`). Reflow at 320 (`/kurse`, `/ki-fuehrerschein`). | All in scope | **Yes if** a white-on-`bg-brand-orange` CTA sits inside `.dark-section` (3.18:1), or unscoped copper `#a5370f` text sits on a dark band (2.26:1 on `#242342`, 3.18:1 on `#141414`). | KEEP |
| E10 | `tests/e2e/workshops.spec.ts` | Link `/Geschäftsberichte mit KI lesen/i` on `/workshops` opens the detail page. W02 zip. The W03 lab journey (radios by exact name, "Reset" focused); `guide.html` to `slides.html` "#cover" `data-deck-active`; presenter popup `data-pairing-state=paired`; `#host` portrait 1100x1100; zero service requests; the readiness-lab grades. | Workshops (plus W03 static) | No for the site restyle. **Yes if** the W03 deck, guide or lab DOM hooks (`#cover`, `#host`, `data-deck-active`, the "Reveal the explanation" text, "Open the interactive course", `#simulation-grade`, `#sim-*` ids, the "Test My Choices" button) change during the W03 demo rebuild. | KEEP |
| E11 | `tests/e2e/workshop-hydration.spec.ts` | W03 DE/EN: before hydration the lab shows the loading copy, the form has `aria-busy=true`, **6 radios** are disabled, submit is disabled, clicks do not submit and nothing is transmitted. After hydration: validation alert, focus to the first radio, status region, reset focus. Without JS: `noscript p` text, disabled controls, a `guide.html` link visible. | Workshop detail lab | No, as long as the lab component's markup semantics are unchanged (restyle classes only). | KEEP (hydration) |
| E12 | `tests/e2e/route-workshops-locales.spec.ts` | `/workshops` and the 3 details in DE and EN at 320, 390, 768 and 1440: exact h1 names (DE "Selbstlern-Workshops für konkrete Entscheidungen." and so on); body/document overflow of 1px or less; **material link count** (hub **0**, W01 6, W02 2, W03 3); asset paths not `/en`; locale-preserving links; "Sprache: Englisch" / "Language: English" counts; German interface tokens present in DE and absent in EN. | Workshops | No for styling. Do not add `.html/.zip/.csv` links to the hub, and keep the language labels. | KEEP |
| E13 | `tests/e2e/demos.spec.ts` | `/demos` h1 contains "Arbeitsabläufe prüfen. Annahmen sichtbar machen." (EN = `headingLead + " " + headingAccent`). `[data-demo-atlas-hero]` and `[data-demo-filter-console]` visible. The first tile has `data-demo-size=demos[0].size` and a visible `[data-demo-preview]`. At 390: "Reifegrad" and "Kategorie" comboboxes and no overflow. Each detail shows h1, `[data-demo-detail-layout]`, `[data-demo-detail-hero]` and `[data-demo-shell]`. Engine containment at 390x844 (no descendant escapes the shell). `:focus-visible` on the engine action. Localized 404. | Demos | No for styling (copy edits will need these strings). | KEEP |
| E14 | `tests/e2e/courses.spec.ts` | `/kurse` text (e.g. "Grundlagenpfad", "Technikkurse"), links to every course, `/kurse` axe-clean, ported course assets, progress bar on the ported course. | `/kurse` | No | KEEP |
| E15 | `tests/e2e/route-kurse-hub.spec.ts` | h1 contains "KI verstehen"; no console errors; region "Alle Kurse" with 4 native headings, "Grundlagenpfad" h3 and 0 progressbars; primary CTA behaviour; at 390x844 no overflow; **10 `[data-course-slug]` and 0 `<img>` in the atlas**; goal group visible. | `/kurse` | No. Do not add cover images to the atlas. | KEEP |
| E16 | `tests/e2e/mobile-shell.spec.ts`, `a11y-structure.spec.ts`, `a11y-keyboard.spec.ts`, `qa-sweep.spec.ts`, `route-matrix.spec.ts` | Tab bar `aria-current` on `/kurse`; one main, one h1, nav and footer, `lang`; skip link and focus ring on `/ki-fuehrerschein`; 200s. | Shell | No | KEEP |

Note: the brief mentions a "catalog-surfaces-mobile" e2e spec. There is no such e2e spec. The name belongs to the vitest contract, row 9.

## 5. Lighthouse budgets (`/lighthouserc.json`; policy in `packages/website/perf-budgets.md`)

Routes in scope: `/kurse`, all 6 `/kurse/open-source/*`, `/ki-fuehrerschein`, `/eu-ai-act-kurs`, `/ai-native`, `/ki-und-gesellschaft`, `/workshops`, `/workshops/geschaeftsberichte-mit-ki-lesen`, `/demos` and `/demos/prompt-scanner`. Three runs, median.

| Assertion | Threshold | Severity | Restyle impact |
|---|---|---|---|
| `categories:accessibility` | **1.00** | error | Contrast inside dark bands (section 7) is the main risk. |
| `categories:performance` | >= 0.80 | error | A large hero raster image or a new font would hurt it. |
| `largest-contentful-paint` | <= 4500 ms | error | The `/workshops` LCP is the first `card-preview.webp` (eager, `fetchpriority=high`, pinned by row 25). Keep an image or text LCP that is cheap. |
| `cumulative-layout-shift` | <= 0.1 | error | Reserve the space for any hero art (width/height or aspect). |
| `total-blocking-time` | <= 200 ms | error | Keep the hubs as server components (row 9a). No new client islands for decoration. |
| `resource-summary:script:size` | <= 360 KiB | error | |
| `resource-summary:total:size` | <= 1024 KiB | error | 4 workshop previews at 28-37 KB each are fine. An SVG line globe for the band is cheap. A new web font is not. |
| `resource-summary:third-party:count` | <= 8 | error | No external font CDNs. |
| best-practices / seo | >= 0.9 | warn | |

`scripts/verify-lighthouse-routes.ts` needs one representative per dynamic pattern (`/workshops/:slug`, `/demos/:slug`). **W04 needs no new Lighthouse entry.**

---

## 6. Global tokens (`src/app/globals.css`) and where they are used

### 6.1 Definitions

| Token | Line | Value | Read by a contract? |
|---|---|---|---|
| `--color-brand-orange` | 53 | `#a5370f` (`.dark-section`: `#e07050`, l.384) | globals-css (dark override >= 4.5); many class pins (`bg-brand-orange` selects primaries) |
| `--color-background` | 62 | `#f7f1e7` | globals-css, learning-instrument, **web-app-manifest (must equal manifest and `layout.tsx` themeColor)** |
| `--color-foreground` | 63 | `#19232d` | indirect (axe) |
| `--color-muted-foreground` | 68 | `#4f5356` | indirect |
| `--color-border` | 74 | `#827970` | learning-instrument (>= 3:1 on background and card) |
| `--color-track` | 75 | `#d9d0c4` | learning-instrument (< 2:1, != border) |
| `--color-card` / `--color-card-hover` | 76-77 | `#fff9ed` / `#f0e7d7` | globals-css, learning-instrument |
| `--color-paper` | 81 | `#fffcf5` | **motion-policy (`.berlin-hero { background: var(--color-paper) }`): must stay defined**; learning-atlas.test pins `bg-paper` |
| `--color-brand-acid` / `-sky` / `-pink` / `-peach` | 82-85 | `#ddf45a` / `#a9ddfc` / `#ffb8c8` / `#ffb38a` | learning-atlas.test (plate tone `bg-brand-*`); heading-band spec via `HighlightedText colorVar` |
| `--color-brand-cobalt` / `-teal` | 86-87 | `#2747b5` / `#006c67` | decision-lab.test (`border-brand-teal` = correct) |
| `--color-kupfer-light` / `-mist` | 92-93 | `#e07050` / `#f5e8e2` | learning-atlas.test (`bg-kupfer-mist` badge) |
| `--color-dark-bg` (+ fg, muted, border, track) | 96-100 | `#242342` … | globals-css (contrast base), learning-instrument (exact rgba strings), dark-surface-contract |
| `--shadow-card` / `-card-hover` / `-tile` | 113-117 | soft / soft / `4px 4px 0 rgba(25,35,45,0.92)` | Not read by any test. `shadow-tile` has **0 utility usages** anywhere in `src`: the offset "tiles" on these surfaces are hand-rolled (`shadow-[6px_6px_0_0_…]`, `translate-x-2 translate-y-2` sheets). |
| `.dark-section` | 375-399 | scoped overrides | globals-css (override contrast); demo-shell.test (dark engines) |
| `.berlin-hero` | 300 | paper | motion-policy |
| `.demo-gallery-tile` | 566 (+ micro-motion 580-640, inside `prefers-reduced-motion: no-preference`) | content-visibility | policy doc |
| `.demo-corner*` | 661-700 | registration marks | **Dead CSS.** Not used by any `.tsx`, and `demo-design-contract` bans `demo-corner` in demo sources. Safe to delete. |

**Repo-wide versus in-scope usage (production files, tests excluded).** Deleting a token breaks other routes: home, buecher and open-source use the pastels. Stop using the tokens here; do not remove them.

| token | total occurrences | files | in scope |
|---|---|---|---|
| shadow-tile | 1 (definition only) | 1 | 0 |
| shadow-card | 43 | 16 | 3 |
| brand-acid | 55 | 26 | 8 |
| brand-sky | 38 | 21 | 9 |
| brand-pink | 33 | 20 | 7 |
| brand-peach | 33 | 20 | 5 |
| brand-teal | 25 | 14 | 10 |
| brand-cobalt | 40 | 15 | 7 |
| kupfer-mist | 51 | 29 | 13 |
| kupfer-light | 17 | 11 | 5 |
| dark-section | 21 | 16 | 3 |
| bg-card | 275 | 148 | 41 |
| bg-paper | 34 | 15 | 8 |
| HighlightedText | 9 | 3 | 3 (workshops hub + the primitive) |

### 6.2 Per-file counts in scope

Scope: `src/app/{kurse,workshops,demos}` (open-source sub-tree excluded), `src/components/{course,demos}`, the 4 native landing `page.tsx` files and `highlighted-text.tsx`. Files with all zeros are omitted.

"offset" means hard-offset shadow `shadow-[Npx_Npx_0…]` or an offset sheet `translate-x-N translate-y-N`. "eyebrow" counts class lists that contain both `font-mono` and `uppercase`.

| File | offset | shadow-card | acid | sky | pink | peach | teal | cobalt | kupfer-mist | kupfer-light | dark-section | bg-card | bg-paper | rounded | HighlightedText | border-t-[3px] | mono-uppercase eyebrow |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `app/workshops/workshops-content.tsx` | 2 | 3 | 3 | 5 | 4 | 2 | 2 | 1 | 0 | 0 | 0 | 0 | 5 | 0 | 1 | 0 | 8 |
| `app/workshops/[slug]/workshop-detail-content.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 6 |
| `app/workshops/[slug]/workshop-decision-lab.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 3 |
| `app/kurse/learning-atlas.tsx` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 5 | 0 | 0 | 4 | 1 | 0 | 0 | 2 | 4 |
| `app/kurse/course-ledger-row.tsx` | 0 | 0 | 2 | 2 | 2 | 2 | 2 | 2 | 5 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 2 |
| `app/kurse/page.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| `app/demos/page.tsx` | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| `app/demos/error.tsx`, `app/demos/[slug]/error.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 each |
| `components/demos/demo-tile.tsx` | 1 (`hover:shadow-[6px_6px_0_0_var(--color-brand-orange)]`) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 0 | 0 | 1 | 4 |
| `components/demos/demo-detail-layout.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 3 | 0 | 0 | 0 | 0 | 16 |
| `components/demos/demo-grid.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 9 |
| `components/demos/demo-shell.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| `components/demos/demo-gallery-previews.tsx` | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/course/technical-course-landing.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 5 |
| `components/course/technical-course-progress.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| `components/course/pathway-stage-banner.tsx` | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `components/course/open-with-your-ai.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 6 |
| `components/course/lesson-shell.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 1 | 3 |
| `components/course/lesson-proof-checkpoint.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 |
| `components/course/lesson-reference.tsx`, `lesson-demo-links.tsx` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 / 0 | 0 | 0 | 0 | 0 | 2 / 1 |
| `components/course/kurs/*` (certificate, assessment, quiz, verification, markdown, sidebar, block shell) | 0 | 0 | acid 1 in certificate-page and 1 in completion-cta | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1-3 each | 0 | 0 | 0 | 0 | 1 each |
| `app/ki-fuehrerschein/page.tsx` / `eu-ai-act-kurs` / `ki-und-gesellschaft` / `ai-native` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 / 4 / 3 / 2 |

Additional old-look markers, not tokens:
- `workshops-content.tsx`: rotated tape strips (l.47 `rotate-3 bg-brand-sky/60`, l.51 `-rotate-6 bg-brand-pink/55`); aside `lg:-rotate-1` (l.75); `motion-safe:hover:-translate-y-0.5` row lift (l.174); preview `group-hover:-rotate-1` (l.191); `h-3 w-3 bg-brand-teal` and `bg-brand-cobalt` bullet squares (l.60, l.221); acid callout `border-l-[3px] … bg-brand-acid/35` (l.235).
- `learning-atlas.tsx` l.511: offset stack `absolute inset-0 translate-x-2 translate-y-2 border border-border bg-card`.
- `technical-course-landing.tsx`: 4px orange top bar (`h-1 … bg-brand-orange`), `bg-kupfer-mist` facts aside, 0.25rem orange section bars, CTA in `font-mono uppercase border-2`.
- `demos/page.tsx`: `bg-foreground` dark aside on the hero (not `.dark-section`; uses `text-kupfer-light` for 5.0:1), and `STAT_TONES` `border-t-brand-acid/sky/pink`.

---

## 7. Contrast facts the restyle must respect (computed, WCAG formula)

| Pair | Ratio | Verdict |
|---|---|---|
| **white on `#e07050`** (what `bg-brand-orange text-white` becomes **inside `.dark-section`**) | **3.18** | **FAIL AA.** It breaks axe and Lighthouse a11y = 1.00. |
| `#242342` (dark-bg) ink on `#e07050` | 4.74 | pass |
| `#141414` ink on `#e07050` (proposed graphit band) | 5.79 | pass |
| white on `#a5370f` (copper, outside dark scope) | 6.66 | pass |
| white on `#b73a15` (Mennige, proposed) | 5.79 | pass |
| `#a5370f` copper **text** on `#242342` | 2.26 | FAIL (never use an unscoped accent on a dark band) |
| `#b73a15` text on `#141414` | 3.18 | FAIL |
| `#e07050` on `#242342` / `#141414` | 4.74 / 5.79 | pass (this is why the dark scope flips the accent) |
| `#f7f1e7` on `#242342`; `#f3f0e9` on `#141414` | 13.41 / 16.19 | pass |
| `#d7d0e4` (dark muted) on `#242342` | 10.07 | pass |
| border `#827970` on `#f7f1e7` / `#fff9ed` / `#f3f0e9` / `#f9f7f2` | 3.80 / 4.07 / 3.75 / 3.99 | pass (>= 3 required by the learning-instrument contract) |
| track `#d9d0c4` on `#f7f1e7`; `#d4cec5` on `#f3f0e9` | 1.36 / 1.37 | < 2 as required (decorative only) |
| dark-border `rgba(247,241,231,.4)` over `#242342` | 3.35 | pass |
| globals-css semantic tokens on the proposed `#f3f0e9`/`#f9f7f2` (and own 20% tint) | 5.43 to 8.51 | all pass |
| `.dark-section` overrides on a proposed `--color-dark-bg: #141414` | 5.79 to 12.03 | all pass |

Implications:

1. A primary CTA inside a dark hero must use dark ink, e.g. `text-[var(--color-dark-bg)]`. The pattern already exists in `ai-native/demos/observ-demo.tsx` and `excel-demo.tsx` and is pinned by `dark-surface-contract`.
2. Also fix the hover. `TECHNICAL_COURSE_PRIMARY_ACTION_CLASS` has `hover:bg-foreground`. Inside `.dark-section`, foreground is `#f7f1e7`, so white-on-cream on hover. Use `hover:text-[var(--color-dark-bg)]` or a `hover:bg-card-hover` variant.
3. Alternatively, keep the action row on paper directly under a dark band that holds only the eyebrow, h1 and intro. That breaks nothing, but the primary must still be inside `<header>` for `technical-course-landings.spec.ts` and `foundation-course-entry.test.tsx`, so the header element would have to span both the band and the action row.
4. A token swap to the deck palette (`#f3f0e9` / `#f9f7f2` / `#121212` / `#4f4640` / `#b73a15` / dark `#141414`) is **contract-safe** for globals-css and learning-instrument. It requires the manifest and themeColor sync (row 19) and re-baselining all 4 pixel screenshots (E6).

---

## 8. Recommended approach: restyle with the fewest contract edits

### Principles

- Keep token **names** and change classes. Stop using pastels, kupfer-mist, offset sheets, the marker highlight and mono-uppercase eyebrows on the three surfaces, but leave the tokens defined (other routes use them).
- Change the contract in the open when a test pins a literal of the old look. `docs/experience-system.md` asks for exactly that. Do not route around a source-text ban by moving classes into CSS selectors or a wrapper component just to hide the literal. The policy doc calls that the "loophole" it keeps shut. Update the assertion to the new intent and keep the KEEP half of every MIXED test.

### Radius decision

- **Square (radius 0)** matches the W03 deck the owner likes and the sibling `design-direction.md` §5. It needs **0** radius edits.
- **6px (`rounded-md`)** is allowed today on workshops and demos. It needs edits only in `technical-course-landing.test.tsx` (the `\brounded` ban on the 3 constants) and `technical-course-progress.test.tsx` (if the rails round).
- **8px (`rounded-lg`)** additionally needs `workshops-content.test.tsx` and `workshop-detail-content.test.tsx`. Suggested replacement for all of them: ban `rounded-(xl|2xl|3xl|full)` and `rounded-[…]`, which keeps "no pills, no over-rounding".

### Dark hero band recipe (passes every KEEP contract)

1. Apply `dark-section` to an in-flow, full-width block. Do not use `w-screen`/`100vw`, negative margins or translate (E3, E4). For the technical and foundation landings, `TechnicalCourseHeader` sits inside a `max-w-[1180px] px-4` frame. Either make the header the dark panel inside the frame, or restructure `TechnicalCourseFrame` so the band sits outside the frame while `[data-technical-course]` still wraps the h1 and the primary.
2. Spacing of 48px or less (`py-12` max) on demo surfaces (row 10.3), and no `mt/pt/pb-14+` on technical pages (row 20).
3. Primary CTA: keep `bg-brand-orange`, one per frame, inside `<header>`, `min-h-12`, `motion-reduce:transition-none`, with dark ink text on dark and a safe hover.
4. Height budget at 390x664: W01/W02 hub-to-lab distance can grow by **180px at most**; `/kurse` by 428px or less; landing CTA bottom must stay under 844px (390x844) and 900px (1440x900).
5. No `<img>` inside `[data-technical-course]` frames (row 37). Draw the band art as inline SVG with `aria-hidden`, or as a CSS background on an ancestor outside the frame. No `<img>` in the `/kurse` atlas (E15).

### Minimal edit list

These are the contract edits required by a calm-editorial restyle. Everything else is KEEP and needs no change.

| # | Test file | Minimal change (keep the rest) | Needed when |
|---|---|---|---|
| 1 | `src/app/workshops/workshops-content.test.tsx` | Replace `not.toContain("dark-section")` with a render-level check that no `[data-decision-card]` contains `.dark-section` ("no black cards in the paper list"). This allows a dark hero band and keeps the no-dark-cards intent. Optionally relax the radius regex to `rounded-(?:xl\|2xl\|3xl\|full)`. Keep `motion-reduce:transition-none` on rows (harmless) or drop that one line if rows stop transitioning. | Dark band on `/workshops`; 8px radius |
| 2 | `tests/e2e/heading-band-geometry.spec.ts` | Remove `/workshops` and `/en/workshops` from `ROUTES` (keep `/buecher`). | The workshop h1 marker is removed |
| 3 | `src/app/kurse/learning-atlas.test.tsx` | Next-proof card: `bg-paper border-t-brand-orange` becomes the new surface class (e.g. `bg-card`). Row action: `border-brand-orange bg-paper text-foreground` becomes the new recipe, keeping `h-11 w-11 lg:h-auto lg:w-auto lg:min-h-11`. Completed badge: `bg-kupfer-mist` becomes the new token. Plate-tone test: drop the `bg-brand-*` tone parity; keep "plate and action are two cells, no row-span, `lg:bg-transparent`" if the rail stays, or retire it. In-path marker `border-l-brand-orange`: only if changed. | Always, for `/kurse` |
| 4 | `src/components/course/technical-course-landing.test.tsx` | Header `border-foreground` becomes the new border class. Section heading `grid-cols-[0.25rem_minmax(0,1fr)]` is replaced by an assertion on the new quiet heading (keep `[data-technical-section-heading]`). `text-xs` on PRIMARY: keep the 12px minimum, e.g. assert `/\btext-(?:xs\|sm)\b/`. The `\brounded` ban becomes `rounded-(?:xl\|2xl\|3xl\|full)` (only for 6-8px). **Keep** `min-h-12/14`, no shadow/translate/transition-all, and `motion-reduce:transition-none`. | Always, for course landings |
| 5 | `src/components/demos/demo-design-contract.test.ts` | `toContain("transition-[border-color,box-shadow]")` becomes `toContain("transition-colors")` or `transition-[border-color,background-color]`. If the preview zoom goes, `toContain("transition-transform")` and `motion-reduce:transform-none` go with it. Keep the ban line `hover:-translate\|active:translate\|transition-all\|rounded-full\|linear-gradient\|demo-corner` and the 48px gap cap. | The offset hover shadow is removed |
| 6 | `src/components/demos/demo-tile.test.tsx` | The preview-content `motion-reduce:transform-none` assertion (only if the zoom is removed). The dark-tile badge case (only if dark tiles are retired; then also drop `dark` from the registry). Keep the light-badge AA ink pairing. | Optional |
| 7 | `src/app/workshops/[slug]/workshop-decision-lab.test.tsx` | Kicker `toHaveClass("text-xs","text-brand-orange")` becomes `text-xs` plus the quiet colour. `border-brand-teal` becomes the new pass token if one is introduced. Keep all behaviour, focus and live-region assertions and the "icon + colour + word" distinction. | Quiet eyebrows / pass-green token |
| 8 | `src/app/catalog-surfaces-mobile.test.ts` | Only if the hub geometry is rebuilt: update the exact strings in (e), (f) and (g). Keep (a) server-only, (b) order restore, (c) hidden restore, and keep the "decision first on phones" reorder on workshop rows (or update (d)). | Hero/row rebuild |
| 9 | `tests/e2e/__screenshots__/visual-regression.spec.ts/courses-desktop.png` (and books, open-source, legal if global tokens change) | Re-record after human review (`--update-snapshots`, desktop Chromium, 1440x900). | Always for `/kurse` |
| 10 | `src/app/web-app-manifest.test.ts` (no test edit) | Sync the manifests and the `layout.tsx` `themeColor` to the new `--color-background`. | Background token change |
| 11 | `src/components/course/technical-course-progress.test.tsx` | `not.toMatch(/shadow\|rounded/)`: keep it if the rails stay square (recommended). | Rounded rails only |
| 12 | `docs/experience-system.md` | Not an automated check, but it is the policy the tests cite. Update l.24 (expressive palette) and l.36 (`shadow-card`/`shadow-tile` as "standard soft elevation … workshop tiles") so they describe the new direction. | Always |

With **square geometry**, drop the rounded items from rows 1, 4, 11 and 12. The edit set is then 5 unit-test files (rows 1, 3, 4, 5, 7), 1 e2e spec (row 2) and 1 pixel baseline (row 9). Row 6 is optional.

### Workshop 04 and static materials (intersects the same files)

- Append W04 as index 3. `workshops-data-readiness.test.ts` requires W03 at `[2]`. Then update the count pins:
  - `workshops-content.test.tsx`: 3 rows, 3 outputs, 3 ids, 3 index links, "3 guided cases", `[data-decision-card]` x3, 3 images.
  - `workshops.test.ts`: `["01","02","03"]` and the formats arrays.
  - `ANALYTICS_WORKSHOP_SLUGS` in `src/lib/analytics/registry.ts`.
  - Optionally `route-workshops-locales.spec.ts` and `content-parity.test.ts`.
- W04 must reuse the lab labels (row 27) and have 3 lab facts. A `card-preview.webp` must exist at 1024x576 and roughly 30 KB.
- **Any edit to a W03 static file requires regenerating `public/workshops/datenbereitschaft-fuer-ki/bundle-manifest.json`** (sha256 and size per file). The W03 e2e hooks in E10 must also survive a demo rebuild. `workshops-static-links` forbids directory hrefs in all workshop HTML.

---

## 9. Classification

### A. Pins of the old look: legitimate to update

- `workshops-content.test.tsx`: the `dark-section` ban ("without black hub panels"), the `rounded-lg` ban, `[data-workshop-editorial-spread]`, the row `motion-reduce` class (only meaningful with hover lift) and the hub copy strings.
- `workshop-detail-content.test.tsx`: the `rounded-lg` ban (only if 8px is wanted).
- `workshop-decision-lab.test.tsx`: kicker `text-brand-orange`; the `border-brand-teal` token name.
- `learning-atlas.test.tsx`: `bg-paper` + `border-t-brand-orange` card, `border-brand-orange bg-paper` action, `bg-kupfer-mist` badge, pastel plate-tone parity, `border-l-brand-orange`, "no .dark-section in next-proof".
- `technical-course-landing.test.tsx`: `border-foreground` header, `grid-cols-[0.25rem_…]` orange bar, PRIMARY `text-xs` exactness, `\brounded` ban.
- `technical-course-landings.design.test.ts`, `supplementary-hubs.design.test.tsx`, `technical-course-progress.test.tsx`: `\brounded` bans (only relevant if you choose a radius).
- `demo-design-contract.test.ts`: `transition-[border-color,box-shadow]` and `transition-transform` requirements.
- `demo-tile.test.tsx`: preview `transform-none`; dark-tile case.
- `demo-bento-tiling.test.ts`: the bento layout itself (only if the gallery stops being a bento).
- `catalog-surfaces-mobile.test.ts`: exact geometry strings (e), (f), (g) and the reorder inventory (d).
- `heading-band-geometry.spec.ts`: the `/workshops` routes (the marker highlight).
- `visual-regression.spec.ts` pixel baselines.
- `dark-surface-contract.test.ts` exact classNames (only if AI-Native demos are restyled; keep its intent).
- `docs/experience-system.md` palette and elevation paragraphs.

### B. Accessibility and behaviour protections: must keep

- **Contrast**:
  - `globals-css.test.ts` (semantic AA on light surfaces and 20% tints; dark overrides >= 4.5 on dark-bg)
  - `learning-instrument-design-contract.test.ts` (border >= 3:1, track < 2:1, dark rgba strings)
  - `semantic-status-color-contract.test.ts`
  - the intent of `dark-surface-contract.test.ts` (dark scope before status colours; dark ink on copper badges)
  - demo-tile badge ink pairing
  - axe in `a11y.spec.ts`, `courses.spec.ts` and `a11y-routes-new.spec.ts`
  - Lighthouse accessibility = 1.00
- **Type floor (12px)**: `interface-typography-contract`, `demo-design-contract` (1), `public-demo-interface-floor`, `learning-surface-density-contract`, `foundation-course-entry` source half, `technical-course-landings.design`, the workshop tests' sub-12 regexes, and `technical-course-landings.spec.ts` computed font-size.
- **Target size (44px)**:
  - `public-demo-interface-floor`, `interaction-target-design-contract` and `course/interaction-design-contract`
  - `passive-state-design-contract` (`min-h-11` count)
  - `a11y-target-size.spec.ts`, and `technical-course-landings.spec.ts` (44x44 for every control in the frame)
  - learning-atlas `min-h-11/14`, `h-11 w-11`; `demo-cta` `min-h-11`; workshop row link `min-h-11`; `TECHNICAL_*` `min-h-12/14`
  - `foundation-course-block-actions`
- **Focus**: the prompt-scanner outline (`public-demo-interface-floor`), `:focus-visible` on engine actions (`demos.spec.ts`), `a11y-keyboard.spec.ts`, focus-not-obscured (`a11y.spec.ts`), and decision-lab focus management.
- **Reduced motion and motion budget**: `motion-policy-contract` (no `transition-all`, global reduce fallback, finite demos), `learning-instrument` (no infinite animation or `transition: all`), `learning-surface-density` (no pulse/bounce), `demo-design-contract` (5)/(6) motion-reduce plus no autoplay, `TECHNICAL_*` `motion-reduce:transition-none`, `a11y-reduced-motion.spec.ts`, and "no hover displacement" bans (`passive-state`, `foundation`, `technical`).
- **Hydration and server rendering**: `workshop-hydration.spec.ts` (6 disabled radios, `aria-busy`, noscript, no transmission), `catalog-surfaces-mobile` (a) (no `"use client"` on the hubs), `workshop-detail-content` "stays a Server Component", and `open-with-your-ai-mounts`.
- **Layout safety**: `catalog-surfaces-mobile` (b)/(c) (breakpoint-paired order and hidden), the overflow and reflow specs (`responsive`, a11y 320 reflow, `route-german-foundations-responsive` escapes, `route-workshops-locales`, `demos.spec` engine containment, `qa-visuals`), the first-viewport rules (`learning-density.spec.ts`, `technical-course-landings.spec.ts`), `semantic-landmark` (one main, one h1), and the bento no-holes guard while a bento exists.
- **Performance**: Lighthouse LCP/CLS/TBT/size budgets, `font-loading.test.ts` (4 `font-display: optional`, no extra preloads), and eager/`fetchpriority` on the first workshop preview.
- **Integrity**: the W03 `bundle-manifest.json` hashes, `workshops-static-links`, and the material language labels.

---

## Appendix: reproducing the checks without touching the repo

- Baseline config: `scratchpad/tmp/vitest.contracts.config.mjs` (root is the website package; `cacheDir` in scratch). Run from `packages/website`: `node node_modules/vitest/vitest.mjs run --configLoader native --config <that file> <test files>`. `--configLoader native` is required, because the default bundling loader fails on `@vitejs/plugin-react`'s `vite/internal` import.
- Simulation: `scratchpad/sim/platform/packages/website` (copy) plus `scratchpad/tmp/sim_restyle.py` plus `vitest.sim.config.mjs`. Results are in `scratchpad/tmp/sim-results.json`. When sorting failures, ignore the ones caused by the missing `supabase/`, `scripts/`, `next.config.ts`, `sentry.*` and root policy files.
- Headroom probe: `scratchpad/tmp/measure-headroom.mjs` (Playwright, `/opt/pw-browsers/chromium`, dev server on :3000). Output is in `headroom.json`.
- Contrast: `scratchpad/tmp/contrast.mjs` and `contrast2.mjs`.
