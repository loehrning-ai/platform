# W04 demo polish (key: demo-polish)

I applied the demo critique (`impl/w04/demo-critique`) to `demo.html` at 1440x900 and 390x844. I also checked the page at 1024, 800 and 320 px. All 4 high and 8 medium issues are fixed, and so are all 9 low ones.

## Files
- `scripts/workshop04/demo-core.js`: the axis now starts at a round value below the lowest total (`scale().a0`, 1,200 t in both methods), and `pos()` measures from that point. `view()` has these new fields: `head`, `start.sub/axis/raw`, `meters.distZero`, `mbNote`, and `axis`. `check` is empty in the default state. The captions say "to the right answer", not "down to". A new function `mbNote()` writes the market-based caption.
- `scripts/workshop04/demo-app.js`: renders the new fields. It builds the coverage caption from the current state and shows the cells with English glyphs. Drawer changes: "Caught by" lines, the wide dup view, and English display values in the ledger row card. The prompt text changed to "Now set T4 to …". I removed the unused `TRAP` map.
- `scripts/workshop04/demo.template.html`: new CSS and markup (details below). The material strip now matches the other W04 pages, and the 06 Kit tab links `./kellbrunn-esg-kit.zip` with `download`. The inline strip script is gone and `./lib/w04-pages.js` replaces it.
- `scripts/workshop04/build-demo.mjs`: writes `demo.html`, `lib/w04-demo-core.js` and `lib/w04-demo.js`. Each of the two scripts starts with a "generated" header. `--check` covers all 3 files. New assertions:
  - no `<script>` without `src` or `type="application/json"`;
  - the page loads both lib scripts;
  - no dash, forbidden API or 40+ mixed-case token in the lib scripts;
  - no "down to the right answer";
  - the default path chains from its start row to the right answer (LB and MB);
  - the MB caption holds the T1 to T3 row and bar values, and does not show without T7;
  - the guided-step copy matches its keys: signs, F-EL-GO = 0, and the masks and methods of steps 4 and 5;
  - only T7 gets the market-based tag;
  - folder disk order, the bridge axis range, a glyph for every coverage code, and "Enerqie" still in the scan.
- Generated: `packages/website/public/workshops/esg-berichte-mit-ki/demo.html` (202 KB), `lib/w04-demo-core.js` (new), `lib/w04-demo.js` (new).

## Critique items
High
1. **Default chain.** With every switch fixed, the start row is now "The raw-folder answer (constructed)" at 1,866.5, drawn as a dashed bar. The path numbers are slate italic and chain from it: 1,784.5, 1,864.5, 1,464.5, 1,960.0, 1,918.2, 1,915.2, 1,915.2. The chart header reads "Path from the raw-folder answer (dashed)". The check line is hidden in this state and shows only when the drawn bars are the live state.
2. **Gauges.** `.gauge` is now a block element at 100% width, 8 px high (measured 257 and 206 px wide at 1440). The dashed right-answer marker sits inside the track with 4 px clear of the sub-label. The three meters share subgrid rows, so labels, values and gauges line up.
3. **Market-based caption.** A boxed caption shows when the method is market-based and T7 is active (the dashed path counts). Built from the JSON: "In market-based, T1 to T3 are fixed while T7 still prices power at the grid average, 0.40. Their bars (−82.0, +80.0, −400.0) therefore differ from the rows (+123.0, −120.0, +600.0), which use the residual mix, 0.60. Both are right." Singular and pair forms cover custom states. The column header now reads "Fixing it changes the total by".
4. **Duplicate drawer.** The dup view opens a wider drawer, `min(980px,94vw)`. Cards have `min-width:0` and horizontal scroll. Tables use `table-layout:fixed` and 13 px text, with the amount column `nowrap`. Below 820 px of drawer width the two cards stack, and on phones the drawer is full width.

Medium
5. **Captions.** All three read "… to the right answer".
6. **Bar encoding.** Ink fill means "fixing lowers the total", ink outline means "fixing raises it", and dashed marks the path. There is a legend above the chart column, and on phones the legend is in the hint. Hatch now appears only on the raw start bar, the raw lane, the switch track in the "As the AI did it" position, and the Talbrück grid cells. The switch text sits on paper.
7. **Axis.** The board prints "The axis starts at 1,200 t, not at zero, …" in the start row; it is hidden where no track is drawn. The bridges share one computed axis (1,700 t) and have a caption: "The change bars are to scale; the 2024 and 2025 bars are shortened." The cut mark is clearer.
8. **Coverage caption.** It is built from the state, for example "As the ledger has it, with the traps you switched on in section 2: March counted twice, October empty, Talbrück bill included." The meter-reading sentence shows only when T2 is fixed.
9. **Six vs seven.** The section 2 intro adds "Six traps change the location-based total. The seventh, T7, only touches the market-based figure." T7's title loses "(market-based)" on screen and gets a "Market-based only" tag instead. `constructedLabel_en` stays verbatim.
10. **Guided steps.** Each step now has a "Why it matters" line with numbers taken from its own keys. The actions name the controls, for example "Set only the Talbrück bill (T3) to “As the AI did it”." Step 5's result is the live total from combinations[3]: 1,917.2 t · −5.0% vs 2024.
11. **Scripts.** None are inline any more: `<script src … defer>` loads w04-demo-core.js, w04-demo.js and w04-pages.js. The data stays in `<script type="application/json">`, which is not executed.
12. **Drawer copy.** Every drawer now uses a bold "Caught by" line: dup, Talbrück, factors and fuel. The dup drawer names invoice 4711-03 once and the OCR noise "Enerqie" once.

