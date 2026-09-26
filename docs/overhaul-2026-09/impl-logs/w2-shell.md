# w2-shell: phone shell (header, menu, tab bar, footer)

Date: 2026-09-26. Nothing committed. Shell geometry tokens (`--nav-h-compact`, `--tabbar-h`, `--tabbar-band-h`, `--nav-h`) are untouched. Desktop (lg and up) renders as before, checked at 1440x900.

## Files

Source:
- `packages/website/src/lib/navigation/site-sections.ts` (new): one table of section route prefixes (`LEARNING_ROUTES`, `WORKSHOP_ROUTES`, `EXAMPLE_ROUTES`, `PRACTICE_ROUTES`, `OPEN_SOURCE_ROUTES`, `ACCOUNT_ROUTES`) plus `matchesSection()`, which resolves the locale prefix first.
- `packages/website/src/components/mobile-tab-bar.tsx`: each tab now owns a section taken from that table (`matchPaths`).
- `packages/website/src/components/mobile-tab-bar-links.tsx`: `isActiveTab(matchPaths[], pathname)` delegates to `matchesSection`. The active tab also gets a heavier icon stroke (2.5), so it reads at a glance (audit S4).
- `packages/website/src/components/nav.tsx`: the Lernen and Praxis group state comes from the same table, and the phone menu sheet was rebuilt.
- `packages/website/src/components/footer.tsx`: compact phone footer.

Tests:
- `src/lib/navigation/site-sections.test.ts` (new).
- `src/components/mobile-tab-bar.test.tsx`: the old single-`matchPath` pins now test `matchPaths`. New cases cover 21 section routes, pages outside every section, "derived from the header table, no path in two tabs", and "href is the first section path".
- `src/components/__tests__/nav.test.tsx`: four tests that pinned the old sheet geometry were rewritten:
  - the sheet ceiling now comes from `--tabbar-band-h`;
  - the first dialog link is the brand link, no longer DE;
  - the close button sits on the opener's square and the sheet has no DE/EN;
  - the cell gutter classes changed.
- `src/components/__tests__/nav.test.tsx` also gained new tests: the two-column column-major grid (6 rows or fewer), the scrim closing the menu, and Lernen/Praxis marked from the section table.
- `src/components/footer.test.tsx`: new tests for the phone brand row, the one-line caption and the contact row. Every existing footer test passes unchanged.
- `tests/e2e/mobile-shell.spec.ts` gained new tests:
  - SSR active tab on `/demos`, `/demos/excel`, `/workshops`, `/ki-fuehrerschein`, `/eu-ai-act-kurs`, `/buecher` and `/en/demos`;
  - at 320x568 and 375x667, the menu ends above the tab bar, never scrolls inside, has no DE/EN, and its X sits on the hamburger's rect;
  - at 390 the footer is 300px or less closed and 600px or less open.
- `tests/e2e/route-locales.spec.ts`: below lg it now measures the bar's language links before the sheet covers them, and asserts the dialog has no language group, instead of expecting one inside the dialog. The Login 44px check is kept.

## What changed

