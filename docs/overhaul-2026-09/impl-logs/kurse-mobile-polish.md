# kurse-mobile-polish: /kurse critique applied

Date 2026-09-26. Desktop is unchanged: 1440x900 is 4,414px with rows 191/143/191…, the same as before. The one visible desktop change is the English demo label (see below).

## Numbers (brand face forced, DSF 3, isMobile)

| Viewport | Height before → after | Screens | Goal rail top | Start button | Rows sum | Max row |
|---|---|---|---|---|---|---|
| 320x568 DE | 4,356 → 3,704 | 7.7 → 6.5 | 372 → 284 | 624–668 → **467–511** (tab bar starts at 512) | 1,906 → 1,621 | 210 → 197 |
| 390x844 DE | 4,002 → 3,329 | 4.7 → 3.9 | 350 → 284 | 560–604 → 489–533 | 1,762 → 1,320 | 192 → 132 |
| 430x932 DE | 3,938 → 3,286 | 4.2 → 3.5 | 350 → 284 | → 489–533 | 1,762 → 1,320 | 132 |
| 320 / 390 / 430 EN | 3,623 / 3,307 / 3,262 | 6.4 / 3.9 / 3.5 | 284 / 284 / 262 | 467 / 489 / 467 | | 197 / 132 / 132 |

At every phone size, in DE and EN: no horizontal overflow, no tap target under 44px in main, and the level chips run to the screen edge. Cold in this runner's wide fallback face (DejaVu, because Arial is missing): the 320 rail is at 362 and the start button at 544, which is behind the tab bar. See "Left over".

## Changes by critique issue

1. **Cut-off promises (high).** New `COURSE_PROMISES_SHORT` in course-hub-copy.ts: one clause of at most 45 characters per course, DE and EN, no ellipsis. The row shows it with `sm:hidden` and aria-hidden. The full promise uses `max-sm:sr-only`, and the clamp is now `line-clamp-2 sm:line-clamp-none`. Below 390px the next-course sheet also shows the short promise (`min-[390px]:hidden` / `max-[389px]:sr-only`), so its start button clears the tab bar at 320.
2. **Source line (high).** `[data-course-source]` gets `max-lg:hidden` when every row in the group has the same repository and commit (`sharedSource`). The Technikkurse group head then shows one `lg:hidden` 44px mono link, `interactive-courses #0e5dfd3`. It points to `github.com/Mavengence/interactive-courses/tree/<sha>`, and its accessible name is "interactive-courses #0e5dfd3: Quellcode aller Technikkurse (Mavengence/interactive-courses, Commit 0e5dfd3)". Rows from lg still have their own links. Technical rows at 390 went from 192px to 132px.
3. **First screen (high).** (a) `h2#learning-atlas-heading` is `max-sm:sr-only` and the header is `max-sm:border-t-0 max-sm:pt-0`; the rail's top margin is gone. (b) The kicker shows "Ohne Konto" / "No account" on phones (`openRecommendationShort`, aria-hidden), with the long label as `max-sm:sr-only`. (c) Below 430px the hero line reads "Unsicher? In fünf Minuten einordnen →" (`firstStepShort`). On phones that line is a flex row exactly the link's 44px high, giving a little back with `-mb-2` / `-mt-0.5`. I kept the number spelled out as "fünf" because of the house style and the page test. (d) The hero wrapper is `pb-6`. Also: the path grid is `mt-3` and the sheet title `mt-1` on phones. Result: at 320 the start button is fully visible (467–511), and at 390 the rail starts at 284.
4. **Level chips (medium).** The inner group gets `-mx-4 px-4 scroll-px-4 snap-x overscroll-x-contain sm:-mx-6 sm:px-6 sm:scroll-px-6 [&::-webkit-scrollbar]:hidden`, and each chip gets `snap-start`.
5. **"Hier nicht verfügbar" repeated (medium).** When all courses in a group share a non-open access state, the phone group caption says it once (`[data-group-access]`, `lg:hidden`, nowrap: "· hier nicht verfügbar" / "· Lernkonto nötig"), and the per-row caption leaves it out. The per-row word is now muted, not ink. The lg `dl` still shows it per row. `pathStartUnavailable` is now "{title} ist hier nicht verfügbar." / "{title} isn't available here." (one line at 390).
6. **Kosten und Konto (medium).** New `accessBodyShort` (two sentences) with `sm:hidden`. The long text is `max-sm:hidden`, so desktop is unchanged. It is 4 lines at 390.
7. **Duplicate path (medium).** `goal.summary` is `max-sm:hidden`, and the stepper is `mt-2`. I kept the Route block itself on phones (the optional hide-when-equal-to-group part is not done). It is the page's signature element, and hiding it only for the default goal would make the view jump when a chip is tapped.
8. **Loose links line (low).** The phone wrapper has `max-lg:-mt-1 max-lg:-mb-2`, and the li is `py-2.5 sm:py-5`.
9. **Focus order (low).** `{links}` is back before the action wrapper in the DOM. `[data-course-action]` has `max-lg:order-first`, so phones still show the action first and desktop tab order follows the visual order.
10. **Fallback font (low).** Not in my ownership. See "Left over".
11. **ai-native duration (low).** New `COURSE_DURATIONS_SHORT` ("ca. 5 bis 12 Std." / "about 5 to 12 hrs"; no en dash because of the copy lint). It is used below sm in the row caption, the path station and the sheet kicker.
12. **Docs (low).** Not in my ownership. See "Left over".

