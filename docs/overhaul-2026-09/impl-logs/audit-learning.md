# Mobile audit: learning pages (key `audit-learning`)

Date: 2026-09-26. Read-only audit. No repository file was changed.

Pages: `/workshops`, `/workshops/ki-prognosen-einschaetzen` (W01), `/workshops/geschaeftsberichte-mit-ki-lesen` (W02), `/workshops/datenbereitschaft-fuer-ki` (W03), `/workshops/esg-berichte-mit-ki` (W04) and `/kurse`. The EN mirrors spot-checked were `/en/workshops`, `/en/workshops/esg-berichte-mit-ki`, `/en/workshops/ki-prognosen-einschaetzen` and `/en/kurse`.

Phones: 320x568, 390x844 and 430x932, plus 390x664, which is the Playwright "iPhone 13" viewport that the e2e mobile project uses. All contexts ran Chromium with `isMobile`, `hasTouch`, DSF 3 and reduced motion.

## 0. Method and caveats

- **Scripts.** `mobile/audit-learning/measure.mjs` does the measurements. `summarize.py` prints the tables. `elements.mjs` makes the element crops. `proto/proto.mjs` is a prototype that injects CSS and DOM changes into the live page to check the target numbers. It does not touch the repo.
- **Output files.** Raw JSON is in `mobile/audit-learning/data/`. Screenshots are in `mobile/audit-learning/shots/`: `*-fv.png` is the first viewport at DSF 3, `*-full.png` is the full page at CSS scale, and `el-*.png` are element crops. Prototype screenshots are in `mobile/audit-learning/proto/`.
- **Font caveat.** Loehrning Sans uses `font-display: optional`, so on a cold cache the first paint commits to the fallback face for the life of the page. With the wider container fallback, a cold load is about 540px taller; for example W01 at 390 measures 8,614px instead of 8,078px. Every number below comes from a load where a probe confirmed the brand face was in use. The measure script reloads until it is.
- **Snapshot.** Other agents are editing the site at the same time, for example the W04 data. Heights drifted by up to about 150px between runs over the afternoon. The tables are the final sweep.
- **Screen maths.** "Screens" means document height divided by viewport height. The chrome that covers content is the top bar (48px) and the tab bar (57px), so the free height is 463, 559, 739 and 827px on the four phones.
- **Dev overlay.** The dev-only Next "N" indicator overlaps the Start tab in some shots. It is not a site issue.

## 1. Summary

The learning pages are built as desktop sheets that stack on a phone.

- **The workshop hub needs 6.7 screens at 390x844 for four workshops.** Every workshop "row" is 858 to 952px tall, which is more than a whole 390x844 screen per workshop. The first workshop starts at y=1,219px.
- **Workshop detail pages need 9.5 to 10.4 screens at 390 and 16 to 17.6 screens at 320.** The decision lab starts at 1.84 to 2.07 screens at 390x844. The agenda alone takes one full screen, at 82px per station.
- **`/kurse` needs 7.3 screens.** Each of its ten ledger rows is 265 to 331px tall.

Nothing is broken:

- No page has horizontal overflow.
- No interactive element in `main` is below 44px.
- Nothing is below 13px; the caption token is the smallest text.

The problem is density and repetition, not defects.

### Headline numbers at 390x844

The prototype column is a CSS-only check injected on the live page (§5). A dash means that item was not prototyped.

| Page / item | Before | Target | Prototype |
|---|---|---|---|
| `/workshops` height | 5,664px (6.7 screens) | ≤ 2,300px (≤ 2.7) | 1,875px (2.2) |
| Workshop row | 858–952px | ≤ 150px (≤ 170 at 320) | 116–206px* |
| First workshop row top | 1,219px | ≤ 560px | 497px |
| Hub cover band | 603px | ≤ 340px | 330px |
| Detail page height (W01–W04) | 8,024–8,760px (9.5–10.4) | ≤ 4,700px (≤ 5.6) | 5,643–6,150px (6.7–7.3)** |
| Detail cover band | 702–787px | ≤ 520px | 511–552px |
| Agenda (Ablauf) | 701–865px | ≤ 210px | 247–265px |
| Decision lab top | 1,551–1,745px | ≤ 800px | 864–888px |
| Decision lab height | 1,104–1,170px | ≤ 850px | 824–949px |
| Material row | 165–278px | ≤ 100px | 112px |
| Case section (W01, W03, W04) | 1,124–1,282px | ≤ 900px | 911–1,057px |
| Case section (W02, with real-world case) | 2,027px | ≤ 1,400px | 1,566px |
| The four short blocks, together | 1,497–1,823px | ≤ 1,000px | not prototyped |
| `/kurse` height | 6,126px (7.3) | ≤ 4,300px (≤ 5.1) | 4,766px (5.65) |
| Ledger row | 265–331px | ≤ 180px | 169–232px |
| Path stepper | 386px | ≤ 200px | 266px |
| Bottom of the next-course button | 809px (cut; the free area ends at 787px) | ≤ 700px | 674px |

\* The 206px row is W04. Its kicker still wraps to two lines, the "Neu" chip sits on its own line, and the title runs to three lines. §2.4 fixes all three: a one-line meta row at the bottom and the title head without the subtitle. With those, the estimate is 116 to 150px.

\*\* The prototype only tightened type and spacing. Reaching ≤ 5.6 screens also needs the material-description rule, the four-block tightening and the smaller agenda given in §3.4.

At 320x568 the before numbers are larger. The hub is 6,038px (10.6 screens), the detail pages are 9,077 to 9,972px (16.0 to 17.6), and `/kurse` is 6,709px (11.8). The prototype brings them to 2,063px (3.6), 6,280 to 6,931px (11.1 to 12.2) and 5,100px (9.0).

## 2. `/workshops` (hub)

Files: `src/app/workshops/workshops-content.tsx`, `src/app/workshops/workshop-copy.ts`, and from `src/components/werk/`: `cover-band.tsx`, `route.tsx` and `section-head.tsx`.

### 2.1 Page height

