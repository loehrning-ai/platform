# w2-demos: mobile pass for /demos and the demo detail pages

Date: 2026-09-26. Key: `w2-demos`. Nothing committed.
Scripts, screenshots and metrics: `scratchpad/mobile/w2-demos/`
- `before/` and `after/` hold the first viewport (`*-v1.png`) and full page (`*-full.png`) at 320x568 and 390x844 (DPR 3), plus 1440x900 in `after/`. The remaining detail demos are in `after-rest/`, and `after-en/` covers the English hub, RAG and Excel pages.
- `measure.mjs` measures the true height (with `content-visibility` forced visible), the first tile and first control, controls under 16px, text under 12px, shell targets under 44px and overflow. `interact.mjs` handles clicks and scrolls, `nesting.mjs` reports box nesting depth inside the engine, and `contact.mjs` builds contact sheets.

## Before / after (page height in screens; true height)

| Page | 390 before | 390 after | 320 before | 320 after | first demo / action y at 390 | controls <16px (390) | overflow 320/390 |
|---|---|---|---|---|---|---|---|
| /demos | 5.33 true (7.55 as measured: 6371px with 1874px of phantom placeholder) | **2.75** | 8.11 | **4.24** | first tile h3 1283 → **413** | 3 → 0 | none |
| /demos/excel | 4.43 | 3.88 | 7.14 | 6.28 | first task button 966 → **703** (target ≤ 720) | 0 → 0 | none; sheet no longer scrolls sideways (356/356, 286/286) |
| /demos/rag-vertragsassistent | 3.81 | 3.53 | 5.90 | 5.46 | empty state → cited answer figure at **551** without a tap | 1 (13px) → 0 | none |
| /demos/word | 4.55 | 4.20 | 7.57 | 6.93 | 499 → 401 | 4 (12px) → 0 | none |
| /demos/llm-observability | 4.30 | 3.74 | 7.06 | 6.16 | first scenario 945 → **632** | 0 → 0 | none |
| /demos/n8n-supply-chain | 5.15 | 4.73 | 8.31 | 7.66 | 517 → 374 | 0 → 0 | none |
| /demos/rechnung-zu-sap | 4.51 | 4.09 | 7.10 | 6.57 | 506 → 393 | 0 → 0 | none |
| /demos/outbound-workflow | 4.80 | 4.44 | 7.83 | 7.27 | 465 → 367 | 0 → 0 | none |
| /demos/agent-pipeline | 4.56 | 4.21 | 7.50 | 6.94 | 446 → 348 | 0 → 0 | none |
| /demos/prompt-scanner | 3.96 | 3.60 | 6.54 | 6.02 | 556 → 429 | 1 (12px) → 0 | none |
| /demos/cost-drift-observability | 4.18 | 3.81 | 6.69 | 6.13 | 769 → 638 | 0 → 0 | none |
| /demos/fine-tune-playground | 4.22 | 3.86 | 7.05 | 6.43 | 513 → 411 | 0 → 0 | none |
| /demos/roi-rechner | 3.98 | 3.66 | 6.65 | 6.10 | 447 → 353 | 0 → 0 | none |

Every page now has zero text under 12px and zero shell targets under 44px. Box nesting inside every engine is at most 2 deep at 390 (`nesting.mjs`). Before, it was 3 deep (shell frame, sheet, cards). At 1440 the hub, Excel, RAG, llm-observability, word and n8n look the same as before, apart from the RAG worked example.

## What changed

### /demos hub (`src/app/demos/page.tsx`, `demo-grid.tsx`, `demo-tile.tsx`, `src/lib/demos-ui-copy.ts`)
- **Hero below sm** (852 → 265px at 390): `pt-5 pb-6`. The lead shows only its first sentence at 17px; the second sentence is `max-sm:hidden` (the copy is split into `introduction` + `introductionDetail`). The "Was du an jedem Beispiel prüfst" list is hidden, because the lead already says "von der Eingabe bis zur Freigabe". The three StatRow rows become one caption, `12 Beispiele · 3 Ausführungsarten · 0 echte Außenaktionen` (`statsLine`, built from the same registry numbers). The StatRow is unchanged from sm up.
- **Filters below sm** (≈330 → 58px): one 44px "Filter" button sits beside "Alle Beispiele" (`aria-expanded`/`aria-controls`, plus/minus glyph, `· n` count with sr-only "n aktiv"). It opens the three label + select rows as a compact 6.5rem/1fr grid. The selects are 16px below lg, so iOS does not zoom. Once a filter is set, the live count and "Filter zurücksetzen" take their own line. From sm up the chip rows are unchanged, and the button is `sm:hidden`.
- **Ledger rows** (227 → 132px): `max-sm:py-4`. The caption line (evidence · level) and the "Beispiel öffnen" line are `max-sm:hidden`, because the whole row is the link (with an aria-label). A 16px ArrowGlyph sits beside the name (`sm:hidden`).
- **D2 placeholder**: the tile carries `max-sm:[contain-intrinsic-size:auto_132px]!`. The important flag beats the unlayered `.demo-gallery-tile` rule in globals.css, so globals.css was not touched. At 390 the measured height now equals the true height. At 320 a few two-line titles leave about 100px of slack.
- `DisclosureGlyph` is now exported from `evidence-badge.tsx` and reused by the grid and the Excel sheet.

