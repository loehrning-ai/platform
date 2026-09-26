# w2-static-shared-polish: fixes from the w2-static-shared critique

I applied every high and medium item from the critique, plus all of its low items. Desktop (1440) keeps the same document height on all nine measured pages. The W03 guide, W01 field card, W01 take-home and W04 guide give byte-identical 1440 screenshots. The W03 demo differs at 1440 in two copy edits only: the kicker now says "10 min", and the vote note is shorter. The builder differs because its rail now marks "02 Learner guide" as the parent page.

## Heights (screens = page height / viewport height)

| Page | 320 before | 320 after | 390 before | 390 after | 1440 |
|---|---|---|---|---|---|
| W03 guide | 7924 (13.95) | 7675 (13.51) | 6865 (8.13) | 6696 (7.93) | 7204, same |
| W03 demo | 8533 (15.02) | 8043 (14.16) | 7610 (9.02) | 7330 (8.68) | 5203, same |
| W03 builder | 61488 | 61125 | 53108 | 52834 | 29299, same |
| W01 hub | 2822 (4.97) | 2399 (4.22) | 2474 (2.93) | 2167 (2.57) | 1700, same |
| W01 hub cover | 569 | **455** | 522 | **431** | 547, same |
| W01 case study | 14671 (25.8) | 14402 (25.4) | 13907 | 13645 | 8829, same |

First screen:
- **W03 demo:** the question card starts at y=577 at 390 and ends at 682, so it is fully visible. At 320 it starts at y=566.
- **W01 case study:** the H1 starts at y=165 at 320, and the first lead line is at 312.
- **W03 builder:** the H1 starts at y=164, and the lead is 5 lines at 390.

No page scrolls sideways at 320 or 390, and no text is below 12px.

## Shared material rail (high)
- The frame source `scripts/workshops/workshop-frame.css` (synced to all 3 lib copies) and the W03 inline copies (guide, demo, builder) all changed the same way:
  - The edge fade is now 32px (was 48).
  - The strip script offset is now 48 (was 16).
  - `scroll-padding-inline` is now 48px (was 16). This was the real cause of the old 16px position: `scroll-snap-type: x proximity` snapped the current tab back to 16px after the script had scrolled it.
- The script offset changed on 9 pages and one script file: W01 hub, hands-on, case study, field card and take-home; W03 guide, demo and builder; and `esg-berichte-mit-ki/lib/w04-pages.js`. The last one is a one-line edit on W04, so another agent's file: the W04 pages share the frame CSS, and the offset has to match the new fade. The current tab now sits at x=48 inside the rail (or further right at the end of the scroll) on every W01 and W04 page.
- **W03 short names on phones:** "01 Course · 02 Guide · 03 Demo". Each tab holds `<span class="wf-long">` and `<span class="wf-short">`, and the hidden one uses display:none, so the accessible name follows what is shown.
  - The frame has the same optional classes.
  - At 600px and below, W03 uses 10px tab padding and none on the last tab. The rail fits at 320 with no scroll (288 of 288).
- **Builder:** "02 Learner guide" has `aria-current="true"` and the current-tab style, as the parent page.

## W03 demo (scripts/course03/demo/demo.html, then refresh-published)
- **Top of page (high):**
  - Kicker: "· 10 min".
  - Phones get a short lead (`.lede--short`, 4 lines at 390): "An AI answered one question about FOLDLINE, a made-up company, twice: first from seven raw export tables, then from five approved views behind a login that reads nothing else." The numbers stay `data-v` values.
  - Phones get a one-line caption: "Replayed runs. No live AI or database calls." The dates stay in the closing note.
  - Desktop keeps the long lead and caption.
- **Route bar (699px and below):**
  - One row of six 44x44 stations holding 30px numbered squares, with the dashed and solid connectors kept.
  - The current step is an ink square with a ring; past steps are filled.
  - The step names and minutes are hidden on phones. Each link has an `aria-label` such as "Wrong answer, 2 min", which contains the visible desktop text.
- **At 380px and below:** H1 32px, lead 15px/1.45, and smaller head, beat and route gaps.
- **Checklist:** the text of each flex `<li>` is one `<span>`, so the inline code no longer becomes its own column. I probed the page for other flex/grid boxes that hold loose text plus inline code, and fixed the "Picked monthly_revenue" row and the scripted lane headings ("Export tables, login …") the same way.
- **#again header chip:** at 699px and below it shows the icon and "3 of 3" on one line. "Values match, " is visually hidden (`.chip__t`).
- **Vote form:** 274px at 390 (was 367).
  - No fill; ink hairlines above and below.
  - The kicker and question come first, then the options as 44px rows.
  - The privacy note moved under the options at 13px, and its copy is now "Your choice stays in this tab. Nothing is sent."
  - The live-region status stays in the accessibility tree (it is never display:none).
- The footer gap on phones went into its own 600px block after the page's own `.wf-foot` rule. The rule inside the strip block would have lost to it.

## W03 guide (scripts/course03/guide.html)
- **Callouts:** at 600px and below, only the Verdict keeps the grey fill (`.note--verdict`). The two short callouts are plain paragraphs that now open with a bold sentence.
- **"For data teams" block:** no box, one hairline on top. The button is a 44px underlined text link, "Builder guide for data teams →"; the arrow is CSS content with empty alt text. Desktop shows the same new link text as a button. The block is 172px at 390 (was 229).
- **Glossary summary:** no box, a hairline above and below, 44px tall.
- **Footer:** margin-top is 32px on phones, so main ends 33px above the footer (was about 124).

