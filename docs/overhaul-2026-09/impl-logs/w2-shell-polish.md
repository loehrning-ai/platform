# w2-shell-polish: the shell critique applied (header, menu, tab bar, footer)

Date: 2026-09-26. Nothing is committed.
- The shell geometry tokens (`--nav-h-compact`, `--tabbar-h`, `--tabbar-band-h`, `--nav-h`) are untouched.
- Every issue from the w2-shell critique is applied: 2 high, 4 medium and 5 low.
- Measurements and shots are in `w2-shell-polish/before/` and `w2-shell-polish/after/`. The script is `m.mjs`: phones at DPR 3, second navigation, `content-visibility` forced visible.

## Product call settled: the tabs are Start · Lernen · Praxis · Konto

The tabs now follow the header's groups. The implementer had left this call open.

- **Lernen** goes to `/kurse` and matches `LEARNING_ROUTES`.
- **Praxis** goes to `/workshops` and matches `PRACTICE_ROUTES`.
- `PRACTICE_ROUTES` in `src/lib/navigation/site-sections.ts` now also contains `/open-source`: it is Workshops + Praxisbeispiele + Open Source.
- Open Source moved into the header's Praxis menu. The header, menu sheet, footer and tab bar now share one Praxis.
- The desktop top row now reads Lernen ▾ · Praxis ▾ · Blog · Über mich.
- The footer's third group took Blog and was renamed "Blog und Kontakt" / "Blog and contact". It holds Blog, Über mich, Hilfe and Rückmeldung.
- Tab ids are now `lernen` and `praxis`, replacing `kurse` and `werkzeuge`. The labels reuse `learning` and `practice` from `GLOBAL_NAVIGATION_COPY`.
- The now unused `courses` and `tools` keys were removed from that copy.
- On `/workshops`, the tab, the header and the menu all mark Praxis. On `/demos` and `/open-source` they mark Praxis too.
- `docs/experience-system.md` (the tab bar line) is updated to match.

## Changes

- **Language switch (high)**
  - Below lg the bar shows one link to the other language: "EN" on German pages, "DE" on English ones.
  - It has an `aria-label` of "Englische Oberfläche öffnen" / "Open the German interface", plus `hreflang`, a 44x44 target and the Mennige inset ring.
  - Implemented as `LanguageSwitch compact` in `src/components/i18n/language-switch.tsx`: the DE/EN pair is `hidden lg:inline-flex`, which only the no-script layout reaches, and the single link is `lg:hidden`.
  - The link sits inside a `span[data-language-switch="compact"]`, so existing `[data-language-switch] a` queries in other specs still find it.
- **Wordmark (high)**
  - The header wordmark is now `inline` at every width.
  - At 320 the bar is lockup 155 + EN 44 + 4 + menu 44 = 247px, inside the 288px row.
- **Quiet Anmelden in the sheet (medium)**
  - New `AuthStatus variant="quiet"`: no border, no fill, no icon; `min-h-11 min-w-11 px-2 text-label text-foreground` with an inset Mennige ring.
  - I dropped the icon too, because with it the row does not fit 320px: 155 + 8 + ~78 + 4 + 44 = 289.
  - Measured at 320, the wordmark ends before "Anmelden" starts, and the page does not scroll sideways.
- **Sheet type (medium)**
  - Cells went from `text-sm text-muted-foreground` to `text-base text-foreground`. The active state is the square plus `font-semibold`.
  - Group labels went from `text-label` to `text-caption text-muted-foreground`.
- **Landscape (medium)**
  - From sm the groups are `sm:grid sm:grid-cols-3 sm:gap-x-6`, each group is a single column (`sm:grid-flow-row sm:grid-cols-1 sm:grid-rows-none`), and the sections are `sm:border-t-0`.
  - The unlabelled direct-links column gets an `aria-hidden` non-breaking-space label from sm, so all three columns start on one line.
  - At 844x390 the sheet is 304px tall with no inner scroll (was 330 in 285), and Open Source is on screen.
- **Footer caption (medium)**
  - Below sm, the domain and the "Aktualisiert" date are `hidden sm:inline`.
  - `STAND_DATE` is now in the sans face; mono stays on the ISO date only.
  - The caption now reads "© 2026 Tim Löhr   Datenstand: Q3 2026" on one line at 320 and 390. Its height went from 82 to 32 at 320 and from 59 to 32 at 390.
- **Footer wordmark (low)**: `text-xl` below sm, `sm:text-[2rem]` unchanged.
- **GitHub out of the sheet (low)**: the last group is Blog + Über mich in `grid-rows-1`. The footer and `/open-source` keep GitHub.
- **Tab bar hairline (low)**
  - `border-t` became `shadow-[inset_0_1px_0_var(--color-hairline)]`, so the bar is exactly `--tabbar-band-h` tall.
  - The footer's bottom now equals the tab top (512/512 at 320, 788/788 at 390). Before, it was 1px under the bar.
- **Scrim over the tab bar (low)**
  - The tab row fades to `opacity-50` via `[body:has(#mobile-menu)_&]` (160ms, `motion-reduce:transition-none`). The bar stays inert under the scrim.
  - The first try faded the whole `<nav>`, which made its paper translucent so the page showed through. It is now the `<ul>` only.