Extra bug found and fixed: from sm the demo link read "Praxisbeispielansehen". The whitespace node between flex items inside the inline-flex link was dropped. The label is now wrapped in one inline span.
Extra copy change: the English demo label is now "Applied example" / "N applied examples" instead of "See the applied example" at every width, so it fits next to "Course overview →" at 390.

## Tests
- vitest (src/app/kurse, catalog-surfaces-mobile, catalog-copy, discovery-record-copy): 110/111. The one failure is the demos assertion in catalog-surfaces-mobile, which comes from another agent's demos/page.tsx edit that is still in progress.
- learning-atlas.test.tsx: updated for the short promise, line-clamp-2, py-2.5, links-before-action DOM order plus `max-lg:order-first`, group access, group source (href and accessible name), the ai-native phone duration, the edge-to-edge level chips, the sr-only question and the new pathStartUnavailable copy.
- catalog-copy.test.ts: short promises (≤45 characters, no ellipsis, no dash) and accessBodyShort (≤2 sentences).
- catalog-surfaces-mobile.test.ts (kurse block): pb-6, the phone hero line, accessBodyShort pairing, order-first, the short/full promise pairing, and the h2 split.
- route-kurse-hub.spec.ts: new density bounds with about 15% headroom for the cold fallback face; the 320 start action must begin inside the first screen; phone rows hide the source and the group source link is 44px; the level chips end at the screen edge; a new 1280 test checks that all six row attributions are visible and the group link is hidden. 32/32 pass (route-kurse-hub + courses.spec, Chromium, against the dev server via pw.config.mts).
- eslint clean. tsc shows no errors in these files. content-lint shows no findings for these files.

## Left over (not my ownership)
- globals.css / layout.tsx: add `local("Roboto")` (with its own size-adjust) and `local("Helvetica Neue")` to "Loehrning Sans Fallback", and preload semibold. Cold in this runner, 320 still puts the start button behind the tab bar (544), and the "Unsicher?" line wraps.
- docs/experience-system.md, "Mobile Companion Shell", add a "/kurse below lg" paragraph: the goal chip row and the level chips run to the screen edge (snap, `-mx-4 px-4`); the goal question is sr-only below sm; each path station is one 44px line; the level filter is static at max-height 700px; rows show the short promise (≤45 characters), the facts caption and one links line with the action first; the source attribution and a shared access state print once in the group head below lg; targets are ≤4 screens at 390x844 and the 320 start button above the tab bar.
- design-direction.md §7.1: change "2x2 tabs" to "one-row chips to the screen edge".

Screenshots: mobile/kurse-mobile-polish/after/_kurse@{320,390,430,1440}-{fv,full}.png and _en_kurse@… (brand face), cold/ (fetch-warmed), crops/ (ledger groups at 390 DE and 320 EN), desk-1440-*.png. Scripts: shoot.mjs (COLD=1 skips the font forcing), crop.mjs, coldprobe.mjs, probe2.mjs, pw.config.mts.
