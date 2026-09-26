# w2-w04-static-polish: W04 static materials, critique pass

Pages: /workshops/esg-berichte-mit-ki/{guide,demo,field-card,transfer}.html. I re-measured before editing, and the numbers matched the critique exactly.

## Heights (screens = height / viewport; these pages have no site tab bar)

| Page | 390 before | 390 after | 320 before | 320 after | 1440 |
|---|---|---|---|---|---|
| guide | 5.03 | **4.91** | 8.14 | **7.61** | 16751 -> 16906px: two new key points; nothing else changed |
| demo | 7.79 | **7.38** | 13.00 | **12.28** | 6340px, pixel-identical |
| field card | 2.51 | **2.49** | 4.35 | **4.23** | 1350px, same height; 140 anti-alias pixels differ in the kicker |
| transfer | 2.61 | **2.37** | 4.20 | **3.95** | 1761px, same height; 62 anti-alias pixels differ in the kicker |

First-viewport targets:
- Guide at 390: the key point of section 1 now sits at y=721 to 791, inside the 844 fold (it was at 892).
- Guide at 320: section 1 starts at y=481 (was 874), and its kicker and the first two lines of its heading fit in the 568 fold.
- Demo: the first switch is at y=1768 at 390 (was 2101) and y=2009 at 320 (was 2391). The target of y≤1600 at 390 is **not met**. The rest of the distance is section 1 itself: the comparison table (347px), the provenance note (94px), the gap sentence (93px), and a 44px toggle. I did not remove any of those.

Checks at 320 and 390: nothing scrolls sideways, and no visible text is under 12px. The only small targets left are frame elements (wf-skip, wf-mats), which this pass does not own. `.nbtn` reports 28px, but its ::after pseudo-element makes the tap area about 48px.

## Guide (pages/guide.template.html, lib/w04-pages.css, lib/w04-pages.js)
- Head on phones:
  - The 2x2 material buttons are hidden (`.pg-head .actions{display:none}`). The strip rail already links those pages.
  - The kicker's context part is wrapped in `<span class="k-ctx">` and hidden on phones, and `<span class="k-ph">To read</span>` shows instead. Phones read "To read after the session · about 25 minutes"; wide screens read the same text as before.
  - The contents box and a shorter "Open all" / "Close all" button sit on one row inside `.g-tools`. The button carries visually hidden " sections". The contents box is 44px and drops " · 18 sections" on phones. An open contents list takes the full row.
- At 360px and below:
  - The contents box and the reveal toggles drop their Show/Hide word.
  - The lead is hidden. The "Fictional company" chip still tells the reader the company is invented.
  - The chip loses "from documented failure modes" (`.c-tail`).
  - The H1, q-card and margins are tighter.
- Key points: sections 15 and 16 now have one each, on every width. 15: "Run the reader and the clerk on the kit's invented files, never on company data." 16: "Answer the four questions from memory, then rebuild the ledger yourself if you have half an hour." On phones the "Key point" label is visually hidden but kept for screen readers.
- Section headings on phones: a grid with a hanging number (1.4em column), so wrapped lines no longer run back under the number.
- Open sections on phones: the "Close the section" summary is sticky at the top (paper background and a hairline). w04-pages.js adds a delegated click handler on `details.g-fold > summary`: if closing leaves the section's top above the viewport, it calls `scrollIntoView`. Tested: after closing the ledger section from mid-section, the section top ends up at 8px. "Close all" does not trigger the handler.
- Glossary on phones: 14px/1.45.

## Demo (demo.template.html, build-demo.mjs, demo-core.js, demo-app.js)
- Q-card below 700px: a 1px ink top rule, with no frame, fill, Mennige bar or icon; the question is 16px. I used 1px instead of the critique's 2px so it does not stack against the 2px section rule just above it.
- Head: the provenance line is hidden on phones; the comparison-table note still states that the raw-folder answer is constructed. The second sentence of the lede (`.lede-more`) is hidden on phones because the traps lead says the same thing.
- Traps lead on phones: "Every switch starts at “Fixed”. Set one to “As the AI did it” to see what it does to the total." Wide screens keep the full text through `.lead-more` / `.lead-ph` spans.
- Guided sequence margin is 12px. The sub-line of the start row is 13px.
- Meters:
  - demo-core now also returns `distN`, `distSign` and `distSide`, and `#m-dist` is built from three spans.
  - Phones show a signed number (`+82.0 t` / `−413.5 t`). The sign is aria-hidden, and "above" / "below" is visually hidden but still read aloud.
  - Wide screens are unchanged ("82.0 t above").
  - Values do not wrap. The meters have a minimum height of 72px (64px at 359 and below), and `#m-vs-right` is hidden at 359 and below.
  - Measured: the meters stay at 64px at 320 and 82.8px at 390 through T1, T4, T1 off, the market-based tab and the raw-folder preset.
- Switch:
  - 360 to 699px: the column is 132px (was 164px) and the switch is always 48px tall, so the row does not jump when the label wraps to two lines.
  - 359px and below: the switch is 64x48, with the box plus a short state word underneath ("Fixed" / "AI", `.sw__s`, aria-hidden, written by demo-app.js). Fired rows get a 2px Mennige top rule.
- "Only this trap" is 44px tall at 320 (was 40px).
- "No switch" is now plain 13px slate text, top-aligned. The stray "·" is hidden on phones (the cell is kept).
- `.nbtn`: padding 0 2px, inherited line height, and the tap area comes from `::after` (inset -10px -3px). Lines now step 27 to 28px apart (were about 35px), and the punctuation sits next to the numbers again.

## Field card and transfer (lib/w04-pages.css, the two page templates)
- Print on phones:
  - "Print this card" / "Print this sheet" is an underlined text button, 44px tall to tap. Negative vertical margins keep it to one line of text.
  - The print note follows on the same line.
- Field card: the last row's bottom border is removed on phones, which fixes the double hairline.
- Transfer: the worked examples have a hairline and a run-in "Worked example" label (nowrap), with no box or fill. Long file names inside `code` wrap anywhere, which fixes the file name that was cut off at 320.
- Both kickers wrap "Workshop 04 · " in `.k-ctx`, which is hidden on phones. They now read "ESG Reporting with AI · Field card" / "… · Transfer sheet" on one line.

## Checks
- build-pages, build-demo, build-deck and kit-archive `--check`: all pass. Data and the kit zip are untouched.
- node --test scripts/__tests__/workshop04-*.test.mjs: 7/7 pass.
- vitest workshops-esg-reporting + workshops-frame: 18/18 pass.
- node --check passes on demo-app.js, demo-core.js and w04-pages.js.
- ESLint ignores public/ and scripts/. No TS files changed.
- behave.mjs, no page errors:
  - Meter height stays the same through the toggles.
  - Switch state words update.
  - Sticky close scrolls back to the section.
  - Open all / close all works.
  - A #hash opens its section.

## Left open
- Demo first switch at 390 is y=1768, not ≤1600 (see above). Getting there means cutting section 1's comparison or its provenance note, or reordering sections.
- The guide still has two left bars (the ink q-card and the Mennige `.fig-sum`). The critique mentions this but gives no fix, so I did not change it.

Artifacts in mobile/w2-w04-static-polish/:
- shots: before-* / after-* (v1 and full at 320, 390 and 1440), after-demo-*-traps-on.png and wip-*.png.
- metrics: metrics-before-.json and metrics-after-.json.
- scripts: crit.mjs, probe.mjs, shot.mjs, behave.mjs and pdiff.mjs.
