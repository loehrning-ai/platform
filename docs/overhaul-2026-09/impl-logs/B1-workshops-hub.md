# B1 workshops hub: change log

## Files changed
- src/app/workshops/workshops-content.tsx: rewritten on src/components/werk. Graphit CoverBand with the line globe; kicker; display h1; lead; one dark-tone primary ButtonLink ("Mit Workshop NN beginnen", pointing at the first row's detail page); access caption; index row in numeric order as a nav of anchor links (a snap rail on phones, wrapping from sm). Then a "So läuft jeder Workshop" SectionHead with a Route (description mode, 5 stations), then the list: SectionHead "Workshops" and one row per workshop, separated by hairlines. Then "Mit deinem Team" and the boundary Callout (shield).
  - Row: 16:9 deck-cover figure (next/image; first eager with fetchPriority high, others lazy) with `format` as figcaption; kicker "Workshop NN · Live X Min. · Allein ca. Y Min."; "Neu" meta chip for numbers in NEW_WORKSHOPS (only "04"); h3 title; summary; question line (question pictogram + label + quoted question); dl with Du gehst mit / Du brauchst / Material (role labels from detail.roleLabels, de-duplicated); "Live gehalten am …" from provenance.liveRunAt; one text link with a stretched ::after and aria-label "Workshop ansehen: <title>".
  - "Du brauchst" is derived: "Einen Browser, kein KI-Konto" when notNeeded mentions KI-Konto/AI account, otherwise needs[0].
  - Hub order: newest first (orderWorkshopsForHub, exported), so 04 leads automatically when it lands and the cover button reads "Mit Workshop 04 beginnen". The registry order is unchanged.
  - Removed: washes, offset sheets, tape strips, INDEX_BARS, HighlightedText, rotated cards, the acid summary box, mono-uppercase eyebrows, step and file counts, "Erste Entscheidung", the accessNote paragraphs, hover lift.
- src/app/workshops/workshop-copy.ts (catalog block and its interface only): dropped the obsolete hub keys. Added hubStart, workshopNumber, quote, requirementLabel, requirementBrowserOnly and materialLabel. minutesSelfStudy now starts with a capital letter because it stands after "·". hubAccess now says "ohne Anmeldung" / "no sign-up" instead of "ohne Konto", because W02 needs a Claude plan.
- src/app/workshops/page.tsx: JSON-LD LearningResource gains timeRequired (PT<minutesLive ?? minutesSelfStudy>M) and teaches (outcomes).
- Tests: workshops-content.test.tsx (rewritten for the new structure, with a W04 case), catalog-surfaces-mobile.test.ts (only buecher reorders now; the workshop test pins cover-first source order plus the index rail), tests/e2e/heading-band-geometry.spec.ts (dropped /workshops routes, kept /buecher), tests/e2e/route-workshops-locales.spec.ts (hub h1 strings only; the material count stays 0), tests/e2e/workshops.spec.ts (exact row link name).

## Checks
- vitest: workshops-content, page.locale, catalog-surfaces-mobile, learning-surface-density-contract, werk.test: 99/99 pass.
- eslint clean on my files; tsc shows no errors in my files.
- axe (wcag2a/aa, 21, 22aa) against the dev server, /workshops and /en/workshops at 390 and 1440: 0 violations.
- Manual pass of the route-workshops-locales hub checks at 320/390/768/1440, DE and EN: no overflow, 0 material links, EN links locale-preserving, no German tokens, no text under 12px, no link under 44px. Clicking "Workshop ansehen: Geschäftsberichte mit KI lesen" navigates to the detail page.
- LCP on the dev server is the h1 at both widths; the globe is inline SVG from CoverBand (about 4 KB).
- Screenshots: impl/B1-workshops-hub/{de,en}-{1440,390}-{fold,full}.png.

## Not run
- `bunx playwright test` fails at launch: /opt/pw-browsers/chromium_headless_shell-1228 is missing. The e2e specs were edited but not executed; the equivalent checks above were run by hand with the chromium at /opt/pw-browsers/chromium.
- Lighthouse was not run (it needs a build).

## For the integrator
- route-workshops-locales.spec.ts detail rows (W03 material count 3 → 7, detail headings) belong to the detail-page owner.
- The cover-band button follows hub order (newest first). If the owner wants 03 kept as the recommended start after 04 ships, change orderWorkshopsForHub or pick the start explicitly.
- highlighted-text.test.tsx still mentions workshops-content.tsx in a comment; the component is now used only by buecher.
- The W01 card-preview.webp is a light, paper-toned page, while W02 and W03 are graphit deck covers. Regenerating the covers (design-direction 10.4) would make the rows uniform.

---

# B1 polish pass (after critique)

## Files changed
- src/app/workshops/workshops-content.tsx
  - Covers: `DECK_COVERS` allow-list (only "03"). All other rows render `MiniCover`: an aria-hidden graphit 16:9 block with a GlobeLines (no Germany trace, so a row has no second Mennige mark), the number in the top corner and the title in 20px bold dark-fg. W04 has no card-preview.webp yet, so it gets the mini-cover as well.
  - Start button: `RECOMMENDED_START = "03"`. The button stays on 03 when 04 leads the newest-first list.
  - CoverBand: h1 `max-w-[14ch]`, lead `md:max-w-[46ch] xl:max-w-[56ch]`, globe hidden from md to below lg through `md:max-lg:[&>[data-cover-globe]]:hidden` passed as className (werk is not mine), content `pb-12 lg:pb-16` so the bottom matches the top. The phone rail gets `scroll-px-4 pr-4 sm:pr-0`.
  - Route: `max-w-[60rem]`, with captions passed as `block text-[0.875rem] leading-snug text-pretty` spans.
  - Materials: a fixed noun order (deck, demo, kit, guide, lab, case, card, exercise, data, hub, presenter, builder), capped at 4 plus "N weitere"/"N more". Each item is a `whitespace-nowrap` span with its " · " joiner. The builder role uses the hub noun "Bauanleitung"/"Build guide".
  - Requirement: `limitingNeed` uses `catalog.requirementShort[slug]` before needs[0].
  - `plainNumbers()` turns U+2212 into ASCII "-" in the summary and question, and puts an NBSP before €.
  - Team section: the SectionHead is gone. There is now a small hairline note (h2 at 20px, kept as h2 for the outline) inside the list section, followed by the Callout at mt-6. The body is generated from the workshops that have a "presenter" material, so W04 is included automatically.
  - Row focus: the article gets a `has-[a:focus-visible]` 3px Mennige outline at offset 4. The link drops its own ring only under `supports-[selector(:has(*))]`.
  - The list caption only shows when there are 2 or more rows.
- src/app/workshops/workshop-copy.ts (catalog only): the kicker no longer says "kostenlos"/"free". listCaption is "Neueste zuerst"/"Newest first" (now a string). hubHeading is "Workshops mit Fall und Vorlage"/"Workshops with a case and a template". routeCaption is "60 bis 90 Minuten". EN hubStart is "Start with Workshop NN" and EN leaveWith is "You leave with". New keys: materialNouns, moreMaterials, requirementShort. teamsBody is now a function of workshop numbers, using the critique's copy.
- Tests: workshops-content.test.tsx (new headings and kicker; the button stays on 03 with W04; the team note; a single "kostenlos"; the material cap and nowrap; ASCII minus; one img plus 2 mini-covers; row focus class), catalog-surfaces-mobile.test.ts (rail class string), tests/e2e/route-workshops-locales.spec.ts (hub h1 strings).

## Checks
- vitest: src/app/workshops/, src/components/werk, catalog-surfaces-mobile, public-information-density, passive-state-design-contract, access-surfaces-density, api/workshops.json all pass.
- eslint clean. tsc: no errors in my files.
- axe (wcag2a/aa/21aa/22aa): 0 violations on /workshops and /en/workshops at 390/1024/1440. There is no horizontal overflow at any of these widths.
- Screenshots: impl/B1-workshops-hub/polish/*.png. The row outline was confirmed as a 3px solid computed style (the element screenshot clips the offset ring).

## For the integrator / other owners
- Covers: regenerate card-preview.webp for W01, W02 and W04 from slides.html#cover/0 (design-direction 10.4), then add their numbers to `DECK_COVERS`. Regenerate the W03 cover without the "75 minutes" line, because the hub now says "60 bis 90 Minuten" and the kicker says "Live 90 Min.".
- Registry owner: replace U+2212 with ASCII "-" in the W03 DE/EN summary, description and scenes (the hub already normalises the text it shows). Consider adding `requirementShort` to the registry and removing the slug map from the catalog copy.
- werk owner: CoverBand could take the globe breakpoint as a prop (for example `globeFrom="lg"`) in place of the className override used here.
- Nav/footer (B6): the critique's high issue 3 (8.15 nav, 8.4/8.10/8.11 footer). In the latest capture the nav is already flat. The footer headings are now sentence case, but "Datenstand"/"Aktualisiert" still use mono labels.
- The Playwright e2e specs were not run (the headless shell binary is missing).

---

# B1 polish pass, retry (2026-09-26, after W04 landed in the registry)

## State found
The first polish pass (above) is already in the tree through WIP commit 98926a0. Commit 5e25079 wired W04 into the registry, added its deck-cover card-preview.webp, put "04" in `DECK_COVERS` and rewrote the hub test against the real four-workshop list. The hub now renders 4 rows: W04 and W03 show deck covers, W02 and W01 show the CSS mini-cover. The button stays on 03 and the team note reads "Workshops 03 und 04 haben ...". Nav and footer (critique high 3) have landed on the flat Werkzeichnung chrome. Every critique item was re-checked against live captures of the four-workshop page.

## Files changed in this pass
- src/app/workshops/workshops-content.tsx
  - Cover band globe (high 2, remainder): from lg, CoverBand gets `lg:[&>[data-cover-globe]]:[mask-image:linear-gradient(to_right,transparent_32%,black_50%)]`. I measured 1024, 1152, 1280, 1440 and 1920 in DE and EN. At the right edge of the text column (h1, lead, button line, index row) the mask alpha is 0 at every width. At the Germany trace it is 1 at every width. No globe line now runs under the H1 or the lead. The existing md..<lg hide stays.
  - H1: `max-w-[14ch] xl:max-w-[16ch]`. EN "Workshops with a case and a template" went from 3 lines to 2 at 1280 and above. DE was already 2 lines at every width. Below xl, 16ch would push the EN H1 to x=627 at 1024, too close to Germany (x=724), so it stays at 14ch there.
  - Negative amounts: `plainNumbers` now only maps U+2212 to "-". A new `AmountText` wraps negative amounts (" -19.960 €", " -€19,960") in `span.whitespace-nowrap.tabular-nums`. In EN, a hyphen-minus before "€" is a line-break opportunity, so "-" could end a line. A lookbehind requires a space before the minus, so hyphenated words such as "Scope-1-und-2-Frage" are not touched. The number must end on a digit, so the sentence period stays outside the span. Used for the summary and the question.
  - Row `dl`: `max-w-[56ch]` becomes `max-w-[73ch]`. At 13px caption that is the same measure as the 17px summary, so the facts line up with the prose. The need `dd` gets `text-pretty`. W02 "Claude-Desktop-App und ein Claude-Plan mit Claude Code" (and the EN line) no longer orphans "Code".
- src/app/workshops/workshops-content.test.tsx: pins the H1 widths and both band globe classes. Checks that the EN amount "-€19,960" and the DE amount "-19.960 €" are single nowrap/tabular spans, and that the W04 "Scope-1-und-2-Frage" summary is not split.
- workshop-copy.ts and page.tsx: unchanged in this pass.

## Checks
- vitest (20 files, 323 tests): src/app/workshops/, catalog-surfaces-mobile, src/components/werk, api/workshops.json, lib/workshops*, learning-surface-density-contract, public-information-density, passive-state-design-contract, access-surfaces-density, sitemap, highlighted-text. All pass.
- eslint: clean on page.tsx, workshops-content.tsx, workshop-copy.ts and workshops-content.test.tsx.
- tsc -p tsconfig.typecheck.json: 0 errors in the whole project.
- bun run content:lint: 0 errors, no warnings in my files.
- Playwright e2e, run for the first time. The default headless shell 1228 is still missing, so I used a temporary config that extends playwright.config.ts with executablePath /opt/pw-browsers/chromium (deleted afterwards) and E2E_REUSE_EXISTING_SERVER=1 against the dev server. workshops.spec (4), route-workshops-locales.spec (4 widths, DE+EN), heading-band-geometry.spec (4) and workshop-hydration.spec (4): 16 of 16 pass.
- axe (wcag2a/aa/21aa/22aa): 0 violations on /workshops and /en/workshops at 320, 390, 768, 1024 and 1440. Also at every width: no horizontal overflow, one h1, no text under 12px, no link or button under 44px, 0 material links, and EN links are all /en with no German strings. The row focus ring is 3px solid Mennige at offset 4, and the link drops its own ring. Clicking a row link navigates to the detail page.
- No en or em dash in the visible copy of <main>. The only U+2212 characters are inside the JSON-LD script (registry `description`), see below.
- Screenshots: impl/B1-workshops-hub/polish2/ (band2-{de,en}-{1024..1920}.png, full2-{de,en}-{1440,1024,390}.png plus per-row crops, m-*.png, focus-row.png).
- Screenshot note: the fonts are `font-display: optional` and the container has no Arial for the `local("Arial")` fallback. A cold dev-server fetch therefore leaves a page on DejaVu for its whole lifetime, which is the "fallback font" the critique saw. polish2/lib.mjs serves the woff2 files from memory and adds a block-display FontFace, for screenshots only. In production the fonts are preloaded and cached, so this is not a page issue. The integrator may want to confirm the fallback metrics on a machine that has Arial.

## Still open for other owners / the integrator
- Covers (critique high 1, rest): regenerate W01 and W02 card-preview.webp from slides.html#cover/0 at 1920x1080, downscaled to 960x540, then add "01" and "02" to `DECK_COVERS`. Until then they render the uniform CSS mini-cover. The W03 cover still prints "75 minutes" in its footer, while the hub says "Live 90 Min." and the route "60 bis 90 Minuten". Regenerate it without that line (critique low: durations).
- Registry owner: U+2212 is still in the W03 DE/EN `description` and in the W04 `description` ("−5,1 %", "−29,2 %"). These only reach the JSON-LD on the hub, but the detail pages show them. `requirementShort` could move from the catalog copy map into the registry.
- werk owner: CoverBand could take `globeFrom="lg"` and a `globeMaskStart` prop in place of the two arbitrary-variant overrides passed as className here.
- Playwright: install chromium_headless_shell-1228 (or pin launchOptions.executablePath) so `bun run test:e2e` runs without a temporary config.
