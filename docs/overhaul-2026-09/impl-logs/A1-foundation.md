# A1-foundation change log

## Files changed
- `packages/website/src/app/globals.css`: the @theme now uses the Werkzeichnung palette from design-direction 5.8. Details:
  - Colours: Kalkweiß #f3f0e9, ink #121212, Schiefer #4f4640, muted #655c54, card/paper #f9f7f2, card-hover #efebe2, track #d4cec5, border #827970, Mennige #b73a15, kupfer-dark #97300f.
  - New tokens: `--color-inset` #e5e4e2, `--color-hairline`, `--color-pass` #205b46, and `--color-mennige`. `--color-mennige` is an unscoped #b73a15 for non-text bars inside dark bands.
  - Graphit: dark-bg #141414, dark-fg #f2f1ee, dark-muted #a8a097. The dark border/track are rgba(242,241,238,.4/.16).
  - `--shadow-overlay` added. `--shadow-tile` deleted (it had 0 usages). shadow-card and shadow-card-hover are kept for routes that have not migrated yet, retinted to ink.
  - `--ease-deck` and `--ease-fade` added.
  - Type tokens: display, fluid-h1/h2/h3 (updated), lead, body, label, caption, num-lg.
  - `.dark-section` remapped to graphit, with the accent at #e07050 and pass at #6fbf9a. It also gets hairline, inset and card tokens.
  - New utilities: `.kicker` and `.kopflinie`. The focus comment was updated.
  - The pastel tokens, kupfer-mist and --color-paper are still defined.
- `src/app/layout.tsx`: changed only `themeColor` to #f3f0e9.
- `public/site.webmanifest` and `public/site.en.webmanifest`: theme_color and background_color set to #f3f0e9.
- `src/lib/learning-instrument-design-contract.test.ts`: the pinned dark rgba strings are updated to the graphit values (242,241,238 / 0.4 and 0.16). All contrast assertions are unchanged.
- `src/app/globals-css.test.ts`: a new "Werkzeichnung palette contrast" block, which checks:
  - ink, Schiefer, muted, pass and kupfer-dark are AA on paper, Bogen and Beton;
  - Mennige is AA on paper and Bogen;
  - the primary button's paper-on-Mennige text is AA at rest and on hover;
  - the graphit text tokens are AA;
  - white on #e07050 is flagged as failing and dark ink on it as passing;
  - the Mennige bar is at least 3:1 on graphit;
  - shadow-tile is gone.
- `docs/experience-system.md`: the Identity section and the geometry/elevation/mono bullets now describe Werkzeichnung.
- New `src/components/werk/`, all server-safe with no "use client":
  - `cx.ts`: clsx plus an extended tailwind-merge that registers the Werkzeichnung font sizes as `font-size`, so `text-label` is not merged away by `text-muted-foreground`.
  - `pictogram.tsx`: `<Pictogram name>` built from the deck sprite path data, copied verbatim. It covers question, deck (i-app), canvas, guide (i-book), export, checklist, table, clock, chart, database, calendar, person, pass, fail, gap and shield. Two glyphs are new, drawn in the same style: `demo` (play) and `download`. Pictograms are aria-hidden unless you pass `title`.
  - `arrow-glyph.tsx`: square-cap arrows for right, external and down. The right arrow uses `.arrow-nudge`.
  - `kicker.tsx`: `<Kicker>`.
  - `section-head.tsx`: `<SectionHead title id caption description as>`, with the Kopflinie, an h2, and a caption on the right.
  - `cover-band.tsx`: `<CoverBand labelledBy globe globeProps>`. It is an in-flow `section.dark-section`. The globe is absolutely positioned behind the content, aria-hidden, `hidden md:block`, masked in from the left and cut off by overflow-hidden.
  - `globe-lines.tsx` and `globe-geometry.ts`: an orthographic graticule. Each parallel and meridian is one SVG elliptical arc, which comes to about 4 KB of markup. Germany is a hand-simplified outline in Mennige at low opacity; it is not taken from the licensed world-atlas data, so no licence notice is needed.
  - `route.tsx`: `<Route stations current mode="progress|description" label locale>`. It renders an `<ol>`: vertical on phones, horizontal from sm. The current station gets `aria-current="step"` plus sr-only state words (erledigt/aktuell/offen, or done/current/open in English). Line segments are solid up to the current station and dashed after it. In description mode everything is solid.
  - `question-card.tsx`: `<QuestionCard question label tone size>`. The dark tone scopes itself with `.dark-section`. The bar is `bg-mennige`, which stays true Mennige even on graphit.
  - `material-list.tsx`: `<MaterialList>` and `<MaterialRow icon name description meta href actionLabel external download hrefLang headingAs locale>`. Each row is one stretched link with a 44px action and a focus ring on the whole row (`has-[:focus-visible]`).
  - `stat-row.tsx`: `<StatRow stats>`.
  - `callout.tsx`: `<Callout variant="note|gap|boundary" title icon>`.
  - `button-link.tsx`: `<ButtonLink variant="primary|ink|secondary|text" tone="paper|dark" external download arrow locale>`, plus `BUTTON_CLASSES` for `<button>` elements.
  - `chip.tsx`: `<Chip variant="meta|pass|gap">` and `FILTER_CHIP_CLASS`.
  - `index.ts`: barrel export.
  - `werk.test.tsx`: 42 tests. They cover a source contract (no rounded/shadow/uppercase/pastels/rotate/"use client"/100vw/dashes), the behaviour and a11y of every primitive, the globe projection and its markup size, and the cover band structure.

