# B2: workshop detail page (Werkzeichnung)

Pages: `/workshops/{ki-prognosen-einschaetzen, geschaeftsberichte-mit-ki-lesen, datenbereitschaft-fuer-ki}`, plus the `/en` mirrors. These are generated re-exports, so no route file was added and there is nothing to regenerate.

## Files changed

- `src/app/workshops/[slug]/workshop-detail-content.tsx`: rewritten, still a Server Component. Sections in order:
  1. Back-link row with a hairline.
  2. Graphit `CoverBand` containing the kicker, the h1 (`text-fluid-h1`), the problem sentence (summary) and a dark `QuestionCard` with the fixed question. Below that:
     - a primary button (paper on graphit) to the `primary` material, labelled by role ("Deck öffnen" or "Labore öffnen");
     - a secondary button to the first demo, lab or case material, or "Material ansehen ↓" (`#material`) when the workshop has none;
     - a caption line: live and self-study minutes, invented case (or invented plus public figures), "Material auf Englisch" when true (DE only), and "kostenlos, ohne Anmeldung";
     - a `dl` for "Du brauchst" (the limiting need, the same rule the hub uses) and "Du gehst mit".
  3. Ablauf: a `SectionHead` whose caption gives the times, then a `Route` in `mode="description"`. Each station has one caption line with the minutes, the activity, and "nur live" or "optional" where they apply. A caption under the Route says where the minutes come from (deck or planned).
  4. The decision lab as a full-width Beton band.
  5. Material, grouped by phase (Vor dem Workshop / Im Workshop / Danach). Each row is its own ledger row with:
     - a pictogram by role;
     - an h4 name, with an ink-square marker plus "Hier starten" on the primary material;
     - the description;
     - a caption for minutes and optional items;
     - a meta chip ("HTML · EN", "ZIP · 1,1 MB", "CSV · 1,6 KB");
     - one stretched `WorkshopMaterialLink` (so analytics still counts opens), with an sr-only name and "Sprache: Englisch".
     - If a presenter view exists, a "Selbst moderieren" caption sits under "Im Workshop".
  6. Der Fall:
     - company, sector and period, the narrative, the fictional note, the open decision;
     - a dashed `Callout variant="gap"` titled "Was die Daten nicht beantworten";
     - a `StatRow` of the metrics, with values stepped down below lg so "21,69 Mio. €" never overflows;
     - the real-world case where one exists: narrative, StatRow, question, and a caption line with the source link ↗ (new tab, sr note), published and reviewed `<time>` and the limitation.
  7. Two columns, Für wen (audience with ink-square bullets plus the `notForYou` caption) and Danach kannst du (outcomes plus "Du gehst mit: …").
  8. Two columns:
     - Das brauchst du: needs, then an h3 "Das brauchst du nicht" with `notNeeded`, then `accessNote` as a boxless shield `Callout variant="boundary"`;
     - Nicht Teil dieses Workshops: `notCovered` as hairline rows.
  9. Provenance footer (`aria-label` "Stand und Herkunft"): one caption line with author, last reviewed, AI answers recorded, live run and data, followed by `provenance.note`.

  Removed: the four `<details>` "Referenz" blocks, orange left rules, mono uppercase labels, lucide icons, the format/duration/steps/materials count row, and the tool-chip step list. The Route replaces the step list.
