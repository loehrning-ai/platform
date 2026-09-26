# B5-demos: change log

Scope: `/demos`, `/demos/[slug]` (+ `/en` mirrors, which are generated re-exports and needed no edit).

## Files changed

Pages
- `src/app/demos/page.tsx`: paper hero with a Kicker ("Praxisbeispiele · 12", derived from the count), a one-colour H1 ("KI-Arbeitsabläufe prüfen" / "Inspect AI workflows") and a lead. The dark "Was hier geprüft wird" aside became a three-item list with ink-square bullets. Stats use the shared `StatRow`, and every value comes from the registry: the demo count, the evidence modes in use (3, not the old hard-coded 4), and the actions that reach a real system (0, through an exhaustive `ACTION_REACHES_SYSTEM` map over `DemoExternalActionMode`). STAT_TONES (pastel tops) removed.
- `src/app/demos/error.tsx`, `src/app/demos/[slug]/error.tsx`: flat paper error state with a sentence-case kicker, an ink retry button and a secondary link. Both controls keep `min-h-11`.
- `src/app/demos/[slug]/opengraph-image.tsx`: deck palette, 700 weight, -0.015em tracking. Mono-uppercase and the offset box shadow removed.

Components
- `demo-grid.tsx`: a Kopflinie section head (H2 "Alle Beispiele") with the `role=status` count and a reset text button as its caption. Filter rows are separated by hairlines, each with a label column, square `FILTER_CHIP_CLASS` chips (ink fill when pressed) and square 44px selects. The empty state is plain (H3, body, ink button). The grid uses `gap-6`. Tiles no longer take `total`.
- `demo-tile.tsx`: every tile is the same paper sheet (`border border-hairline bg-card`). Hover changes the edge to ink (`transition-colors`, 120ms); there is no lift, scale or offset shadow, and no dark tiles. The preview is a recessed Beton band (`bg-inset`) with no registration corners. Kicker "04 · Agents · Strategie", a one-colour H3, the description (clamped on narrow tiles), meta chips (evidence, level) and the text link "Beispiel öffnen →". The bento spans are unchanged, so the tiling test is still valid.
- `demo-gallery-previews.tsx`: rewritten. The twelve fake app windows (Excel and Word chrome, coloured badges, dark blocks) are now schematic drawings in the deck grammar: hatch for raw input, ink for the processing step, dashed for an open gate, and one Mennige mark per drawing. They use deck pictograms, labels at 12px or more, mono only for data, and DE/EN labels through `useDemoLocale`.
- `demo-detail-layout.tsx`:
  - Header: back text link, then Kicker "Praxisbeispiel 04 · Agents · Fortgeschritten", a one-colour H1 and a lead.
  - Evidence: one calm evidence line.
  - Engine: `DemoShell` at full width.
  - "Worum es geht" (Kopflinie): `why`, one `proof` sentence, the "Was du prüfen solltest" list (from riskNotes) and the Arbeitskontexte chips.
  - "So läuft dieses Beispiel": a hairline `dl` with Aufbau, Ausführung and Außenaktionen, then the meta rows and tag chips. Below it, "Im Kurs" with course, lesson, stage and "Zur Lektion".
  - Footer section: continuation with the page's only Mennige button, next to "Nächstes Praxisbeispiel".
  - Removed: the five stacked disclaimers, the boxed sandbox panel, `<details>` boxes, orange left rules and mono-uppercase labels.
