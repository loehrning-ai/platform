# B4 course landings, polish pass: change log

Date: 2026-09-26. Key: B4-course-landings (polish pass). Source: the design critique in scratchpad/impl/B4-course-landings-critique/.

Most critique items sit in files outside my ownership: the Data Science, Claude, Codex, DI and DEF landings, the lesson readers, the sidebars and the reader chrome. I did not edit those files in the repo. I made every one of those changes in an isolated copy of the package, tested them there, and exported them as ready-to-apply patches (see "Patches for the integrator"). The files inside my ownership are edited directly in the repo.

Note: commits 4b1a541, 400d1f6 and 901a511, made by another session, already contain most of my repo edits, because they committed the whole working tree. Only `technical-course-landing.tsx` and its test show as modified now.

## 1. Repo changes (my ownership)

| File | Change | Critique item |
|---|---|---|
| `src/components/course/course-landing-sections.tsx` | `CourseOutcomeList` picks its columns by item count through the new exported helper `courseOutcomeColumnsClass`: 2 columns for an even count, 3 columns from lg for a count divisible by 3, otherwise one 64ch column. No more hole at the bottom right with 3 items. `CourseBlockLedger` is one column on phones and shows the number in the caption ("01 · 3 Lektionen · 10 Min."); from sm the number moves to its own column. Exactly one number span is displayed at any width. | low: outcome grid; low: mobile ledger |
| `src/components/course/technical-course-landing.tsx` | Removed `[overflow-wrap:anywhere]` from the H1, lead, H2 and intro. `break-words` stays, and the H2 gets `min-w-0`. The kicker ties each "·" to the part before it with a no-break space, and `text-balance` stops "kostenlos" from being orphaned on a phone. New optional props: `figure` (a drawing under the facts, used by the DS rebuild) and `headingId` on `TechnicalCourseSectionHeading` (for `aria-labelledby`, used by the Claude patch). | medium: overflow-wrap; low: kicker |
| `src/components/course/lesson-reference.tsx` | The head (kicker, title, objective) now sits above the `<details>` inside the Kopflinie block (`data-lesson-reference-block`). The summary holds only the toggle, and its accessible name is "Lektionstext Einklappen" via an sr-only prefix. The toggle is top right from sm and in flow on phones. The title stays `role="heading"` rather than `<h1>`, because every reader passes its own hidden `<h1>` in `children`, and this keeps exactly one `<h1>` element in the DOM (the existing contract test). The content wrapper also hides the DS/DEF chapter `.hero-eyebrow` and `.hero-meta`, plus the hero border, padding and gradient rule. These use `!` because those stylesheets are unlayered. | low: heading in summary; low: duplicate DS headers |
| `src/components/course/use-lesson-reader-bar.ts` | Queries `details[data-lesson-reference]`. Without a checkpoint, "Aufgabe öffnen" now focuses the lesson title in the reference head, not the "Einklappen" toggle. | follows from the item above |
| `src/components/course/lesson-sidebar-classes.ts` | New shared recipe for numbered readers: `lessonSidebarLinkClass(active)` (tonal fill, 600 weight, 6px ink square via `before:`, no left rule) and `lessonSidebarIndexClass(active)` (12px, 600, tabular, ink or Schiefer, never Mennige or mono). Patch 01 uses it. | high: sidebar AA |
| `src/components/course-projects/lesson-mission-control.tsx` | The section uses `[overflow-wrap:break-word]`; the heading has `min-w-0`; tab labels use `hyphens-auto [overflow-wrap:break-word]`. The number chip is hidden below 420px unless it shows "OK", so "Festlegen" and "Revidieren" no longer split mid-word (checked at 390). | medium |
| `src/app/ai-native/page.tsx` | H1 is "Routinearbeit mit Claude automatisieren." (EN "Automate routine work with Claude."): 2 lines at 1440, 3 at 390. New lead names the audience and the capstone. Fact now reads "ca. 5 Std. Lesezeit, ca. 12 Std. mit Übungen". Outcome details are full sentences (Claude project with instructions, sample files and skills; Obsidian in module 3). The module caption that repeated the hero facts is removed. | medium: AI-Native |
| `src/app/ki-fuehrerschein/page.tsx`, `src/app/ki-und-gesellschaft/page.tsx`, `src/app/eu-ai-act-kurs/page.tsx` | Removed the Lehrplan captions that repeated the hero facts verbatim (along with the unused `curriculumCaption`, `total` and imports). The EU landing now addresses the reader as "Sie" (intro, and "Was Sie danach können"). CONTENT_GUIDE.md l.6 and slop-language 3.6 require Sie for the EU AI Act course, and all EU lessons use Sie. The task text says "du-form" generally; I followed the repo rule for this one course. | low: Lehrplan notes |

## 2. Tests (repo)

