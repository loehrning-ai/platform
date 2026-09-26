# A4-static-w01-w02: change log

Restyle of the static materials of W01 (`ki-prognosen-einschaetzen`) and the W02 deck (`geschaeftsberichte-mit-ki-lesen`) into the W03 "Werkzeichnung" language.

## Files

New
- `scripts/workshops/workshop-frame.css`: the shared frame (source of truth). It holds the tokens (`--wf-*`), the strip and material route (square stations with a 3px ink underline on the current one), footer, type, Kopflinie section head `.wf-kopf`, ledger rows `.wf-rows/.wf-row`, `.wf-card`, the question card `.wf-qcard` (the only left bar), `.wf-note` (+`--gap` dashed, no stripe and no tint), `.wf-steps`, `.wf-table`, `.wf-btn` (+primary ink), `.wf-stamp`, `.wf-num`, `.wf-code`, the graphit `.wf-cover` with a masked globe, chart classes, and reduced-motion, forced-colors and print rules. It has no `url()` except data URIs.
- `scripts/workshops/sync-frame.mjs [--check]`: copies the source into `lib/` of each slug listed in `FRAME_WORKSHOPS`.
- `public/workshops/{ki-prognosen-einschaetzen,geschaeftsberichte-mit-ki-lesen}/lib/workshop-frame.css`: byte-identical copies.
- `ki-prognosen-einschaetzen/lib/hands-on-frame.css`: the lab page skin. It also carries the clipping fix, `@media (min-width:901px) and (max-height:980px)`.
- `ki-prognosen-einschaetzen/assets/fonts/Typing-Medium.woff2` and `Typing-SemiBold.woff2`: same bytes as in W02, with manifest rows.
- `ki-prognosen-einschaetzen/assets/globe.svg`: same bytes as in W02 and W03. SVG, so no manifest row.
- `packages/website/src/lib/workshops-frame.test.ts`: the drift test. It checks that the copies equal the source, that the frame uses data: URLs only, and that every W01 page links the frame. It also bans offset box-shadows, dot and graph-paper backgrounds, `#0b66e4/#245cff/#0866ff/#0f2333/#081826/#0e2436` and `Space Mono` in both folders, and pins the 980px breakpoint.

Changed in W01
- `hub.html`: rewritten. It now has a graphit globe cover with a sentence-case kicker, a one-colour h1, the audit's lede rewrite, an ink primary button plus an outline button, and a question card. Below that are a Materials ledger (02–05) plus the dataset link, "What you can do afterwards" (in euros), and a table of the three practice companies with their questions. Every href is kept.
- `hands-on.html`: the navy and grid backgrounds and the `body.dark` theme are gone. The `:root` palette is now the W03 palette. Act 3 is `data-mode="light"`. `FL_PALETTE` has the §9.4 values. The breakpoint moved from 860 to 980px. The `.wf-mats` route moved from the footer into the header strip. Framework copy lost its em dashes and "AI advantage" became "What the model adds"; amounts are in euros. All IDs, classes and data attributes are kept.
- `lib/hands-on-acts.js`: the injected stylesheet is rewritten. It has no shadows, gradients, radii or mono caps; controls are ink, and Mennige is kept for the model line only. The navy `DK` palette is now the paper set, and the colour literals are remapped. Money shows as `€` (`$` before). Canvas fonts are now JetBrains Mono, with nothing below 11px. Status and mode labels are sentence case. The confetti is now a no-op. The `node pad` fix stops the "Live signals" label from clipping.
- `lib/forecast-lab.js`: Space Mono and Space Grotesk are replaced by JetBrains Mono and Typing.
- `lib/tokens.css`: added the 500 and 600 font-faces. The JetBrains weight range is now 100–800.
- `case-study/index.html`:
  - Remapped the `:root`; removed the graph-paper, all box-shadows, uppercase and wide tracking.
  - Mapped every blue, orange and grey hex to the palette in CSS and JS; set `rx` to 0; removed the offset "shadow" rect behind SDM.
  - Removed tints and coloured left rules; set the type floor to 13px in CSS and 12px in SVG; sentence-cased the SVG labels.
  - Added a Werkzeichnung override layer at the end of the inline style: sections sit under a 2px ink Kopflinie, panels are Bogen sheets with hairlines, and the code card is Beton.
  - Copy fixes: the h1 and six h2 slogans are rewritten; "honest demand" is now "estimated demand".
  - Added a closing section, s12 "What SDM decides", with the decision rule and next-step links. It fixes the dead end.
- `field-card.html`:
  - Rewritten on the frame: numbered hairline sections; formulas on Beton; the ★ box is now "Five checks before you trust a forecast", with one Mennige bar.
  - The unnamed-company figures are dropped. The Flu Trends figure is attributed to Lazer et al. 2014, and the retail benchmark is named as M5 (Makridakis et al. 2022). "Earns its keep" is removed.
  - Still prints on exactly 1 A4 page (checked with pdfcheck).
- `homework.html`: rewritten on the frame. Tiers are now "Level 1–3" with hairlines; badges, shadows and pink notes are gone. The data is weekly, so "14 days" and "yesterday" became "14 weeks" and "last week". "Earned its keep" is removed. Prints on 4 pages, same as before.
- `lib/wf.css`: deleted. Nothing references it any more.

