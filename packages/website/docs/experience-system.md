# Berliner Learning Instrument

This document is the interface contract for loehrning.ai. It preserves the existing identity while making the learning behavior, density, and evidence consistent across route families.

Research evidence informs the learning behaviors and safeguards. Palette, geometry, numeric thresholds, exact motion durations, the single progress thread, and visual anti-patterns are testable platform policy and product inference, not universal research findings.

## Product Position

loehrning.ai is an open collection of learning instruments. A screen earns space by doing at least one job:

1. orient the learner;
2. require a decision or construction;
3. expose evidence or a causal change;
4. support retrieval, revision, or transfer;
5. document source, ownership, access, or limits.

Content that does none of these jobs is removed or placed in an on-demand reference.

## Identity

The visual language has two layers.

- **Werkzeichnung** (paper, ink, one Mennige accent), taken from the Workshop 03 deck (`public/workshops/datenbereitschaft-fuer-ki/lib/tokens.css`): calm paper, precise ink, one red pencil. It carries every reading and working surface and all chrome.
- **The poster layer ("Plakat")** carries bands, covers, thumbnails, social cards and deck covers. It is five poster scenes: four screen-printed ones, sampled from the owner's four reference posters, and Sage, taken from the soft look of the Workshop 05 deck.

### Werkzeichnung