- Updated: `lesson-reference.test.tsx` (block structure, summary name, hidden chapter chrome, still one h1), `lesson-mission-control.test.tsx` (break-word, hyphens, chip hidden under 420px), `technical-course-landing.test.tsx` (`headingId`, `figure`), `use-lesson-reader-bar.test.tsx` (new: title focus without a checkpoint).
- New: `src/components/course/lesson-sidebar-classes.test.ts` (44px rows, focus, no orange rail, mono or Mennige numbers).
- e2e (not run, they need a build): `tests/e2e/learning-density.spec.ts`. The first child of the reader is now `[data-lesson-reference-block]`, and `details[data-lesson-reference]` is unchanged. `tests/e2e/route-ai-native-locales.spec.ts` has the new H1.

## 3. Checks

- vitest (repo): src/components/course, course-projects, the four native routes, src/app/kurse/open-source, data-science, imported-courses, codex, eu-ai-act-course. 125 files and 883 tests pass.
- eslint is clean on all my files. `tsc -p tsconfig.typecheck.json` is clean for the whole repo (0 errors).
- `bun run content:lint`: 0 errors, and the warnings are identical to before (448).
- Screenshots and DOM/axe audits (1440, 1024, 390) are in `impl/B4-course-landings-polish/v2/` (repo on :3000) and `v2/crops/`:
  - Native landings: axe 0 violations at 1440 and 390, no horizontal overflow, H1 700 at -0.012em.
  - EU "Was du danach kannst" now shows 3 columns.
  - KF ledger on a phone: title, "01 · 3 Lektionen · 10 Min.", then the description at full width.
- Not run: e2e, Lighthouse and build, which are not allowed.

## 4. Patches for the integrator (out-of-ownership critique items)

Location: `scratchpad/impl/B4-course-landings-polish/patches/`.

- Each patch is a git diff against the current HEAD, and `git apply --check` passes for every one and for `all.patch`.
- The patches depend on the kit changes in section 1, which are already in the repo.
- To apply, run from the repo root: `git apply <patch>`.
- The tested sources are in `impl/B4-course-landings-polish/overlay/`, a copy of the package with the patches applied. The generator is `make-patches.py`.

| Patch | Files | What it does | Critique item |
|---|---|---|---|
| `01-reader-sidebars` | ds-chapter-sidebar (+test), def-chapter-sidebar, claude-lesson-sidebar, codex-lesson-sidebar, ai-native-operator/lesson-sidebar, data-infra-lesson-sidebar | All six rails use the shared recipe: no `border-l-2`, no Mennige wash or number; ink square, 600 weight and tonal fill for the current row; sentence-case group labels; `text-pass` check icon. The DS/DEF overview row no longer prints the "—"/"-" placeholder. Result: axe 0 on /kurse/open-source/data-science/clean, where it previously reported 4.4:1 color-contrast. | high |
| `02-claude-landing-widgets` | hero-orrery, hero-transform (+hero-demos.test), claude/page.tsx, claude/kurs/page.tsx | Widgets now have no offset shadows or `border-2` frames, and no box inside the frame. Labels are sentence case; score, bar and stepper are square and in ink; the toggle marker is an ink square. Actions are ink buttons with no arrow; the page's single Mennige button is the hero CTA. Transform opens on stage 3 with its answer rendered (final state first). Scrolling `pre` elements are focusable, fixing axe `scrollable-region-focusable` (serious). Widget titles are h3. The section head uses the kit Kopflinie (`headingId`). The ledger shows "01" (sr-only "Lektion"), hairlines, and a `text-body` title. Headings are now "Lehrplan" and "Lektionen des Claude-Kurses". | high + medium |
| `03-technical-ledgers-and-copy` | codex, data-infrastructure and DEF page.tsx; codex, DI and DEF course-copy; codex DE lessons l01, l07, l09, l10 | Same ledger recipe on the Codex, DI and DEF landings, with section head "Lehrplan"/"Course plan" and no caption. Codex kicker is "Technischer Codex-Kurs", matching Claude, and facts are in sentence case. The index H1 is "Lektionen des Codex-Kurses". DE hooks are rewritten as critiqued. Removes 6 VOICE-RHYTHM/SHAPE warnings and adds none. | medium |
| `04-lesson-readers` | claude-lesson-reader, codex-lesson-reader, codex-blocks, widgets/tier-a/_frame (+test), course-project-studio (+test), lesson-mission-frame, retrieval-queue, engines/engine-ui (+test) | No black band with peach mono caps, no `font-black` or -0.08em tracking. The Werkstatt button is ink with no shadow or translate. Callouts follow recipe 6.12, with no left bar. There is no box in box inside the studio; the current stage is marked with `bg-card-hover` and a 3px ink underline. WidgetFrame has a Kopflinie and a sentence-case kind label, which is skipped when it repeats the title. Reader takeaways use the hairline note. The next-lesson link is an ink button. The queue and engine chrome are restyled the same way (dashed pending badge, `text-pass` verified). `werk/cx` is used wherever `text-label` meets a colour class. | high |
| `05-mobile-reader-chrome` | learning-owner-panel, reader-focus-bar | The banner is `bg-inset` with a hairline, and "Lokal weiterlernen" is a secondary ink-outline button in sentence case. The bottom bar action is an ink button and the position is `text-label`. This also affects the book reader, which uses the same bar. | medium |
| `06-course-copy` | lib/course/data.ts, content/ai-native/modules.json (DE+EN), lib/courses/catalog.ts, catalog-copy.ts | KF Lehrplan rows are rewritten as critiqued, removing the em dash and count-first fragments. EU rows are full sentences in **Sie** form (CONTENT_GUIDE); the critique's "Du ordnest …" would break the course's address form. AI-Native modules 1 and 2 descriptions are rewritten, with EN mirrors. The catalog duration matches the landing ("ca. 5 Std. Lesezeit, ca. 12 Std. mit Übungen" / "about 5 hrs of reading, about 12 hrs with exercises"). | medium |
| `07-data-science-landing` | new chapters/overview-page.tsx; ch-overview.tsx and de/ch-overview.tsx now hold only copy; data-science/page.tsx; ds-v8-scope.css; server-boundary, smoke and localized-core-content tests; e2e route-data-science and technical-course-landings | Full rebuild per blueprint 7.4 on the kit (details below). | high + medium |