| Viewport | Height | Screens | Cover | "So läuft jeder Workshop" | List section | Rows W04 / W03 / W02 / W01 | First row top |
|---|---|---|---|---|---|---|---|
| 320x568 | 6,038 | 10.63 | 676 | 514 | 4,284 | 985 / 920 / 921 / 902 | 1,350 |
| 390x844 | 5,664 | 6.71 | 603 | 456 | 4,065 | 952 / 858 / 858 / 887 | 1,219 |
| 430x932 | 5,595 | 6.00 | 574 | 456 | 4,025 | 920 / 853 / 881 / 881 | 1,190 |
| 390x664 | 5,664 | 8.53 | 603 | 456 | 4,065 | same as 390x844 | 1,219 |
| EN 390x844 | 5,596 | 6.63 | 647 | 456 | 3,953 | 923 / 858 / 850 / 858 | 1,263 |

Other parts at 390: the team note is 194px, the boundary line about 40px and the footer 436px.

### 2.2 First viewport

- **320x568.** The screen shows the kicker, an H1 of three lines at 44px (132px tall) and a lead of six lines at 20px (174px). The start button sits at y=508, under the tab bar, whose free area ends at 511. No workshop is visible. The first row is 2.4 screens down. Screenshot: `shots/workshops@320x568-fv.png`.
- **390x844.** The screen shows the kicker, a two-line H1 (88px), a five-line lead (145px), the start button, the access line and the index rail. The rail shows "01 Prognosen", "02 Geschäftsberichte" and "03" cut at the edge. The "So läuft jeder Workshop" heading follows. Still no workshop is visible. Screenshot: `shots/workshops@390x844-fv.png`.
- **Globe.** It is hidden below md (`hidden md:block`), so on a phone the cover is a plain graphit slab with 64px of padding above the kicker (the CoverBand default `py-16`).

### 2.3 Anatomy of one row at 390 (W04, 952px)

`py-10` (80), then the cover `aspect-video` (201), figcaption (19 + 8), `gap-6` (24), then the text body (619):

- Kicker "Workshop 04 · Live 90 Min. · Allein ca. 60 Min.", with the "Neu" chip on its own line: 54
- h3 at 24px, three lines: 86
- Summary at 17px, four lines: 109
- Question figure: 100
- `dl` with "Du gehst mit", "Du brauchst" and "Material" stacked in six lines: 149
- "Live gehalten am …", on W03 only: 19
- "Workshop ansehen →": 44
- Margins: 76

That is **7 to 8 facts per row plus a full-width 16:9 picture.** The detail page shows every one of these facts again in its cover.

### 2.4 What is not concise and slick

1. **The picture repeats the title.** The W01 and W02 `MiniCover` prints the h3 title a second time, in paper on graphit, about 250px above the h3. The W03 and W04 deck covers (`card-preview.webp`, 1024px scaled to 358px) print the title *and* the question again, in English on the German page. Their small text renders at about 5 to 7px effective, which reads as unreadable micro-text (see `shots/el-wsrow-0@390.png`).
2. **Two meta lines.** The figcaption ("Live-Workshop mit Deck", "Selbstlern-Kit") plus the kicker line.
3. **The index rail repeats the list** that follows it: 584px of content in a 358px rail, with only two items fully visible. Once the rows are compact, the list itself is the index.
4. **"So läuft jeder Workshop" takes 456px** to explain the five-station path that every detail page shows again as its agenda.
5. **Repeated values across rows.** "Einen Browser, kein KI-Konto" is on three of four rows. "Workshop ansehen →" is on all four.
6. **The access claim appears twice:** "Alle Materialien kostenlos, ohne Anmeldung" in the cover, and the boundary line at the bottom.
7. **The hub lead is 20px (`text-lead`), five to six lines on a phone.** The H1 is 44px (`text-display` minimum), three lines at 320.
8. **Wasted cover padding:** 64px above the kicker and 48px below the rail.
9. **LCP hint on a hidden image.** The first row's deck image is `loading="eager" fetchPriority="high"`. If the image becomes desktop-only (`hidden md:block`), it still downloads on phones. The page comment says the H1 is the LCP element, so eager is not needed. Make it lazy.

### 2.5 Compared with a best-in-class mobile list

- App Store and Podcasts lists use rows of about 88 to 100pt: 60 to 64pt artwork, a title of at most two lines, one subtitle line, one meta line, and a whole-row tap target with a chevron.
- Material 3 uses 88dp "three-line" list items with 56dp leading media.

Details open on tap. They are never printed in the list.

**Recommended phone row, about 116 to 150px at 390:**

```
┌────┐  ESG-Berichte mit KI                       →
│ 04 │  Dieselbe Scope-1-und-2-Frage geht an einen
└────┘  Rechnungsordner und an eine Belegtabelle…     (15px, 2-line clamp)
        Neu · Live 90 · allein 60 Min.                 (13px meta)
```

- The tile is a 56px square in graphit with the number in paper and a clipped `GlobeLines` behind it. It reuses the brand, costs no image bytes, and keeps square geometry.
- The title shows the head only: `splitTitle`, so the subtitle does not print on phones.
- The row keeps one link. Its `::after` covers the whole row. The arrow is a 44×44 target on the right.
- The question, "Du gehst mit", "Du brauchst", the materials list, the live date and the format caption all move to the detail page on phones. They already appear there.

### 2.6 Plan with exact changes

Phones means below md (768), because the row becomes the two-column sheet at md. The convention stays as it is: the base class carries the phone value, and an `md:` or `sm:` variant hands back the reviewed desktop value. `hidden` is always paired with a restore at a breakpoint; `catalog-surfaces-mobile.test.ts` enforces that.

**Cover band** (`WorkshopsContent`):
- `contentClassName`: `pb-12 lg:pb-16` → `pt-6 pb-6 sm:pt-16 sm:pb-12 lg:pt-24 lg:pb-16`.
- h1: add `text-[2rem] leading-[1.05] sm:text-display` and keep `max-w-[14ch] xl:max-w-[16ch]`. Keep `mt-4`, or use `mt-2 sm:mt-4`.
- Lead: `mt-6 text-lead` → `mt-3 text-body sm:mt-6 sm:text-lead`. At 320 the lead still runs to five lines. For the first row to show at 320, `hubLead` needs one sentence; that is a copy decision to hand to the copy stream.
- Buttons row: `mt-8` → `mt-5 sm:mt-8`.
- Index `<nav data-workshop-index>`: add `hidden md:block`. The rail `ol` can drop its phone-only scroll classes.

