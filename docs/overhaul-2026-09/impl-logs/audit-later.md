# Mobile audit for the later wave (key: audit-later)

Date: 2026-09-26. This was a read-only audit: no repo file was changed. Other agents were editing the header, nav, footer, tab bar, `src/components/course/**`, the course landings, `src/app/demos/**`, `src/components/demos/**` and the W04 `slides.html` + `lib/` while I measured, so re-measure before applying anything (see "Re-run" at the end).

Setup: dev server at `http://localhost:3000`, Playwright with the Chromium at `/opt/pw-browsers/chromium`, `isMobile` + `hasTouch`. First viewports were shot at DPR 3 and 2-screen segments at DPR 1.5. Viewports were 390x844 for every page, plus 320x568 for the static pages and the shell. In-page "screens" means document height divided by viewport height. The chrome that always covers content below `lg` is the top bar (48px) plus the tab bar (57px), 105px in total, which leaves 739px of usable height at 390x844 and 463px at 320x568.

Artifacts (all in `/tmp/claude-0/-home-user-platform/614e303c-f8f0-55ca-be18-13442a9af90b/scratchpad/mobile/audit-later/`):
- `shots/<page>-<w>-v1.png` is the first viewport and `shots/<page>-<w>-segNN.png` are the 2-screen segments. Other shots: `shell-*` (menu, scrolled header, open footer), `demosv-y2150.png` and `drov-y5500.png` (the W03 overflow at 320).
- `metrics-app1.json` (demos, fuehrerschein), `metrics-app2.json` (courses, home shell), `metrics-static1.json` (W04), `metrics-static2.json` (W03, W01). Each file holds heights, the font-size histogram, text under 13px, targets under 24 and 44px, fixed and sticky elements, overflow, rails, the heading map and large boxed blocks.
- Scripts: `audit.mjs` (metrics and screenshots), `at.mjs` (scroll to y, eval JS, shoot), `shell.mjs` (header, menu, footer), `strip.mjs` (static strip), `summ.py` (prints a digest of a metrics file).

Caveats for whoever re-measures:
1. `font-display: optional` (globals.css l.8-37) and this container has no Arial, so a cold first load renders DejaVu. That font is wider and causes odd wraps such as "Entscheidung-en" in `ds-390-v1.png`. Segment shots use a second navigation and show Loehrning Sans. Real iPhones have Arial, so the metric-adjusted fallback applies there. Do not "fix" wraps you only see in cold `v1` shots.
2. Hide the Next dev badge with `nextjs-portal{display:none!important}` before shooting.
3. Full-page segment captures paint the fixed tab bar at its first-viewport y, which is why a tab bar appears mid-image in `*-seg00.png`. This is an artifact of the capture.
4. `/demos` measures 6398px tall because of content-visibility placeholders. After rendering, its true height is 4524px (see D2).

---

## 0. Scoreboard

Heights are in screens. Every page had `scrollWidth == viewport` except the one marked in the overflow column.

| Page | 390 | 320 | First usable viewport (390) | Overflow | Worst problem |
|---|---|---|---|---|---|
| `/demos` | 7.58 as measured, 5.36 true | - | Hero only. The first demo title sits at y=1312 (1.55 screens down) | none | The hero (852px) plus three stacked selects (≈330px) come before any demo. Each ledger row is 227px |
| `/demos/excel` | 4.49 | - | H1, lead and shell header, then 5 sheet rows. The first action button is at y≈990 | none (the sheet table scrolls inside itself, 430 of 338) | The action sits below the fold. The instrument is 1260px tall with boxes nested three deep |
| `/demos/rag-vertragsassistent` | 3.86 | - | An empty "Frag das Beispielarchiv." state and three suggestions | none | Empty start state, 12px suggestion text, and an input at 13px, which makes iOS zoom on focus |
| `/ki-fuehrerschein` | 3.78 | - | H1, lead, CTA (y≈460), facts | none | No tab is active. The facts list takes 230px |
| `/kurse/open-source/data-science` | 8.91 | - | A 46px italic Mennige H1 over 5 lines (244px) and a CTA. The chrome is 153px | none | Still the old visual system. 12 chapter cards at 230px each, chapter nav in two places, and no tab bar on a landing page |
| `/kurse/open-source/claude` | 6.01 | - | H1, lead, 2 CTAs, facts | none | Two workbench boxes (834px + 757px) sit before the syllabus. Stamp shadows and mono caps |
| `/kurse/open-source/claude/kurs/mental-model` | 12.16 | - | The lesson mission, under 96px of top chrome | none | The lesson text starts at y=3017 (3.6 screens down), after a 1235px project studio. Lesson nav appears twice |
| W04 `guide.html` | 28.76 | 49.82 | Strip (150px), kicker, H1, lead | none | Length. The glossary alone is 3178px |
| W04 `demo.html` | 8.33 | 14.78 | Strip, H1, lead, chips | none | Two stacked answer cards (756px). Each trap row is ≈240px at 320 |
| W04 `field-card.html` | 3.61 | 6.08 | Fine | none | A 60px number gutter and the "Deck scene" rows |
| W04 `transfer.html` | 3.07 | 5.20 | Fine | none | Minor only |
| W03 `guide.html` | 12.60 | 21.36 | Fine | none | Glossary ≈3000px and an 18px body (W04 uses 17px) |
| W03 `demo.html` | 9.29 | 13.26 | The strip is 194px even at 390 | **yes at 320: 372px, the page scrolls sideways** | `#again table.pair` is 356px wide in a 288px column |
| W01 `hub.html` | 3.34 | 5.68 | The dark cover fills the whole first screen | none | Cover about 790px. The strip is 194px at 320 |
| Shell | top bar 48, tab bar 57 | same | - | - | No active tab on `/demos*`, `/workshops*` or `/ki-fuehrerschein`. The menu repeats DE/EN and needs internal scrolling at 320. Footer is 434px closed and 854-879px open |