Details for `07-data-science-landing`:
- Hero: kicker "Kurs · Data Science Fundamentals · Version 8", H1 "Aus Daten Entscheidungen ableiten." / "Turn data into decisions.", one Mennige "Kapitel 1 beginnen", and the facts "12 Kapitel · 22 Simulationen · ca. 2 Std.".
- Working-cycle drawing (static, server-rendered): 6 square ink stations, the first in Mennige ("Hier beginnst du"), a dashed return with a legend line.
- Sections: CourseOutcomeList (6 items, no glyphs); Swiss-grid Lehrplan (`gap-px bg-hairline`, number, h3, caption, blurb, "Kapitel öffnen →"); hairline tools list with names in mono.
- The landing no longer loads `LazyFlowingPipeline`. The component and its tests are left in place, now unused on this page.
- EN chapter links now carry `/en`; before, they pointed at German routes.
- The "Nächstes Kapitel" button became a text link.
- `.sim-stats .k` stat labels are sentence case and wrap and hyphenate instead of being cut or split.

Verification of the patches (in the isolated copy):
- vitest over src/components (course, course-projects, data-science, DEF, imported-courses, codex, operator, DI, widgets, learning, progress, book-reader), src/app (kurse, ai-native, the native routes) and src/lib: 5,723 tests pass.
  - 7 tests fail only because the copy lacks repo-root files (README.md, LICENSE policy, migrations, workshop public files). The same 6 files pass in the real repo.
- tsc: 0 errors for sources and e2e specs; no errors in the touched test files under tsconfig.tests.json.
- eslint is clean on all patched files.
- content-lint: 0 errors, and 6 fewer warnings.
- Screenshots and axe from a webpack dev server of the copy, on port 3108 (now stopped), are in `v2/overlay/` and `v2/overlay/crops/`.
  - DS landing, Claude landing and Codex landing: axe 0 at 1440 and 390, no overflow, one Mennige fill per page.
  - DS clean chapter: axe 0 (was 1 serious).
  - Claude and Codex lessons: axe 0.

## 5. Left for the integrator or a later pass

1. Apply the patches, then run the e2e specs I touched or that the patches touch:
   - learning-density, route-ai-native-locales, route-data-science, technical-course-landings
   - plus route-claude*, route-codex*, route-data-infrastructure*, route-data-engineering-fundamentals*, route-ai-native-operator and mission-feedback, which use the reader and sidebars
   - plus a11y and reader-focus-mode.
2. Critique issue 12, lesson order on checkpoint pages. The studio mounts mission control inside itself, and learning-density requires the mission in the first viewport. Moving `CourseProjectStudio` below the lesson text means splitting mission control out of the studio. I did not do that.
3. Still in the old look, and not named in the critique:
   - The four project engines (prompt-lab, repo-lab, case-lab, data-lab: about 60 hits), including dark "terminal" panels. These only show after "Werkstatt öffnen". They need a decision on whether terminal output stays graphit.
   - DS chapter internals: `03.1` mono section eyebrows, 400-weight serif H2s, rounded `.panel` and colour-coded simulator buttons.
   - Orange quiz option letters A–D in the tier-a quiz.
4. Copy not covered by the patches:
   - Claude lesson subtitles such as "Ein mentales Modell, das unter Druck hält.".
   - The EN Codex hooks ("Agent, not assistant.", "The diff and logs are evidence, not approval."). These are canonical keys, and `types.test.ts` pins the l01 hook.
   - The KF H1 "KI im Alltag: Was du wissen solltest." is the course title and has a colon reveal.
5. The KF H1 on phones reads "KI im Alltag: / Was du / wissen solltest." because of the inline-block accent. That is acceptable, but "Was du wissen / solltest." would read better. It is my file, left as is to avoid touching the title markup again.
6. The shared dev server on :3000 served all `/kurse/open-source/*` routes with status 200 during this pass, so no restart was needed.
