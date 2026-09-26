# Workshop 03 deck engine: map and authoring guide for a Workshop 04 deck

Scope: `packages/website/public/workshops/datenbereitschaft-fuer-ki/` (Workshop 03, "Data Readiness for AI"), compared with Workshop 02 (`geschaeftsberichte-mit-ki-lesen/`), the security headers applied to static `/workshops/**` files, the external-export regime in `scripts/course03/`, and the asset/licensing gates. Ends with a verified 4-slide skeleton for Workshop 04 ("ESG Reporting with AI: From Raw Inputs to Clearer Insights").

Nothing inside `/home/user/platform` was modified. Everything built for this report lives in `scratchpad/deck-skeleton/`.

---

## 0. TL;DR (decision-relevant)

1. **The engine can be reused. W04 should copy it into its own folder, not link to W03.** The engine is 3 generic files: `lib/deck-stage.js` (the `<deck-stage>` shell: scaling, keys, touch, hash, toolbar, print), `lib/deck-runtime.js` (step engine, route bar, motion, presenter sync) and `lib/presenter.js` + `presenter.html` + `lib/presenter.css` (console). The styles are `lib/tokens.css` + `lib/story.css` + `lib/cover-globe.css` + one `lib/scenes/<id>.css` per slide. Everything else is 03 content: `replay-data.js`, `model-capture-data.js`, `demo-adapter.js`, `presenter-notes.js`, `scenes/*.js`, and the 27 `scenes/*.css` files.
2. **Copying the files unchanged runs, but shows the wrong things. Tested (phase A):**
   - the header bar shows 03's title ("Data Readiness for AI") and 03's six route stations. Both are hard-coded in `deck-runtime.js`.
   - 03's speaker notes leak into W04, because both decks use the note key `cover`.
   - one uncaught `TypeError`, because `deck-runtime.js` requires `window.FoldlineDemo` (the 03 evidence adapter).
   - `presenter.html` shows "× Brainster" and "target 75:00". `cover.css` adds "× Brainster" through `::after`.
   - all localStorage, BroadcastChannel and window names use the shared `foldline-deck:*` / `foldline-presenter` namespace. On the same origin this makes W03 and W04 **share the presenter timer** (`foldline-deck:timer:v1`) and **hijack each other's console window**.
3. **Minimal patches, verified in phase B and phase C:**
   - rename the namespace (`sed s/foldline-deck/<slug>-deck/; s/foldline-presenter/<slug>-presenter/` across deck-stage.js, deck-runtime.js and presenter.js)
   - make the route stations and title configurable through `<deck-stage data-route-stations="A|B|C" data-deck-title="…">` (4 small edits)
   - optional-chain `window.FoldlineDemo` (2 edits)
   - derive the presenter clock target from the sum of `data-seconds`
   - fix the presenter title and eyebrow
   - delete the Brainster `::after`
   - write a new `presenter-notes.js`

   Result: 0 console errors, 0 page errors, 0 failed requests, 0 CSP violations under the production header set.