**X3 / active tab.** The Kurse tab covers every learning route (the header's Lernen menu: `/kurse`, `/ki-fuehrerschein`, `/eu-ai-act-kurs`, `/ai-native`, `/ki-und-gesellschaft`, `/ki-check`, `/buecher`) plus `/workshops`. The Werkzeuge tab covers `/open-source` plus `/demos`, and the Konto tab covers `/konto` plus `/login` (`/konto` redirects there when you are signed out). The map follows the audit's proposal: Workshops go to Kurse and Praxisbeispiele to Werkzeuge. Changing a mapping is a one-line edit in `buildMobileTabs`. `/blog`, `/ueber-mich` and the legal pages still mark no tab. SSR and client markup stay identical because only the match list changed.

**S1 / menu.** The sheet is a full-width panel that lies over the compact bar (`top-0`).
- Its header row repeats the bar (same `--nav-h-compact` height and gutter): brand link, "Anmelden", then X exactly on the hamburger's 44x44 square.
- There is no DE/EN in the sheet. The bar's switch stays the only one and hides while the sheet is open.
- Lernen (5), Praxis (2) and Blog / Open Source / Über mich / GitHub (4) are two-column, column-major grids of 44px cells. The current-page square hangs in the gutter as before.
- `max-h: calc(100dvh - var(--tabbar-band-h))`, so the tab bar is never covered. In landscape only the link list scrolls.
- A 20% ink scrim behind the sheet closes the menu on tap. The tab bar stays visible under it and inert, as the a11y contract requires.
- Focus trap, initial focus on X, Escape restoring focus to the opener, and inert background are all unchanged.

**S2 / footer below sm.**
- `py-10` became `py-6`.
- The kicker is hidden below sm.
- The wordmark shares one row with GitHub and LinkedIn, which are 44x44 icon squares; their aria-label is unchanged and the word returns from sm.
- `pb-8` became 0 below sm, so the disclosure sits between two hairlines.
- The copyright and both dates flow as one caption (`contents` on the data pill below sm).
- Open state: Lernen and Praxis stay side by side, and the three contact links become one inline row of 44px targets ("Hilfe" is centred in its 44px box so the gaps read even).
- Everything from sm is restored to the previous classes.

**S3 (logo tilt)** was already removed by the earlier shell wave.

**Pill shadows and mono caps.** Across nav, footer, tab bar, language switch and auth link, the only shadows left are `shadow-overlay` on the two floating menus. The only mono is on the footer's date values, which are data.

## Numbers (re-measured; `*{content-visibility:visible}`, second navigation)

| | Before | After |
|---|---|---|
| Menu height (320/375/390/430) | 506 / 605 / 733 / 733, internal scroll 731 in 504 (320) and 603 (375), covers the tab bar at 320-390 | 379 at every width, no internal scroll, ends at the tab bar |
| Menu first link / DE-EN in sheet | y=164, yes | y=74 ("Alle Kurse"; brand, Anmelden and X sit in the 48px header row), no |
| Footer closed (320 / 375-430) | 461 / 436 | 279 / 256 |
| Footer open (320 / 375-430) | 923 / 898 | 613 / 590 |
| Active tab on `/demos`, `/workshops`, `/ki-fuehrerschein` | none | Werkzeuge, Kurse, Kurse |

Page heights, px (screens). The shell's share is exactly -180px at 375-430 and -182px at 320, all of it from the footer. The large `/demos` drop is mostly the concurrent demos wave.

| Page | Width | Before | After |
|---|---|---|---|
| `/` | 320 | 3254 (5.73) | 3071 (5.41) |
| `/` | 390 | 2908 (3.45) | 2728 (3.23) |
| `/demos` | 320 | 4607 (8.11) | 2408 (4.24) |
| `/demos` | 390 | 4497 (5.33) | 2317 (2.75) |
| `/workshops` | 320 | 6038 (10.63) | 5856 (10.31) |
| `/workshops` | 390 | 5664 (6.71) | 5484 (6.50) |
| `/ki-fuehrerschein` | 320 | 3331 (5.86) | 3149 (5.54) |
| `/ki-fuehrerschein` | 390 | 3013 (3.57) | 2833 (3.36) |
| `/kurse` | 320 | 6709 (11.81) | 6527 (11.49) |
| `/kurse` | 390 | 6126 (7.26) | 5946 (7.05) |

All widths (320, 375, 390, 430) are in `w2-shell/metrics-before.json` and `metrics-after.json`. `scrollWidth` equals the viewport everywhere.

## Verification

- `bunx vitest run src/components src/lib`: 541 files and 6581 tests pass.
- `src/app` contract tests: one failure, `catalog-surfaces-mobile.test.ts`, "keeps the demo cover compact". It pins `src/app/demos/page.tsx`, which the demos agent is changing, so it is not shell.
- `bunx tsc --noEmit -p tsconfig.typecheck.json`: no errors.
- `bunx eslint` on the changed source files: clean.
- Playwright against the dev server, through a wrapper config at `w2-shell/pw.config.mts` that points at `/opt/pw-browsers/chromium` because the CLI's own headless build is not installed:
  - `mobile-shell.spec.ts`: 24 of 24 pass.
  - `site-header-*`, `route-locales` (including the three language-control widths), `a11y-keyboard` (mobile hamburger), `journey-a11y`, the `a11y-target-size` hamburger test, the `funnel-homepage-to-journey` mobile menu and `mobile-access-disclosure` all pass.
  - The `a11y`, `a11y-structure` and `a11y-reduced-motion` specs on mobile: 91 pass.
- The failures seen in those runs are not shell:
  - Two axe contrast failures: Mennige on peach tint in the home course card and in the `/ueber-mich` article.
  - The book-reader TOC click in `a11y-target-size`: "[Fast Refresh] rebuilding" from concurrent edits landed mid-click. The same steps pass in a standalone script.
  - Two Data Engineering specs: the `.de-course` background colour, and a dev error overlay.

## Screens (`w2-shell/shots/`)

- `after-<page>-{320,390}-v1.png` and `-full.png`, plus `after-<page>-1440-v1.png`, for home, demos, workshops, ki-fuehrerschein and kurse.
- `after-{home,workshops,demos}-{320,390}-{menu,footer-closed,footer-open}.png`, `after-{home,demos}-1440-footer.png` and `after-landscape-844-menu.png`.
- Before: `before-demos-{320,375,390}-{menu,footer-*}.png`.

## Left for the integrator / owner

- Product call: confirm Workshops go to the Kurse tab and Praxisbeispiele (`/demos`) to the Werkzeuge tab. Changing it is one line in `buildMobileTabs`, and the tests read the table.
- The no-JS fallback list (`.no-js-mobile-nav`) is still the old stacked list. It only shows with scripting off.
- At 320 the footer caption wraps to three lines ("Datenstand" and "Aktualisiert" cannot share a 288px line).
