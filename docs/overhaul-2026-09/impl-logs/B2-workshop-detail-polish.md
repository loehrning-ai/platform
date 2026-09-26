# B2 workshop detail: polish pass (after critique)

Screenshots and scripts: `scratchpad/impl/B2-workshop-detail-polish/`. This includes a full re-run of the 15 page and viewport combinations: axe found 0 violations and there is 0 horizontal overflow on every combination. The lab passes axe after both a wrong and a right answer. The slices are named `-sN.png`.

## Files changed

- `src/app/workshops/[slug]/workshop-detail-content.tsx`
  - **MaterialRow.** On phones the chip and the action now share one line: the wrapper is `col-start-2 flex … sm:contents`.
    - Desktop grid: `sm:grid-cols-[2rem_minmax(0,1fr)_8.5rem_7.5rem] sm:items-start`. The icon (`-mt-1`), title, chip (`sm:-mt-0.5`) and link (`sm:-mt-2.5`) share the title line, and the chip column no longer shifts from row to row.
    - Minutes are left out of the caption when the label already contains them ("Interaktive Demo · 10 Min.").
  - **Hierarchy.**
    - Für wen, Nach dem Workshop, Das brauchst du and Nicht Teil dieses Workshops use a local `MinorHead`: the same Kopflinie, still an h2 in the outline, but set in `text-fluid-h3`.
    - The cover h1 is `lg:text-display lg:max-w-[18ch]`. Below lg it stays `text-fluid-h1`, so the start button on phones is unchanged.
  - **Route → lab.**
    - The station the lab mirrors (a local `LAB_STATION` slug map: W01 0, W02 5, W03 1, W04 1) has a bold label with `data-lab-station`, plus a third caption line, "Übung unten" / "Exercise below".
    - Under the Route, the source caption now sits next to a link "„Die falsche Antwort“ unten ausprobieren ↓" (EN: Try “…” below). The link points to `#workshop-lab`.
    - The lab section carries that id and `scroll-mt-20`.
  - **Station captions** are two block lines: the minutes, then the activity and flags. There are no dangling " · " at 1024. This was done through the ReactNode caption, so `route.tsx` is untouched.
  - **Cover caption.**
    - The caption is `max-w-[48rem]`, and each fact is `whitespace-nowrap`, so a line can only wrap between facts. "Anmeldung" no longer sits alone on a line.
    - The dl is now an aligned grid (`sm:grid-cols-[auto_minmax(0,1fr)]`, pairs as `contents`, `mt-3`). The colons after the labels were dropped.
    - The QuestionCard is `md:max-w-[34rem] lg:max-w-[36rem] xl:max-w-[42rem]`, which leaves a gap before the globe's Germany at 1024.
  - **Repetition.**
    - The fictional note under the case narrative is removed; the real-case explanation stays for non-fictional cases.
    - The "Du gehst mit" caption under the outcomes is removed; it now appears only in the cover.
    - The Material SectionHead caption ("Kostenlos, ohne Anmeldung. Alle Materialien auf Englisch.") is removed. The cover and the EN chips already say this.
- `src/app/workshops/[slug]/workshop-decision-lab.tsx`
  - **Wrong-pick wording.** It now depends on the fieldset, through a new `kind` prop:
    - decision: "Deine Wahl · nicht richtig" / "Your pick · not correct"
    - evidence: "Deine Wahl · nicht der stärkste Beleg" / "Your pick · not the strongest evidence"
  - **Facts** render as a hairline `<dl>` fact table: the label (`text-label`, muted) above the value (20px bold, tabular). The new exported `splitFact()` splits each fact at ": ", then " · ", and otherwise before the first numeric token.
  - **Title.**
    - `max-w-[24ch]`.
    - The new `keepNumbersWithUnits()` puts a U+00A0 between a number and its unit. "20 Euro" no longer breaks.
  - **noscript** no longer mentions a "Kurs" or "course": "Diese Übung benötigt JavaScript. Die Seite und das Material funktionieren auch ohne." The first sentence is unchanged, so `tests/e2e/workshop-hydration.spec.ts` still matches.
  - New optional `id` prop.
- `src/app/workshops/workshop-copy.ts` (detail object only)
  - `outcomesHeading` DE is now "Nach dem Workshop".
  - Added `labStation` and `tryBelow(stationLabel?)`.
  - Removed `materialsAccess`, `materialsLanguage` and `fictionalExplanation`, which are now unused (grep found no other readers).
- Tests
  - `workshop-detail-content.test.tsx`:
    - covers the new heading, "Du gehst mit" appearing only in the cover, and no fictional note;
    - checks that the lab station is marked and the `#workshop-lab` link works;
    - moves the free/English assertions to the cover;
    - updates the dl text to match the dropped colons.
  - `workshop-decision-lab.test.tsx`:
    - wrong decision and wrong evidence wording;
    - the fact-table dl replaces the old class pin;
    - new `splitFact` and `keepNumbersWithUnits` unit tests.

## Checks

- `bunx vitest run src/app/workshops`: 59/59 pass.
- eslint is clean on my files.
- tsc reports no errors in my files.
- e2e was not run (not allowed). `workshop-hydration.spec.ts` noscript strings should still match. `route-workshops-locales.spec.ts` German tokens: "Danach kannst du" is now "Nach dem Workshop". A grep of tests/ finds no "Danach kannst du", so no e2e token needs to change.

## Left for the integrator / data owners (outside my ownership)

1. **Lab titles (voice rules, fragment style):**
   - `workshops-data-readiness.ts:130` → "Die KI meldet 120 Euro Endbestand. Übernimmst du die Zahl?" (EN "The AI reports an ending balance of 120 euros. Do you take the number?")
   - `workshops.ts:362` → "Wie verteilst du 1.050 Stück auf drei Standorte?" (EN "How do you split 1,050 units across three sites?")
   - The same applies to W04's "1.866,5 Tonnen, 7,5 % weniger als 2024. Weiterschicken?"
2. **Legend.** `decisionLegend` "Deine erste Entscheidung" / "Your first decision" should become "Deine Entscheidung" / "Your decision" in all workshop data files (W01, W02, W03, W04).
3. **Fact label.** In W01 facts, rename "Nachfrage p50 1.180" / "Demand p50 1,180" to "Geschätzte Nachfrage 1.180" / "Estimated demand 1,180".
4. **Repetition in data (W03):**
   - Drop `dataLimitations[0]` ("Die Daten sind vollständig erfunden …").
   - Cut `provenance.note` to "Die Datenbankergebnisse stammen aus einem Lauf des Workshop-Kits auf PostgreSQL 16." The invented case and the live date are already in the provenance line.
   - Cut `accessNote` to "Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser. Einführung auf Deutsch." Drop "Material auf Englisch" and the recording sentence, since the provenance line carries "KI-Antworten aufgezeichnet August 2026".
   - Do the same for W01's `provenance.note` ("Alle Firmen und Zahlen … erfunden") and W02's first sentence of its note.
5. **Material labels.** Rename "Readiness-Kit · .zip" to "Readiness-Kit" (EN "Readiness kit"), because the chip already says ZIP.
6. **Route `highlight` prop (optional).** `route.tsx` could get a `highlight?: number` prop for description mode that draws the inset "here" square. Once it exists, pass `labStation` and drop the bold-label workaround.
7. **Registry field (optional).** Add `decisionLab.agendaIndex` to the registry, so `LAB_STATION` in workshop-detail-content.tsx can go. W04 is already mapped to index 1 ("Die falsche Antwort").
