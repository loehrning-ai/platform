# W04 learner pages polish (key: guide-polish)

I applied the critique in `impl/w04/guide-critique` to guide.html, field-card.html and transfer.html. All 3 high items, all 11 medium items and all 6 low items are done. The one exception is the registry wiring (high 2), which was already done in `src/lib/workshops.ts`. Both back links now return 200.

## Files
- `scripts/workshop04/build-pages.mjs`
  - Reads `scripts/workshop04/data/w04-data.json`, the file the deck build reads. The numbers are identical to scratchpad `w04/data/w04-data.json`; only the meta labels differ ("Illustrative teaching values…", "Constructed from documented failure modes: …").
  - New placeholders: `{{kit:href}}` and `{{kit:size}}` (the size is read from disk, `90 KB`), and `{{factorlabel}}` (the factor label without its closing period).
  - Numbers and units are joined with U+00A0. JSON text keeps `1.240 MWh` and `Lehrwerte v1.0` together. ISO dates and hyphenated IDs in `<code>` get `nowrap`.
  - MATS now follows the registry order: 01 Deck, 02 Interactive demo, 03 Kit (`./kellbrunn-esg-kit.zip`, download), 04 Transfer sheet, 05 Learner guide, 06 Field card.
  - The `esg-kit.zip` exemption is gone. New output checks:
    - the stale kit name fails the build;
    - a missing kit link fails;
    - a missing "illustrative teaching" label fails.
  - New data asserts:
    - the month strip draws all 12 Werk Nord electricity files;
    - Talbrück (E-TB-01) is in that folder and excluded;
    - 11 months are covered;
    - the label wording is required;
    - 948.0 = 1,444.0 − 496.0;
    - the certificates are the largest driver;
    - the waterfall ends at the right total.
  - Figures:
    - Month strip: a detached 13th column "JV" holds the hatched Talbrück cell with a Mennige outline. The ledger row shows an "out" cell (excluded row, kept with its reason). The meter cell is solid Schiefer with an on-dark label. Labels over hatching sit on a paper chip. The legend and caption are updated.
    - Bridge: a new dashed Schiefer row, "Rest at the grid average / wrong for market-based 948.0 t" (`mb_grid_avg_wrong_s2_t`). Its bar ends exactly where the residual-mix bar starts. The caption explains it.
    - Drivers: both groups share one scale (max = |drv_mb_cert_t|). The grid factor stays Mennige, and the caption says "Both groups are drawn on one scale."
    - Field-card glyph: November and December form one wide cell. It is now a `<figure>` with the caption "Werk Nord 2025 as it arrived: March twice, October missing, November and December on one bill."
- `scripts/workshop04/pages/guide.template.html`
  - §1 kicker is now "The case".
  - §2:
    - five tiles, the same as §10, including Total "market-based" 1,866.0 t −30.2%;
    - the box kicker is "Raw-folder answer · constructed", and the footnote is the JSON constructed label;
    - the body sentence is now "Six errors are inside it all the same; the next sections take them apart.";
    - "actually" is removed.
  - §3 names the twelfth file (Talbrück).
  - §12 kicker is now "Ask again". The intro reads "Five requests, three jobs … calculate, ask back, refuse". A new `.ab-rows` list labels each row with a job: Calculate, Ask back, Refuse, Refuse, Calculate.
  - §13 says "illustrative teaching values".
  - §15 is now `./kellbrunn-esg-kit.zip` with the text "Download the kit (.zip, 90 KB)".
  - §16 answer 3 uses the critique wording.
  - The footer says "illustrative". The chip has no trailing period. NBSP is used in "t CO₂e" and in "1,240 kWh".
- `scripts/workshop04/pages/field-card.template.html`
  - The glyph figure is in place.
  - Row 7 reads "−102.3 t: 72.2 t grid factor, 30.1 t own use".
  - The footers say "illustrative teaching factors".
- `scripts/workshop04/pages/transfer.template.html`
  - The text reads "illustrative teaching value", "0.0 t" is joined with NBSP, and the footers say "illustrative".
  - The phone note is separate from the wide note.