## W03 builder (scripts/course03/builder/page/builder.html)
- At 760px and below:
  - `.hero__back` is hidden.
  - Hero padding-top is 16px, the H1 32px, and the lead 17px/1.5. Its first sentence and "· English" in the kicker are hidden.
- The sticky part and depth tabs are 44px tall. The two rows now touch, so the sticky bar is 92px (was 86).

## W01 hub (hub.html inline style)
- **CTAs:** "Hands-on lab" / "Business case" on phones (two-span pattern). Both are nowrap and 44px on one line.
- **q-card:** no border, background or padding box; only a 3px Mennige bar and 14px indent. Its kicker is visually hidden, so the figure keeps its caption for screen readers.
- **Meta line:** "About 90 minutes · runs in your browser" on phones, one line.
- **Cover:** padding 20/24.
- **Outcomes:** 32px gutter, 16px/1.5, 12px padding, 73px each at 390.
- **"Three practice companies" table:** stacked on phones. The thead is visually hidden, the company is bold on its own line, and there is no second rule under the Kopflinie.
- **Material rows:** 12px padding and a 15px description. Tighter section gaps.

## W01 case study (case-study/index.html)
- At 600px and below:
  - The three pre-lines and the "System" eyebrow become one kicker: "Workshop 01 · Business case · practice company, invented figures".
  - The H1 is 32px/1.05 with 12px gaps.
- The "New device launch | Practice market" separator is now "·" at every width.

## W01 hands-on chart (lib/hands-on-acts.js, lib/forecast-lab.js, hands-on.html)
- The title is "Parcel network · ZIP capacity shadow replay" and may wrap below 400px, with no ellipsis.
- When the canvas is under 400 CSS px wide:
  - The in-plot "promo" / "shock" labels are replaced by a 13px key under the chart ("promo day, on the calendar", "shock, not on the calendar"), toggled by the script.
  - The x ticks are just "wk -12" and "today".
  - A resize across that width redraws the chart.
- The marker label ("replay starts") now flips left when it has no room on the right. When neither side fits, it ends at the plot's right edge. This logic is in the shared chart code, so it applies to every chart.

## Tests
- `src/lib/workshops-frame.test.ts`: a new test pins:
  - the 32px fade and 48px scroll padding;
  - the rail script offset of exactly 48 on all W01 pages, the three published W03 pages and `w04-pages.js`;
  - the phone short-name rule;
  - the 32px footer gap.
- `tests/e2e/workshop-demo.spec.ts`: at 600px and below it now asserts:
  - the W03 rail does not scroll and reads "01 Course 02 Guide 03 Demo";
  - the route has 6 stations on one row, each at least 44x44, with "Wrong answer, 2 min" as an accessible name;
  - the question card starts inside the first screen, and is fully visible at 390.

## Checks run
- `node scripts/course03/refresh-published.mjs`: rewrote the published guide, demo and builder HTML and `bundle-manifest.json`. `--check` then reports the published workshop is up to date.
- `overrides.mjs check`, `sync-values.mjs --check` and `sync-frame.mjs --check`: all ok.
- `node --test scripts/__tests__/course03-publication.test.mjs`: 7/7.
- `bunx vitest run src/lib/workshops-frame.test.ts src/lib/workshops-data-readiness.test.ts src/lib/workshops-esg-reporting.test.ts`: 26/26.
- Playwright `workshop-demo.spec.ts`: 5/5 (1440, 390, 320, axe, reduced motion). It ran on the scratch config `w2-static-shared-polish/pw.config.mjs`.
- Ad-hoc axe (wcag2a/aa, 21aa, 22aa) at 320, 390 and 1440 on the W03 demo, guide and builder, all five W01 pages, and the W04 guide and demo: no violations.
  - One run of the case study at 390 flagged 7 contrast nodes. They came from the page's scroll-reveal fade, which was still running when axe checked. A rerun after 1.5s shows no violations.
- ESLint ignores both test files (ignore pattern). tsc shows no errors in my files.

## Still open
- Hub height: 2.57 screens at 390 and 4.22 at 320. The targets were 2.4 and 4.0. The rest is content: four material rows with 2 to 3 line descriptions, and a 150px footer.
- In German mode the rail labels still show in English. The W03 short names make this less visible, but a real fix needs German labels in the markup (data-de) or in the strip script.
- W04 rail labels (for example "02 Interactive demo" and "05 Learner guide") could use the new `wf-long`/`wf-short` classes. That is W04 markup, which another agent owns.
- The case study's `#calendarChart` overlap at 320 is still open, as the earlier change log noted.

Artifacts are in this folder:
- `shots/*-before.png` and `shots/*-after.png` (320/390/1440, EN; 320 DE for the demo, hub and case study).
- Element shots: `demo-vote-390`, `demo-pairhead-320`, `demo-look-320`, `guide-build-390`, `guide-gloss-390`, `builder-strip-320`, `hub-body-390`, `hub-lens-390`, `hands-card-{320,390,1440}`.
- `metrics-before-en.json`, `metrics-after-en.json`, `metrics-after-de.json`.
- Scripts: `run.mjs`, `probe.mjs`, `el.mjs`, `flexprobe.mjs`, `hands.mjs`, `axe.mjs`, `axe1.mjs`.