**Route section** (`aria-labelledby="workshop-route-heading"`):
- `className="pt-14 sm:pt-20"` → `hidden sm:block sm:pt-20`.
- Below sm, add a one-line phone caption under the list SectionHead, for example `<p className="mt-2 text-caption text-muted-foreground sm:hidden">`. DE: "Jeder Workshop: Die Frage → Die falsche Antwort → Warum sie falsch ist → Die Reparatur → Deine Vorlage". Build it from `copy.routeStations`, and add a `routeInline` copy key for EN.
- Alternative: move the route section below the list in the DOM at all widths. That changes the desktop reading order, so treat it as an owner call.

**List section:** `pb-16 pt-14 sm:pb-24 sm:pt-20` → `pb-10 pt-8 sm:pb-24 sm:pt-20`.

**`WorkshopRow`:**
- `article`: `gap-6 py-10` → `grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3.5 gap-y-0 py-3.5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:py-10`. Keep `scroll-mt-24`, the `has-[a:focus-visible]` outline and `border-b border-hairline`.
- `figure`: add a new `<div data-workshop-tile aria-hidden className="relative isolate size-14 overflow-hidden bg-dark-bg md:hidden">` holding the number (`text-[1.0625rem] font-bold tabular-nums text-dark-fg`) and `GlobeLines highlightGermany={false}` (absolute, right about -60%). Wrap the existing image and MiniCover in `hidden md:block`, and give the figcaption `hidden md:block`.
- Kicker `div` (kicker plus chip): `hidden md:flex`.
- h3: `mt-2 text-[1.5rem] sm:text-[1.75rem]` → `text-[1.0625rem] leading-snug md:mt-2 md:text-[1.5rem] lg:text-[1.75rem]`. Keep the full title in the accessible name: `{head}<span className="sr-only md:not-sr-only">: {subtitle}</span>`. `textContent` stays the full title, which the unit test needs.
- Summary `p`: `mt-3 text-body` → `mt-0.5 line-clamp-2 text-[0.9375rem] leading-snug md:mt-3 md:line-clamp-none md:text-body`.
- New phone meta line `<p data-workshop-meta className="mt-1 text-caption text-muted-foreground tabular-nums md:hidden">`, for example "Neu · Live 90 · allein 60 Min.". Use a new copy function `catalog.rowMeta(number, live, self)`. **Do not repeat `need`, "Neu" or the exact kicker string verbatim**, because the unit test uses `getByText` on those.
- Question figure: `mt-5 grid` → `hidden md:mt-5 md:grid`.
- `dl`: `mt-5 grid … sm:grid-cols-[auto_minmax(0,1fr)]` → `hidden md:mt-5 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-4`.
- Live-tested `p`: add `hidden md:block`.
- Link:
  - Keep `min-h-11` and `after:absolute after:inset-0`, and keep the link static. Do not position it absolutely, or its `::after` stops covering the row.
  - On phones make the text column a two-column grid: `grid grid-cols-[minmax(0,1fr)_2.75rem] md:block`. The text children get `max-md:col-start-1`. The link gets `max-md:col-start-2 max-md:row-start-1 max-md:row-span-3 max-md:self-center max-md:mt-0 max-md:justify-center`.
  - Wrap the label in `<span className="max-md:sr-only">`. The ArrowGlyph stays visible.
- `Image`: drop `eager` and `fetchPriority` for row 0 and use lazy on every row. The `sizes` value can stay.

**Team note:** `mt-10 pt-6` → `mt-6 pt-4 sm:mt-10 sm:pt-6`. h2 `text-[1.25rem]` → `text-[1.125rem] sm:text-[1.25rem]`. Body `text-body` → `text-[0.9375rem] sm:text-body`.

**Optional, coordinate with the home-globe agent.** A static, cropped globe corner on the phone cover band would stop it reading as a flat slab: the top-right quarter at about 35% opacity, masked away from the text. It needs `CoverBand` to show `[data-cover-globe]` below md at a phone size. `werk.test.tsx` pins `hidden md:block`, and `workshops-content.test.tsx` pins `md:max-lg:[&>[data-cover-globe]]:hidden`.

**Targets.**
- 390x844: rows ≤ 150px, cover ≤ 340px, first row top ≤ 560px, page ≤ 2.7 screens.
- 320x568: rows ≤ 170px, page ≤ 4 screens, first row title visible, which needs the one-sentence lead.
- 430x932: page ≤ 2.2 screens.

## 3. Workshop detail pages (W01–W04)

Files:
- `src/app/workshops/[slug]/workshop-detail-content.tsx`
- `src/app/workshops/[slug]/workshop-decision-lab.tsx`
- `src/components/werk/route.tsx`
- `src/components/werk/question-card.tsx`
- `src/components/werk/stat-row.tsx`, via `StatValue`
- `src/components/werk/callout.tsx`

`Route`, `QuestionCard` and `CoverBand` are used only by the two workshop routes. `StatRow` is also used by `src/app/demos/page.tsx`, which belongs to another agent.

### 3.1 Measurements

| Page @ viewport | Height | Screens | Cover | Agenda | Lab top (vh) | Lab height | Materials (rows) | Case | Four blocks |
|---|---|---|---|---|---|---|---|---|---|
| W01 @320 | 9,077 | 15.98 | 925 | 720 | 1,737 (3.06) | 1,251 | 1,833 | 1,542 | 1,733 |
| W01 @390x844 | 8,024 | 9.51 | 757 | 701 | 1,551 (1.84) | 1,104 | 1,653 (213–258) | 1,282 | 1,497 |
| W01 @390x664 | 8,024 | 12.08 | 757 | 701 | 1,551 (**2.34**) | 1,104 | 1,653 | 1,282 | 1,497 |
| W01 @430 | 7,612 | 8.17 | 730 | 701 | 1,524 (1.64) | 956 | 1,608 | 1,210 | 1,397 |
| W02 @320 | 9,216 | 16.23 | 952 | 802 | 1,847 (3.25) | 1,273 | 848 | 2,467 | 1,764 |
| W02 @390x844 | 8,111 | 9.61 | 776 | 783 | 1,652 (1.96) | 1,156 | 758 (258–278) | 2,027 | 1,563 |
| W02 @390x664 | 8,111 | 12.22 | 776 | 783 | 1,652 (**2.49**) | 1,156 | 758 | 2,027 | 1,563 |
| W02 @430 | 7,725 | 8.29 | 776 | 783 | 1,652 (1.77) | 992 | 735 | 1,904 | 1,486 |
| W03 @320 | 9,470 | 16.67 | 859 | 865 | 1,817 (3.20) | 1,196 | 2,184 | 1,373 | 1,864 |
| W03 @390x844 | 8,441 | 10.00 | 702 | 865 | 1,660 (1.97) | 1,131 | 1,982 (210–258) | 1,124 | 1,551 |
| W03 @390x664 | 8,441 | 12.71 | 702 | 865 | 1,660 (2.50) | 1,131 | 1,982 | 1,124 | 1,551 |
| W03 @430 | 8,055 | 8.64 | 675 | 865 | 1,633 (1.75) | 947 | 1,873 | 1,124 | 1,505 |
| W04 @320 | 9,972 | 17.56 | 982 | 865 | 1,940 (3.42) | 1,329 | 1,999 | 1,477 | 2,210 |
| W04 @390x844 | 8,760 | 10.38 | 787 | 865 | 1,745 (2.07) | 1,170 | 1,819 (165–258) | 1,228 | 1,823 |
| W04 @390x664 | 8,760 | 13.19 | 787 | 865 | 1,745 (2.63) | 1,170 | 1,819 | 1,228 | 1,823 |
| W04 @430 | 8,379 | 8.99 | 760 | 865 | 1,717 (1.84) | 1,077 | 1,711 | 1,161 | 1,777 |
| EN W01 @390x844 | 7,693 | 9.11 | 711 | 701 | 1,505 (1.78) | 1,054 | 1,631 | 1,161 | 1,389 |
| EN W04 @390x844 | 8,446 | 10.01 | 798 | 865 | 1,755 (2.08) | 1,131 | 1,666 | 1,156 | 1,764 |

