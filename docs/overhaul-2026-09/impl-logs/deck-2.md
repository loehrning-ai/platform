# W04 deck-2: acts 4 to 6, resolution, appendix, whole-deck verification

## Scenes added to slides.html (after two-scope-2, replacing the ACT 4 marker)
Main path (data-kind="main"):
- rematch (act 4, 240 s, listen): unchanged q-card with stamp, ledger answer with solid ink rail and row IDs per figure, `meta.targetLabel_en`, slate spreadsheet check (press 2), raw vs ledger table (press 3), dashed "Known gap" placeholder pointing to A3 until capture (press 4).
- trace-two (act 4, 360 s, pair, recovery 120): three cards from `traceTwo` (worked, half, alone), dashed blanks fill on press 2, 4-minute timer stamp on press 1, "If yours differs" band with 418.0 / 376.6 (also right, slate rail) / −73.0 on press 3.
- what-drove-it (act 4, 330 s, vote): AI reason struck through; two bridges generated from `drivers.lb` / `drivers.mb` (new `gen:drivers`), own-use bracket, per-step Mennige share line (via `data-step-current`), vote on press 1, rewritten sentence on press 4. Convention caption keeps "Real residual mixes change every year" (M6).
- ask-back (act 5, 270 s, do): five request cards in a tray; each leaves the tray when its column fills (press 2 calculate: cards 1 and 5; press 3 ask back: 2; press 4 refuse or rewrite: 3 and 4, with the "Rules as of 26 Sep 2026. Not legal advice. Check the German transposition." footer); press 5 the seven-point target answer (dashed rail, `meta.targetLabel_en`).
- limits (act 5, 150 s, listen): five rows, one per press, text from SPEC §2.3.
- your-bill (act 6, 420 s, write, recovery 120): transfer sheet table with the Werk Süd example (from §6, numbers bound), Mennige frame per box on presses 1 to 5, "Now:" line, pair share on press 6.
- resolution (act 6, 180 s, vote): hero q-card on entry, both answers side by side (hatch vs ink rail, both labels), number ladder (Mennige rail on the grid-factor rung while current), callback vote, four questions + materials line with demo link and lockup.

Appendix (data-kind="appendix", 0 s, route hidden): appendix-arithmetic (A1, new `gen:wftable` for both waterfalls; top three shares only), appendix-factors (A2, reuses `gen:factors`), appendix-run-record (A3, empty catch table from `runs.scoredItems`), appendix-regulation (A4, "What is true on 26 September 2026", nine dated items with sources, unverified/secondary tags, footer), appendix-claims (A5), appendix-baseline (A6), appendix-steel (A7), appendix-scope2-order (A8), appendix-sources (§10 links, external, no trailing slashes).

Main path total: 4,590 s = 76:30 (acts 240/450/960/990/930/420/600), equals SPEC §2.2. Presenter target shows 76:30.

## Files
- slides.html: 16 scenes + 8 stylesheet links; one text fix inside no existing scene.
- lib/scenes/: rematch.css, trace-two.css, what-drove-it.css, ask-back.css, limits.css, your-bill.css, resolution.css, appendix.css (shared ax-* parts + one block per appendix scene).
- lib/scenes/the-ledger.css (deck-1 scene): one rule so the Werk Süd file name stays on one line on card E-WS-01.
- lib/w04-fill.js: new data-form "math" (× and U+2212 for the dataset's ASCII arithmetic).
- scripts/workshop04/build-deck.mjs: gen:drivers, gen:wftable; reference allowlist for the non-case facts quoted on appendix/limits scenes (2026/1560, 2026/1563, 2015, UBA 433, 76.9%, 78.2%); dash regexes written as –— escapes.
- scripts/workshop04/notes/20-act4-6.mjs, 30-appendix.mjs (all spoken numbers via {key}); lib/presenter-notes.js regenerated (29 entries). revealOrder aligned to state counts: ask-back 6 states (entry = three empty columns; say line for card 4 on press 4), resolution 5 states (entry = question card), rematch press 4 = known-gap placeholder.

## Verification
- build-deck.mjs: 0 findings; --check clean (29 scenes, 29 note entries).
- Walks (impl/w04/deck-2/walk.mjs, now also opens every appendix page by hash): 102 states each at 1440x900 reduced, 1920x1080 reduced, 1920x1080 full motion (shots/final-*). 0 console errors/warnings, 0 page errors, 0 failed requests, 0 CSP violations; nothing below y 984 or outside the margins; only the-arc's wire SVG overlap (by design).
- Presenter (presenter-all.mjs): CONNECTED, console follows all 102 states + 9 appendix pages with the right scene id and a speaker note, every scene has a say line, 10 vote cards, console arrow drives the deck, target 76:30. 0 errors, 0 CSP.
- Print: page.pdf with ?export=final (headless page.pdf does not fire beforeprint) gives 29 pages at 1440x810 pt; print-media screenshots checked. PDF kept only in scratchpad (impl/w04/deck-2/print-check.pdf), none in the repo.
- No U+2013/U+2014 in any deck file, notes or build script; no inline handlers; no href ending in "/"; no mixed-case 40+ tokens outside https URLs.