4. **Fonts: the 03 look depends on "Typing v2.1" (the `Typing-Static-*.ttf` files, 2937 glyphs, "horizontal scaling, spacing and vertical metrics changed").** The site's own `src/fonts/typing/*.woff2` is **Typing v2.0**, a narrower cut with 416 glyphs. Swapping it in makes a 60 px title about 7 % narrower (891.8 px vs 956 px) and re-wraps text, with 3–4 % of pixels differing per slide. Converting the v2.1 `.ttf` files to woff2 with fontTools loses nothing: **0 differing pixels** on 3 of 4 slides, and cuts the size from 1.66 MB to 575 KB. Both fonts are OFL-1.1 (Inter derivative; JetBrains Mono).
5. **CSP (enforced on every `/workshops/**` response):**
   - allowed: `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` only in dev), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`, `font-src 'self' data:`, `connect-src 'self'`
   - blocked: `script-src-attr 'none'` (no `onclick=` attributes), `frame-src 'none'` and `frame-ancestors 'none'` + `X-Frame-Options: DENY` (the deck cannot be iframed, not even by the site; link to it), `object-src 'none'`
   - `Cross-Origin-Opener-Policy: same-origin` still lets the presenter pairing work (verified)

   Inline `<script>` and `<style>` are therefore allowed today. W03 still uses none, and W04 should keep it that way (see §7).
6. **Gates W04 must pass:**
   - every binary (`.ttf .woff2 .jpg .png .webp .zip` …) in git needs an `ASSET_MANIFEST.json` row with exact `sizeBytes` + `sha256` + owner/source/license/redistribution (`bun run scan:public`). SVG, HTML, MD and TXT *may* be listed and are then hash-checked.
   - stale rows fail.
   - **PDF, XLSX, DOCX and PPTX files fail the platform scan outright**. This matters for an ESG kit: ship CSV or Markdown instead of sample PDFs.
   - no `href` in static HTML may end in `/`.
   - the files must be named `slides.html` and `presenter.html`, because the pairing code checks both paths.
7. **Do not edit W03's `lib/` to share it.** `bun run test:course03-publication` asserts that every change to a W03 exported file is recorded as an override (`node scripts/course03/overrides.mjs capture`). The repository-authored W03 pages (`guide.html`, `builder.html`, **`demo.html`**) are generated from `scripts/course03/…` sources by `refresh-published.mjs`. Edit those sources, not the public copies. This matters for whoever rebuilds the W03 demo.

---

## 1. Workshop 03 inventory

| File | Bytes | Role | Generic or 03-specific |
|---|---:|---|---|
| `slides.html` | 180,348 | 27 `<section class="slide">` inside `<deck-stage id="stage">`, an inline SVG icon sprite (32 `i-*` symbols + 4 `iso-*`), 26 scene stylesheet links, 6 external scripts. **No inline `<script>` or `<style>`** (only `style="--order:N"` / `style="left:…"` attributes). | content |
| `presenter.html` | 9,026 | Console markup. | generic, except 3 strings |
| `lib/deck-stage.js` | 48,944 | `<deck-stage>` custom element (shadow DOM): 1920×1080 canvas scaled with `transform: scale()`, slot visibility, keys, touch, hash deep links, position restore, appendix return, toolbar + progress rail, notices, rotate hint, back guard, fullscreen, print layout, `window.open("./presenter.html")`. | generic (namespace strings only) |
| `lib/deck-runtime.js` | 64,958 | Step engine, route chrome (`.story-chrome`), motion primitives (`countUp`, `drawIn`, `travel`, CSS classes), `Story.register` API, `Story.chart.bars`, evidence facade (`data-ev`, `data-live-check`), authenticated presenter sync (postMessage handshake + HMAC-signed BroadcastChannel/localStorage), print/export handling. | generic, except `ROUTE_STATIONS`, `ROUTE_LABEL_TITLE`, the namespace and the hard dependency on `window.FoldlineDemo` |
| `lib/presenter.js` | 52,362 | Console logic: pairing, heartbeat, clock + pace, notes rendering (say / sayAt / ask / revealOrder / cut / appendixRoutes), vote card, scene jump, reset confirms, clicker keys. | generic, except `WORKSHOP_TARGET_SECONDS = 75*60`, a fallback title and the namespace |
| `lib/presenter.css` | 18,781 | Console styles. | generic (verbatim) |
| `lib/presenter-notes.js` | 69,978 | `window.FOLDLINE_PRESENTER_NOTES = {<noteKey>: {...}}`, "Generated from facilitator/speaker-notes.json" (external source). | 03 content |
| `lib/tokens.css` | 3,855 | `@font-face` (Typing v2.1 `.ttf` 400/500/600/700; JetBrains Mono woff2 declared as 400 and 700 from one variable file), palette tokens (`--paper #f3f0e9`, `--papier`, `--beton`, `--leinen`, `--ink #121212`, `--slate`, `--mennige #b73a15` = the one accent, `--graphit #141414` cover ground, `--pass #205b46`), motion tokens (`--m-fade 200ms` … `--m-travel 700ms`, `--m-stagger 80ms`, easing curves), `* { border-radius: 0 !important }`. | generic |
| `lib/story.css` | 30,176 | Type scale (display 104, h1 60, body 26 … min 26 px for room text), 8 px spacing, canvas zones, step visibility rules, chrome + route, the component library, motion keyframes, reduced-motion/static/print rules, the cover globe crop, placeholder scene styles, one `#appendix-fix` block. | generic (the `#appendix-fix` block is harmless) |
| `lib/cover-globe.css` | 269 | `.workshop-globe` base. | generic |
| `lib/scenes/*.css` (27) | 1.4–11.5 K | One per scene; every selector is prefixed `#<scene-id>`. `cover.css` adds the `× Brainster` co-brand through `::after`. | 03 content; `cover.css` is reusable after deleting the `::after` |
| `lib/scenes/failure-anatomy.js`, `resolution.js` | ~2.9 K | `Story.register(id, {render})`: chart geometry from the sealed record. | 03 content (pattern reusable) |
| `lib/replay-data.js`, `lib/model-capture-data.js` | 37 K, 24 K | `window.FOLDLINE_REPLAY`, `window.FOLDLINE_MODEL_CAPTURES` (recorded AI runs + DB checks). | 03 only |
| `lib/demo-adapter.js` | 17,490 | `window.FoldlineDemo` (EventTarget; replay/live evidence adapter). | 03 only |
| `assets/fonts/` | | `Typing-Static-{400,500,600,700}.ttf` (408–417 KB each), `Typing-{Regular,Medium,Bold}.woff2` (site v2.0 copies, used by guide/demo/builder), `JetBrainsMono-Static-{400,700}.woff2` (**byte-identical copies** of one variable font, sha `2c32b9b3…`), `OFL-1.1.txt`, `OFL-1.1-JetBrainsMono.txt`. | shared |
| `assets/globe.svg` | 158,411 | Cover globe (identical to W02's). | brand, reusable |
| `assets/lockup-horizontal-dark.svg`, `lockup-horizontal.svg`, `mark-black.svg`, `favicon.svg` | | Lockups, route-chrome mark, favicon. | brand, reusable |
| `assets/tim-loehr.jpg` | 112,101 | Host portrait (re-used from W02 with W02's asset record). | reuse only with the W02 record |
| `guide.html`, `demo.html`, `builder.html`, `data-readiness-kit*`, `bundle-manifest.json`, `card-preview.webp`, `PUBLICATION.md` | | Learner surfaces; generated or checked by `scripts/course03/*`. | 03 only |

Scripts load in this order in W03: `deck-stage.js` in `<head>` (so the element upgrades while the scenes are parsed), then at the end of `<body>`: `model-capture-data.js`, `replay-data.js`, `demo-adapter.js`, `deck-runtime.js`, then the scene scripts.

---

## 2. How the engine works

### 2.1 `<deck-stage>` (lib/deck-stage.js)
- **Canvas.** Scenes are the slotted children `section.slide`. All stay mounted; the inactive ones get `visibility:hidden; opacity:0; inert; aria-hidden`. The canvas is `width`×`height` (default 1920×1080) scaled to fit, with the letterbox in paper colour, or dark when the active slide has class `dark`, through `:host([data-dark])`.
- **Boot.** On DOMContentLoaded the first scene is chosen once, in this order: the hash `#<id>/<step>`; then `?resume=1` (localStorage position); then, on reload or back/forward, the sessionStorage position; otherwise the cover.
- **Keys (the deck binds only five):**

  | Key | Action |
  |---|---|
  | `→` | next press |
  | `←` | previous press |
  | `R` then `R` within 1.5 s | full reset to the cover |
  | `P` | open or focus the presenter window |
  | `Esc` | leave the appendix |

  Space, Enter, Home, End, F, PgUp and PgDn are deliberately unbound on the deck (the console binds them for clickers). Held keys (`event.repeat`) are ignored.
- **Touch.** A swipe moves one press. A tap on the right or left third moves one press forward or back. A tap in the middle or the bottom 140 px shows the toolbar. The toolbar has progress text such as `03 / 04 · 2 / 2` and a rail with one segment per main scene. It shows only when the pointer is in the bottom band, so a projector stays clean while you present from the keyboard.
- **URL parameters.**

  | Parameter | Effect |
  |---|---|
  | `#<id>/<step>` | deep link, rewritten on every press |
  | `?resume=1` | restore the last position |
  | `?export=final` | every scene at its final step; toolbar hidden; presses only change scene |
  | `?motion=full\|reduced\|static` | overrides the OS reduced-motion setting |
- **Appendix.** Scenes with `data-kind="appendix"` sit after the main path. A forward press never walks from the last main scene into the appendix. Entering the appendix from a main scene remembers that scene and its step; `Esc` or the return button goes back there.
- **Back guard.** After the first press, one browser Back stays inside the deck and asks for a second Back.
- **Print.** A generated `@page { size: 1920px 1080px; margin:0 }` and print rules lay every slide out as one page.
- **Events.** It emits `slidechange`, `fragmentrequest`, `fragmentreset` and `deckreset` (the runtime listens) and accepts `deckcommand` from the runtime's presenter relay.
- **Presenter.** `openPresenter()` calls `window.open("./presenter.html", "foldline-presenter", "width=1180,height=820")`.
- **Rotate hint.** On phones in portrait it links to `./guide.html`, so **ship a `guide.html` or change the link**.

### 2.2 Step engine (lib/deck-runtime.js)
- **What is visible depends only on the scene and its step.**
- **Step count.** `stepTotal = max(data-step, data-step-until − 1)` over the scene. `Story.register(id, {steps})` overrides it.
- **Visibility.** An element is visible when `step ≥ data-step` (default 0) and `step < data-step-until` (default ∞). Hidden elements get `.is-step-hidden` (`visibility:hidden; opacity:0 !important`), `inert` and `aria-hidden="true"`; an `aria-hidden="true"` you authored is kept.
- **Flash prevention.** `deck-stage.js` sets `html[data-story="pending"]` immediately, and `story.css` hides every `[data-step]` until the runtime sets `ready`. Without JS nothing is hidden, so the final meaning stays on the page. **Risk:** if `deck-runtime.js` fails to load while `deck-stage.js` works, future steps stay hidden.
- **How a scene is entered.** A forward press enters at step 0. A backward press enters at the last step (verified: `←` from `#compare/0` → `#raw-inputs/3`). Jumps (hash, presenter goto, reset) enter at the requested step or 0.
- **Written state.** On every render the runtime writes `data-step-current`, `data-step-total`, `data-reached="1 2 …"`, `data-step-final` (boolean) and `data-entry`. Scene CSS can key on them; W03 uses `#the-arc[data-step-current="0"] #the-arc-path {…}`.
- **Motion.** Only a *forward single press with full motion* animates. The elements animated are those with `data-motion` (or `data-count`) whose nearest `[data-step]` ancestor-or-self equals the new step; elements without `data-step` animate on scene entry. A press during motion snaps every running animation to its end first; no press is ever queued.
- **Scene JS.** One IIFE per scene: `Story.register("<id>", { steps?, render(ctx), animate(ctx) })`. `ctx` = `{slide, id, motion, q, qa, step, total, previous, direction, entry, signal}`. `render` must be synchronous and idempotent. Load scene scripts after `deck-runtime.js`.
- **03-only features:**
  - `data-ev="capture:…|truth:…|summary:…|corpus:ready-pass|dataset:…"` + `data-format="eur|pct0|int|of:N"` binds authored numbers to the sealed record. A mismatch logs `console.error` and flags the console. Do not use it without a sealed record.
  - `data-live-check="ready:G01 …"` runs background evidence checks through `window.FoldlineDemo`.
- **Reusable helper.** `Story.chart.bars({series,width,height,…})` computes a shared-scale bar layout.

### 2.3 Motion primitives (`data-motion` values)

| Value | Effect | Notes |
|---|---|---|
| `fade` | opacity 200 ms | |
| `rise` | 16 px up + fade, 320 ms | |
| `stamp` | scale 1.3 → 0.96 → 1 | **animates `transform`: do not centre a stamp with `translate`, wrap it** (a bug found and fixed in the skeleton) |
| `wall` | scaleY | |
| `grow` | scaleY from the bottom | `data-axis="x"` → scaleX; `--grow-origin` |
| `merge` | translate from `--merge-x/--merge-y` | |
| `draw` | SVG stroke reveal | lengths measured at runtime; dashed strokes keep their dashes through a temporary mask; `--draw-delay` |
| `count` / `data-count` | 0 → authored number | decimals and thousands separators kept; `data-ev` values only fade |
| `travel` | a packet moves along `data-path="#<scene>-path"` | on arrival `data-target` gets `.is-active`; a trail line follows |

- `--order: 0…4` staggers by `--m-stagger` (80 ms). Any `--m-*` token can be overridden per element (for example `--m-draw: 400ms`).
- Reduced motion: whatever a step reveals only fades; travel becomes a fade of its target.
- Static (`?export=final`) and print: no motion, final states.

### 2.4 Route and arc bar
- **Chrome.** `buildChrome()` appends `<header class="story-chrome">` to every scene whose `data-route` is not `none`. It holds the brand (`assets/mark-black.svg` + the title) and, unless `data-route="hidden"` or the scene is an appendix, an `<ol class="route">` with one station per entry in `ROUTE_STATIONS`.
- **Station state.** The current station is `max(1, data-act)`. Stations before it are `past`, the rest `future`.
- **Progress underline.** The current station's `--progress = (index of the scene among main scenes with the same act + step/total) / scenes in that act`. It animates across scene changes (`seedRoute`), and the square stamps in when the act changes.
- **`data-route` values.**

  | Value | Effect |
  |---|---|
  | `none` | no chrome (the cover) |
  | `hidden` | brand only |
  | `final` | route fades in on the final step (the arc slide in 03) |
  | `shown` | route always visible |

  Appendix scenes show "Appendix · Esc returns to <label>".
- **Layout.** The chrome occupies y 0–88; the title zone starts at y 112.

### 2.5 Presenter pairing and notes
- **Pairing.**
  1. `P` on the deck → `window.open("./presenter.html", "<ns>-presenter")`. The runtime wraps `window.open`, remembers that exact window and sends `pairing-offer`s (0–3.5 s).
  2. The console (whose `window.opener` is the deck) replies `handshake-init`. The deck sends a challenge; the console answers; the deck acks with a fresh random HMAC-SHA256 secret.
  3. After that, state goes over postMessage plus signed BroadcastChannel/localStorage envelopes, and commands come back the same way.
- **Checks.** Commands are checked for an allow-list, a monotonically increasing sequence, a 15 s clock skew, replay IDs and the session ID. Both sides check the peer's path (`/slides.html` ↔ `/presenter.html`), so **keep those file names**. The heartbeat asks for state every second; after 3.5 s without state the console re-handshakes. A reloaded deck broadcasts an unsigned `deck-started` notice, and the console re-pairs.
- **Opened standalone.** The console shows a pairing guide and an "Open the deck in a new tab" button.
- **Clock.** It starts itself on the first forward press away from the scene whose id is **`cover`** (the id is hard-coded), so W04's first slide must have `id="cover"`. The pace pill (early / on time / behind) uses the cumulative `data-seconds`; when behind, it shows the note's `cut`.
- **Notes format.**

  ```
  window.FOLDLINE_PRESENTER_NOTES = { "<data-note-key>": {
    say: [string],
    sayAt: { "<say index>": [steps] },
    ask: [{ at, text, options?, expected?, aloud? }],
    expectedAudience: [string],
    revealOrder: [string per step],
    cut: string,
    appendixRoutes: [sceneId]
  } }
  ```

  The console reads only those 7 fields. `clock`, `mode` and `purpose` are documentary. **`revealOrder` and `cut` are required once an entry exists:** the console calls `richNote.revealOrder.join()`.
  - `ask` items without `aloud` become the on-screen room-vote card at step `at`.
  - `say` lines starting "Must say / Presenter cue / If asked …" are classified.
  - `sayAt` wins; otherwise the text "On press 3" / "Before press 2" is parsed.
  - With no entry for a key, the console shows the section's `data-note` text.

---

## 3. The `<section>` attribute contract

| Attribute | Read by | Meaning | Required? |
|---|---|---|---|
| `class="slide"` | stage | only `section.slide` children are scenes | yes |
| `class="slide dark"` | stage + story.css | dark ground (`--graphit`), dark letterbox | cover |
| `id` | stage, runtime, console | unique; hash deep links `#id/step`; scene CSS/JS prefix; **first scene must be `cover`** (clock auto-start) | yes |
| `data-label` | stage (aria-label, announcements), console | short scene name | yes |
| `data-kind` | stage, runtime, console | `main` (default) or `appendix` | yes |
| `data-act` | runtime | route station, 1-based; `0` = before the route (cover/host/setup) | main scenes |
| `data-route` | runtime | `none` / `hidden` / `final` / `shown` | yes, except when the scene has no chrome |
| `data-section` | console | header line of the console (for example "Raw inputs · three files, one number") | recommended |
| `data-seconds` | runtime → console | time budget; cumulative scene windows, pace, target total. Appendix = `0` | main scenes |
| `data-note-key` | runtime → console | key into `presenter-notes.js` (defaults to `id`) | recommended |
| `data-note` | runtime → console | one-line fallback note | recommended |
| `data-live-check` | runtime | 03 evidence checks; needs `demo-adapter.js` | **omit in W04** |
| `data-track`, `data-design`, `data-cover-pattern`, `data-recovery-seconds` | nothing at runtime | inputs to 03's external build and lint; `data-design="placeholder"` only switches on placeholder CSS | optional, documentary |
| written by the engine | CSS hooks | `data-deck-active`, `data-deck-index`, `data-step-current`, `data-step-total`, `data-step-final`, `data-reached`, `data-entry`, `role`, `aria-*` | never author these |

Attributes on the elements inside a scene:
- `data-step`, `data-step-until`
- `data-motion`, `data-count`, `data-axis`, `data-path`, `data-target`
- `style="--order:N"`
- `data-focus`: a CSS hook; the Mennige left bar on `.q-card` and `.callout` only; add your own rule for other components, as the skeleton does for `.stamp`
- `data-ev` and `data-format` (03 only)
- `data-visual` and `data-allow-overlap`: lint hints for 03's external build only; nothing reads them at runtime

**Canvas zones (1920×1080):**
- chrome: 0–88
- title: `.scene-title` absolutely positioned at y 112, x 96
- content: 224–984
- safe band: 984–1080, left empty for the toolbar
- `.room-vote`: fixed band at y 776–968

Side margin is 96 px (`--margin-x`). Position everything absolutely in section coordinates.

**Components in story.css:**
- `.q-card` (`--dark`, `--hero`)
- `.lane` (`--export` dashed + hatch, `--approved`)
- `.ev-run` / `.ev-db`, `.eq`
- `.chip` (`--pass`, `--fail`, `--gap`)
- `.node` (`__box`, `__label`, `__sub`, `.is-active`, `.is-stack`, `.is-unreachable`, `__badge`)
- `.edge` (`--dashed`, `--active`), `.edge-head`, `.packet`, `.wall`
- `.room-vote` (`__label`, `__q`, `__options`, `__option`)
- `.callout`, `.stamp` (`--pass`), `.bignum`, `.blank`, `.ctable`
- `.chart__*`, `.code`, `.lead`, `.h2`, `.label`, `.small`, `.mono`
- `.icon` (`--32` … `--96`) using `<use href="#i-…">` from the page's inline sprite
- hatch: `var(--hatch)` or `url(#story-hatch)`

---

## 4. Workshop 02 comparison (simpler deck)

W02 (`geschaeftsberichte-mit-ki-lesen/slides.html`, 105 KB) uses its own, older `lib/deck-stage.js` (27.5 KB), with:
- keys ←/→, PgUp/PgDn, Space, Home/End and number keys; R R reset
- a slide counter overlay; scale-to-fit; print
- localStorage position keyed by `location.pathname` (so it cannot collide)
- speaker notes read from a `<script type="application/json" id="speaker-notes">` and posted to the *parent window*

What W02 lacks:
- **a step engine**: no `data-step`; animation is done per slide by `lib/deck-viz.js` (`window.DeckViz.play/reset`) and an inline script
- **a presenter console**
- **a route bar**: the chrome (topbar, footer, `NN / NN`) is stamped into each slide by an **inline `<script>`**, and it has a large **inline `<style>`**

W02 fonts are Typing **v2.0** woff2 (Regular/Medium/SemiBold/Bold) + `JetBrainsMono-var.woff2` with `font-weight: 100 800`.

W03 is the better base: external files only, steps, route bar, console, print and export modes, and accessibility work (live region, focus, inert).

---

## 5. Security headers / CSP on static `/workshops/**` files

Source: `packages/website/next.config.ts` → `headers()` → `source: "/:path*"` → `buildSecurityHeaders()` in `packages/website/security-headers.ts`. Live check against the dev server on `/workshops/datenbereitschaft-fuer-ki/slides.html` and `lib/deck-stage.js`:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src-attr 'none';
  style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; media-src 'self'; manifest-src 'self';
  connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
cache-control: public, max-age=3600, s-maxage=3600      (html/js/css under /workshops/:slug/)
```

- `'unsafe-eval'` appears only when `NODE_ENV=development`. Production also adds `upgrade-insecure-requests`, and Sentry/Supabase/Turnstile origins where configured.
- **Inline `<script>`: allowed** (`'unsafe-inline'`). **Inline `<style>`, `style=""` attributes and JS-inserted `<style>`: allowed.** deck-stage injects its shadow styles and a `<style id="…-print-page">` into `<head>`.
- **Inline event handler attributes are blocked** (`script-src-attr 'none'`). Use `addEventListener`.
- `data:` images are allowed; story.css's `--hatch` is a data-URI SVG background. `data:` fonts are allowed.
- `frame-src 'none'`: the deck cannot embed iframes (no YouTube, no embedded PDF viewer). `object-src 'none'`.
- `frame-ancestors 'none'` + `X-Frame-Options: DENY`: **the deck cannot be shown inside an `<iframe>`, even on loehrning.ai.** Link to it (W03's catalog links `…/slides.html`).
- **`connect-src 'self'`**: a W04 demo cannot call external APIs from the browser.
- COOP `same-origin`: `window.open("./presenter.html")` keeps `window.opener` (same origin, same COOP). **Verified: `presenterHasOpener: true`, pairing CONNECTED.**
- **The proxy (`src/proxy.ts`).** Its matcher excludes only image and font extensions, so `.html/.js/.css` under `/workshops` pass through it. The per-request nonce policy (`NONCE_CSP_HEADER`, currently **report-only**, with `'strict-dynamic'`) is attached only to responses that shared caches may not store. `/workshops/:slug/:path*` is classed public, `max-age=3600` (`src/lib/crawl/contract.ts` `REVALIDATING_ASSET_PATHS`), so **static workshop files never receive the nonce policy**, now or after enforcement. Still, keep W04 like W03, with no inline `<script>`:
  - it costs nothing
  - it survives a future baseline without `'unsafe-inline'`
  - under `'strict-dynamic'`, host sources such as `'self'` are ignored, so anything but nonce'd or externally loaded scripts would break
- **Caching.** `/workshops/:slug/assets/**` is contracted as year-long immutable, so never change the bytes behind an existing asset filename; use a new name. `lib/*.js|css` and the HTML revalidate hourly.

**Verified.** The skeleton was served by a Python server that sends the exact production CSP, XFO, COOP and nosniff headers (`scratchpad/tmp/csp_server.py`). Result: **0 `securitypolicyviolation` events** on the deck and the console, 0 console errors.

---

## 6. External-export constraints for Workshop 03 (scripts/course03)

- **W03 files come from an external course source.** `slides.html`, `presenter.html`, `lib/**`, the readiness lab and the worksheets are exported from a course source outside this repo (`scripts/export-data-readiness-workshop.mjs`). Every repo fix to one of them must be recorded under `scripts/course03/overrides/<path>` with `node scripts/course03/overrides.mjs capture`. `overrides/manifest.json` stores `exported` hashes plus `{original, override}` per file. `bun run test:course03-publication` (part of `verify:root-checks`) asserts `check(root)` is empty, so an unrecorded edit to W03's deck fails CI. `lib/deck-runtime.js`, `deck-stage.js`, `presenter.js`, `presenter.css`, `presenter-notes.js`, `story.css`, `tokens.css` and many scene CSS files already carry overrides.
- **Repository-authored W03 files are generated.** They are listed in `isRepositoryAuthored()`: `guide.html`, `builder.html`, **`demo.html`**, the Typing woff2 copies, `card-preview.webp`, `bundle-manifest.json`, `PUBLICATION.md`, the kit ZIP and README, and `builder/**`. `node scripts/course03/refresh-published.mjs` regenerates them from `scripts/course03/guide.html`, `scripts/course03/demo/demo.html`, `scripts/course03/builder/…`, `src/fonts/typing/*.woff2`, together with `bundle-manifest.json`, the ZIP and **W03's `ASSET_MANIFEST.json` rows** (`publication.mjs` `assetRows()`). The `--check` mode (in the same test) fails on drift. **So a rebuilt W03 demo must be edited in `scripts/course03/demo/demo.html`, followed by `refresh-published.mjs`.**
- **New files in the W03 folder fail the check.** `planRefresh` reports "unreviewed public file (neither exported nor repository-authored)". It also rejects `/home/` or `/Users/` paths in text files.
- **Implication for W04.** Do not reference `../datenbereitschaft-fuer-ki/lib/…`, and do not add W04 files to the W03 folder. A self-contained copy in `public/workshops/<w04-slug>/` sits outside that regime entirely. Its only gates are the generic ones: the asset manifest scan, the static-link test and the workshop catalog tests.

---

## 7. Fonts, licensing and ASSET_MANIFEST.json

### Fonts
- **Typing** is a modified, renamed derivative of Inter (Rasmus Andersson and The Inter Project Authors), under SIL OFL 1.1. Notice: `assets/fonts/OFL-1.1.txt` ("Copyright (c) 2016 The Inter Project Authors"); THIRD_PARTY_NOTICES.md §"Inter-derived fonts". The v2.1 name table reads: copyright "…Modified for loehrning.ai as Typing: horizontal scaling, spacing and vertical metrics changed.", unique ID `2.1;LHRN;Typing-Regular;Inter-4.001`, license "…OFL 1.1. See OFL-1.1.txt next to the font files." Inter has no Reserved Font Name, and Typing is already renamed, so re-wrapping the font as woff2 is permitted as long as the OFL notice ships beside the files.
- **JetBrains Mono** is OFL-1.1. Notice: `assets/fonts/OFL-1.1-JetBrainsMono.txt`. W03's `JetBrainsMono-Static-400.woff2` and `-700.woff2` are the same variable file (sha `2c32b9b3…`, 31,340 B), which is also W02's `JetBrainsMono-var.woff2`. Ship one file with `font-weight: 100 800`.
- **Measured difference:**

  | Font set | 60 px title width | Pixels differing from 03's .ttf |
  |---|---:|---:|
  | 03's `.ttf` (v2.1) | 956 px | reference |
  | site `.woff2` (v2.0) | 891.8 px | 2.9–4.2 % per slide |
  | woff2 converted from the v2.1 `.ttf` | 956 px | **0 %** on cover, raw-inputs and compare; 0.065 % on the end slide |

  The end-slide difference is only the bold mono counters: with `100 800` the browser uses the real 700 instance, whereas W03's static-700 declaration of the variable file renders differently. Recommendation: `100 800` (correct bold) or copy W03's two declarations for exact parity.
- **Recommendation for W04:** ship `Typing-Static-{400,500,600,700}.woff2` converted losslessly from W03's `.ttf` (fontTools 4.66, `flavor='woff2'`; sizes 141,644 / 144,292 / 144,896 / 144,608 B). The zero-risk alternative is to copy the four `.ttf` files unchanged (1.66 MB) and reuse W03's manifest wording with the same hashes. **Do not use `src/fonts/typing/*.woff2` for the deck.**

### ASSET_MANIFEST.json (repo root)
`bun run scan:public` (`scripts/scan-public-candidate.mjs` → `packages/website/scripts/open-source/scan-export.mjs`, platform profile) walks the git candidate files and applies these rules:
- **Every recognized binary must have a row whose `sizeBytes` and `sha256` match exactly**, plus `owner`, `source`, `license` and `redistribution`. The binaries are `BINARY_ASSET_EXTENSIONS` in `export-denylist.mjs`: avif bmp gif ico jpg jpeg png webp tif tiff **ttf otf woff woff2** mp3 mp4 m4v mov ogg wav webm wasm **zip** pdf docx pptx xlsx 7z gz tar.
- Text assets (`html md svg txt vtt`) *may* have rows; when they do, they are hash-checked.
- A row without a file fails ("stale ASSET_MANIFEST.json entry").
- **`pdf`, `docx`, `pptx` and `xlsx` fail in the platform profile regardless of the manifest** ("opaque or active container"), and so do `7z`, `gz` and `tar`. A ZIP passes only if every entry inside is inspectable text.
- Record helper: `bun run asset:record -- <path> --owner … --source … --license … --redistribution …`. It prints a candidate row and never writes the file. Non-ASCII is stored escaped (`Löhr`).

Rows W04 needs if it follows the skeleton (paths under `packages/website/public/workshops/<w04-slug>/`):

| File | sizeBytes | sha256 | license | required? |
|---|---:|---|---|---|
| `assets/fonts/Typing-Static-400.woff2` | 141644 | `3114b3c1543719e35fbcd79171995e87a5e8e6bb598e10c855e2525a89a28063` | OFL-1.1 | yes (binary) |
| `assets/fonts/Typing-Static-500.woff2` | 144292 | `016640b5e194f4694a1ac1a00ac98a7cb389afed1bd3d307fe0c816291aa7ad4` | OFL-1.1 | yes |
| `assets/fonts/Typing-Static-600.woff2` | 144896 | `be0f9efc556e7d576554004698acd1d0dc759340731d96fdd0b5aa7fdc7dd3ca` | OFL-1.1 | yes |
| `assets/fonts/Typing-Static-700.woff2` | 144608 | `81cdb156fd821407c6651739d6fe75c679ac9fba973bc3b934c2946494f789c8` | OFL-1.1 | yes |
| `assets/fonts/JetBrainsMono-var.woff2` | 31340 | `2c32b9b3ee358c119e210f6f5195f9bd34894d78a785ff2e95d60e718e400af4` | OFL-1.1 | yes |
| `assets/globe.svg` | 158411 | `b77a3581fe56ed9cb53bacaf88e5af451176f962cecec5129c5b6b33ac70f980` | LicenseRef-Loehrning-Brand | optional (W03 lists it) |
| `assets/lockup-horizontal-dark.svg` | 4645 | `13ff70fa608cdf421a8b3ff3046e22cda7ba8d5e72271b4ad64c659bb1bfe1e2` | LicenseRef-Loehrning-Brand | optional |
| `assets/lockup-horizontal.svg` | 4645 | `477a5b796f82ea5afb453b6ab03e6dbdf5abc066aa11cd710e4fbdec079d75ed` | LicenseRef-Loehrning-Brand | optional |
| `assets/mark-black.svg` | 321 | `ca6b5b231a7d577fcfddea82d63300f9652e4da0c4e39fa1c596bc58ad8d1384` | LicenseRef-Loehrning-Brand | optional |
| `assets/favicon.svg` | 375 | `93307b8d9a43e69099e6f407ba120ed6ee5a586921be96b0613271cc269441ac` | LicenseRef-Loehrning-Brand | optional |
| `card-preview.webp`, any `.jpg/.png/.webp` screenshot, the kit `.zip` | — | compute after creation | LicenseRef-Loehrning-Brand | yes |
| `assets/tim-loehr.jpg` (if the host slide is reused) | 112101 | `3df97f11e0ccc2cc6ada1216eeec12c80725764857b011bd3f9ce79e792401c4` | copy W02's row text exactly (a W03 test asserts license and redistribution equality) | yes |

Recompute the hashes if you re-run the woff2 conversion: fontTools output is deterministic for a given version, but verify anyway. Suggested wording, adapted from W03's `publication.mjs`:
- **Font rows.** owner "The Inter Project Authors; modified and renamed by loehrning.ai"; source "Course Typing v2.1 statics, renamed Inter 4.001 derivatives, repackaged as woff2"; redistribution "Permitted with the OFL notices bundled beside the fonts".
- **JetBrains Mono.** owner "The JetBrains Mono Project Authors"; source "Existing platform-inventoried JetBrains Mono variable font".
- **Brand SVGs.** owner "Tim Löhr"; source "loehrning.ai brand asset"; redistribution "Included for repository operation; no trademark or standalone reuse rights granted".

---

## 8. Authoring guide: a new deck for Workshop 04

### 8.1 Folder layout
```
public/workshops/<w04-slug>/
  slides.html                 NEW   (the deck; keep this exact file name)
  presenter.html              COPY + 3 string edits (title, eyebrow, id="clock-target")
  guide.html                  NEW   (deck-stage's phone rotate hint links ./guide.html)
  lib/deck-stage.js           COPY + namespace rename
  lib/deck-runtime.js         COPY + namespace rename + 3 small patches (§8.3)
  lib/presenter.js            COPY + namespace rename + clock-target patch
  lib/presenter.css           COPY verbatim
  lib/story.css               COPY verbatim
  lib/cover-globe.css         COPY verbatim
  lib/tokens.css              COPY, @font-face block swapped to woff2 (palette and motion unchanged)
  lib/presenter-notes.js      NEW   (window.FOLDLINE_PRESENTER_NOTES, one entry per data-note-key)
  lib/scenes/cover.css        COPY of 03's cover.css minus the "× Brainster" ::after rule
  lib/scenes/<scene-id>.css   NEW   one per scene, every selector prefixed #<scene-id>
  lib/scenes/<scene-id>.js    optional Story.register(...) scripts, loaded after deck-runtime.js
  assets/fonts/Typing-Static-{400,500,600,700}.woff2, JetBrainsMono-var.woff2, OFL-1.1.txt, OFL-1.1-JetBrainsMono.txt
  assets/globe.svg, lockup-horizontal-dark.svg, lockup-horizontal.svg, mark-black.svg, favicon.svg   (verbatim)
```
**Do not copy:** `replay-data.js`, `model-capture-data.js`, `demo-adapter.js`, 03's `presenter-notes.js`, 03's `scenes/*.js` and 03's other scene CSS files. They are MRR/FOLDLINE data and choreography. Copy an individual 03 scene CSS only as a starting point, renamed to the new scene id.

### 8.2 Namespace rename (all three JS files, the same sed)
`sed -i 's/foldline-deck/<ns>-deck/g; s/foldline-presenter/<ns>-presenter/g' lib/deck-stage.js lib/deck-runtime.js lib/presenter.js`

In the skeleton `<ns>` is `esg`; it is renamed in 8, 10 and 9 places respectively. This covers:
- storage keys: position, resume, appendix return, touch hint, rotate hint, presenter state and commands, `deck-started`, **timer**, note-open
- the BroadcastChannel name
- the window-protocol and shared-auth protocol names (deck and console must match, and the single sed keeps them consistent)
- the popup window name
- the print-style id

The globals `window.FOLDLINE_PRESENTER_NOTES` and `FoldlineDemo` are per-page and can stay.

### 8.3 Runtime and console patches (exact diffs in §10.4)
1. `deck-runtime.js`: replace `ROUTE_STATIONS` and `ROUTE_LABEL_TITLE` with `deckConfig()` and `routeStations()`, which read `<deck-stage data-route-stations="A|B|C" data-deck-title="…">`.
2. `deck-runtime.js`: `window.FoldlineDemo?.addEventListener(…)`; `demoReady = window.FoldlineDemo ? … : Promise.resolve()`; a status text when no adapter is loaded.
3. `presenter.js`: `workshopTargetSeconds()` = the sum of the main scenes' `data-seconds` from the deck state, which drives the bar and the new `#clock-target` label. The fallback section title becomes `document.title`.
4. `presenter.html`: `<title>`, the eyebrow (no Brainster) and `id="clock-target"` on the target span.
5. `scenes/cover.css`: delete `#cover > .cover-brand::after { content: "× Brainster"; }`.

### 8.4 Authoring rules that fall out of the code
- **The first scene is `id="cover"`**, with `class="slide dark"`, `data-route="none"` and `data-act="0"`. The route acts are `1…N`, one per entry in `data-route-stations`, and scenes before the route use act 0.
- **Title and zones.** Every paper scene gets an `<h1 class="scene-title">` as a direct child. Keep content inside y 224–984 and leave 984–1080 empty.
- **Scene CSS.** Selectors are prefixed `#<scene-id>`, and layout is absolute in 1920×1080 section coordinates. Use tokens (`var(--ink)`, `--mennige`, `--t-*`, `--s*`) and never raw colours; `--mennige` means "look here now", so use one focus group per step.
- **Steps.** Put `data-step="n"` on the element that appears at press n and `data-step-until="m"` on anything that must disappear at m. A three-step reveal is `data-step="1|2|3"`, which gives a step total of 3.
- **Animation.** Add `data-motion` plus `style="--order:0…4"` to each element that should animate on its step. Do not put a centring `transform` on an element that uses `stamp`, `rise`, `grow` or `wall`; wrap it in a positioned row instead.
- **Numbers.** Numbers that should count get `data-motion="count"` (or `data-count`). Never use `data-ev` without a sealed record.
- **Icons.** Paste into the page sprite only the `<symbol>`s you use, and keep `<defs><pattern id="story-hatch">` if any hatch fill appears in SVG.
- **Notes.** Give every scene a `data-note-key` entry in `presenter-notes.js` with `revealOrder` (one line per step, step 0 included), `cut`, `say` and `sayAt`. A room vote is `ask: [{at, text, options, expected}]`, and the on-screen `.room-vote` band sits at y 776–968.
- **Links.** No inline `on*=` handlers, no iframes, no external fetches. Links inside the deck take the class `deck-link`, and no static `href` may end in `/`, because a test enforces that the site does not serve folder index pages.
- **Ship-time checks:** `?export=final`, print to PDF (one page per scene at 1440×810 pt), `?motion=reduced`, a phone in portrait (rotate hint and tap navigation), and `P` pairing.

---

## 9. Verification of the skeleton

**Setup.**
- Built in `scratchpad/deck-skeleton/`.
- Served with `python3 -m http.server 56473` (phases A and B) and with a production-header server on port 36301 (phase C).
- Driven with Playwright 1.61.1 and Chromium 1194 (`/opt/pw-browsers/chromium`) by `scratchpad/tmp/deck-phase.mjs`. The script presses ArrowRight until the hash stops changing and screenshots every step, then runs the extras, print and presenter checks.
- The unmodified W03 libs are kept in `deck-skeleton/verbatim-lib/` so they can be diffed against the patched copies.

### Phase A: W03 libs copied unchanged, new `slides.html` (shots in `deck-skeleton/shots/phaseA-verbatim/`)

**What worked:**
- All 11 steps (cover 0–1, raw-inputs 0–3, compare 0–2, end 0–1) with correct `is-step-hidden` toggling.
- The route-underline progress: 0 → 0.333 → 0.667 → 1.0.
- The main path ends at `#end/1`.
- Presenter pairing through `P` reached CONNECTED; console → deck presses and scene jumps worked; the clock auto-started.

**What was wrong:**
1. `pageerror: Cannot read properties of undefined (reading 'addEventListener')`, because `window.FoldlineDemo` is missing.
2. The chrome showed "Data Readiness for AI" with 03's six stations ("Wrong answer … Your turn") and W04's act 3 highlighted "The fix".
3. The console showed **W03's cover notes on W04's cover** (key collision on `cover`), plus "× Brainster" in the eyebrow and "target 75:00".
4. The cover showed "× Brainster".
5. A layout bug of the skeleton itself: an unequal sub-line height in the cards; the middle card had no connector drop.

### Phase B: patched libs (shots in `shots/phaseB-final/`, taken with the site's v2.0 woff2)
- Every point from phase A was fixed: 0 console errors, 0 page errors, 0 failed requests.
- The chrome reads "ESG Reporting with AI" with the stations "Raw inputs | Side by side | Take home".
- The console shows the new notes: "Say this" per press, "On screen now" / "Next press" from `revealOrder`, the vote card on compare step 1, the target 11:45 (= 45+240+300+120 s) and the "Recorded deck · no live checks" status.
- Extras all passed:

  | Check | Result |
  |---|---|
  | backward entry | `←` from `#compare/0` → `#raw-inputs/3` |
  | deep link | `#raw-inputs/2` shows cards 1–2 only |
  | R R | back to `#cover/0` |
  | `?export=final` | step 3/3, motion `static`, nothing hidden |
  | `?motion=reduced` | only opacity animations |
  | toolbar in the bottom band | `03 / 04 · 2 / 2` |
- Print: `beforeprint` renders every scene final and lays them out as four 1920×1080 pages. `page.pdf()` fires `beforeprint`/`afterprint` (verified with listeners: the steps were final during print and restored afterwards) and gives **4 pages, MediaBox 1440×810 pt**.
- **Font finding.** The pixel diff against 03's `.ttf` showed the site woff2 is a different cut (§7). The deck was switched to woff2 converted from the v2.1 `.ttf`, and the result was 0 differing pixels.

### Phase C: final skeleton under the production headers (shots in `shots/phaseC-csp/`; **these are the final screenshots**)
- `00-cover-step0` … `10-end-step1` (11 steps), plus `x-deeplink-raw-inputs-2`, `x-export-final-raw-inputs`, `x-toolbar`, `x-print-layout`, `x-presenter-cover`, `x-presenter-after-presses`, `x-presenter-compare` and `deck.pdf`.
- 0 console errors, 0 page errors, 0 failed requests, **0 CSP violations** on the deck and the console. The response headers were confirmed as the enforced CSP plus COOP `same-origin`. `presenterHasOpener: true`, connected.
- Motion mid-press (`shots/motion-mid-raw-inputs-step3-260ms.png`): at 260 ms after `→` on raw-inputs step 2 → 3, the running animations were `story-rise` (card 3), `story-stamp` (result), `story-fade` (note) and a Web Animation on the `.edge` path (draw). The count value read `0.0`, then `165.5` once settled. After 1.2 s: 0 animations, 0 `.is-entering`.
- Phone (iPhone 13 emulation, `shots/mobile-portrait-raw-inputs.png`): the rotate hint is displayed (`flex`), and a tap on the right third moved `#raw-inputs/0` → `#raw-inputs/1`, with no errors.

### What needed changing, summarised
| # | Change | Why |
|---|---|---|
| 1 | namespace sed `foldline-deck`/`foldline-presenter` → `esg-deck`/`esg-presenter` | shared timer, window hijack, cross-deck notices on the same origin |
| 2 | route stations + title from `<deck-stage data-*>` | 03's are hard-coded |
| 3 | optional `FoldlineDemo` | uncaught TypeError without 03's adapter |
| 4 | clock target from `data-seconds`; console strings | 75:00 and Brainster hard-coded |
| 5 | remove `cover.css` `::after` | "× Brainster" |
| 6 | new `presenter-notes.js` | 03's notes leak through the `cover` key; `revealOrder` and `cut` are required |
| 7 | fonts: v2.1 → woff2 (not the site's v2.0) | same look at a third of the size |
| 8 | wrap stamps instead of `translateX(-50%)` | the stamp keyframes animate `transform` |
| 9 | add `[data-focus]` styling for stamps yourself | story.css paints it only on `.q-card` and `.callout` |

---

## 10. Final working skeleton (verbatim)

Everything in this section is the exact file content in `scratchpad/deck-skeleton/`. Files not shown are copied unchanged from W03: `lib/deck-stage.js` (namespace sed only), `lib/presenter.css`, `lib/story.css`, `lib/cover-globe.css` and the assets.

### 10.1 `slides.html`

```html
<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#141414" />
  <title>ESG Reporting with AI · loehrning.ai</title>
  <meta name="description" content="Workshop 04 deck skeleton: raw ESG inputs, one checked table, a clear statement." />
  <link rel="icon" href="./assets/favicon.svg" />
  <link rel="stylesheet" href="./lib/tokens.css" />
  <link rel="stylesheet" href="./lib/cover-globe.css" />
  <link rel="stylesheet" href="./lib/story.css" />
  <link rel="stylesheet" href="./lib/scenes/cover.css" />
  <link rel="stylesheet" href="./lib/scenes/raw-inputs.css" />
  <link rel="stylesheet" href="./lib/scenes/compare.css" />
  <link rel="stylesheet" href="./lib/scenes/end.css" />
  <script src="./lib/deck-stage.js"></script>
</head>
<body>
<a class="skip-link" href="#stage">Skip to workshop</a>
<main aria-label="ESG Reporting with AI workshop">
<svg class="icon-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<defs><pattern id="story-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="14" fill="#121212" /></pattern></defs>
<symbol id="i-question" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><path d="M8 12h84v60H46L28 90V72H8z"/><path d="M38 24h24v14H50v8"/><g fill="currentColor" stroke="none"><rect x="46" y="54" width="8" height="8"/></g></symbol>
<symbol id="i-pass" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><rect x="10" y="10" width="80" height="80"/><path d="M28 50l14 14 30-30"/></symbol>
<symbol id="i-fail" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><rect x="10" y="10" width="80" height="80"/><path d="M32 32l36 36M68 32L32 68"/></symbol>
<symbol id="i-checklist" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><rect x="14" y="14" width="72" height="78"/><path d="M26 44l8 8 14-14M56 46h18M26 72l8 8 14-14M56 74h18"/><g fill="currentColor" stroke="none"><rect x="34" y="8" width="32" height="12"/></g></symbol>
<symbol id="i-table" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><rect x="8" y="14" width="84" height="72"/><path d="M8 38h84M8 62h84M36 38v48M64 38v48"/></symbol>
<symbol id="i-gap" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><path d="M10 26V10h16M42 10h16M74 10h16v16M90 42v16M10 42v16M10 74v16h16M42 90h16"/><g fill="currentColor" stroke="none"><rect x="72" y="72" width="20" height="20"/></g></symbol>
<symbol id="i-book" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="4"><rect x="16" y="8" width="68" height="72"/><path d="M28 8v72M16 80v12h68V80M40 46h24"/><g fill="currentColor" stroke="none"><rect x="40" y="22" width="32" height="12"/></g></symbol>
</svg>
<deck-stage id="stage" width="1920" height="1080" data-deck-title="ESG Reporting with AI" data-route-stations="Raw inputs|Side by side|Take home">

  <section class="slide dark" id="cover" data-act="0" data-kind="main" data-label="ESG Reporting with AI" data-section="Workshop 04 · skeleton" data-seconds="45" data-note-key="cover" data-note="One question about electricity emissions, held fixed for the whole session." data-route="none">
    <div class="workshop-globe" aria-hidden="true"><img src="./assets/globe.svg" width="660" height="620" alt="" aria-hidden="true" /></div>
    <div class="cover-brand" id="cover-brand"><img class="cover-brand__lockup" src="./assets/lockup-horizontal-dark.svg" width="206" height="40" alt="loehrning.ai" /></div>
    <p class="cover-date" id="cover-date" data-motion="rise" style="--order:0">Workshop 04 · skeleton</p>
    <h1 class="scene-title" id="cover-title" data-motion="rise" style="--order:0">ESG Reporting<br />with AI.</h1>
    <div class="q-card q-card--dark q-card--hero cover-question" id="cover-question" data-focus data-motion="fade" style="--order:1">
      <svg class="icon" aria-hidden="true"><use href="#i-question" /></svg>
      <div>
        <span class="q-card__label">One question, held fixed</span>
        <p class="q-card__text">How much did our electricity emissions change from 2024 to 2025?</p>
      </div>
    </div>
    <div class="cover-experiment" id="cover-experiment" data-step="1">
      <span class="stamp cover-stamp" data-motion="stamp" style="--order:0">Raw inputs</span>
      <svg class="cover-arrow" viewBox="0 0 56 24" width="56" height="24" aria-hidden="true" data-motion="fade" style="--order:1"><path class="cover-arrow__line" d="M4 12H40" /><path class="cover-arrow__head" d="M38 3L52 12L38 21Z" /></svg>
      <span class="stamp cover-stamp cover-stamp--change" data-motion="stamp" style="--order:1">One checked table</span>
      <svg class="cover-arrow" viewBox="0 0 56 24" width="56" height="24" aria-hidden="true" data-motion="fade" style="--order:2"><path class="cover-arrow__line" d="M4 12H40" /><path class="cover-arrow__head" d="M38 3L52 12L38 21Z" /></svg>
      <span class="stamp cover-stamp" data-motion="stamp" style="--order:2">A clear statement</span>
    </div>
    <p class="cover-meta" id="cover-meta" data-motion="fade" style="--order:1">75 minutes · synthetic teaching case</p>
  </section>

  <section class="slide" id="raw-inputs" data-act="1" data-kind="main" data-label="Raw inputs" data-section="Raw inputs · three files, one number" data-seconds="240" data-note-key="raw-inputs" data-note="Show the three files behind one emissions number, one per press." data-route="shown">
    <h1 class="scene-title" id="raw-inputs-title">Three files. One reported number.</h1>
    <p class="lead ri-lead" id="raw-inputs-lead" data-motion="fade" style="--order:0">Every ESG figure starts as a pile of files. Name each one before you ask an AI anything.</p>
    <ol class="ri-cards" id="raw-inputs-cards">
      <li class="ri-card" id="raw-inputs-card-1" data-step="1" data-motion="rise" style="--order:0">
        <p class="ri-card__head"><svg class="icon icon--56" aria-hidden="true"><use href="#i-book" /></svg><span>Invoices</span></p>
        <p class="ri-card__sub">12 PDFs from the utility, one per month</p>
        <p class="ri-card__sample">Jan 2025: 38,410 kWh</p>
      </li>
      <li class="ri-card" id="raw-inputs-card-2" data-step="2" data-motion="rise" style="--order:0">
        <p class="ri-card__head"><svg class="icon icon--56" aria-hidden="true"><use href="#i-table" /></svg><span>Meter export</span></p>
        <p class="ri-card__sub">One CSV from facilities</p>
        <p class="ri-card__sample">2025 total: 452,300 kWh</p>
      </li>
      <li class="ri-card" id="raw-inputs-card-3" data-step="3" data-motion="rise" style="--order:0">
        <p class="ri-card__head"><svg class="icon icon--56" aria-hidden="true"><use href="#i-checklist" /></svg><span>Emission factor</span></p>
        <p class="ri-card__sub">From the supplier contract</p>
        <p class="ri-card__sample">0.366 kg CO₂e per kWh</p>
      </li>
    </ol>
    <svg class="ri-join" id="raw-inputs-join" viewBox="0 0 1728 128" width="1728" height="128" data-step="3" aria-hidden="true">
      <path class="edge" data-motion="draw" style="--order:1" d="M260 0V64H1468V0M864 0V120" />
    </svg>
    <div class="ri-result-row" id="raw-inputs-result-row">
      <p class="stamp ri-result" id="raw-inputs-result" data-step="3" data-motion="stamp" data-focus style="--order:2"><svg class="icon" aria-hidden="true"><use href="#i-pass" /></svg><span>452,300 kWh × 0.366 = <span class="num" data-motion="count">165.5</span> t CO₂e</span></p>
    </div>
    <p class="ri-note" id="raw-inputs-note" data-step="3" data-motion="fade" style="--order:3">Synthetic numbers. The invoices and the meter disagree by 1.2 %: write down which one you used.</p>
  </section>

  <section class="slide" id="compare" data-act="2" data-kind="main" data-label="Side by side" data-section="Side by side · draft and checked" data-seconds="300" data-note-key="compare" data-note="Same inputs, two write-ups. Let the room find what the first draft leaves out." data-route="shown">
    <h1 class="scene-title" id="compare-title">Same inputs. Two summaries.</h1>
    <div class="cmp-cols" id="compare-cols">
      <div class="cmp-col cmp-col--draft" id="compare-draft">
        <span class="lane lane--export" data-motion="fade" style="--order:0"><span class="lane__swatch"></span>First AI draft</span>
        <p class="cmp-quote" id="compare-draft-quote" data-step="1" data-motion="rise" style="--order:0">“Thanks to our green initiatives, emissions fell sharply this year.”</p>
        <ul class="cmp-list" id="compare-draft-list" data-step="1" data-motion="fade" style="--order:1">
          <li>No number</li>
          <li>No scope, no method</li>
          <li>No source file</li>
        </ul>
        <div class="cmp-chip-row" data-step="1"><span class="chip chip--fail" data-motion="stamp" style="--order:2"><svg class="icon" aria-hidden="true"><use href="#i-fail" /></svg>Cannot be checked</span></div>
      </div>
      <span class="cmp-rule" aria-hidden="true"></span>
      <div class="cmp-col cmp-col--checked" id="compare-checked">
        <span class="lane lane--approved" data-motion="fade" style="--order:1"><span class="lane__swatch"></span>After a checked table</span>
        <p class="cmp-quote" id="compare-checked-quote" data-step="2" data-motion="rise" data-focus style="--order:0">“Scope 2 (market-based) fell from 181.2 t to 165.5 t CO₂e, −8.7 %, from 2024 to 2025.”</p>
        <ul class="cmp-list" id="compare-checked-list" data-step="2" data-motion="fade" style="--order:1">
          <li>Meter export, 452,300 kWh</li>
          <li>Supplier factor, 0.366 kg per kWh</li>
          <li>Calculation kept next to the claim</li>
        </ul>
        <div class="cmp-chip-row" data-step="2"><span class="chip chip--pass" data-motion="stamp" style="--order:2"><svg class="icon" aria-hidden="true"><use href="#i-pass" /></svg>Every number has a source</span></div>
      </div>
    </div>
  </section>

  <section class="slide" id="end" data-act="3" data-kind="main" data-label="Take home" data-section="Take home · three rules" data-seconds="120" data-note-key="end" data-note="Three rules, then point to the materials. No new content here." data-route="shown">
    <h1 class="scene-title" id="end-title">Take this home.</h1>
    <ol class="end-rules" id="end-rules">
      <li class="end-rule" data-motion="rise" style="--order:0">Name the source file behind every number.</li>
      <li class="end-rule" data-motion="rise" style="--order:1">Say which scope, which method and which year.</li>
      <li class="end-rule" data-motion="rise" style="--order:2">Keep the calculation next to the claim.</li>
    </ol>
    <div class="end-stamp-row" id="end-stamp-row">
      <p class="stamp end-stamp" id="end-stamp" data-step="1" data-motion="stamp" data-focus><svg class="icon" aria-hidden="true"><use href="#i-checklist" /></svg><span>A checked table beats a fluent paragraph.</span></p>
    </div>
    <p class="end-sign" id="end-sign" data-step="1" data-motion="fade" style="--order:2"><span class="end-sign__url">loehrning.ai/workshops/esg-reporting-mit-ki</span><img src="./assets/lockup-horizontal.svg" width="206" height="40" alt="loehrning.ai" /></p>
  </section>

</deck-stage>
</main>

<script src="./lib/deck-runtime.js"></script>
</body>
</html>
```

### 10.2 Scene CSS

`lib/scenes/raw-inputs.css`
```css
/* raw-inputs: a paper scene with a three-step reveal. Section coordinates, 1920 x 1080.
   Step 0: title and lead. Steps 1-3: one source card each. Step 3 also draws the connector
   and lands the result stamp, whose number counts up (no data-ev binding, so it may count). */

#raw-inputs > .ri-lead {
  position: absolute;
  top: 224px;
  left: var(--margin-x);
  max-width: 1400px;
  color: var(--slate);
}

#raw-inputs > .ri-cards {
  position: absolute;
  top: 336px;
  left: var(--margin-x);
  display: grid;
  width: 1728px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 84px;
  margin: 0;
  padding: 0;
  list-style: none;
}

