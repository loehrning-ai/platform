# w2-demos-polish: second mobile pass on /demos and the demo detail pages

Date: 2026-09-26. Key: `w2-demos-polish`. Nothing committed. This pass applies the w2-demos critique: all high and medium items and the cheap low items.
Scripts, screenshots and metrics live in `scratchpad/mobile/w2-demos-polish/`:
- `before/` holds the baseline, re-measured first. It matched the critique numbers exactly.
- `after/` covers 320, 375, 390 and 1440. `after-rest/` has the other 7 detail pages and `after-en/` the English hub and details.
- `iter/` holds working shots, for example `rag-390.png`, `excel-390.png`, `n8n-390*.png`, `llm-390.png`, `llm-1440.png`, `word-390-y700.png`, `excel-390-y1050.png` (the notes disclosure) and `hub-320-y300.png`.
- The scripts are `crit.mjs` (metrics and shots, output dir set with `OUT=`) and `probe.mjs` (JS probe plus shot).

## Before / after (page height in screens, true height; engine top + height in px)

| Page | 390 before | 390 after | 320 before | 320 after | engine 390 | engine 320 |
|---|---|---|---|---|---|---|
| /demos | 2.75 | 2.66 | 4.24 | 4.07 | - | - |
| excel | 3.88 | **2.73** | 6.28 | **4.17** | 290+1082 → 209+885 | 315 → 203 |
| rag-vertragsassistent | 3.53 | **2.50** | 5.46 | **3.83** | 290+735 → 209+**586** | 290 → 203 |
| llm-observability | 3.74 | **2.57** | 6.16 | **4.00** | 328+951 → 247+713 | 353 → 234 |
| n8n-supply-chain | 4.73 | **3.01** | 7.66 | **4.70** | 264+1849 → 209+**1092** | 328 → 203 |
| word | 4.20 | **2.64** | 6.93 | **4.19** | 290+1354 → 209+831 | 315 → 203 |

The other 7 details now start their engine at 203-260 at 320 (it was 264-379) and at 209-247 at 390.

Targets from the critique:
- **Excel.** At 390 the first task row spans 548-612 (target: bottom ≤ 740, tab bar at 787). At 375x667 the first task top is 548 (target ≤ 560).
- **RAG.** At 390 the instrument is 586px (target ≤ 640). The inline citation sits at y 546-564 (target: above 787). At 320 the chat log is 288/288 (scrollWidth/clientWidth), so it no longer scrolls sideways.
- **llm-observability.** At 390 the first scenario top is at 365 (target ≤ 480). The output of the selected mismatch shows inline at 483-739, inside the first screen.
- **n8n.** At 390 the instrument is 1092px (target ≤ 1100).
- **Word.** At 390 the draft heading is at 469 (target ≤ 500). The draft body is 13px.
- **Detail pages.** The engine top is 203 at 320 and 209 at 390 (targets ≤ 230 / ≤ 250). There are three exceptions, all because the H1 wraps to two lines: llm-observability and cost-drift at 234, and fine-tune at 260 at 320.

Across all pages:
- At 320, 375 and 390 the page never scrolls sideways.
- No control is under 16px and no target is under 44px on phones.
- The only inner sideways scroller on the RAG page is the intended suggestion rail.
- At 1440 the Excel, RAG and llm-observability layouts match the old ones, apart from the intended changes listed below.

## What changed

### Shared detail layout (`demo-detail-layout.tsx`, new `demo-notes-disclosure.tsx`, `demo-shell.tsx`)
- **Top row.** Below sm the back link and the kicker share one 44px row: "← Praxisbeispiele  06 · RAG · Mittel".
  - The link shows the short `catalog` label and keeps `aria-label` "Alle Praxisbeispiele", so the visible text is part of the name.
  - The kicker's word "Praxisbeispiel" is `max-sm:hidden`.
  - Below 360px the level drops as well, so the row stays one line at 320.
  - From sm up the link sits on its own line above the kicker, with the same gaps as before (section `sm:pt-6`, kicker `sm:mt-6`). The `<nav>` landmark is unchanged.
- **Lead.** Below sm the lead is the new one-sentence `teaser` (17px, `sm:hidden`). The full description is `max-sm:hidden`. The H1 is `max-[359px]:text-[1.875rem]`.
- **Notes.** Below sm, "Was du prüfen kannst" and the run table fold behind one closed 44px "So prüfst du das Beispiel" button.
  - It is a client disclosure with `aria-expanded`, and its `aria-controls` lists both panels.
  - The Ausführung and Externe Aktionen rows are `max-sm:hidden` even when the panel is open, because the evidence line already states both.
  - From sm up the button is `sm:hidden` and both columns render as before.
- **Next example.** The "Nächstes Praxisbeispiel" block shows the full teaser, never line-clamped.
- **Light shell.** The light shell is `max-sm:border-b-0`, so only the notes section's 2px rule closes the engine. The doubled rule is gone.
- **Industry links.** They are `min-w-6`, because "HR" was a 22px-wide target.