---

## 1. Cross-cutting fixes (do these first)

**X1. iOS zooms in when a form control under 16px gets focus. P1, one-line fixes.**
Measured computed font sizes:
- `/demos` has three `<select>` at 14px.
- The RAG chat input is 13px.
- Lesson textareas and inputs are 14px.

Zoom is unrestricted by design (see experience-system.md), so Safari zooms on every focus and does not zoom back out.
- Global fix in `src/app/globals.css`, inside the base layer, below lg:
  `@media (max-width:63.99rem){ input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), select, textarea { font-size:max(1rem,1em) } }`
- Inline styles beat that rule, so change these directly:
  - `src/components/demos/rag-vertragsassistent-demo.tsx` ≈l.837: input `fontSize: 13` → 16.
  - `src/components/demos/demo-grid.tsx` l.158 `selectClass`: `text-label` → `text-base sm:text-label`.
  - Check the textareas in `src/components/widgets/claude/{prompt-sandbox,prompt-grader,claude-md-builder,rewrite-arena,tokenizer,prompt-library-shaper,socratic-tutor}.tsx` and `src/components/course/lesson-proof-checkpoint.tsx`.
- Acceptance: at 390, every visible text input, select and textarea computes to at least 16px. The check is the `at.mjs` eval used in this audit.

**X2. The lead text is 20px at every width. P1, one token.**
`--text-lead: 1.25rem` (globals.css l.158) gives 5-7 line leads on phones: `/demos` 6 lines, `/ki-fuehrerschein` 6, Claude landing 5, Excel 5.
- Make it `clamp(1.0625rem, 0.9rem + 0.9vw, 1.25rem)`, which is ≈18px at 390 and 17.5px at 320. Keep `--text-lead--line-height: 1.45`.
- Target: every app-page lead is at most 4 lines at 390.
- Globals.css is shared with the home-page wave, so land this after that wave.

**X3. The tab bar has no active tab on large sections. P1.**
`/demos`, `/demos/*`, `/workshops`, `/workshops/*` and `/ki-fuehrerschein` (and the other root-level foundation courses) show all four tabs inactive. This was checked through `data-active` in the SSR HTML.
- In `src/components/mobile-tab-bar-links.tsx`, change `isActiveTab(matchPath, …)` to accept `matchPaths: readonly string[]`.
- Proposed map:
  - kurse: `['/kurse','/ki-fuehrerschein','/eu-ai-act-kurs','/ki-und-gesellschaft','/workshops','/buecher','/ki-check','/ai-native']`
  - werkzeuge: `['/open-source','/demos']`
- This mirrors the menu groups, where "Lernen" maps to Kurse and "Praxis" to Werkzeuge. It is a product call, so confirm Workshops→Kurse and Praxisbeispiele→Werkzeuge with the owner.
- The markup must stay identical between server and client. Only the match list changes, so the cache contract in experience-system.md still holds.
- Acceptance: each of those paths SSR-renders exactly one `data-active="true"`.

**X4. Reader chrome on phones: the nav control appears twice and the tab bar vanishes on a landing page. P1.**
- In lesson pages, the sticky top toolbar `[data-lesson-shell-mobile-toolbar]` (48px, button "Lektionsnavigation öffnen") and the bottom `[data-reader-focus-bar]` (57px, button "Lektionsnavigation") open the same drawer. Together with the site top bar, 153px of an 844px screen (18%) is fixed chrome, and 27% at 568.
  - Fix: below lg, drop the top toolbar in `src/components/course/lesson-shell.tsx`, because the bottom bar already carries the drawer button.
  - Target: 105px of chrome, the same as every other page.
- The Data Science **landing** (`src/app/kurse/open-source/data-science/landing-reader-shell.tsx`) runs in reader focus mode. The tab bar disappears there and "Kapitelnavigation" shows twice (top toolbar, and a bottom Mennige button).
  - A course landing is a marketing page. Experience-system.md says focus mode is for reader shells only, and the Claude landing correctly keeps the tab bar.
  - Fix: render the DS landing without `data-reader="focus"` and without the lesson toolbar.
- The reader-bar CTA (`src/components/learning/reader-focus-bar.tsx` l.70 and l.143) is mono, uppercase and tracked 0.08em ("AUFGABE ÖFFNEN", "1 / 12"). Change it to the sentence-case `text-label` in Loehrning Sans. That breaks the Werkzeichnung label rule, and the label then fits in about 130px instead of 162px.