### Detail pages, shared (`demo-detail-layout.tsx`, `demo-shell.tsx`)
- Header band below sm: nav `pt-1`, section `pt-1 pb-10`, H1 `mt-2`, lead 17px/1.5 and `mt-2`, engine `mt-4`. The engine now starts at 264-353px instead of 319-473px.
- **Shell flattened below sm.** Light engines keep only their top and bottom ink rules, with a transparent background and no side padding (`max-sm:border-x-0 max-sm:bg-transparent`, body `px-0 py-3`). Dark engines bleed to the screen edges as a graphit band (`max-sm:-mx-4 max-sm:border-x-0`, body `px-4 py-3`). The "Interaktives Beispiel" label is `max-sm:hidden`, so the evidence line (mode · actions · "Was heißt das?") fits one 44px row at 390. It wraps to two rows at 320. Everything is restored from sm up.
- "Nächstes Praxisbeispiel" description is 14px below sm (E4).

### Excel (`excel-demo.tsx`)
- The sheet fits a phone: `min-w-[280px]` below sm (it was 430), column widths 26px/20/24/14/rest, cells 13px mono at 1.35 line height, and 6px/3px padding. From sm up it returns to 12px, a 430px minimum and the old widths and padding. "Umsatz" is no longer cut off.
- Below sm the sheet shows 5 of 9 rows. The status bar's "Alle 9 Zeilen" button (44px, `aria-expanded`, `aria-controls` the sheet) opens the rest. Rows beyond 5 are `max-sm:hidden` until then. From sm up the status bar and every row are unchanged.
- Outer gap 12px below sm. Task number, time and detail are 13px, title 14px (E3). Formula notes are a hairline `dl` below sm (key left, value right) instead of three boxed chips, and stay boxed from sm up (E2).

### RAG (`rag-vertragsassistent-demo.tsx`)
- **Worked example first** (R1): the chat opens on "Wie ist die Kündigungsfrist?" with its keyword answer. That is the same `CHAT_Q` data a click produces: bold figure, "Keyword-Suche · 2 Quellen", keyword definition, collapsed sources and follow-ups. The empty "Frag das Beispielarchiv." state is gone. Its honesty line ("… kann Treffer übersehen.") is now a caption above the conversation. Auto-scroll skips the untouched opening state, so the question stays in view. The English engine also opens answered (notice period).
- One suggestion rail above the input holds the questions not yet asked and not already offered as follow-ups, then the Grenzfall as a dashed last chip. This replaces the boxed "Grenzfall" beat and its 12px mono button (R2). Below sm the rail scrolls sideways at 14px; from sm up it wraps at 12px. Every chip is 44px.
- Input is 16px below lg (R3/X1). Bubble and answer text are 14px below sm, follow-ups 14px. The matched-terms panel is a plain caption line below sm and stays a tinted box from sm up. Below sm the chat log has no inner scroll box or frame min-height, so the page scrolls once.
- The instrument is 735px tall at 390 (target ≤ 700). It is 8px taller than the old empty state but now holds a full answered exchange. The remaining height comes from the two follow-up chips, which wrap to two rows.

### Two more demos, plus input fixes on others
- **llm-observability**: KPIs are 2×2 below sm with a 10/12px inset (they were four stacked tiles), the gap is 14px, and scenario prompts are 14px. First scenario 945 → 632.
- **n8n-supply-chain**: below sm the workflow canvas drops its own frame and inset (the dark band frames it), which removes a nesting level.
- **word**: both locales' brief inputs are 16px below lg (they were 12px). **prompt-scanner**: the textarea is 16px below lg (it was 12px).

## Tests
- Updated because they pinned the old geometry or the empty start:
  - `rag-vertragsassistent-demo.test.tsx`: opens on the worked example, the rail dedupes, the matched path now goes through "Haftungsgrenzen", and a new 16px field test.
  - `tests/e2e/demos.spec.ts`, 390 gallery test: Filter button, first tile ≤ 700, selects hidden then visible at 16px, URL state, count.
- Added:
  - grid: filter disclosure, count and `max-sm:hidden` panel.
  - tile: slim phone row and placeholder.
  - shell: phone flattening for light and dark engines.
  - excel: 5 rows plus the "Alle 9 Zeilen" toggle.
  - hub page: stats line, hidden StatRow and hidden scope list.
  - e2e: at 390, the Excel first task is ≤ 720 and the sheet has no sideways scroll, the RAG answer shows without a tap, and the field is ≥ 16px.
- Fixed two stale e2e assertions that were already failing before this pass:
  - The English detail H1 is the plain `demoName` (it was expected as "title titleKicker").
  - The gallery preview visibility assertion is skipped below 640px, where the ledger row has no drawing.
- Runs:
  - `bunx vitest run src/components/demos src/app/demos`: 28 files, 256 tests, all pass.
  - content-lint, demos-copy and i18n tests: pass.
  - `eslint` on the demo files: clean.
  - `tsc -p tsconfig.typecheck.json`: no errors in these files.
  - `tests/e2e/demos.spec.ts` on chromium and mobile-chromium against the running dev server: 52/52 pass. This used `E2E_REUSE_EXISTING_SERVER=1`, a scratch `PLAYWRIGHT_BROWSERS_PATH` symlinking the installed headless shell (the config expects build 1228), and `PLAYWRIGHT_OUTPUT_DIR=test-results/w2-demos`, which was removed afterwards.

## Left for others / notes
- X2 (the global `--text-lead` clamp) was not touched. The demo pages apply 17px below sm locally, so they will not change when X2 lands.
- globals.css `.demo-gallery-tile` is untouched. The phone placeholder lives on the tile as an important utility, and can move into globals.css if its owner prefers.
- At 320x568 the detail pages still spend most of the first screen on H1 and lead (5-line leads). The engines start at 264-379px there.
- An early e2e attempt (before I pointed Playwright at a private output dir) ran with the default `test-results/` output dir, which Playwright clears on start. If another agent had artifacts in `packages/website/test-results/` around 18:05, they may have been deleted. These are gitignored run artifacts only.
