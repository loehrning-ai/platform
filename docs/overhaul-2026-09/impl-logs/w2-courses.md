# w2-courses: mobile pass for course landings and the lesson reader

Date: 2026-09-26. Key: `w2-courses`. Nothing committed.
Scripts, screenshots and metrics are in `scratchpad/mobile/w2-courses/`:
- `before/` and `after/` hold the first viewport (`*-v1.png`, DPR 3) and the full page (`*-full.png`, DPR 1) at 320x568, 390x844 and 1440x900, plus `metrics.json`.
- `contact-v1-320.png` and `contact-v1-390.png` are first-viewport sheets of all seven pages. `contact-1440.png` shows desktop before and after for Claude, Data Science and Führerschein.
- `measure.mjs` records height, H1, CTA, headings, fixed chrome, text under 12/13px, targets under 44px and fields under 16px. `probe.mjs` evaluates JS and takes a shot. `sheet.mjs` tiles a tall PNG into columns. `summ.py` prints a digest.
- The pages are `/ki-fuehrerschein`, `/kurse/open-source/data-science`, `/kurse/open-source/claude`, `/kurse/open-source/claude/kurs/mental-model`, `/kurse/open-source/codex`, `/eu-ai-act-kurs` (the extra native landing) and `/ki-und-gesellschaft` (it shares the header, so it changed too).

## Before / after (page height in screens; H = px)

| Page | 390 before | 390 after | 320 before | 320 after | 1440 | Key position at 390 |
|---|---|---|---|---|---|---|
| /ki-fuehrerschein | 3.36 (2833) | **2.82** (2384) | 5.54 | **4.85** | 2300 → 2300 | CTA 438 → **337**. H1 2 lines (113 → 76px). Facts 230 → ≈70px |
| /kurse/open-source/data-science | 8.45 (7133) | **4.67** (3944) | 13.52 | **7.64** | 4063 → 4063 | H1 244 → 151px, CTA 623 → **379**, curriculum H2 2813 → 1601. Tab bar is back, reader bar and toolbar gone |
| /kurse/open-source/claude | 5.39 (4552) | **3.20** (2699) | 9.05 | **5.57** | 3202 → 3179 | Syllabus H2 2525 → **684** (target ≤ 1500) |
| …/claude/kurs/mental-model | 11.11 (9377) | **9.55** (8064) | 18.24 | **15.74** | 7064 → 7064 | First lesson H2 "Was es ist" 2808 → **1495** (inside two screens, 1688). 1678 at 320 |
| /kurse/open-source/codex | 3.46 (2923) | **3.06** (2580) | 5.80 | **5.33** | 2054 → 2054 | CTA 371 → 338. Syllabus H2 798 → 530 |
| /eu-ai-act-kurs | 4.00 (3380) | **3.47** (2925) | 6.78 | **5.92** | 2630 → 2630 | CTA 429 → 363 |
| /ki-und-gesellschaft | 3.19 (2693) | **2.67** (2254) | 5.27 | **4.56** | 2150 → 2150 | CTA 429 → 337 |

At 320x568 every landing's primary action sits above the tab bar in the first viewport: the CTA top is at 375-444 and the tab bar starts at 511. Every page has `scrollWidth == viewport` at 320 and 390, no text under 12px on phones, and no target under 44px apart from the lesson radio inputs, whose label is the target. The desktop layouts measure the same height except Claude, which lost 23px because its workbench was restyled (see below).

## What changed

### Reader chrome (`src/components/course/lesson-shell.tsx`), for every LessonShell reader
- **One lesson nav on phones (X4, L3).** The sticky `[data-lesson-shell-mobile-toolbar]` below lg is gone. The reader bar already opened the same drawer. Fixed chrome on a lesson is now 105px (48 top bar + 57 bar) instead of 153px. The bar's contents button carries `openNavLabel` (for example "Lektionsnavigation öffnen"), because it is now the only opener. Focus returns to the control that opened the drawer; the fallback action is found by query. Content has `pt-4` below lg in place of the toolbar's gap.
- **`readerFocus` prop (default true).** When it is `false` the shell omits `data-reader="focus"`, the reader bar and every drawer control, and keeps the desktop rail. The Data Science landing (`landing-reader-shell.tsx`) passes `false`, so the tab bar returns there (DS1) and "Kapitelnavigation" no longer shows twice. The landing's own chapter list is the navigation on phones.

### Data Science landing (DS2 to DS6)
- There is a phone layer at the end of `ds-v8-scope.css`: `@media (max-width: 639.98px)`, with every selector scoped to `.ov-landing`. The landing content wrapper in `page.tsx` got that class, so the chapter readers are untouched and nothing changes from sm up.
- Hero:
  - The H1 uses `--text-fluid-h1` (36px), bold ink. The italic Mennige `.accent` and the `<br>` are gone.
  - The eyebrow and kickers are sentence case in sans with no leading rule.
  - The CTA is square and 48px tall.
  - The stats are one caption line: "12 Kapitel · 22 interaktive Simulationen · ~2h vom Anfang bis zum Ende". The separator trails its item, so a wrapped line never starts with "·".
