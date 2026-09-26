# A2-workshop-schema: change log

All paths relative to `packages/website/`.

## Files changed

- `src/lib/workshops.ts`: types, W01 and W02 data (DE and EN), two helpers.
- `src/lib/workshops-data-readiness.ts`: W03 data (DE and EN), full material inventory.
- `src/lib/workshops.test.ts`: updated pins, plus a new block called "workshop standard fields".
- `src/lib/workshops-data-readiness.test.ts`: new inventory, labels, the "workshop, not course" rule, and agenda minutes checked against the deck.
- `src/app/workshops/workshop-copy.ts`: new hub and detail UI strings (DE and EN). Obsolete keys are kept and marked.
- `src/lib/machine-surfaces/workshops.ts` and its test: the new fields are exposed in `/api/workshops.json`.
- `docs/workshop-standard.md` (new): the canonical standard, in English.
- `content/skills/workshop-arbeiten/SKILL.md`: stale claims fixed.

## Schema (src/lib/workshops.ts)

- `WorkshopNumber` is `"01" | "02" | "03" | "04"`.
- New exported types: `WorkshopPhase`, `WorkshopMaterialRole` (deck, presenter, demo, guide, lab, case, card, exercise, kit, data, hub, builder), `WorkshopAgendaMode` (live, self, both), `WorkshopActivity` (listen, vote, do, write), `WorkshopAgendaItem` and `WorkshopProvenance`.
- New required fields on `Workshop`:
  - `question`, the fixed question, verbatim.
  - `outcomes`, 3 or 4 of them.
  - `agenda`, a list of `{label, minutes, mode?, activity?, description?, optional?}`.
  - `agendaSource`: "deck" or "plan".
  - `minutesSelfStudy`, plus `minutesLive?`.
  - `needs`, `notNeeded` and `notCovered` (2 to 4 items).
  - `notForYou`.
  - `provenance`, as `{author, reviewedAt, aiOutputsRecordedAt?, liveRunAt?, data: "synthetic" | "synthetic-and-public", note}`.
- New fields on `WorkshopMaterial`:
  - required: `role` and `phase`.
  - optional: `sizeLabel` (downloads only), `minutes`, `optional`, and `primary` (exactly one per workshop).
- All existing fields are kept. `outcome` is now documented as the "Du gehst mit" artefact label.
- Helpers:
  - `primaryWorkshopMaterial(workshop)`.
  - `workshopAgendaMinutes(workshop, "live" | "self")`.

## Content decisions

- **W01 currency:** the materials use US dollars (`hub.html` "in dollars", `hands-on.html` "See, in dollars", `lib/hands-on-acts.js` money() with "$"). The registry now says Dollar/dollars wherever it used to say Euro (step 01 title and text, outcome 1). The description also says that the labs price costs in dollars and the launch case counts units.
- **W01:**
  - "ehrliche Nachfrage" is renamed "Geschätzte Nachfrage (Median)".
  - The "Erster/Zweiter/Dritter Akt" scaffolding is replaced by "Im ersten/zweiten/dritten Labor".
  - The slogans "verdient ihren Aufwand" and "earns its keep" are gone.
  - The "ohne ..." stack is removed from the description.
  - The Field Card is called "Prüfkarte" in DE.
  - Hub row: label "Übersicht"/"Overview", role hub, phase before, optional. It is not deleted, so the material count stays at 6.
- **W02:**
  - The "immer" and "jede Zahl" oversell is replaced by "Claude soll ... zuerst deine Regeln lesen; prüf in jeder Antwort, ob er sie nennt" and "Eine davon prüfst du".
  - "Das Herzstück", "Fünf Prompts, ein Analyst." and "keine Zusammenfassung, sondern" are gone.
  - The requirement is now stated exactly, in accessNote and needs: the Claude desktop app with Claude Code, on a plan that includes Claude Code (per START-HERE.md in the kit).
  - The Meta disclosure is in the provenance note.
  - Material labels are now "Deck · 22 Folien/slides" and "Analyst-Kit · .zip".
  - The kit has phase before and size "60 KB".
- **W03:**
  - It is called a workshop everywhere. The format is "Live-Workshop mit Deck" / "Live workshop with deck", replacing "Interaktiver Kurs". Deck labels are "Deck · 26 Szenen/scenes". A test now rejects "Kurs"/"course" except in "Ein SQL-Kurs"/"An SQL course".
  - Materials go from 3 to 7, all verified on disk:
    - deck (primary)
    - presenter.html
    - demo.html
    - data-readiness-kit.zip (1,1 MB)
    - guide.html
    - data-readiness-kit/readiness-lab.html
    - builder.html
  - A test asserts that every root-level .html page is listed.
  - The agenda follows the deck's 7 acts: 5/10/6/17/12/15/10 = 75, plus 15 minutes of questions (live only), so minutesLive = 90. A test reads `data-seconds` from slides.html and checks each act within 1 minute and the total of exactly 75.
  - "Instructions guide, grants enforce" is replaced once by "Ein Prompt kann die KI nur bitten ...; blockieren kann das nur eine Datenbankberechtigung."
  - The case metrics are now accounts 144, export tables 7, approved views 5, months 3, replacing "Frage 1, Datenstände 2".