**X5. Leftover Werkzeichnung breaks visible on phones. P2.**
- Stamp shadows:
  - `src/components/imported-courses/claude/hero-orrery.tsx` l.223 `shadow-[6px_6px_0_…]`.
  - `hero-transform.tsx` l.161, l.225 (`4px_4px`, `3px_3px`).
  - Remove all of them.
- Mono uppercase tracked labels, which should become sentence case with `text-label`: the same two files (l.165, 195, 204, 225, 232, 280, 299), the course project studio labels ("ANGEWANDTES KURSPROJEKT", "PROJEKTWERKSTATT", "LIEFEROBJEKT", "BRIEF, FALL UND GRENZEN"), the "LEKTION 1" labels on the Claude landing (`src/app/kurse/open-source/claude/page.tsx`, the `p.font-mono…uppercase` in the ledger), the quiz "◆ KURZPRÜFUNG" kicker, and the DS landing (`ov-hero-eyebrow`, `ov-kicker`, `ov-course-cta`, `ov-stat .v`).
- `rounded-full` stage buttons in `hero-transform.tsx` l.180 and l.207 → square.
- Side stripes: the quiz frames `div.border-l-[3px].border-brand-orange` (`[data-widget-frame]`, 3 per lesson) and the "Kernaussage" box `claude-lesson-reader.tsx` l.184 `border-l-2 border-brand-orange bg-brand-orange/5`. The design allows exactly one left bar per page, on the q-card.

---

## 2. Shell (header, menu, tab bar, footer)

Measured at 390 and 320. These files are owned by the current shell wave, so apply only what that wave did not already change.

**S1. The menu dialog at 320 needs internal scrolling and repeats controls. P2.**
In `src/components/nav.tsx`, mobile dialog:
- The dialog starts at y=56. Its header row (close X plus a DE/EN switch, which is already visible in the top bar behind it) pushes the first link to y=164 (108px of dialog header).
- At 320x568 the dialog is 506px tall. The last item ("Login") sits at y=728, so the user scrolls inside the dialog, and the dialog also covers the tab bar at 320 but not at 390 (inconsistent).

Changes:
- Below lg, remove the in-dialog DE/EN row.
- Put the close button at the same spot as the hamburger (top-right, 44x44), so the thumb opens and closes in one place.
- Render the "Blog / Open Source / Über mich / GitHub" group as a 2-column grid: 2 rows of 44 instead of 4 rows of 44.
- Drop "Login" below lg, because the Konto tab is one tap away. Otherwise move it into the dialog header row.
- End the dialog at `100dvh - var(--tabbar-band-h)` at every width, so the tab bar never hides.
- Target: at 375x667 the full link list is visible without scrolling inside the dialog, and at 320x568 at most one short scroll.

**S2. The footer is tall. P2.**
`src/components/footer.tsx` measures 434px closed (0.51 screens at 390, 0.76 at 568) and 854/879px open (390/320).

Closed-state changes below lg, which save about 140px:
- `py-10` → `py-6`.
- Drop the "Freie Lernplattform" kicker, or put it on the wordmark line.
- Put the wordmark and GitHub/LinkedIn on one row, with the links as icon-only 44x44 squares that keep their visible-on-focus labels and aria-labels.
- Grid `pb-8` → `pb-4`.
- Merge "© 2026 loehrning.ai · Tim Löhr" and "Datenstand · Aktualisiert" into one caption line.

Open state:
- The "Blog" and "Über mich" group headings repeat their only link ("Blog" → Blog, "Über mich" → Über mich; see `shell-320-footer-open.png`). Drop a group heading when it has a single link.
- Use 40px rows in a 2-column grid.

Targets: closed ≤ 300px at 390 and open ≤ 600px.

**S3. The logo tilts with scroll. P3.**
`src/components/nav.tsx` l.148 `iconRotate = useTransform(scrollY,[0,160],[0,-8])` turns the Mennige square by -8° (see `shell-390-scrolled.png`). On phones this is JS scroll-linked motion, it breaks "square geometry", and experience-system.md says no scroll listener. Fix: apply the rotation only from lg, or remove it.

**S4. The tab bar itself is OK.**
- Labels are 12px (the floor), the icons 20px, each tab 56px tall and 80-98px wide, on a paper background with a Leinen top hairline.
- The active state is only a 2px top rule plus semibold, which is subtle.
- Optional change: make the active label and icon `text-foreground` and the inactive ones `text-muted-foreground` (already the case), and also fill the active icon, or add a 2px ink bar under the label, so the current tab reads at a glance.

---

## 3. `/demos` (hub)

Files:
- `src/app/demos/page.tsx`: hero.
- `src/components/demos/demo-grid.tsx`: filters.
- `src/components/demos/demo-tile.tsx`: rows.
- `src/app/globals.css` l.619: `.demo-gallery-tile`.

Numbers at 390:
- The hero `header[data-demo-atlas-hero]` runs from y=48 to 900 (852px): kicker, a 2-line H1, a 6-line lead, "Was du an jedem Beispiel prüfst" with 3 rows, and 3 stat rows.
- The filter console runs from 918 to ≈1250 (H2 plus 3 × [label + 44px select] in 3 hairline rows).
- The first tile's h3 is at y=1312.
- Tiles are 227px each, 12 in all (2724px).

