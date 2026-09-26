# B3 kurse hub: change log

Pages: `/kurse` and `/en/kurse` (the EN route re-exports the page, so no EN file was touched).

## Files changed
- `src/app/kurse/page.tsx`
  - **Paper hero:** Kicker "10 Kurse · kostenlos · Deutsch und Englisch" (the count comes from `ALL_COURSE_CATALOG`), an ink-only H1 "Kostenlose KI-Kurse für den Arbeitsalltag.", one lead sentence, and the KI-Check as a text link.
  - **Workshop band:** a new in-flow Beton band (`bg-inset`, full width, no negative margins, `data-kurse-workshops`). Heading "Lieber an einem Fall arbeiten?", a sentence that uses the workshop count from `getWorkshops(locale).length` (so it works for 3 or 4 workshops), the caption "Material kostenlos und ohne Konto.", and a secondary outline button "Workshops ansehen".
  - **"Kosten und Konto":** the old `<details>` "§ Warum kostenlos" box became a plain SectionHead section with two text links.
- `src/app/kurse/learning-atlas.tsx`
  - **Head and goals:** Kopflinie head "Womit fängst du an?"; the intro is sr-only below sm so the first phone viewport has room.
  - **Goal tabs:** square and joined on a single hairline grid (2×2 below lg, 1×4 from lg). The selected tab is an ink fill (`bg-foreground text-background`), with no kupfer-mist.
  - **Path:** a vertical Route (square stations on a 2px line: past solid, current with an inset square, future outlined behind a dashed line). Each station link includes its duration and state word, and keeps `aria-current="step"`.
  - **Next step:** a flat sheet (`bg-card border-hairline`) with no offset stack and no mist. It shows the promise line, the duration, and the page's single Mennige button. The open alternative is a text link.
  - **Ledger:** "Alle Kurse" has a Kopflinie head. The level chips use `FILTER_CHIP_CLASS`, and the sticky bar no longer uses `-mx`. Group heads are an h3 plus a caption over a 1px ink rule.
  - **Other:** lucide, `cn` and the old workshop lead paragraph are removed.
  - **ATLAS_COPY:** rewritten. "Kurs starten" / "Weiterlernen" / "Abschluss ansehen" replace "Nachweis …", and "Empfohlen als Nächstes" and "Teil deines Pfads" are new. The `proofs` map is replaced by `COURSE_PROMISES`. The strings pinned by other specs are unchanged ("Offener Einstieg ohne Lernkonto", "Hier nicht verfügbar · Kursübersicht", "Offene Alternative ohne Lernkonto", "Lernkonto nötig", "Lernziel auswählen", "Alle Kurse").
- `src/app/kurse/course-ledger-row.tsx`
  - **Removed:** `ROW_TONES`, `PLATE_TONES`, the orange left rule, the boxed number badge and the input-looking duration box.
  - **New row (6.6):** the number (aria-hidden) with an ink square marker for path courses, the title (h4), the promise ("Nach dem Kurs …"), the access note, and the demo and source links (source stays mono). A pass pictogram plus "Abgeschlossen" appears when certified. From lg there is a duration and level `dl` column, and the action is a text link (`BUTTON_CLASSES.paper.text`) visible at every width.
- `src/lib/courses/course-hub-copy.ts`
  - New keys: `kicker(count)`, `heading`, the workshop band strings, and `accessHeading` "Kosten und Konto" with a body that says why the account exists. `headingLead`, `headingAccent` and `accessKicker` are removed; nothing else used them.
  - New `COURSE_PROMISES` (DE/EN, all 10 courses, taken from map-course-surfaces section 6) and `coursePromise()`.
