# workshops-mobile-polish: change log

Date: 2026-09-26. This pass applies the workshops-mobile critique: every high and medium item, plus the cheap low ones. It stays inside the build-step ownership. Desktop is unchanged; `hub-1440-fv.png` and `w01-1440-fv.png` match the earlier shots.

## Results (brand face)

| Item | Before (critique) | After |
|---|---|---|
| Hub height at 390 | 1,831px | 1,437px (EN 1,397px) |
| Hub rows at 390 | 145–165px | 97–117px |
| Hub rows at 320 | 184–203px | 116–136px |
| First hub row at 320x568 | 594px (off screen) | 437px (visible; the tab bar starts at 511px) |
| W04 at 390 | 5,935px | 5,823px |
| W01 at 390 | 5,588px | 5,532px |
| Detail cover top on phones | 93px (45px back bar) | 48px (back link sits in the kicker line) |

Checks at 320, 390 and 430 (DE and EN):
- No horizontal overflow.
- No text under 13px.
- No tap target in `main` under 44px.

The measurements are in `report.json`.

## Hub (`src/app/workshops/workshops-content.tsx`)

**High items**
- **Summary.** It is now `hidden md:block` and the clamp is gone. The title is the phone hook.
- **"Du gehst mit".** Below md the `dl` is `max-md:line-clamp-2` and the `dt`/`dd` are inline, with a `:` from `::after`. The outcome reads as one sentence over the full width, with no hyphen stacks.
- **Arrow column.** It is gone. The inner div is no longer a grid. On phones the one link is `max-md:absolute max-md:inset-0`, so the whole row is the link. The arrow sits top right beside the title (`items-start justify-end pt-[2.375rem]`). The link could not stay a small positioned box: an absolutely positioned link turns its own `::after` into a 44px box.
  - Only the `h3` reserves room for the arrow (`pr-8`).
  - The meta line uses the full width, and its times are `whitespace-nowrap`, so "allein / 60 Min." no longer splits.

**Medium items**
- **Touch feedback.** Rows use `has-[a:active]:bg-card-hover` with a 120ms transition and `motion-reduce:transition-none`. The link sets `[-webkit-tap-highlight-color:transparent]`. On phones rows bleed to the screen edge (`max-md:-mx-4 px-4`, `sm:max-md:-mx-6 px-6`), so the highlight and hairline run full width. The focus outline is inset on phones.
- **Route section.** It is `hidden sm:block` on phones, and the list follows the cover directly.
- **Narrow-phone CTA.** Below 360px the CTA row is a one-column grid and the button runs full width.

**Low items**
- **H1.** Phones get 30px, the same as the detail H1, with no 14ch cap. It is `sm:max-w-[14ch] sm:text-display` from sm, so EN fits in 2 lines.
- **Start marker.** The recommended row (03) says "Einstieg · …" / "Start here · …" in its meta line (new copy key `catalog.startHere`). I used "Einstieg" instead of "Hier beginnen" so the line fits one row at 390.

## Decision lab (`[slug]/workshop-decision-lab.tsx`)

The lab has a new `NumberUnitText` component that binds a number to the word after it with a `whitespace-nowrap` span. It is applied to the prompt, the option labels and the fact values.

I did not use `keepNumbersWithUnits`, as the critique suggested. Its NBSP changes the radios' accessible names, and 5 existing tests failed. With the span, the text and the names stay exactly the registry strings.

At 390, "7,5 %" and "1.866,5 t" now stay on one line; see `el-w04-lab-390.png`.

## Detail (`[slug]/workshop-detail-content.tsx`)

**Back link**
- The "Alle Workshops" bar is `max-sm:hidden`.
- Phones get `← Workshops · 04` in the cover kicker line: a 44px link with `-my-3`, and new copy key `detail.workshopsShort`.
- The full eyebrow is `max-sm:hidden`, and the number alone shows below sm, so the line never wraps at 320.

**Cover buttons:** below 360px they stack full width (`grid-cols-1`, `[&>*]:w-full justify-between`).

**Material rows**
- Tapping gives feedback: `has-[a:active]:bg-card-hover` on the row and a transparent tap highlight on the link.
- On phones the rows have 2 columns: the link covers the row (`max-sm:absolute inset-0`), with the arrow top right, and the `h4` has `max-sm:pr-8`. At 320 the text gains about 56px of width.
- A new exported helper, `phoneDescription()`, builds the phone text:
  - It keeps the first sentence and drops parentheses and anything after a `;`.
  - Above 72 characters it cuts at the last comma or word and adds " …".
  - Phones get that text as `sm:hidden [data-material-short]`; the full description is `hidden sm:block`. A description that is already short renders once.
  - No description is cut mid-word any more; see `el-w04-material-320.png`.

## Werk primitive (`src/components/werk/route.tsx`, rail layout only; the default stack is untouched)

- Rail stations are a fixed `w-[9.5rem]` on phones and `sm:w-auto` from sm, so the last visible station is always cut partway.
- The rail wrapper has `max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]` to fade the right edge over the gutter.
- Only the workshop agenda and the hub route use `layout="rail"`.

## Tests

