# B2 workshop detail: polish pass (after critique), with the retry run

This covers two runs:

- **First polish run (13:30).** It is in the WIP commit `60d9eb7`.
- **Retry run (16:00-16:20).** I re-verified every critique item against the current tree, which now includes Workshop 04 in the registry, and fixed what the new fourth workshop exposed.

Screenshots and scripts:

- First run: `scratchpad/impl/B2-workshop-detail-polish/`
- Retry run: `scratchpad/impl/B2-workshop-detail-polish2/`. This holds `shot.mjs`, `parts.mjs`, `lab.mjs`, `name.mjs`, `w0X-{de,en}-{1440,1024,390}-*.png`, the `-sN.png` slices and the `lab-*.png` files.

## Verification (retry run, current tree)

I checked 20 page and viewport combinations: W01, W02, W03 and W04, in DE at 1440, 1024 and 390 and in EN at 1440 and 390. On every one:

- axe (WCAG 2.2 AA) finds **0 violations**.
- There is **0 horizontal overflow**.
- There is **1 h1**.

A computed-style scan of `<main>` also found none of the following:

- text under 12px
- uppercase text
- mono text
- box-shadows
- border-radius
- em or en dashes

In the lab after a wrong answer, W03 and W04 pass axe at 1440 and 390, and the marks read correctly:

- Decision fieldset: "Deine Wahl · nicht richtig".
- Evidence fieldset: "Deine Wahl · nicht der stärkste Beleg".

In Chromium, the W04 h1 has the accessible name `ESG-Berichte mit KI: Von Rohdaten zu klaren Erkenntnissen` (EN: `ESG Reporting with AI: From Raw Inputs to Clearer Insights`). It matches `getByRole('heading', { level: 1, name, exact: true })`, so `tests/e2e/route-workshops-locales.spec.ts` still finds it.

## Status of every critique item

| # | Severity | Item | Status |
|---|---|---|---|
| 1 | high | Wrong-pick wording per fieldset | Done (`yourWrongDecision` and `yourWrongEvidence`, chosen by `kind`) |
| 2 | medium | Material row on phones: chip and action on one line | Done (`col-start-2 flex … sm:contents`) |
| 3 | medium | Desktop row alignment and stable columns | Done (`sm:items-start`, `8.5rem`/`7.5rem` columns, icon, chip and link offsets) |
| 4 | medium | Flat hierarchy | Done (`MinorHead`, an h2 set in `text-fluid-h3`, for the four list blocks; h1 is `lg:text-display`) |
| 5 | medium | Route → lab | Done within ownership: the lab station is bold with `data-lab-station` and an "Übung unten" line, and a caption link "„…“ unten ausprobieren ↓" goes to `#workshop-lab`. The inset "here" square needs a Route prop (see below). |
| 6 | medium | Orphaned "Anmeldung" in the cover caption | Done (`max-w-[48rem]`, each fact `whitespace-nowrap`) |
| 7 | medium | Lab titles in fragment style | Presentation done (`keepNumbersWithUnits`, `max-w-[24ch]`). **Data rewrite left for the copy owner** (below). |
| 8 | medium | "Danach kannst du / Du erkennst" | Done ("Nach dem Workshop"; "Du gehst mit" now appears only in the cover) |
| 9 | medium | Repetition ("erfunden", English, dates) | Done in the component: the fictional note, the outcomes caption and the Material caption are gone. **Repeated text inside the data is left for the copy owner** (below). |
| 10 | low | Station captions breaking at 1024 | Done (minutes on one line, activity and flags on the next) |
| 11 | low | Minutes shown twice; ".zip" repeats the chip | Minutes done. **Labels are data** (below). |
| 12 | low | Facts as a fact table | Done (label above value in a `<dl>`). **"Nachfrage p50" is data** (below). |
| 13 | low | Q-card crowding the globe at 1024 | Done (`md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[42rem]`) |
| 14 | low | Cover `dl` alignment | Done (grid, pairs as `contents`, `mt-3`) |
| 15 | low | noscript text and "erste Entscheidung" | noscript done. **The legend is data** (below). |