- Section heads carry a 2px ink Kopflinie, and the H2 is `--text-fluid-h2` bold with no italic gradient.
- Outcomes are hairline rows (17px title and 15px line) with no glyph icons and no boxes.
- Curriculum: each of the 12 cards is a ledger row of number, title, one blurb line and a trailing arrow. That is about 88px per row instead of 230px.
  - The tag line and "Kapitel öffnen" are hidden on phones, since the whole row is the link.
  - The arrow is `content: "→" / ""`, so screen readers do not announce it.
- Tools are a two-column hairline list with name and role on one line. The role is 13px upright, not 11.5px italic.
- The closing "Nächstes Kapitel" row is static hairline chrome. It was a sticky blurred bar.
- The 12px `!important` labels are 13-14px on the landing (DS6).
- `ch-overview.tsx` (en and de) got `{" "}` before each heading `<br />`. Without it, hiding the break on phones glued "bedeutet,aus". The accessible name now has the space too.

### Shared landing header (`technical-course-landing.tsx`, `course-landing-sections.tsx`), used by all native and technical landings
- **F1:** below lg the facts are one wrapping caption line ("5 Blöcke, 18 Lektionen · ca. 1 Std. 40 Min. Lernzeit · …") with no row hairlines and a hairline top rule, about 70px instead of 230px. The visible "Auf einen Blick" label is `max-lg:sr-only`; the aside keeps its aria-label. From lg the ruled side column is unchanged.
- The lead is 17px/1.5 below sm (X2 applied locally), with tighter hero rhythm below sm/lg.
- Sections use `mt-8` and body rows `py-3`/`py-4` below sm. The "EU AI Act vertiefen" link is `mt-4` below sm (F3).
- New `TechnicalCourseLessonNumber` and `TECHNICAL_COURSE_LESSON_ROW_COLUMNS` (CL4):
  - On phones the ledger shows "01" in a 2rem column, which gives the title about 44px more width.
  - From sm it shows "Lektion 1" in sentence case in place of the Mennige mono caps.
  - The full label stays in the accessibility tree at every width.
  - The Claude and Codex ledgers use it, and their subtitles are 14px on phones.
- **F2:** in `ki-fuehrerschein/page.tsx` the heading clause is `sm:inline-block`, so the H1 takes two lines at 390.

### Claude landing (`claude/page.tsx`, `hero-orrery.tsx`, `hero-transform.tsx`)
- **CL1:** new `src/components/course/phone-disclosure.tsx`.
  - Below lg the two workbenches (≈1600px) sit behind one 48px row, "Prompt-Werkbank ausprobieren" (`aria-expanded`, +/−).
  - The collapse is plain CSS on server markup (`max-lg:hidden` / `lg:hidden`), so desktop renders open on the first paint and DOM order equals visual order.
  - The row is `js-shell-only`.
  - The design test's `<HeroOrrery …<HeroTransform` order still holds.
- **X5, CL3** (at all widths, as the brief asked):
  - No stamp shadows, and 1px ink frames in place of `border-2`.
  - Sentence-case `text-label` labels, and the run buttons are the site's Mennige primary style.
  - The stage buttons are square (no `rounded-full`), and the bars are square.
  - Each component toggle is a hairline row with a square ink switch, not a tinted Mennige box.
  - Below md the score is one caption line with its bar; from md it is still the side box.
  - The empty output drops its 260px floor below sm (part of CL2). Pre-rendering stage 1's output was not done, because it is a behaviour change.
- The desktop layout is otherwise the same. The page is 23px shorter at 1440 because of the flatter toggle rows (see `contact-1440.png`).

### Lesson page (`mental-model` and every checkpoint lesson)
- **L1:**
  - `course-workspace-frame.tsx` starts below md as its dark header band plus one 44px row, "Projektwerkstatt: <title>" (`aria-expanded`, `js-shell-only`). Brief, layout toolbar and workspace are `max-md:hidden` until that row is pressed.
  - The new `phoneExpanded` prop keeps the frame open once the studio activates the workspace. The studio passes `effectiveActivated`, so the mission's "open workshop" step always lands on visible controls, and the row disappears then.
  - From md (tablet stacking and desktop) nothing changes.
