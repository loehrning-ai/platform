# kurse-mobile: /kurse concise on phones

Date 2026-09-26. Desktop (lg+) unchanged: 1440x900 document 4,414px, goals at 547, rows 143/191px, identical to before.

## Numbers (brand face, DSF 3, isMobile)

| Viewport | Height before → after | Screens | Goal rail top | Next-course button bottom | Ledger rows | Rows sum |
|---|---|---|---|---|---|---|
| 320x568 | 6,527 → 4,356 | 11.5 → 7.7 | 511 → 372 | 922 → 668 | 311–359 → 166–210 | 3,369 → 1,906 |
| 390x844 | 5,946 → 4,002 | 7.0 → 4.7 | 446 → 350 | 836 (under tab bar) → 604 | 265–331 → 148–192 | 3,072 → 1,762 |
| 430x932 | 5,656 → 3,938 | 6.1 → 4.2 | 446 → 350 | 809 → 604 | → 148–192 | → 1,762 |

No horizontal overflow, and nothing interactive in main under 44px, at any size (DE and EN).

## Changes

page.tsx
- Hero: 30px/1.08 H1 below sm (fluid-h1 from sm), 15px lead, tighter padding (pb-10 pt-4), the KI-Check link on the "Unsicher?" line at 390+.
- Access section: compact SectionHead and a 15px body on phones; workshops band py-8 and a 22px head on phones.

learning-atlas.tsx
- Goal selector: below lg a single-row horizontal chip rail (square chips, ink fill = pressed, snap-x, bleeds to the screen edge so a cut chip signals more). From lg it is the same joined 4-column tab row (lg:grid lg:grid-cols-4, lg:-ml-px). A `?goal=` deep link scrolls the rail (not the page) so the pressed chip is visible.
- Next-course sheet: p-4, duration folded into the kicker line on phones ("Offener Einstieg ohne Lernkonto · ca. 2 Std.", no-wrap on the duration), 20px title, 15px promise, full-width Mennige bar (label left, arrow right); sm hands back the old layout. The kicker label is its own span so exact-text lookups still work.
- Path: compact vertical Route. Each station is one 44px line (title, then duration · state on the same line, wrapping when long); sm stacks it again. Path head 18px, summary 15px.
- Ledger head: 22px on phones; "Fortschritt in deinem Konto ansehen" is `max-lg:hidden` (the Konto tab and the cost note cover it).
- Level chips bar: py-1 on phones, and `[@media(max-height:700px)]:static` so it stops sticking on short phones. `sticky top-[var(--nav-h-compact)] lg:hidden js-shell-only` kept.
- Group spacing mt-5/space-y-8 on phones.

course-ledger-row.tsx
- Dense list item below lg: number, title (17px, 44px target with 6px given back via -my-1.5), promise clamped to ONE line (full text stays in the DOM/a11y tree), facts caption, then one wrapping line of links with the action first, then demo and source.
- Demo link on phones shows the noun only ("9 Praxisbeispiele"); " ansehen" is `max-sm:sr-only`, so the accessible name is unchanged and starts with the visible label. New copy field `tryDemoPhoneTail` (DE " ansehen", EN "").
- Desktop grid kept: the links block is placed at lg:col-start-2 lg:row-start-2, and the right-hand cells span both rows (lg wrapper, and dl/action at xl), so the links sit under the promise exactly as before. DOM order is now action → demo → source (tab order at lg changes accordingly; the visual layout does not).
- MIT source attribution kept visible on all six rows, both links, and min-h-11 everywhere.

## Tests
- learning-atlas.test.tsx: the goal test is rewritten for the rail and lg tabs; the h4 pin is now `text-[1.0625rem] sm:text-[1.25rem]`; there is a new phone-compaction test (Route line, sheet, one-line promise, links line order and lg placement, short-screen static bar, max-lg:hidden account link); the demo label is checked for its sr-only tail.
- catalog-surfaces-mobile.test.ts: new "/kurse below lg" block appended (hide/reorder restore pairing plus phone/desktop size pins). The existing demos assertion fails because of another agent's in-progress demos/page.tsx edit, not because of this change.
- route-kurse-hub.spec.ts: new density tests at 320/390/430 (rail top, one-row rail, next action above the tab bar on ≥800px phones, rows, screens) and a deep-link chip-in-view test. All 31 route-kurse-hub + courses.spec tests pass (Chromium, run against the dev server through a scratch wrapper config, because the bundled Playwright expects a newer browser build).
- vitest src/app/kurse: 82/82. eslint clean. tsc: no errors in these files.

## Not done / notes
- The task said "one-line promise". I kept that, although the audit preferred two lines. Two lines would make each row about 22px taller.
- Tech rows are still about 192px at 390: "Kurs starten →" plus "interactive-courses #0e5dfd3" do not fit on one 318px line without going below the 13px floor.
- Stale docs, which are not mine: design-direction.md §7.1 (phone goal tabs 2x2) and experience-system.md, which could add a /kurse density note.

Screenshots: mobile/kurse-mobile/{before,final}/*.png, crops/ ; scripts shoot.mjs, crop.mjs, pw.config.mts.