- Kalkweiß `#f7f1e7` ground (the old site's warm cream, not a grey), Druckschwarz `#121212` ink, Schiefer `#4f4640` secondary text, and Mennige `#b73a15` as the only accent on paper. At most one Mennige group per section: one filled Mennige button per page, one Mennige mark per drawing.
- **No black grounds, anywhere.** The owner's rule: never a black, graphit or near-black background. The graphit band (`.dark-section`, `--color-dark-*`) is retired. The footer is the Pfirsich-Wash (`--color-peach-wash`, brand-peach over Bogen) with ink text and the old site's pastel geometry, whole and clear of text, at its outer edges; warm so it never merges with a sky, acid or paper band above it. Code blocks, logs, consoles and terminal replays are Beton (`--color-inset`) with ink type, centrally for every `.prose` block. A selected tab, chip or option is the Himmel-Blatt (`--color-sky-sheet`) with an ink edge and a 3px ink foot, never an ink fill. A filled action that is not the page's one Mennige primary is Kobalt with paper text (the `ink` ButtonLink variant), and a Mennige button deepens to Mennige tief on hover, never to ink. A filled scene button is `--color-scene-button` with `--color-scene-button-text`, never the scene ink when that ink is dark: Bloom fills with Terrakotta tief and a Bogen label, not Aubergine. The scroll progress thread is Mennige on a faint Mennige track, as on the old site. Scrims are the Himmel-Wash, not a black veil. Ink stays for text, lines and small marks (route stations, bullets, 2px progress fills, chart dots). Poster grounds (Ultramarin, Rost, Aubergine) are colours, not black, and stay where the owner kept the posters. Ratios: [`plakat-pairings.md`](./plakat-pairings.md), Light grounds. **One documented exception: `/login`.** The owner asked for that page's background explicitly: a near-black `#050505` scene with a static 14px dot grid, a vignette and drifting dot-matrix shapes under a dark rounded card. It is scoped to `.login-scene` in `src/app/login/login-scene.css`, which redefines the theme tokens for its contents (AA ratios in that file) and is clipped to the login section, so the nav (opaque Kalkweiß on that route) and the Pfirsich-Wash footer stay paper.
- The risograph accents (acid, sky, pink, peach, cobalt, teal) and `kupfer-mist` stay defined for routes not yet migrated (home, books, open source) but are not used on courses, workshops or demos, and not in new code.
- Figtree for reading; headlines 700, sentence case, tracked no tighter than -0.015em. The one exception is the poster headline (`.poster-title`, below). Labels are sentence case, 600, +0.02em (`text-label`, `.kicker`). Geist Mono only for data: file names, code, IDs, timestamps.
- Structure comes from lines: a 2px Kopflinie above section heads (`.kopflinie`, `<SectionHead>`) and 1px Leinen hairlines (`--color-hairline`) between rows. The Kopflinie is the scene line (`--color-scene-line`): Druckschwarz on a plain paper page, the scene's paper ink below a poster band.
- Deck pictograms (`src/components/werk/pictogram.tsx`) are the one icon family on learning surfaces.
- Exactly one global top scroll-progress thread.

Shared primitives live in `src/components/werk/` (Kicker, SectionHead, CoverBand, GlobeLines, Route, QuestionCard, MaterialList, StatRow, Callout, ButtonLink, Chip, Pictogram). The poster primitives live in `src/components/plakat/` (PlakatBand, PosterArt, PosterThumb, PosterCover, CapsLine, CornerDots, Halftone, ResultChart, and `hero-motion`, the scene registry of the workshop stage), their pure geometry and palettes in `src/lib/plakat/`.

### Poster layer

1. **Five scenes**, each with exactly three colours (ground, ink, mid): `.plakat-lemons` (Ultramarin `#152a79`, Butter `#fceeaf`, Mennige `#b73a15`), `.plakat-idea` (Kreide `#ecebdd`, Kobalt `#2e4d90`, Himbeere `#c94a7f`), `.plakat-bloom` (Sand `#e6d3af`, Aubergine `#3b1f45`, Terrakotta `#d1733d`) `.plakat-autumn` (Rost `#944d44`, Creme `#f0e1ca`, Ocker `#e4a057`) and `.plakat-sage` (Salbei `#dce6d4`, Tanne `#1f4a38`, Bernstein `#d9a441`). Sage carries no special rules beyond the shared ones: Bernstein is decoration only (1.75 on Salbei), so a meaningful mark and the filled button take the Tanne ink. Each scope redefines the semantic tokens, so components built on `text-foreground`, `border-border` or the focus ring inherit tested pairs. Every pairing and its ratio is listed in [`plakat-pairings.md`](./plakat-pairings.md), generated from the CSS and the palettes.
2. **Assignment** happens only through `src/lib/plakat/palettes.ts`: one palette per workshop (01 Lemons, 02 IDEA, 03 Bloom, 04 Autumn, 05 Sage), one per course track (Grundlagenpfad Lemons, prompting and agents IDEA, data Bloom) and fixed route scenes (home Lemons, demos and blog IDEA). The deck, the social card, the OG image and the static materials of a workshop use the same entry; no second mapping exists. A page opts its paper into the scene with `data-plakat-page` on the outermost wrapper the route owns inside `<main>`.
3. **One scene per poster.** A page shows several scenes side by side only as separate posters (the workshop list, course thumbnails). A scene is never a card inside a paper grid, and rows are never tinted. Palette colour on paper is limited to posters and thumbnails, the scene line (Kopflinie, tab-bar marker, StatRow values, lesson H1) and the result chart. Kreide, Sand, Butter and Creme are never card fills on paper (posters and thumbnails carry their own scene).
4. **Palette grounds replace graphit** on bands and covers, and paper or a pastel wash replace it everywhere else: the footer (Pfirsich-Wash), the AI-Native demo engines and the home fallback (`HOME_SCENE` is `lemons` or `paper`, never graphit).
5. **Mennige** remains the only accent on paper and the brand red everywhere; the lemons mid is Mennige itself, so the site never shows two reds. Inside a scene the ink is the accent and the focus ring. The header, the Mennige L tile, the menu and the tab-bar ground never change colour.
6. **Typography.** No new face: Figtree 400 and 700 carry the posters.
   - One `.plakat-caps` line per scene: 14px (17px in autumn), 600, +0.16em (+0.12em in autumn), uppercase by CSS from sentence-case text. Allowed only inside a scene, and never for UI labels or buttons.
   - Display tracking down to -0.04em, at 36px (2.25rem) or more, allowed only through `.poster-title` (`--text-poster`, line height 0.92, sized so the longest word fits its column). Everywhere else the -0.015em floor stays.
   - At most three type sizes per band: the caps line, the poster title and one 17px body size for the lede, the subtitle, the buttons and a short access line. No `text-caption` or `text-label`, no hairline, box, card, question card or meta list inside a band; facts move to paper directly below.
7. **Numerals** only where a sequence exists: workshops 01 to 04 and the Grundlagenpfad 01 to 04. Visual-learning courses carry none.
8. **The globe** is the home hero only. The line globe (`GlobeLines`) draws in ink at low opacity on paper, as on the old site; there is no graphit fallback. Workshop covers use posters.
9. **Focus.** The ring follows the ground: each scope sets `--color-brand-orange` to its ink (Butter 10.97, Kobalt 6.78, Aubergine 9.74, Creme 4.80 on the ground). A control that is full-bleed, full-height or within 5px of a band edge uses an inset ring (`focus-visible:outline-offset-[-3px]`), so the ring never lands on paper, where Butter and Creme fall to 1.03 and 1.13.
10. **Rost rules** (autumn scope, binding). Creme on Rost is 4.80:1, only 0.30 above AA.
    1. Text inside `.plakat-autumn` is 17px (1.0625rem) or larger at weight 400 or more. The only exception is the SVG numeral, which is display size.
    2. There is no muted tier and no reduced opacity. Every text token is Creme.
    3. None of these sit inside an autumn scope: a question card, a status or pass chip, a badge, a form field, a progress bar, `text-caption`, `text-label` or `text-xs`.
    4. There is no hover tint. A hover is an underline or an inversion of the same pair. On workshop pages a state change brings in the anti colour instead (see "Anti-colour states" below).
    5. A meaningful shape uses Ocker hell `#ebb16a` (3.24). Ocker `#e4a057` (2.78) is decoration only.

#### Not allowed on the poster layer

- A palette colour as a row tint, a card fill or a left rule.
- A Mennige fill inside a lemons or autumn scope (its edge falls to 2.21 and 1.07:1), or paper text on an ink fill inside any scope.
- An `/alpha` modifier on a `scene-*` utility: Tailwind writes its fallback with the paper value, which is wrong inside a scope.
- A second palette inside one scene, or a scene assigned anywhere but `palettes.ts`.
- UI-icon motifs on posters (text lines, flowcharts, gauges, bar-chart clip art), gradients, or strokes on poster shapes.

Course distinction comes from the task, instrument, diagram motif, dataset and the track's poster palette. It does not come from unrelated base fonts, button shapes, shadows, or product-style color systems.

## Geometry And Density

- Flat editorial frames use 1px structural boundaries (Kante `#827970` for controls, Leinen hairlines for decoration) and a 2px Kopflinie in the scene line for section heads. The question card is the only element with a left bar.
- Radius is 0 on learning surfaces (courses, workshops, demos), as in the deck. Elsewhere it stays between 0 and 8px while those routes are migrated; no new pills.
- Elevation is tone, not shadow: Bogen `#fffcf5` (raised sheet), Kalkweiß (page), Beton `#ece5d8` (recessed band), all in the old site's warm cream family. `--shadow-overlay` is for floating overlays only (menus, dialogs, popovers). The offset stamp shadow (`shadow-tile`) is removed. `shadow-card` / `shadow-card-hover` remain on routes not yet migrated and are not used on learning surfaces. A named set of dense/functional surfaces (account, login, feedback, the course atlas, ki-check, demos, technical course landings, and the public information routes) stay flat by contract.
- Reading measure is at most 68ch. Mixed editorial content is at most 1120px. Widths above 1440px are reserved for workspaces that use the space.
- UI labels are at least 12px. Mono is reserved for data (code, file names, IDs, timestamps); labels and eyebrows are sentence case, not uppercase. The poster caps line (`.plakat-caps`) is a graphic element inside a scene, never a label.
- Section spacing uses 8, 12, 16, 24, 32, or 48px. Larger gaps require a deliberate scene change.
- The first meaningful action on a learning route starts without scrolling at 390 × 844 and 1440 × 900.

## Mobile Companion Shell

Below `lg` (1024px) the site runs as a companion app. At `lg` and above the desktop layout is unchanged. The shell is server-rendered markup plus CSS: no client hook decides layout, nothing flips at hydration, and content is not duplicated into a second DOM tree. Navigation is the only component that renders twice, once as the desktop cluster and once as the compact bar.

### Reserved geometry

Four `globals.css` `@theme` tokens own the shell's geometry. Nothing inside the shell restates these numbers.

| Token             | Value                                     | Meaning                                                                                                     |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--nav-h`         | 64px                                      | Desktop offset: the 48px floating header pill plus the 8px inset above it and the 8px breathing gap below.    |
| `--nav-h-compact` | 48px                                      | Everything the compact top bar occupies below `lg`, outer inset included. Content begins directly beneath it. |
| `--tabbar-h`      | 56px                                      | The tab bar row, device insets excluded.                                                                     |
| `--tabbar-band-h` | `--tabbar-h` plus `--safe-area-bottom`    | The whole band the tab bar covers on screen.                                                                 |

`--safe-area-top`, `--safe-area-right`, `--safe-area-bottom` and `--safe-area-left` wrap `env(safe-area-inset-*)` with a `0px` fallback so every `calc()` stays valid where a browser reports no insets. `.pt-safe`, `.pb-safe` and `.px-safe` apply them. A fixed shell surface pads itself with the inset instead of shrinking, so its touch targets keep full height above the home indicator.

`<main>` reserves the top band: `--nav-h-compact`, and `--nav-h` from `lg`. The bottom band is reserved on `<body>`, not on `<main>`. The footer is a sibling of `<main>`, so padding `<main>` would open a dead gap above the footer and still leave the tab bar covering the footer's last row; padding `<body>` puts the reserved space at the end of the scrollable document, which is the only place a fixed bar needs it. This is a recorded deviation from "the bottom padding goes on main", and it is why `#main-content` remains the only selector the no-script sheet resets.

The root layout declares `width=device-width, initial-scale=1, viewport-fit=cover`. `viewport-fit=cover` is what makes `env(safe-area-inset-*)` report real values; without it every inset is zero. Zoom stays unrestricted: no `maximum-scale`, no `user-scalable=no`.

### What the shell does below lg

- The top bar is compact: wordmark, language switch, menu button, `--nav-h-compact` tall in total. The existing menu dialog and its focus trap are kept as they are.
- A bottom tab bar carries exactly four destinations: Start (`/`), Lernen (`/kurse`), Praxis (`/workshops`), Konto (`/konto`). Lernen and Praxis are the header's two task groups, read from the same section table (`src/lib/navigation/site-sections.ts`), so the header, the menu sheet, the footer and the tab bar group every page the same way. Every destination is a pure function of the locale, which middleware derives from the request path. Nothing in the bar reads the auth cookie or any other request state, and that is a cache contract: the bar sits in the root layout, so it is part of every public document, and `src/proxy.ts` caches those for an hour in the shared cache without `Vary: Cookie`. A cookie-dependent destination would let one cached entry serve either audience the other's variant, and adding `Vary: Cookie` to every public document to compensate would give up that cacheability. The signed-in tools workbench stays one tap away on the Konto tab.
- The active tab is taken from the request path and marked with `aria-current="page"`. A server component is the intended implementation. A client island is acceptable only where the path cannot reach a server component, and it must then render identical markup on the server and add nothing beyond the link list and the pathname hook.
- Every internal href stays locale prefixed through `localizeHref`, and every label comes from `GLOBAL_NAVIGATION_COPY`.
- The first decision on a route comes before its explanation, and long stacks of identical cards become horizontal rails with scroll snap and `content-visibility: auto`. Rails keep a visible edge and stay reachable by keyboard. A rail lists items; it does not close with a tile for the subject's own landing page when a section that renders at every width already links there, because that would be the same destination twice in one document.
- Scrolling below `lg` lands in one step: `scroll-behavior: auto`, with the two `scroll-padding` reserves above applied as a jump. A phone document that keeps gliding after a scroll is a second moving region under the thumb, and a tap dispatched into it can press one control and release over another, which fires no click at all. `scrollIntoView({ behavior: "auto" })` is not an escape: the spec reads `auto` as "use the CSS `scroll-behavior`". Above `lg` the desktop keeps its smooth anchor scrolling.
- The footer collapses into a `<details>` disclosure whose legal links stay visible. It opens and closes without JavaScript.

### Landmarks and accessible names

- `<main>` is rendered by `app/layout.tsx` alone. The shell adds none.
- The site navigation keeps its `mainNavigation` label: "Hauptnavigation" and "Main navigation".
- The tab bar is a second `<nav>` and carries its own distinct accessible name, `quickNavigation`: "Schnellnavigation" and "Quick navigation". The distinction is load-bearing, because `getByRole("navigation", { name })` is a single-match query and axe reports landmarks that cannot be told apart.
- Each tab shows a visible text label of at least 12px. An icon may accompany the label and is `aria-hidden`. Icon-only tabs are not used.
- The skip link keeps targeting `#main-content` and stays above every shell surface.
- Keyboard focus stays out from under the tab bar (WCAG 2.4.11 Focus Not Obscured). The change that introduces the bar also reserves `scroll-padding-bottom` for `--tabbar-band-h` below `lg`, the way `html` already reserves `scroll-padding-top` for the fixed header.
- Stacking order: focused skip link `z-[100]`, reader drawers `z-[70]`, top bar and its dialog `z-50`, tab bar `z-40`, content below that.

### Reader focus mode

Focus mode is server rendered and never client state, so the tab bar never appears and then vanishes. The two long-form reader shells, the course lesson shell and the book chapter reader, mark it in the first response with `data-reader="focus"` on the outermost wrapper the route owns inside `<main>`, and the shell reacts through `body:has([data-reader="focus"])`. If the request path later reaches the root layout, the same attribute may sit on the root element and `:root[data-reader="focus"]` becomes an equivalent second form of the selector. Nothing toggles the attribute after hydration.

The workshop routes are marketing detail pages rather than reader shells, so they set no attribute and keep the tab bar.

In focus mode:

- the tab bar is absent;
- a compact sticky reader bar of the same `--tabbar-h` height takes the band, so exchanging one for the other shifts no layout;
- that bar is never absent. Focus mode takes the tab bar away, so a reader shell that entered it and rendered no bar would leave the phone with no bottom navigation at all;
- that bar states course position, for example "3 von 12", plus the next action. A shell that is generic over course structures owns the band without owning the position - the lesson shell is handed an opaque navigation slot and cannot derive a lesson index from it - and then states an action alone rather than inventing a position. It does not draw a second continuous scroll thread: the enforcement list below bans route-specific fixed duplicates of the global progress indicator;
- the site nav may collapse on scroll down and return on scroll up through CSS scroll-driven animation where the browser supports it, and stays static everywhere else. No scroll listener is added for this.

### Without JavaScript

The compact bar hides its menu button (`js-mobile-nav-toggle`) and the complete static link list (`no-js-mobile-nav`) takes over, as it did before the shell existed. The top bar drops out of fixed positioning (`no-js-primary-nav`) and `#main-content` loses its top offset.

The tab bar deliberately has no rule in `src/lib/a11y/no-script.ts`. It is four links and CSS, it needs no scripting, and it stays fixed, which makes it the persistent navigation once the top bar goes static. The reserved bottom band therefore stays reserved. The sheet is one flat rule list injected inside `<noscript>` and stays free of media queries: a rule there applies at every width, so forcing the tab bar visible would also show it on desktop. A shell control that genuinely needs scripting carries `js-shell-only` and is removed rather than left inert.

### Not allowed

- A second `<main>`, or a second `<nav>` without its own accessible name.
- An interactive target below 44 by 44px, or a UI label below 12px, including tab labels and the footer summary.
- `transition: all`, an infinite or decorative animation, more than one moving region at a time, or a second fixed progress indicator.
- Layout that depends on JavaScript, state that changes at hydration, or a bar that hides itself from a scroll listener.
- Reader focus mode with an empty band: removing the tab bar without rendering the reader bar that replaces it.
- A destination or a label in the tab bar that varies by cookie or by any other request state the public cache does not vary on.
- `100vh` for shell heights. Use `100svh` or `100dvh`, and read device insets only through the safe-area tokens.
- `maximum-scale` or `user-scalable=no` in the viewport.
- Dropping a destination or a fact on mobile that the desktop layout still shows. The shell reorders, collapses into disclosure, and moves rows into rails; it does not shorten the site.
- The mirror of that: a second link set for a destination the page already renders at this width. Below `lg` the learner sees it twice; on desktop it is a hidden duplicate that a `.first()` query resolves before the real one.
- Hard-coded 48px or 56px offsets anywhere in the shell. Use the tokens.

Printing needs no shell rules: the print stylesheet already hides every `nav` and the footer.

## Interaction Grammar

Every learning instrument follows three visible beats:

1. **Commit** — predict, classify, choose, or construct before seeing the result.
2. **Test** — manipulate one bounded variable, run the case, and inspect the contrast.
3. **Revise** — explain the changed evidence, correct the rule, and apply it in a new context.

Internal workflows may retain more persisted steps, but the learner sees no more than three simultaneous stage choices. Five course milestones may add a durable project and exportable artifact. Smaller lessons use the same grammar without the full project shell.

Completion represents a demonstrated decision, explanation, experiment, retrieval, or artifact. Page visits, “mark as read,” arbitrary points, streaks, and decorative badges do not establish mastery.

## Feedback And Recall

- Feedback states what changed, why it changed, and what the learner should inspect next.
- An attempt precedes hints or model answers.
- Immediate feedback is not a universal default. Timing follows the task, learner action, and opportunity to retrieve or self-correct.
- Strong and weak states are compared directly when the distinction matters.
- Retrieval starts free-form before recognition choices and can return on a spaced schedule.
- Transfer changes the context while keeping the principle stable.
- The course hub shows the next unfinished proof or due recall, not an activity score.

## Motion

WCAG 2.2 requires Pause, Stop, Hide at Level A for qualifying automatic motion or updating; suppressing interaction-triggered motion is AAA. The rules below are a deliberately stronger platform policy, not a claim that every item is required for WCAG AA.

- Motion communicates causality, spatial relationship, progress, or feedback.
- Learner-triggered state transitions take 120–200ms; finite structural reveals take 250–450ms.
- Animate transforms and opacity. Do not use `transition: all`.
- One region may carry meaningful motion at a time.
- Infinite tickers, status pulses, decorative loops, and universal reveal-on-scroll effects are removed. Three narrow exceptions are defined below: the homepage globe (the desktop projection from 1024px, the phone horizon globe below it, never both), the `/login` dot field, which the owner requested as that page's background, and the five workshop scenes on the stage under the poster band (each stoppable by the on-page pause control).
- Every gesture and animated comparison has a keyboard, tap, and static reduced-motion equivalent.
- The data book (`/buecher/ki-landschaft`) adds two documented scroll-linked exceptions, C2 and C4, and a one-shot cover settle. They are the only scroll-linked motion on the site; see "Data book" below.
- Homepage boards (course route, resources): under a mouse a card tilts at most 4 degrees towards the pointer and a soft paper light follows it, behind the text. Touch and pen get no tilt; reduced motion holds the cards flat. The route's lesson count ticks up once (450ms) when it first scrolls into view; the server renders the final number, and a count already on screen never restarts.

### Homepage globe: narrow continuous-motion exception

The desktop homepage globe may rotate continuously because its movement carries the route map: each pan connects one of six public-resource words to a geographic position. Freezing after the first word makes that relationship unavailable and turns the globe into a large decorative wireframe. This exception does not permit ambient motion elsewhere. The globe remains the only moving region in the hero.

The exception has four enforced boundaries:

- It exists only from `lg` (64rem, 1024px at the default font size). The desktop globe, the phone band and the phone renderer all switch on that one rem query, so the two globes never run at once, whatever the browser's default font size. The projection module and SVG tree are not loaded or rendered on mobile, where they compete with the first action and can overlap the headline.
- `prefers-reduced-motion: reduce` produces a static desktop composition. The animation effect checks the media query directly, so it cannot run a live frame while React synchronizes the preference. Leaving the hero viewport, hiding the document, or scrolling through the hero also suspends projection work.
- A visible 44px pause control sits beside the primary action whenever the globe moves: a toggle button with a fixed localized name ("Globus anhalten" / "Pause the globe"), `aria-pressed` for its state, `aria-controls` naming the globe and a visible focus indicator. It is the same control as on the phone band. The globe itself is not a target.
- Projection work follows the historical production cadence: a 60fps cap, a 7-second location cycle, a 78% dwell, and a 2-second opening delay. This replaces the visibly stepped 10fps ambient mode and the accelerated 4.6-second cycle. Unit sphere vectors are precomputed, frame rotation trigonometry runs once per frame, and high-refresh displays remain capped. Check total blocking time by hand with the Lighthouse checklist in `../perf-budgets.md` before a release that touches the hero.

A CSS rotation of one pre-rendered disc was rejected because it breaks the country projection and disconnects the typed resource word from the destination pan. Keeping the real projection with desktop-only loading, viewport suspension, scroll suspension, document-visibility suspension, and a 60fps cap preserves the information while bounding unnecessary main-thread and paint work.

### Phone globe: narrow continuous-motion exception

The homepage hero is one band at every width, in the home scene (`HOME_SCENE` in `src/lib/plakat/palettes.ts`): the lemons band with a flat Mennige globe, Germany and the route in Butter, or the paper fallback with the ink line globe (never graphit). From 1024px it is a cover: the text on the left and the desktop projection running off the right edge. Below 1024px its identity anchor is the horizon globe: the globe seen from orbit, only its upper limb crossing the band, Europe below the horizon and Germany marked. It is a separate module from the desktop projection (`werk/horizon-globe-frame.tsx`, `werk/horizon-globe-renderer.ts`, `home/phone-globe.tsx`, `home/phone-hero.css`) and uses its own attribute namespace, `data-home-globe*`. The desktop globe's `data-hero-*` attributes never appear below 1024px. It is decorative (`aria-hidden`, nothing focusable inside) and carries no information that the page does not state in text.

The exception has these enforced boundaries:

- **The first frame is server-rendered SVG** in its exact final position, so the band is complete at first paint, the H1 stays the LCP element and nothing shifts. Reduced motion, `prefers-reduced-data`, Save-Data and no-JS visitors keep this frame: they download no renderer and get no pause control.
- **The opening is finite and CSS only.** The limb draws out from the apex, the graticule opens radially from Germany, Germany traces last, and one light sweep runs along the horizon. It lasts 3.3 seconds, runs once, exists only under `prefers-reduced-motion: no-preference`, and every animation ends in the frame's natural state.
- **The live renderer loads last.** A dynamic import after `load` plus an idle callback, after the opening has finished, and only below lg (re-evaluated when the viewport crosses the breakpoint; crossing it destroys the renderer and every listener). It draws the same frame into one canvas before hiding the SVG, so the handover is invisible.
- **The drift is slow and bounded.** About 3 degrees per second, eased in, time-based, capped at 60fps on high-refresh screens, backing store capped at DPR 2. A frame governor steps down to DPR 1.5, then 30fps, then DPR 1 at 20fps, and finally freezes on the current frame. Nothing is drawn while the page scrolls (one moving region), while the band is off screen, while the document is hidden or after `pagehide`.
- **It has a pause control** (WCAG 2.2.2, because the drift lasts longer than five seconds): a real 44px button after the primary action, with a localized name, `aria-pressed`, and a choice remembered in this browser. It exists only while the renderer runs.
- **Touch never blocks scrolling.** The globe sets `touch-action: pan-y`; only a clearly horizontal drag spins it, with inertia that decays within about 1.2 seconds.
- **The signal from Berlin plays once, then gets out of the way.** Over the globe window a server-rendered SVG layer (`home/hero-signal-frame.tsx`, same viewBox and slice as the globe frame) sends a ping from Berlin and ten flight arcs to places on the visible face of the globe; a light runs each arc and each lands on a node. It is CSS only (dashes, opacity and transforms in `home/phone-hero.css`), lasts about five and a half seconds and fades while the globe still rests on Berlin. Its resting state is invisible: it plays only after `home/phone-globe.tsx` sets `data-home-intro="play"`, which it does once per page view and only for a browser that would also get the moving globe (below lg, no reduced motion, no reduced data, no Save-Data, no remembered pause). Pausing the globe settles it at once. No text, nothing focusable, a few kilobytes of HTML.

### Login dot field: narrow continuous-motion exception

The `/login` background is the owner's reference design: a static 14px dot grid with a vignette, and above it a canvas of eight dot-matrix shapes (ring, hexagon, triangle, square outline, asterisk, plus, disc, filled square) in muted blue, violet, teal and amber that drift, turn slowly and shift a little with the cursor. It carries no information; the card in front of it holds the whole task. It is the only moving region on the page.

The exception has these enforced boundaries:

- **The motion is decorative and confined.** The canvas is `aria-hidden`, has no pointer events and sits in a fixed, viewport-sized layer that the login section clips, so it never reaches the nav or the footer. The renderer is a lazy client chunk (`src/components/login/dot-field.tsx`, `next/dynamic` with `ssr: false`) with no inline script, so the CSP is unchanged.
- **Reduced motion gets the static grid only.** Under `prefers-reduced-motion: reduce` the chunk is not loaded, no shape is drawn and no toggle is rendered; the renderer also checks the media query itself and CSS hides the canvas.
- **It is cheap.** Each shape is rasterized onto the dot grid once and then moves as a rigid body. Frames are paced at about 30fps, the backing store is capped at DPR 2, and nothing is scheduled while the document is hidden or the scene is paused. The scene clock only advances on drawn frames, so motion resumes without a jump.
- **A visible 44px pause toggle sits at the top right of the scene whenever the shapes move** (WCAG 2.2.2, because the drift lasts longer than five seconds): a real button with a fixed localized name ("Hintergrundbewegung anhalten" / "Pause background motion"), `aria-pressed` for its state, `aria-controls` naming the backdrop, a visible teal focus ring, and a choice remembered in this browser.
- **The card's entrance is finite.** It rises in once (450ms, its rows staggered by 40ms) under `prefers-reduced-motion: no-preference` only, and ends in its natural state.

### Data book: scroll-linked exceptions, the chapter stage and the cover

The data book ("Von außen gesehen", `/buecher/ki-landschaft`) is the one place where scroll position drives a figure, because two of its figures are an argument that unfolds in order and a still frame would drop the order. Everything else in the book follows the rules above: figures are learner-triggered (120 to 200 ms) or a finite reveal (250 to 450 ms), transform and opacity only, and one moving region at a time. Each figure is a pure function of `progress` (`renderFigure(spec, progress)` in `src/lib/figures`); scroll, a button, autoplay, reduced motion and print only choose the number. Reduced motion, no JavaScript and print call it with 1.

**C2, the iceberg: scroll scrub.** Where the browser supports `animation-timeline: view()`, CSS moves the parts of the iceberg with the scroll position while the stage is in view; elsewhere one IntersectionObserver plays the same keyframes once. No scroll listener, no layout property, only transform and opacity. Reduced motion and no JS show the finished iceberg. The figure states in text what it shows ("Sichtbar sind 2,2 Prozent ...") so the scrub carries nothing that is not also written.

**C4, the waterfall: sticky stage.** One sticky stage (from 1024px beside the text, on a phone above it) with four step cards of at least 70svh. One IntersectionObserver sets `data-step`; the chart draws `stepProgress(spec, step)` and tweens between steps in 400 ms. The same steps are real buttons (`aria-pressed`, `aria-label` "Schritt n"), so the keyboard has the whole path. Under reduced motion, without JS and on screens shorter than 700px every step is stacked as its own static figure, decided in CSS only so hydration never changes the layout. The stage must fit the screen with its readout and buttons (`max-height` on the chart). Steps that come later are drawn as dashed outlines ("kommt noch") so the empty part of the chart reads as a plan.

**Chapter stage: one pinned stage per insight chapter.** The hero figure of a chapter sits in a pinned stage (`::stage{id="..."}` in the chapter markdown; `src/components/book-reader/stage`): 58svh full-bleed on a phone, 60svh on wide screens, with the giant numeral (132px at 390, up to 280px), the claim (at most 12 words), the unit line, Weiter and Zurück (48px, real buttons), "Schritt 2 von 4" as text and the visible source line. Three to four step cards of 65 to 70svh scroll past it; one sentence each. The shell is server markup; its only script (`stage-controller.ts`, started when the browser is idle) reads the card positions with `getBoundingClientRect` in an animation frame, writes `data-step` and `--cs-p` on the stage element and publishes the state through a small DOM event protocol (`stage-protocol.ts`, `use-chapter-stage.ts`): `step`, `stepProgress` (plays over the first half of a card block, finished when the card is centred) and `progress`. A figure inside learns the state from the protocol and draws progress 1 whenever it hears nothing. Nothing outside the stage element changes while the reader scrubs. Reduced motion, no script, screens shorter than 560px, print and the chapter pause switch (a CSS-only native checkbox with `role="switch"`) all stack the steps as text, each with its numeral, and show the figure at progress 1; that layout is decided in CSS only.

**Cover stage: the reel slot.** The cover (`book-landing.tsx`) is a poster band, then a stage on paper: the headline number over a field of 1.000 squares as three batched SVG paths (one square is 0,1 %, a share under one square is a partial square, never rounded up), card A "Kapitel 1 lesen", card B "PDF laden", the small link "Wo stehe ich?". The field is the poster frame of the 30 second reel and the LCP element. The reel engine loads lazily after idle, only without reduced motion, drives a canvas with `seek(t)` (contract in `reel/reel-contract.ts`), pauses off-screen and in a hidden tab, and has a 44px pause switch; without an engine the poster stays and no switch is shown.

**Explorer "Wo stehe ich?".** Placed with `::explorer{}` (model: `content/books/<slug>/explorer.json`, coefficients and bootstrap draws, validated at build time, k = 5 enforced). The browser computes the estimate and its 95 % interval; nothing is sent. Four native controls (44px), the field of 1.000 squares re-sorts column by column in 180 ms (instantly under reduced motion), one `aria-live` sentence, and a static table of every Branche by every fifth for print and no script.

The boundaries are enforced by tests: `src/components/book-reader/stage/*.test.*` (the protocol, the controller, the CSS contract: no radius, gradient or shadow, hover only on fine pointers, a fixed 3px Mennige focus ring, static layout in CSS), `src/components/book-reader/reel/cover-reel.test.tsx`, `src/components/book-reader/explorer/*.test.*`, `src/components/book-figures/story/story-contract.test.ts` and `story-islands.test.tsx` (steps, buttons, finished state at progress 1), `src/lib/motion-policy-contract.test.ts` (no catch-all transition), and `tests/e2e/book-figures.spec.ts`. A figure that needs a third scroll-linked effect needs a new entry here first.

### Data book: data policy

The book shows aggregates and nothing else. These rules are tests, not intentions:

- **Aggregates only, k = 5.** A count of 1 to 4 is never stored; the value is `null` and the figure prints "weniger als 5" (hatched). No firm names, domains, URLs, addresses, e-mails, phone numbers, prices or per-site rows, and no ranking of named firms. Kreise and Länder are places, not firms; the Kreis funnel names only the few places that leave the chance band and offers no ranked list.
- **One source for numbers.** `content/books/ki-landschaft/figures/<id>.json` (a FigureSpec plus `meta`: `methodVersion`, `frozenOn`, token `values` and `aliases`). The chart, the prose tokens (`{{c4.weighted_share}}`, resolved at build time; an unknown token fails the build), the CSV files in `public/books/ki-landschaft/data/` (`bun run book:data`, checked byte for byte by `src/lib/book-figures.test.ts`) and the PDF figures (`scripts/render-figures.mjs`) all read these files. List the tokens with `bun run book:tokens`.
- **Every file passes the privacy gate** before the reader sees it: `parseFigureSpec` and `findPrivacyFindings` at load time (a failing file stops the build), the schema-and-denylist mirror in `src/lib/figures/privacy-gate.test.ts` over the figures folder, and the private `privacy_gate.py` (database hash check) before a file is copied in. The repository never holds a database copy, a per-site flag or a URL list.
- **Honest labels.** A figure whose `meta.methodVersion` starts with `v0` (the export before the one-method rescan) shows "Vorläufige Daten" until the final export replaces it. Every figure carries one visible source line under it (Figtree, at most 20 words: n, window, limit, and for firm attributes the static sentence "Wird mit geprüften Websites neu gerechnet"), a plain CSV link in that line, and the plotted numbers as a visually hidden table for assistive technology. Nothing in the book collapses: no `<details>`, no accordion, no sheet (`src/components/book-figures/shared/source-line.tsx`).
- **No scores, no rankings.** The old 0 to 100 score is gone. The book measures one thing, "das Wort KI steht auf der Website", for firms with a findable website, and says that it is not adoption.

### Workshop stage and scenes: narrow continuous-motion exception

Every workshop detail page has three parts under the same rules: the poster band (the plakat system as it draws any band, with the workshop's poster picture and its big numeral, nothing laid over them), the **stage** right under it, and the always-visible kit explainer (heading, two short sentences, two or three facts; `stageExplainer` in the registry) below, then one slim provenance line. The stage is a section (`data-workshop-stage`, sr-only h2 "Starten" / "Start") of two big animated action cards and that workshop's own motion scene next to them, plus one pause control (`src/components/workshops/workshop-stage.tsx`, `action-cards.tsx`, `workshop-stage.css`, `action-cards.css`). The visible "Nach dem Workshop / After this you can" and "Der Fall / The case" sections do not exist any more: `outcomes` stays in the registry and the machine surfaces, and the case, its question and its figures stay in the registry only. **No collapsible UI anywhere** on the workshop pages (detail, kit, hub): no `<details>`, no accordion, no toggle; short content is shown, the rest is cut from the page.

**The action cards.** Card A opens the first material (the slides, or the lab for a workshop without a deck), card B hands over the second (the kit zip with a bare `download` attribute, or the case). Each is one real link (`WorkshopMaterialLink`, so the open is counted) with a stretched hit area, a picture that moves and a meta line ("Deck, 60 Min." or "ZIP, 1,1 MB": time and size, never a slide count). A workshop with a kit page also gets one small secondary link to it, on the same row as the meta line, so no card is taller than its neighbour. The meta is the time alone for a lab or a case ("45 Min."), "Deck · 60 Min." for slides (a deck without its own minutes shows the workshop's length, "ca." when it is the self-study time, never just a language), "ZIP · 60 KB" for a kit. The arrow sits on the title row, right. The data comes from `workshopStage(workshop, locale)` in `src/lib/workshop-stage.ts`. Cards are hard-edged, with a 2px scene-line border; card A sits on the scene ground in the scene ink, card B is inverted, so both pairs hold the 4.5:1 of `docs/plakat-pairings.md`. The one accent is the scene's mid colour, on shapes only. The pictures: slides (three fanned frames, the top one the workshop's own poster cover with a progress bar), kit (a box, four file chips dropping in, a download arrow), lab (a browser window, a sliding knob, a forecast line that draws), case (a sheet, three bars rising, a marker). They idle on a 6 second loop with a small amplitude and move more under hover and keyboard focus. The kit chips stay in the box until the last 5 percent of the loop, so the frame is never half empty. Layout: a compact row below 64rem (a 5.75rem picture left, 5rem below 380px; two columns of rows from 48rem), the picture on top from 64rem.

**Layout.** On a phone: card A, card B (96px rows with an 80px picture, heavier strokes and no dust below 40rem), the scene (4:3, the 6:5 art scaled by 1.111 so it fills the box), and the pause control as a 44px icon button in the scene's top-right corner (no row of its own; a 36px translucent disc, 8px from the frame, 12px at lg). The band's poster is a strip (numeral flush left, motif bleeding off the bottom right, 76px), the lede is set at 1.4 leading, and the headline scales with the width below 380px, so all phone widths give the same lines and the stage starts near y 360: the band, both cards and about 190px of the scene share the first 390 x 844 screen. From 40rem the two cards stand in one column (5fr) beside the scene (6fr, 4:3), as tall as the scene. From lg the cards sit side by side on the left (7fr, picture on top) and the scene on the right (5fr, 4:3); at 1440 x 900 both cards and the whole scene are on the first screen. A mouse or keyboard focus lifts a card 2px over a solid 4px offset block (a pseudo element, never a box-shadow), nudges its arrow 4px and speeds its picture up; a press sinks the card 1px. Focus also draws one 3px ring in the fixed `--color-mennige` (the scene tokens swap `--color-brand-orange` to the scene ink, which is pale on a dark card). Role, not page, sets the fill: card A (slides, lab) is always the outlined card, card B (the kit download, the case) always the filled one. The meta line is a small pill (the time or the file size), and the optional secondary link is a 44px target named with the workshop's topic. On a phone the kit picture shows two big chips (the second and third wait for the tablet). The lab picture's lead dot rides the forecast line as it draws. On load card A settles at 0 s, card B at 0.12 s and the scene at 0.3 s. The kit card carries the workshop's own four chips (dashboard tile, five fields, question sheet and leaf, traffic light). The cards run on the stage's `--ws-t` clock. A workshop whose scene is not wired yet shows its two cards across the full width, so the page is never broken in between.

**The scenes.** One scene per workshop, registered in `HERO_SCENES` in `src/components/plakat/hero-motion.tsx` (slug to key in `HERO_MOTION`): 01 `cone`, 02 `trace`, 03 `mend`, 04 `weave`, 05 `links`. Each is a component `<Key>Scene()` with no props in `hero-<key>-scene.tsx` and one stylesheet `hero-<key>.css` with a unique class prefix (`hc-`, `ht-`, `hd-`, `hw-`, `hk-`), every selector under its root class. The band, the hub thumb, the social card and the deck cover always keep the poster motif.

The scene contract (each scene's test reads its CSS and markup):

- **One frame**: a single viewBox `0 0 600 500`, `preserveAspectRatio="xMidYMid meet"`, `class="block size-full"`, `aria-hidden`, `focusable="false"`, `data-hero-motion="<key>"`. Meaningful content stays inside x 50 to 550 and y 50 to 450. The wrapper `.ws-scene` paints the scene ground with a 2px scene-line border. No text, numeral, id, `<defs>`, `<use>`, gradient, filter or shadow in the SVG; nothing focusable.
- **Server-rendered SVG and CSS, zero JavaScript, no library.** Colours only through `var(--color-scene-*)` and `--color-paper`; no hex.
- **The base styles are the finished still frame**, with the last beat of the story visible and readable. Every keyframe, animation and transition sits inside `@media (prefers-reduced-motion: no-preference)`; a `reduce` block also sets `animation: none` and `transition: none`.
- **Only `transform`, `opacity` and `stroke-dashoffset` move**; no layout property animates. At most 16 elements are animated (a group counts once) and `will-change` sits on at most 4.
- **Time**: a 0.9 second intro that assembles once, then one loop of `--ws-t` (9 seconds, set on `.ws-stage`; keyframe percentages are seconds divided by 9). Nothing flashes more than three times a second and nothing flashes full frame.
- **Pointer**: while a mouse is over the stage (`hover: hover` and `pointer: fine`), the scene swells by a plain `scale(1.02)` (`workshop-stage.css`, no perspective, so thin lines stay sharp). Touch and keyboard focus get the plain loop.
- **Off screen**: `.ws-scene` carries `content-visibility: auto`, so a scene below the fold paints and animates nothing until it scrolls near.
- **Style**: stroke 2.5 for main lines, 1.6 secondary, 1 hairline, round caps on lines and miter on frames; containers have no radius; the motif is the dot and the packet; `ink` for objects, `mid` as the single accent (the one thing that matters), `ground` for knockouts, `paper` at 7 to 12 percent for stepped flat discs as soft depth. Meaning is carried by shape and position, never by colour alone (check, dash and cross glyphs). Three depth layers (far discs and dust at 20 to 30 seconds, mid structure, near packets), staggered reveals, one morph per story, a rest beat before the loop restarts.
- **Budget**: each scene's CSS at most 12 KB, its SVG at most 20 KB.

**Pause (WCAG 2.2.2) is met on the page.** The stage carries a CSS-only control: a 44px square label around a visually hidden but focusable checkbox, an icon button in the scene's top-right corner (inset 8px, above the scene, so it takes no row and its width never changes). The checkbox has `role="switch"` and one stable accessible name ("Bewegung pausieren / Pause motion"), so checked always reads as paused; the two labels ("Bewegung anhalten / Stop motion", "Bewegung starten / Start motion" while stopped) are visually hidden and `aria-hidden`, the icon (two bars, a triangle while stopped) shows what a tap will do. Without a scene the control keeps a slim row under the cards with its label. Checked, `.ws-stage:has(.ws-pause-input:checked) :is(*, *::before, *::after)` sets `animation: none !important` and `transition: none !important`, so every card and scene returns to its finished still frame. It has a visible 3px focus ring, keeps no state across visits and is hidden under `prefers-reduced-motion: reduce`, where nothing moves.

**The links (Workshop 05).** The demo's first screen as shapes: eight request tabs on the left, eight file cards on the right, and a line from each request to the file whose name fits. A band sweeps down the rows while four test ticks under each line fill in. Two links hold, four turn dashed (weak) and two break apart with a cut (gap); each failing file gets an accent frame and its one failed test is marked, the tests after it stay hollow. Meaning sits in shape (solid, dashed, broken), never in colour alone. Its still frame is the finished result: two solid, four dashed, two broken.

### Demo hub: five trailers

`/demos` ("Zum Anfassen" / "Hands on") is a wall of five tiles, one per workshop, on a hard-edged grid: one column on a phone, two from md, three from lg, with a sixth cell that states the promise all five share ("0 bytes of yours leave your device"). Each tile is a live miniature of the demo's own object in the workshop's own ground, then the demo's name, the surprise in one sentence and what the visitor takes away. The hub no longer uses posters or numerals as thumbnails, never shows minutes, and has no filters.

Motion on the hub is allowed because nothing loops. A miniature plays one story of at most 3.6 s (settle, plausible, turn, snap) the first time it is 60 % in view, replays on a fine pointer's hover or on keyboard focus, and holds its end frame, which is the surprise. Reduced motion, no script and print show the end frame. No pause control is needed (an auto-start motion under five seconds, WCAG 2.2.2), and a replay of one tile never touches the others, which keeps "one region carries meaningful motion at a time". A miniature may carry figures (one or two numbers, set in tabular numerals, locale-formatted); text lines are drawn as bars.

Authoring: a tile is a server component `src/components/demos/<slug>/tile.tsx` (default export, props `{locale, reducedMotion?}`, a 400 x 300 SVG that draws the END frame, colours only from the scene's tokens through the `dt-*` classes) plus `tile-motion.ts` (`MOTION`: `storyMs` and tracks on one clock p, props `tx ty sx sy o dash` only, the last key is the base style). `bun run demo-tiles:generate` compiles the tracks to `src/components/demos/hub/tile-scenes.css` (committed; a test fails when it is stale). `src/lib/demo-tiles/motion.ts` is the pure `sample(track, p)` plus the compiler, so motion stays a function of progress. The one client island is `demo-tile-stage.tsx`. States use the anti colour of the scene (offset block, underline), a 3px Druckschwarz focus ring and a second anti colour on press, as the workshop stage cards do. Hub budget: SVG under 3.6 KB per tile and all tiles with their css under 12 KB gzip.

Each demo lives at `/demos/<workshop-slug>` (and `/en/demos/<workshop-slug>`) in the workshop's Plakat band and renders on the server; the band shows the name and the one question, the promise follows on paper. Its folder contract (index.tsx picks one language pack, `tile.tsx`, `tile-motion.ts`, a server-only `copy.ts`, no network primitive, no collapsible UI) is checked by `src/components/demos/demo-contract.test.ts`. Under `prefers-reduced-motion: reduce` a demo shows its end state. The registry is `src/lib/demos.ts`; each demo is a static import in its own route folder. The twelve earlier gallery demos redirect (308) to their closest workshop demo or to the hub (`src/lib/demo-redirects.ts`).

## Authorship And Evidence

- Course authorship, source revisions, limitations, and access boundaries remain visible.
- Generated or synthetic examples are labeled.
- Published facts link to sources when a source is necessary to evaluate the claim.
- Provenance establishes origin and tamper evidence, not truth; factual verification and accountable review remain separate states.
- A rationale is not a source. Conflicting evidence, model disagreement, and unresolved uncertainty remain inspectable.
- AI is a constrained coach or analysis tool, never the unexplained author of the learner's answer.
- Every lab preserves learner ownership through prediction, evidence selection, and revision.

## Route Responsibilities

- **Home:** establish identity and route the learner. Keep the globe, core claim, one supporting sentence, and one primary action.
- **Course atlas:** select a goal, expose relationships, and provide one recommended next proof. Full metadata stays available on demand.
- **Lessons:** put the active decision before reference prose. Keep reference material crawlable and keyboard-accessible.
- **Workshops:** open with a real bounded decision, then expose reusable material and sources.
- **Demos:** make assumptions, execution mode, external actions, and abort conditions visible at the example.
- **Books and editorial:** optimize reading while inheriting platform spacing, focus, provenance, and the single progress thread.
- **Information, legal, and account routes:** remain conventional, compact, and explicit. Experimental interaction is not added where it has no task.

### Access surfaces: flat by policy

`/konto`, `/login`, `login-form`, `/feedback` and `feedback-form` stay flat: no `shadow-card`, `shadow-card-hover`, `shadow-tile`, `shadow-[`, `hover:-translate`, `active:translate`, `transition-all` or `rounded-full` in their page files. This is a review rule, not a test. Do not elevate these surfaces by switching hand-written markup to the shared `<Card>` either: they are the platform's dense, conventional idiom. Change the policy here first if it should change.

### The account catalog is one page, not a route tree

`/konto` stays a single route with labelled in-page sections. It is not split into `/konto/kurse`, `/konto/weiterlernen` and `/konto/nachweise`.

Not for safety: `PROTECTED_PATHS` matches `/konto/:path*`, so sub-routes would inherit the auth gate, `noindex, nofollow, noarchive` and `private, no-store` automatically. The reason is that the split is not warranted. The catalog holds eight courses; filter and sort carry that on one page, while three routes would each need an English mirror, a page-inventory row, metadata and tests, and would strand a learner with no records on an empty `/konto/nachweise`.

"Account settings reachable from persistent navigation" is therefore satisfied in-page. A second `<nav>` must carry its own distinct accessible name: `getByRole("navigation", { name: "Account privacy" })` is a single-match query and an unnamed or similarly-named sibling makes it ambiguous and trips the axe landmark rule. Section labels must also avoid colliding with `continueLabel` ("Weiter lernen") and `resume` ("Weiterlernen"), which differ only by a space and are both asserted by exact-text queries.

### `/kurse` keeps its progress display: a recorded deviation, not a met criterion

The `/kurse` teaser brief asked for "no progress meters, no per-row accordions", with every progress affordance moving to `/konto`. Both are still on the page, deliberately. This is written down because it is a **deviation from a stated criterion**, and a deviation that is not recorded is indistinguishable from an oversight.

Three things drove it:

- The same brief also required carrying all fourteen load-bearing hooks across. The per-row progress display is one of them, and the two instructions contradict each other.
- The suite pins that display by contract: `course-progress-*`, `progress-pct-*` and `progress-dots-*` testids, plus the `<details>` "Fakten und Zugang" block. Removing the affordances means rewriting assertions that exist to guard them, on a surface that is currently green.
- The split it was meant to serve is satisfied anyway. `/konto` is now the catalog, and `/kurse` carries a "Fortschritt in deinem Konto ansehen" link into it, so the two surfaces no longer compete to be the progress home.

What `/kurse` gained instead is what the brief was actually after: poster thumbnails grouped by track, goal filters, and a demo teaser. If the progress display is later moved, move it wholesale and delete this note rather than letting the two surfaces drift.

### Account progress presents evidence, not rewards

`konto/page.test.tsx` asserts no `XP`, `streak` or `badge` appears in rendered English text, even though `UnifiedProgress` carries all three fields. The ban stands: an account page states lessons completed, percentage, record earned, and outcomes covered — every number traceable to evidence-gated progress. This is the audit's "compact evidence rows and project ledgers instead of reward cards" made executable, and it is why the stored gamification fields remain export-only.

## Enforcement

The numeric, visual, and implementation constraints in this section enforce the platform contract. They remain distinct from the WCAG conformance checks named beside them.

The release gate covers the contract below. Current gate outcomes are recorded only in the [platform design audit](./design-audit-2026.md#release-gate-status); listing a contract here does not claim that it passed.

- one global progress indicator and no route-specific fixed duplicates;
- no unapproved course-level base palette or typography system; poster palettes come only from `src/lib/plakat/palettes.ts`, and every pairing in [`plakat-pairings.md`](./plakat-pairings.md) meets its floor (`palettes.test.ts` runs `scripts/plakat/build-pairings.mjs --check`);
- no `transition: all`, unpausable decorative loop, or UI label below 12px in changed shared components;
- keyboard, focus, target-size, reduced-motion, overflow, hydration, and locale parity;
- reviewed desktop and mobile screenshots for every route family;
- unit and browser contracts for Commit, Test, Revise, feedback, and persisted progress.

## Evidence Basis

The [design research memo](./design-research-2026.md#canonical-research-decisions) is the canonical claim-to-source record. This contract consumes its decisions without duplicating study summaries:

| Decision | Contract consequence                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| `DR-01`  | Commit, Test, and Revise require constructive learner work rather than arbitrary interaction.                       |
| `DR-02`  | Explanatory feedback follows a meaningful attempt; timing follows the task.                                         |
| `DR-03`  | One task-relevant signal replaces stacked cues and decorative competition.                                          |
| `DR-04`  | Learner input and state persist through prediction, manipulation, and revision.                                     |
| `DR-05`  | Source, method, version, limits, and conflicts remain adjacent to inspectable results.                              |
| `DR-06`  | Distinctive instruments use a stable grammar with keyboard, touch, pause, and static equivalents.                   |
| `DR-07`  | Generated-material labels, rationales, provenance, and factual verification remain separate states.                 |
| `DR-08`  | Palette, geometry, density, progress, and anti-slop exclusions remain testable platform policy, not universal fact. |

### Anti-colour states (workshop pages)

A hover, focus-visible or press state introduces a colour that contrasts with the element, never a repeat or a shade of its own. The stage cards take a per-plakat anti colour (`--color-scene-anti-a`, `--color-scene-anti-b`; table with contrast ratios in `globals.css`): a palette accent, Mennige `#b73a15` or Druckschwarz `#121212`, never the card's colour, at least 3:1 against the card or 60 degrees of hue apart. It colours the offset block behind the card. Links use a thick Mennige underline (`.anti-link`), buttons an offset block (`.anti-btn`), the pause control a border in the anti colour. Rules: hover only inside `(hover: hover) and (pointer: fine)` so a tap never sticks; a press has its own `:active` answer (block and underline); text keeps 4.5:1 in every state and focus rings 3:1 against both neighbours; motion stays transform and opacity and is reduced-motion safe.