- **L2:** the dock button is `max-md:hidden`. On a phone it was only ever a disabled 44px row. It stays in the DOM and is visible (and disabled) at 768.
- Studio header band: one row on phones, with sentence-case 14px labels and less padding.
- Retrieval queue: 1px frame and sentence-case labels below sm.
- Mission (`lesson-mission-frame.tsx`, `lesson-mission-control.tsx`):
  - On phones the key concepts read as a sentence-case caption run with no Mennige side bar.
  - The choices have an 8px gap and 48px rows.
  - The radios are 20px (L5).
  - The reset row is tighter.
- `LessonReference` has a new `objectiveRepeatedAbove`, which hides the objective below sm. Checkpoint lessons in Claude, Codex, Data Science and the kurs layout pass it, because the mission directly above shows the same text.
- Claude reader head below sm: "Lektion 1 von 12" is sentence case, and the concepts are a caption run instead of boxed chips.
- Form fields at 16px below lg, so iOS does not zoom (X1, the part I own):
  - the lesson proof textarea;
  - the mission recall and scratch textareas;
  - the proof label is 14px (L6).

## Tests
- Updated because they pinned the old geometry:
  - `lesson-shell.test.tsx`: the drawer tests go through the bar's contents button, no toolbar exists, and fallback focus returns to the bar action.
  - `tests/e2e/reader-focus-mode.spec.ts`: no toolbar, one drawer opener, and content under the compact header at 390 and 768.
  - `tests/e2e/course-workspace.spec.ts`: the toolbar block is replaced by the reader-bar and header checks, and `activateStudio` opens the phone row first when it is visible.
- Added:
  - `phone-disclosure.test.tsx`.
  - frame: phone collapse row, `phoneExpanded`, and the dock hidden below md.
  - landing header: facts line and lesson number.
  - DS landing shell stays out of focus mode.
  - DS CSS: the phone layer is scoped to `.ov-landing`, the CTA is square, and there is no italic accent.
- Runs:
  - `bunx vitest run` over course, course-projects, imported-courses, codex, data-science, kurse/open-source, ki-fuehrerschein, eu-ai-act-kurs, ki-und-gesellschaft and ai-native: 125 files and 854 tests pass, re-run after the last edits.
  - eslint on every touched file: clean.
  - tsc (`tsconfig.typecheck.json`): no errors in these files.
- e2e against the dev server (`E2E_REUSE_EXISTING_SERVER=1`, the w2-demos browser symlink, output dir removed afterwards):
  - course-workspace, technical-course-landings and mission-feedback on chromium: 41/41 pass.
  - reader-focus-mode on chromium: 10 pass.
  - route-claude, route-codex, route-data-science and route-ki-fuehrerschein on chromium: 24 pass and 3 flaky.
  - reader-focus-mode and technical-course-landings on mobile-chromium: 27 pass and 1 flaky.
- The flakes are dev-server timing and all passed on retry:
  - Two are a strict-mode "two h1" while the reader's `[&_h1]:hidden` CSS chunk is still loading. The h1 hiding was not changed.
  - One is the Codex certificate redirect.
  - One is a click before hydration on the lesson bar. The chapter reader, which I did not touch, flaked the same way.
  - The config has `failOnFlakyTests: true`, so run these on a built server before merging.

## Left for others / notes
- `globals.css` (not mine): `html:has([data-lesson-shell]) { scroll-padding-top: calc(var(--nav-h-compact) + var(--lesson-toolbar-h) + 1rem) }` now over-reserves 48px below lg, because the toolbar is gone. Change it to `calc(var(--nav-h-compact) + 1rem)` (or drop the rule) and retire `--lesson-toolbar-h`. `focus-mission-target.ts` still lists the toolbar selector harmlessly.
- `src/components/learning/reader-focus-bar.tsx` (not mine): the bar CTA and position ("AUFGABE ÖFFNEN", "1 / 12") are still mono caps with 0.08em tracking (X4 last bullet).
- `src/components/widgets/**` (not mine):
  - The quiz frames still have the 3px Mennige stripe and "◆ KURZPRÜFUNG" + "Kurzprüfung" (L4, ≈500px each).
  - The Claude widget textarea and input are 14px (X1).
  - The Kernaussage box in `claude-lesson-reader.tsx` keeps its side stripe (X5); I left it because it shows at all widths.
- DS landing: the lazy course-cycle drawing reserves 260px at y≈546 and loads only once it reaches mid-viewport. That rule is pinned by `lazy-flowing-pipeline.test.tsx` as a performance contract. The bottom of the first 390 screen is therefore paper until the first scroll. If the owner prefers, load it at `rootMargin: 0px` on the landing.
- Removing the tag line from the DS chapter rows on phones drops a short subtitle that desktop shows. The blurb carries the substance. Revisit this if the "no dropped facts" rule is read strictly.
- The shell geometry tokens (`--nav-h-compact`, `--tabbar-h`, `--tabbar-band-h`, `--nav-h`) were not touched.