#raw-inputs .ri-card {
  display: grid;
  height: 300px;
  align-content: start;
  gap: var(--s2);
  padding: var(--s3) var(--s4);
  border: 3px solid var(--ink);
  background: var(--papier);
}

#raw-inputs .ri-card__head {
  display: flex;
  align-items: center;
  gap: var(--s2);
  margin: 0;
  font-size: var(--t-h2);
  font-weight: 700;
  line-height: 1.15;
}

/* Two lines reserved, so the sample lines of all three cards share one baseline. */
#raw-inputs .ri-card__sub {
  min-height: 2.7em;
  margin: 0;
  color: var(--slate);
  font-size: var(--t-body);
}

#raw-inputs .ri-card__sample {
  margin: var(--s2) 0 0;
  padding-top: var(--s2);
  border-top: 1px solid var(--leinen);
  font-family: var(--mono);
  font-size: var(--t-mono);
}

/* The connector: three short drops from the cards into one bar above the result. */
#raw-inputs > .ri-join {
  position: absolute;
  top: 636px;
  left: var(--margin-x);
  overflow: visible;
}

/* The row centres the stamp. The stamp itself carries no transform, because the stamp
   keyframes animate `transform` and would otherwise fight a centring translate. */
#raw-inputs > .ri-result-row {
  position: absolute;
  top: 764px;
  right: var(--margin-x);
  left: var(--margin-x);
  display: flex;
  justify-content: center;
}