1. **D1, P1: show demos in the first viewport.** Target: the first tile's h3 top at y ≤ 700 at 390 (at least two rows visible when scrolled one screen).
   - Hero at `max-sm`:
     - Lead: hide the second sentence, or `max-sm:line-clamp-3`. With X2 that is ≤ 3 lines.
     - Hide `[data-demo-scope]` below sm, or collapse it to one caption line "Prüfe: Eingaben · Zwischenschritte · Freigaben".
     - Replace the three stat rows with one `text-caption` line "12 Beispiele · 3 Ausführungsarten · 0 echte Außenaktionen", or hide `StatRow` below sm.
     - `pt-8 pb-10` → `pt-5 pb-6`.
     - Target hero height ≤ 420px.
   - Filters below sm: replace the three labelled rows with one `<details>` "Filter" row (44px, showing the active count), with the three selects inside. Alternatively put the three selects in one row as a 3-column grid without separate labels, each select's first option reading "Reifegrad: alle". Target console height ≤ 104px (H2 plus one 44px control row).
2. **D2, P1: fix the content-visibility placeholder.** `.demo-gallery-tile{contain-intrinsic-size:auto 420px}` suits the desktop card, but a phone row is 227px. The page therefore reports 6398px when the true height is 4524px (1874px of phantom scroll, jumping scrollbar, overshoot on fling). Add `@media (max-width:39.99rem){.demo-gallery-tile{contain-intrinsic-size:auto 228px}}`, and update it once D3 changes the height.
3. **D3, P2: slimmer ledger rows (227 → ≤ 140px).** In `demo-tile.tsx`, below sm:
   - Drop the "Beispiel öffnen →" line (`span.min-h-11`). The whole row is the link, so put a 16px `ArrowGlyph` at the h3's right edge instead (saves 48px).
   - Move `data-demo-tile-meta` ("Synthetisch · Einstieg") into the kicker line (saves ≈30px).
   - `max-sm:py-5` → `max-sm:py-4`.
   - Description: 15px, 2 lines, kept.
   - Target: row ≤ 140px, so the list is ≈1680px instead of 2724px and the page is ≈3.3 screens.

## 4. `/demos/excel` and `/demos/rag-vertragsassistent` (detail)

Shared files:
- `src/components/demos/demo-detail-layout.tsx`.
- `src/components/demos/demo-shell.tsx`: header row l.71, body `p-2`.
- `src/components/demos/excel-demo.tsx`.
- `src/components/demos/rag-vertragsassistent-demo.tsx`.

1. **E1, P1: the Excel action is below the fold.**
   - The instrument `[data-demo-shell]` starts at y=377 and is 1260px tall. It stacks:
     - the shell header "Interaktives Beispiel" + "Synthetisch · Was heißt das?" + a 3-line note (≈190px),
     - the 9-row sheet (≈400px),
     - "Aufgabe an Claude" with 3 task cards (the first button at y≈990),
     - the result panel.
   - Target: the first task button top ≤ 720px at 390.
   - Below sm:
     - Put the shell header on one 44px line (label left, evidence badge right) and move the note behind "Was heißt das?".
     - Order the task list before the sheet (CSS `order`), or show 5 sheet rows plus a "+4 Zeilen" toggle.
   - Also check the table's hidden 4th column: `[data-course-horizontal-scroll]` scrolls 430px inside 338px and cuts off "Umsatz" with no visible edge. Add a right fade mask or reduce the column set on phones.
2. **E2, P2: flatten the boxes nested three deep in Excel.** The shell border holds the sheet border, which holds task cards with borders. The result panel `border-2` holds 3 bordered chips (Region-Bezug / Absicherung / Format). Below sm, make the result chips a hairline `dl` with no box.
3. **E3, P2: 12px data text.** `excel-demo.tsx` has 20 or more inline `fontSize: 12` (cells, formula bar, task meta "→ 12 Sek."). Raise the sheet cells and task meta to 13px below sm. They stay mono, because they are data.
4. **R1, P1: the RAG chat opens on an empty state.**
   - The design rule is "Show the final state first", but the chat shows a centred "Frag das Beispielarchiv." with 4 suggestion buttons (12px, 44px tall, each boxed) inside the chat box inside the shell box.
   - Below sm, pre-render one answered exchange, such as "Wie ist die Kündigungsfrist?" with the cited clause, and put the other suggestions as a horizontal chip rail (≥ 14px text, 44px tall) above the input.
   - Target: the instrument shows a cited answer without any tap and is ≤ 700px tall. It is 727px empty today.
5. **R2, P2: the "Grenzfall" box inside a box.** The edge-case button is 12px mono with 0.04em tracking and wraps to 2 lines at 390. Make it a plain text button in 14px Loehrning Sans on one line ("Grenzfall testen: Wer hat Prokura …").
6. **R3.** Covered by X1: the input at 13px triggers iOS zoom.
7. **E4, P3: the "Weiter" block.** The "Im Kurs · Zur Lektion" Mennige CTA and "Nächstes Praxisbeispiel" (a 12px description) are fine. Raise the description to 14px.

## 5. `/ki-fuehrerschein`

