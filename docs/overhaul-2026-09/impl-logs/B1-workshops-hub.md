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
