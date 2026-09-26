# workshops-mobile: change log

Date: 2026-09-26. Scope: `/workshops` and `/workshops/[slug]` on phones. Desktop (lg and up) is unchanged. Every change is phone-first, and `sm:`/`md:` hands back the value the page had before.

## Results (390x844, brand face)

| Item | Before (audit) | After |
|---|---|---|
| `/workshops` height | 5,664px (6.7 screens) | 1,831px (2.2) |
| Hub row | 858–952px | 145–165px |
| First hub row top | 1,219px | 594px (fully inside 390x844) |
| Hub cover band | 603px | 320px |
| Detail page height | 8,024–8,760px | 5,600–5,900px |
| Detail cover | 702–787px | 532–564px |
| Agenda | 701–865px | 246–284px |
| Lab top | 1,551–1,745px | 871–940px |
| Lab height | 1,104–1,170px | 893–934px |
| Material row | 165–278px | 114px |
| W03 materials section | 1,982px | 1,039px |

At 320x568 the hub is 2,030px and the detail pages are about 6,100–6,900px. On a cold cache (fallback face) and the e2e iPhone 13 viewport (390x664), the lab starts at 1.35–1.56 viewports.

Checks at 320, 390 and 430:
- No horizontal overflow.
- No text below 13px.
- No interactive element in `main` below 44px.

Screenshots are in `mobile/workshops-mobile/shots/`: `*-fv.png` and `*-full.png` at 320, 390, 430, 664 and 1440, plus the element crops `el-w04-*`.

## Hub (`src/app/workshops/workshops-content.tsx`)

**Cover band**
- Compact padding: `pt-6 pb-6 sm:pt-16 sm:pb-12 lg:pt-24 lg:pb-16`.
- 34px H1 on phones, `sm:text-display` from sm.
- A one-sentence phone lead (new copy key `hubLeadShort`, DE and EN). The full lead is `hidden sm:block`.
- A cropped corner globe on phones (the new `CoverBand phoneGlobe` prop).
- The anchor index is `hidden md:block`, because on a phone the compact list itself is the index.

**Route ("So läuft jeder Workshop")**
- On phones it is a horizontal scroll-snapped rail (`Route layout="rail"`) with one-line station names.
- Captions are `hidden sm:block`, so they return from sm.
- `SectionHead size="compact"`.

**Rows below md**
- A 56px graphit tile with the number and a line globe, turned to a different longitude per workshop. It is `aria-hidden` and costs no image bytes.
- A duration and "Neu" meta line (new copy key `rowTimes`).
- The title head only. The subtitle is `sr-only md:not-sr-only`, so the heading name and `textContent` stay the full title.
- The summary is clamped to two lines.
- A "Du gehst mit" `dl` pair.
- The question, need, materials, live date and format caption are all `hidden md:*`.
- There is still one link per row. On a phone it is a 44x44 arrow, and its `::after` covers the whole row. The label is `max-md:sr-only` and the aria-label is unchanged.
- Deck-cover images and MiniCovers are `hidden md:block`. All previews are `loading="lazy"`; the first one no longer uses `eager`/`fetchPriority`.

**Team note and boundary line:** smaller type and spacing below sm.

## Detail (`[slug]/workshop-detail-content.tsx`, `workshop-decision-lab.tsx`)

**Cover**
- `pt-5 pb-6`, a 30px H1 and a 19px subtitle.
- 15px summary.
- The q-card uses `density="compact"`.
- Tighter button gap.
- The minute facts are `hidden sm:inline`, because the agenda caption right below says them. The next fact gets its capital letter through `max-sm:first-letter:uppercase`.
- The need/outcome `dl` is always a two-column grid.
- A phone globe.

**Agenda:** a phone rail with label, minutes and the "Übung unten" lab marker. The activity line is `hidden sm:block`. `SectionHead size="compact"`.

**Lab**
- Tighter gaps and type below sm.
- Below 26rem the facts are label and value rows.
- Option rows use `py-2.5 sm:py-3`. `min-h-12` is kept.