Low
13. **Ledger row card.** "yes (CSV: ja)", "1,850,000 kWh (Hs basis)", "333.0 location-based · 333.0 market-based (CSV: 333,0 / 333,0)", "rows 30.09.2025 and 31.10.2025", "Reader, AI proposal (CSV: KI-Vorschlag)", "grade A", "4711-10 (requested; CSV: angefordert)". The carrier is in English.
14. **Quotes.** Display text uses curly quotes; the JSON is unchanged. The built page text has 0 straight quotes. The prompt now reads "Now set T4 to “As the AI did it” …".
15. **Trap rows.** Names sit in an ID column with `text-wrap:balance` and a no-break space before the last word. Links show the document type, with the file name in `title` and in the drawer header: "Scanned March bill", "Meter readings", "Talbrück annual bill", "Werk Süd statement", "Two gas bills", "Fuel-card export", "Factor file", "Nov and Dec bill". The meta row does not wrap and ends in an ellipsis if it runs out of room.
16. **Coverage codes.** The glyphs are English: Y, M, ½ and Q; the class names keep the JSON codes. The August line is a flag chip plus "August 120,000 kWh is a real dip during the plant holiday." (from `aug_kwh`), with 18 px above it. On phones the month column is pinned and the headers wrap.
17. **Two-month row.** A plain "No switch" chip sits in the switch column, followed by `trapNotes.twoMonthBill_en` only.
18. **Text sizes.** The minimum is 14 px: `.iso` tail 15 px, meter labels 15 px, tags and chips 14 px, legends 14 px. Only glyphs inside cells are smaller (13 px). On phones the lanes are stacked, raw first, with labels at 14 px and values at 20 and 24 px. The phone scan and the check found no text under 14 px outside cells.
19. **q-card.** It now has the W03 treatment: a 6 px Mennige rule, the question icon inline from the deck sprite, and the label "One question, held fixed". The distance value is ink at 0.0 t and Mennige above 0.
20. **Tree and run record.** The tree uses disk order (Werk_Nord/Strom, Werk_Nord, Werk_Nord/Gas, Werk_Sued, Lager_Ost, Flotte, faktoren) in CSS columns. The run record shows a "Target answer, constructed. Not a recorded run." chip plus "Used for the ledger answer in the deck and the guide."

Also changed:
- Phones: only the meters stay sticky; the tabs and presets scroll away, and the meters use short labels. The section 2 intro now shows on phones.
- Below 360 px the rows stack.
- In the control total, invoice numbers do not break.
- The rank headers are 14 px.

## Verification
All scripts are in `impl/w04/demo-polish/`.
- `check.mjs` → `check-final.json`. 550 state checks at 1440 and 390: a Gray-code walk through all 128 masks in both methods, both presets, all 7 "Only this trap" buttons and guided steps 2 to 5. Each state checks:
  - total, start row, end row, change vs 2024 and distance;
  - that the running totals chain from the start row to the right answer (the default dashed path included);
  - that the MB caption shows exactly when it should, with the right values;
  - the coverage caption plus the March, October and Talbrück cells;
  - the distance colour, the gauge size, and the check line (hidden only at mask 0).
- Results: 0 failures. Console errors and warnings: 0. CSP violations: 0 (listener added before load; the dev CSP has `script-src-attr 'none'`). Inline executable scripts: 0.
- axe (wcag2a/aa, 21aa, 22aa): 0 violations at both widths. Targets under 44 px: none.
- Drawer: 46 openers at 1440 and 39 at 390 (keyboard open, focus inside, Esc, focus returns). Reduced motion: 0s. Without JS the final state still reads (1,915.2 t, −5.1%, 144 cells, path 1,866.5 → 1,915.2).
- `shot.mjs` (the critique's script): every control operated at both widths, no overflow, no page-level horizontal scroll. The gauges render as block elements, and the dup drawer tables fit their cards. `sizes.mjs`: no overflow at 1440, 1024, 800, 390 or 320.
- `node scripts/workshop04/build-demo.mjs --check`: up to date. `node --check` passes on both lib scripts.
- Numbers: every figure comes from JSON keys or `combinations`. The new ones are 1,917.2 / −5.0% (combinations[3]), 0.40 / 0.60 (factors), the axis starts (computed from `combinations` and `total_*`) and 120,000 kWh (`aug_kwh`). The build asserts all of them.
- Heights: 1440 is 6,340 px. 390 is 6,981 px, up from about 6,344 because the lanes are now stacked as SPEC 3.3 asks.

## For the integrator
- guide, field card and transfer link the kit as `./esg-kit.zip` (from `build-pages.mjs`, line 321), but the file is `kellbrunn-esg-kit.zip`. The demo links the real file.
- The demo now depends on `lib/w04-pages.js` (strip and back-link script, owned by the pages build).
- The chart direction for custom states is unchanged from the demo build (this answer → right answer), which deviates from SPEC 3.1.