**Unit tests**
- `workshops-content.test.tsx`: new pins for the phone row (hidden summary, inline `dl`, full-row link, `pr-8`, active feedback, nowrap times), the "Einstieg" marker only on 03, the route section at sm only, and the phone H1.
- `workshop-detail-content.test.tsx`:
  - The two back links (bar and kicker link).
  - `phoneDescription` cases, plus a budget check over every material in DE and EN.
  - The phone material row.
- `workshop-decision-lab.test.tsx`: the W04 prompt binds "1.866,5 t" and "7,5 %", and the labels and facts carry nowrap spans.
- `catalog-surfaces-mobile.test.ts` (workshop test): hidden summary, `max-md:line-clamp-2`, full-row link, no arrow grid column, route section at sm only.

**E2E**
- `workshops.spec.ts` phone test:
  - Rows under 140px (was 220px); the summary is hidden.
  - The link covers the full row width.
  - The `dl` spans at least the title width.
  - The route heading is hidden.
  - The first row starts above 664px.
  - A tap on the outcome opens the workshop.
- `learning-density.spec.ts`: the start-action locator skips the phone back link (`a:not([data-cover-back])`).

**Runs**
- **vitest** (`src/app/workshops`, `src/components/werk`, `catalog-surfaces-mobile`): 150 of 151 pass. The one failure is `catalog-surfaces-mobile › keeps the demo cover compact…`, which pins `demos/page.tsx`, owned by the demos agent.
- **eslint:** clean. The e2e files are in the ignore pattern.
- **tsc:** no errors in owned files.
- **content-lint:** no findings in owned files. Its warnings are in `src/lib/workshops-*.ts` and `public/`.
- **Playwright** (scratch config `workshops-mobile-polish/pw.config.mts`, against the dev server, chromium and mobile-chromium):
  - `workshops.spec.ts` and `route-workshops-locales.spec.ts`: 18 of 18 pass.
  - `learning-density.spec.ts`, the `/workshops/` part: 8 of 8 pass.
  - A parallel run under dev-server load timed out or hit `ERR_ABORTED` from HMR in the locale spec. The same tests pass with `--workers=1`.

## Not done (outside ownership), for the integrator

1. **Registry copy dedupe** (critique, medium). `src/lib/workshops*.ts` is not in my ownership, and `workshops-data-readiness.test.ts` / `workshops-esg-reporting.test.ts` pin `accessNote` wording. Proposed edits:
   - **W04 `accessNote` (DE):** "Die Rechnungen im Kit sind deutsche Belege; die gezeigte KI-Antwort ist aus dokumentierten Fehlerarten konstruiert." EN to match.
   - **W04 `notNeeded`:** drop "Ein KI-Konto für Deck, Demo und Übungen", because the cover already says "kein KI-Konto". Keep at least one item, since `workshops.test.ts` requires `notNeeded.length > 0`. `limitingNeed()` detects the no-account case from `notNeeded` via `/KI-Konto|AI account/`. If that line goes, add `needsAiAccount: false` or similar to the registry and switch both `limitingNeed()` helpers (hub and detail) to it.
   - **W04 case:** drop the first `dataLimitations` line ("… erfunden"), which the "Erfundener Fall" caption already says.
   - **W01 `caseStudy.narrative`:** delete "ist eine erfundene Firma für diesen Workshop" and cut the narrative to about 60 words. Expected saving is 150–200px at 390.
2. **Font fallback** (`globals.css`, `layout.tsx`): extend `Loehrning Sans Fallback` with `local("Helvetica"), local("Roboto"), local("Roboto-Regular")` and preload the regular and bold woff2.
3. **Tab bar:** on `/workshops` it now highlights "Praxis" (see `hub-320-fv.png`), so the shell agent seems to have fixed it. It still needs the e2e `aria-current` check on `/workshops/esg-berichte-mit-ki`.
4. **Demos test:** `catalog-surfaces-mobile › keeps the demo cover compact…` fails against the demos agent's current `demos/page.tsx`.

## Files

- `src/app/workshops/workshops-content.tsx`
- `src/app/workshops/workshop-copy.ts` (`catalog.startHere`, `detail.workshopsShort`)
- `src/app/workshops/[slug]/workshop-detail-content.tsx`
- `src/app/workshops/[slug]/workshop-decision-lab.tsx`
- `src/components/werk/route.tsx`
- Tests:
  - `src/app/workshops/workshops-content.test.tsx`
  - `src/app/workshops/[slug]/workshop-detail-content.test.tsx`
  - `src/app/workshops/[slug]/workshop-decision-lab.test.tsx`
  - `src/app/catalog-surfaces-mobile.test.ts`
  - `tests/e2e/workshops.spec.ts`
  - `tests/e2e/learning-density.spec.ts`

## Screenshots

Everything is in `mobile/workshops-mobile-polish/`:
- `{hub,hub-en,w01,w03,w04,w02-en}-{320,390,430}-fv.png` (first screen) and `-full.png` (full page).
- `hub,hub-en,w01-1440-fv.png` (desktop).
- `*-390-rm.png` (reduced motion).
- `el-w04-{lab,agenda,material}-390.png`, `el-w04-material-320.png` and `el-hub-list-320.png` (element crops).