## Files changed in the retry run

- **`src/app/workshops/[slug]/workshop-detail-content.tsx`**
  - **Cover title with a subtitle** (new, for W04).
    - `splitTitle()` splits a title at its first ": ".
    - The part before the colon stays at display size, including the visible colon. The subtitle is a block `<span data-title-subtitle>` set in `text-fluid-h2`.
    - Before: "ESG-Berichte mit / KI: Von Rohdaten zu / klaren Erkenntnissen" ran to three display lines and broke inside "mit KI". Now it is "ESG-Berichte mit KI:" over "Von Rohdaten zu klaren Erkenntnissen".
    - The h1 `textContent` and its accessible name are still the exact title.
    - Titles without a colon (W01 to W03) render as before.
    - I first tried an sr-only colon and dropped it. Chromium then computed "…KI : Von…", which would have broken the locale e2e name match.
  - **Case figures stay on one line when a label wraps** (new, visible in W04, e.g. "Abstand der KI-Summe zur richtigen"). Both StatRows get `[&>div]:justify-between`, so each value sits at the foot of its column.
  - Removed a stale duplicate comment above the station captions.
- **`src/app/workshops/[slug]/workshop-decision-lab.tsx`**
  - **Fact table columns** (new, for W04). `grid-cols-3` split "12 Stromrechnungen" into "Stromrechnung / en" at 1440 and 1024.
    - From 26rem the `dl` is now one row with `grid-flow-col grid-cols-none auto-cols-[minmax(min-content,1fr)]`. Columns are equal while the content fits, and a column never gets narrower than its longest word.
    - It now wraps between words ("12 / Stromrechnungen").
    - W01 to W03 still show three equal columns.
    - Added `data-lab-facts`.
- **Tests**
  - `workshop-detail-content.test.tsx`, two new cases:
    - The W04 title with a subtitle in DE and EN: the heading name and `textContent` are the full title, the first text node is the head, and the subtitle node holds the text after the colon. W03 has no subtitle node.
    - The case StatRow carries `[&>div]:justify-between`.
  - `workshop-decision-lab.test.tsx`: the facts `dl` uses `auto-cols-[minmax(min-content,1fr)]` and no longer uses `grid-cols-3`.

The first run's changes are unchanged; see git `60d9eb7`. They cover MaterialRow, MinorHead, Route → lab, the cover caption and `dl`, the removed repetition, the per-fieldset wrong-pick wording, `splitFact`, `keepNumbersWithUnits`, noscript, and `outcomesHeading`, `labStation` and `tryBelow` in `workshop-copy.ts`.

## Checks

- `bunx vitest run src/app/workshops src/components/werk`: 7 files, 109/109 pass. `src/app/workshops/[slug]` alone: 4 files, 59/59.
- `bunx eslint "src/app/workshops/[slug]" src/app/workshops/workshop-copy.ts`: clean.
- **Typecheck.** `tsc -p tsconfig.typecheck.json` stops on syntax errors in the dev server's generated `.next/dev/types/routes.d.ts` and `validator.ts`: two writes interleaved on line 166. That is not a source problem. Instead I ran:
  - a scratch tsconfig over `src/**` without the generated dev types: 0 errors;
  - a scratch tests tsconfig over `src/app/workshops/*/*.test.tsx`: 0 errors.

  Both configs are in `B2-workshop-detail-polish2/`. They extend the package tsconfig and are not in the repo.
- `bun run content:lint`: 0 errors and no warnings in `src/app/workshops/**`. The existing warnings are in static materials and data files owned by others.
- e2e: not run, as the rules require. Two specs are affected:
  - `route-workshops-locales.spec.ts`: the h1 name was checked in Chromium (see above).
  - `workshop-hydration.spec.ts`: the noscript first sentence is unchanged.

## Environment notes for the integrator