- The kept facts and numbers are identical. The test-pinned strings are kept:
  - decision-lab kickers, legends, submit labels, 3 facts
  - "Freigabe mit Tor" and /Knappheit.*Zuteilungsregel/
  - W01 and W03 choice and evidence labels pinned by unit and e2e tests
  - "Kein KI-Zugang nötig, alles läuft statisch im Browser"
  - "Claude steps require suitable Claude access ... files may reach that service"
  - "übertragen werden" / "may be transferred"
  - outcome labels
  - "Interaktive Demo · 10 Min." / "Interactive demo · 10 min"
  - W03 "36", "0 von 3", "9 von 9", "limited pilot, not signed off"
- **Times:**
  - W01 and W02 agendas are planned values (`agendaSource: "plan"`, self-study 90).
  - W03 self-study is set to 60, taken from the standard's example. It is an estimate, not measured. The copy labels planned minutes as "noch nicht mit Testpersonen gemessen".

## Tests (all passing)

`bunx vitest run` was run on:
- `src/lib/workshops*.test.ts`
- `src/lib/machine-surfaces`
- `src/app/api/workshops.json`
- `src/app/api/knowledge-graph.json`
- `src/lib/mcp`
- `src/lib/learning-graph`
- `src/lib/analytics/contract.test.ts`
- `src/lib/i18n`
- `src/app/workshops`
- `src/app/skills`
- `src/app/__tests__/sitemap.test.ts`

That is 37 files and 544 tests. Other checks:
- `tsc -p tsconfig.typecheck.json`: exit 0.
- eslint: clean on my files (the test files are ignored by the eslint config).
- `bun run content:lint`: no errors in my files. W03 still has the existing DEMO-LABEL-WARN warnings for "Interaktive Demo". Its 27 errors are all in books and course content I do not own.
- `node scripts/skills-mirror-check.mjs`: passes.

## Left for the integrator

1. `tests/e2e/route-workshops-locales.spec.ts:27`: the W03 `materialCount` goes from 3 to 7. W01 stays at 6 and W02 at 2. I did not run e2e.
2. Hub and detail components should switch to the new copy keys:
   - hub: `catalog.hub*`, `routeStations`, `boundary`
   - detail: `detail.primaryAction[role]`, `phaseLabels`, `roleLabels`, `outcomesHeading`, `agendaHeading`, `needsHeading`, `notCoveredHeading`, `provenanceLabels` and the rest
   
   After that, delete the obsolete keys marked in `workshop-copy.ts`. The old hub strings "Selbstlern-Workshops für konkrete Entscheidungen" are left unchanged because `workshops-content.test.tsx` and the e2e headings pin them.
3. `src/lib/mcp/tools/workshops.ts` (`get_workshop`, not mine) does not yet return question, outcomes, agenda, needs or provenance. `/api/workshops.json` does. The skill only references fields that `get_workshop` returns today (it adds `access_note`).
4. JSON-LD in `[slug]/page.tsx`: consider adding `timeRequired` (PT90M from `minutesLive ?? minutesSelfStudy`), `teaches` (outcomes), `competencyRequired` (needs), and `audience`.
5. W03 decision lab: the standard (5.2 #3) wants the warm-up to be the deck's opening vote ("Put this in the board pack? Trust · Challenge · Refuse"). It is unchanged because the e2e test `workshops.spec.ts` pins its labels.
6. W04 must fill every new required field, including one `primary` material, `role`/`phase` on each material, and `sizeLabel` on the zip. It also needs these additions in `workshops.test.ts`:
   - a 4th entry in the `formats` index arrays
   - "04" in the numbers list
7. `scripts/content-prose.mjs` `EXTRA_COPY_MODULE_FILES`: add `src/lib/workshops-data-readiness.ts` (and the W04 module) so the VOICE rules apply to them.
8. `src/lib/content-freshness.ts` `SITE_CONTENT_DATE` bump and the page-inventory regen: not done (not mine).
9. The skill text changed, so the public skills mirror repo needs the same bytes (`--mirror ../skills`).
10. W02 needs no "geprüft am" date: I could not verify the current plan names or the date the prompts were last tested, so nothing was invented. The owner should add them.
