# B4 course landings: change log

## Files changed
- src/components/course/technical-course-landing.tsx: paper hero (Kicker, ink H1 text-fluid-h1, lead, actions), facts aside under a 2px Kopflinie as a hairline list, progress without a box; section heading = Kopflinie + h2, eyebrow optional and shown as right caption; "§ " stripped from labels. PRIMARY class keeps `bg-brand-orange` (tests find it) with text-paper, hover kupfer-dark, sentence case; SECONDARY = square ink outline; LEDGER link = hairline row with tonal hover.
- src/components/course/course-landing-sections.tsx (new): CourseLandingSection, CourseOutcomeList (two-column hairline outcomes), CourseBlockLedger (ledger rows 6.6), CourseBoundaryDetails/Column/NoteList, CourseNextLink (werk text ButtonLink), formatCourseMinutes.
- src/app/{ki-fuehrerschein,eu-ai-act-kurs,ki-und-gesellschaft,ai-native}/page.tsx: rebuilt on the section kit. Copy: removed "§" eyebrows and "Lernpfad Stufe N"; "Drei Entscheidungen ...", "Sechs Blöcke, eine ...", "Neun Lektionen ...", "Vier Projekte, ein kontrollierter Ablauf.", "Prüfen, simulieren, nachschlagen." replaced by "Was du danach kannst" / "Lehrplan" / "Für wen" / "Module" / "Außerdem im Kurs"; intros rewritten in du-form with concrete tasks; en dashes in "Blöcke 1–2" removed; facts as plain strings; AI-Native H1 now "Aufgaben für Claude beschreiben und wiederkehrende Arbeit automatisieren." (EN "Describe tasks for Claude and automate recurring work."); module disclosure "Entscheidungen und Übungen" -> "Themen im Modul"/"Topics in this module". All pinned facts (Article 4 text, disclaimers, CTA labels/hrefs, block titles) unchanged.
- src/components/course/lesson-shell.tsx: hairline sidebar/toolbar/drawer, sentence-case labels, no orange stage rule, menu button ink outline (was white on Mennige).
- src/components/course/lesson-reference.tsx: **lesson now renders open by default** (`<details open>`), Kopflinie top, kicker "Lektion"/"Lesson", title text-fluid-h2, toggle "Einklappen/Aufklappen" with square +/− marker. Reason: in 8 of 10 readers non-checkpoint pages showed only a closed box; the lesson is the page. Native details keeps no-JS, keyboard, crawl; a reader can still fold it. In-place lesson switch resets to open.
- src/components/course/kurs/*: certificate (ink-framed preview, no acid wash, Mennige download button with paper text), verification (ink frame, pass word+icon, no nested box), completion + assessment CTAs (Kopflinie sections, ink buttons since the page Mennige is used elsewhere), quiz pages (ink next/retry, Mennige only on "download record", feedback boxes with pass/destructive border instead of left bars, ink progress), lesson-sidebar (active = tonal fill + ink square marker + 600, no orange left bar), block header, lesson-content, section-reader takeaway (note callout), markdown blockquotes (hairline rule), copy button (cx, sentence case).
- src/components/course/{lesson-demo-links,lesson-proof-checkpoint,open-with-your-ai,pathway-stage-banner,technical-course-progress}.tsx: kickers, hairlines, ink progress fills, no sky/teal/mist washes, ink submit.
- src/components/course-projects/lesson-mission-control.tsx: offset shadow removed, dark header bar -> paper header under Kopflinie, mono caps -> text-label, font-black -> bold, border-2 -> border, left-bar callouts -> bordered notes, pill steppers -> squares, hover translate removed, Mennige buttons -> ink. `cn` aliased to werk `cx` so text-label survives colour merges.
- src/components/course-projects/course-workspace-frame.tsx: 7px offset shadow removed, 1px ink frame, sentence-case toolbar buttons.

## Tests updated
- technical-course-landing.test.tsx (new look + § stripping), lesson-shell.test.tsx, lesson-reference.test.tsx (open default), kurs/lesson-layout.test.tsx (switch resets to open), eu-ai-act-kurs/page.test.tsx ("24 lessons"), ai-native/course-routes.locale.test.tsx (renders DOM to read summaries; new label), src/lib/__tests__/eu-ai-act-course.test.ts (new outcome wording).
- e2e: route-ki-fuehrerschein ("Lehrplan"), route-eu-ai-act-kurs (CURRICULUM_HEADING "Lehrplan"), route-ai-native-locales (new H1), learning-density (reference now open; this file was also edited by another agent, my change is only in the two reference tests), route-{codex,codex-locales,claude,claude-responsive,data-infrastructure,data-infrastructure-locales,data-engineering-fundamentals(+responsive),data-science(+responsive),ai-native-operator}.spec.ts helpers now assert open instead of click-to-open.
- technical-course-landings.design.test.ts needed no change (bans rounded/shadow still hold).

## Checks
- vitest: src/components/course, course-projects, the four native routes, foundation-course-entry, kurse/open-source, codex/imported-courses/data-*/ai-native*, src/lib: 411 files pass.
- eslint clean on my files; tsc: no errors in my files.
- Not run: e2e, axe, Lighthouse (need build).
- Screenshots: impl/B4-course-landings/*-{desktop,mobile}.png, no horizontal overflow at 1440 or 390.

## Left for the integrator
- Open-source landing page files (claude/codex/data-infrastructure/DEF/operator page.tsx and their course-copy) still render mono-uppercase orange "LEKTION 1"/track labels inline and "Schritt"/aphorism copy; the kit restyles their frame only.
- Claude landing hero widgets (components/imported-courses/claude/hero-*) keep offset shadows and pastel fills; course-project-studio, retrieval-queue and engines still carry dark bars / mono caps (course-project-studio.test pins text-[#ffc6aa]).
- KF block descriptions in src/lib/course/data.ts contain an em dash ("täglich nutzt — und warum").
- AI-Native fact "12 h" comes from course meta (lessons sum to about 5 h).
- Quiz option letters and certificate dates stay mono (data).