#raw-inputs .ri-result {
  margin: 0;
  white-space: nowrap;
}

#raw-inputs .ri-result[data-focus] {
  border-color: var(--mennige);
  outline: 3px solid var(--mennige);
  outline-offset: 3px;
}

#raw-inputs > .ri-note {
  position: absolute;
  top: 904px;
  left: var(--margin-x);
  margin: 0;
  color: var(--slate);
  font-size: var(--t-small);
}
```

`lib/scenes/compare.css`
```css
/* compare: a two-column comparison. Step 0: both column heads. Step 1: the left body and its
   chip. Step 2: the right body and its chip. Section coordinates, 1920 x 1080. */

#compare > .cmp-cols {
  position: absolute;
  top: 248px;
  left: var(--margin-x);
  display: grid;
  width: 1728px;
  height: 680px;
  grid-template-columns: minmax(0, 1fr) 3px minmax(0, 1fr);
  gap: 0 72px;
}

#compare .cmp-rule {
  background: var(--ink);
}

#compare .cmp-col {
  display: grid;
  align-content: start;
  gap: var(--s4);
  min-width: 0;
}

#compare .cmp-quote {
  margin: 0;
  padding: var(--s3) var(--s4);
  border: 3px solid var(--ink);
  background: var(--papier);
  font-size: var(--t-lead);
  line-height: 1.35;
}