Changed in W02
- `lib/deck.css`:
  - Chrome is Typing 600, 22px, sentence case. The markdot is ink. The ghost numeral is deleted. Headline tracking is -0.015em.
  - Body sizes: lg 30, md 24, sm 22. Overline is 24px sentence case in slate. Label is 20px Typing.
  - `d-card` has no Mennige top. `d-card.ink` is now a light sheet with an ink outline. Chips are 22px sentence case.
  - The prompt card has a 2px ink outline and a 20px body; the copy button is ink, sentence case.
  - `.mock` has no offset shadow and a 2px ink outline. Verdict has no left bar. `.slide.kupfer` is graphit; `.slide.cream` is paper.
- `lib/tokens.css`: dot background removed; `--mennige-on-dark` and `--pass` added.
- `lib/deck-viz.css/.js`: ghost bars are slate. The NCR motif is more compact, with no opacity-dimmed text. The caption cssText is Typing 20px with no uppercase.
- `lib/deck-stage.js`: the shadow-DOM overlay is now the W03 light square toolbar: 44px buttons, 2px ink edge, Mennige focus ring. Toast and portrait hint lose their offset shadow. The logic is unchanged.
- `slides.html`:
  - Every inline style class is restyled: Route squares are outline and ink, not Mennige fill; the "You fill this" flag is an outline stamp. Report-link hover shadow and lift are gone, and the cover globe gets an edge mask.
  - Inline font sizes are raised: ≤12→17, ≤14.5→18, ≤16→20, ≤21→22.
  - Chrome: the topbar right label is now "Workshop 02 · Reading business reports with AI". The footer left shows the slide label, which fixes the old duplicate overline. The long all-caps title in the footer is gone.
  - Slide 22 is now graphit with the globe and has a new headline.
  - Rail labels are sentence case.
  - Copy fixes:
    - Colon reveals on slides 11 and 15, and the count-first headline on slide 4 ("Five prompts.") and slide 5.
    - Slide 16 simplified: the em dashes, "not X" staging and "Saying so is the job" are gone.
    - "Ask for a tool, not an answer", "NORTHWIND is made up. The method is not.", the "no code, no API key" triple and several lowercase label starts are fixed.
  - Prompt texts that learners copy are unchanged.
- `card-preview.webp` (both): regenerated at 1024×576. W01 is the hub cover band; W02 is the deck cover with the toolbar hidden.
- `ASSET_MANIFEST.json`: I re-read it right before writing and edited only the W01 and W02 rows. Both card rows got new size and sha, and two W01 Typing rows were added (copied from the W02 rows, sha verified). W03 rows are untouched.

## Checks run
- `bunx vitest run src/lib/workshops-frame.test.ts src/lib/workshops-static-links.test.ts src/lib/workshops.test.ts`: 3 files, 33 tests passed. The frame test has 8 tests.
- eslint: the new test file sits under an ignore pattern (tests are ignored). Prettier was applied. tsc reports no errors in my file.
- `bun run scan:public`: passed. The first run aborted with "inventory changed during scan" because other agents were editing; the retry passed. `bun scripts/verify-artifact-assets.ts`: passed.
- `bun run content:lint`: 0 errors. I fixed the three voice warnings in my files.
- Playwright (scripts in `scratchpad/impl/A4-static-w01-w02/`, shots in `scratchpad/impl/A4/`):
  - `shot.cjs`: every W01 page at 1440×900 and 390×844. No console errors and no horizontal overflow.
  - `lab.cjs`: all three acts at 1440×900, 1920×1080 and 390×844. Every widget button clicked and sliders moved. No JS errors, and `.stage` and `.hs-card` do not clip.
  - `swap.cjs`: the DE strip swap works on all 5 pages; one `.wf-mats` per page with a current item; one h1 per page.
  - `deck-check.cjs`: per-slide overflow, clipped containers, text-overlap and type floor. 0 problems on all 22 slides at 1920×1080 and 1440×900. The minimum font size is 17px on the 1920 canvas, 14px on slide 12. Most text is ≥ 20px.
  - `deck-interact.cjs`: `#13` lands on slide 13; Copy changes to "Copied"; keyboard navigation works; no errors on desktop or mobile.
  - `pdfcheck.cjs`: field card 1 page, homework 4 pages.

## Left for the integrator
- W02 `slides.html` does not link `lib/workshop-frame.css`: the deck is styled by `deck.css`. The copy is there for consistency and for the drift test. W03 (guide, demo, builder) still inlines the old strip block. Adopting the frame there needs `scripts/course03` (`isRepositoryAuthored`, the `authored` map, `refresh-published.mjs`) and is not in my scope. When W03 or W04 adopts it, add the slug to `FRAME_WORKSHOPS` in `scripts/workshops/sync-frame.mjs` and in `workshops-frame.test.ts`.
- W02 type floor: 20–60 elements per slide are still between 17 and 21px on the 1920 canvas (mono tables, mock details, prompt bodies at 18–20px). Pushing everything to 22px would need splitting slides 8 and 12–14. I did not split slides.
- The W02 report rasters (`assets/report/*.webp`) still show the pink "Open board question" box from the fictional report. Changing them needs new file names (the files are served immutable) plus manifest rows.
- The case study still uses Mennige for "request / Retail" in several charts. A second pass could reduce it to one Mennige mark per chart.
- The case study still names "iphone_launch_signals" in the SQL sample and in some copy ("phone launch"). I left this alone.
- `globe.svg` (158 KB) is loaded on the W01 hub. svgo was not run, because the file must stay byte-identical to the copies in the other folders.
