# Static workshop materials: audit and restyle plan (W01 + W02 into the W03 deck language)

Date: 2026-09-26 · Repo: `/home/user/platform` (read only, `git status` clean after the audit) · Scope: `packages/website/public/workshops/ki-prognosen-einschaetzen` (W01), `…/geschaeftsberichte-mit-ki-lesen` (W02), the shared strip from commit `6f2617a` in all three folders, including `datenbereitschaft-fuer-ki` (W03) `guide.html`, `demo.html` and `builder.html`.

## 0. Summary

1. **Where the "brutalist / risograph" look comes from.** Measured causes: offset ink shadows (W02 `.mock` `10px 10px 0`, W02 report hover `14px 14px 0`, W01 field-card print button `3px 3px 0 var(--rust)`, W03 guide, demo and builder `3px`–`8px` ink offsets), dot or graph-paper page backgrounds (W01 hub, field card, homework, hands-on and case study), pastel tints (`color-mix(rust 8–9%)` callouts, W02 ghost bars `rgba(183,58,21,.32)`, case-study `#fbfcff`/`#f4f8ff` tints), solid Mennige badges ("YOU FILL THIS", "DO/STRETCH", Mennige route squares), a full-bleed Mennige poster slide (W02 slide 22), and tiny mono uppercase labels with wide tracking (`.12em`–`.3em`) on almost every label.
2. **The W03 deck is the target, and it is measurably different.** It has one token file (11 colours, only 3 hex values in `story.css`), a type scale where nothing is below 22 px on the 1920 canvas (one exception at 20 px), sentence-case labels at weight 600, ink outlines, Leinen hairlines, a single Mennige bar per view, hatch for "wrong", and the dark globe cover. By contrast the W02 deck has **566 text elements below 22 px** across its 22 slides (per-slide harness, §10). The W01 case study has 51 distinct hex colours plus blue, red, orange and green team colours.
3. **Much of the restyle can be done in CSS alone.** In the hands-on lab, the injected widget CSS reads custom properties (`.hs{--blue…}`), so a page rule one class more specific (`.act .hs{…}`) reskins every control. Canvas colours come from `window.FL_PALETTE` (set in the page) plus about 12 JS constants. The case-study CSS is also tokenised (`var(--blue)` ×49, `--red` ×46, `--green` ×26, `--orange` ×20); its SVG charts use literal hex values and `rx` corners, so they need a JS palette constant. The W02 deck text is already sentence case in the markup and only CSS uppercases it.
4. **I built a prototype outside the repo and it works.** It covers the W01 hub, the hands-on lab and a W02 skin, all running on the proposed `workshop-frame.css`. All three labs ran with no console errors. Card clipping at 1440×900 is fixed. One regression showed up: enlarging W02 labels pushed slide 15 into the footer, and the overflow harness caught it. So W02 type sizes must change one slide at a time with that check.
5. **Constraints the restyle must respect:**
   - Files under `/workshops/<slug>/assets/` are served `immutable` for one year. Never change a file's bytes under the same name there; add new file names instead.
   - Every new or changed binary (woff2, webp, zip, ttf, png, jpg) needs a row in `ASSET_MANIFEST.json`. SVGs do not.
   - W03 files are hash-pinned in `bundle-manifest.json`. Their sources live in `scripts/course03/`, and any W03 change has to go through `refresh-published.mjs`.
   - `builder/source/build.py` no longer reproduces the published `builder.html` (it has no strip and a different `<title>`).
   - Inline event-handler attributes are blocked by the production CSP (`script-src-attr 'none'`).
6. **Bugs found during the audit (fix them as part of the restyle):**
   - The hands-on lab card clips 17–94 px at 1440×900 because the short-viewport breakpoint is `max-height:860px`.
   - Act 3 uses a navy dashboard theme with unreadable text: the footer is `#4f4640` on `#0f2333` (1.74:1), and the metric values are dark on dark.
   - The chart canvas asks for 'Space Mono', which is never loaded.
   - W01 mixes currencies: the lab uses `$`, the case study `EUR`.
   - The case study has no ending: 160 px of blank space after the last section.
   - The hands-on material route sits in the footer, not the header.

## 1. Artifacts produced (all in the scratchpad)

| What | Path |
|---|---|
| Before screenshots of every static page, 1440×900 and 390×844 (fold, full page, scroll steps; hands-on acts 1–3; W02 slides 1–8, 11, 13, 15, 16, 22; W03 slides 1–6 for reference) | `…/scratchpad/static-audit/*.png` |
| Print PDFs (baseline: field card = **1 page A4**, homework = 4 pages) | `…/scratchpad/static-audit/fieldcard.pdf`, `homework.pdf` |
| Prototype frame CSS (the proposal, 199 lines) | `…/scratchpad/proto/workshop-frame.css` |
| Prototype W01 hub (dark globe cover + frame) | `…/scratchpad/proto/ki-prognosen-einschaetzen/hub.html` |
| Prototype hands-on skin (CSS-only, plus palette data) | `…/scratchpad/proto/ki-prognosen-einschaetzen/lib/hands-on-frame.css`, patched `lib/hands-on-acts.js` (constants only), `lib/forecast-lab.js` (font string only) |
| Prototype W02 deck skin | `…/scratchpad/proto/geschaeftsberichte-mit-ki-lesen/lib/deck-frame.css` |
| After screenshots of the prototypes | `…/scratchpad/static-audit/proto/*.png` |
| Screenshot, measurement and verification harnesses | `…/scratchpad/tmp/static-audit.cjs`, `scroll-shots.cjs`, `measure.cjs` (hands-on clipping), `pdfcheck.cjs` (print pages), `deck-overflow.cjs` (per-slide overflow + text below 22 px), `proto-shots.cjs` |

(`…` = `/tmp/claude-0/-home-user-platform/614e303c-f8f0-55ca-be18-13442a9af90b`). One caveat: the mobile W02 files `w02-slide11-m`, `-13-m`, `-16-m` and `-22-m` actually show slide 9. Same-document hash navigation does not reload the deck. The desktop versions of those slides were recaptured with fresh contexts.

## 2. Inventory and structure

### W01 `ki-prognosen-einschaetzen` (5 HTML materials plus a dataset, EN only)