#compare .cmp-col--draft .cmp-quote {
  border-style: dashed;
}

#compare .cmp-list {
  display: grid;
  gap: var(--s1);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--t-body);
}

#compare .cmp-list li {
  display: flex;
  align-items: baseline;
  gap: var(--s2);
}

#compare .cmp-list li::before {
  content: "";
  flex: none;
  width: 12px;
  height: 12px;
  background: var(--ink);
  transform: translateY(-3px);
}

#compare .cmp-chip-row {
  display: flex;
}
```

`lib/scenes/end.css`
```css
/* end: the last main scene. Step 0: three take-home rules. Step 1: the closing stamp and the
   materials line with the ink lockup. Section coordinates, 1920 x 1080. */

#end > .end-rules {
  position: absolute;
  top: 240px;
  left: var(--margin-x);
  display: grid;
  width: 1320px;
  gap: var(--s4);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: end-rule;
}

#end .end-rule {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: var(--s3);
  font-size: var(--t-lead);
  font-weight: 600;
  line-height: 1.25;
  counter-increment: end-rule;
}

#end .end-rule::before {
  content: counter(end-rule, decimal-leading-zero);
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  background: var(--ink);
  color: var(--papier);
  font-family: var(--mono);
  font-size: var(--t-num-sm);
  font-weight: 700;
}

