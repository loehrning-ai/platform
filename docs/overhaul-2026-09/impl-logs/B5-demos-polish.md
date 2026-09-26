# B5-demos polish pass (retry): change log

Scope: `/demos`, `/demos/<slug>` and the `/en` mirrors. This pass works through the design critique in `impl/B5-demos-critique/`. Every high and medium issue is fixed, and so are all the low ones except #13, which sits in `globals.css` and is left for the integrator.

Screenshots, axe results and scripts are in `impl/B5-demos-polish2/`:
- `r2/`: hub DE/EN, agent-pipeline, prompt-scanner, n8n and excel at 1440 and 390, with axe.
- `r3/`: the other nine detail pages plus four EN detail pages, with axe.
- `r4/`: states: `evidence-open.png`, `focus-tile.png` and `n8n-390.png`.
- `r5/`: re-check after the last fixes, with axe.
- `crops/` inside each folder.

The final axe run found 0 violations on every page checked: hub DE/EN, all 12 DE detail pages, and EN excel, agent-pipeline, n8n, word, prompt-scanner, rag and outbound, each at 1440 and 390. No page overflows horizontally at 390 or 1440. There were no page errors.

## Deviation from the ownership note, and why

The critique rated the engine interiors high (#1 to #4). The user asked to "finish everything". So I edited the interactive engines (`*-demo.tsx`) and `src/lib/demo-tokens.ts` beyond removing offset shadows.

- **Collision check:** before and during the work, `git status` showed no other agent touching these files, and no other agent's scope lists them.
- **Behaviour tests:** all engine behaviour and a11y tests still pass. Tests that pinned the old look or the old "starts empty" behaviour were rewritten to pin the new contract.

## Files changed

### Hub and detail frame (owned)

- `demo-shell.tsx`: the header row now carries the evidence line on the right (`data-demo-shell-header`, `flex min-h-11 flex-wrap justify-between`).
- `evidence-badge.tsx` (#6):
  - The line reads `[pictogram] Synthetisch · Aktionen simuliert`, then the note, and the disclosure button comes last.
  - The button's visible label is "Was heißt das?" / "What this means", followed by +/−.
  - Its accessible name starts with the visible text: "Was heißt das? Ausführung: Synthetisch".
  - It keeps `aria-expanded`, `aria-controls` and 44px. The controlled `<p>` is always in the DOM (`hidden` when closed).
  - It renders as two siblings, so the explanation takes a full-width row (`basis-full`; the 64ch measure sits on an inner span). Opening it does not move the button.
- `demo-detail-layout.tsx`:
  - The evidence line is gone from the page, and the shell sits at `mt-6`.
  - The run table has columns `grid-cols-[8.5rem_minmax(0,1fr)] items-baseline`, and the actions row now takes short values (#10).
  - The risk list gets `text-body`, so its 64ch matches the paragraphs (#12).
  - Continuation (#11): the next-example column reads kicker, H3-size title, 2-line caption, then the button "Beispiel öffnen" (`aria-label` "Beispiel öffnen: <name>"). Below md there is a hairline and `pt-6` between the two columns.
- `demo-cta.tsx`: new optional `ariaLabel` prop.
- `demo-tile.tsx` and `demo-grid.tsx` (#8, #14):
  - Below sm each tile is a ledger row: the preview is hidden, the description clamps to 2 lines, rows are split by hairlines and have `py-5`.
  - Filter label column is `7rem`, `gap-x-3`, chips `gap-x-1.5`. EN and DE category chips now fit on one row at 1280 and 1440 (measured).
  - Kategorie shows "Alle (12)" (chip and select).
  - The `role=status` element stays mounted but holds text only while a filter is set.
- `src/app/demos/page.tsx`: below sm each stat is one hairline row showing value, then label ("12 Praxisbeispiele"), with no note.
  - The critique's `grid-cols-3` does not fit German labels ("Ausführungsarten" is about 120px in a 108px column).
  - The DOM order stays label, value.
  - The 390 hub dropped from 8,711px to 4,497px.
- `demo-gallery-previews.tsx` (#7, #9):
  - Word drawing: 3 lines and tighter gaps. It now fits its band.
  - Cost chart: `h-36`.
  - Prompt scanner: two more token rows. The second has a dashed "Projekt Nord", the known gap that matches "1 übersehen".
  - The n8n label is "Verzug 31 h" with a no-break space, and the Node label gets `text-balance`.
- Copy (#15):
  - Rewrites as the critique proposed in `demos.ts` (prompt-scanner description and risk note, fine-tune description), `demos-localization.ts` (EN mirrors), `demos-ui-copy.ts` (hub lead "Zu jedem Beispiel steht …"; new `detail.actionValue` and `evidence` copy; `openNext` removed) and `demos-copy.ts` (agent, llm-observability and fine-tune `why`, DE and EN).
  - Engine copy that was touched:
    - The Excel forecast note no longer says "realistisch, nicht geschönt".
    - The prompt-scanner "dieser Angriff" is now capitalised.
    - RAG DE: the empty state no longer uses Sie-form ("Frag das Beispielarchiv.").

### Engines and tokens (#1 to #4)

- `src/lib/demo-tokens.ts`:
  - New `DEMO.label` (sans 13px, 600 weight, +0.02em, no transform).
  - `fill.accent` and `accentStrong` are now `transparent`, and `kupferMist` too.
  - `kupferLight` is now `var(--color-brand-orange)`, which resolves to #b73a15 on paper and #e07050 inside `.dark-section`. The literal #b73a15 the critique proposed would be 3.2:1 as text in the dark frames. Where `kupferLight` sat on an ink card, it became paper at 75%.
- **All 12 engines** (#1):
  - The kicker and the two-colour slogan H2 are gone. Each engine keeps one `<h2 className="sr-only">` with a plain name, which lessons that embed engines through `widgets/registry.tsx` also need. llm-observability never had one.
  - One-line scope notes stay as `text-caption text-muted-foreground`.
  - n8n's timing-scope slogan became a caption: "Die Sekundenangaben sind Beispielwerte und zeigen nur die Reihenfolge der sechs Schritte."
- **Label pass** (script `label_pass.py`): every `textTransform: "uppercase"` style object now uses `...DEMO.label`, 75 objects in all. Orange label colours became `var(--color-muted-foreground)`. Uppercase literals became sentence case: "EREIGNISSE", "MARKIERT", "LIVE", "PROMPT 01", "DIVERGENZ", "APPROVAL PENDING" and others.
- **Tracking:** letter-spacing of 0.08em or more is removed, and -0.02 to -0.045em became -0.01em.
- **Final state first** (#3). Each engine opens on its end state, and "↻ Neu abspielen" is the only trigger:
  - **agent-pipeline:** opens on the full trace and memo (`stepIndex = script.length`, autoplay false). A task switch shows that task's end state. The placeholder is gone; the memo is always visible, and the log opens at its first line.
  - **n8n:** step 3, or 2 on low confidence.
  - **rechnung:** stage 4. A replay ends at rest, so scrolling away afterwards does not rewind it. The payoff stage no longer shows "läuft…".
  - **outbound DE:** stage 4. It gained a "Schritt n / 4" row and a replay button.
  - **word:** the brief for the default inputs. The brief now shows a snapshot of the last generation, so an invalid budget never shows "NaN €".
- **Motion:** the infinite pulse, glow, dot and caret animations are removed. The outbound scan and the invoice OCR scan play once per replay, with an ink tint.
- **Critique specifics** (#2, #4):
  - agent-pipeline: flat cards with a `#e07050` 1px edge on the current step. The log's left rule became a 2px top rule. Scenario and control buttons use the chip grammar (filled = selected).
  - Excel: the green title bar and "X" logo became an ink band with the file name. The offset shadow and lift on the task picker are gone, the orange left-rule callouts are gone, and the confidence band is dashed ink.
  - n8n:
    - The dot grid and the invented metrics are gone; only "Beispiel-Reaktionszeit 4 s" remains.
    - Contrast: paper `#f9f7f2` on the Mennige node (5.40:1).
    - No pastel "OK" pill; status is now "✓ OK" in pass green.
    - Terminal traffic-light dots are gone.
    - The alternative path is dashed and neutral.
  - Prompt scanner: the verdict is a word with no left rule (`data-scanner-verdict`). The Grenzfall box is dashed and neutral. Highlights use one neutral fill plus the coloured underline.
  - Word: the blue title bar is gone. The generate button is now ink, with no offset shadow or press translate. Input focus is a 3px Mennige outline instead of a 2px offset shadow. "Manuell sonst ≈ 3 h" (an invented baseline) is removed. #777 text became AA.
  - RAG: the green "DEMO-MODUS" pill and the blue kicker are gone. Answer sheets have an ink frame; "no match" is dashed. The send button is ink. The EN band text is AA on ink.
  - Cost drift, fine-tune, llm-observability, ROI: the coloured left and top rules are gone, the blue seed chip is gone, the pastel chips became outlined words, and the chart area gradient is gone. Sliders are flat ink with a 3px Mennige focus outline; the grooved "craftsman" thumb and its drop shadows are gone.

### Tests updated (old-look and old-behaviour pins replaced; the a11y and behaviour intent is kept)

- **Shell and frame tests:**
  - `evidence-badge.test.tsx`: phrase order, the button last with label-in-name, the controlled region hidden or visible, and the EN name.
  - `demo-shell.test.tsx`: the header carries the evidence line and the 44px disclosure.
  - `demo-detail-layout.test.tsx`: no evidence line on the page, the run-table columns, the short actions value (outbound, review_gated), and the next-example order and hairline.
- **Hub tests:**
  - `demo-grid.test.tsx`: the status is empty while unfiltered, and both "Alle (12)" chips are queried within their groups.
  - `demo-tile.test.tsx`: `max-sm:line-clamp-2` is the only clamp.
  - `demo-gallery-grid.test.ts`: the new grid class string.
  - `tests/e2e/demos.spec.ts`: at 390 the tile is visible and the preview hidden. Not run.
- `demo-design-contract.test.ts`:
  - The tile clamp is allowed only below sm.
  - New per-engine contract: every `<h2>` is `sr-only`; no two-colour h2; no `rgba(249,115,22…)`, `#107C41`/`#2B579A` title bars, `radial-gradient` dot grids, offset stamp shadows, `infinite`, 3 to 9px `borderLeft` rules, uppercase transforms, wide tracking or crushed tracking.
- **Engine tests** (agent-pipeline, n8n, rechnung, outbound, word, prompt-scanner, rag, roi, cost-drift, demo-english-surfaces): they now pin the sr-only heading, the final state on load, replay as the only trigger, and the new sentence-case words. `autoplay-visibility.test.tsx` now pins "final state on load, replay only on click, paused off-screen, no infinite animation" for agent-pipeline, outbound and invoice. The reduced-motion checks are unchanged.

## Checks run

- **vitest:** `src/components/demos` (27 files), `src/app/demos`, `src/lib/demos*.test.ts`, `motion-policy-contract`, `src/components/widgets`, `catalog-surfaces-mobile`, `sitemap`, the briefing-pdf and knowledge-graph routes, `ai-native/exercises`, `interaction-target-design-contract`, `motion-provider-contract`, `language-quality`, `src/lib/analytics`, `content-freshness`, `schema-validation`, `crawl/contract`, `dark-surface-contract`, `content-parity`, `learning-graph`, `learning-surface-density`, `access-surfaces-density`, `public-information-density`, `globals-css` and `passive-state-design-contract`. All pass: 83 files and 1,084 tests in the wide run, 51 files and 574 tests in the final run.
- **eslint:** 0 problems on all touched files.
- **tsc** (`tsconfig.typecheck.json`): no errors in `components/demos`, `lib/demo*` or `app/demos`.
- **`bun run content:lint`:** 0 errors, and no warnings in any demos file.

## Not run

- e2e (`demos.spec`, the a11y and axe specs, visual regression), Lighthouse and the build.

## Left for the integrator

1. **`globals.css` #13:** the rule `.demo-gallery-tile { content-visibility: auto; contain-intrinsic-size: auto 420px; }` still makes the scrollbar jump and blanks the last row in full-page captures. Delete it, or use `auto 580px`. Keep the class, because the `.demo-pv-*` hover selectors use it. The file is shared, so I did not touch it.
2. **EN detail 404 (#5):** on the current dev server, `/en/demos/excel`, `/en/demos/agent-pipeline` and `/en/workshops/ki-prognosen-einschaetzen` return 200, and I screenshotted and axe-checked 7 EN detail pages. So it was dev-server state. Confirm it with `tests/e2e/demos.spec.ts` or a build. If the 404 reproduces, use the generator fix from the critique (a real `generateStaticParams` function in `scripts/generate-english-route-mirror.mjs`).
3. **Engines in course lessons:** the engines are also rendered in EN lessons through `components/widgets/registry.tsx`. There they now show no visible title (the sr-only h2 stays), and agent-pipeline, n8n, rechnung, outbound and word open on their final state. The widget tests pass. Give the lesson pages a look in the e2e run.
4. **Not changed:**
   - cost-drift still runs a 5-step random walk of its latency line when it scrolls into view. It is finite, and the chart is visible first, but it is ambient first-view motion that uses `Math.random`.
   - RAG DE still opens as an empty chat with four suggested questions. That is an input state, not a replay placeholder. Seeding one answered question would satisfy principle 16 fully.
5. **`ResourceContextBanner`** (from the first round) is outside my files. Check whether its restyle landed.
