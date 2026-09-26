# W04 deck-1: engine, fonts, acts 0 to 3

## Engine (packages/website/public/workshops/esg-berichte-mit-ki/)
- Copied from the verified skeleton (scratchpad/deck-skeleton, identical to W03 libs + the 7 patches): lib/deck-stage.js, lib/deck-runtime.js, lib/presenter.js (namespace esg-deck / esg-presenter; route stations and title from `<deck-stage data-route-stations data-deck-title>`; optional FoldlineDemo; clock target = sum of data-seconds), lib/presenter.css, lib/story.css, lib/tokens.css (woff2 @font-face), lib/cover-globe.css, presenter.html (title, eyebrow without Brainster, #clock-target), lib/scenes/cover.css (no Brainster ::after), lib/scenes/host.css (from W03, one-state variant).
- Extra change: removed every U+2013/U+2014 from the copied files (comments to "to"; presenter placeholders "—" to "·"; presenter range strings "entry to press n", "presses a to b"; regex `[–-]` written as `[–-]`). Behaviour unchanged.
- Assets: Typing-Static-{400,500,600,700}.woff2 (lossless from W03 v2.1 ttf, skeleton hashes), JetBrainsMono-var.woff2, OFL-1.1.txt, OFL-1.1-JetBrainsMono.txt, favicon.svg, globe.svg, lockup-horizontal(-dark).svg, mark-black.svg, tim-loehr.jpg (host slide).
- ASSET_MANIFEST.json: 6 rows appended (5 woff2 via scripts/scaffold-asset.mjs; tim-loehr.jpg copies the W02 row text exactly). Re-read right before the write; round-trip formatting verified identical.

## Data binding
- lib/w04-data.js (generated): `window.W04_DATA = Object.freeze(<w04-data.json>)`, no fetch.
- lib/w04-fill.js: one resolver used at build time and at run time. `data-num="<key>"` (+ data-form bare/abs/absunit/de) and `data-j="<json.path>"` (+ cell:N, md, int, fix1, fix2, pct).
- scripts/workshop04/data/: copy of w04-data.json and build_dataset.py.
- scripts/workshop04/build-deck.mjs (`--check` for CI-style runs): writes w04-data.js, regenerates `<!-- gen:NAME -->` fragments (doc cards from documents[].lines, LB waterfall, site x month grid, ledger excerpt, factor table, Scope 2 stack bar, LB to MB bridge; all geometry from JSON), fills every data-num/data-j text, lints (numbers not in the JSON, dashes, q-card text = question.en, unresolved bindings, notes per scene, revealOrder length = scene states), builds lib/presenter-notes.js from scripts/workshop04/notes/*.mjs with {key|form} substitution.
- scripts/workshop04/notes/10-act0-3.mjs: notes for cover to two-scope-2 (say, sayAt, ask, expectedAudience, revealOrder, cut, appendixRoutes, clock, mode, purpose). revealOrder was aligned to the actual state count where the SPEC's list was one short (month-grid 7, six-rules 5, the-ledger 8 with "then filled" split across presses).

## slides.html (13 scenes, acts 0 to 3)
cover, host, the-case, the-arc, raw-folder, raw-answer, month-grid, one-unit, whose-bill, anatomy, the-ledger, six-rules, two-scope-2. One CSS per scene in lib/scenes/, shared components in lib/w04-deck.css (case tag, doc paper card with hatched head band, grouped Mennige/ink line frames, ledger table, slate check card, focus line). New sprite icons: i-invoice, i-meter, i-factor, i-scope, i-certificate, i-folder, i-bank, i-fleet, i-gas.
- Marker comment `ACT 4 BEGINS HERE` before `</deck-stage>` with instructions; a `<!-- act 4 onward -->` placeholder in `<head>` for stylesheet links.
- Cover kicker is "Workshop 04 · Rules as of 26 September 2026" (no session date exists in SPEC/JSON); replace with the session date when known.

## Verification
- build-deck.mjs: 0 findings; `--check` clean.
- Playwright walk (scratchpad/impl/w04/deck-1/walk.mjs): 56 states at 1440x900 and 1920x1080 (reduced and full motion), shots in impl/w04/deck-1/shots/r3-1440, r4-1920, r5-1920-full. 0 console errors/warnings, 0 page errors, 0 failed requests, 0 CSP violations; no element below y 984 or outside margins; remaining overlaps only the-arc's wire SVG under its boxes (by design).
- Presenter (presenter.mjs): P opens the console, CONNECTED, notes per press, vote card on raw-answer press 3, console arrow drives the deck, target 44:00 (= acts 0 to 3; becomes 76:30 when acts 4 to 6 land). 0 errors, 0 CSP.