- **The dev server served 404 for every `/en/workshops/<slug>`** (DE was 200), while `/en/demos/<slug>` worked. The log shows no `generate-params` step for the EN detail route, so its cached static params were stale, most likely from before W04 was registered. Touching `src/app/workshops/[slug]/page.tsx` (mtime only, no content change) made Turbopack recompile, and all EN detail pages are 200 again. If this appears in CI or on another dev server, restart it; nothing in the code is wrong.
- **Fonts use `font-display: optional`.** While the dev server is under load, the first navigation often renders in the fallback (DejaVu), because the woff2 arrives after the block period. My scripts navigate once and then reload, so screenshots show Loehrning Sans. Anyone reviewing screenshots from a cold load should expect this; it is not a regression.
- During the retry I briefly created `packages/website/tsconfig.b2tmp.json` and `packages/website/.b2probe.ts`, one command each, and deleted both straight away. `git status` shows no stray files.

## Left for the integrator / data owners (outside my ownership)

1. **Lab titles (voice rules, fragment style), data files.**
   - `workshops-data-readiness.ts` (W03): → "Die KI meldet 120 Euro Endbestand. Übernimmst du die Zahl?" (EN "The AI reports an ending balance of 120 euros. Do you take the number?")
   - `workshops.ts` W01: → "Wie verteilst du 1.050 Stück auf drei Standorte?" (EN "How do you split 1,050 units across three sites?")
   - `workshops-esg-reporting.ts` W04: "1.866,5 Tonnen, 7,5 % weniger als 2024. Weiterschicken?" → e.g. "Die KI meldet 1.866,5 Tonnen, 7,5 % weniger als 2024. Schickst du die Zahl an die Bank?" (EN "The AI reports 1,866.5 tonnes, 7.5% below 2024. Do you send the number to the bank?")
2. **Legend.** Change `decisionLegend` "Deine erste Entscheidung" / "Your first decision" to "Deine Entscheidung" / "Your decision" in W01, W02, W03 and W04. The lab asks only one decision.
3. **Fact label.** In W01 `facts`, change "Nachfrage p50 1.180" / "Demand p50 1,180" to "Geschätzte Nachfrage 1.180" / "Estimated demand 1,180".
4. **Repetition in data.**
   - W03:
     - Drop `dataLimitations[0]` ("Die Daten sind vollständig erfunden …").
     - Cut `provenance.note` to "Die Datenbankergebnisse stammen aus einem Lauf des Workshop-Kits auf PostgreSQL 16." The invented case and the live date are already in the provenance line.
     - Cut `accessNote` to "Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser. Einführung auf Deutsch." Drop "Material auf Englisch" and the recording sentence.
   - W01: drop "Alle Firmen und Zahlen … erfunden" from `provenance.note`.
   - W02: drop the first sentence of `provenance.note`.
   - W04:
     - `dataLimitations[0]` repeats "Firma, Rechnungen und Mengen sind erfunden".
     - `provenance.note` repeats "Kellbrunn … erfunden".
     - `accessNote` repeats "das Material ist auf Englisch".

     Cut these the same way. The cover already says "erfundener Fall · Material auf Englisch", the Fall caption says "Erfundener Fall", and the provenance line says "Daten: erfunden".
5. **Material labels.** "Readiness-Kit · .zip", "Analyst-Kit · .zip" / "Analyst kit · .zip" and "ESG-Kit · .zip" repeat the ZIP chip. Drop " · .zip".
6. **Route `highlight` prop (optional, `src/components/werk/route.tsx`).** In description mode, add a prop that draws the inset "here" square on one station (blueprint 6.10). Then pass `labStation` and drop the bold-label workaround.
7. **Registry field (optional).** Add `decisionLab.agendaIndex`, so `LAB_STATION` in `workshop-detail-content.tsx` can go. The current map is W01 0, W02 5, W03 1, W04 1.
8. **StatRow (optional, `src/components/werk/stat-row.tsx`).** Consider making `justify-between` on the stat column the default, so values align on every page when a label wraps. The detail page passes it through `className` for now.