#end > .end-stamp-row {
  position: absolute;
  top: 680px;
  left: var(--margin-x);
  display: flex;
}

#end .end-stamp {
  margin: 0;
}

/* story.css paints [data-focus] only on .q-card and .callout; a focused stamp gets the Mennige
   outline here, as the cover's "change" stamp does. */
#end .end-stamp[data-focus] {
  border-color: var(--mennige);
  outline: 3px solid var(--mennige);
  outline-offset: 3px;
}

#end > .end-sign {
  position: absolute;
  top: 872px;
  right: var(--margin-x);
  left: var(--margin-x);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s4);
  margin: 0;
  padding-top: var(--s3);
  border-top: 3px solid var(--ink);
}

#end .end-sign__url {
  font-size: var(--t-body);
  font-weight: 600;
}

#end .end-sign img {
  display: block;
  width: auto;
  height: 40px;
}
```

`lib/scenes/cover.css` = W03's `lib/scenes/cover.css` with the `::after` rule removed (diff in §10.4).

### 10.3 `lib/presenter-notes.js`

```js
/* Presenter notes for the Workshop 04 deck, keyed by each scene's data-note-key.
   Every entry needs revealOrder (one line per step, 0 = scene entry) and cut: the console calls
   revealOrder.join() and prints cut. sayAt maps a say[] index to the step(s) it belongs to; ask[]
   items are { at, text, options?, expected?, aloud? } (no `aloud` = an on-screen room vote card). */