## Decisions
- Primary button on paper: `bg-mennige text-paper hover:bg-kupfer-dark`. These colours are not scoped, so the pair stays AA even inside `.dark-section`. On dark (`tone="dark"`) the primary is a paper button, `bg-dark-fg text-dark-bg`. Neither variant can produce white on #e07050.
- Ink button hover goes to `hover:bg-muted-foreground`, not #2b2a28, so it stays AA in both scopes.
- Text links use `decoration-border` (Kante, 3.75:1) rather than `decoration-hairline`, which is decorative only at 1.37:1. The underline stays visible.
- In the QuestionCard the bar is Mennige on both tones, per the task brief (the design doc had ink on paper). Use it at most once per page.
- The globe centre is at 36N 10E. Germany sits near the vertical middle of the band and the north pole is cut off at the top, as on the deck cover.
- The fluid-h1/h2/h3 sizes shrink globally, per the design doc. For example, the fluid-h2 maximum drops from 52px to 36px. On the home page `workflow.tsx`, `offering.tsx` and `credibility-strip.tsx` use text-fluid-h2/h3 with their own tracking overrides. They are outside my scope, so check them.

## Left for the integrator and page agents
- `src/lib/utils.ts` `cn()` uses stock tailwind-merge. `cn("text-label text-muted-foreground")` DROPS `text-label`, and the same happens with text-caption, text-body, text-lead, text-display and text-num-lg. Either use `cx` from `@/components/werk`, or extend `cn` the same way (see `werk/cx.ts`).
- Beyond my screenshots, the global palette change affects the following:
  - The indigo #242342 dark sections (footer, AI-native demo engines, any `.dark-section`) are now graphit #141414. Muted text in them is now #a8a097, and muted-foreground is Leinen.
  - `dark-surface-contract.test.ts` still passes.
  - Pixel e2e baselines (E6 in map-design-contracts) will need re-baselining.
- The `.dark-section` card is now a solid #1c1b1a instead of a translucent tint.
- Static materials (`public/workshops/_shared/tokens.css`) are not part of this task.
- A lint or contract test that bans the retired patterns on learning surfaces (design-direction section 10.3) is not added. It belongs with the page agents once their files are migrated.
- A one-time Route line-draw animation is not included; Route renders its final state only. If a page wants the draw, it adds it with a motion-reduce fallback.

## Checks run
- `bunx vitest run` on the following files, all passing:
  - `src/components/werk`
  - `src/app/globals-css.test.ts`, `src/app/web-app-manifest.test.ts`, `src/app/font-loading.test.ts`
  - `src/lib/learning-instrument-design-contract.test.ts`, `src/lib/motion-policy-contract.test.ts`, `src/lib/semantic-status-color-contract.test.ts`, `src/lib/dark-surface-contract.test.ts`, `src/lib/interface-typography-contract.test.ts`
  - `src/components/home/mobile-rails.test.tsx`
  - the density contracts
- eslint is clean on my files. tsc shows no errors in my files.
- Screenshots:
  - `scratchpad/impl/A1/{home,workshops,kurse,demos}-1440.png`: text is readable, and the footer graphit band has legible text.
  - `scratchpad/impl/A1-foundation/preview-1440.png` and `preview-390.png`: a static render of all primitives against the dev CSS. There is no horizontal scroll at 390.
- Not run: e2e / axe / Lighthouse (they need a build) and the full vitest suite.
