# W04 demo change log (key: demo)

## Files
- `scripts/workshop04/build-demo.mjs` (new): builds `packages/website/public/workshops/esg-berichte-mit-ki/demo.html` from the template, the core, the app script and `w04-data.json`. It server-renders the final state (all fixed, location-based) and embeds the JSON as `<script type="application/json" id="demo-data">`. `--check` exits 1 on drift. `--data <path>` or `W04_DATA` overrides the data path; default `scripts/workshop04/w04-data.json`. The build fails if any of these checks fail: combinations[127]/[0] equal the wrong_*/total_* keys; guided-step values equal their combinations; the stored `waterfall.lb/mb` equal the core's path for mask 127; the bars add up for all 128 masks in both methods; the ledger arithmetic reproduces every t_lb/t_mb; the meter subtraction equals oct_kwh; the fuel months equal diesel_l/adblue_l; the residual-mix and grid-average arithmetic; the control total; driver sums; no U+2013/U+2014; no inline on* attributes; no innerHTML/fetch/storage/iframe; no mixed-case 40+ tokens; no href ending in "/"; no unresolved placeholders.
- `scripts/workshop04/demo-core.js` (new): pure state functions (`state`, `view`, `scale`, number formatting with U+2212). The build runs it in Node for SSR and inlines the same text into the page.
- `scripts/workshop04/demo-app.js` (new): switches (`button[aria-pressed]`), `role=tablist` method tabs with arrow/Home/End keys, presets, "Only this trap", guided sequence, coverage toggle, evidence drawer (native `<dialog>` via showModal, Tab wrap, Esc, focus return). DOM built only with createElement/textContent.
- `scripts/workshop04/demo.template.html` (new): page, CSS, strip, static copy. Placeholders `{{n:key}}` (numbers[key].en), `{{t:path}}`, `{{block:*}}`.
- `scripts/workshop04/w04-data.json`: copy of scratchpad `w04/data/w04-data.json` (so the build is reproducible from the repo).
- `packages/website/public/workshops/esg-berichte-mit-ki/demo.html` (generated, 232 KB).
- `packages/website/public/workshops/esg-berichte-mit-ki/lib/workshop-frame.css`: byte copy of `scripts/workshops/workshop-frame.css` (was missing).

## What the page shows (final state on load, also without JS)
1. q-card and two lanes (raw folder from combinations[127], hatched; ledger from combinations[0], ink), gap line (48.7 t below, 2.5%, 2.4 points), the constructed answer text in a disclosure, `meta.constructedLabel_en` visible.
2. Switchboard: 7 trap rows + non-interactive two-month row; each row has name, file (opens drawer), role tag, switch "Fixed"/"As the AI did it", "if only this trap fires" (isolated, per method; "0 t for this number" for T4 MB and T7 LB), "Only this trap". Sticky console: method tabs, presets (raw run 127, all fixed 0), meters (this answer, distance from right with below/above, change vs 2024 with the right answer marker). The waterfall is drawn inside the rows: start = this state's total, each active trap fixed in order T1..T7, end = right answer; every running total is a lookup in combinations, never a sum of stored bars. Mask 127 reproduces waterfall.lb/mb exactly (asserted). Default: the stored raw-to-right path as dashed ghost bars. Check line "Sum of the bars = chart total ✓". aria-live announces "Location-based. Total 1,819.7 t, 95.5 t below the right answer."
3. Folder tree: 20 bills + meter CSV + fuel-card CSV + factor file + a dashed placeholder for the missing October bill. Drawer: bill as paper card with the quote highlighted, ledger rows (status chip, reason with English gloss, factor IDs, edition, DQ) and the arithmetic. Special views: duplicate (both March bills side by side, 4711-03 marked), October (meter readings table + subtraction), Talbrück (addressee block, customer no., meter marked), gas (scrolls to page 2, Hs marked), fuel card (monthly sums), factors (T7: residual mix vs grid average).
4. Two bridges from drivers (LB, MB), convention caption, rewritten sentence with number buttons opening driver drawers (72.2 t in Mennige), struck AI sentence, ranking top 3 per method.
5. Coverage grid (expected; toggle "As the folder arrived"; T1/T2 switches change March/October, T3 shows the Talbrück row); phones get a transposed 12 x 6 table. Control total with the meter row below the documents sum.
6. Run record: not captured; constructed and target labels; protocol.

## Checks (ad-hoc Playwright, scratchpad impl/w04/demo/check.mjs; result check-final.json)
- 550 state assertions at 1440 and 390: gray-code walk through all 128 masks by clicking switches, in both methods, plus presets and all "Only this trap" buttons and guided steps 2 to 5. Displayed total, start/end, change vs 2024, distance (below/above), aria-pressed, sum of bars, check line all equal the JSON combinations. 0 failures.
- Drawer: 46 openers (desktop) and 39 (phone) opened via keyboard; focus lands on Back, Shift+Tab stays inside, Esc closes, focus returns. 0 failures.
- Console errors/warnings and CSP violations: 0 (both viewports, dev server CSP with script-src-attr 'none').
- axe (wcag2a/aa, 21aa, 22aa): 0 violations at 1440 and 390.
- Interactive targets below 44 px: none (both viewports).
- Reduced motion: bar transition-duration 0s. No JS: meters, grid (144 cells) and check line render from the HTML.
- No horizontal overflow at 390.

## Measurements
- Desktop 1440: 6,429 px (7.1 screens). Phone 390x844: 6,344 px (7.5 screens). The ~6-screen phone goal is not met; the file list, ranking, control total and protocol start closed on phones, the file link per trap row is hidden on phones (the bar and the file list still open the drawer). Getting to 6 would mean hiding required final-state content (lanes, bridges, grid).
- Screenshots: impl/w04/demo/final-desktop-*.png, final-mobile-*.png, s-*-{default,raw,mb12,gas,tb,cov}.png, drawer-*.png.

## Decisions / deviations for the integrator
- Chart direction: SPEC 3.1 says custom states draw right answer -> traps -> state. I used one direction for every state (this answer -> fix active traps in order -> right answer), which is the raw preset's direction in the spec and makes mask 127 equal the stored waterfall exactly. Totals are still all looked up.
- Lanes stay fixed (127 vs 0); the current state lives in the sticky meters. Phone lanes are two narrow columns, not stacked, to save height.
- Material tabs chosen: 01 Deck (slides.html), 02 Interactive demo, 03 Transfer sheet, 04 Learner guide, 05 Field card (registry order minus presenter view and zip). Align with the other W04 pages.
- Fonts referenced: assets/fonts/Typing-Static-{400..700}.woff2 and JetBrainsMono-var.woff2 (present, from the deck work). ASSET_MANIFEST rows are the deck owner's job.
- `esg-berichte-mit-ki` is not in `FRAME_WORKSHOPS` of scripts/workshops/sync-frame.mjs yet (not my file).
- The ledger reason texts and bills stay German (kit data); the drawer adds an English gloss.
- Rerun after a data change: `node scripts/workshop04/build-demo.mjs` (copy the new w04-data.json first, or pass --data).