- `src/app/workshops/[slug]/workshop-decision-lab.tsx`: markup and classes only. State, ordering, validation, focus management, SSR inertness, `aria-busy`, noscript, the `role=status` live region and the `data-workshop-decision-lab` / `data-option-mark` / `data-outcome` hooks are all unchanged. Recipe 6.13:
  - Section: `border-t-2 border-foreground bg-inset`, full-width and in-flow, with an inner `max-w-[75rem]` grid `lg:5fr/7fr`.
  - Header: a sentence-case kicker, an h2, the prompt, facts as a 3-column list with a hairline, and the privacy note as a shield caption.
  - Options: rows without boxes (`border-b border-hairline min-h-12`, `has-[:checked]:bg-card`, 600 weight when selected), each with a square native radio (`appearance-none size-5 border-2 border-foreground`, `checked:border-[6px]`, the Route's "here" shape, and a Mennige focus outline).
  - After a check: pass or fail pictogram plus a word on the marked options. The **only Mennige in the lab** is an `outline-mennige` on the strongest-evidence radio (`data-strongest-mark`), and only after submit.
  - Feedback: under an ink rule, a verdict chip (pass Chip / gap Chip / ink fail chip, always icon plus word), the title and the body.
  - Buttons: submit is the ink button; reset is a text button. The validation alert uses a fail pictogram with no left rule.
  - There is no motion, per the test contract that bans motion classes in the lab; the final state shows at once.
- `src/app/workshops/[slug]/page.tsx`: the JSON-LD `LearningResource` gains `timeRequired` (`PT90M`), `teaches` (outcomes) and `competencyRequired` (needs), as workshop-standard 3.6 asks.
- `src/app/workshops/workshop-copy.ts`, **detail object and its interface only**:
  - Dropped the obsolete keys (steps/format/duration/reference*/whatItCovers/stepsHeading/…, agendaModes, firstQuestion*, materialsHeading, openInBrowser, download).
  - Added `coverFacts`, `needLabel`, `browserOnly`, `liveOnly`, `published`, `reviewed`.
  - `downloadAction` is now a plain string.
  - Removed the now-unused `NUMBER_WORDS` const. It only served `stepsHeading`, and eslint would flag it.
  - DE `syntheticCase` is now "Erfundener Fall", `limitations` is "Was die Daten nicht beantworten", and `realWorldHeading` is "Dieselbe Methode an echten Zahlen" (EN "The same method on real figures").
  - `realExplanation` was shortened (voice rules).
  - `roleLabels` is kept unchanged, because the hub reads it.
- Tests:
  - `workshop-detail-content.test.tsx`: rewritten around the new structure (order cover → agenda → lab → material, no `<details>`, q-card once, sections promoted, cover buttons chosen by role, phase grouping, one "Hier starten", one link per material row, language sr labels, EN has no German interface copy, source guard against orange rules, mono caps, `font-black`, pastel classes, lucide and `<details>`).
  - `workshop-decision-lab.test.tsx`: class pins updated (kicker `text-label text-muted-foreground`, square radio rows, Beton band, pass or fail pictograms, verdict chips, the Mennige mark present only after submit and only on the strongest evidence). Every behaviour, SSR, focus and privacy test is unchanged.
  - `workshop-material-link.test.tsx`: fixtures gain `role`/`phase` (type-correct).
  - `page.locale.test.tsx`: no change needed.
- e2e:
  - `tests/e2e/route-workshops-locales.spec.ts`:
    - W03 `materialCount` 3 → 7, from the registry.
    - It now counts **distinct** material hrefs, because the cover buttons repeat the primary and secondary material hrefs.
    - German tokens updated: "Material zum Mitnehmen" is gone, and "Das brauchst du" and "Nicht Teil dieses Workshops" were added.
  - `tests/e2e/learning-density.spec.ts`: see the decision below.
  - `tests/e2e/workshops.spec.ts`: the W02 journey now also asserts the cover "Deck öffnen" link to `slides.html`, the "Ablauf" Route list, the "Material" h2, and no `<details>` in main. No new `test()` was added, to protect the WebKit shard budget.
  - `tests/e2e/workshop-hydration.spec.ts`: checked and left unchanged. It needs `[data-workshop-decision-lab]`, 6 radios, the loading text, `aria-busy`, the submit → alert → radio → reset focus order, `noscript p` and `a[href$="/guide.html"]`, and all of these still hold.

## Decision: the lab no longer starts in the first viewport (learning-density.spec.ts updated)

I measured on the dev server:

| Viewport | Cover primary button, bottom | Lab top |
|---|---|---|
| 1280×720 | 529–641 px | 922–1034 px |
| 390×664 | 396–489 px | 1263–1429 px |
| 1440×900 | 529–641 px | 922–1034 px |

Blueprint 7.2 and workshop-standard 4.1 put the cover (problem, fixed question, start action, time, needs, what you leave with) and the agenda before the lab. On a 390×664 phone the cover alone fills the viewport. I kept the lab as high as the standard allows: it comes directly after a compact agenda, and the minutes and activity share one caption line.

On phones the q-card follows the buttons visually (CSS `order`; the q-card has no focusable content, so focus order is unchanged). This keeps the start action above the fold, as standard 4.1 asks ("On a phone it drops just below the fold").

The spec now pins:
1. The cover's start action lies fully inside the first viewport.
2. The lab's previous sibling is the agenda section (it contains `ol[data-route-mode]`), and the cover band sits before that.
3. The lab starts within 2.5 viewport heights, which fails if material, the case or any other section moves above it.

W03 is not added to that spec (shard budget).

## Checks

- `bunx vitest run src/app/workshops src/components/course/open-with-your-ai-mounts.test.ts src/lib/workshops src/components/werk src/lib/learning-surface-density-contract.test.ts src/app/api/workshops.json`: 14 files and 179 tests passed. After the final caption tweak I re-ran the workshops and mounts files: 7 files, 63 tests passed.
- eslint is clean on `src/app/workshops/[slug]` and `workshop-copy.ts`. The e2e specs are in eslint's ignore pattern.
- `tsc -p tsconfig.typecheck.json` shows no errors in `src/app/workshops/**`.
- `bun run content:lint` shows no errors or warnings in my files.
- Against the dev server, with Playwright:
  - The route-workshops-locales invariants hold at 320 and 768 px, DE and EN: distinct material links 6/2/7, "Sprache: Englisch" / "Language: English" count equals the material count, no German tokens on EN, EN page links stay under `/en`, no horizontal overflow, one h1.
  - axe WCAG 2.2 AA on `main` found 0 violations for W02 DE, W03 EN and W01 DE at 1280 and 390, including the post-submit feedback state.
- Screenshots are in `scratchpad/impl/B2-workshop-detail/`:
  - `{de,en}-<slug>-{1440,390}.png` (1440×900 full page and 390×844 full page);
  - `lab-wrong-{1440,390}.png` (lab after a wrong answer).

## Not run

The e2e specs themselves (they need a build), Lighthouse, and the full vitest suite.

## For the integrator

- While I worked, the dev server briefly failed on `/kurse` because another agent's `CourseLedgerRow` export was mid-edit. That is not in my area.
- The site nav (acid DE toggle, cobalt LOGIN pill) still has the old look in my screenshots. It belongs to the nav owner.
- `docs/workshop-standard.md` / design-direction mention an "unten ausprobieren" link on the Route station that matches the lab. I did not add it: the `Route` primitive has no per-station link or "here" marker in description mode, and progress mode would announce the wrong state words ("erledigt/aktuell/offen") for an agenda. If wanted, extend `Route` with an optional `href` per station.
- W04: the page needs no change for a fourth workshop. It reads `question`, `outcomes`, `agenda`, `needs`, `notCovered`, `provenance`, and the material `role`/`phase`/`primary`/`sizeLabel`. German materials get a "DE" chip and drop "Material auf Englisch" automatically. If W04 is added to `route-workshops-locales.spec.ts`, use the distinct-count rule. Its "Language: English" count assumes all-English materials, so relax that for German ones.
- `workshop-copy.ts` detail keys that were removed: nothing outside `src/app/workshops/[slug]` read them (grep checked). The hub still reads `detail.roleLabels`, which is unchanged.
