# B6 site chrome: change log

## Polish pass (2026-09-26, after critique in B6-site-chrome-critique/)

### Files changed (all in packages/website)
- src/components/nav.tsx
- src/components/i18n/language-switch.tsx
- src/components/auth/auth-status.tsx
- src/components/footer.tsx
- src/components/ui/scroll-progress.tsx (borderline ownership: sitewide chrome thread drawn over the header, only used by layout.tsx; two colour classes changed as the critique asked)
- src/lib/i18n/global-copy.ts (borderline ownership: the chrome's copy object; one value, `de.login`)
- Tests: src/components/__tests__/nav.test.tsx, src/components/footer.test.tsx,
  src/components/i18n/language-switch.test.tsx, src/components/auth/auth-status.test.tsx,
  src/components/ui/scroll-progress.test.tsx, tests/e2e/site-header-logo-mark.spec.ts (rewritten)
- mobile-tab-bar.tsx: no change needed (no critique item).

### Critique items and what was done
- HIGH focus ring invisible (ring-inset read as Beton colour): fixed in the chrome with the critique's fallback.
  Language links, dropdown rows, phone-sheet rows and the sheet's close button use
  `focus-visible:inset-ring-2 focus-visible:inset-ring-brand-orange`. Verified in Chromium: computed ring is
  `rgb(183,58,21) 0 0 0 2px inset` on DE, EN and dropdown items (shots/x-focus-*.png). Unit tests now ban
  `ring-inset` in these controls. The root token rename is outside my files (see "Left for the integrator").
- HIGH logo lockup: static. Deleted LOCKUP_FONT_STACK, the scroll rotation, the L collapse and the remainder slide,
  and the `useScroll`/`useTransform`/`useReducedMotion` imports. Square = plain span `size-[38px] bg-mennige` with a
  paper `L` in the site face 700. Wordmark `loehrning.ai`, `text-[1.25rem] font-bold tracking-[-0.015em]`, ink.
  Hooks kept: `data-logo-mark`, `data-logo-wordmark` (the leading-l/remainder hooks are gone; only the old spec used
  them). The wordmark now shows from 360px (`min-[22.5rem]:inline`, it fits: at 390 the wordmark ends at x=171, the
  language switch starts at 238); below 360 the square stands alone.
  site-header-logo-mark.spec.ts rewritten: static at scrollY 0/60/130/200/0 in both motion modes (square and wordmark
  transform `none`, brand width and x unchanged, header height unchanged) plus a type check (700, not uppercase, not
  Arial Black, tracking >= -0.015em). Ran it against the dev server: 6/6 pass (chromium + mobile-chromium).
- MEDIUM Mennige budget: header `.ai` is ink; footer `.ai` also ink so both lockups match; scroll-progress track
  `bg-transparent`, fill `bg-foreground` (still h-[2px], hooks and motion-reduce:hidden unchanged). The logo square is
  the only red mark in the chrome.
- MEDIUM footer column: `max-w-6xl` -> `max-w-[75rem]`. Measured content box 144..1296 at 1440, 24..1000 at 1024,
  24..744 at 768, 16..374 at 390, 16..304 at 320: identical to the header wordmark/Login edges at every width.
- MEDIUM header gutter: `px-3 sm:px-5` -> `px-4 sm:px-6` (logo x=16 at 390/320, 24 at 768; matches /workshops content).
- MEDIUM two underline baselines: language underline `bottom-2` -> `bottom-0` (DE rule and Praxis rule both at y=52..54).
  `.js-desktop-nav` now holds two groups: places (`flex gap-4`) and utilities (`flex gap-2 border-l border-hairline pl-4`);
  wrapper `lg:flex-1 lg:justify-between lg:gap-6 lg:pl-10` so the places start after the wordmark and the utilities sit
  right, as in blueprint 7.1. Header row still has exactly 3 children (no-script CSS and tests unchanged). Fits at 1024
  in DE and EN (EN: places 246..690, utilities 719..1000, every target 44px, no overflow).
- MEDIUM phone menu: bar switch gets `invisible` while the sheet is open (one visible switch, measured). Sheet header row
  is DOM and visual order: LanguageSwitch (`-ml-3`, DE text lines up with the group labels) then close (`-mr-2 sm:-mr-3`),
  so the X sits under the hidden menu button (x 329..373 vs toggle 330..374 at 390; 699..743 vs 700..744 at 768).
  Initial focus still lands on the close button: a small effect after useFocusTrap focuses it (verified in Chromium).
  Tab from the last control wraps to the first control in reading order (DE); the nav test asserts that plus
  Shift+Tab back and Escape to the toggle.
- LOW marker slot: ActiveMarker is `absolute left-1.5 top-1/2 -translate-y-1/2` in `relative` rows. Phone rows use one
  class (`relative -mx-4 px-4 sm:-mx-6 sm:px-6`, inset focus ring because the scrolling sheet clips outer rings):
  row text x == group label x (25 at 390, 37 at 768). Dropdown rows `relative pl-5 pr-3`, menu `-left-4`: row text 429 vs
  trigger label 428 at 1440.
- LOW footer IA: groups now Lernen / Praxis / Hilfe und Kontakt (EN Learning / Practice / Help and contact; EN uses
  "Learning" to match the header's EN label, not "Learn"). KI-Check added to Lernen, Blog moved into Praxis, blog group
  deleted, grid `md:grid-cols-3`. New test: no group is headed by its only link.
- LOW Login button in the phone sheet: `justify-between` removed (centred icon + word).
- LOW footer brand column: `lg:border-t lg:border-hairline lg:pt-3` (one continuous rule across the row).
- LOW `de.login`: "Anmelden" (EN stays "Login"). `min-w-[6.75rem]` -> `min-w-[7.25rem]` so "Anmelden" fits and the
  control keeps its width when the session resolves to "Konto" (no shift of the utilities). German auth/nav tests now
  look for "Anmelden"; the route-locales spec needs no change (its lines 105/112 run on /en/kurse, "Login").
- LOW Praxis dropdown `w-64` -> `w-max min-w-48` (192px for Praxis; Lernen sizes to its rows).
- HIGH home page risograph + home axe contrast: outside B6 ownership, not touched (see below).

### Checks
- vitest (16 files, 213 tests pass): nav, footer, language-switch, auth-status, scroll-progress, mobile-tab-bar,
  font-loading, layout.locale, lesson-content, reader-focus-bar, motion-provider-contract,
  learning-surface-density-contract, semantic-landmark-contract, no-script, use-focus-trap, interaction-target contract.
- eslint clean on all changed source files (test/spec files are eslint-ignored by config).
- tsc -p tsconfig.typecheck.json: 0 errors in the whole project at the time of the run.
- Playwright e2e against the running dev server (temporary config pointing at /opt/pw-browsers/chromium, removed after
  use; results in B6-site-chrome/polish/pw-results): site-header-logo-mark 6/6; route-locales language control and
  no-script, journey-a11y mobile nav, mobile-shell, mobile-access-disclosure: 50 pass, 12 skipped by their own
  conditions; responsive hamburger/top-bar/overflow blocks: 11 pass.
- axe on /workshops at 1440, 1024, 768, 390, 320: 0 violations. One h1 on both pages at every width.
- Screenshots: B6-site-chrome/polish/shots/ (home|workshops-{1440,1024,768,390,320}-{top,footer}.png,
  x-header.png, x-dropdown-{lernen,praxis}.png, x-focus-*.png, x-focus-dropdown-item.png,
  p-{390,320,768}-{header,menu}.png, workshops-1440-scroll-wheel.png, en-workshops-{1024,1440}-header.png).
  Several shots use the cold-start fallback face (font-display optional on the dev server); geometry numbers above are
  from the same runs.

### Left for the integrator
1. Root fix for the focus-ring bug (21 call sites outside the chrome are still affected): rename `--color-inset` to
   `--color-beton` in src/app/globals.css (l.81 and the .dark-section override l.432), then rename every
   `bg-inset`/`border-inset`/`text-inset` utility (demo-tile.tsx, open-with-your-ai.tsx, markdown-renderer.tsx,
   certificate-page.tsx, workshop-decision-lab.tsx, kurse/page.tsx and their tests). Until then add `ring-inset` to the
   banned patterns in src/lib/learning-surface-density-contract.test.ts. The chrome already uses `inset-ring-*`, which is
   correct either way.
2. Home page (hero.tsx, home-copy.ts, offering.tsx, mobile-rails.tsx, credibility-strip.tsx): axe color-contrast
   (serious) still fails on / at every width in my run (4 nodes at 1440/1024, 7 at 768, 6 at 390/320): 12px Mennige
   mono labels on pastel tiles. Minimum fix `text-brand-orange` -> `text-kupfer-dark`; recipe fix `text-label
   text-muted-foreground` in sentence case. Plus the full risograph lift and copy rewrite listed in the critique, and the
   page container (`max-w-[75rem] px-4 sm:px-6`): home content starts at x=48 at 1024/768 and x=24 at 390/320, while the
   header and footer start at 24 and 16.
3. docs/experience-system.md l.55 still describes `--nav-h` as a floating pill with insets (from pass 1).
4. visual-regression header snapshots need re-baselining (new lockup, split nav groups, "Anmelden").
5. Not run: visual-regression, webkit projects, Lighthouse, anything needing a production build.

---

## Pass 1 (original restyle)

## Files changed (all in packages/website)
- src/components/nav.tsx
- src/components/i18n/language-switch.tsx (header control; only used by nav)
- src/components/auth/auth-status.tsx (header login control; only used by nav)
- src/components/footer.tsx
- src/components/mobile-tab-bar.tsx, src/components/mobile-tab-bar-links.tsx
- Tests: src/components/__tests__/nav.test.tsx, src/components/footer.test.tsx,
  src/components/mobile-tab-bar.test.tsx, src/components/i18n/language-switch.test.tsx,
  src/components/auth/auth-status.test.tsx, tests/e2e/responsive.spec.ts (desktop header geometry block)

## Decisions
- Header is one flat paper band at every width: `bg-background`, `border-b border-hairline`, no pill,
  no inset, no shadow, no backdrop blur. Height is the token: `--nav-h-compact` below lg,
  `lg:h-[var(--nav-h)]` (64px) from lg, flush at top, full bleed. The content offset `<main>` reserves
  is unchanged, so the bar now exactly fills it. Desktop side padding
  `lg:px-[max(1.5rem,calc(50%_-_36rem))]` lines the wordmark up with the max-w-6xl content column (x=144 at 1440).
- Current nav group / link: 2px ink bottom rule (was 3px Mennige). Menu rows: the orange 3px left rule is
  replaced by a reserved 6px ink square marker plus font-semibold (state not by colour alone, no layout shift).
- Dropdown and mobile dialog: square overlay sheets, `border-foreground bg-card shadow-overlay`
  (shadow allowed on overlays only).
- Group labels in the mobile dialog and no-script list: sentence case `text-label text-muted-foreground`
  (was mono uppercase orange).
- Logo mark: square Mennige block with paper L (was rounded-xl with border). Scroll rotation, L collapse and
  wordmark text kept unchanged because site-header-logo-mark.spec.ts pins them.
- Language switch: no box, no acid fill, no cobalt. `DE`/`EN` in `text-label`, active = ink 2px underline
  + weight + aria-current; focus ring Mennige.
- Login: square secondary ink button (`border-foreground`, transparent, `text-sm font-semibold`, hover tone),
  stable `min-w-[6.75rem]` kept. No cobalt, no uppercase mono, no hover lift.
- GitHub icon and menu toggle: square, hover `bg-card-hover` (were rounded-xl with peach/pink washes).
- Footer: `.dark-section` graphit band in normal flow; decorative rounded/circle outline spans removed;
  `overflow-hidden`/border-top removed; hairlines (`border-hairline`) between groups and rows; labels
  sentence case (`text-label`); wordmark tracking -0.015em; GitHub/LinkedIn are square outline controls
  (dark border token 3.52:1) with tone hover, no lift. Disclosure "+" now swaps to "−" via `group-open`
  (no rotation, still no JS). Data line: sentence-case labels, mono only on the date values
  (`font-ui-mono tabular-nums`), which also keeps the font-loading contract (shell must use font-ui-mono, never font-mono).
- Tab bar: hairline top, active tab = 2px ink top rule + font-semibold + ink text (was Mennige). Persistent
  chrome spends no Mennige.
- Kept: all aria, keyboard handling, focus trap, inert handling, no-script structure, 44px targets, tokens
  `--nav-h`, `--nav-h-compact`, `--tabbar-h`, 12px floor, motion-reduce classes.

## Tests updated (old look only; no a11y/behaviour assertion weakened)
- nav.test: menu is `shadow-overlay border-foreground` and not rounded; row is flat paper + hairline, no
  rounded/shadow/blur; trigger uses `border-b-foreground`; new test for ink marker + weight on the current row;
  geometry test now asserts `lg:h-[var(--nav-h)]`, full width, no outer inset.
- footer.test: asserts no rounded/shadow/lift/uppercase and no absolute decorative spans; group h2 use
  text-label; summary label `text-label` (14px, same size as the old text-sm).
- language-switch.test: no rounded/shadow/bg on group; links `text-label`, no pastel fills or uppercase.
- auth-status.test: `border-foreground` and no `bg-brand-*`/rounded/uppercase/lift instead of `bg-brand-cobalt`.
- mobile-tab-bar.test: active tab is `border-foreground font-semibold`, no brand-orange.
- tests/e2e/responsive.spec.ts: the desktop block now expects a flush (top 0), full-bleed, square bar exactly
  `--nav-h` tall. NOT RUN (needs a build).

## Checks
- vitest: nav, footer, mobile-tab-bar, language-switch, auth-status, font-loading, learning-surface-density,
  semantic-landmark, interaction-target-design-contract, lesson-content: 10 files, 170 tests pass.
- eslint clean on all changed source files (test files are eslint-ignored by config).
- tsc: no errors in my files.
- Screenshots in scratchpad/impl/B6-site-chrome/: home + workshops at 1440 (top + full) and 390 (top + full),
  desktop dropdown, phone menu dialog, phone footer disclosure open, desktop footer, desktop keyboard focus.

## Left for the integrator
- docs/experience-system.md (table around l.55) still describes `--nav-h` as "the 48px floating header pill plus
  the 8px inset ... and the 8px breathing gap". It is now the height of the flat header band itself. The
  globals.css comment on `--nav-h` is fine.
- src/components/ui/scroll-progress.tsx (not mine) draws a 1px Mennige/25 line plus a 2px Mennige fill across the
  top of every page, above the header. It reads as a second Mennige mark in the chrome; consider ink or removal.
- Home hero (not mine) still has the risograph look (cobalt/orange two-tone headline, pastel tiles, rounded pill
  button); the header now sits calmly above it.
- e2e specs not run: responsive.spec (updated), site-header-logo-mark.spec, visual-regression (header snapshots will
  need re-baselining), route-locales, mobile-shell, mobile-access-disclosure, axe/Lighthouse.
