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

---

# Polish pass (design critique), 2026-09-26

## Files changed
- `src/app/kurse/course-ledger-row.tsx`
  - **Fixed tracks (high):** `2rem | 1fr` below sm, `2.75rem | 1fr` from sm, `3.5rem | 1fr | 15rem` at lg, `3.5rem | 1fr | 10rem | 15rem` from xl. At lg the facts and the action share the right-hand cell through a wrapper that is `lg:flex lg:flex-col` and `display: contents` below lg and from xl. Both groups now line up: at 1440 the facts sit at x=854 and the action at x=1038 in every row; at 1024 both sit at x=752, and the promise is 616px wide instead of about 340px.
  - **Access state printed once (high):** from lg it is a third `dt`/`dd` in the facts `dl` ("Zugang"/"Access"). Below lg it is a `data-course-access-label` span inside the level/duration caption, which now comes after the promise. The row action shows only the verb ("Kursübersicht" / "Kurs starten"). `courseAction()` now also returns `verb`, `before` and `after`, so the sr-only text keeps the accessible name identical to the old label ("Hier nicht verfügbar · Kursübersicht: X", "Kurs starten · Lernkonto nötig: X"). The next-step sheet still prints the full label, as the e2e specs require.
  - **Title and path marker:** the row title h4 is 20px (`text-[1.25rem] leading-snug`). "Teil deines Pfads" is sr-only at every width. The number cell is h-11 at all widths.
- `src/app/kurse/learning-atlas.tsx`
  - **Route:** the head is "Dein Pfad · 4 Kurse" / "Your path · 4 courses", with the goal label in an sr-only span. Station links stack the title above the duration and state (`flex-col items-start`), and the Route is capped at `max-w-[34rem]`. The current station now follows `pathNextCourse`, so the path always has an `aria-current="step"` station.
  - **Group heads:** a Kopflinie above (`border-t-2 pt-3 pb-2`), the h3 at 26px, and the ink rule below the head is removed.
  - **Ledger intro:** now states the promise frame once ("Jede Zeile sagt, was du nach dem Kurs kannst. …"). Below it is an aria-hidden legend (`data-path-legend`): ink square plus "Teil deines Pfads".
  - **New ATLAS_COPY keys:** `overview`, `accessTerm`, `pathHeading`, `pathStartUnavailable`.
- `src/app/kurse/page.tsx`
  - **Kosten und Konto:** moved inside the container after the atlas and before the Beton band. Its one link is now "Lernkonto anlegen" → `/konto`; "Über mich" and "KI-Check" are gone.
  - **Workshop band:** the note uses `mt-3` and the grid uses `lg:items-end`.
  - **Hero spacing:** `lg:pt-10`, `lg:pb-16` and atlas `lg:mt-8`. The Mennige "Kurs starten" now ends at y=896 (DE) and y=868 (EN) at 1440×900, where it was at y=961 before.
- `src/lib/courses/course-hub-copy.ts`
  - **Promises:** all 20 are rewritten to open with the action ("Du weißt …", "Eine Schlagzeile … führst du …", "You know …"), with varied openings.
  - **"kostenlos" reduced:** the kicker is "10 Kurse · Deutsch und Englisch" and workshopsNote is "Material ohne Konto." / "No account needed."
  - **Metadata:** the description has no "Karte" or "card" any more.
  - **Other copy:** EN checkLabel is "Find out in five minutes". `accessAction` replaces `aboutMe`/`aiCheck`.
  - **New `numberWord(locale, n)`:** spells out 2 to 12, so the band reads "In jedem der drei Workshops" and works for four.
- **Tests:** `learning-atlas.test.tsx`, `page.test.tsx` and `catalog-copy.test.ts` are updated for the new contracts. New assertions cover:
  - the row verb plus its full accessible name, and the access word in the facts;
  - the cold-start current station and the sheet's explanation line;
  - the path heading name and the legend;
  - the access section's position and its `/konto` link;
  - the promise format (it no longer starts with "Nach dem Kurs"/"After this").

## Decisions and deviations from the critique
- **Issue 3 (openDefault), done differently:** I kept the cold-start override. The e2e specs `mobile-access-disclosure` ("the unchosen atlas default offers a disclosed open course") and `route-kurse-hub` ("primary CTA discloses an open course and reaches its public lesson") pin it as a behaviour contract: a provider-free visitor gets one clickable open task. Removing it would weaken those tests. I fixed the contradiction instead:
  - The Route always marks the path's own next course as current, with the inset square and `aria-current`.
  - The sheet adds a caption under the button: "Dein Pfad beginnt mit KI-Führerschein, der hier nicht verfügbar ist. Diesen Kurs öffnest du ohne Konto."
  - If the owner wants the sheet to stay on the path, drop `openDefault` and rewrite those two e2e tests.
- **Issue 9 (one source line per group) not done:** each course's `sourceHref` points at its own subdirectory (`/tree/<commit>/claude`, `/data-infrastructure`, …). The unit test also pins visible per-row MIT attribution, with the comment "the only place the repository and pinned commit render". Collapsing to one line would lose the per-course links. The rows keep their mono source line.
- **Issue 8 caption:** I did not change `tracks.ts` `spine.eyebrow`, because the homepage reads it too. The legend lives in the atlas instead.
- **Issue 14 (meta description):** `src/app/__tests__/discovery-record-copy.test.ts` pins "Zehn Kurse auf Deutsch und Englisch", "Workshops und Lernbücher" and "Quellstand", and that file is outside my ownership. The DE text is now "Zehn Kurse auf Deutsch und Englisch, alle kostenlos, dazu Workshops und Lernbücher mit Material zum Herunterladen. Jeder Kurs nennt Dauer, Stufe und ob du ein Konto brauchst, die Technikkurse auch ihren Quellstand auf GitHub." If the integrator relaxes that test, "Quellstand" can go.

## Checks
- **vitest:** 167/167 in `src/app/kurse`, `src/lib/courses` and `discovery-record-copy`.
- **eslint:** clean. **tsc:** no errors in my files.
- **e2e against the dev server** (scratch config): route-kurse-hub plus mobile-access-disclosure, 26 passed and 12 skipped by design. The `courses` / `a11y-target-size` / `learning-density` hub tests, including axe: 23 passed.
- **Screenshots:** `impl/B3-kurse-hub/v3-{de,en}-{1440,1024,390}.png` and the crops `c3-*`. There is no horizontal overflow at 390, 1024 or 1440.

## Left for the integrator
- **Visual baseline:** re-record `visual-regression` `courses-desktop.png` after merge.
- **Discovery test:** optionally relax `discovery-record-copy.test.ts`, which pins "Quellstand".