**The lab e2e guard has almost no slack.** `learning-density.spec.ts` asserts that the lab starts within 2.5 viewports on the iPhone 13 project (390x664, a limit of 1,660px). W02 passes with **8px** to spare (1,652px). W03 (1,660) and W04 (1,745) would fail if they were in the list; only W01 and W02 are.

**The first-viewport requirement was already relaxed.** The brief says the lab "must start in the first viewport on 390x664". The current spec comment says the cover alone fills that viewport, and the assertion was relaxed to 2.5 viewports. `git status` shows another agent currently has this spec modified.

**Where the first actual choice sits.** The first radio of the lab is at 2,110 to 2,331px at 390, which is 2.5 to 2.8 screens down.

**Anatomy at 390 (W03).**
- *Cover:* the back link is 45px. The H1 is 36px (`text-fluid-h1` minimum), two lines, 76px. The summary is 17px, four lines, 109px. The buttons are 44px. The facts line is two lines, 38px. The "Du brauchst / Du gehst mit" `dl` is 91px, because it only becomes two columns from sm. The q-card is 147 to 202px (20px question text, `py-5 pl-7`).
- *Agenda:* each station is label + minutes + activity at 82px; the lab station is 101px. W03 and W04 have eight stations.
- *Lab:*
  - The header is 479px:
    - prompt: 109px
    - facts `dl` stacked label-over-value: 179px, because the grid only switches to three columns at `min-[26rem]` = 416px
    - privacy note: 38px
  - The form is 554px: two fieldsets, options of 48 to 108px each, and the submit button.
- *Materials:* each row stacks pictogram and title, a description of three to five lines at 15px, notes, and then the chip plus the action link on their own 44px line.

### 3.2 First viewport

At **390x844** the screen shows:

- the back link
- the kicker
- the H1
- the summary of three to four lines
- two buttons
- the two-line facts line
- the four-line "Du brauchst / Du gehst mit" block

The q-card starts at 617 to 684px and is cut at the fold for W01, W02 and W04. Screenshot: `shots/workshops_ki-prognosen-einschaetzen@390x844-fv.png`.

At **320x568** the screen shows the back link, kicker, H1, summary and the first button; the second button wraps onto its own row.

At **390x664** the "Du gehst mit" value is cut by the tab bar.

### 3.3 Redundancy and what is not concise

1. **Minutes appear two or three times on one screen.** The cover facts line says "Live 90 Min. · allein ca. 60 Min.". The agenda caption directly below repeats it, and W01's "Allein ca. 90 Min." appears three times.
2. **"Du brauchst" appears three times.** The cover `need` (`needs[0]`) is repeated as the first bullet of "Das brauchst du", and the `accessNote` callout in the same section says the same thing again ("Für Deck, Lernbegleiter und Demo brauchst du nur einen Browser").
3. **"Du gehst mit" (the cover) overlaps "Nach dem Workshop"** (outcomes).
4. **"HTML · EN" is a bordered chip on every material row,** while the cover already says "Material auf Englisch".
5. **The agenda prints three lines per station**; the activity labels such as "Zuhören" and "Abstimmen" matter least on a phone. Eight stations cost 865px.
6. **The lab facts are stacked on phones** at 179px. As label-and-value rows they would take about 84px.
7. **Material descriptions run three to five lines on every row** (W03 section 1,982px), and each row also gives a separate 44px line to the chip and action.
8. **The four short blocks (Für wen, Nach dem Workshop, Das brauchst du, Nicht Teil) together take 1,497 to 1,823px.** Each has a 2px Kopflinie, an h2 at 20 to 24px, 17px bullets and 56px of top padding.
9. **The case section** has a seven-line narrative at 17px, a dashed limits box at 20px padding and 26px stat values. For W02 the real-world case follows too, for 2,027px in total.
10. **Minus signs are inconsistent (minor).** The detail cover summary prints the U+2212 minus ("−19.960 €"), while the hub converts it to ASCII. Reuse the hub's `AmountText` and `plainNumbers`.

### 3.4 Plan with exact changes

Phones means below sm (640), which matches where the cover and route already switch.