- `evidence-badge.tsx`: now a single caption line. It holds a mode disclosure button (pictogram, sentence-case label, 44px target, `aria-controls`), the action label, and the invented-data `note` (new optional prop, fed from `syntheticDataLabel`). The coloured badges and the all-caps SIMULIERT stamp are gone. `SimulationDisclosure` is now a boxless `text-caption text-muted-foreground` note; the old #9ca3af text was sub-AA on paper.
- `animated-meta-table.tsx`: hairline `dl` rows (label in `text-label`, value in `text-body`), still static.
- `demo-shell.tsx`: light engines sit on `bg-card` with a 1px ink frame. Dark engines keep `.dark-section` on the frame only. The header is sentence case, "Interaktives Beispiel" with the play pictogram; the orange corner marks are gone.
- `demo-cta.tsx`: square, sentence case, `ArrowGlyph`. Primary is Mennige with paper text; secondary is an outline.
- Engines (hard offset shadows only, as allowed): I deleted the `boxShadow: Npx Npx 0` lines in `excel-demo.tsx` (3), `outbound-workflow-demo.tsx` (3), `rag-vertragsassistent-demo.tsx` (1) and `fine-tune-playground-demo.tsx` (2). Nothing else in the engines changed.

Copy (audit-copy §2 #35 to #43, §4)
- `src/lib/demos.ts`:
  - Title kickers: "DSGVO-Guard." became "Personendaten markieren.", "Disponenten-Morgen, automatisch." became "Lieferverzug mit Freigabe.", "Vier Köpfe, ein Memo." became "Ein Memo in vier Schritten.", "Formel statt Bauchgefühl." became "Annahmen einzeln ändern." I also rewrote the triad kickers for Excel, RAG, Cost and LLM.
  - Descriptions: every "Das Praxisbeispiel zeigt" subject now has "du" or a concrete actor.
  - Tags: prompt-scanner "Live" became "Regelbasiert". Outbound "DAG/Git-Ops/Open" became "Pipeline/Review-Gate/Quellen".
  - Added a doc comment on `dark`, and removed the em dashes in the header comment.
- `src/lib/demos-localization.ts`: the EN mirror of the above ("Flag personal data.", "A delivery delay with sign-off.", "Change one assumption at a time.", and descriptions in "you" form).
- `src/lib/demos-copy.ts`:
  - Every `why` now opens with the case, not an unsourced rule of thumb ("Viele Analysen…", "KI-Projekte scheitern…", "Governance gehört vor…", "Ein LLM ohne Observability…"; audit rewrites used where given).
  - Every `proof` is one sentence naming what is invented, without the "Sandbox-Szenario:" prefix or a trailing negation.
  - ogSubtitles fixed: n8n "…automatisch koordiniert" became "Lieferverzug: Workflow-Entwurf mit manueller Freigabe.", the Excel colon label is gone, and the agent line is no longer count-first.
- `src/lib/demos-ui-copy.ts`:
  - The hub copy is restructured: `heading` replaces `headingLead`/`headingAccent`, `kicker(count)`, stats labels and notes, `statsLabel`, `galleryHeading`. `emptyKicker` is removed.
  - The detail labels (Worum es geht, Was du prüfen solltest, So läuft dieses Beispiel, Aufbau/Ausführung/Außenaktionen, Im Kurs) replace Sandbox-Szenario, Sandbox-Grenze and Übungsdaten.
  - Term drift: "Praxislabor" and "Interaktives Labor" became Praxisbeispiele and "Interaktives Beispiel".
  - Evidence tooltips follow audit §4.1, 4.3 and 4.4. In particular, DE `live_api` is now conditional ("würde … senden"), and the recorded-trace text no longer repeats itself.

Tests updated (old-look pins replaced; the a11y and behaviour intent is kept)
- `demo-design-contract.test.ts`:
  - Kept: the 12px floor, motion and geometry bans, the scene-gap cap and the static meta table.
  - Replaced the `transition-[border-color,box-shadow]` pin with a colour-only hover, and added a no-shadow, lift or scale check.
  - The bento checks now pin paper sheets, the Beton preview and no dark tiles, with StatRow derived from data.
  - New per-surface ban: offset shadows, `uppercase`, `border-l-[3-9px]`, font-black and crushed tracking, pastel fills, rounded-sm to 2xl.
- `demo-tile.test.tsx`: the tile heading is now H3 (the gallery has an H2). The level chip is a meta chip, and the dark-engine demo renders on the same paper sheet. The `total` padding assertion is dropped because the prop is gone.
- `demo-grid.test.tsx`: added the section head and square-chip assertions. The wrap check still asserts `flex-wrap` and no `overflow-x-auto`; the chips row is `hidden sm:flex` (selects stand in below sm), so the assertion checks `sm:flex` instead of `flex`.
- `demo-detail-layout.test.tsx`: `syntheticDataLabel` is shown once, on the evidence line (the mock exposes the note). Added a one-colour H1, no dark band for a dark engine, and the run section.
- `evidence-badge.test.tsx`: disclosure semantics (`aria-expanded` and `aria-controls`), a 44px sentence-case control, the new explanation copy, the note line, and no SIMULIERT stamp.
- `demo-shell.test.tsx`: the light frame is `bg-card border-foreground`. The label is now "Interaktives Beispiel". The dark-scope test is unchanged.
- `src/app/demos/page.test.tsx`: new H1, kicker, check list, and stats values `["12","3","0"]` read from the StatRow.
- `src/lib/demos-copy.test.ts`: `proof` is one sentence that names what is invented, with no prefix. `why` must not open with the retired generalisations, and must contain no "Das Praxisbeispiel" and no dashes.
- `tests/e2e/demos.spec.ts`: H1 expectations now read `DEMOS_PAGE_COPY.<locale>.catalog.heading`.
- `src/app/catalog-surfaces-mobile.test.ts` (**shared file, outside my list**): I edited only the `it("keeps the demo cover compact…")` block, because it pinned the old demos hero class strings. The workshops, books and open-source blocks are untouched.

## Checks run
- vitest: `src/components/demos` (26 files), `src/app/demos`, `src/lib/demos*.test.ts`, catalog-surfaces-mobile, passive-state-design-contract, sitemap, learning-graph, analytics contract, schema-validation, motion-policy, learning-surface-density, access-surfaces-density, public-information-density, `src/components/course` and `src/components/home`, globals-css, dark-surface-contract, plus every other test that imports the demo modules. All pass.
- eslint on all touched files: 0 errors.
- tsc (`tsconfig.typecheck.json`): no errors in my files.
- `bun run content:lint`: 0 errors, and no warnings in any demos file.
- Screenshots, 1440 full page and 390, in `scratchpad/impl/B5-demos/`: `/demos`, `/en/demos`, `/demos/agent-pipeline`, `/en/demos/excel` (`*-desktop.png`, `*-mobile.png`, plus the `d-1900.png` and `m-*.png` crops). No horizontal overflow at either width. Note: `.demo-gallery-tile` has `content-visibility: auto`, so a full-page capture without scrolling shows the last row blank. That is a capture artifact, not a rendering bug; the script forces it visible.

## Not run
- e2e (demos.spec, a11y axe, visual-regression smoke), Lighthouse and the build.

## Left for the integrator
- **Tall bento tile:** the `s-tall` tiles in the lower block (06 RAG) get a tall Beton band with the drawing centred and some empty space. If this reads as too much air, make the tall preview `h-auto` and let the text block take the slack.
- **Engines keep their old interior look:** mono-uppercase headings, orange accents and a dark agent canvas. That was out of scope beyond the shadows.
- **The DE detail page still shows `ResourceContextBanner`** (mono uppercase, orange left rule) above the page. It is rendered in `src/app/demos/[slug]/page.tsx` but lives in `src/components/learning/resource-context-banner.tsx`, which is not mine, so it needs the same restyle.
- **Unused `demo-gallery-tile` micro-motion CSS:** the micro-motion classes in `globals.css` (`.demo-pv-*`) are still used by the new previews (rise, snap, draw). `.demo-corner-*` in `globals.css` is dead and could be deleted.
- **`lib/demo-tokens.ts`** still carries the old risograph tones for the engines. It is untouched.
- **`src/lib/workshops-data-readiness.ts`** has content-lint `DEMO-LABEL-WARN`s. They belong to the workshop agent.