Files: `src/app/ki-fuehrerschein/page.tsx` and the shared header `src/components/course/technical-course-landing.tsx` (l.110-145). This page looks good already. The fixes are about density.

1. **F1, P2: facts list (4 × 57px = 230px) → one or two lines.** In `technical-course-landing.tsx` l.135-139 (`ul[data-course-onboarding-checklist] li.py-2.5`), render below lg a 2x2 grid of short facts with no row hairlines, or one caption line "5 Blöcke · 18 Lektionen · ca. 1 h 40 min · kostenlos · PDF-Bestätigung". Target ≤ 90px. The Claude landing ("Kursdaten") gets the same saving.
2. **F2, P2: the H1 breaks over 3 lines** ("KI im Alltag: / Was du / wissen solltest."). Allow `max-w-none` below sm, or drop the forced break, so the H1 takes 2 lines. Target H1 height ≤ 80px.
3. **F3, P3: dead space around "EU AI Act vertiefen".** The link has about 100px of empty paper above and below it. Tighten to `mt-6`.
4. The missing active tab is handled in X3.

## 6. `/kurse/open-source/data-science` (landing)

Files:
- `src/components/data-science/chapters/de/ch-overview.tsx` and `…/chapters/ch-overview.tsx` (markup).
- `src/components/data-science/ds-v8-scope.css`: `.ov-*` from l.1150, and the override layer l.2860-3115.
- `src/app/kurse/open-source/data-science/landing-reader-shell.tsx`.

This landing never got the Werkzeichnung pass. The override layer only swaps colours and still sets `border-radius:8px`, italic accent spans and mono tracked labels.

1. **DS1, P1:** leave focus mode and remove the double chapter nav (see X4). This gives back the tab bar and 48px.
2. **DS2, P1: the hero.**
   - `.ov-hero-title` is 46px with a line-height of 1.06 over 5 lines (244px). Its italic Mennige `.accent` is a named AI tell.
   - Use the site `text-fluid-h1` (36px), set in ink with no `em`/`.accent` styling.
   - Change the eyebrow to a sentence-case `Kicker` with no leading rule.
   - Make the CTA square (`border-radius:0`).
   - Put the stats "12 Kapitel · 22 Simulationen" on one caption line.
   - Target hero ≤ 520px from the top of content.
3. **DS3, P1: outcomes.** `.ov-outcome` is 6 boxed cards of ≈270px (1640px) with pink geometric glyph icons. Replace with a hairline list of title + one line (≈100px per row) and no icons. Target ≤ 640px.
4. **DS4, P1: curriculum.** `a.ov-course` is 12 rounded cards with pastel left stripes and dots, 216-236px each (3160px). Make them ledger rows at `max-width:640px`: number + title + tag on one line, no blurb, no "KAPITEL ÖFFNEN" line, and a trailing arrow. Target ≤ 88px per row, ≈1060px in total.
5. **DS5, P2: tools.** `.ov-tools` is a 2x6 boxed grid (533px, 12px italic sublabels). Use a two-column hairline list at ≤ 40px per row, or a single comma list. Target ≤ 280px.
6. **DS6, P2:** 58 text nodes are at 12px because of the `font-size:12px !important` block at l.2992ff. Raise non-data labels to 13-14px on phones.
7. Page target: ≤ 5 screens at 390, down from 8.91.

## 7. `/kurse/open-source/claude` (landing)

Files: `src/app/kurse/open-source/claude/page.tsx`, `src/components/imported-courses/claude/hero-orrery.tsx`, and `hero-transform.tsx`.

1. **CL1, P1: the syllabus comes too late.**
   - Two workbenches (`HeroOrrery` 834px, `HeroTransform` 757px) put "Vier Themenbereiche" at y=2662 (3.15 screens down). A "Zum Kursplan" anchor exists, but the page itself has the wrong order for a phone.
   - Below lg, either render only `HeroOrrery` and move `HeroTransform` into lesson 2, or collapse both into one `<details>` "Prompt-Werkbank ausprobieren".
   - Target: the syllabus H2 at y ≤ 1500.
2. **CL2, P1: `HeroTransform` has an empty 260px output box.** It shows "Noch nicht ausgeführt / Führe Stufe 1 aus …" in `hero-transform.tsx` l.243 `min-h-[260px]`. Pre-render stage 1's output ("show the final state") and drop the min-height below sm.
3. **CL3, P2:** the Werkzeichnung breaks listed in X5. In addition:
   - The orrery toggles (`hero-orrery.tsx` l.273-278) use an "on" state of `border-2 border-brand-orange bg-brand-orange/10`, which is a tinted Mennige box repeated five times. Use one hairline row per component with a square ink switch.
   - The score box (`div.min-w-[120px].border…`) holds a mono "STRUKTUR 68 TEILWEISE". Show it as one caption line with a bar.
4. **CL4, P2: ledger rows.** `grid-cols-[4.75rem_…]` spends a 76px column on "LEKTION 1". Use `2rem` and "01", set the title at 15px and the subtitle at 13 → 14px. The rows get about 44px wider and lose one line each.
5. The facts list is the same as F1.

## 8. `/kurse/open-source/claude/kurs/mental-model` (lesson)