**Materials**
- Dense three-column rows: pictogram, text, 44px arrow.
- The description is clamped to two lines below sm.
- Format and size join the notes line; the chip is `hidden sm:block`.
- The label is `max-sm:sr-only`, and the sr-only language spans are kept.

**Case, the four short blocks and the provenance footer:** phone type and spacing, with section padding `pt-10 sm:pt-20`. Nothing is collapsed, because the unit test bans `<details>`. Everything stays readable, only tighter.

**Shared helper:** `splitTitle` moved to the new `src/app/workshops/workshop-title.ts` so the hub can use it too.

## Werk primitives (additive, defaults unchanged)

- `Route`: `layout?: "stack" | "rail"`. The rail wraps the list in a focusable `role="group"` with the list's label and a focus ring. It uses group rather than region because the section around it is already a landmark with the same name. It bleeds to the screen edge (`-mx-4 px-4`) and scroll-snaps. From sm it renders identically to the stack layout.
- `QuestionCard`: `density?: "default" | "compact"`, which tightens the card below sm only.
- `SectionHead`: `size?: "default" | "compact"`, which makes the heading one step smaller below sm only.
- `CoverBand`: `phoneGlobe?: boolean`, a cropped, masked, `aria-hidden`, `md:hidden` globe in the top-right corner.

## Tests

**Unit tests**
- `workshops-content.test.tsx`:
  - "Neu" is scoped to the chip plus the meta line.
  - The previews are lazy.
  - Tile checks were added.
  - A new test covers the phone row: grid, hidden details, clamp, arrow link, meta line, short lead, the index at md and the rail group.
- `workshop-detail-content.test.tsx`: the `uppercase` ban now allows `first-letter:uppercase`.
- `werk.test.tsx`: new tests for the rail, compact QuestionCard, compact SectionHead and phone globe. The default pins are unchanged.
- `catalog-surfaces-mobile.test.ts`: the workshop test is rewritten for the compact row, the index at md, the new list padding and the rail.

**E2E**
- `tests/e2e/workshops.spec.ts`:
  - New phone test: rows under 220px, the question hidden, the tile visible, one 44x44 link, the first row inside the first screen, and a tap on the summary opens the workshop.
  - Hub tests now wait for the hydration marker. `ScrollToTop` yanks the scroll to 0 at hydration, and that raced the click.
- `tests/e2e/learning-density.spec.ts`:
  - W03 and W04 added.
  - The lab bound is tightened from 2.5 viewports to 1.7 on phones and 1.85 on desktop. Measured cold: 1.35–1.56 on iPhone 13 and about 1.6 at 1280x720 desktop.

**Runs**
- vitest on `src/app/workshops`, `src/components/werk` and `catalog-surfaces-mobile`: all green except `catalog-surfaces-mobile › keeps the demo cover compact…`. That test pins `src/app/demos/page.tsx`, which the demos agent is changing; it is not a workshop change.
- eslint: clean.
- tsc: no errors in owned files.
- content-lint: nothing in owned sources.
- e2e (chromium and mobile-chromium, run against the dev server through a scratch config `mobile/workshops-mobile/pw.config.mts` that points at `/opt/pw-browsers/chromium`): all 26 pass across `workshops.spec.ts`, the workshop part of `learning-density.spec.ts` and `route-workshops-locales.spec.ts`. The last covers overflow at 320, 390, 768 and 1440 in DE and EN.

## Notes for the integrator

- `src/components/werk/horizon-globe-*.ts(x)` and `horizon-projection.ts` are untracked files from another agent (the home globe). They are not part of this change.
- The default Playwright run expects `chromium_headless_shell-1228`, but only 1194 is installed. That is why the scratch config was used.
- Docs that are now stale:
  - `research/design-direction.md` §7.1 and §7.2: the phone hub is now a compact list, and the agenda is a rail on phones.
  - `docs/experience-system.md` "Mobile Companion Shell" could record the density rule: catalog rows at most about 170px on a 390 phone, one link per row, details on the detail page.