- **No-JS fallback (low)**
  - It now reuses the sheet's markup (`renderMobileGroups`): the Lernen and Praxis grids, then Blog · Über mich · Anmelden.
  - GitHub was dropped from it. Anmelden stays, contrary to the critique: at desktop widths without JS neither the tab bar nor the desktop cluster shows, so this is the only sign-in link there.
  - It went from about 600px to about 360px.

## Numbers (before → after)

| | 320 | 390 | 844x390 |
|---|---|---|---|
| Footer, closed | 279 → 229 | 256 → 229 | unchanged (425) |
| Footer, open | 613 → 563 | 590 → 563 | unchanged |
| Caption height | 82 → 32 (1 line) | 59 → 32 | 34 |
| Menu sheet | 379 → 385 (the 16px links), no inner scroll | same | 334 with inner scroll 330/285 → 304, none |
| Footer bottom vs. tab top | 512 / 511 → 512 / 512 | 788 / 787 → 788 / 788 | 334 / 334 |
| Header wordmark | hidden → shown | shown | shown |

Page heights at 320 / 390 are now: `/` 5.20 / 3.63, `/demos` 4.07 / 2.66, `/workshops` 2.71 / 1.70, `/ki-fuehrerschein` 4.76 / 2.79, `/kurse` 6.64 / 3.98 screens. The shell's share is the -50px footer (-27 at 390); the rest is other waves.
- `scrollWidth` equals the viewport at every width.
- No shell control is under 44px on phones.

Shots are in `after/`:
- `<page>-<w>-v1.png` and `-full.png`
- `home|demos|workshops-{320,390,844}-menu.png`
- `*-footer.png`, and `home|workshops-{320,390}-footer-open.png`
- `*-1440-v1.png`

`before/` holds the same set, taken before the change.

## Tests

- **Unit tests.** `bunx vitest run` over `nav.test`, `mobile-tab-bar.test`, `footer.test`, `auth-status.test`, `src/lib/navigation`, `semantic-landmark-contract` and `src/components/i18n`: 8 files and 133 tests pass. Changes:
  - The tab labels, hrefs and ids are updated, and the section cases now expect Lernen or Praxis.
  - New tab bar tests: the hairline is inside the band, and the row fades behind the sheet.
  - The footer headings are updated. New footer tests: Praxis matches the header, the phone caption shows the holder and one date, the Q3 label is not mono, and the wordmark is `text-xl`.
  - Nav tests: the compact cluster now has three children and the single-link contract. There is a new EN→DE case, Praxis now has three items, the sheet has the quiet Anmelden and no GitHub, and the sm layout classes are asserted.
  - New nav test: the sheet links are body size in ink, and the labels are captions.
  - The no-JS fallback is checked to use the grid and to have no GitHub.
  - New quiet-variant `AuthStatus` test.
  - `site-sections.test`: `PRACTICE_ROUTES` now includes `/open-source`.
- **Wider unit run.** `bunx vitest run src/components src/lib`: 545 files and 6638 tests pass.
- **`tsc -p tsconfig.typecheck.json`**: no errors in my files.
- **eslint** on the changed source files: clean. The test files are eslint-ignored by config.
- **Playwright** against the dev server, with the wrapper config `w2-shell-polish/pw.config.mts` (`reuseExistingServer`):
  - `mobile-shell.spec` + `route-locales.spec`: 37 passed and 1 flaky. The flaky one was a hydration click at 320 while the server was busy; it passed on retry.
  - New cases in `mobile-shell.spec`: landscape 844x390 with no inner scroll and three columns on one line; a scrim tap over the Konto tab closes the menu and does not navigate; at 320 the whole wordmark plus one EN link fits and the sheet header fits; the phone caption is one line at 320; `/open-source` marks Praxis, and the header's dropdown marks the same group as the tab.
  - `mobile-shell.spec` limits are tightened to 240px footer closed and 580px open, at 390.
  - The `route-locales` compact width checks and the 320 no-script case now expect the single link.
  - `funnel-homepage-to-journey` and `visual-regression` now expect Open Source inside the Praxis disclosure.
  - `funnel`, `site-header-github`, `site-header-logo-mark`, `a11y-keyboard`, `journey-a11y` and `route-ueber-mich`: all pass except the ones below.
- **Failures in that run, none caused by the shell:**
  - `mobile-access-disclosure` "unchosen atlas default…" (4): the `/kurse` atlas has no `[data-course-access-label]`, which belongs to the courses wave.
  - `route-ueber-mich` "200 percent zoom": the desktop utility cluster (DE/EN/Anmelden) escapes at `zoom:2` on a 1440 viewport. The only desktop change here removes one top-row link, which makes the row narrower, so this was not caused by this change.

## Left for the integrator

- Update the `visual-regression` desktop pixel baselines. The desktop header lost "Open Source" from its top row and the footer's third group is renamed, which may exceed the 3% tolerance.
- The owner may want to confirm the footer label "Blog und Kontakt".
