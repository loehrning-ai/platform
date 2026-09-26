# w2-static-shared: shared workshop strip, W03 guide and demo, W01 hub

Audit sections 9.0, 9.5, 9.6, 9.7. Desktop (1440) is unchanged: every page has the same document height as before, and the W01 field card and take-home, the W03 guide and builder, and all four W04 pages give byte-identical 1440 screenshots. The pages that differ at 1440 (W01 hub, hands-on, case study, W03 demo) have animations; I checked each one by eye.

## Heights (px; screens = height / viewport height)

| Page | 320 before | 320 after | 390 before | 390 after | 1440 |
|---|---|---|---|---|---|
| Strip, every static page | 194 | **88** | 150 (W03 demo 194) | **88** | 102, unchanged |
| W01 hub | 3227 (5.68) | **2822 (4.97)** | 2815 (3.34) | **2474 (2.93)** | 1700, same |
| W01 hub cover | 856 | **569** | 789 | **522** | 547, same |
| W03 guide | 12131 (21.4) | **7924 (13.95)** | 10637 (12.6) | **6865 (8.13)** | 7204, same |
| W03 demo | 8766, sideways scroll 372px | **8533, scrollWidth 320** | 7843 (9.29) | **7610 (9.02)** | 5203, same |
| W03 builder | 61594 | 61488 | 53170 | 53108 | 29299, same |
| W04 guide / demo / fc / transfer | 4729 / 7489 / 2578 / 2489 | 4623 / 7383 / 2472 / 2383 | 4307 / 6637 / 2179 / 2268 | 4245 / 6575 / 2117 / 2206 | same |
| W01 hands-on / case / fc / take-home | 1195 / 14759 / 4833 / 6225 | 1089 / 14671 / 4727 / 6119 | 1188 / 13931 / 4074 / 5082 | 1126 / 13907 / 4012 / 5020 | same |

The H1 now starts at y=139 to 169 on every static page at 320 and 390 (it was 193 to 352). The W01 hub's first material row starts at y≈800 at 390, inside the first screen.

## 9.0 Shared strip (scripts/workshops/workshop-frame.css, synced to all three lib copies)
- At 600px and below the strip is a grid. Row 1 holds the brand (112px) and the back link, right-aligned. Row 2 holds the material tabs as one scroll rail (44px). Top padding is 0, so the strip is 88px.
- The language link (`.wf-back-alt`) shows only its code on phones: "DE", or "EN" after the strip script swaps the links. CSS draws it with `content: attr(hreflang) / ""` and hides the link text with font-size 0. The accessible name is still "Workshop-Seite auf Deutsch" / "Workshop page in English", and the target is 44x44.
- At 374px and below the brand shows only the mark: the same lockup image, cropped with object-fit to 30x30, inside a 44px link. That leaves room for "← Zurück zum Workshop" + "EN" at 320 (checked in DE mode: back link 88 to 256, EN 260 to 304).
- Markup is unchanged, so the W04 pages pick this up with no edits to their HTML.
- `sync-frame.mjs` and the drift test now include `esg-berichte-mit-ki`. Its copy was already byte-identical but was not listed. The test's link regex also accepts the W04 `<link ...>` form without the self-closing slash.
- The W03 inline copies (guide, demo, builder in scripts/course03) got the same phone block. The demo copy had no brand shrink at all before this.

## 9.6 W03 demo (scripts/course03/demo/demo.html, then refresh-published)
- W3D1 (P0) fixed. The overflow at 320 is gone and `#again table.pair` measures 288px.
  - Below 700px, the per-row "Matches" chip shows only its check icon. The word sits in `<span class="chip__t">`, visually hidden, so screen readers still hear it.
  - The header chip "Values match, 3 of 3" can wrap.
  - "Picked mrr_summary_monthly" gets its own line, and the identifier no longer breaks inside the word.
  - At 380px and below the cells use 6px/4px padding and 16px values.