Files:
- `src/components/imported-courses/claude/claude-lesson-page.tsx` (l.79-92 render the studio before the reader).
- `src/components/course-projects/course-project-studio.tsx`, `course-workspace-frame.tsx` (l.660-720 toolbar), `retrieval-queue.tsx` and `lesson-mission-control.tsx`.
- `src/components/course/lesson-shell.tsx`.

1. **L1, P1: the lesson text starts at y=3017.**
   - The page stacks the mission (≈850px), then `section#course-project-studio` (1235px), then "Abrufwarteschlange", and only then "Was es ist (und was nicht)".
   - Below lg:
     - Keep the mission.
     - Collapse the studio to one 56px row ("Kursprojekt · Phase 01/05 · Werkstatt öffnen").
     - Render the studio after `LessonReference`, not before.
   - Target: the first lesson H2 at y ≤ 1200.
2. **L2, P1: the workspace toolbar on phones.** "Projektbrief einklappen" / "Bereiche nebeneinander andocken" (disabled on a phone) / "Vollbild öffnen" make 3 stacked 44px buttons (≈160px). Hide the dock button when `!splitFeasible` instead of disabling it (`course-workspace-frame.tsx` ≈l.683). The other two then fit on one row.
3. **L3, P2: the double lesson nav** (see X4). Also the reader-bar CTA "AUFGABE ÖFFNEN" is mono caps.
4. **L4, P2: quizzes.**
   - Each of the 3 quizzes is ≈500px, with a 3px Mennige left stripe, a "◆ KURZPRÜFUNG" kicker and a "Kurzprüfung" H3 (the same word twice), and boxed options.
   - Remove the stripe and the duplicate kicker, and make the options hairline rows with 44px targets.
   - Target ≤ 380px per quiz.
5. **L5, P2: the mission radios are 16x16** (`[data-lesson-prediction-choice] input.h-4.w-4`). The label is the target, so it passes, but make the visible control 20px to match the static pages.
6. **L6, P3: the `label.block.text-[13px]` "Entscheidung oder Änderung…"** is 20px tall. Make it 14px so it reads as a label rather than fine print.
7. Page target: ≤ 9 screens, down from 12.16.

---

## 9. Static workshop materials

Ownership:
- `esg-berichte-mit-ki/lib/` (holding `w04-pages.css` and `workshop-frame.css`) is locked this wave together with `slides.html`. W04 fixes go into the later wave.
- The frame's source of truth is `scripts/workshops/workshop-frame.css`, synced by `node scripts/workshops/sync-frame.mjs`. The drift test is `src/lib/workshops-frame.test.ts`. Never hand-edit a copy.
- The W03 pages (`datenbereitschaft-fuer-ki/guide.html`, `demo.html`) carry **inline** copies of the frame in `<style>`, which already differ, for example the missing brand shrink rule.

### 9.0 Shared strip, which hits every static page (P1)

`header.wf-strip` is 150px at 390 and 194px at 320: the brand (44px), then back links (44px, wrapping to 88px at 320), then the material rail `nav.wf-mats` (46px). At 320 the H1 starts at y=264-291, so half of the first screen is chrome.
- In `scripts/workshops/workshop-frame.css`, `@media (max-width:600px)`:
  - Put the brand and `.wf-back-main` on one row: `.wf-strip{display:grid;grid-template-columns:auto 1fr}`, `.wf-brand img{width:112px}`, `.wf-back{justify-content:flex-end}`.
  - Shorten `.wf-back-alt` ("Workshop-Seite auf Deutsch") to "DE", or move it to the end of the `.wf-mats` rail.
- Targets: strip ≤ 96px at 390 and at 320. The H1 top is then ≤ 170px on every static page.
- W03 `demo.html` and `guide.html`: the brand stays at 164px at 390 and 320 because the inline copy lacks `@media (max-width:600px){.wf-brand img{width:136px}}`. That is why the W03 demo strip is 194px even at 390. Re-sync the inline copies, or link `lib/workshop-frame.css` the way W01 and W04 do.

### 9.1 W04 `guide.html`: 28.8 screens at 390, 49.8 at 320

Styles are in `lib/w04-pages.css`. The body is 17px/1.6, `.g-sec` margins are 56px, and there are 17 `details.reveal` plus 17 `.key`. Section heights at 390 (px), in order:

`774, 1198, 1430, 1104, 762, 1334, 1502, 1714, 1328, 995, 1455, 1479, 898, 518, 467, 982, 3178 (glossary), 728`

1. **G1, P1: the glossary takes 3178px (22 terms).**
   - `.gloss` at ≤640 stacks `dt` over `dd` with hairlines.
   - Below 640, wrap the glossary in `<details class="reveal">` "Glossary (22 terms)", closed by default. Also set the terms run-in (`dt` inline and bold, then `dd` on the same line).
   - Target ≤ 100px closed and ≤ 1800px open.
   - W03 `guide.html` has the same problem (glossary starts at y=7334 of 10637, ≈3000px).