**Cover** (`WorkshopDetailContent`):
- `CoverBand contentClassName`: `py-8 sm:py-10 lg:py-12` → `pt-5 pb-6 sm:py-10 lg:py-12`.
- h1: add `text-[1.875rem] leading-[1.1] sm:text-fluid-h1`. Keep `lg:text-display`. Subtitle `text-fluid-h2` → `text-[1.25rem] sm:text-fluid-h2`, and `mt-2` → `mt-1 sm:mt-2`.
- Summary: `mt-4 text-body` → `mt-2.5 text-[0.9375rem] leading-normal sm:mt-4 sm:text-body`. Wrap it in `AmountText` from the hub, moved to a shared helper.
- Buttons: `mt-6` → `mt-4 sm:mt-6`.
- Facts `p`: `mt-5` → `mt-3 sm:mt-5`. Wrap the minute facts (the first one or two) in `<span className="hidden sm:inline">`, because the agenda caption says them one block later. `textContent` still contains them, so the unit test is unaffected.
- `dl`: drop the `sm:` gate, giving `mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 sm:mt-3 sm:gap-x-3`. Remove `mb-1 sm:mb-0` from the `dd`. This takes 91px down to about 38.
- `QuestionCard` (`question-card.tsx`; only the workshop pages use it):
  - Container `gap-4 py-5 pl-7 pr-6 grid-cols-[2rem_…]` → `gap-3 py-3.5 pl-5 pr-4 grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-4 sm:py-5 sm:pl-7 sm:pr-6 sm:grid-cols-[2.5rem_minmax(0,1fr)]`.
  - Pictogram `size-8 sm:size-10` → `size-6 sm:size-10`.
  - Default blockquote `text-[1.25rem]` → `text-[1.0625rem] leading-snug sm:text-[1.375rem]`.
  - In the cover, `order-last mt-8` → `order-last mt-5 sm:order-none sm:mt-6`.
  - `werk.test` pins `border-foreground bg-card`, `bg-mennige w-1.5`, `dark-section border-dark-fg bg-dark-bg`. All of those stay.
- Back link: keep it as is. If it moves into the cover band to save its 45px strip, `learning-density.spec.ts` selects `[data-cover-band] a` first as the "start action". The spec must then target the start button explicitly, for example with a new `data-cover-start` attribute.

**Agenda:**
- Section `py-8 sm:py-10` → `pt-6 pb-3 sm:py-10`.
- `Route`: add an opt-in `layout?: "stack" | "rail"` prop. The default stays `stack`, so `werk.test` passes unchanged.
- `rail` below sm:
  - `ol`: `flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:grid sm:overflow-visible`.
  - Each `li`: `w-[8.25rem] shrink-0 snap-start pr-3 sm:w-auto`. Stations are horizontal, with the same line markup as the sm branch.
  - Wrap the `ol` in a focusable region, `tabIndex={0} role="region" aria-label={label}` with a visible focus ring, so keyboard users can scroll it.
- Captions: on phones show the minutes plus the "Übung unten" lab marker. The activity and "nur live" line gets `hidden sm:block`.
- `mt-6` → `mt-3 sm:mt-6`. Merge the source caption and the "unten ausprobieren" link into one row: `mt-1 sm:mt-4`.
- This replaces the vertical Route that design-direction §6.10 and §7.2 prescribe for phones. The mobile-shell doc endorses rails for exactly this ("long stacks of identical cards become horizontal rails with scroll snap").
- Target: agenda ≤ 210px (prototype 247 to 265).

**Decision lab** (`workshop-decision-lab.tsx`):
- Inner grid: `gap-8 py-8 sm:py-10` → `gap-5 py-6 sm:gap-8 sm:py-10`.
- h2: `mt-3 text-fluid-h2` → `mt-1.5 text-[1.375rem] sm:mt-3 sm:text-fluid-h2`.
- Prompt: `mt-4 text-body` → `mt-2 text-[0.9375rem] sm:mt-4 sm:text-body`.
- Facts `dl`:
  - Below 26rem (416px), make each fact a label-and-value row. The fact `div` gets `flex items-baseline justify-between gap-3 min-[26rem]:block`.
  - The `dd` goes `mt-1 text-[1.25rem]` → `mt-0 text-[1.0625rem] min-[26rem]:mt-1 min-[26rem]:text-[1.25rem]`.
  - `gap-y-3` → `gap-y-1 min-[26rem]:gap-y-3`, `mt-6` → `mt-3 sm:mt-6`.
  - This takes 179px to about 84 and keeps the pinned `min-[26rem]:auto-cols-[minmax(min-content,1fr)]` and `border-t border-hairline`. W04's "Ordner Werk Nord: 12 Stromrechnungen" fits: about 130 + 150 < 358px.
- Privacy note: `mt-6` → `mt-3 sm:mt-6`.
- Fieldsets: `gap-8` → `gap-5 sm:gap-8`.
- `OPTION_ROW`: `py-3` → `py-2.5 sm:py-3`. **Keep `min-h-12`**; the test pins it.
- Actions: `mt-6` → `mt-4 sm:mt-6`.
- Targets: lab height ≤ 850px, lab top ≤ 800px at 390x844 (above the fold for W01 to W03), and ≤ 1.25 viewports at 390x664.
- **Keeping the lab inside the *first* 390x664 viewport is not possible** while the phone cover keeps the q-card, summary, two buttons and facts, and the agenda stays before the lab. The compact cover alone ends at about 600px of the 607 free. It would take dropping cover content or moving the agenda below the lab; both contradict workshop-standard §4.1 and the order the unit and e2e tests pin.

**Materials** (`MaterialRow`):
- `li`: `grid-cols-[2rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-5` → `grid-cols-[1.5rem_minmax(0,1fr)_2.75rem] gap-x-3 gap-y-0 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_8.5rem_7.5rem] sm:gap-x-6 sm:gap-y-2 sm:py-5`.
- Pictogram: `-mt-1 size-8` → `size-6 sm:-mt-1 sm:size-8`.
- h4: `text-[1.0625rem]` → `text-base sm:text-[1.0625rem]`.
- Description: `mt-1 text-[0.9375rem]` → `mt-0.5 line-clamp-2 text-[0.875rem] sm:mt-1 sm:line-clamp-none sm:text-[0.9375rem]`.
- Notes line: on phones, add the format and language as text at its end: `<span className="sm:hidden"> · {materialMeta(material)}</span>`.
- Chip wrapper: `hidden sm:block` (it is already `aria-hidden`).
- Action link:
  - On phones it becomes the 44×44 arrow in column 3: the wrapper is `col-start-3 row-start-1 self-start sm:contents`, and the label `<span>` gets `max-sm:sr-only`.
  - Keep `min-h-11`, `after:absolute after:inset-0` and both sr-only spans ("Sprache: Englisch"). The unit and e2e tests count those.
- Section: `SECTION` → `pt-10 sm:pt-20`, `mt-6 gap-10` → `mt-3 gap-6 sm:mt-6 sm:gap-10`.
- Targets: row ≤ 100px (prototype with a two-line clamp: 112), and W03 section ≤ 800px, from 1,982.
- The descriptions are the only per-material explanation, so a two-line clamp is preferred over hiding them. Line-clamp only hides visually; screen readers still read the full text.

