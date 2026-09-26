# home-hero-polish: change log

This pass applies the home-hero critique: every high and medium item, plus the cheap low ones.

## Globe (the "insanely cool" moment)
- **Push-in (high).** `horizonFrame(width, height, push)` now takes a push factor. `horizonPush()` is 1 on short and square slots. It is `1 + (h/w - 1) * 1.6` on tall ones, capped at 1.55. The server frame stays at k = 1. After the takeover the renderer eases k to its target over 1.4 s on the deck ease (`easeDeck`, a bezier solver). The sphere scales about the apex, so the limb stays where it is and Europe grows into the empty lower half. Reduced motion and no-JS keep the k = 1 frame. The ground shade is now `min(55%, 20rem)`.
- **Lernroute (high).** A Mennige great circle runs from Berlin to 6.5N 3.4E, heading south-west across the Alps, the Mediterranean and the Sahara. It goes down the band towards the CTA and sinks into the ground shade. Three small square stations sit on it (course stations 2 to 4; Berlin is the first).
  - In the server frame it is `.hz-route`: `pathLength` 1, `hz-draw` 0.9 s on the deck ease, starting at 2.05 s. The stations fade in from 2.12 s, 0.1 s apart.
  - The renderer draws the same arc and stations, so the handover matches.
  - The opening still ends at 3.3 s.
  - The sweep dash is now 0.12. Verified visible at t = 2.25 s in shots/strip-390-2250.png.
- **Sky moves to canvas.** Limb, glint and degree scale are redrawn in the canvas, using the shared `limbPoint` / `limbExit` / `scaleTicks` / `HORIZON_GLINT` in horizon-projection.ts. The SVG sky layer is now `data-home-globe-ssr` and steps out at takeover. A fixed SVG limb would not meet the pushed-in sphere.
- **Two canvases.** The moving layer (meridians, coastlines, Germany, route) redraws each frame. The fixed layer (parallels, which are invariant under the polar spin, plus the sky) is a second `<canvas data-home-globe-static>` in hero.tsx. It redraws only during the push-in and on resize.
- **Governor (high).**
  - The drift runs at 30 fps. 60 fps is used only during the push-in, drag or coast.
  - Tiers: {2, 30/60}, {1.5, 30/60}, {1.5, 24/30}, {1, 20/30}.
  - The governor is `createFrameGovernor()`, a pure factory with tests. It takes an EMA of frame cost, measured from the start of the rAF callback to the next task (a MessageChannel ping). That span includes the raster and paint that draw() only records; measuring draw() alone read about 1.5 ms while real frames cost 10 to 15 ms at 4x.
  - Each sample is clamped at 4x the budget. The budget is 10 ms. Twenty frames over budget step one tier down. At the last tier it freezes only above twice the budget.
- **Toggle (medium).** Still a 44px target, but borderless and transparent, with a 0.75rem glyph at 55% paper. It fades in over 0.4 s. Hover and focus show paper plus the outline.
- **Scroll finishes the opening (low).** A one-time passive scroll listener finishes every slot animation.

## Continue seat
- The seat is now `box-content h-[3.5rem] border-t border-hairline`, so the hairline is in the server HTML.
- The card has two lines:
  - "Erster Schritt: Claude Course" / "Weiter bei EU AI Act Kurs", in text-base semibold.
  - Access and duration, in text-sm.
- The arrow is a borderless 44px target.
- The card fades in over 200 ms (motion allowed only).
- The card is now 56px tall instead of 76px.

## Below the hero
- `@source not inline("overline")` in globals.css stops Tailwind from generating its `overline` text-decoration utility, so the doubled rule under kickers is gone. The kickers in offering, workflow and credibility are `max-lg:sr-only`.
- Credibility: the headline is now the h2, and the label is a `<p>`. Desktop is visually identical.
- Offering:
  - No two-colour heading below lg: the span gets `max-lg:text-foreground max-lg:block`, so it reads "Vier Kurse." / "Eine klare Reihenfolge.".
  - The artwork is `max-lg:hidden` (never requested on phones), and the `72px` sizes entry is removed.
  - The number is the lead column (`1.75rem`).
  - The lesson count is hidden below lg, and the duration is nowrap.
  - Rows are now about 59px.
- Rails:
  - `BOOK_RAIL_SHOWN = books.length > 1`, so there is no rail of one today.
  - Tiles are `w-[min(14rem,78vw)]` and `w-[min(18rem,78vw)]`.
  - The label gets `min-w-0 [overflow-wrap:anywhere]`.
- Workflow:
  - The /demos row is `max-lg:hidden` (the rail owns it). The /buecher row is hidden only while the books rail is shown.
  - Phone rows use new short bodies (`short` in home-copy, DE and EN) and never truncate.

## Measurements (dev server, no GPU, 390x844)
- **1x:** 162 ms/s task time (paused baseline about 130), tier 0, no long tasks. Before: 220 ms/s.
- **4x:** 301 ms/s task time (paused baseline 132), stepped down to tier 3 (canvas 390x483) and still running, no long tasks. Before: 976 ms/s at 49 fps with 52 to 146 ms long tasks, and the governor never moved.
- **Hero bottom / tab bar top:** 511, 787, 875 at 320, 390, 430. No sideways scroll and no page errors at any size.
- **Desktop 1440:** unchanged.

## Tests
- `bunx vitest run src/components/home src/components/werk`: 176 passed.
- New: horizon-projection.test.ts.
- Extended: renderer (push-in, paused, fixed layer, 30 fps drift, governor, ease), phone-globe (route, static canvas, scroll finish), workflow, credibility, offering, rails.
- Pins updated on purpose: 4.75rem to 3.5rem in continue-slot.test and companion-home-contract.test; the artwork contract.
- e2e specs edited but NOT run:
  - tests/e2e/mobile-access-disclosure.spec.ts: card height 76 to 56.
  - tests/e2e/homepage-methodology.spec.ts: artwork images must be hidden below lg and loaded from lg.
- eslint clean; tsc clean for these files.

Shots: mobile/home-hero-polish/shots/. Scripts: shoot.mjs, strip.mjs, perf.mjs, crop.mjs, desk.mjs.
