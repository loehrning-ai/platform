# W04 deck-polish: critique applied (retry)

This is a retry. The earlier attempt stopped part way. It left a pre-polish backup in `impl/w04/deck-polish/backup/` and some edits in the deck: the case strip, the cover meta, the anatomy "?" placeholder, a two-panel shared scale and the six-rules wording. I kept what was right and reworked or finished the rest. All numbers still come from the dataset. The build lint and a runtime audit both find 0 numbers that are not in the JSON.

## High issues
1. **anatomy vote spoiled.** Until press 5 the title asks "What do six errors do to the total?". From press 5 it reads "Six errors, 48.7 tonnes apart: 2.5%" (`gap_lb_t`, `gap_lb_pct`). The Right total bar and its 1,915.2 label stay hidden until press 2; a "?" holds the place (generator `reveal.end = 2`). Deliberate change from the SPEC §2.3 title "Six errors, 48.7 tonnes apart": the question comes first and the answer arrives with the swing band. Notes: the "Six errors … 48.7 tonnes" line moved from the vote press to press 5, a vote cue was added at press 1, and revealOrder was reworded.
2. **what-drove-it vote spoiled.** The strike through the AI's sentence draws on press 2. Driver names ("Grid factor", …) appear with their bars: LB on press 2, MB on press 3. During the vote only the 2024 and 2025 names show.
3. **what-drove-it scales.** `gen:drivers` is rewritten as ONE SVG with both bridges on one scale, one baseline and one cut: `lo`/`hi` come from both methods' totals, and there is a single break mark. −744.0 now draws ten times −72.2. Group heads with hairlines are drawn in the SVG, "One scale for both" sits at the right, and the own-use brackets sit clear of the value labels. The two share notes sit under their groups; the Mennige rail moves with the press (2: LB, 3: MB). The rewritten sentence (press 4) fits above y 984.
4. **Constructed label.** `meta.constructedLabel_en` now reads "Constructed from documented failure modes: what the answer looks like when all six traps fire. Not a recorded run." (DE likewise). The change is in `scripts/workshop04/data/build_dataset.py` (the deck's dataset script), regenerated in a scratch dir so no kit files land in the repo; the only JSON diff is the four meta labels. It is bound on raw-answer, resolution and A3 through `data-j`. On raw-answer and resolution the label is ink at 24 px with `text-wrap: balance`, so there is no orphan. The rematch and ask-back target labels are also ink now (M20: as prominent as the raw label).
5. **Illustrative.** Case strip reads "Fictional company · illustrative teaching factors" on 23 scenes. The factor note is `meta.factorLabel_en`, "Illustrative teaching values, not official factors." The cover meta reads "90 minutes · one fictional company · illustrative teaching factors". The host line and limits row 5 ("Illustrative teaching factors, simplified bills") match.

## Medium issues
6. **Small text.** Paper cards, ledger, factor table, trace cards and SVG labels are now at least 22 px. Details:
   - Paper cards: text 22 px, titles 28 px. New `gen:doc` params: `seg=` shows only some " · " parts of a long line (new `seg:A-B` form in `w04-fill.js`) and `join=` sets continuation lines as one paragraph. Bill cards drop the Postfach and "(erfundener Lieferant)" parts. The kit keeps the full text.
   - Ledger: six columns (Row, Company on the bill, As printed, Counted, Status, Source: file and quote). Values are 22 px mono. Each header is a two-line sentence-case label (22 px) with the CSV name under it (18 px slate mono). From press 4 the excerpt makes room for the three completion rows at reading size: labels above values and a Mennige rail on the row the room is filling.
   - Factor table (six-rules, A2): three columns (Factor ID, Value, Unit), which removes "alle" and the empty basis cells. Values are 22 px, units 20 px. The styles are shared in `w04-deck.css`.
   - Axis names: `wf-name` and `dv-name` are 24 px.
   - trace-two: dt/dd are 22 px, file names 20 px. File and arithmetic are set as label-above rows. Row IDs are `nowrap`.
   - Other sizes: rematch row IDs 22 px, compare headers 22 px, whose-bill E-TB-01 22 px, your-bill headers 22 px.
7. **month-grid tags.** Tags are 21 px bold on a paper plate cut out of the hatch.
8. **month-grid legend.** "One bill, several months" is two hatched cells under an ink bracket, and the grid draws the same bracket under every multi-month bill. The legend gains "Another company's bill" (dashed outline over hatch).
9. **One Mennige mark per press.** Earlier marks fall back to ink through `data-step-current` rules on month-grid, one-unit, whose-bill, two-scope-2 and the-ledger. The "2" badge is Mennige only on press 3 (legend key in ink). The March invoice numbers carry the mark on press 4, the October meter cell on press 5 and the net line on press 6. An audit over all 102 states finds 0 states with more than one Mennige group.
10. **six-rules wording.** Rules 2 and 6 use the critique's wording. Rule 1 reads "Check the company on the bill against the written boundary.", which matches the ledger column label.
11. **month-grid net line.** The net line is a small sum: Duplicate March +205,000 kWh, Missing October − 200,000 kWh, Werk Nord total off by +5,000 kWh. Under it: "Two errors, almost no trace in the total." The data-num keys are unchanged.
12. **two-scope-2 hatch.** Werk Nord + Lager Ost is now an empty ink outline. The residual-mix bridge bar is solid ink, and the certificate bar is an outline with a "−" inside. Hatch stays reserved for raw input.
13. **Ledger headers.** Plain labels with the CSV names under them (see 6).

## Low issues
- **Console status and rematch note.** The console fallback status reads "Static deck · no live checks" (`deck-runtime.js`). The rematch note now says: "This is the answer we expect. Recorded runs will go into appendix A3 once they are captured; the capture protocol is there now."
- **Colons.** raw-answer reads "Scope 1: 516.0 t CO₂e, Scope 2: 1,350.5 t CO₂e"; rematch reads "Scope 1 (2025): 471.2 t".
- **trace-two.** The instruction reads "rows, factor, arithmetic, and file and quote where there is one". The timer uses W03's `i-clock` (same symbol). Row IDs no longer break.
- **ask-back.** The columns sit under the title and the tray sits at the foot, hidden once it is empty, so there is no gap. Column headings repeat the tray text exactly. The rules footer is at y 944.
- **HKN card.** Continuation lines are joined into one paragraph.
- **Factor table.** No "alle" and no empty basis cells (see 6).
- **Cover and § references.** The cover kicker is "Workshop 04 · 26 September 2026" and "Rules as of 26 Sep 2026. Not legal advice." is a footer line. The `§ 5 UWG` and `§ 42 EnWG` references use non-breaking spaces.
- **Extra fixes.** limits no longer runs below y 984. The the-case partner card is balanced. The raw-folder cards were widened so the Werk Süd file name is not cut.

## Scanner fix (found while checking)
`lib/w04-data.js` carried full `rohdaten_2025/...` document paths, 40+ character mixed-case runs that the `scan:public` secret-shape rule fails. `build-deck.mjs` now publishes documents with `folder` + `file` and ledger `source_file` as the file name only, the same shape as the published `data/w04-data.json`. `w04-fill.js` resolves both shapes, and the runtime fill reproduces all 499 bound texts exactly. `build-deck.mjs` also accepts `--data <file>`. A dry run against the published `data/w04-data.json` changes only the five label texts.

## Files
- **Deck:** `slides.html`; `lib/w04-deck.css`, `lib/w04-fill.js`, `lib/deck-runtime.js` (one string); `lib/w04-data.js` and `lib/presenter-notes.js` (both generated).
- **Scene CSS** (`lib/scenes/`): cover, the-case, raw-folder, raw-answer, month-grid, one-unit, whose-bill, anatomy, the-ledger, six-rules, two-scope-2, rematch, trace-two, what-drove-it, ask-back, limits, your-bill, resolution, appendix (the factor-table block moved to the shared CSS). `presenter.html` is unchanged.
- **Scripts:** `scripts/workshop04/build-deck.mjs` (generators `doc`, `grid`, `ledger`, `factors`, `bridge` and `drivers`; data normalisation; `--data`), `scripts/workshop04/data/build_dataset.py` + `data/w04-data.json` (meta labels only), `scripts/workshop04/notes/10-act0-3.mjs` and `20-act4-6.mjs`.

## Verification (impl/w04/deck-polish/)
- `build-deck.mjs --check`: 29 scenes, 29 note entries, 0 files out of date, 0 findings.
- **walk.mjs** at 1440x900 reduced (`shots/`) and 1920x1080 full motion (`shots-1920-full/`): 102 states each. 0 console errors or warnings, 0 page errors, 0 failed requests, 0 CSP violations. No element below y 984 or outside the margins. The only overlaps are the-arc wires, which are by design.
- **Other audits:**
  - `mennige.mjs`: 0 states with more than one Mennige group.
  - `nums-all.mjs`: 0 visible numbers not in the dataset across all states.
  - `fillcheck.mjs`: 499/499 runtime texts equal the built HTML.
  - `secretshape.mjs`: 0 secret-shaped tokens in deck files (URLs in A9 are exempt).
- **fonts-all.mjs:** the main path has no text under 22 px except these, all at the sizes the critique allows: month-grid tags 21 px, ledger CSV names 18 px, factor units 20 px, file names 20 px. Appendix small print is unchanged.
- **presenter-all.mjs:** CONNECTED, 102 states plus 9 appendix pages, 10 vote cards, 0 findings, console drives the deck, target 76:30, status "Static deck · no live checks". 0 errors, 0 CSP.
- **Print/export:** `printshot.mjs` (export=final) checked on anatomy, month-grid and the-ledger.
- **Other checks:**
  - `node --test scripts/__tests__/workshop04-kit.test.mjs`: 7/7.
  - `vitest workshops-esg-reporting.test.ts`: 9/9.
  - content-lint: 0 errors.
  - No U+2013/U+2014 in deck files, notes or build scripts.
  - No inline handlers and no href ending in "/".