**Case:**
- `mt-8 gap-10` → `mt-4 gap-5 sm:mt-8 sm:gap-10`.
- h3 `text-fluid-h3` → `text-[1.125rem] sm:text-fluid-h3`.
- Narrative `mt-4 text-body` → `mt-2 text-[0.9375rem] sm:mt-4 sm:text-body`.
- Gap Callout: add `px-4 py-3 sm:px-5 sm:py-4` locally through `className`, so the shared default stays. The list goes to `text-[0.875rem] sm:text-[0.9375rem]`.
- StatRow: `mt-10 pt-6` → `mt-6 pt-4 sm:mt-10 sm:pt-6`. `StatValue`: `text-[1.625rem]` → `text-[1.375rem] sm:text-[1.625rem] lg:text-num-lg`.
- Real-world block: `mt-14 pt-8` → `mt-8 pt-5 sm:mt-14 sm:pt-8`. Its StatRow `mt-8` → `mt-5 sm:mt-8`.
- Targets: ≤ 900px, and ≤ 1,400px for W02.

**The four short blocks:**
- Both wrappers: `SECTION` → `pt-10 sm:pt-20`, `gap-14` → `gap-8 md:gap-12`.
- `MinorHead`: `pt-4` → `pt-3 sm:pt-4`, h2 `text-fluid-h3` → `text-[1.125rem] sm:text-fluid-h3`.
- `SquareList`: `gap-3 text-body` → `gap-1.5 text-[0.9375rem] leading-normal sm:gap-3 sm:text-body`. Every `mt-6` → `mt-3 sm:mt-6`.
- "Nicht Teil": `py-3 text-body` → `py-2 text-[0.9375rem] sm:py-3 sm:text-body`.
- "Das brauchst du": the `accessNote` callout repeats `needs`. Offer the copy stream the choice of shortening either one.
- Target: ≤ 1,000px together.

**Provenance footer:** `pt-14` → `pt-10 sm:pt-20`.

**Page targets.** 390x844 ≤ 5.6 screens (≤ 4,700px). 320x568 ≤ 10 screens. The start action stays in the first viewport; it now sits at about 295 to 317px instead of 380 to 447.

## 4. `/kurse`

Files: `src/app/kurse/page.tsx`, `src/app/kurse/learning-atlas.tsx`, `src/app/kurse/course-ledger-row.tsx`. The course landing pages under `src/components/course/**` belong to another agent and were not touched.

### 4.1 Measurements

| Viewport | Height | Screens | Hero | Goal tabs top | Next-course card (bottom) | Path | All courses | Ledger rows | Access | Workshops band |
|---|---|---|---|---|---|---|---|---|---|---|
| 320x568 | 6,709 | 11.81 | 344 | **511** (= fold) | 372 (1,015) | 432 | 3,790 | 311–359 | 392 | 347 |
| 390x844 | 6,126 | 7.26 | 279 | 446 | 353 (910) | 386 | 3,494 | 265–331 | 337 | 290 |
| 430x932 | 5,836 | 6.26 | 279 | 446 | 326 (883) | 386 | 3,258 | 265–313 | 310 | 290 |
| 390x664 | 6,126 | 9.23 | 279 | 446 | 353 (910) | 386 | 3,494 | 265–331 | 337 | 290 |
| EN 390x844 | 5,928 | 7.02 | 279 | 446 | 345 (902) | 386 | 3,331 | 237–313 | 337 | 263 |

Other measurements at 390:
- The ten ledger rows sum to 3,072px.
- Each path step is 73px.
- The goal tabs are 2 × 44px, and their text fits.
- The sticky level filter is 61px.

### 4.2 First viewport

At **390x844** the screen shows:

- the kicker
- the two-line H1 at 36px
- the three-line lead
- "Unsicher, wo du stehst?" with its link on its own line
- the atlas heading
- the four goal tabs
- the next-course card's label, title, three-line promise and duration

The Mennige "Kurs starten" button is cut by the tab bar (765 to 809 against 787 free). Screenshot: `shots/kurse@390x844-fv.png`.

At **320x568** the goal tabs start exactly at the fold, so the first decision is not visible.

### 4.3 What is not concise

1. **Every ledger row stacks** title (44px link), promise (three to four lines at 17px), a level line, a demo link line (44px), a mono source line (44px) and an action line (44px). That is 265 to 331px.
2. **Titles appear three times.** The next-course card repeats the promise and the duration of the course that the ledger prints again. The path stepper lists the four foundation courses that the ledger lists again below, so "KI und Gesellschaft" appears three times.
3. **Unavailable rows show their state and destination twice.** On the four rows of unavailable courses, "Hier nicht verfügbar" is printed, and "Kursübersicht →" points to the same href as the title link.
4. **The source attribution repeats six times.** "interactive-courses #0e5dfd3" in mono is on all six technical rows. It stays on every row because the MIT attribution requirement is recorded in the row's code comment and pinned by a test.
5. **Two links go to `/konto`:** "Fortschritt in deinem Konto ansehen" in the ledger head, and the access section.
6. **The sticky level filter takes 61px.** With the top bar and tab bar that is 166px of fixed chrome, 29% of a 568px screen.

### 4.4 Plan with exact changes

**Hero** (`page.tsx`):
- Container: `pb-14 pt-6` → `pb-8 pt-4 sm:pt-12 lg:pb-16`.
- h1: add `text-[1.875rem] leading-[1.1] sm:text-fluid-h1`.
- Intro: `mt-3 text-body sm:mt-4 sm:text-lead` → `mt-2 text-[0.9375rem] sm:mt-4 sm:text-lead`.
- firstStep: `text-body` → `text-[0.9375rem] sm:text-body`. At that size the link fits on the same line.
- `[data-learning-gallery]`: `mt-8` → `mt-5 sm:mt-10`.

**Atlas** (`learning-atlas.tsx`):
- h2: `text-fluid-h2` → `text-[1.375rem] sm:text-fluid-h2`.
- Tabs: `mt-4` → `mt-3 sm:mt-6`. **Keep `min-h-11` and `lg:min-h-14`.**
- `#selected-learning-path`: `mt-6 gap-8` → `mt-4 gap-5 sm:mt-8 sm:gap-8`.
- Next-course card:
  - Box `p-5` → `p-4 sm:p-6`.
  - Promise `mt-2 text-body` → `mt-1 text-[0.9375rem] sm:mt-2 sm:text-body`.
  - Move `nextCourse.duration` into the kicker line ("Offener Einstieg ohne Lernkonto · ca. 2 Std.") and drop its own `p`.
  - Button `mt-5` → `mt-3 sm:mt-5`.
  - Keep `bg-card border-hairline` and the single Mennige link.
