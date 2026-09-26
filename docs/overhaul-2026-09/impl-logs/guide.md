# W04 learner pages change log (key: guide)

## Files
- `scripts/workshop04/build-pages.mjs` (new): builds guide.html, field-card.html and transfer.html from templates plus `scripts/workshop04/w04-data.json` (byte-identical to scratchpad `w04/data/w04-data.json`). `--check` exits 1 on drift; `--data <path>` / `W04_DATA` override.
  - Placeholders: `{{n:key[:abs|absunit|bare]}}` (numbers[key].en), `{{j:path[:int|fix1|fix2|pct|dmy]}}`, `{{fig:*}}`, `{{strip:page}}`, `{{sec}}`, `{{toc}}`.
  - Literal-number audit: the build fails if a template carries a digit outside a placeholder, except on a short allowlist of non-data facts: years; "Scope 1/2", "page N", "prompt 01"; the CSRD thresholds and dates, Directive 2024/825, § 5 UWG, category 15; the two study figures (76.9%, 78.2%); durations (25, 20, 5/30 minutes); "MWh × 1,000"; "one A4 page"; "Workshop 04". Code spans (file names, row and factor IDs) are excluded.
  - Data asserts: control total arithmetic, October = meter difference, dup minus Oct, waterfall running totals and ends, Scope 2 bridge, driver sums, LB Scope 2 = kWh × factor.
  - Output checks: no U+2013/U+2014, no inline on* attributes, no fetch/storage/innerHTML/eval sinks, no iframes, no href ending in "/", no mixed-case 40+ tokens, no unresolved placeholders, local refs exist.
- `scripts/workshop04/pages/{guide,field-card,transfer}.template.html` (new).
- `packages/website/public/workshops/esg-berichte-mit-ki/guide.html`, `field-card.html`, `transfer.html` (generated).
- `.../lib/w04-pages.css` (new): fonts (@font-face for the existing Typing-Static woff2 and JetBrains Mono, no new binaries), layout, figures, print. Used with the unmodified `lib/workshop-frame.css` (verified byte-identical to `scripts/workshops/workshop-frame.css`).
- `.../lib/w04-pages.js` (new, external): the referrer-based language-aware back link (same rule as W01/W03 strip), tab scroll/fade, and the print button. No inline scripts.

## Pages
- guide.html: the strip, the head (kicker "to read after the session · about 25 minutes", q-card with `question.en`, labels: fictional company, `meta.factorLabel_en`, "constructed from documented failure modes"), a sticky contents list at 1080 px and up (a collapsed `details` on phones), and 18 sections that follow SPEC §4 in order, each with a station kicker from the deck route. Every section has the spec paragraphs, a "Before you open" prompt, a `details` reveal and the key point. Where the spec gave no reveal answer (§2, 6, 7, 8, 10, 12, 13) I wrote one from the case data. Figures, all generated from JSON: Werk Nord month strip (as delivered vs ledger, +205,000 − 200,000 = +5,000 kWh); the Werk Süd line as inline SVG with the dot marked, plus per-employee checks; LB waterfall (hatched constructed start, dashed Mennige min/max 1,464.5 / 1,960.0, labelled constructed); a control-total table from `controlTotal`; Scope 2 bridge LB → MB; driver bars LB and MB (grid factor in Mennige). The raw answer box carries `meta.constructedLabel_en`, and the rematch box carries `meta.targetLabel_en`. The glossary has the 22 spec terms, and the links are the §18 sources.
- field-card.html: "Before you trust an ESG number", the 7-check table (Do / Don't / From the case / Deck scene), the roles line, the "Before you send" line with tick boxes, and the spec footer. A 12-square month glyph (SVG) is built from `coverage.asDelivered`. On phones the table stacks into labelled blocks.
- transfer.html: "One bill, five boxes". Each box has what to write, a dashed ruled writing area and the Werk Süd worked example from ledger row E-WS-01 / traceTwo[0] / factors. Below that: the closing sentence template in EN and DE, a writing area and the worked sentence (edition rendered from `factorEdition`).

## Checks (scratchpad impl/w04/guide/shot.mjs, sections.mjs; r3-report.json)
- 1440x900 and 390x844: 0 console errors or warnings, 0 CSP violations, 0 failed requests, no horizontal overflow, fonts loaded.
- Print (page.pdf A4, preferCSSPageSize): field card **1 page**, transfer sheet **1 page**, guide 16 pages (reveals forced open, strip, contents and buttons hidden). PDFs: r3-*.pdf; screenshots r3-*.png, s1-/s2- per section.
- The build's `--check` passes, and none of the four outputs contains a U+2013 or U+2014 dash.

## For the integrator
- Tab order: I used the order from my brief: 01 Deck, 02 Interactive demo, 03 Learner guide, 04 Field card, 05 Transfer sheet, 06 Kit (`./esg-kit.zip`, `download`). demo.html (not my file) currently uses 01 Deck, 02 Interactive demo, 03 Transfer sheet, 04 Learner guide, 05 Field card, and has no Kit tab. Pick one order and align the demo strip (or MATS in build-pages.mjs).
- `esg-kit.zip` does not exist yet. The Kit tab and the guide §15 button point to it, and will 404 until the kit is built.
- Guide §17/§8 refer to kit files `prompts/01_auslesen.md`, `prompts/02_pruefen.md`, `erwartet/belegtabelle_2025.csv`, `erwartet/kontrollsumme_strom_2025.csv`, `rohdaten_2025/` (names from SPEC §7.1).
- The field card's "Deck scene" column uses scene labels (Month grid, One unit, Whose bill, Six rules, Two Scope 2 numbers, What drove it). There are no deep links.
- No new binaries, so no ASSET_MANIFEST rows are needed for these pages. `lib/w04-pages.css` and `lib/w04-pages.js` are new text files.
- Rebuild after a data change: `node scripts/workshop04/build-pages.mjs`.