2. **G2, P1: no way back to the contents on a 29-screen page.** `.toc-phone` sits only at the top and is closed. Add a fixed 44x44 "Contents" button at bottom-right (`position:fixed; right:16px; bottom:calc(16px + env(safe-area-inset-bottom))`) that opens the same list. A sticky `.toc-phone` summary, 44px, is an alternative. Show it only after the first `.g-sec`.
3. **G3, P2: phone type.** At ≤ 600px set `.wf-page{font-size:16px;line-height:1.55}`, `.g-sec{margin-top:40px}` and `.key{margin-top:16px}`. Expected about -12% in length. Page target ≤ 20 screens at 390 and ≤ 34 at 320.
4. **G4, P3:** "Reveal the explanation" wraps to 2 lines at 320. At ≤ 360px set `details.reveal>summary{padding:10px 14px}` and hide the `.toggle .show` text, keeping the plus icon.
5. The charts (`.mg`, `.br`) already have phone rules and read well at 390. At 320, `.br-lab` gets 108px and the labels wrap to 3 lines (visible in the waterfall). This is acceptable.

### 9.2 W04 `demo.html`: 8.3 screens at 390, 14.8 at 320

Styles are inline in `demo.html` (the `<style>` from l.12, phone rules at l.361-470).
1. **W4D1, P1: stacked answer lanes, 388 + 368 = 756px.**
   - `.lanes` is 1 column below 700px, with each lane as a boxed 7-row `dl`.
   - Below 700px, render one comparison table (Metric | Raw folder | Ledger, 7 rows × 36px) with a hatched header cell for Raw and an ink header cell for Ledger.
   - At 320, abbreviate labels ("Scope 2 loc.") and set the values at 16px.
   - Target ≤ 360px.
2. **W4D2, P1: trap rows at 320.**
   - `@media (max-width:359px){.trap{grid-template-areas:"name" "sw" "iso" "track"}}` stacks 4 rows of about 240px each, 7 traps in all, so section 2 takes 2472px.
   - Keep `"name sw" "iso track"` at 320. Shrink `.sw` to a 44x44 square toggle whose visible word is hidden below 360 (the aria state stays) and set the grid column to 52px.
   - Target ≤ 120px per trap and ≤ 1300px for the section at 320.
3. **W4D3, P2: the sticky `.meters`** (113px, 13% of 844 and 20% of 568). At 320 "This answer" wraps and "Right answer: −5.1%" takes 3 lines. Below 360, use the short labels ("Answer / Gap / vs 2024"), hide `.meter .sub`, and set the gauge to 4px. Target ≤ 72px.
4. **W4D4, P3:** the sentence buttons `.nbtn` are 23px tall (inline, so exempt from WCAG 2.5.8). On phones add `padding:4px 2px` and `line-height:1.6` so each tap target reaches about 32px.
5. **W4D4b, P3:** the "Is every site covered" table `.cov` has 13 rows × 38px (500px). Use `td{height:28px}` below 700. It is 30px today.

### 9.3 W04 `field-card.html`: 3.6 screens at 390, 6.1 at 320

Styles are in `lib/w04-pages.css`, in the `.sheet`/`.fc` block (l.240-310).
1. **FC1, P2:** the check number takes its own ≈42px gutter column, leaving the text column at ≈246px at 320. At ≤ 640px put the number inline before the H2 ("1 Months, not files") in a single column. The Do/Don't lines then gain about 17% width and lose about one line per check.
2. **FC2, P2:** "Deck scene" (4 rows per check, 7 checks) is a print cross-reference. Hide it below 640 on screen (`@media screen and (max-width:640px)`) and keep it in print. Target ≤ 4 screens at 320.
3. **FC3, P3:** there is about 100px of empty paper before `.wf-foot` (`margin:64px auto 0`). Use `margin-top:32px` at ≤ 600px, a frame-wide change.

### 9.4 W04 `transfer.html`: 3.1 screens at 390, 5.2 at 320

Fine. There are two small fixes:
- `.ex code` is 12.6px (4 nodes). Set `code` to at least 13px.
- The "Worked sentence" and "End with one sentence" boxes (327 + 354px) could drop their border on phones.

### 9.5 W03 `guide.html`: 12.6 screens at 390, 21.4 at 320

Styles are inline.
1. **W3G1, P1:** glossary, the same as G1 (≈3000px).
2. **W3G2, P2:** the body is 18px/1.6 (28.8px lines), while W04 uses 17px and the demo 16px on phones. At ≤ 600px use 16px/1.55. Target ≤ 9.5 screens at 390.
3. **W3G3, P3:** "On this page" is a wrapping inline list of 7 links (≈200px). Make it the same `details.toc-phone` pattern as W04.

### 9.6 W03 `demo.html`: 9.3 screens at 390, 13.3 at 320, horizontal overflow at 320

Styles are inline (the `<style>` at l.11; `.pair` rules at l.209-238 and l.338-346).
1. **W3D1, P0: horizontal page overflow at 320.**
   - `section#again table.pair` is 356px wide in a 288px column, and `documentElement.scrollWidth` is 372. The "Matches" chips are cut off (`shots/drov-y5500.png`).
   - Add a rule at `max-width:380px`:
     - `.pair th,.pair td{padding:6px 4px}`
     - `.pair tbody td.run.r,.pair tbody td.db.l{font-size:16px}`
     - `.pair .chip{font-size:0;gap:0;padding:3px}` with the icon kept, plus a visually hidden text span. This needs the markup change `<span class="sr">Matches</span>`, because `font-size:0` alone would still expose the text.
   - Alternatively, hide `td.db.r` on the `#again` table, where the header chip already says "Values match, 3 of 3".
   - Acceptance: `scrollWidth == 320` at 320x568.