- Path stepper:
  - `li pb-3` → `pb-0 sm:pb-3`.
  - Link `flex-col … py-2` → `flex-row flex-wrap items-baseline gap-x-2 py-1.5 sm:flex-col sm:gap-0.5 sm:py-2`, keeping `min-h-11`.
  - Adjust the dashed connector offsets for `pb-0`.
  - Path summary: `text-body` → `text-[0.9375rem] sm:text-body`.
- Level filter:
  - `py-2` → `py-1`.
  - Add `[@media(max-height:700px)]:static`, so it only sticks on tall phones.
  - Keep `sticky top-[var(--nav-h-compact)] lg:hidden js-shell-only`, which the test pins.
- Groups: `mt-8 space-y-12` → `mt-4 space-y-8 sm:mt-8 sm:space-y-12`.

**Ledger row** (`course-ledger-row.tsx`):
- `li py-5` → `py-3 sm:py-5`.
- h4: `text-[1.25rem]` → `text-[1.0625rem] sm:text-[1.25rem]`. The test pins `text-[1.25rem]` and must change to `sm:text-[1.25rem]`.
- Promise: `mt-1 text-body` → `mt-0.5 line-clamp-2 text-[0.9375rem] sm:line-clamp-none sm:text-body`.
- Put the action, demo and source links in **one wrapping row** below lg. The action cell (`data-course-action`) and the demo/source `div` share a `flex flex-wrap gap-x-5` wrapper.
  - The action stays a visible text link with `min-h-11`; the test "one visible, addressable text-link action" pins that.
  - One way to do it: render the demo and source links inside `[data-course-action]` below lg, so the `lg`/`xl` column grid stays untouched.
- Targets: rows ≤ 180px (prototype 169 to 232, still with separate link rows), and the ledger ≤ 1,900px from 3,072.

**Access section:** `mt-16` → `mt-10 lg:mt-20`.

**Workshops band:** `py-10` → `py-7 lg:py-12`.

**Page targets.**
- 390x844: ≤ 5.1 screens, with the next-course button fully visible (bottom ≤ 700px; prototype 674).
- 320x568: goal tabs start ≤ 420px (prototype 381) and the page is ≤ 8 screens.
- No course images; `route-kurse-hub.spec` asserts there are none.

## 5. Prototype: what was checked

`proto/proto.mjs` injects the CSS above (roughly), plus the 56px tile and one-line route caption on the hub and the meta-as-text on material rows, into the live pages at all four viewports. Results are in `proto/results.json`; screenshots are `proto/*-fv.png` and `proto/*@390x844-full.png`.

- **Hub:** 1,875px at 390 (2.2 screens), 2,063px at 320 (3.6), 1,777px at 430 (1.9). Rows 116 to 206px. The first row starts at 497px, and W04 plus the top of W03 are visible in the first 390 viewport.
- **Detail:** 5,643 to 6,150px at 390 (6.7 to 7.3 screens). The lab starts at 864 to 888px, which is 1.02 to 1.05 × 844 and 1.30 to 1.34 × 664. The agenda rail is 247 to 265px, material rows 112px, case 911 to 1,566px.
- **Kurse:** 4,766px at 390 (5.65 screens). The next-course button is at 630 to 674px. The path is 266px; ledger rows are 169 to 232px.
- **Horizontal overflow:** still none at any size.
- **Not valid as proposals.** The prototype's own 24 to 40px action boxes (`targetsUnder44` in `results.json`) came from a shortcut in the prototype CSS. The plan above keeps every `min-h-11`.

## 6. What already passes (keep it)

- **No horizontal overflow** at 320, 390 and 430 on any page, in DE and EN: `scrollWidth` equals the viewport width. The intentional scrollers are the hub index rail and the `/kurse` level chips.
- **Tap targets.** Every interactive element in `main` is at least 44px tall. The lab radios are 20px, but sit inside label rows of 48 to 108px. Hub rows and material rows are clickable over the whole row through `::after`.
- **Text sizes.** The smallest is 13px (`text-caption`) on every page; nothing is below 12px. The 13px share is 18 to 29% of characters, and the body text is 15 to 17px.
- **Focus.** Hub rows and material rows ring the whole row through `has-[a:focus-visible]`, the lab radios carry their own ring, and the tab bar keeps focus clear.
- **Server components.** `workshops-content.tsx` and `workshop-detail-content.tsx` stay server components. Everything in this plan is CSS or markup.

## 7. Tests

### 7.1 Must stay green and must not be weakened

- **44px targets:**
  - `mobile-shell.spec.ts` ("every tab clears the 44px product target floor", at 320 and 390)
  - `learning-atlas.test.tsx`: goal tabs `min-h-11` and `lg:min-h-14`; row action `min-h-11` with a visible label
  - `workshops-content.test.tsx`: row link `min-h-11`
  - `werk.test.tsx`: `ButtonLink` and `MaterialList` `min-h-11`
  - `workshop-decision-lab.test.tsx`: option `min-h-12`
- **12px floor:** the `text-[(9|10|11)px]` bans in `workshops-content.test.tsx`, `workshop-detail-content.test.tsx` and `workshop-decision-lab.test.tsx`. Nothing new goes below 13px, except an optional 12px "Neu" marker.
- **Focus:** the `has-[a:focus-visible]:outline-[3px]` pins on hub rows. The new agenda rail needs `tabIndex=0` and a visible ring.
- **No horizontal overflow:** `route-workshops-locales.spec.ts` (320, 390, 768, 1440, DE and EN) and `route-kurse-hub.spec.ts` ("/kurse mobile … no horizontal overflow at 390px").
- **Lab and order:**
  - `learning-density.spec.ts`: start action fully in the first viewport, cover → agenda → lab order, lab bound (tighten it, never loosen it).
  - `workshop-detail-content.test.tsx`: cover → agenda → lab → materials, no `<details>`, the lab station marked, the "unten ausprobieren" link.