### Copy (`src/lib/demos.ts`, `demos-localization.ts`, `demos-ui-copy.ts`)
- `Demo.teaser` is a new field: one full sentence of at most 75 characters per demo, in DE and EN, du-form, no dashes. A test pins those rules.
- The llm-observability lead now matches the data (two mismatches):
  - DE: "In zwei Fällen liegt die automatische Bewertung daneben."
  - EN: "In two cases the automated score is off."
- The hub phone stats line reads "12 Beispiele · 3 Ausführungsarten · 0 Außenaktionen" (EN "... 0 external actions") and uses `text-balance`.
- New `detail.notesToggle` copy for DE and EN.

### Hub rows (`demo-tile.tsx`)
- Below sm a row shows the teaser in full (`sm:hidden`, not clamped). From sm up the long description returns (`max-sm:hidden`). No row ends mid-sentence any more.

### RAG (`rag-vertragsassistent-demo.tsx`)
- **Sideways overflow fixed.** Keyword terms are joined with " · " text separators, so the line can break between terms, and the panel has `overflow-wrap:anywhere`. The chat log also has `overflowWrap:anywhere`.
- **Header.** The "KI Vertrags-Assistent · Keyword-Suche · 8 Beispieldokumente" header row is `max-sm:hidden`. That also removes the ellipsised mono subline at 320.
- **Citation.**
  - The first Fundstelle shows under the answer as one 13px caption line, "Quelle: Rahmenvereinbarung v3.2, §12.3 Kündigung" (`sm:hidden`).
  - The toggle is a plain text link "Alle 2 Quellen" below sm and a hairline box from sm up.
  - Its accessible name now starts with the visible text.
- **Terms label.** Below sm the label reads "Treffer:". From sm up it stays "Gefundene Schlüsselwörter (Konfidenz = Anzahl Treffer):", on a Birke background with a hairline, which replaces the blue tint. The Konfidenz definition is also in the panel's `title` and is visible as a caption inside the expanded sources.
- **Caption.** It now reads "Die Suche vergleicht nur Schlüsselwörter und kann Treffer übersehen."
- **One rail below sm.**
  - The rail above the input holds the follow-ups first, then the unasked questions, then the Grenzfall, all in one hairline 14px style. The arrow prefix is `max-sm:hidden`, and only the Grenzfall keeps its dashed border.
  - The rail has `pr-6` and a 24px right fade mask.
  - The follow-ups move by viewport through the new `useSmUp()` hook in `demo-utils.ts`, so each chip exists once in the DOM. From sm up they wrap under the answer as before.
- **Colours on the palette.**
  - The Konfidenz chips are ink, Schiefer and Mennige on a hairline, where they were green, amber and red.
  - The typing progress dot is ink.
  - In the English engine the blue term chips became Birke with a hairline, the confidence colours became ink, Schiefer and Mennige, and the red no-match box became dashed Schiefer.

### Excel (`excel-demo.tsx`)
- The shell note "Neun fiktive Verkaufszeilen…" is `max-sm:hidden`. Its wrapper is `max-sm:contents`, so it leaves no empty gap.
- The file bar and the formula bar merge below sm into one light 32px row: "Absatz-KW14-16.xlsx · F2 = Wachstum W/W".
- The tasks became hairline ledger rows below sm:
  - Each row has only a bottom border.
  - The selected row carries a 2px ink left tick and no black fill.
  - The "Formel generieren →" line is `max-sm:hidden`.
  - From sm up the cards are unchanged: bordered, and the selected one is ink-filled.
  - Colours and hover moved from inline styles and JS handlers to classes.
- The task title now reads "Forecast KW 17 bis 20" (EN "Forecast, weeks 17 to 20"), and so does the output label. The test that pinned the title is updated.

### n8n (`n8n-supply-chain-demo.tsx`)
- **Controls.** Below sm they take one 44px row: "4 / 4" plus icon-only 44×44 ◀ ▶ ↻ buttons. The words are `max-sm:sr-only` and the glyphs `aria-hidden`, so the names are "Zurück", "Weiter" and "Neu abspielen". The scenario pair is a 2-column segmented control on the next row.
- **Finished state.** The last step draws as run nodes: paper, a solid ink border, and only "Run" in Mennige. The Mennige fill stays for a node that is animating. "✓ OK" is ink, where it was green.
- **Log.** Below sm it folds behind a 44px "Protokoll · 6 Ereignisse" button. It shows only the final line, or the newest line while the run is animating. From sm up the log is unchanged.
- **Canvas.** The ↓ connectors are hidden below sm, and a 16px gap replaces them.
- **Nodes.** Below sm each node is two lines: the kind moves to the front of the note line.
- **Spacing.** Node padding and gaps are slightly tighter below sm.
- **Alternate-path box.** Below sm its chain diagram is hidden, and the heading and sentence stay. The scenario control already draws that path.