- The lead is 16px on phones, and its last sentence ("This page replays both runs …") is hidden there, because the provenance caption right below already says it. At 390 it is 6 lines instead of 8. The caption is 13px.
- `.deny pre.code` (the one-line forbidden query) wraps instead of scrolling. That fixes axe `scrollable-region-focusable` at 320 and 390.

## 9.5 W03 guide (scripts/course03/guide.html)
- The glossary is `<details class="gloss" id="gloss" open>` with the summary "All 22 terms".
  - From 601px, CSS hides the summary and removes the box, so the desktop looks the same as before.
  - A small script closes it on phones. It reopens for `#glossary` (on load, from a contents link, or on hashchange), before printing, and when the screen gets wider.
  - Without JS the glossary stays open.
- Phones (600px and below):
  - The body text is 17px/1.55.
  - Section and paragraph spacing is tighter.
  - "On this page" is a single-line scroll rail with a right-edge fade, instead of a 7-link wrapping list.

## 9.7 W01 hub (public/workshops/ki-prognosen-einschaetzen/hub.html, inline style)
- At 600px and below:
  - The globe is hidden.
  - Cover padding is 24/28px and the H1 is 34px.
  - The lead is 16px and shows its first sentence only. The second sentence is in `span.hub-lead-more`, and the "Three practice companies" section repeats it.
  - The two CTAs sit side by side, 44px or taller.
  - The meta line is 14px, and the q-card is smaller with 16px text.
- The case study had text under 12px: `pre code` at 11.7px, now `font-size: inherit` (13px), and the leakage-guard SVG label at 11px, now 12px.

## Tests
- tests/e2e/workshop-demo.spec.ts:
  - Adds a 320x568 run: no horizontal overflow, all numbers present, the vote works.
  - At 600px and below it asserts a strip of 96px or less, with the German link still reachable by its full name.
- src/lib/workshops-frame.test.ts:
  - W04 is covered by the drift and "Werkzeichnung look" tests.
  - A new test pins the phone strip: grid row, full-width rail, 44px language link and rail targets, and the 374px mark-only rule.

## Checks run
- node scripts/course03/refresh-published.mjs --check: up to date. The published guide/demo/builder.html and bundle-manifest.json were rewritten by it.
- node scripts/course03/overrides.mjs check: ok. node scripts/course03/demo/sync-values.mjs --check: ok.
- node scripts/workshops/sync-frame.mjs --check: ok.
- node --test scripts/__tests__/course03-publication.test.mjs: 7/7.
- bunx vitest run src/lib/workshops-data-readiness.test.ts src/lib/workshops-frame.test.ts src/lib/workshops-esg-reporting.test.ts: 25/25.
- Playwright tests/e2e/workshop-demo.spec.ts: 5/5, including the new 320 case and axe at 1440.
  - Run against the dev server with a scratch config (w2-static-shared/pw.config.mjs), because the repo config wants a headless-shell build that is not installed here.
- Ad-hoc axe (wcag2a/aa, 21aa, 22aa) at 320 and 390 on the W03 demo, guide and builder, the W01 hub and hands-on, and the W04 guide and demo: no violations.
- Behaviour (behave.mjs):
  - The glossary is closed on load on phones.
  - It opens from the contents link, from a `#glossary` load, and from a summary tap.
  - The DE-mode strip at 320 fits on one row.
- ESLint ignores both test files (ignore pattern). tsc shows no errors in my files.

## Left for others
- W01 case study: the feature-calendar SVG (`#calendarChart`) is cramped at 320. Its labels overlap ("promo" over "Macedonia holiday", week ticks run together, "forecast tim" is clipped). This was already the case before this change; the page is 25.8 screens at 320.
- W03 builder is 63 screens at 390 and 108 at 320. Only the strip was changed there.
- W03 demo lead is 6 lines at 390. Getting to 4 needs a copy edit.

Artifacts: shots/before-*, shots/after-* (v1 at 320/390/1440; full page at 320/390 where the page is under about 10k px), demo390-seg*, guide390-seg*, metrics-before.json, metrics-after.json, measure.mjs, probe.mjs, seg.mjs, behave.mjs, axe.mjs.