- `src/lib/courses/goals.ts`: goal labels and summaries are down to earth ("Ich nutze KI im Job", "Ich bewerte KI-Risiken", "Ich baue mit KI", "Ich arbeite mit Daten", plus EN). The ids and slugs are unchanged.
- `src/lib/courses/tracks.ts`: the deeper caption "offener Quellstand" is now "Quellcode auf GitHub" (plus EN).
- `src/lib/courses/catalog.ts` / `catalog-copy.ts`
  - **Descriptions:** the audit-copy rewrites 29-34 are applied in DE and EN (KF, KuG, EU, Claude, DI, DEF, DS, Operator). The DEF tagline no longer says "belastbare". The EN KF description keeps the phrase "how generative AI answers, where it fails", which `api/knowledge-graph.json/route.test.ts` pins.
  - **Time fix:** AI-Native "ca. 12 Std." becomes "ca. 5 Std. Lektionen, 12 Std. mit Übungen" (EN "about 5 hrs of lessons, 12 hrs with exercises"). `content/ai-native/modules.json` sums to 303 min of lessons, and the course's own `content.ts` says about 12 h for lessons plus exercises. `durationMinutes` (720) and `PT12H` stay, because 12 h is the total workload.
  - **Left as they are:** no other durations changed, because the map does not prove them wrong; it only suggests that DEF and DS reading times understate the work.

## Tests updated
- **`learning-atlas.test.tsx`:**
  - New labels and CTA names.
  - The next-step sheet is now asserted flat: no stack, no mist or translate/shadow, and its action is `bg-mennige`.
  - The Route station states are asserted.
  - The certified row shows "Abgeschlossen" and the station is solid.
  - The row action is a text link, and rows have no `bg-brand-`/`border-l-`.
  - The joined-tab geometry, including `lg:-ml-px`, and the ink fill on the selected tab are asserted.
  - The duration is plain text in the `[data-course-meta]` column.
  - The path marker is an ink square.
  - The plate and tinted-rail tests are replaced with the equivalent new contracts. The 44px and accessible-name checks are kept.
- **`page.test.tsx`:** the new H1 is checked, along with the workshop band (link plus registry count), "Kosten und Konto", no `<details>`, one H1, and the EN heading and link.
- **`catalog-copy.test.ts`:** the PDF sentence now follows the new wording. New checks: the account reason is present, every course has a promise in both locales, and there are no en or em dashes.
- **e2e `route-kurse-hub.spec.ts`:** new H1, goal labels and "Kurs starten"; also checks that the workshop band link is there.
- **e2e `courses.spec.ts`:** the H1 text.

## Checks run
- **vitest:** 167/167 in `src/app/kurse`, `src/lib/courses` and the discovery test. 997/997 in 67 related test files elsewhere (the catalog/goals consumers), after the KF EN phrase fix. 886/886 in the `src/lib` contract and density suites plus `globals-css`.
- **eslint:** clean on my files (the test and e2e files are eslint-ignored by config).
- **tsc:** no errors in my files.
- **content:lint:** no findings in my files.
- **e2e against the dev server** (scratch config that points at `/opt/pw-browsers/chromium`; the repo config expects headless_shell-1228, which is not installed):
  - `route-kurse-hub.spec.ts`: 14/14 on chromium and mobile-chromium.
  - The `courses.spec.ts` hub tests, including axe: pass.
  - The `a11y-target-size` atlas targets and the `learning-density` "course gallery starts in the first viewport" check: pass.
  - `mobile-access-disclosure.spec.ts`: 12/12 on a re-run. The first run failed twice on a `toHaveURL` wait after tapping into the Claude lesson, which is dev-server compile latency.
- **Screenshots:** `impl/B3-kurse-hub/*-v2.png` at 1440 full and 390 viewport/full, DE and EN. There is no horizontal overflow at 390.

## Left for the integrator
- **Visual baseline not re-recorded:** `tests/e2e/__screenshots__/visual-regression.spec.ts/courses-desktop.png`. Nav and footer are mid-edit by other agents, so a baseline taken now would capture their half-done state. Re-record it after merge: `bunx playwright test visual-regression.spec.ts -g courses --update-snapshots`.
- **"Warum kostenlos":** the heading is now "Kosten und Konto" and the body says why an account is needed. No source in the repo says *why the courses are free*, so I did not invent a reason. The owner could add one sentence (for example, how the site is funded).
- **`COURSE_GALLERY_COPY.workshopLead`** is now unused on /kurse. The key is kept; remove it if no other surface needs it.
- **Not touched (outside this hub):**
  - catalog `eyebrow` "Schritt 05 …" and the audience lines;
  - DS "Data Scientists, ML Engineers", Operator "Fach- und Führungskräfte" and DI "IC5+";
  - the "Claude Course" DE title;
  - `/konto`, which reads the same catalog descriptions and will show the new wording.
- The `/ai-native` landing still says "12 Stunden" (lessons plus exercises). That agrees with the new hub label.