- `packages/website/public/workshops/esg-berichte-mit-ki/lib/w04-pages.css`
  - Tiles: 3 columns with values at the tile foot, and a row hairline across all three columns. On phones they become label/value rows.
  - `.ab-row`: a 7.5rem job column (nowrap); it stacks below 600 px.
  - Month strip: 13 columns and the new cells and swatches. In forced colours the cells and swatches keep their colours.
  - Bars: the `br-bar--dash` style is added, and sub-labels go on their own line.
  - Field-card case values are ink 700. Mennige remains only on the glyph's March mark.
  - On a phone screen the transfer writing boxes are hidden, with a matching note. They still print.
  - Print:
    - every size is 9 pt or larger (fc body 10.5 pt; head, scene and footer 9 pt; ex 9 pt; kicker 9 pt; DE line 9 pt);
    - the writing line pitch is 8 mm, and the sentence box has 24 mm;
    - fixed column widths on the field card, glyph beside the title;
    - `@page` margin is 10 mm × 12 mm.
- Generated: `guide.html`, `field-card.html`, `transfer.html`.
- Tab order in the demo:
  - `scripts/workshop04/demo.template.html`: the strip uses the same registry order.
  - `scripts/workshop04/build-demo.mjs`: the data candidates now try `data/w04-data.json` first.
  - `scripts/workshop04/w04-data.json`: synced to `data/w04-data.json`; only 4 meta label lines differ.
  - `demo.html` is rebuilt. `lib/w04-demo*.js` are byte-identical.

## Deviations from the critique
- Sentence writing box: the critique asked for 30 mm (4 lines). At 9 pt minimum and an 8 mm pitch, 4 lines push the transfer sheet onto 2 A4 pages. The critique measured "20–25 % empty" on a 794 px screenshot, but the real A4 content width is 703 px. I kept 3 lines (24 mm). This is still up from 2 lines at the old pitch. Measured at A4: transfer 1014/1047 px, field card 984/1047 px.
- Bridge 948.0 t: it is a labelled dashed row, not a floating tick, because a tick label did not fit at 390 px.
- §12 kicker is "Ask again". The deck's `ask-back` scene still says "Honest limits · calculate, ask back or refuse".

## Verification (scripts in `impl/w04/guide-polish/`)
- `shot.mjs p3`, run at 1440, 390 and 320 on all three pages:
  - 0 console errors or warnings, 0 CSP violations, 0 failed requests;
  - no horizontal overflow; fonts load.
- PDF (A4): guide 16 pages, field card 1 page, transfer sheet 1 page.
- `printfit.mjs`: the heights above.
- `numbers.mjs`: every numeric token in the visible text, aria-labels and titles of all three pages is in the JSON, apart from these allowlisted facts:
  - years, section and tab numbers;
  - CSRD 1,000/€450m, 2024/825, § 5 UWG, cat. 15;
  - the 76.9/78.2 study figures;
  - durations;
  - the kit size.
- `numbers.mjs` also confirms: 0 U+2013/U+2014, "illustrative teaching" on every page, and no stale kit name.
- Links: every local href on guide, field card, transfer and demo returns 200. That includes `/en/workshops/esg-berichte-mit-ki`, `/workshops/esg-berichte-mit-ki` and `kellbrunn-esg-kit.zip`.
- Demo: 0 errors and 0 CSP violations at 1440 and 390. Tabs read 01 Deck … 06 Field card.
- Builds: `build-pages.mjs --check` and `build-demo.mjs --check` are up to date. `workshop-frame.css` is byte-identical to `scripts/workshops/workshop-frame.css`.
- Screenshots:
  - `p3-*` (full pages, slices `p3-s-*`);
  - `g2-390/320-*` (phone figures);
  - `pf1-*` (print media and forced colours);
  - `d-*` (desktop figures);
  - `f7-*-a4.png` (A4 width print);
  - `demo-strip-*.png`.

## For the integrator
- Old label "Teaching values, not official factors." still appears in:
  - `scripts/workshop04/build_dataset.py` (the kit/public generator);
  - `packages/website/public/workshops/esg-berichte-mit-ki/data/w04-data.json`;
  - the kit zip.

  The canonical `scripts/workshop04/data/build_dataset.py` already says "Illustrative …". Regenerating the kit changes its size. After that, rerun `node scripts/workshop04/build-pages.mjs`, because the size shown on the guide is read from disk.
- `scripts/workshop04/w04-data.json` duplicates `data/w04-data.json`, and no build needs it any more. It can be deleted.
- The deck still labels `ask-back` as "Honest limits"; the guide now says "Ask again".