window.FOLDLINE_PRESENTER_NOTES = Object.freeze({
  "cover": {
    "clock": { "start": "00:00", "end": "00:45", "budget_seconds": 45 },
    "mode": "Opening",
    "purpose": "Fix the one question the session keeps asking.",
    "say": [
      "Presenter cue: start talking, the clock starts on your first press.",
      "Read the question once, slowly. We keep it fixed for the whole session.",
      "On press 1: raw inputs, one checked table, a clear statement. That is the whole plan."
    ],
    "sayAt": { "0": [0], "1": [0], "2": [1] },
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Title, date line, the question card and the footer",
      "The three stamps: raw inputs, one checked table, a clear statement"
    ],
    "cut": "No expansion; advance at 00:45.",
    "appendixRoutes": []
  },
  "raw-inputs": {
    "clock": { "start": "00:45", "end": "04:45", "budget_seconds": 240 },
    "mode": "Setup · synthetic numbers",
    "purpose": "Show that one reported figure depends on three different files.",
    "say": [
      "Every ESG number starts as files. Before any AI, name them.",
      "On press 1: the invoices. Twelve PDFs, one per month.",
      "On press 2: the meter export. Same electricity, different file.",
      "On press 3: the emission factor, then the calculation. 452,300 times 0.366 is 165.5 tonnes.",
      "If asked: the invoices and the meter differ by 1.2 percent. Pick one and write down which."
    ],
    "sayAt": { "0": [0], "1": [1], "2": [2], "3": [3] },
    "ask": [
      { "at": 0, "text": "Where does your company's electricity number come from?", "aloud": true }
    ],
    "expectedAudience": ["Most people do not know which file the number comes from."],
    "revealOrder": [
      "Title and lead",
      "Card 1: invoices",
      "Card 2: meter export",
      "Card 3: emission factor, the connector and the result stamp (165.5 t CO₂e)"
    ],
    "cut": "Skip the aloud question; keep the three presses.",
    "appendixRoutes": []
  },
  "compare": {
    "clock": { "start": "04:45", "end": "09:45", "budget_seconds": 300 },
    "mode": "Comparison",
    "purpose": "Let the room see what an unchecked summary leaves out.",
    "say": [
      "Same inputs on both sides. Only the write-up changes.",
      "On press 1: the first AI draft. Ask the room what is missing before you read the list.",
      "On press 2: the checked version. Every number points to a file."
    ],
    "sayAt": { "0": [0], "1": [1], "2": [2] },
    "ask": [
      { "at": 1, "text": "Would you sign the left summary?", "options": ["Yes", "No", "Not sure"], "expected": "Mostly no, some not sure." }
    ],
    "expectedAudience": [],
    "revealOrder": [
      "Both column heads",
      "Left: the draft quote, what it lacks, and the fail chip",
      "Right: the checked quote, its sources, and the pass chip"
    ],
    "cut": "Skip the vote; show both columns.",
    "appendixRoutes": []
  },
  "end": {
    "clock": { "start": "09:45", "end": "11:45", "budget_seconds": 120 },
    "mode": "Close",
    "purpose": "Leave three rules and the materials link.",
    "say": [
      "Three rules. Read them once.",
      "On press 1: point to the materials link and stop talking."
    ],
    "sayAt": { "0": [0], "1": [1] },
    "ask": [],
    "expectedAudience": [],
    "revealOrder": [
      "Three take-home rules",
      "The closing stamp and the materials line"
    ],
    "cut": "Read the rules only.",
    "appendixRoutes": []
  }
});
```

### 10.4 Patches against the W03 files (unified diffs; `verbatim-lib/` = W03 copy)

`lib/tokens.css`: only the `@font-face` block changes (palette, motion and base rules unchanged):
```css
/* Typing v2.1 statics (renamed Inter 4.001 derivative, OFL-1.1, notice in ../assets/fonts/OFL-1.1.txt):
   the exact faces of the Workshop 03 deck, repackaged from its .ttf files as woff2 (lossless, about
   143 KB each instead of 410 KB). Do not substitute the site's Typing v2.0 woff2 from src/fonts/typing:
   it is a different, narrower cut and every line would re-wrap. JetBrains Mono: one variable woff2
   (OFL-1.1, notice in OFL-1.1-JetBrainsMono.txt). */