2. **W3D2, P2:** the `.pair` thead reads "Recorded AI run on the approved views" (3 lines), and "Picked mrr_summar/y_monthly" breaks inside the identifier because of `overflow-wrap:anywhere`. Below 700, use the short headers "AI run" / "Database check G01" and drop "Picked …", or give it its own full-width caption row so the identifier stays whole.
3. **W3D3, P2:** the strip, as in 9.0 (194px at 390).
4. **W3D4, P3:** the lead runs 9 lines at 390. Cut it to 4 lines with the recording details in the caption that already follows it.

### 9.7 W01 `hub.html`: 3.3 screens at 390, 5.7 at 320

Styles: `lib/workshop-frame.css` (`.wf-cover` l.192-202) plus the inline `<style>`.
1. **H1, P2:** the cover band `.wf-cover` runs from y≈150 to ≈940 at 390 (790px, the whole first viewport), so "Materials" starts below the fold.
   - At ≤ 600px:
     - `.wf-cover__body{padding:28px 0}`.
     - Lead at 16px, ≤ 4 lines.
     - The two CTAs side by side (`flex:1 1 0`, 14px, 44px tall) or with the second as a text link.
     - The q-card at 16px.
   - Target cover ≤ 560px, so the first material row is visible at 390.
2. **H2, P3:** the globe is almost invisible on the phone cover (`.wf-cover__globe` opacity .6, a faint line mesh behind the CTAs). The design direction hides the globe below md, so either hide it for real or, if the home-page globe work lands, reuse its phone treatment here.
3. **H3, P3:** the material rows use a ≈48px number gutter at 320. Use the frame's `.wf-row` 32px gutter.

---

## 10. Ranked backlog (one list, for scheduling)

| # | Fix | Where | Effort |
|---|---|---|---|
| 1 | W3D1: page overflow at 320 | `datenbereitschaft-fuer-ki/demo.html` `.pair` | S |
| 2 | X1: iOS focus zoom (<16px controls) | globals.css + `demo-grid.tsx` + `rag-…-demo.tsx` | S |
| 3 | X3: active tab for `/demos`, `/workshops`, `/ki-fuehrerschein` | `mobile-tab-bar-links.tsx` | S |
| 4 | D1 + D2 + D3: demos hub first viewport, placeholder, rows | `demos/page.tsx`, `demo-grid.tsx`, `demo-tile.tsx`, globals.css l.619 | M |
| 5 | X4 + L1 + L2: reader chrome and lesson text first | `lesson-shell.tsx`, `claude-lesson-page.tsx`, `course-workspace-frame.tsx`, DS `landing-reader-shell.tsx` | M |
| 6 | 9.0: static strip ≤ 96px | `scripts/workshops/workshop-frame.css` + sync; W03 inline copies | S |
| 7 | G1/W3G1 + G2: glossaries collapsed, phone contents button | `w04-pages.css`, `guide.html` (W04, W03) | S |
| 8 | DS1-DS6: Werkzeichnung pass for the DS landing on phones | `ds-v8-scope.css`, `ch-overview.tsx` | L |
| 9 | CL1 + CL2: Claude landing order and pre-rendered output | `claude/page.tsx`, `hero-transform.tsx` | M |
| 10 | E1 + R1: demo instruments show the action and result first | `demo-shell.tsx`, `excel-demo.tsx`, `rag-…-demo.tsx` | M |
| 11 | X2: lead token | globals.css l.158 | S |
| 12 | W4D1 + W4D2 + W4D3: ESG demo compaction | `esg-berichte-mit-ki/demo.html` inline CSS | M |
| 13 | S1 + S2: menu and footer | `nav.tsx`, `footer.tsx` | M |
| 14 | X5: stamp shadows, mono caps, stripes, round buttons | the files listed in X5 | M |
| 15 | F1: facts one-liner (Führerschein + Claude) | `technical-course-landing.tsx` l.135 | S |
| 16 | G3, W3G2, FC1/FC2, H1: static type and cover density | `w04-pages.css`, W03 inline, `workshop-frame.css` | S |
| 17 | S3: logo tilt only on desktop | `nav.tsx` l.148 | S |

## Re-run

```
cd /home/user/platform/packages/website
node <dir>/audit.mjs '[{"key":"demos","path":"/demos","vps":[[390,844]]}]' seg run1   # metrics-run1.json + shots
python3 <dir>/summ.py <dir>/metrics-run1.json
node <dir>/at.mjs /workshops/datenbereitschaft-fuer-ki/demo.html 320 568 "" x "document.documentElement.scrollWidth"
```

`<dir>` is `/tmp/claude-0/-home-user-platform/614e303c-f8f0-55ca-be18-13442a9af90b/scratchpad/mobile/audit-later`.

For the true height of `/demos`, add `*{content-visibility:visible!important}` before measuring.