| File | Size | Structure | JS |
|---|---|---|---|
| `hub.html` | 13 KB | strip with route (01 current) → `.stage` hero: kicker, h1, lede, meta, 4 CTA cards (02–05), dataset link, "What you'll learn" panel, 3 "perspectives" footer, disclaimer → `.wf-foot` | strip only |
| `hands-on.html` | 25 KB | strip without route → `.shell` grid: `.bar` (title, `#progress` rail, `#jump` 1/2/3) → `main` with 3 `section.act` (eyebrow, h2, `.lead .framework`, `.stage` holding a custom element) → `footer.hint` (prev/next, act count, **route `.wf-mats` sits here**, licence line) | inline act controller + `lib/forecast-lab.js` (35 KB) + `lib/hands-on-acts.js` (72 KB) |
| `case-study/index.html` | 143 KB, of which about 2,250 lines are inline CSS (652 selectors, many duplicated: `.s2-zoom svg.chart` ×4, `#systemMap` ×4, `.footer` ×3 …) and about 810 lines inline JS | strip → `.read-progress` → `main.paper` with `header.hero` plus 11 `section.section.screen.*` (s1 system map … s11 monitor), 13 SVG charts drawn by JS → `#toTop` → `.wf-foot` | 13 `render*()` functions, reveal-on-scroll, progress bar |
| `field-card.html` | 16 KB | strip → `main.wrap` > `header.mast` (h1, print button, sparkline) → `.grid` (CSS columns: 2) of 7 `section.sec` (tables, formulas, rules) → footnote | print button |
| `homework.html` | 16 KB | strip → `main.wrap` (measure 760) > mast, 5-pillar table, 3 `.tier` cards (DO / STRETCH / CHALLENGE), self-check table, pointers | strip only |
| `lib/tokens.css` | 1.1 KB | fonts 400 and 700 plus JetBrains var; `:root` Das Ö; `*{border-radius:0!important}`; `h1–h6{font-weight:700!important}` | |
| `lib/wf.css` | 3.1 KB | the shared strip block (byte-identical to W03's inline copies, md5 `6eb190dd…`) | |
| `data/demand-weekly.csv`, `make-demand-series.py` | | linked from the hub, the take-home and the Next.js detail page | |
| assets | | `favicon.svg`, `lockup-horizontal.svg`, fonts `Typing-Regular/Bold.woff2`, `JetBrainsMono-var.woff2`, OFL notices. **Missing for the W03 language: Typing 500/600, `globe.svg`, `lockup-horizontal-dark.svg`** | |

### W02 `geschaeftsberichte-mit-ki-lesen` (one deck, 22 slides, EN)

| File | Size | Notes |
|---|---|---|
| `slides.html` | 105 KB | head: `tokens.css`, `deck.css`, `deck-viz.css`, `deck-stage.js`, `deck-viz.js`, then an inline `<style>` (cover `cv-*`, bio, `rl-*` red-line rail, `kit-*`, `grd-*`, `open-app`, `pc-*`, report link). Body: `.wf-skip` → `main` → `<deck-stage id="stage">` with 22 `section.slide` (`dark` cover, one `cream`, one `kupfer` closing slide) → inline controller script. **288 inline `style=""` attributes (60 with font-size), 137 `--d` rise delays** |
| `lib/tokens.css` | 3.4 KB | Das Ö v5.2, legacy `--kupfer*` aliases → Mennige; `--card:#E5E4E2` (Beton); a `.dark-section` inversion; an OS dark-mode inversion (`prefers-color-scheme:dark` unless `data-theme=light`, which the deck sets); dot background on `body` |
| `lib/deck.css` | 17.8 KB | slide shell, chrome, type utilities, `d-card`, chips, prompt card, steps, KPI, iconlist, rise motion, Claude `.mock`, messages, bars, verdict, cycling word, reduced-motion and print rules |
| `lib/deck-viz.css`/`.js` | 3 KB / 5 KB | report page stack, `viz-rank` (slide 11), `viz-ncr` (slide 15); the JS writes inline styles (caption uppercase mono, chip colours) |
| `lib/deck-stage.js` | 27.5 KB | generic deck component (shadow DOM: black pill overlay with `border-radius:999px`, tap zones, toast, portrait hint), language-aware workshop URL (`window.NW_WORKSHOP_URL`) |
| assets | | globe (dark-ready, identical bytes to W03's), dark lockup, 4 Typing woff2 weights, JetBrains var, report `.webp` p01–p04 and p08, Meta logo, portrait |

### W03 pages that carry the shared strip

`guide.html` (26 KB), `demo.html` (135 KB) and `builder.html` (255 KB) inline the same strip block, the same strip script and the same `.wf-foot`. **Their authoritative sources are `scripts/course03/guide.html`, `scripts/course03/demo/demo.html` and `scripts/course03/builder/page/builder.html`** (currently byte-identical to the published files). The deck (`slides.html`, `presenter.html`, `lib/*`) has no strip.

## 3. CSS architecture and cascade gotchas

* **W01 has two token layers with an inverted order in one file.**
  * `hub`, `hands-on`, `field-card` and `homework` put the inline `<style>` with an old palette (`--paper:#F5F2EA`, `--rust:#C2410C`, `--blue:#0866FF`, system fonts, radii) **before** `<link lib/tokens.css>`. tokens.css therefore wins for the shared names (`--paper`, `--ink`, `--ink-soft`, `--line`, `--rust`, `--rust-dk`, `--sans`, `--mono`), while page-only names keep the old values: `--card:#FFF`, `--faint`, `--line-strong`, `--blue`, `--ok`, `--amber`, `--red`, `--paper-2`. `*{border-radius:0!important}` in tokens.css silently squares all the 5–8 px radii.
  * `case-study/index.html` links tokens.css **before** its inline `<style>`, so the inline `:root` wins: `--paper:#ffffff` (the card colour), `--bg:#f3f0e9`, `--blue:#0b66e4`, `--green`, `--orange`, `--red`, `--yellow`, `--shadow`, `--radius:8px`. **Editing tokens.css alone will not reskin the case study.**
  * `hands-on.html` has a third layer: `body.dark` (navy theme for act 3) and `body[data-company=…]` accents at body specificity, which beat `:root`.
* **The shared strip block** (`wf-` comment "Keep this block byte-identical") is W01 `lib/wf.css` = W03 inline × 3 (md5 identical). It hard-codes hex values rather than tokens, so it works standalone. The strip script is also identical (guide.html differs only in the lines that follow). W02 has only `.wf-skip` and the deck chrome brand link.
* **W02** uses a clean token file plus component CSS, but sizes are literal px in `deck.css` and in 60 inline styles. There is no type-scale token layer, which is exactly what W03 has (`--t-display 104`, `--t-h1 60`, `--t-h2 40`, `--t-lead 32`, `--t-body 26`, `--t-label 26`, `--t-small 24`, `--t-chrome 22`).
* **Injected CSS**: `hands-on-acts.js` appends `<style id="hs-acts-css">` at runtime, after every head stylesheet, and `forecast-lab.js` appends its unused `.fl-*` UI sheet (Space Grotesk / Space Mono, `#F23005`). Page overrides must therefore be **more specific** (`.act .hs …`), not merely later.

## 4. What looks brutalist or risograph, and what already matches the W03 deck

Legend: ✗ off-language (fix), ~ partly, ✓ already matches.

| Surface | Brutalist / riso / generic (✗) | Already W03-like (✓/~) |
|---|---|---|
| Shared strip (all) | ✗ boxed 1 px ink tabs with Mennige mono numbers and black-filled current tab (reads as a row of stickers); ✗ hairline stops at 1200 px instead of running full width | ✓ paper ground, lockup, ink text, focus ring in Mennige, 44 px targets, language swap, route order |
| W01 hub | ✗ dot-grid background; ✗ white `#fff` cards; ✗ uppercase mono kicker with `.13em` tracking; ✗ hover lift `translateY(-4px)` plus underline sweep; ~ faded forecast chart that collides with the footer on mobile | ✓ h1 with one Mennige word, ✓ hairline list "What you'll learn", ✓ one accent |
| W01 hands-on | ✗ graph-paper background; ✗ **blue** `#245CFF` controls, lines and slider glow; teal, gold and red semantic colours; ✗ **navy dark act 3** (a dashboard theme, not the brand); ✗ gradient tints in verdicts and "AI advantage"; ✗ glow pulse on the hot button; confetti; ✗ mono uppercase everywhere (11 px, `.12–.14em`); ✗ rounded pills (8 px card, 50 % slider thumb) | ~ paper cards, ✓ the fixed-layout "one card per act" idea, ✓ reduced-motion handling |
| W01 case study | ✗ generic SaaS dashboard: white shadowed cards (`0 18px 50px`), 8 px top Mennige bar, coloured 3 px section tops (blue/green), blue kickers, **rounded SVG pills (`rx 12/13`) that CSS cannot square**, team colours red/orange/blue, dark code card, dotted connector between sections, fixed progress bar | ~ big editorial h2s, ✓ strong narrative sequence, ✓ direct labelling on charts |
| W01 field card | ✗ dot background; ✗ offset `3px 3px 0` print button; ✗ solid Mennige numbered squares; ✗ pink tints (`.formula`, `.rule`, `code`); ✗ 3 px Mennige rule under the masthead | ✓ one-page A4 print design, ✓ tables with hairlines, ✓ column layout |
| W01 homework | ✗ dot background; ✗ `.tier` 3 px Mennige top plus soft shadow; ✗ solid Mennige "DO/STRETCH/CHALLENGE" badges; ✗ pink `.aha`; ✗ dashed beige dataset box | ✓ reading measure 760, ✓ hairline tables, ✓ tiered structure (good pedagogy) |
| W02 deck | ✗ `.mock` **`box-shadow:10px 10px 0`**; ✗ report hover `14px 14px 0`; ✗ full-bleed Mennige last slide (`.slide.kupfer`); ✗ Mennige-filled route squares `.rl-sq` and "YOU FILL THIS" flags; ✗ pastel ghost bars (slide 15); ✗ 3 px Mennige top borders on every card type (`kit-head`, `kit-tile.fill`, `grd-sheet`, `prompt-card`, `cr-card`); ✗ `.overline` mono `.3em` caps in Mennige; ✗ chrome 11 px mono `.22em` caps; ✗ 566 text elements below 22 px; ✗ black pill overlay (`999px`, from a generic deck template) | ✓ **dark globe cover** (same asset and crop as W03), ✓ Mennige word in headlines, ✓ hairline tables (`grd-table`, `mtable`), ✓ outline chips, ✓ rise motion with reduced-motion and print fallbacks |
| W03 guide/demo/builder (web) | ✗ **offset ink shadows** (`3px`, `5px`, `6px`, `8px`), ✗ 3 px ink rules, ✗ mono uppercase eyebrows, ✗ tight h1 tracking `-.045em` | ✓ W03 tokens copied inline, ✓ Matches/Doesn't-match stamps with hatch, ✓ Beton notes, ✓ no dot backgrounds |
| W03 deck (reference) | none | ✓ everything below |

**Uppercase and colour counts** (a proxy for "shouting" and palette sprawl): case study 38 `text-transform:uppercase` and 51 distinct hex values; hands-on page 7 + 40 (+10 + 24 in the widget JS); W02 `deck.css` 12 + 5, `slides.html` 12 + 5; W03 `story.css` **1 + 3**.

## 5. The W03 deck language, reduced to rules a web page can follow

Extracted from `datenbereitschaft-fuer-ki/lib/tokens.css`, `lib/story.css`, `lib/scenes/cover.css`, `lib/cover-globe.css` and the deck-stage toolbar:

1. **Palette**: Kalkweiß `#f3f0e9` (every ground), Papier `#f2f1ee` (cards, always with an outline), Beton `#e5e4e2` (quiet bands, code), Leinen `#d4cec5` (hairlines and chart grid only, never text), Druckschwarz `#121212` (text, outlines, the fail state), Schiefer `#4f4640` and `#655c54` (secondary text and captions), **Mennige `#b73a15` = "look here now", one element group per step, never good or bad**, Graphit `#141414` (cover only), Pass `#205b46` (only "Matches", always with an icon and a word). Contrast checked: ink/paper 16.5, slate 8.1, slate-soft 5.7, Mennige 5.1, pass 7.0. **Mennige on graphit is 3.18 and fails as text**, so on dark use `#e07050` (5.8) or `#f2c6b6` (11.9) for accent words and keep Mennige for bars.
2. **Type**: Typing for all words (400/500/600/700), JetBrains Mono only for code and data literals. Labels are **sentence case, weight 600, tracking `.06em`**, never tracked caps. Headlines are 700 with tracking `-.01`…`-.015em`. **Legibility floor**: 26 px body and 22 px chrome on 1920. For the web: 17–18 px body, 14 px labels, 13 px absolute minimum.
3. **Lines**: 3 px ink outlines on focal objects at 1920 (≈2 px on the web), 1 px Leinen hairlines for structure, 2 px ink under table headers. A focused card = outline plus an **8 px left bar** (ink, or Mennige when it is the focus). No shadows, no gradients, no radii.
4. **Encoding**: one encoding everywhere. Hatch = wrong (export tables), solid ink = right (approved views), slate = the database check or truth. Mennige marks the thing being discussed.
5. **Structure**: a small chrome (mark plus title) and the **Route** (square stations; past = filled, current = larger filled, future = outlined; dashed or solid connectors). Titles sit in fixed zones, and each step reveals one idea.
6. **Cover**: graphit ground, the globe bled off the right edge at `opacity .34` under the type, the lockup plus a co-brand word, a display title in Papier, the question card (dark variant) with a Mennige left bar, and a meta line in Leinen.
7. **Controls**: a light square toolbar (48 px, 2 px ink border, Mennige-deep on hover, 3 px Mennige focus ring), hidden until the pointer nears it.

## 6. JS and DOM contracts: what a restyle must not break

### Shared strip (all materials except the decks)
* The script queries the **first** `.wf-strip` and reads `data-wf-slug`. It needs `.wf-back-main`, `.wf-back-alt` and `.wf-brand` inside it, with both back links as **siblings** (it swaps them with `insertBefore`, rewrites class, `lang`, `hreflang` and text in German mode, and sets the brand href to `/workshops`). It uses `sessionStorage['wf-lang']`.
* The second IIFE takes the **first** `.wf-mats` and its `[aria-current=page]` link, scrolls the current tab into view, and writes `data-more="l|r|lr"`, which the CSS uses for edge masks. On `hands-on.html` the only `.wf-mats` is the one in the footer.
* Commit `6f2617a` deliberately avoids building any href from DOM values. Keep it that way.

### W01 `hands-on.html` inline controller
* It needs `section.act` with `data-mode` (`dark` toggles `body.dark`), `data-company` (copied to `body[data-company]`) and `data-short` (step label), plus the IDs `#progress`, `#jump`, `#act-count`, `#prev-act` and `#next-act`.
* It generates `.step` divs (classes `done`/`current`) and jump buttons (class `current`, `aria-current="step"`).
* On every change it dispatches `window resize` and `document slidechange`. The keyboard handler ignores interactive targets. Keys 1–3 jump.

### W01 `lib/hands-on-acts.js` (the three custom elements)
* `<hs-race>`, `<hs-buffer-run>` and `<hs-trust-loop>` activate via `this.closest(".act")` plus `.classList.contains("active")`. They re-check on `slidechange` and resize on `resize`. **Keep the elements inside `.act` sections and keep the `active` class name.**
* It injects `#hs-acts-css` once. Every UI colour flows through `.hs{--blue --ink --sub --line --paper --soft --rust --red --teal --green --gold --olive}` (line 83), except literal rgba tints and shadows at lines 85–166.
* Canvas colours come from `FL.C` (= `window.FL_PALETTE`, set in `hands-on.html` line 358 **before** the script tag) and from constants: `BLUE/INK/SUB/LINE/PAPER/SOFT/RUST/RED/TEAL/GREEN/GOLD/OLIVE` (line 78), the literal `#8b867c` (lines 361 and 505), `rgba("#245CFF",…)` (lines 541, 814, 815), and the act 3 `DK` palette (line 853) with literals at lines 1102, 1120 and 1130. `haloText` uses a hard-coded halo `rgba(255,253,247,.92)` (line 311).
* `hs-trust-loop` **forces `this.classList.add("dark")`** (line 859).
* Racer fills, confetti and the gate/mode/strip state classes (`pass/review/hold`, `ok/over/miss`, `warn/good/accent`, `data-tone`, `data-on`, `data-alarm`) are the state API. Style them, never rename them.
* The document event `hs:result` is emitted, but nothing listens today.

### W01 `lib/forecast-lab.js`
* `window.FL` exposes `Chart` (canvas renderer) and more. The injected `.fl-*` UI CSS is unused by this page. Canvas axis fonts are `'Space Mono'` (lines 366, 370, 379, 399), which is never loaded, so the axes fall back to the system mono.

### W01 case study
* The chart hosts are identified by ID and must stay SVG elements with CSS-driven size, because every renderer measures `getBoundingClientRect()`: `#systemMap`, `#systemFocusChart`, `#storeDataChart`, `#deadlineChart`, `#fleetChart`, `#overUnderChart`, `#modelWapeChart`, `#calendarChart`, `#pipelineChart`, `#backtestChart`, `#sdmForecastChart`, `#sdmStoreChart` and `#driftChart`. Captions `#s4xDeadlineCap` and `#s4xFleetCap` are written by JS.
* The reveal logic needs `.paper > .section` and `.paper > .hero` as **direct children**, and uses the classes `reveal-on`, `reveal-in` and `show` (to-top). Also used: `.read-progress > span` and `#toTop`. Charts re-render on `load`, `resize` and each reveal.
* The SVG classes styled from CSS are `.sm-*`, `.axis`, `.gridline`, `.label` and `.anno`. The team colours are JS literals.

### W01 field card and homework
* Field card: only `#print-card` is used by script. The `@page A4` and `@media print` block must stay **one page** (verified baseline, `fieldcard.pdf` = 1 page).

### W02 deck
* **`deck-stage.js`**:
  * `<deck-stage id="stage" width="1920" height="1080">`, with slides as direct `section.slide` children.
  * It sets `data-deck-active`, `data-deck-slide` and `data-screen-label`, reads the `#speaker-notes` JSON, and uses `localStorage deck-stage:slide:<path>`, `sessionStorage wf-lang` and `window.NW_WORKSHOP_URL`.
  * It emits `slidechange`, handles key navigation and prints one slide per page.
  * The overlay, toast and portrait hint live in its **shadow DOM**, so page CSS cannot reach them. Restyle them in the component's `stylesheet` string.
* **`slides.html` controller**:
  * It builds `.chrome` inside every slide (`.chrome__topline`, `.chrome__topbar a.brand .markdot`, `.chrome__footer .fleft .mini-rule .page`) and rewrites `a[href="/en/workshops/geschaeftsberichte-mit-ki-lesen"]`.
  * Copy buttons: `.prompt-card .pc-copy`, `.pc-body`, and `.pc-lead b` for the aria-label. The labels "Copied" and "Select it", the class `.done` and `.sr-live` are also used.
  * Per-slide FX:
    * `[data-rise]` with `--d`
    * `[data-mock]` with `.msg.user`, `.dotsline`, `.msg.claude:not(.dotsline)`, `.reveal.on`, `[data-type]` and `.type-caret`
    * `.bar i[data-w]`
    * `[data-count][data-decimals]`
    * `.cycling .word.lit`
    * `DeckViz.play/reset`
  * Hash navigation uses `#N`.
* **`deck-viz.js`**: `[data-viz="tension"|"ncr"]` slots use `.vr-row.hot`, `.vr-fill[data-w]` and `.nc-bar[data-h]`. It writes inline `cssText` (lines 37 and 45: an uppercase mono caption and chip colours), which **CSS cannot override** without `!important`.

### Production CSP
Static workshop documents get the nonce-free policy (`script-src 'self' 'unsafe-inline'`, **`script-src-attr 'none'`**, `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`). Inline `<script>` and `<style>` are fine. **Inline `onclick=` attributes are not.** No external fonts or CDNs.

## 7. Tests, pipelines, caching and hash pins

| Check | What it pins | Impact of a restyle |
|---|---|---|
| `src/lib/workshops-static-links.test.ts` | no `href` ending in `/` in any `public/workshops/**/*.html` | keep file links such as `case-study/index.html` |
| `src/lib/workshops.test.ts` "references materials that exist" | every catalog href exists on disk (`hub.html`, `hands-on.html`, `case-study/index.html`, `field-card.html`, `homework.html`, `data/demand-weekly.csv`, `slides.html`, `northwind-analyst-kit.zip`) | **no renames or moves** without updating `src/lib/workshops.ts` DE+EN |
| `src/lib/workshops-data-readiness.test.ts` | W03: `bundle-manifest.json` sizes and sha256 of **every** published file; the file set must equal the manifest; every relative `src`/`href`/`url()` in W03 HTML and CSS must resolve; host portrait on slide 2 | any W03 edit must regenerate `bundle-manifest.json` via `node scripts/course03/refresh-published.mjs` (it also rewrites W03's `ASSET_MANIFEST.json` rows and the kit zip) |
| `scripts/__tests__/course03-publication.test.mjs` "published ZIP, manifests and repository-authored files are up to date" | the `refresh-published --check` drift, overrides for exported files | W03 deck/lib edits need `node scripts/course03/overrides.mjs capture`. **A new W03 file (for example `lib/workshop-frame.css`) is rejected as "unreviewed public file"** unless `isRepositoryAuthored()` (`scripts/course03/overrides.mjs` line 44) and the `authored` map in `refresh-published.mjs` are extended |
| `scripts/course03/builder/source/build.py` | regenerates `builder/page/builder.html` from `page.css`, `body.html` and `app.js` | ⚠ **already drifted**: its template has no strip and `<title>Builder guide</title>`, while the published page has the strip and `Data Readiness for AI · Builder guide · loehrning.ai`. Re-running it would silently drop the strip. Fix the template before touching the builder |
| `tests/e2e/workshops.spec.ts` | W03 guide text "Reveal the explanation" plus link "Open the interactive course"; readiness-lab IDs `#sim-*`, `#simulation-grade`, `#status`; W02 zip | keep those strings and IDs |
| `tests/e2e/route-workshops-locales.spec.ts`, `workshop-hydration.spec.ts`, `a11y.spec.ts`, `learning-density.spec.ts`, `route-matrix.spec.ts`, `lighthouserc.json` | the **Next.js detail pages** only (material counts: W01 = 6 including the CSV) | not affected by static restyles. **Gap: nothing tests the static materials themselves** (axe, console errors, overflow, strip swap) |
| `src/lib/crawl/contract.test.ts`, `src/proxy.behavior.test.ts` | cache policy: `/workshops/:slug/:path*` = `public, max-age=3600`; **`/workshops/:slug/assets/:path*` = `public, max-age=31536000, immutable`** | ⚠ never change bytes of an existing file under `assets/`; add new names (for example `globe.svg` copied into W01 is new there, which is fine). Put shared CSS and JS in `lib/` (revalidates hourly) |
| `ASSET_MANIFEST.json` plus `bun scripts/verify-artifact-assets.ts` and the `scan-export.mjs` platform profile | sha256 and size for every **binary** (`woff2`, `ttf`, `webp`, `png`, `jpg`, `zip` …, see `export-denylist.mjs` `BINARY_ASSET_EXTENSIONS`); "missing from manifest" and "stale entry" both fail. **SVG is not a binary** (W02 `globe.svg` has no row, which is legal) | adding `Typing-Medium.woff2` and `Typing-SemiBold.woff2` to W01 requires 2 new rows (copy the W02 rows: same sha `c67df698…` and `47338939…`, same size, license `OFL-1.1`). Regenerating `card-preview.webp` or the zips updates rows |
| `scripts/open-source/__tests__/zip-inspection.test.mjs`, `northwind-kit-security.test.mjs` | W02 zip content | only if the zip changes |

**Currently hash-pinned workshop binaries** (ASSET_MANIFEST.json, 39 workshop rows):
* W01: `assets/favicon.svg`, `assets/fonts/JetBrainsMono-var.woff2`, `Typing-Bold.woff2`, `Typing-Regular.woff2`, `assets/lockup-horizontal.svg`, `card-preview.webp`.
* W02: `favicon.svg`, JetBrains var, Typing Bold/Medium/Regular/SemiBold, `lockup-horizontal-dark.svg`, `meta-platforms-logo.svg`, `report/northwind-p01–p04,p08.webp`, `tim-loehr.jpg`, `card-preview.webp`, `northwind-analyst-kit.zip`.
* W03: favicon, JetBrains Static 400/700 (same bytes as JetBrains var), Typing Static 400–700 TTF, Typing Regular/Medium/Bold woff2, `globe.svg`, both lockups, `mark-black.svg`, `tim-loehr.jpg`, `card-preview.webp`, `data-readiness-kit.zip`.
* All HTML, CSS and JS in all three folders is **not** in ASSET_MANIFEST. Only W03's is pinned, by `bundle-manifest.json`.

Fonts are byte-identical across folders (the md5 of each Typing weight matches `packages/website/src/fonts/typing/*`), so copying a weight between folders is safe and cheap.

## 8. Bugs found during the audit

1. **Hands-on card clipping at 1440×900.** The `.stage` height is 578 px, but the content is 595, 672 or 642 px (acts 1–3), so the verdict or note is cut off. Cause: `html,body{overflow:hidden}`, and the short-viewport fallback (`@media (min-width:901px) and (max-height:860px)`, line 214) does not fire at 900 px, while the strip (69 px) plus the footer hint (164 px) take 233 px. Fix: a threshold of `max-height:980px` (verified in the prototype: 606/606, 686/686, 636/636).
2. **Act 3 contrast.** The footer licence line is `#4f4640` on `#0f2333` (1.74:1). The "minutes to detection" value is dark on navy. The mobile canvas labels overlap ("RELEASE GATE … within tolerance"). The strip stays paper above a navy page.
3. **Canvas fonts**: `'Space Mono'` is not loaded (see forecast-lab.js above). Use `'JetBrains Mono'`, and redraw after `document.fonts.ready`.
4. **Currencies**: the hands-on lab and field card use `$`, the case study uses `k EUR`. Pick one per workshop (EUR fits a German-first site).
5. **The case study has no ending**: after section 11 there are about 160 px of empty `.paper` padding and no recap or next step.
6. **Hands-on navigation**: the material route sits in the footer, so the header strip has no route and the page is inconsistent with the other four materials.
7. **`builder/source/build.py` drift** (§7).
8. W02: 566 text elements below 22 px on the 1920 canvas (§10). The chrome text is 11 px uppercase at `.22em`, roughly 8 px on a 1440 laptop.

## 9. Proposal: `lib/workshop-frame.css`

### 9.1 Distribution (one source, byte-identical copies, drift test)
* Source of truth: `scripts/workshops/workshop-frame.css` (new). A tiny `scripts/workshops/sync-frame.mjs [--check]` copies it to `packages/website/public/workshops/<slug>/lib/workshop-frame.css` for W01, W02 and W04.
* For **W03**, add `lib/workshop-frame.css` to `isRepositoryAuthored()` and to the `authored` map in `refresh-published.mjs` (reading from the same source), then run `refresh-published.mjs` so `bundle-manifest.json` is regenerated.
* Add `src/lib/workshops-frame.test.ts` (vitest). It asserts that:
  * every `public/workshops/*/lib/workshop-frame.css` is byte-equal to the source;
  * every material HTML (`hub`, `hands-on`, `case-study/index`, `field-card`, `homework`, `guide`, `demo`, `builder`, and W04's) links it;
  * no workshop HTML/CSS/JS contains `box-shadow:` with a non-zero offset, `radial-gradient(circle at 1px 1px`, or `text-transform:uppercase` outside an allow-list. These are the style lint rules for "no brutalist regressions".
* **No `url()` in the frame** except `data:`, so it resolves in every folder and passes the W03 "every local dependency resolves" test. `@font-face` stays in each folder's `lib/tokens.css` (the folders ship different font file names).
* Optionally move the two strip IIFEs into `lib/workshop-frame.js` (identical copies, same drift test), to delete 12 duplicated lines per page. This is not required for the restyle.
* **Markup is unchanged** for the strip and footer, so the existing script and e2e expectations hold. The frame only adds `wf-*` component classes for page bodies. All tokens are prefixed `--wf-*` so they can never collide with page tokens such as `--card`, `--line` or `--muted`, which mean different things in W01 and W02.

### 9.2 What the frame contains
* **Tokens:** the W03 palette as `--wf-*`, plus `--wf-mennige-on-dark #e07050` for accent text on graphit, fonts, layout (`--wf-max/gutter/measure/h1-*`, same names as today), a web type scale with a 13 px floor, lines (`--wf-hair` 1 px Leinen, `--wf-rule` 1 px ink, `--wf-edge` 2 px ink, `--wf-bar` 4 px), motion, and the hatch as a data URI.
* **Strip (same markup):**
  * The hairline runs full width via inline padding, so the content still aligns to 1200 px.
  * The **material route** replaces the boxed chips: square stations (outlined = other material, filled = current, larger), sentence case, 48 px targets, a 3 px ink underline on the current item, and hover in Mennige-deep.
  * Back links are plain; the edge masks are unchanged.
* **Typography:** `.wf-page`, `.wf-wrap`, `.wf-kicker` (sentence-case label, 600, `.02em`), `.wf-h1` (+`--hero`), `.wf-h2`, `.wf-h3`, `.wf-lead`, `.wf-meta`, `.wf-small`, `.wf-accent`, `.wf-section`.
* **Cards:** `.wf-card` is quiet (papier plus hairline). `a.wf-card` has an arrow nudge on hover and no lift. **`.wf-card--focus`** is the question-card pattern (2 px ink plus a 4 px Mennige bar), at most once per view. Also `.wf-grid`, `.wf-note` (+`--focus`) with a bar and no tint, and `.wf-steps` (numbered hairline list).
* **Tables:** `.wf-table` has no outer box, sentence-case 600 slate headers over a 2 px ink rule, 1 px Leinen row rules, mono tabular `.num`, and `tr.is-focus` in Mennige.
* **Buttons:** `.wf-btn` (2 px ink, 44 px, no shadow) and `--primary` (ink fill, hover Mennige-deep), plus disabled and focus rings.
* **Stamps and numbers:** `.wf-stamp` (+`--pass` with a word, `--fail` with a hatch swatch), `.wf-num` (label / value / **scope line required**), `.wf-code` (Beton plus an ink bar, mono 14 px).
* **Dark cover with globe:** `.wf-cover`, `.wf-cover__globe` (right bleed, opacity .34, **left-edge mask** because the globe raster has a visible rectangle edge), `.wf-cover__body`, and on-dark variants of kicker, lead, meta, focus card and buttons. On mobile the globe drops below at .22 opacity.
* **Chart classes** for SVG (`.wf-chart-grid/axis/truth/model/base/focus`), with the same hexes documented for canvas.
* **Media:** mobile, reduced motion, and print (strip and footer hidden, cover printed white).

### 9.3 The file (as prototyped and verified, `…/scratchpad/proto/workshop-frame.css`)

```css
/* workshop-frame.css · loehrning.ai workshop family frame (Das Ö v5.3, web scale).
   One byte-identical copy per workshop folder at lib/workshop-frame.css. Source of truth:
   scripts/workshops/workshop-frame.css (sync + drift check). No url() except data: URIs, so every
   copy resolves in every folder; @font-face stays in each folder's lib/tokens.css.
   Language (from the Workshop 03 deck): paper ground, ink type and outlines, Leinen hairlines,
   ONE Mennige accent meaning "look here now", Typing for words, JetBrains Mono for code only.
   No shadows, no gradients, no dot/grid backgrounds, no tinted fills, no uppercase tracking. */

/* ------------------------------------------------------------------ tokens */
:root{
  --wf-paper:#f3f0e9;   /* Kalkweiß: page ground */
  --wf-papier:#f2f1ee;  /* Papier: cards, question card */
  --wf-beton:#e5e4e2;   /* Beton: code, quiet bands */
  --wf-leinen:#d4cec5;  /* Leinen: hairlines + chart grid only (never text) */
  --wf-ink:#121212;     /* Druckschwarz: text, outlines, the "fail" state */
  --wf-slate:#4f4640;   /* secondary text (8.1:1 on paper) */
  --wf-slate-soft:#655c54; /* captions, axis labels (5.7:1) */
  --wf-mennige:#b73a15; /* the one accent (5.1:1 on paper) */
  --wf-mennige-deep:#97300f; /* hover/pressed */
  --wf-graphit:#141414; /* cover ground only */
  --wf-on-dark:#f2f1ee; --wf-on-dark-soft:#d4cec5;
  --wf-mennige-on-dark:#e07050; /* accent TEXT on graphit (5.8:1); bars may stay --wf-mennige */
  --wf-pass:#205b46;    /* "matches / passes" only, always with an icon + word */

  --wf-sans:"Typing",system-ui,-apple-system,"Segoe UI",sans-serif;
  --wf-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,monospace;

  /* layout (kept from the shared strip so existing pages do not move) */
  --wf-max:1200px; --wf-gutter:clamp(16px,4vw,40px); --wf-measure:760px;
  --wf-h1-hero:clamp(40px,5.4vw,68px); --wf-h1-doc:clamp(32px,4vw,48px);

  /* type scale: legibility floor 13px; labels are sentence case, never tracked caps */
  --wf-t-lead:clamp(18px,1.45vw,21px); --wf-t-body:17px; --wf-t-small:14px; --wf-t-label:14px;
  --wf-t-h2:clamp(24px,2.6vw,32px); --wf-t-h3:19px; --wf-t-num:clamp(28px,3vw,40px);

  /* lines */
  --wf-hair:1px solid var(--wf-leinen); --wf-rule:1px solid var(--wf-ink); --wf-edge:2px solid var(--wf-ink);
  --wf-bar:4px; /* left bar of a focused card */

  /* motion (W03 spec B.7) */
  --wf-ease:cubic-bezier(.16,1,.3,1); --wf-fade:200ms;

  /* 45° hatch = "wrong / fail" encoding, same as the W03 deck */
  --wf-hatch:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M-2.5 2.5l5-5M0 10L10 0M7.5 12.5l5-5' stroke='%23121212' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E");
}

/* ------------------------------------------------------------------ skip link */
.wf-skip{position:absolute;left:8px;top:-60px;z-index:100;background:var(--wf-ink);color:var(--wf-on-dark);padding:12px 16px;font:600 15px/1.2 var(--wf-sans);text-decoration:none}
.wf-skip:focus{top:8px}

/* ------------------------------------------------------------------ top strip (markup unchanged)
   header.wf-strip[data-wf-slug] > a.wf-brand + nav.wf-back(.wf-back-main,.wf-back-alt) + nav.wf-mats
   The strip script swaps .wf-back-main/.wf-back-alt and sets data-more on .wf-mats. */
.wf-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 24px;box-sizing:border-box;
  max-width:none;margin:0;padding:10px max(var(--wf-gutter),calc((100% - var(--wf-max)) / 2 + var(--wf-gutter))) 0;
  border-bottom:var(--wf-hair);background:var(--wf-paper);color:var(--wf-ink);font:400 15px/1.3 var(--wf-sans);position:relative;z-index:5}
.wf-brand{display:inline-flex;align-items:center;min-height:44px}
.wf-brand img{display:block;width:164px;height:auto}
.wf-back{display:flex;flex-wrap:wrap;align-items:center;gap:0 16px}
.wf-back a{display:inline-flex;align-items:center;min-height:44px;color:var(--wf-ink);text-decoration:none;font-weight:600}
.wf-back a:hover{color:var(--wf-mennige-deep);text-decoration:underline;text-underline-offset:4px}
.wf-back-alt{font-weight:400!important;color:var(--wf-slate)!important}

/* material route: the W03 deck's Route (square stations) instead of boxed chips */
.wf-mats{flex-basis:100%;display:flex;gap:0;overflow-x:auto;scrollbar-width:none;margin:0 0 -1px;padding:0;
  scroll-padding-inline:16px;scroll-snap-type:x proximity}
.wf-mats::-webkit-scrollbar{display:none}
.wf-mats[data-more="r"]{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 48px),transparent)}
.wf-mats[data-more="l"]{-webkit-mask-image:linear-gradient(90deg,transparent,#000 48px);mask-image:linear-gradient(90deg,transparent,#000 48px)}
.wf-mats[data-more="lr"]{-webkit-mask-image:linear-gradient(90deg,transparent,#000 48px,#000 calc(100% - 48px),transparent);mask-image:linear-gradient(90deg,transparent,#000 48px,#000 calc(100% - 48px),transparent)}
.wf-mats a{position:relative;display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 20px 0 0;margin-right:4px;
  color:var(--wf-slate);text-decoration:none;white-space:nowrap;font-weight:500;border-bottom:3px solid transparent;scroll-snap-align:start;
  transition:color var(--wf-fade) var(--wf-ease),border-color var(--wf-fade) var(--wf-ease)}
.wf-mats a::before{content:"";flex:none;width:10px;height:10px;border:2px solid var(--wf-ink);background:var(--wf-papier)}
.wf-mats a span{font:500 13px/1 var(--wf-mono);color:var(--wf-slate-soft);letter-spacing:0}
.wf-mats a:hover{color:var(--wf-ink)}
.wf-mats a:hover::before{border-color:var(--wf-mennige-deep)}
.wf-mats a[aria-current="page"]{color:var(--wf-ink);font-weight:700;border-bottom-color:var(--wf-ink)}
.wf-mats a[aria-current="page"]::before{width:12px;height:12px;background:var(--wf-ink)}
.wf-mats a[aria-current="page"] span{color:var(--wf-ink)}
.wf-strip a:focus-visible,.wf-mats a:focus-visible,.wf-foot a:focus-visible,.wf-skip:focus-visible{outline:3px solid var(--wf-mennige);outline-offset:2px}

/* ------------------------------------------------------------------ footer */
.wf-foot{box-sizing:border-box;max-width:var(--wf-max);margin:64px auto 0;padding:20px var(--wf-gutter) 32px;border-top:var(--wf-hair);color:var(--wf-slate);font:400 14px/1.5 var(--wf-sans)}
.wf-foot a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.wf-foot a:hover{color:var(--wf-mennige-deep)}

/* ------------------------------------------------------------------ page + type */
.wf-page{background:var(--wf-paper);color:var(--wf-ink);font:400 var(--wf-t-body)/1.6 var(--wf-sans);-webkit-font-smoothing:antialiased}
.wf-wrap{box-sizing:border-box;max-width:var(--wf-max);margin:0 auto;padding:0 var(--wf-gutter)}
.wf-measure{max-width:var(--wf-measure)}
.wf-kicker{display:block;margin:0 0 12px;color:var(--wf-slate);font:600 var(--wf-t-label)/1.35 var(--wf-sans);letter-spacing:.02em}
.wf-kicker b{color:var(--wf-ink);font-weight:700}
.wf-h1{margin:0;font:700 var(--wf-h1-doc)/1.06 var(--wf-sans);letter-spacing:-.015em;text-wrap:balance}
.wf-h1--hero{font-size:var(--wf-h1-hero);line-height:1.02}
.wf-h2{margin:0 0 12px;font:700 var(--wf-t-h2)/1.15 var(--wf-sans);letter-spacing:-.01em;text-wrap:balance}
.wf-h3{margin:0 0 6px;font:700 var(--wf-t-h3)/1.25 var(--wf-sans)}
.wf-lead{margin:16px 0 0;max-width:60ch;color:var(--wf-slate);font:400 var(--wf-t-lead)/1.5 var(--wf-sans)}
.wf-lead b{color:var(--wf-ink);font-weight:600}
.wf-small{color:var(--wf-slate);font-size:var(--wf-t-small);line-height:1.5}
.wf-meta{margin:16px 0 0;color:var(--wf-slate);font:400 15px/1.5 var(--wf-sans)}
.wf-meta b{color:var(--wf-ink);font-weight:600}
.wf-accent{color:var(--wf-mennige)}
.wf-section{margin:56px 0 0;padding-top:24px;border-top:var(--wf-hair)}
.wf-section>.wf-kicker{margin-bottom:8px}
code,.wf-code-inline{font-family:var(--wf-mono);font-size:.9em}

/* ------------------------------------------------------------------ cards
   default: quiet papier + hairline. --focus: the question-card pattern, at most one per view. */
.wf-card{position:relative;display:flex;flex-direction:column;gap:6px;box-sizing:border-box;padding:18px 20px;background:var(--wf-papier);border:var(--wf-hair);color:var(--wf-ink)}
.wf-card p{margin:0;color:var(--wf-slate);font-size:15px;line-height:1.5}
.wf-card--focus{border:var(--wf-edge);padding-left:calc(20px + var(--wf-bar))}
.wf-card--focus::before{content:"";position:absolute;top:-2px;bottom:-2px;left:-2px;width:calc(var(--wf-bar) + 2px);background:var(--wf-mennige)}
a.wf-card{text-decoration:none;transition:border-color var(--wf-fade) var(--wf-ease)}
a.wf-card:hover{border-color:var(--wf-ink)}
a.wf-card .wf-card__title{display:flex;justify-content:space-between;gap:12px;font-weight:700;font-size:17px}
a.wf-card .wf-card__title::after{content:"→";color:var(--wf-slate-soft);transition:transform var(--wf-fade) var(--wf-ease),color var(--wf-fade) var(--wf-ease)}
a.wf-card:hover .wf-card__title::after{color:var(--wf-mennige);transform:translateX(3px)}
.wf-card__n{font:500 13px/1 var(--wf-mono);color:var(--wf-slate-soft)}
.wf-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}

/* callout / note: a bar, no tint */
.wf-note{margin:16px 0;padding:4px 0 4px 18px;border-left:3px solid var(--wf-ink);color:var(--wf-ink)}
.wf-note--focus{border-left-color:var(--wf-mennige)}
.wf-note b{font-weight:700}

/* numbered list with square markers (Route squares) */
.wf-steps{list-style:none;margin:0;padding:0;counter-reset:wf}
.wf-steps>li{counter-increment:wf;display:grid;grid-template-columns:40px 1fr;gap:12px;padding:14px 0;border-top:var(--wf-hair)}
.wf-steps>li::before{content:counter(wf,decimal-leading-zero);font:500 14px/1.6 var(--wf-mono);color:var(--wf-slate-soft)}

/* ------------------------------------------------------------------ tables */
.wf-table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.45}
.wf-table th{padding:0 12px 8px 0;border-bottom:var(--wf-edge);color:var(--wf-slate);font:600 var(--wf-t-label)/1.3 var(--wf-sans);text-align:left;vertical-align:bottom}
.wf-table td{padding:10px 12px 10px 0;border-bottom:var(--wf-hair);vertical-align:top}
.wf-table .num,.wf-table td.num{font-family:var(--wf-mono);font-feature-settings:"tnum" 1;text-align:right}
.wf-table tr.is-focus td{color:var(--wf-mennige);font-weight:600}

/* ------------------------------------------------------------------ buttons */
.wf-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:44px;padding:10px 18px;box-sizing:border-box;
  border:var(--wf-edge);background:var(--wf-paper);color:var(--wf-ink);font:600 15px/1.2 var(--wf-sans);text-decoration:none;cursor:pointer;
  transition:background-color var(--wf-fade) var(--wf-ease),color var(--wf-fade) var(--wf-ease),border-color var(--wf-fade) var(--wf-ease)}
.wf-btn:hover{border-color:var(--wf-mennige-deep);color:var(--wf-mennige-deep)}
.wf-btn--primary{background:var(--wf-ink);color:var(--wf-on-dark)}
.wf-btn--primary:hover{background:var(--wf-mennige-deep);border-color:var(--wf-mennige-deep);color:var(--wf-on-dark)}
.wf-btn[disabled],.wf-btn[aria-disabled="true"]{border-color:var(--wf-leinen);color:var(--wf-slate-soft);background:var(--wf-paper);cursor:default}
.wf-btn:focus-visible{outline:3px solid var(--wf-mennige);outline-offset:2px}

/* stamp (grade chip): the ONLY coloured state is pass, and it carries a word */
.wf-stamp{display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;border:var(--wf-edge);font:600 14px/1 var(--wf-sans);white-space:nowrap}
.wf-stamp--pass{color:var(--wf-pass);border-color:var(--wf-pass)}
.wf-stamp--fail::before{content:"";width:14px;height:14px;border:1.5px solid var(--wf-ink);background:var(--wf-papier) var(--wf-hatch)}

/* big number: never without its scope line */
.wf-num{display:grid;gap:2px}
.wf-num__label{color:var(--wf-slate);font-size:var(--wf-t-small)}
.wf-num__value{font:700 var(--wf-t-num)/1.05 var(--wf-sans);font-feature-settings:"tnum" 1}
.wf-num__scope{color:var(--wf-slate);font-size:var(--wf-t-small)}

/* code */
.wf-code{margin:12px 0;padding:14px 16px;background:var(--wf-beton);border-left:3px solid var(--wf-ink);font:400 14px/1.55 var(--wf-mono);white-space:pre-wrap;overflow-wrap:anywhere}

/* ------------------------------------------------------------------ dark cover with the globe
   <section class="wf-cover"><div class="wf-cover__globe" aria-hidden="true"><img src="assets/globe.svg" alt=""></div>
   <div class="wf-wrap wf-cover__body">…</div></section> */
.wf-cover{position:relative;overflow:hidden;isolation:isolate;background:var(--wf-graphit);color:var(--wf-on-dark)}
.wf-cover__globe{position:absolute;z-index:-1;top:50%;right:max(-300px,-22vw);width:min(1100px,92vw);opacity:.34;transform:translateY(-50%);pointer-events:none;user-select:none}
.wf-cover__globe img{display:block;width:100%;height:auto}
/* the globe raster has a hard left edge: fade it so no rectangle shows on wide screens */
.wf-cover__globe{-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%);mask-image:linear-gradient(90deg,transparent,#000 22%)}
.wf-cover__body{padding-top:clamp(40px,7vh,88px);padding-bottom:clamp(40px,7vh,88px)}
.wf-cover .wf-kicker{color:var(--wf-on-dark-soft)}
.wf-cover .wf-h1{color:var(--wf-on-dark)}
.wf-cover .wf-accent{color:var(--wf-mennige-on-dark)}
.wf-cover .wf-lead,.wf-cover .wf-meta{color:var(--wf-on-dark-soft)}
.wf-cover .wf-lead b,.wf-cover .wf-meta b{color:var(--wf-on-dark)}
.wf-cover .wf-card--focus{background:var(--wf-graphit);border-color:var(--wf-on-dark);color:var(--wf-on-dark)}
.wf-cover .wf-card--focus p{color:var(--wf-on-dark-soft)}
.wf-cover .wf-btn{background:transparent;border-color:var(--wf-on-dark);color:var(--wf-on-dark)}
.wf-cover .wf-btn:hover{border-color:var(--wf-mennige-on-dark);color:var(--wf-mennige-on-dark)}
.wf-cover .wf-btn--primary{background:var(--wf-on-dark);color:var(--wf-ink);border-color:var(--wf-on-dark)}
.wf-cover .wf-btn--primary:hover{background:var(--wf-mennige);border-color:var(--wf-mennige);color:var(--wf-on-dark)}
.wf-cover a:focus-visible,.wf-cover .wf-btn:focus-visible{outline-color:var(--wf-mennige-on-dark)}
@media (max-width:700px){.wf-cover__globe{top:auto;bottom:-18%;right:-40%;width:130%;transform:none;opacity:.22}}

/* ------------------------------------------------------------------ chart tokens (SVG classes; canvas reads the same hexes)
   truth/actual = slate-soft, model/AI = ink, baseline/manual = ink dashed, focus = Mennige, grid = Leinen, wrong = hatch */
.wf-chart-grid{stroke:var(--wf-leinen);stroke-width:1}
.wf-chart-axis{fill:var(--wf-slate-soft);font:400 13px var(--wf-sans)}
.wf-chart-truth{stroke:var(--wf-slate-soft);fill:none}
.wf-chart-model{stroke:var(--wf-ink);fill:none;stroke-width:2.5}
.wf-chart-base{stroke:var(--wf-ink);fill:none;stroke-width:1.5;stroke-dasharray:6 5}
.wf-chart-focus{stroke:var(--wf-mennige);fill:var(--wf-mennige)}

/* ------------------------------------------------------------------ media */
@media (max-width:600px){.wf-brand img{width:136px}.wf-strip{font-size:14px}.wf-mats a{padding-right:14px}}
@media (prefers-reduced-motion:reduce){.wf-mats a,.wf-btn,a.wf-card,a.wf-card .wf-card__title::after{transition:none}}
@media print{.wf-skip,.wf-strip,.wf-foot{display:none!important}.wf-cover{background:#fff;color:var(--wf-ink)}.wf-cover__globe{display:none}
  .wf-cover .wf-h1,.wf-cover .wf-kicker,.wf-cover .wf-lead{color:var(--wf-ink)}}
```

### 9.4 Canvas / SVG palette mapping (for JS constants and `FL_PALETTE`)

| Role | Old | New | Rule |
|---|---|---|---|
| Actual / truth series | `C.ink #080809` (W01), `#15171a` (case) | `#121212` (solid) or `#655c54` when the model is ink | truth = slate or ink, never an accent |
| Model / AI line (the thing we discuss) | `C.blue #245CFF`, `#0b66e4` | **`#b73a15`** Mennige (dashed kept) | the one "look here" series per chart |
| Baseline / manual rule | `#8b867c` dashed | `#655c54` dashed | |
| Pass / on target / promo caught | teal `#0b8f99`, green `#167a5b` | `#205b46` **plus a word** | only semantic colour |
| Miss / breach / alarm | red `#d11f1f`, `#c93434` | ink with hatch, or Mennige when it is the focal event | never two Mennige groups per view |
| Review / caution | gold `#c8952d` | slate `#4f4640`, dashed outline | |
| Over-forecast vs under-forecast | orange `#d56f18` vs red | slate-soft solid vs hatch (+ label) | |
| Grid / bands | `rgba(8,8,9,.06)`, blue tints | `rgba(18,18,18,.07)`, `#e5e4e2` | no blue tints |
| Label halo | `rgba(255,253,247,.92)` | `rgba(242,241,238,.94)` | |
| Dark act palette `DK` | navy set | light set: `bg #f2f1ee, ink #121212, sub #4f4640, line #d4cec5, blue #b73a15, cyan #655c54, red #121212, gold #4f4640, teal #205b46` | graphit is for covers only |
| SVG corners | `rx: 12/13` | `0` (or remove) | CSS `border-radius` does not apply to SVG `rx` |

## 10. Verification harness results (baseline versus prototype)

`node …/tmp/deck-overflow.cjs <slides.html URL>` steps every slide at 1920×1080. It reports text that crosses the chrome footer band or the right margin, and counts text elements below 22 px.

* Baseline W02: **0 overflows**; text below 22 px per slide: 10, 24, 27, 34, 24, 33, 4, 60, 16, 12, 25, 46, 51, 43, 22, 39, 20, 11, 28, 13, 21, 3 (**566 total**). The worst slides are 8 (The data, 60), 13 (Prompt 3, 51), 12 (Prompt 2, 46) and 14 (Prompt 4, 43).
* Prototype skin, where `.label-mono` went from 11 to 17 px: **slide 15 overflows** ("CRAFT defects: 24 in August…" lands on the footer at y=1016). This proves that type changes must go slide by slide.
* Hands-on prototype at 1440×900 and 390×844: all three acts ran their primary action ("Run shadow replay", "Run same demand", "Viral creator spike") with **no page errors or console errors**, and `.stage` client height equals scroll height (no clipping) on desktop.
* Field card print baseline: 1 page (keep this as an assertion).

## 11. Per-file change lists

### 11.1 W01 `ki-prognosen-einschaetzen`

**New files and assets**
- `lib/workshop-frame.css` (copy from source). **Delete `lib/wf.css`** after all five pages switch their `<link>` (its rules are superseded one to one by the frame).
- `assets/fonts/Typing-Medium.woff2` and `Typing-SemiBold.woff2`: copy from W02 and **add 2 ASSET_MANIFEST rows** (same sha and size as W02's rows, path changed).
- `assets/globe.svg` and `assets/lockup-horizontal-dark.svg`: copy from W02/W03 (SVG, no manifest row required; adding rows is optional hygiene). These are new names under `assets/`, so the immutable cache is fine.

**`lib/tokens.css`**
- Add `@font-face` for 500 and 600.
- Remove nothing. Optionally alias the old names to frame tokens (`--rust:var(--wf-mennige)`…).

**`hub.html` (rewrite the body, keep the head meta, strip, footer and script)**
- Remove the inline old palette and the `.stage`, `.bgfx`, `.cta` and `.panel` styles, the dot background and the `translateY` hover.
- New structure (prototype `proto/…/hub.html`, screenshots `proto/hub-d.png` and `hub-m.png`):
  - a `.wf-cover` with the globe, kicker, hero h1 with one accent word, lede, meta, two buttons, and one `.wf-card--focus` question card;
  - a paper body: four `a.wf-card` materials (02–05) plus the dataset link, a `.wf-table` of the three lenses with the disclaimer, and `.wf-steps` "What you will be able to do".
- Keep every href: `./hands-on.html`, `./case-study/index.html`, `./field-card.html`, `./homework.html`, `./data/demand-weekly.csv` (with `download`).

**`hands-on.html` (skin, plus one layout fix)**
- `<link lib/workshop-frame.css>` replaces `wf.css`.
- Add a page skin block (prototype `proto/…/lib/hands-on-frame.css`; either inline it or ship it as `lib/hands-on-frame.css`). Selectors are `.act .hs …` because the widget CSS is injected later.
- Remove the grid backgrounds and the `body.dark` navy set. Set `body[data-company]` accents to ink. Turn `.eyebrow`, `.case-mark`, `.fw b` and `.hint` into sentence-case labels. Make `.fw-ai` a Mennige bar with no gradient. Turn `.step` into Route stations, with the jump buttons as 1 px ink squares.
- Act 3 `data-mode="dark"` → `"light"` (line 322).
- `FL_PALETTE` (line 358) → the §9.4 values.
- The short-viewport media query threshold goes from `860px` to `980px` (line 214).
- Move the `.wf-mats` route from `footer.hint` into the header strip. The script picks the first `.wf-mats`, so leave only one.
- Keep all IDs, `section.act`, `data-short`, `data-company`, the `.active` class and the keyboard handler.

**`lib/hands-on-acts.js` (data-only edits, no logic)**
- Line 78: constants → the §9.4 values. Better: `var P = Object.assign({…defaults}, window.HS_PALETTE)`, so pages own the palette.
- Line 853 `DK` → the light set. Line 859: keep `classList.add("dark")` (the CSS neutralises it) or delete it.
- Lines 361 and 505 `#8b867c` → `#655c54`. Lines 541, 814 and 815 `rgba("#245CFF",…)` → ink alpha. Lines 1102, 1120 and 1130 `rgba(126,189,255,…)` and `rgba(238,246,255,…)` → ink alpha. Line 311 halo → papier.
- Optionally delete the confetti and the `hsInvite` glow pulse (a hot button becomes a 3 px Mennige outline in CSS).
- Replace the canvas `ui-monospace` fonts with `"JetBrains Mono",ui-monospace,monospace`.
- Refinement after the prototype: act 2 shows three Mennige groups (the Logistics line, the verdict bar and a warn metric). Demote the warn metrics to ink hatch so there is **one Mennige group per view**.

**`lib/forecast-lab.js`**
- Lines 366, 370, 379 and 399: `'Space Mono'` → `'JetBrains Mono'`.
- Optionally stop injecting the unused `.fl-*` CSS on this page.

**`case-study/index.html` (largest; do it in two passes)**
- **Pass A (CSS tokens, low risk):**
  - Remap the inline `:root` (lines 10–24): `--ink #121212`, `--muted #4f4640`, `--line #d4cec5`, `--paper #f2f1ee`, `--bg #f3f0e9`, `--blue #121212`, `--green #205b46`, `--orange #655c54`, `--red #b73a15`, `--yellow #d4cec5`, `--shadow none`, `--radius 0`.
  - Remove the graph-paper `body` background (line 35), the `.hero-main::before` 8 px bar (line 72), the coloured section tops (`.section.s11-monitor{border-top:3px solid var(--green)}` etc.) and the `.paper > .section::before` connector.
  - Sections become paper blocks separated by `--wf-hair`, with only chart `.panel`s as papier cards.
  - `.kicker`, `.s2-kicker`, `.s1-kicker`, `.cs-eyebrow` and `.brand` become sentence case in slate. The dark `.code-card` becomes `.wf-code` style.
  - `.to-top` is square and outlined. `.read-progress` becomes 2 px ink.
  - While there, collapse the duplicated selector blocks (the later block wins today, so merge the later values).
- **Pass B (JS charts):**
  - Add `const PAL = {ink:'#121212', slate:'#4f4640', soft:'#655c54', line:'#d4cec5', papier:'#f2f1ee', beton:'#e5e4e2', focus:'#b73a15', pass:'#205b46'}` at the top of the script (line 2677).
  - Replace the literals `#c93434`×20, `#0b66e4`×16, `#15171a`×16, `#d56f18`×7, `#167a5b`×4, the greys and the tints according to §9.4. Set `rx: 12/13` → 0 (lines 2741, 2747, 2786, 2797, 3142 …).
  - System map: all team nodes are papier with an ink outline, and only SDM gets the Mennige focus outline. Update the legend chips in the markup (`.s1-chip .mk`, and the `.s2z-dot` inline `style="background:var(--red)"`).
- Keep all 13 chart IDs, `.paper > .section/.hero` as direct children, and the reveal and progress classes.
- **Add a closing section** (recap plus the decision rule plus links to the field card and take-home) so the page ends with a next step.
- Unify the currency with the lab.

**`field-card.html`**
- Link the frame. Remove the dot background and the pink tints (`code`, `.formula`, `.rule`) in favour of Beton or no fill with an ink or Mennige bar.
- `.sec h2 .n`: solid Mennige square → mono number in slate (or a Route square).
- `header.mast` bottom rule: 3 px Mennige → 2 px ink.
- `.print-btn` → `.wf-btn wf-btn--primary` (no offset shadow). Keep `id="print-card"`.
- The ★ mindset card uses `.wf-card--focus`, which is the one Mennige bar on the page.
- **Keep the print block and re-run `pdfcheck.cjs`: must stay 1 page.**

**`homework.html`**
- Link the frame. Remove the dot background, the `.tier` shadow and 3 px Mennige top, the solid badges and the pink `.aha`.
- `.tier` → `.wf-card`, with its level as a `.wf-kicker` ("Do · 15 min", "Stretch · 45 min", "Challenge · open").
- `.aha` → `.wf-note--focus`, `.dataset` → `.wf-note`, tables → `.wf-table`, `h2.sec` → `.wf-kicker` plus a hairline.
- Keep the anchors and links.

**`card-preview.webp`**
- Regenerate only if the hub or cover design is used for the card. That means an updated ASSET_MANIFEST row, and the Next.js page references it by the same name. The file sits at the folder root, not under `assets/`, so it revalidates hourly.

### 11.2 W02 `geschaeftsberichte-mit-ki-lesen`

**Phase A: skin only (no size changes except the absolutely positioned chrome)**
- Prototype: `proto/…/lib/deck-frame.css`, loaded last. Before merging, fold it into the files below.
- **`lib/tokens.css`**:
  - Remove the `body` dot background.
  - Add the W03 type tokens `--t-*` (unused in Phase A).
  - Add `--mennige-on-dark:#e07050` and use it for `.slide.dark .kupfer-text` (the cover word "Decisions" is currently `--kupfer-light` #F2C6B6, which is fine but pastel; choose one).
- **`lib/deck.css`**:
  - `.chrome__topbar/__footer`: Typing 600 20–22 px, sentence case, slate; the markdot becomes an ink square. The footer title should move out of the JS string into `data-*` so it can be shortened.
  - `.overline`: sentence case, 600, slate, not Mennige (line 98).
  - `.label-mono`: Typing, no caps.
  - `.mock`: **drop `box-shadow`** (line 243) and use a 2 px ink outline on papier.
  - `.slide.kupfer` (line 22) → graphit plus globe, like the cover (add the globe `<div>` to slide 22 in `slides.html`).
  - `.d-card`/`.prompt-card` 3 px Mennige tops → 2 px ink outlines; the Mennige bar is reserved for the one focus card.
  - `.pc-copy`: ink outline, sentence case.
  - `.verdict`: keep the Mennige left bar but switch the background to papier.
  - `.ghost-num`: unused, so delete it.
- **`lib/deck-viz.css`**: `.nc-bar.ghost` → `#655c54` (line 77).
- **`lib/deck-viz.js`**: the caption `cssText` (line 45) drops `text-transform:uppercase` and uses Typing; the chip `cssText` (line 37) needs no change.
- **`slides.html` inline `<style>`**:
  - `a.report-link:hover` shadow (line 150) → none.
  - `.rl-sq` (line 70) → papier with a 3 px ink outline; the current station is ink-filled (the W03 Route).
  - `.kit-flag` → an ink outline stamp, "You fill this".
  - `.kit-head`, `.grd-sum` and `.open-app` keep one Mennige bar each (check one per slide).
  - `.cv-kicker span` and `.grd-kicker` go sentence case.
- Copy fixes where CSS uppercase hid lowercase starts ("the three marked ones…", "read company-backstory.md ✓", "unzip before you open it").
- **`lib/deck-stage.js`**: restyle the shadow-DOM overlay from the black pill (`border-radius:999px`, lines 150–235) to the W03 light toolbar (square 48 px, 2 px ink border, paper, Mennige focus). Keep the logic.
- The chrome's right label duplicates the slide's overline. Replace it with the Route position, or drop it.

**Phase B: type floor, slide by slide**
- Map `.body-lg/md/sm`, `.ph-row`, `.grd-table`, `.kit-desc`, `.bio-*`, the prompt-card body and the 60 inline `font-size` styles to `--t-*` (body 26, small 24, label 22–26, mono 24 for prompts, as on W03 appendix slides).
- Where a slide overflows, **cut copy or split the slide** (slides 8 and 12–16 are dense).
- Gate every slide with `deck-overflow.cjs` (0 overflow) and target 0 elements below 22 px (allow the prompt mono at 22–24 px).
- Report rasters (`assets/report/*.webp`) are content images of a fictional report. Leave them. Changing them means new file names (immutable cache) plus manifest rows.

### 11.3 W03 `guide.html`, `demo.html`, `builder.html` (shared-strip family)

- Edit the **sources** (`scripts/course03/guide.html`, `demo/demo.html`, `builder/page/builder.html`, and fix `builder/source/build.py` plus `page.css` first), then run `node scripts/course03/refresh-published.mjs`, then the vitest W03 suite and `course03-publication.test.mjs`.
- Replace the inline strip block with `<link rel="stylesheet" href="./lib/workshop-frame.css">` (after extending `isRepositoryAuthored` and `authored`), or keep it inline but byte-identical to the new frame section.
- Remove all offset shadows (`box-shadow:3px 3px 0`, `5px`, `6px`, `8px` in guide and demo; in the builder `inset` bars are fine), make eyebrows sentence case, and ease h1 tracking from `-.045em` to `-.015em`.
- Keep the e2e strings ("Reveal the explanation", "Open the interactive course", "Check decision") and the lab IDs.
- The W03 demo rebuild is covered by another workstream. It should adopt `.wf-*` from the start.

### 11.4 W04 (new, ESG)

- Start from `workshop-frame.css`, W03 `tokens.css` and the W03 deck scaffolding.
- Materials: at minimum a hub with a globe cover. Every binary asset needs an ASSET_MANIFEST row. Do not use inline `on*` attributes (CSP).
- Add W04 to the frame drift test and to `src/lib/workshops.ts` (DE+EN), so the "materials exist" test covers it.

## 12. Verification checklist for the implementing agent

1. `git diff --stat` touches only the intended files. Nothing under `…/assets/` changes bytes in place.
2. `bun run --cwd packages/website vitest run src/lib/workshops*.test.ts src/lib/crawl/contract.test.ts`, plus `node --test scripts/__tests__/course03-publication.test.mjs`, plus `bun scripts/verify-artifact-assets.ts` (or `bun run artifact-assets:check`) and the scan-export platform profile if CI runs it.
3. The Playwright smoke run over every static material at 1440×900, 1280×800 and 390×844 (adapt `…/tmp/static-audit.cjs`) must show:
   * no `pageerror` or console errors;
   * no horizontal overflow;
   * hands-on `.stage` client height equals scroll height in all acts, with each act's primary action clicked;
   * the strip language swap works (visit from `/workshops/ki-prognosen-einschaetzen`, expect "← Zurück zum Workshop" first);
   * `.wf-mats [aria-current]` is visible.
4. W02: `deck-overflow.cjs` shows 0 overflow on all 22 slides. Copy buttons still copy (click `.pc-copy`, expect the text "Copied"). The `#N` hash deep links land on the right slide. Print preview gives 22 pages.
5. The field card prints to 1 A4 page.
6. Contrast: no text token pair below 4.5:1 (Leinen is never text; Mennige text only on light grounds).
7. Grep gates (put them in the new frame test): no `box-shadow:\s*\d+px \d+px 0`, no `radial-gradient(circle at 1px 1px`, no `#245CFF|#0b66e4|#0f2333`, and no `'Space Mono'` in any workshop folder.

## 13. Phasing and effort (suggested)

| Phase | Work | Risk | Effort |
|---|---|---|---|
| 0 | Frame source, sync script, drift and grep test; W01 fonts and assets plus manifest rows | low | S |
| 1 | Strip and footer switch to the frame in W01 (5 pages) and W03 (3 sources plus refresh) | low: markup unchanged | S |
| 2 | W01 hub rewrite (cover), field card, homework | low | M |
| 3 | Hands-on skin, palette data, clipping fix, route into the header | medium: canvas colours | M |
| 4 | Case-study pass A (tokens/CSS), then pass B (chart palette constant, `rx`, legend, closing section) | medium: 13 charts, visual review of each | L |
| 5 | W02 phase A skin (plus deck-stage toolbar) | low | M |
| 6 | W02 phase B type floor, slide by slide with the overflow gate | medium to high: density | L |