### llm-observability (`llm-observability-demo.tsx`)
- The demo opens on the first mismatch scenario ("Wie lange gilt ein Vertrag…"), which serves as the worked example. This applies at every width.
- **Accordion below sm.** The output renders inline right under the selected row (`aria-expanded` and `aria-controls` on the row). From sm up the rows keep `aria-pressed` and the separate output panel.
- **Scenario rows.** Below sm they are hairline ledger rows with an ink tick.
- **KPIs.** Below sm they collapse to one caption line, "4 Läufe · 1 Drift · 2 Abweichungen · Ø Auto-Score hoch". From sm up the tiles are unchanged.
- **Palette** (exported as `LLM_OBS_STATUS`):
  - Abweichung is Mennige text on a 1px Mennige border.
  - Drift is ink on a dashed ink border. It replaces the #eab308 border, which was about 1.9:1.
  - Score chips are ink or Schiefer on a hairline.
  - The failure-beat boxes use a Mennige hairline and no red tint.
  - On the ink-filled selected row (sm up), the badges switch to paper.

### Word (`word-demo.tsx`, both locales)
- Below sm the draft comes first (`max-sm:order-first`).
- The inputs fold behind a one-line summary, "Fiktivwerk Beispiel GmbH · Wartungs-KI Produktionslinie · 68.000 € · Juli-September 2026", with a 44px "Eckdaten ändern" disclosure (EN "Change the inputs"). The disclosure holds the fields, the template, the Werkbank and "Neu erstellen".
- The draft body is 13px below sm and 12px from sm up.
- The three metric tiles become one unboxed row under a hairline below sm, and stay boxed from sm up.
- The English scope note is `max-sm:hidden`.

## Tests
- **Updated:**
  - `demo-detail-layout.test.tsx`: kicker spans, plus new tests for the merged top row, the teaser lead, the notes disclosure and the next-block teaser.
  - `demo-tile.test.tsx`: teaser, no line-clamp at any width.
  - `demo-shell.test.tsx`: `max-sm:border-b-0`.
  - `rag-vertragsassistent-demo.test.tsx`: new source-toggle names, inline citation, term separators, rail order and fade, the header hidden below sm, and a new test for follow-ups under the answer from sm up.
  - `n8n-supply-chain-demo.test.tsx`: button names without glyphs, a step-counter helper, the Mennige test rewritten for the paper finished state plus the Mennige animating node at AA, and a new test for the controls row and the folded log.
  - `excel-demo.test.tsx`: task title.
  - `word-demo.test.tsx`: new draft-first and summary-disclosure test.
  - `src/app/demos/page.test.tsx`: stats line.
  - `src/lib/demos.test.ts`: teaser rules in both locales.
- **New:** `llm-observability-demo.test.tsx`, which checks the mismatch default, inline accordion placement and `aria-expanded`/`aria-controls`, the sm+ panel, and that badge colours stay in the token set.
- **e2e (`tests/e2e/demos.spec.ts`):**
  - At 390 the Excel first task's bottom is ≤ 740 and the RAG citation's bottom is ≤ 787.
  - A new 320 test checks that the RAG chat log has scrollWidth ≤ clientWidth, and that the engine top is ≤ 230 on RAG and Excel.
- **Runs:**
  - `bunx vitest run src/components/demos src/app/demos src/lib/demos.test.ts src/lib/demos-copy.test.ts`: 31 files, 343 tests, all pass.
  - The `src/lib/content` tests pass.
  - `node scripts/content-lint.mjs`: 0 errors, and no warnings in demo files.
  - `eslint` on the changed files: clean.
  - `tsc -p tsconfig.typecheck.json`: no errors in these files.
  - Playwright on chromium and mobile-chromium against the running dev server: `tests/e2e/demos.spec.ts` 54/54 pass, and the `a11y.spec.ts` demos routes 8/8 pass. The private output dirs were removed afterwards.

## Left for others / notes
- **H1 wraps at 320.** Three detail pages still start the engine above the 230 target at 320, because their H1 wraps to two lines at 30px: llm-observability 234, cost-drift 234, fine-tune 260.
- **rechnung-zu-sap table at 320.** Its `data-course-horizontal-scroll` table region (317 in 262) scrolls sideways inside itself by design. It has keyboard focus, and the page does not overflow. It could get the same phone column treatment as Excel.
- **Changes that reach sm+.** A few small changes apply at every width, not only on phones:
  - Behaviour defaults: llm-observability opens on the first mismatch, and n8n's finished state draws paper run nodes instead of three Mennige blocks. Both were asked for by the critique.
  - The next-example block uses the teaser.
  - Copy: the RAG caption, the source-toggle text "Alle 2 Quellen", and the Excel "KW 17 bis 20" title.
- **n8n log colours.** The log lines still use the status green and amber on graphit. They were not in the critique and were left alone.
- **Shell geometry.** The shell tokens (--nav-h-compact, --tabbar-h, --tabbar-band-h, --nav-h), globals.css and the werk primitives were not touched.