@font-face {
  font-family: "Typing";
  src: url("../assets/fonts/Typing-Static-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Typing";
  src: url("../assets/fonts/Typing-Static-500.woff2") format("woff2");
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}

@font-face {
  font-family: "Typing";
  src: url("../assets/fonts/Typing-Static-600.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}

@font-face {
  font-family: "Typing";
  src: url("../assets/fonts/Typing-Static-700.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("../assets/fonts/JetBrainsMono-var.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 800;
  font-display: swap;
}
```

```diff
--- w03/deck-stage.js
+++ w04/lib/deck-stage.js
@@ -1,12 +1,12 @@
 (() => {
   const DESIGN_W = 1920;
   const DESIGN_H = 1080;
-  const STORAGE_KEY = "foldline-deck:last-scene:v1";
-  const POSITION_KEY = "foldline-deck:last-position:v1";
-  const SESSION_POSITION_KEY = "foldline-deck:session-position:v1";
-  const APPENDIX_RETURN_KEY = "foldline-deck:appendix-return:v1";
-  const TOUCH_HINT_KEY = "foldline-deck:touch-hint-seen:v1";
-  const ROTATE_DISMISSED_KEY = "foldline-deck:rotate-dismissed:v1";
+  const STORAGE_KEY = "esg-deck:last-scene:v1";
+  const POSITION_KEY = "esg-deck:last-position:v1";
+  const SESSION_POSITION_KEY = "esg-deck:session-position:v1";
+  const APPENDIX_RETURN_KEY = "esg-deck:appendix-return:v1";
+  const TOUCH_HINT_KEY = "esg-deck:touch-hint-seen:v1";
+  const ROTATE_DISMISSED_KEY = "esg-deck:rotate-dismissed:v1";
   const TOOLBAR_ZONE_PX = 140;
   const TOOLBAR_HIDE_MS = 2000;
   const TOOLBAR_TOUCH_MS = 4000;
@@ -854,7 +854,7 @@
     }
 
     _syncPrintPage() {
-      const id = "foldline-deck-print-page";
+      const id = "esg-deck-print-page";
       let style = document.getElementById(id);
       if (!style) {
         style = document.createElement("style");
@@ -1180,7 +1180,7 @@
     }
 
     openPresenter() {
-      window.open("./presenter.html", "foldline-presenter", "width=1180,height=820");
+      window.open("./presenter.html", "esg-presenter", "width=1180,height=820");
     }
 
     goTo(index, reason = "api") {
--- w03/deck-runtime.js
+++ w04/lib/deck-runtime.js
@@ -1,13 +1,16 @@
 (() => {
   // Step engine, Route chrome, motion helpers and evidence facade for the arrow-driven deck
   // (spec B.7–B.10), plus the authenticated presenter sync kept from the previous runtime.
-  const ROUTE_STATIONS = Object.freeze(["Wrong answer", "Why it failed", "The fix", "Ask again", "Honest limits", "Your turn"]);
-  const STATE_KEY = "foldline-deck:presenter-state:v1";
-  const COMMAND_KEY = "foldline-deck:presenter-command:v1";
-  const DECK_STARTED_KEY = "foldline-deck:deck-started:v1";
-  const CHANNEL_NAME = "foldline-deck:v1";
-  const WINDOW_PROTOCOL = "foldline-deck:window:v1";
-  const SHARED_PROTOCOL = "foldline-deck:shared-auth:v1";
+  // Deck-specific chrome is configured on <deck-stage>: data-route-stations="A|B|C" (one station per
+  // act, act 1 = first station) and data-deck-title (the brand line beside the mark).
+  const deckConfig = (name, fallback) => document.getElementById("stage")?.dataset?.[name] || fallback;
+  const routeStations = () => deckConfig("routeStations", "").split("|").map((label) => label.trim()).filter(Boolean);
+  const STATE_KEY = "esg-deck:presenter-state:v1";
+  const COMMAND_KEY = "esg-deck:presenter-command:v1";
+  const DECK_STARTED_KEY = "esg-deck:deck-started:v1";
+  const CHANNEL_NAME = "esg-deck:v1";
+  const WINDOW_PROTOCOL = "esg-deck:window:v1";
+  const SHARED_PROTOCOL = "esg-deck:shared-auth:v1";
   const WINDOW_CHANNEL_PATTERN = /^[A-Za-z0-9._~-]{16,160}$/;
   const ALLOWED_PRESENTER_COMMANDS = new Set([
     "previous", "fragment-previous", "fragment-next", "next", "reset-current", "full-reset", "appendix-return", "goto",
@@ -587,7 +590,6 @@
 
   /* ------------------------------------------------------------------ step engine (spec B.9) */
 
-  const ROUTE_LABEL_TITLE = "Data Readiness for AI";
   const exportFinal = new URLSearchParams(window.location.search).get("export") === "final";
   const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
   const registrations = new Map();
@@ -689,13 +691,13 @@
     mark.width = 28;
     mark.height = 28;
     mark.alt = "";
-    brand.append(mark, create("span", "story-chrome__title", ROUTE_LABEL_TITLE));
+    brand.append(mark, create("span", "story-chrome__title", deckConfig("deckTitle", document.title)));
     chrome.append(brand);
     if (slide.dataset.kind === "appendix") {
       chrome.append(create("p", "route-appendix", "Appendix"));
     } else if (route !== "hidden") {
       const list = create("ol", "route");
-      ROUTE_STATIONS.forEach((label, index) => {
+      routeStations().forEach((label, index) => {
         const station = create("li", "route__station");
         station.dataset.station = String(index + 1);
         const text = create("span", "route__text");
@@ -1069,7 +1071,7 @@
     const nativeOpen = window.open;
     window.open = function trackedWindowOpen(url, target, features) {
       // P again with a paired, open console brings it to the front instead of reloading it.
-      if (target === "foldline-presenter" && directPresenter?.authenticated && directPresenter.source
+      if (target === "esg-presenter" && directPresenter?.authenticated && directPresenter.source
         && !directPresenter.source.closed && presenterDocument(directPresenter.source) === directPresenter.document) {
         try {
           directPresenter.source.focus();
@@ -1081,13 +1083,13 @@
       // Opaque file origins cannot expose a replaced Document. A fresh local
       // console avoids an old document claiming a new offer before navigation;
       // HTTP(S) keeps the familiar named-window reuse and automatic refresh.
-      const windowTarget = window.location.protocol === "file:" && target === "foldline-presenter"
-        ? `foldline-presenter-${createChannelId()}`
+      const windowTarget = window.location.protocol === "file:" && target === "esg-presenter"
+        ? `esg-presenter-${createChannelId()}`
         : target;
       const opened = Reflect.apply(nativeOpen, window, [url, windowTarget, features]);
       try {
         const targetUrl = new URL(String(url), window.location.href);
-        if (opened && target === "foldline-presenter" && targetUrl.pathname.endsWith("/presenter.html")) {
+        if (opened && target === "esg-presenter" && targetUrl.pathname.endsWith("/presenter.html")) {
           expectedPresenterWindow = opened;
           // P is a local user action: it navigates the named HTTP window or
           // selects a fresh file window, then rearms only that exact peer.
@@ -1194,7 +1196,7 @@
     const step = stepNumber(slide.dataset.stepCurrent);
     const total = stepNumber(slide.dataset.stepTotal);
     const mode = window.FoldlineDemo?.mode || "replay";
-    const status = window.FoldlineDemo?.statusDetail || "Initializing";
+    const status = window.FoldlineDemo?.statusDetail || (window.FoldlineDemo ? "Initializing" : "Recorded deck · no live checks");
     // In an appendix: the scene Esc returns to, or null when the appendix was opened directly.
     const returnSlide = (slide.dataset.kind || "main") === "appendix" ? stage?.appendixReturnSlide || null : undefined;
     const appendixReturn = returnSlide === undefined ? undefined
@@ -1472,10 +1474,12 @@
     initSync();
     wireStage();
     wireMotion();
-    window.FoldlineDemo.addEventListener("modechange", () => publishState());
-    demoReady = window.FoldlineDemo.initialize().then(() => undefined, (error) => {
+    // The evidence adapter (lib/demo-adapter.js) is optional: a deck without data-live-check scenes
+    // does not load it.
+    window.FoldlineDemo?.addEventListener("modechange", () => publishState());
+    demoReady = window.FoldlineDemo ? window.FoldlineDemo.initialize().then(() => undefined, (error) => {
       console.error("Evidence adapter failed to initialize", error);
-    });
+    }) : Promise.resolve();
     if (current) runLiveChecks(current);
     publishState();
     await demoReady;
--- w03/presenter.js
+++ w04/lib/presenter.js
@@ -1,11 +1,11 @@
 (() => {
-  const CHANNEL_NAME = "foldline-deck:v1";
-  const STATE_KEY = "foldline-deck:presenter-state:v1";
-  const COMMAND_KEY = "foldline-deck:presenter-command:v1";
-  const DECK_STARTED_KEY = "foldline-deck:deck-started:v1";
-  const TIMER_KEY = "foldline-deck:timer:v1";
-  const WINDOW_PROTOCOL = "foldline-deck:window:v1";
-  const SHARED_PROTOCOL = "foldline-deck:shared-auth:v1";
+  const CHANNEL_NAME = "esg-deck:v1";
+  const STATE_KEY = "esg-deck:presenter-state:v1";
+  const COMMAND_KEY = "esg-deck:presenter-command:v1";
+  const DECK_STARTED_KEY = "esg-deck:deck-started:v1";
+  const TIMER_KEY = "esg-deck:timer:v1";
+  const WINDOW_PROTOCOL = "esg-deck:window:v1";
+  const SHARED_PROTOCOL = "esg-deck:shared-auth:v1";
   const WINDOW_CHANNEL_PATTERN = /^[A-Za-z0-9._~-]{16,160}$/;
   const SHARED_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
   const HEARTBEAT_INTERVAL_MS = 1000;
@@ -100,7 +100,7 @@
   let connectionStatus = "";
   let timerState = readTimer();
   let selectDirty = false;
-  const NOTE_OPEN_KEY = "foldline-deck:presenter-note-open:v1";
+  const NOTE_OPEN_KEY = "esg-deck:presenter-note-open:v1";
 
   function byId(id) { return document.getElementById(id); }
 
@@ -288,7 +288,13 @@
     announce("Workshop clock reset to 00:00.");
   }
 
-  const WORKSHOP_TARGET_SECONDS = 75 * 60;
+  // The clock target is the sum of the main scenes' data-seconds, as the deck reports them, so the
+  // bar and the "target" label never drift from the deck. 75:00 is only the pre-pairing fallback.
+  const FALLBACK_TARGET_SECONDS = 75 * 60;
+  function workshopTargetSeconds() {
+    const total = (state?.scenes || []).filter((scene) => scene.kind === "main").reduce((sum, scene) => sum + (Number(scene.seconds) || 0), 0);
+    return total > 0 ? total : FALLBACK_TARGET_SECONDS;
+  }
   const PACE_TOLERANCE_SECONDS = 30;
 
   function setText(node, text) {
@@ -310,6 +316,8 @@
     setText(nodes.timer, started ? formatTime(elapsed) : "00:00");
     setText(nodes.timerToggle, timerState.running ? "Pause" : started ? "Resume" : "Start clock");
     const elapsedSeconds = elapsed / 1000;
+    const WORKSHOP_TARGET_SECONDS = workshopTargetSeconds();
+    setText(nodes.clockTarget, `target ${formatBudget(WORKSHOP_TARGET_SECONDS)}`);
     nodes.clockFill.style.transform = `scaleX(${Math.min(1, elapsedSeconds / WORKSHOP_TARGET_SECONDS).toFixed(4)})`;
     const main = state?.kind === "main";
     const start = main ? Number(state.startBudgetSeconds) || 0 : 0;
@@ -665,7 +673,7 @@
     renderRuntimeBlock();
     const step = Number.isInteger(state.fragmentIndex) ? state.fragmentIndex : 0;
     const total = Number.isInteger(state.fragmentTotal) ? state.fragmentTotal : 0;
-    setText(nodes.currentSection, state.section || "Data Readiness for AI");
+    setText(nodes.currentSection, state.section || document.title);
     setText(nodes.currentLabel, state.label || state.sceneId);
     setText(nodes.currentId, state.sceneId);
     setText(nodes.currentCounter, state.kind === "main"
@@ -1007,7 +1015,7 @@
   // A standalone console (opened by hand) becomes the named presenter window, then opens the deck.
   // The deck's P reuses this window by name and re-runs the normal pairing handshake.
   function openDeckFromConsole() {
-    try { window.name = "foldline-presenter"; } catch (_error) { /* the deck's P opens its own console */ }
+    try { window.name = "esg-presenter"; } catch (_error) { /* the deck's P opens its own console */ }
     const deck = window.open("./slides.html", "_blank");
     setText(nodes.pairingLead, deck
       ? "The deck opened in a new tab. Press P there; this console reloads once and connects."
@@ -1028,7 +1036,7 @@
       audienceAsks: byId("audience-asks"), expectedAudience: byId("expected-audience"), revealCut: byId("reveal-cut"), appendixRoutes: byId("appendix-routes"),
       appendixBanner: byId("appendix-banner"), appendixBannerText: byId("appendix-banner-text"), returnControl: document.querySelector(".return-control"),
       nextReveal: document.querySelector(".next-reveal"), pairingGuide: byId("pairing-guide"), pairingLead: byId("pairing-lead"),
-      resetConfirm: byId("reset-confirm"), timerConfirm: byId("timer-confirm"),
+      resetConfirm: byId("reset-confirm"), timerConfirm: byId("timer-confirm"), clockTarget: byId("clock-target"),
     });
     nodes.timerToggle = document.querySelector('[data-timer-command="toggle"]');
 
--- w03/presenter.html
+++ w04/presenter.html
@@ -4,7 +4,7 @@
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <meta name="theme-color" content="#f3f0e9" />
-  <title>Presenter · Data Readiness for AI</title>
+  <title>Presenter · ESG Reporting with AI</title>
   <link rel="icon" href="./assets/favicon.svg" />
   <link rel="stylesheet" href="./lib/tokens.css" />
   <link rel="stylesheet" href="./lib/presenter.css" />
@@ -16,7 +16,7 @@
   <header class="presenter-head">
     <div class="head-title">
       <h1>Presenter console</h1>
-      <p class="eyebrow">Data Readiness for AI · loehrning.ai × Brainster</p>
+      <p class="eyebrow">ESG Reporting with AI · loehrning.ai</p>
     </div>
     <div class="runtime-block">
       <span id="connection-state" class="connection-pill" data-state="unpaired">UNPAIRED</span>
@@ -88,7 +88,7 @@
 
     <aside class="side-column" aria-label="Clock and deck controls">
       <section class="clock-panel" aria-labelledby="timer-title">
-        <div class="panel-head"><h2 id="timer-title">Clock</h2><span>target 75:00</span></div>
+        <div class="panel-head"><h2 id="timer-title">Clock</h2><span id="clock-target">target 75:00</span></div>
         <div class="clock-row">
           <output id="timer" data-state="not-started" aria-live="off">NOT STARTED</output>
           <p id="pace-state" class="pace-pill" data-pace="not-started">NOT STARTED</p>
--- w03/lib/scenes/cover.css
+++ w04/lib/scenes/cover.css
@@ -22,7 +22,7 @@
   letter-spacing: -0.015em;
 }
 
-/* The lockup plus the co-brand word: part of the lockup, outside the content word count. */
+/* The lockup. (Workshop 03 appends "× Brainster" here with ::after; Workshop 04 has no co-brand.) */
 #cover > .cover-brand {
   top: 64px;
   display: flex;
@@ -35,10 +35,6 @@
   line-height: 1;
 }
 
-#cover > .cover-brand::after {
-  content: "× Brainster";
-}
-
 #cover .cover-brand__lockup {
   display: block;
   width: auto;
```

---

## 11. Gotchas worth knowing
- **`id="cover"` is load-bearing.** The console's clock auto-start and `paintRoute`'s appendix caller label both check it.
- **Keep the file names `slides.html` and `presenter.html`.** The pairing verifies both paths.
- **A new note entry needs `revealOrder` and `cut`,** or the console throws while rendering.
- **The step total is inferred from the markup.** A stray `data-step="5"` silently adds presses. Use `Story.register(id, {steps})` to pin the count when a scene's JS drives the steps.
- **Evidence values do not count up.** `data-ev` and `data-format="of:N"` values only fade in. Plain numbers count from 0, so do not put `data-count` on a value that must never show an intermediate figure.
- **A dashed `.edge` must not carry `pathLength`,** or it renders solid.
- **The chrome and route labels are 22 px (`--t-chrome`).** More than about 6 stations or long labels overflow the 1100 px route width.
- **The chrome strings are English.** For a German deck, translate them in `deck-stage.js` (toolbar aria labels, notices, rotate hint), `deck-runtime.js` ("Appendix", "Esc returns to …") and `presenter.html` / `presenter.js`.
- **The brutal look lives in two places.** `tokens.css` has `* { border-radius: 0 !important }`, and story.css draws 3 px ink borders on every component. Change the look there (in the W04 copy only) if W04 should look softer than 03. The user explicitly praised 03's deck, so keep it as is by default.
- **Assets are immutable-by-contract.** Rename an asset when its bytes change.
- **ESG kit formats.** PDFs, XLSX and DOCX cannot be committed under `public/`: the scanner fails them. Sample invoices must be CSV, Markdown, HTML or images (images need manifest rows).
