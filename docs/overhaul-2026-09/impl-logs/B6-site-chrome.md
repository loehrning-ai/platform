# B6 site chrome: change log

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
