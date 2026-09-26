# w2-w04-static: W04 static materials on phones

Pages: /workshops/esg-berichte-mit-ki/{guide,demo,field-card,transfer}.html. Desktop (1440) unchanged: same document heights. The demo, field card and transfer 1440 screenshots are byte-identical. The only guide 1440 difference is one caption `code` raised from 11.7px to 12px (text floor).

## Heights (screens = document height / viewport height; the static pages have no site tab bar)

| Page | 390 before | 390 after | 320 before | 320 after | 1440 |
|---|---|---|---|---|---|
| guide.html | 28.76 (24277px) | **5.10** (4307px) | 49.82 (28298px) | **8.33** (4729px) | 16751px, unchanged |
| guide.html, every section open | 28.76 | 23.6 (19925px) | | | |
| demo.html | 8.33 (7029px) | **7.86** (6637px) | 14.78 (8397px) | **13.18** (7489px) | 6340px, unchanged |
| field-card.html | 3.61 | **2.58** | 6.08 | **4.54** | 1350px, unchanged |
| transfer.html | 3.07 | **2.69** | 5.20 | **4.38** | 1761px, unchanged |

No horizontal overflow at 320. No visible text under 12px on phones (the demo comparison note's `code` was fixed from 11.2px). All new controls are 44px tall.

## Guide (scripts/workshop04/pages/guide.template.html, build-pages.mjs, lib/w04-pages.css, lib/w04-pages.js)
- Each of the 18 sections wraps its body in `{{fold}}…{{endfold}}`. build-pages.mjs turns that into `<details class="g-fold">`, with the summary "Read the section" (or "Show the terms" / "Show the links" for the glossary and links). The summary carries a visually hidden ": <section title>", so a screen-reader control list does not repeat the same label. The build fails if a section has anything other than one fold/endfold pair.
- The HTML never sets `open`. From 641px, CSS `@supports selector(::details-content)` renders the body and hides the summary, so the wide layout is the old page (the AX tree still exposes the content, which I checked in Chromium 141). Browsers without ::details-content get `html.g-fold-js` from w04-pages.js, which opens the folds on wide screens and before printing. Print always shows the bodies.
- On phones each section is: Kopflinie, kicker, H2, **key point** (visually moved above the toggle with flex `order`; the DOM order is unchanged), then the toggle. Collapsed, the guide reads as 18 key points.
- w04-pages.js: a `#hash` or a contents link opens the target section. "Open every section" (phones only, shown by JS) opens or closes everything and updates its label and aria-expanded.
- Head on phones: H1 capped by width rather than 22ch, 16px lead, compact q-card, provenance chips as one line of text (not boxes), the four material buttons as a 2x2 grid, and a 44px contents summary.
- Inside open sections: 16px/1.55 text, 24/12/16px rhythm, smaller answer tiles, tighter steps, rows, notes and legends. The glossary opens with run-in terms (term in bold, definition on the same line, one hairline per term) at 15px.
- G4: at 360px or narrower, "Reveal the explanation" drops the Show/Hide word and keeps the plus sign.
- Text floor: `.wf-page code` is at least 12px everywhere and 13px on phones.

## Demo (scripts/workshop04/demo.template.html inline CSS, build-demo.mjs, demo-app.js)
- W4D1: below 700px the two lanes are replaced by one comparison table (`cmpTable()` in build-demo.mjs, same C.num/C.pct values as the lanes). It has a hatched "Raw folder" header cell, an ink "Ledger" header cell, a Scope 1 row, then row groups for Location-based and Market-based (Scope 2, Total, vs 2024). The constructed label is kept in a caption note below it. Measured 347px at 320 (before: 756px of stacked cards).
- W4D2: below 360px, the trap switch is a 52x44 square (the word is hidden; the state is still in aria-pressed and the knob). Grid areas are "name sw" / "iso sw" / "track track". Rows at 320 are 103 to 122px (T7 is 168px because of its tag); they were about 240px. The trap section at 320 is 2007px (was 2472px). The rest is the lead, the presets and the caption, left as they are.
- W4D3: the sticky meters use the labels "Answer / Distance / vs 2024", hide the distance % sub on phones, and use "Right: −5.1%" (JS now only writes the number into `#m-vs-right`). Below 360px all subs are hidden and the gauge is 4px. The meters measure 64px at 320 (were 113px).
- W4D4: `.nbtn` has 4px/2px padding and a 1.6 line height on phones (36px tap height). W4D4b: coverage cells are 28px below 700px.
- The provenance chips in the head become one line of text on phones.

## Field card and transfer (lib/w04-pages.css)
- FC1: the 34px number column is gone at 640px and below. The number sits before the check name on the same row, and Do / Don't / From the case run in after their label.
- FC2: "Deck scene" is hidden on phone screens and kept in print.
- FC3: `.wf-foot` margin-top is 32px on phones (a local override; the frame is not touched).
- Transfer: `.ex code` is 13px, the example boxes are tighter, and the two sentence panels are ruled blocks (2px Kopflinie, no frame) instead of boxes.

## Checks run
- node scripts/workshop04/build-pages.mjs --check, build-demo.mjs --check, build-deck.mjs --check, kit-archive.mjs --check: all pass.
- node --test scripts/__tests__/workshop04-*.test.mjs: 7/7 pass.
- bunx vitest run src/lib/workshops-esg-reporting.test.ts src/lib/workshops-frame.test.ts: 17/17 pass.
- scripts/workshop04/data/ is untouched (git diff is empty), so no numbers changed.
- ESLint ignores public/ and scripts/ (the file-ignored warning). `node --check` passes on the changed JS. No TS files were changed.
- Behaviour (behave.mjs): on desktop, summaries are hidden and every body is visible. On phones, `#drivers` opens its section, the contents link opens its section, open-all and close-all work, and the T3 switch at 320 toggles and updates the meters.

## Left for others
- 9.0 strip (150px at 390, 194px at 320) is in workshop-frame.css, owned by the frame agent. It is the biggest remaining first-viewport cost on all four pages.
- G2 floating "Contents" button: not needed now that the collapsed guide is 5 screens.
- The demo trap section at 320 is still above the audit's 1300px, because of the 9-line lead and the two preset buttons on two rows.

Artifacts: shots/before-* and shots/after-* (v1 and full at 320, 390 and 1440), metrics-before.json, metrics-after.json (demo only after the last re-run), measure.mjs, seg.mjs, behave.mjs.