- **Content contracts:**
  - `route-workshops-locales.spec.ts`: distinct material hrefs per page and "Language: English"/"Sprache: Englisch" counts. Keep the sr-only spans and one link per material.
  - `route-kurse-hub.spec.ts`: ten rows, no `img` in the atlas, headings visible at 390.
  - `catalog-surfaces-mobile.test.ts`: server-only, `hidden` restored at a breakpoint, no phone-only `order-*` on `workshops-content.tsx`.

### 7.2 Will need updating

| Test | Assertion that changes |
|---|---|
| `src/app/catalog-surfaces-mobile.test.ts` › "stacks the workshop row cover first and turns the index into a rail" | Pins the rail class string `flex snap-x scroll-px-4 gap-x-6 overflow-x-auto pb-2 pr-4 sm:flex-wrap sm:overflow-visible sm:pr-0`. It becomes `hidden md:block` on the index `nav`. Also pins `md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]` (still true) and `pt-14 sm:pt-20` (becomes `pt-8 sm:pt-20`). The DOM order figure → h3 → question → Link still holds. Add a pin for the phone row grid `grid-cols-[3.5rem_minmax(0,1fr)]` and `line-clamp-2 … md:line-clamp-none`. |
| `src/app/workshops/workshops-content.test.tsx` › "uses deck-cover previews…" | `previews[0]` `loading="eager"` and `fetchpriority="high"` becomes lazy, or whatever art direction is chosen. Add a check that the tile exists and is `aria-hidden`. The ban on `\btranslate-[xy]-\d` and `rotate-\d` applies to the tile's globe placement too. |
| same file › "renders English rows…" and "marks workshop 04 as new…" | The `getByText` calls must stay unambiguous: kicker "Workshop 03 · Live 90 min · Alone about 60 min", "A browser, no AI account", "Neu". Either keep the new phone meta line textually distinct, or switch those queries to scope `[data-workshop-meta]` explicitly. The h3 `textContent` equality still holds with the sr-only subtitle span. |
| `src/components/werk/werk.test.tsx` | Route: keep the default-layout pins and add a `layout="rail"` test (focusable region, `snap-x`, `sm:grid`). QuestionCard: the padding classes change; the pinned bar, border and `dark-section` classes stay. CoverBand `hidden md:block` changes only if the phone globe is adopted. |
| `src/app/workshops/[slug]/workshop-decision-lab.test.tsx` | Facts: keep `border-t border-hairline` and `min-[26rem]:auto-cols-[minmax(min-content,1fr)]`, and add the phone label-value classes. No existing assertion breaks. |
| `src/app/workshops/[slug]/workshop-detail-content.test.tsx` | None break with the plan as written, because hidden minutes and the inline material meta stay in `textContent`. If the back link moves into the cover band, the "back link" test still passes, but see `learning-density` below. Add pins for the compact cover (`dl` always a grid) and one material link per row after the arrow-only change. |
| `src/app/kurse/learning-atlas.test.tsx` | Row title `text-[1.25rem]` becomes `sm:text-[1.25rem]`. The group head `text-[1.375rem] sm:text-[1.625rem]` can stay. If the demo and source links move into `[data-course-action]`, the "row action" queries `action?.querySelector("a")` pick the first link: keep the verb link first. |
| `tests/e2e/learning-density.spec.ts` | Tighten `viewport.height * 2.5` to `* 1.25` on the iPhone 13 project, and add a 390x844 case where the lab starts before 800px. Add W03 and W04 to `WORKSHOP_ROUTES`. If the back link moves into the band, change `page.locator("[data-cover-band] a").first()` to an explicit start-button hook. **This file is currently modified by another agent (per `git status`); coordinate before editing.** |
| New e2e (suggested) | Hub rows ≤ 170px at 320, 390 and 430, first row starting inside the first 390x844 viewport, and `/kurse` next-course button fully inside the 390x844 viewport. Suggested file: `tests/e2e/learning-mobile-density.spec.ts`. |

Unaffected: `heading-band-geometry.spec.ts` (measures `/buecher` only), `mobile-shell.spec.ts`, and the kurse `page.test.tsx` (content-only assertions).

### 7.3 Docs that go stale with this plan

- `research/design-direction.md`:
  - §6.9: globe hidden below md. Unchanged unless the phone globe is adopted.
  - §6.10: "phone is vertical" becomes a rail for the agenda.
  - §7.1: "Phone (390): … H1 at 44px; index row becomes a horizontal rail; … cards stack with the cover on top and full width" becomes compact rows.
  - §7.2: "Phone: … the Route is vertical; material rows stack as [icon + name], then [description], then [meta chip, action]" becomes the compact recipe.
- `packages/website/docs/experience-system.md`, "Mobile Companion Shell": add a density rule, for example that catalog rows are at most about 170px on a 390 phone, show details on the detail page, and carry one link per row.

## 8. EN spot-check

- The EN pages behave like DE, with similar numbers: hub 5,596px (6.6 screens) and rows 850 to 923px; W01 7,693px; W04 8,446px; `/kurse` 5,928px.
- The EN W04 title ("ESG Reporting with AI: From Raw Inputs to Clearer Insights") makes the cover 798px tall at 390, 909px at 320. That is the strongest case for showing only the title head on phone hub rows and for the 30px phone H1 on detail covers.
- No overflow, no text under 13px, no target under 44px, and no German interface strings were seen on the EN pages checked.

## 9. Files

All paths are under the scratchpad at `/tmp/claude-0/-home-user-platform/614e303c-f8f0-55ca-be18-13442a9af90b/scratchpad/`.

**Data**
- `mobile/audit-learning/data/*.json`: 40 page/viewport records.
- `mobile/audit-learning/run-all.log`: log of the final sweep.

**Screenshots**
- Before: `mobile/audit-learning/shots/<route>@<w>x<h>-fv.png` and `-full.png`.
- Element crops:
  - `el-wsrow-0..3@390.png`: hub rows
  - `el-wsroute@390.png`: hub route
  - `el-w03cover`, `el-w03agenda`, `el-w03lab`, `el-w03mat`, `el-w03case` (all `@390.png`)
  - `el-kheader`, `el-katlas`, `el-kall`, `el-kband`, `el-kaccess` (all `@390.png`)
- Prototype: `mobile/audit-learning/proto/*-fv.png`, `*@390x844-full.png`, `results.json`.

**Scripts**
- `mobile/audit-learning/measure.mjs`
- `mobile/audit-learning/summarize.py`
- `mobile/audit-learning/elements.mjs`
- `mobile/audit-learning/proto/proto.mjs`
