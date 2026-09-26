# Course surfaces of loehrning.ai: component map, restyle leverage, copy audit

Date: 2026-09-26. Scope: `/kurse` hub, `src/lib/courses/*`, the 4 native German courses and the 6 technical courses under `/kurse/open-source/*`. Everything is read-only; no repo file was touched. All paths are relative to `packages/website/` unless absolute.

Screenshots (1440x900 viewport, full page) are in
`/tmp/claude-0/-home-user-platform/614e303c-f8f0-55ca-be18-13442a9af90b/scratchpad/course-audit/`:

| File | What it shows |
|---|---|
| `kurse-hub.png` | `/kurse` hub (DE) |
| `data-science-landing.png` | DS landing (the overview chapter inside the reader shell) |
| `data-science-chapter.png` | DS chapter `/model` as it loads: **only a collapsed "Lektionsreferenz" box** |
| `data-science-chapter-opened.png` | same chapter with the reference `<details>` forced open |
| `claude-landing.png` | Claude landing |
| `claude-lesson.png` | Claude lesson `mental-model` as it loads (mission control + project studio; lesson text collapsed at the bottom) |
| `claude-lesson-opened.png` | same, with the reference opened |
| `ki-fuehrerschein-landing.png` | KI-Führerschein landing (reader is auth-gated; locally it redirects to `/login?reason=auth-not-configured`) |
| `ki-fuehrerschein-reader.png` | the login redirect |
| `landing-{ki-und-gesellschaft,eu-ai-act-kurs,ai-native,codex,data-infrastructure,data-engineering-fundamentals,ai-native-operator}.png` | remaining landings |
| `def-chapter-opened.png`, `codex-lesson-opened.png` | two more readers for comparison |
| `landing-text-dump.txt` | rendered `<main>` text of all 10 landings + EN hub/claude/KF, used for the copy audit |

---

## 1. TL;DR

1. **The courses share far more than they look like they do.** One landing kit (`src/components/course/technical-course-landing.tsx`, 153 lines) renders 9 of 10 course landings. One reader chrome (`src/components/course/lesson-shell.tsx`, 515 lines) wraps all 10 readers. One project/mission panel (`src/components/course-projects/*`, 9,096 lines) sits on top of every lesson in all 10 readers. One set of quiz, certificate and verification pages (`src/components/course/kurs/*`) serves all 10 courses. Restyling about 12 files changes about 90% of course pixels.
2. **The brutalist look is not driven by the `shadow-tile` token (unused in course code).** It comes from four inline habits repeated everywhere: mono-uppercase eyebrows (448 class literals in 218 variants in course surfaces), `border-foreground` / `border-2 border-foreground` frames, `border-t-[3px] border-brand-orange` top rules and `bg-kupfer-mist` fills, plus hard offset shadows `shadow-[Npx_Npx_0_0_var(--color-foreground)]` in course-projects, widgets and AI-Native demos. The pastel risograph washes (`bg-brand-acid/sky/pink/peach`) live mainly in the `/kurse` ledger rows (`ROW_TONES` / `PLATE_TONES` in `src/app/kurse/course-ledger-row.tsx:43-66`) and on home, workshops and books, not inside courses.
3. **Biggest UX problem found: in 8 of 10 readers the lesson itself is collapsed by default.** `LessonReference` (`src/components/course/lesson-reference.tsx`) is a closed `<details>`. On non-checkpoint chapters (DS `/model`, see `data-science-chapter.png`) the page shows just a single box labelled "Lektionsreferenz · Referenz öffnen". On checkpoint lessons (Claude, Codex) the page opens with a dark "Lektionsmission · Signalstrecke · Grenzenlinse" panel, an "Angewandtes Kursprojekt / Projektwerkstatt / Bereit zur Aktivierung" panel and an "Abrufwarteschlange" before the collapsed lesson text. Down-to-earth fix: lesson text first and open, the project panel second and lighter, the jargon renamed.
4. **Data Science v8 (`ds-v8-scope.css`) is already the least brutalist, most "state of the art" surface.** It uses soft cards, an italic serif accent, colour-coded chapter cards and a clean sidebar. It is a good internal reference for the new direction. The DEF chapter CSS (`de-course.css`, **12,772 lines**) is the most expensive island to restyle.
5. **Copy is past the word-level slop linter** (80 phrase rules in `scripts/content-voice-rules.mjs` already ban "umfassend", "ganzheitlich", "delve", etc.). What still reads as AI slop is **structural**:
   - headings that count the structure ("Vier Tracks. Zwölf Lektionen. Ein Abschlussfall.", about 9 on 10 landings);
   - rule-of-three ("Drei Entscheidungen …" on 3 of 4 native landings);
   - aphorism subtitles ("Agent statt Assistent.");
   - abstract nouns ("prüf*" 52 times across 10 landings, "Nachweis" 11, "begrenzt/abgegrenzt" 11, "kontrolliert" 7, "belastbar" 6);
   - "§" eyebrows;
   - invented UI jargon in course-projects.
6. **"Too broad, partly not useful" is justified for 4 courses:**
   - AI-Native Arbeitskurs: Claude setup, Obsidian, n8n, LM Studio and an EU AI Act lesson in one course. It claims 12 h, but its modules add up to about 5 h.
   - The AI-Native Operator: 39 lessons from engineering to compensation and org design, for "Fach- und Führungskräfte".
   - EU AI Act: 24 lessons including GPAI systemic risk, AI Office and sandboxes for a Mittelstand audience. The lesson text is also in **Sie-form** while the rest of the site uses du.
   - Data Infrastructure vs Data Engineering Fundamentals: roughly 6 of 12 topics overlap.

   KI-Führerschein, KI und Gesellschaft, Codex and Data Science are concrete at lesson level; their landings are just written too abstractly.

---

## 2. Component map

### 2.1 Route and component chains per course

The EN mirror (`src/app/en/**`) holds 2-4-line re-exports generated by `scripts/generate-english-route-mirror.mjs`. It has no own styling; locale is resolved per request and copy lives in de/en objects.

| Course (slug) | Landing route → components | Reader route → components | Quiz / cert / verify | Landing copy lives in |
|---|---|---|---|---|
| **KI-Führerschein** (`ki-fuehrerschein`) | `src/app/ki-fuehrerschein/page.tsx` (408) → `TechnicalCourseFrame/Header/SectionHeading` + `TechnicalCourseProgressBar` | Course hub `kurs/page.tsx` → `kurs/kurs-content.tsx` (609, client, framer-motion) in `kurs/layout.tsx` (108). Block: `kurs/[blockId]/page.tsx` → `components/course/kurs/block-page-shell.tsx` → `LessonLayout` → `LessonShell` + `LessonSidebar` + `LessonContent` → `SectionReader` → `MarkdownRenderer` + `LessonSectionCheckpoint`; plus `CourseProjectStudio`, `LessonReference`, `OpenWithYourAiRegion`. **Auth-gated.** | `kurs/quiz` → `WorkshopQuizPage`; `kurs/zertifikat` → `CertificatePage`; `verifizierung` → `VerificationPage` | inline `LANDING_COPY` in page.tsx; blocks in `src/lib/course/data.ts:128-160`; lessons in `content/ki-fuehrerschein/*.json` |
| **KI und Gesellschaft** | `src/app/ki-und-gesellschaft/page.tsx` (457), same kit | same chain, `kurs/kurs-content.tsx` (597) | same three | inline + `data.ts:360-380` + `content/ki-und-gesellschaft/*.json` |
| **EU AI Act Kurs** | `src/app/eu-ai-act-kurs/page.tsx` (449), same kit | same chain, `kurs/kurs-content.tsx` (607) | same three | inline + `data.ts:222-260` + `content/eu-ai-act-kurs/*.json` |
| **AI-Native Arbeitskurs** (`ai-native`) | `src/app/ai-native/page.tsx` (426), same kit; sub-hubs `capstone-gallery`, `demos`, `glossar`, `fluency-test` (partly the kit too) | `kurs/page.tsx` (114), `kurs/[moduleId]/page.tsx` (238), `kurs/[moduleId]/[lessonId]/page.tsx` (233) → `components/ai-native/kurs/lesson-page-shell` (`LessonShell`) → `lesson-reader.tsx` (uses `LessonQuiz`, `LessonProofCheckpoint`) + `CourseProjectStudio` + `LessonReference` | same three | inline + `content/ai-native/{course,modules,modul-N-lessons}.json` |
| **Claude Course** (`claude`) | `src/app/kurse/open-source/claude/page.tsx` (242), kit + `HeroOrrery` + `HeroTransform` | `kurs/page.tsx` (126, `CourseAssessmentCta`); `kurs/[lessonId]` → `components/imported-courses/claude/claude-lesson-page.tsx` → `LessonShell` + `ClaudeLessonSidebar` + `ClaudeLessonReader` (`LessonProofCheckpoint`) + `CourseProjectStudio` + `LessonReference`; widgets in `components/widgets/claude/*` | quiz + cert + verify | inline `LANDING_COPY`; lessons in `src/lib/claude-course/lessons/*.ts` |
| **Codex-Kurs** | `.../codex/page.tsx` (192), kit | `kurs/page.tsx` (111, `CompletionCertificateCta`); lesson → `components/codex/codex-lesson-page.tsx` → `LessonShell` + `codex-lesson-reader` + `CourseProjectStudio` + `LessonReference` | cert + verify (**no quiz**) | `src/lib/codex/course-copy.ts`; lessons `src/lib/codex/lessons/*` |
| **Data Infrastructure** | `.../data-infrastructure/page.tsx` (214), kit + `TechnicalCourseTrackProgress` | `kurs/[lessonId]` → `components/data-infrastructure/data-infra-lesson-page.tsx` (same pattern) | cert + verify | `src/lib/data-infrastructure/course-copy.ts` + `landing-manifest.ts` |
| **Data Engineering Fundamentals** | `.../data-engineering-fundamentals/page.tsx` (233), kit | `[chapterId]/layout.tsx` → `def-chapter-layout-client.tsx` (`LessonShell`, `DefChapterSidebar`, `CourseProjectStudio`, `LessonReference`); page → chapter TSX + `ChapterTransferCheckpoint`; **styled by `de-course.css` (12,772 lines)** | cert + verify | `src/lib/data-engineering-fundamentals/course-copy.ts` |
| **Data Science Fundamentals** | `.../data-science/page.tsx` (139) + `landing-reader-shell.tsx` (108). **Not the kit:** the landing is the overview chapter inside `LessonShell` with `ds-v8-scope.css` (3,115 lines) | `[chapterSlug]/layout.tsx` → `ds-chapter-layout-client` → `components/data-science/reader-shell.tsx` (`LessonShell`, `DsChapterSidebar`, `CourseProjectStudio`, `LessonReference`); page → chapter TSX + `ChapterTransferCheckpoint` | cert + verify | `src/lib/data-science/course-copy.ts`; overview text in `components/data-science/chapters/{de,en}/ch-overview.tsx` |
| **The AI-Native Operator** | `.../ai-native-operator/page.tsx` (225), kit + `TechnicalCourseProgressBar` + `CourseAssessmentCta` | `[moduleId]/page.tsx` (186); `[moduleId]/[lessonNum]` → `components/ai-native-operator/lesson-page.tsx` → `LessonShell` + `lesson-reader` (`PathwayStageBanner`, `LessonProofCheckpoint`) + `CourseProjectStudio` + `LessonReference` | quiz + cert + verify | `src/lib/ai-native-operator/course-copy.ts`; modules `src/lib/ai-native-operator/modules/*.ts` |

**Hub `/kurse`:**
- `src/app/kurse/page.tsx` (130) renders the title band and a `details` "§ Warum kostenlos" box (`border-t-[3px] bg-kupfer-mist`).
- `learning-atlas.tsx` (694, client) holds the goal picker, the path stepper, the "Nächster Nachweis" card with its offset stack and the ledger groups.
- `course-ledger-row.tsx` (386) renders each row: pastel wash, number box, mono eyebrow, duration box and CTA.
- Data comes from `src/lib/courses/{catalog.ts (DE), catalog-copy.ts (EN), goals.ts, tracks.ts, course-hub-copy.ts, course-gallery-copy.ts}`.

**Catalog copy is re-used by 25 consumers.** Changing `tagline` / `description` / `audience` propagates to:
- home (`components/home/offering.tsx`, `continue-courses.ts`) and `/hilfe`;
- `/konto` (catalog, statistics);
- `llms.txt`, `api/knowledge-graph.json`, `lib/seo/course-discovery.ts` (JSON-LD);
- `lib/mcp/*` (MCP tools/resources) and `lib/ki-check/recommend.ts`.

### 2.2 Shared vs bespoke (non-test files / lines)

| Course | app routes | course-specific components | course lib | content JSON | Notes |
|---|---|---|---|---|---|
| ki-fuehrerschein | 13 / 1,467 | 0 | (shared `lib/course`) | 14 / 5,193 | `kurs-content.tsx` is 609 of those lines |
| ki-und-gesellschaft | 14 / 1,624 | 0 | shared | 8 / 3,208 | `kurs-content.tsx` 597 |
| eu-ai-act-kurs | 13 / 1,509 | 0 | shared | 16 / 8,322 | `kurs-content.tsx` 607 |
| ai-native | 20 / 1,902 | 33 / 11,713 (incl. demos) | 7 / 1,460 | 18 / 10,081 | |
| claude | 11 / 675 | 19 / 3,288 (imported-courses/claude + widgets/claude) | 17 / 2,714 | 14 / 2,811 | |
| codex | 9 / 566 | 17 / 3,325 | 31 / 7,040 | – | lessons in TS |
| data-infrastructure | 9 / 603 | 21 / 5,422 | 31 / 6,386 | – | lessons in TS |
| data-engineering-fundamentals | 13 / 674 | 49 / 22,867 | 7 / 1,043 | – | incl. `de-course.css` 12,772 |
| data-science | 12 / 542 | 74 / 20,025 | 13 / 1,259 | – | incl. `ds-v8-scope.css` 3,115 |
| ai-native-operator | 15 / 764 | 6 / 752 | 24 / 6,172 | 1 / 332 | modules in TS |

**Shared layers:**
- `components/course` 27 / 6,148
- `components/course-projects` 12 / 9,096
- `lib/course-projects` 17 / 5,349
- `lib/course` 10 / 2,590
- `lib/courses` 11 / 2,734
- `lib/technical-courses` 2 / 980
- `/kurse` hub 3 / 1,210
- `components/widgets` 39 / 7,307

**Duplication to fix before restyling.** The three native `kurs/kurs-content.tsx` files are about 80% identical: `diff` after slug normalisation leaves only 117-145 changed lines of about 600. The same holds for `kurs/layout.tsx` and the `[blockId]` / quiz / cert / verify stubs. Folding them into one `FoundationCourseHub` component avoids restyling the same thing three times.

**Consumers of shared primitives** (from grep):
- `LessonShell`: all 10 readers (via `lesson-layout`, `ai-native/kurs/lesson-page-shell`, codex, operator, DEF, DS ×2, claude, data-infra).
- `LessonReference`: 8 readers.
- `CourseProjectStudio`: all 10 readers.
- `CertificatePage` / `VerificationPage`: 10 courses.
- `WorkshopQuizPage`: 6 courses (KF, KuG, EU, AI-Native, Claude, Operator).
- `LessonProofCheckpoint`: 5 readers.
- `ChapterTransferCheckpoint`: DEF, DS.
- `TechnicalCourse*` kit: 9 landings + `ai-native/capstone-gallery`, `components/ai-native/demos-gallery-view.tsx`, `glossary-view.tsx`.
- `BrandButton` (`components/ui/brand-button.tsx`, "intentionally softer than the remaining brutalist frames"): **not used by any course surface**. CTAs are inlined or use the three exported `TECHNICAL_COURSE_*_CLASS` constants.

---

## 3. Where the brutalist / risograph styling lives

### 3.1 Tokens (`src/app/globals.css`, `@theme` block at lines 49-135)

- `--color-brand-acid #ddf45a`, `--color-brand-sky #a9ddfc`, `--color-brand-pink #ffb8c8`, `--color-brand-peach #ffb38a` (lines 82-85): risograph pastels, commented "Berlin risograph palette".
- `--color-kupfer-mist #f5e8e2` (line 93): the pinkish fill behind facts boxes, selected goals and next-proof cards.
- `--shadow-tile: 4px 4px 0 rgba(25,35,45,.92)` (line 117): **zero consumers** in `src/` besides its definition; the hard shadows are all arbitrary `shadow-[…]` values.
- `--color-border #827970` (line 76): a dark 3.45:1 hairline used for every layout divider. This is a large part of why everything looks boxed; a separate softer divider token would calm every page at once.
- **No radius tokens exist**, and several design tests forbid `rounded` (see 5.3).
- `.berlin-grain` paper-grain overlay (lines 304-316): home hero only.

### 3.2 Pattern counts per course directory (grep over .tsx/.ts/.css)

| dir | `shadow-[` | acid | pink | sky | peach | kupfer-mist | `border-t-[3px]` | `border-2 border-foreground` | mono+uppercase | `"§ "` |
|---|---|---|---|---|---|---|---|---|---|---|
| src/app/kurse | 0 | 2 | 2 | 2 | 2 | 12 | 3 | 10 | 37 | 0 |
| src/app/ki-fuehrerschein | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 7 | 8 |
| src/app/ki-und-gesellschaft | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 6 | 8 |
| src/app/eu-ai-act-kurs | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 7 | 10 |
| src/app/ai-native | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 18 | 0 |
| src/components/course | 0 | 2 | 0 | 1 | 0 | 2 | 2 | 13 | 31 | 0 |
| src/components/course-projects | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 51 | 91 | 0 |
| src/components/ai-native | 29 | 0 | 0 | 0 | 0 | 7 | 15 | 20 | 137 | 2 |
| src/components/widgets | 40 | 0 | 0 | 0 | 0 | 0 | 0 | 20 | 73 | 0 |
| src/components/data-infrastructure | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 47 | 0 |
| src/components/codex | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 34 | 0 |
| src/components/imported-courses | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 12 | 0 |
| src/components/ai-native-operator | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 9 | 0 |
| src/components/data-engineering-fundamentals | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 3 | 3 | 0 |
| src/components/data-science | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 3 | 0 |

(DEF and DS style themselves in scoped CSS, so Tailwind counts there are low. Their look is set in `de-course.css` / `ds-v8-scope.css`.)

**Hard offset shadows** (`shadow-[3|4|5|6|7px_…_0_0_var(--color-foreground)]`, 70+ uses) are concentrated in:
- `components/ai-native/demos/*` (excel 5, logistics 4, workflow/word/maturity/doc/agent 2 each);
- `components/widgets/{tier-a,claude,practice}/*` and `widgets/interactive-diagram.tsx`;
- `components/imported-courses/claude/hero-*`;
- `components/course-projects/course-workspace-frame.tsx:663` (`shadow-[7px_7px_0_0_var(--color-foreground)]`) and `lesson-mission-control.tsx:1025` (`shadow-[5px_5px_0_0_var(--color-brand-orange)]`).

**Offset "stacked card"** (a sibling span translated 2px/2px): `src/app/kurse/learning-atlas.tsx:507-515` (next-proof card). The same trick appears on workshops, books, about and open-source pages.

**Pastel washes** in course surfaces: `src/app/kurse/course-ledger-row.tsx:43-66` (`ROW_TONES` at 10%, `PLATE_TONES` at 40-45% on phone), applied at line 172ff. Elsewhere they cluster on `components/home/*`, `app/workshops/workshops-content.tsx` (13), `app/buecher/*` (12+3) and `app/ueber-mich` (10).

**Mono-uppercase eyebrows.** There are 448 static `className` literals with `font-mono … uppercase` in course surfaces (not counting `cn()` fragments), in **218 unique variants**:
- tracking values: `[0.14em]` ×123, `[0.12em]` ×72, `[0.1em]` ×57, `wide` ×50, `[0.16em]` ×48, `[0.08em]` ×37, `[0.06em]` ×24, …
- weights: `font-bold` 313, `font-black` 66.

No shared `Eyebrow` component exists, so a token change alone cannot fix this. It needs one utility (for example `@utility kicker`) plus a regex codemod over these literals.

**Densest shared files** (mono-uppercase + frame/shadow/mist signals):

| Signals | File |
|---|---|
| 36 | `components/course-projects/lesson-mission-control.tsx` |
| 31 | `components/course-projects/engines/prompt-lab.tsx` |
| 25 | `components/ai-native/kurs/lesson-reader.tsx` |
| 22 | `components/course-projects/course-project-studio.tsx` |
| 13 | `course-projects/engines/repo-lab.tsx` |
| 11 | `course-projects/retrieval-queue.tsx` |
| 11 | `course-projects/engines/engine-ui.tsx` |
| 10 | `course-projects/engines/case-lab.tsx` |
| 9 | `course-projects/course-workspace-frame.tsx` |
| 7 | `course/open-with-your-ai.tsx` |
| 7 | `course/technical-course-landing.tsx` |
| 6 | `course/kurs/workshop-quiz-page.tsx` |

**Landing kit specifics** (`technical-course-landing.tsx`):
- primary CTA is `border-2 border-foreground bg-brand-orange font-mono uppercase` (line 27);
- the header is a `border border-foreground` box with an `h-1 bg-brand-orange` bar (lines 64-66);
- the facts aside is `bg-kupfer-mist` with `01/02/03` numbered squares (lines 88-112);
- section headings use a 0.25rem orange rule and a mono eyebrow (lines 132-139).

**Reader chrome specifics** (`lesson-shell.tsx`):
- `border-foreground` sidebar and toolbar (lines 322, 329, 401, 403, 430);
- mono-uppercase nav labels (339, 404, 432);
- `border-t-[3px] border-brand-orange` stage rule (460).

### 3.3 What the screenshots show

- **`/kurse`** (`kurse-hub.png`): about 3,500 px tall.
  - The atlas card has a 3px orange top rule, four square goal tiles and a mist-filled "Offener Einstieg ohne Lernkonto" card with an offset shadow card behind it.
  - Ten ledger rows each get a different pastel wash (acid/sky/pink/peach/teal/cobalt): risograph but noisy.
  - Mono-uppercase everywhere ("TEIL DES GEWÄHLTEN PFADS", "PRAXISBEISPIEL TESTEN").
  - Locally all four foundation rows read "Hier nicht verfügbar · Kursübersicht" because no auth provider is configured (`src/lib/courses/access.ts`); production would say "Lernkonto nötig".
- **KI-Führerschein landing:** framed header card, orange top bar, "§ KI-FÜHRERSCHEIN · KOSTENLOSER GRUNDLAGENKURS", mist facts aside with numbered squares, "§ WARUM DIESER KURS / Drei Entscheidungen für jeden KI-Einsatz.", "§ KURSWEG / Was du lernst." The ledger-like block list is clean, but the overall impression is a form rather than an invitation.
- **Claude landing:** same kit. The two hero widgets (`HeroOrrery`, `HeroTransform`) sit in black-framed boxes with hard black offset shadows. The lesson list is a bordered ledger with mono "LEKTION 1" labels.
- **Claude lesson:** the first screen is dark mission-control chrome: "LEKTIONSMISSION · SIGNALSTRECKE · GROUNDING-KOMPARATOR", "LEKTIONSMISSION 01 · GRENZENLINSE", "PROJEKTPHASE · 01/05 · GESUCHTER BELEG", step tabs FESTLEGEN / TESTEN / REVIDIEREN. Next come "ANGEWANDTES KURSPROJEKT · PROMPT … PROJEKTWERKSTATT … LIEFEROBJEKT … BEREIT ZUR AKTIVIERUNG … WERKSTATT ÖFFNEN" with an offset-shadow button, and "VERTEILTES ABRUFEN · Abrufwarteschlange". The actual lesson ("Lektionsreferenz · Was Claude tatsächlich ist") is a collapsed row at the very bottom. This is the single most "AI-slop"-feeling surface.
- **Data Science landing:** a different, calmer system (v8 scope): large sans headline with an italic serif orange accent, a small SVG cycle diagram, outcome cards with pastel geometric icons, 12 chapter cards with a thin coloured left rule and a tool grid. This is closest to "state of the art, not brutalist".
- **Data Science chapter `/model`:** by default the main column holds a single collapsed "LEKTIONSREFERENZ Modellierung · REFERENZ ÖFFNEN +" row; the page body is otherwise empty (`data-science-chapter.png`). Opened, it is a good editorial page: simulation card, "Fehlmuster" and "Kernaussagen" boxes, and a transfer checkpoint.
- **DEF chapter:** similar v8-like editorial layout. The "Kernaussagen" box text rendered almost invisible in the capture, possibly a scroll-reveal opacity not finishing under reduced motion; verify.
- **DEF landing bug:** the 6rem label column wraps "KURSÜBERBLICK" to "KURSÜBERBLI / CK".
- **Codex lesson:** same mission and project chrome as Claude before the lesson body, which is long and mixes Kernaussage boxes, a replay widget, exercises, cards and quizzes.

---

## 4. Restyle leverage points (smallest set, largest effect)

Ordered by pages changed per line edited. "Pages" counts DE+EN routes.

| # | File(s) | What to change | Reach |
|---|---|---|---|
| 1 | `src/app/globals.css` `@theme` (49-135) | Split `--color-border` into a soft divider (e.g. warm grey around 1.6:1 for layout lines) and a strong control boundary (keep 3:1 for inputs and buttons). Retire or soften `--color-kupfer-mist`. Add `--radius-sm/md/lg` tokens. Delete unused `--shadow-tile`. Tame or restrict `brand-acid/pink/sky/peach` to illustration use. | Every page on the site |
| 2 | `src/components/course/technical-course-landing.tsx` (153) | Rewrite `TechnicalCourseHeader` (open hero, no box, no mist aside, facts as a quiet inline meta row), `TechnicalCourseSectionHeading` (no orange bar, sentence-case eyebrow or none) and the three `TECHNICAL_COURSE_*_CLASS` constants (sans, sentence case, soft radius). | 9 course landings + 3 AI-Native sub-hubs (about 24 routes) |
| 3 | `src/components/course/lesson-shell.tsx` (515, lines 322-460) | Softer sidebar (no `border-foreground`), sentence-case nav labels, drop the `border-t-[3px]` stage rule. | Reader chrome of all 10 courses (hundreds of lesson routes) |
| 4 | `src/components/course/lesson-reference.tsx` (82) | Make the lesson body **open by default** (or render it without a disclosure) and drop the "Lektionsreferenz" framing. | Lesson body in 8 readers |
| 5 | `src/components/course-projects/{course-project-studio,lesson-mission-control,course-workspace-frame,retrieval-queue}.tsx` + `engines/engine-ui.tsx` | Visual: remove hard shadows, dark header bars, `border-2` and mono-caps buttons. Structure: move below the lesson or collapse to a single "Übung zu dieser Lektion" card. Copy: rename "Lektionsmission", "Signalstrecke", "Grenzenlinse", "Projektwerkstatt", "Lieferobjekt", "Bereit zur Aktivierung", "Verteiltes Abrufen / Abrufwarteschlange" (strings in the same files + `src/lib/course-projects/*`). | Top of every lesson in all 10 courses |
| 6 | `src/components/course/kurs/{certificate-page,verification-page,workshop-quiz-page,course-assessment-cta,completion-certificate-cta,lesson-quiz}.tsx` | Same token and kicker treatment. | About 30 quiz/cert/verify routes + CTAs on 6 landings |
| 7 | `/kurse` hub: `src/app/kurse/course-ledger-row.tsx` (`ROW_TONES` / `PLATE_TONES` 43-66, row markup 172-380), `learning-atlas.tsx` (offset stack 507-515, mist fills 380-470), `page.tsx` aside (86) | One neutral card style, no per-row pastel, no offset stack; copy per section 7. | `/kurse`, `/en/kurse` (and the patterns re-used on `/konto`) |
| 8 | New `@utility kicker` (or an `Eyebrow` component) + codemod over the 448 mono-uppercase literals | Single place to decide the eyebrow style (e.g. sans 12-13px, medium, muted, sentence case). | All course surfaces, then workshops and demos |
| 9 | Refactor first: fold `src/app/{ki-fuehrerschein,ki-und-gesellschaft,eu-ai-act-kurs}/kurs/kurs-content.tsx` (about 600 lines each, about 80% identical) into one shared component | Restyle once instead of three times. | 3 course hubs ×2 locales |
| 10 (optional, expensive) | Per-course islands: `components/data-engineering-fundamentals/de-course.css` (12,772), `components/data-science/ds-v8-scope.css` (3,115; already close to the target look), `components/data-infrastructure/*` (47 mono-caps), `components/codex/*` (34), `components/widgets/**` (40 hard shadows), `components/ai-native/kurs/lesson-reader.tsx` + `components/ai-native/demos/*` | Token-level fixes first; deeper restyle only if time allows. Use DS v8 as the visual reference for the new course look. | Individual courses |

**Minimum viable restyle:** #1 + #2 + #3 + #4 + #5 (visual only) + #7 covers all 10 landings, all readers' chrome and the hub, in about 10 files.

### 4.1 Tests that pin the current look (update them together with the restyle)

- `src/app/kurse/open-source/technical-course-landings.design.test.ts`: forbids `shadow-`, `rounded`, `hover:-translate`, and requires exactly one `TECHNICAL_COURSE_PRIMARY_ACTION_CLASS` / `SECONDARY` per landing.
- `src/components/course/technical-course-landing.test.tsx:40`: expects `border border-foreground overflow-hidden`.
- `src/components/course/lesson-shell.test.tsx:198, 217, 223`: expect `border-foreground bg-card` and `border-t-[3px] border-brand-orange`.
- `src/app/kurse/learning-atlas.test.tsx:375`: expects `border-brand-orange bg-kupfer-mist text-brand-orange`. Lines 170, 315, 638, 643 expect the CTA names "Nachweis beginnen …".
- Rounded bans also in `brand-button.test.tsx`, `technical-course-progress.test.tsx`, `ki-check/learning-surfaces.design.test.ts`, `ai-native/supplementary-hubs.design.test.tsx`, `workshops/*.test.tsx`, `buecher/*`.
- Contract suites to re-run: `globals-css.test.ts`, `lib/dark-surface-contract.test.ts`, `interface-typography-contract.test.ts`, `learning-instrument-design-contract.test.ts`, `learning-surface-density-contract.test.ts`, `components/course/interaction-design-contract.test.ts`, `passive-state-design-contract.test.ts`, `ds-v8-scope-css.test.ts`, `de-course-css.test.ts`.
- Copy pins:
  - `src/lib/courses/catalog.test.ts:380-400` pins course titles ("AI-Native Arbeitskurs", "Claude Course", "Codex-Kurs", …); line 170ff bans credential marketing in descriptions.
  - `catalog-copy.test.ts` pins EN section titles.
  - Claim-hygiene and parity tests exist per course (`lib/course/*-claim-hygiene.test.ts`, `*-parity.test.ts`, `lib/data-science/claim-hygiene.test.ts`).

---

## 5. Content audit: concreteness, overlap, usefulness

### 5.1 Structural slop tells (measured on the 10 rendered landings)

- **Headings that count the structure instead of naming a benefit:**
  - "Vier Tracks. Zwölf Lektionen. Ein Abschlussfall." (Codex)
  - "Vier Tracks. Zwölf Lektionen. Ein vollständiger Entwurfsfall." (DI)
  - "Eine Pipeline. Zwölf Kapitel. Ein durchgängiger Fall." (DEF)
  - "Zwölf Kapitel, ein Arbeitszyklus." / "Zwölf Kapitel: Modell entwickeln, Wirkung nachweisen." (DS)
  - "Sechs Blöcke, eine durchgehende Klassifikationslogik." (EU)
  - "Neun Lektionen entlang realer Entscheidungen." (KuG)
  - "Vier Projekte, ein kontrollierter Ablauf." (AI-Native)
  - "Neun Module und 39 Lektionen" (Operator)
- **Rule of three, repeated across pages:**
  - "Drei Entscheidungen für jeden KI-Einsatz." (KF)
  - "Drei Entscheidungen statt einer Compliance-Behauptung." (EU)
  - "Drei Entscheidungen vor jedem KI-Schritt." (AI-Native)
  - "Drei Themen brauchen drei verschiedene Prüfmethoden." (KuG)
  - hub H1 "KI verstehen, einsetzen und prüfen."
- **Aphorism subtitles:**
  - Codex: "Agent statt Assistent.", "Wähle nach Betriebsanforderungen, nicht nach Logo.", "Parallel läuft nur, was unabhängig ist.", "Diff und Protokolle sind Nachweise, keine Freigabe."
  - Claude: "Ein mentales Modell, das unter Druck hält.", "Prompts are contracts, not incantations".
  - DEF: "…als ausführbare Simulationen, nicht als Aufzählung".
- **Abstract nouns and verbs:** "prüf*" 52× in 10 landings, "Nachweis" 11×, "begrenzt/abgegrenzt" 11×, "kontrolliert" 7×, "belastbar" 6×. The hub turns every course into a "Nachweis" ("Welchen Nachweis brauchst du als Nächstes?", CTA "Nachweis beginnen").
- **Legal-document chrome:** "§ Warum dieser Kurs", "§ Kursweg", "§ Curriculum", "§ Warum kostenlos" (26 "§ " eyebrows in native landings), plus "Kursrahmen" boxes with "Lokal Teilnahmebestätigung".
- **Invented UI jargon** (course-projects): Lektionsmission, Signalstrecke, Grenzenlinse, Grounding-Komparator, Projektwerkstatt, Lieferobjekt, Bereit zur Aktivierung, Verteiltes Abrufen, Abrufwarteschlange, Gesuchter Beleg.
- **Inconsistencies a reader notices:**
  - EU AI Act lessons are Sie-form (every `content/eu-ai-act-kurs/block-*.json` has 11-19 Sie/Ihr lines and 0 du lines) while landing and block metadata use du.
  - The record has three names: "Teilnahmebestätigung" (KF), "Lernnachweis" (KuG), "Teilnahmenachweis" (EU landing).
  - The DE catalog titles "Claude Course" in English, but "Codex-Kurs" in German.
  - KF has three EN names: "AI Fundamentals" (catalog), "Everyday AI Literacy" (config and landing), "AI driving licence" (nowhere).
  - DE technical courses carry eyebrows "Schritt 05 … Schritt 10", implying a 10-step path, while the hub says "Der Pfad ist eine Empfehlung".
  - The Operator course calls its final test "Workshop-Quiz".
- **Time claims:**
  - AI-Native says "ca. 12 Std."; its module durations sum to 303 min (about 5 h). The rest is setup and capstone and should be stated as such.
  - DEF: 12 chapters and 17 simulations in "ca. 90 Min.".
  - DS: 12 chapters and 37 simulations in "ca. 2 Std.".
  - Both are reading time only.

The existing phrase linter (`scripts/content-voice-rules.mjs`, 13 rule ids, 80 phrases) catches none of these. Worth adding for the de-slop task:
- counting-heading detector (`^(Ein|Eine|Zwei|Drei|Vier|…|Zwölf) \w+[.,:] (Ein|Eine|Zwölf|…)`);
- per-page budgets for "statt", ", nicht … sondern", "prüf*" and "Nachweis";
- a ban on "§ " eyebrows;
- a ban on the course-projects jargon list.

### 5.2 Overlaps

| Overlap | Where | Suggestion |
|---|---|---|
| **AI-Native Arbeitskurs ↔ The AI-Native Operator** (names) | both "AI-Native", both "controlled workflows" | Rename one: AI-Native → "KI im Arbeitsalltag" (individual); Operator → "KI im Team einführen" (team lead). |
| AI-Native Modul 2 ↔ Claude Course | Projects/Memory, Skills, MCP, Claude Code, CLAUDE.md vs Claude L4 CLAUDE.md, L7 agents, L10 team workflows | Keep setup in AI-Native; link to Claude L2/L4 for depth, or drop the duplicate lessons. |
| AI-Native "EU AI Act im Detail: Annex III" ↔ EU AI Act Block 2 | same topic | Replace with a link. |
| KI-Führerschein Block 5 (Art. 4, Richtlinie) ↔ EU AI Act Block 4 "Art. 4 als Organisationspflicht" | same article | KF: the practical policy template; EU: the legal duty. Say so in both. |
| Claude L4 CLAUDE.md, L7 agents, L8 code reviews, L11 evals ↔ Codex L3 AGENTS.md, L7 PR review, L10-12 ↔ Operator M02 (spec-first, parallel work, evals) | coding-agent practice split over three courses | Present Claude + Codex as one "Coding-Agenten" track with vendor-specific lessons; Operator M02 links rather than re-teaches. |
| **Data Engineering Fundamentals ↔ Data Infrastructure** | streaming/Kafka, storage/Parquet, orchestration/Airflow, idempotency, quality/SLA, CDC: about 6 of 12 topics | Make it an explicit sequence (DEF = pipeline basics, about 2 h; DI = design decisions for seniors, about 4 h) and state "DEF first". |
| Operator M07 (data & infra) and M08 (governance) ↔ DI and EU AI Act | | Cross-link. |

### 5.3 Concreteness verdict per course

| Course | Lesson-level concreteness | Landing concreteness | Useful for the stated audience? |
|---|---|---|---|
| KI-Führerschein | High (Reklamations-Mail, Meeting-Protokoll, 10 data items to classify, fill in a policy) | Medium/low (abstract "Datengrenze / Prüfweg / Verantwortung") | Yes. Block 5 (policy writing, 25 min) targets policy owners, not all staff. |
| KI und Gesellschaft | High (OECD/IAB numbers, COMPAS, Gender Shades, "sichern, melden, nicht teilen") | Low ("trennt belastbare Befunde von pauschalen Behauptungen") | Moderately. Civic literacy; the practical payoff (spotting a fake, reading job-impact headlines) is under-sold. |
| EU AI Act | High but broad (24 lessons incl. 10^25 FLOPs, AI Office, sandboxes) | Medium | Blocks 1-2 + 6 are what a Mittelstand deployer needs (about 55 min); 3-5 are reference material. Sie/du mismatch. |
| AI-Native Arbeitskurs | Tool-concrete but scattered (Claude setup, Obsidian vault, n8n self-hosting, LM Studio, EU AI Act) | Low ("Arbeitsinstrument", "Arbeitsvertrag") | Too broad. Obsidian (Modul 3, 89 min) is a niche PKM tutorial; "Warum ich meine IDE heute anders nutze" is an essay. |
| Claude Course | High | Good headline, heavy reader chrome | Yes, but the audience is too wide ("Wissensarbeiter, Entwickler, Teams mit Claude Code"). |
| Codex-Kurs | High | Medium ("kontrolliert", "auftragsorientiert") | Yes for developers; needs a repo to practise. |
| Data Infrastructure | High (Parquet bytes, Iceberg snapshots, watermarks) | Medium | Niche: senior interview / architecture prep; "IC5" is Meta-internal jargon. |
| Data Engineering Fundamentals | High (one `dim_users` pipeline) | Medium | Yes; time is understated. |
| Data Science Fundamentals | High (37 sims, confusion matrix, CUPED, peeking) | Best of all ("Einen belastbaren A/B-Test entwerfen") | Yes, but for analysts and beginners, **not** for "Data Scientists, ML Engineers" as stated. |
| The AI-Native Operator | Medium (decision frames, matrices) | Low ("modellgestützter Betrieb", "Schutzgrößen") | Too broad: 9 modules from engineering to compensation and org design for "Fach- und Führungskräfte". Better as 3 short tracks. |

---

## 6. Course-by-course copy recommendations

Format per course:
- **Promise:** one line, "Nach diesem Kurs kannst du …" / "After this you can …".
- **Time / Audience:** realistic values, DE and EN.
- **Cut:** the 2-3 most generic phrases, verbatim with their source.
- **Also:** structural notes where needed.

Copy is written without triads, without "X statt Y", and without counting headlines.

### 6.1 KI-Führerschein (`/ki-fuehrerschein`)
- **Promise**
  - DE: "Nach dem Kurs weißt du, welche Daten in welches KI-Tool dürfen, und du prüfst eine KI-Antwort, bevor sie in eine Mail, ein Protokoll oder einen Bericht geht."
  - EN: "After this you know which data may go into which AI tool, and you check an AI answer before it ends up in an email, minutes or a report."
- **Time:** DE "ca. 2 Std. mit Übungen (1 Std. 40 Min. Lesezeit)" / EN "about 2 hrs including exercises".
- **Audience:** DE "Alle, die im Job ChatGPT, Copilot oder ähnliche Tools nutzen. Keine Vorkenntnisse." / EN "Anyone who uses ChatGPT, Copilot or similar tools at work. No prior knowledge."
- **Cut**
  - "Drei Entscheidungen für jeden KI-Einsatz." (+ the "Datengrenze / Prüfweg / Verantwortung" list): replace with the four concrete tasks from Block 3.
  - "§ Kursweg · Was du lernst." and "Kursrahmen … Lokal Teilnahmebestätigung".
  - EN catalog title "AI Fundamentals" vs landing "Everyday AI Literacy": pick one.
- **Also:** label Block 5 "Für alle, die im Team die KI-Regeln schreiben (optional)".

### 6.2 KI und Gesellschaft (`/ki-und-gesellschaft`)
- **Promise**
  - DE: "Nach dem Kurs kannst du eine Schlagzeile wie „KI ersetzt 40 % der Jobs" auf ihre Datenbasis zurückführen und weißt, was zu tun ist, wenn dir ein verdächtiges Video geschickt wird."
  - EN: "After this you can trace a headline like 'AI will replace 40% of jobs' back to its data, and you know what to do when someone sends you a suspicious video."
- **Time:** DE "ca. 45-60 Min." / EN "45-60 min".
- **Audience:** DE "Alle, die über KI mitreden oder im Team Fragen dazu beantworten. Kein Technikwissen nötig." / EN "Anyone who discusses AI at work or at home. No technical background needed."
- **Cut**
  - "Drei Themen brauchen drei verschiedene Prüfmethoden."
  - "Neun Lektionen entlang realer Entscheidungen."
  - catalog "Quelle, Interesse und Unsicherheit stehen jeweils getrennt." (EN "Source, interest, and uncertainty stay separate.")

### 6.3 EU AI Act Kurs (`/eu-ai-act-kurs`)
- **Promise**
  - DE: "Nach dem Kurs kannst du für ein KI-Tool in deinem Unternehmen sagen, in welche Risikoklasse es fällt, ob ihr Anbieter oder Betreiber seid und welche Pflichten bis wann anstehen."
  - EN: "After this you can take one AI tool your company uses, name its risk class and your role, and list the duties and deadlines that follow."
- **Time:** DE "ca. 2 Std. Lesen, plus 1 Std. für deinen eigenen Anwendungsfall"; core path Blöcke 1, 2 und 6 in knapp 1 Std. EN: "about 2 hrs of reading plus 1 hr on your own case; core path about 1 hr".
- **Audience:** DE "Wer im Mittelstand KI-Tools einkauft, einführt oder freigibt: IT, Datenschutz, Compliance, Geschäftsführung." / EN "People in SMEs who buy, roll out or approve AI tools: IT, data protection, compliance, management."
- **Cut**
  - "Drei Entscheidungen statt einer Compliance-Behauptung."
  - "Sechs Blöcke, eine durchgehende Klassifikationslogik."
  - "offene Pflichten als belegbare Aufgaben mit Zuständigkeit und Prüfkriterium erfassen" (say "eine Pflichtenliste mit Zuständigen und Fristen anlegen").
- **Also**
  - Convert the lesson JSON (`content/eu-ai-act-kurs/block-*.json`) from Sie to du.
  - Mark Blocks 3-5 as "Nachschlagen, wenn ihr Hochrisiko-Systeme betreibt oder selbst Anbieter seid".

### 6.4 AI-Native Arbeitskurs (`/ai-native`)
- **Promise**
  - DE: "Nach dem Kurs hast du Claude für ein festes Projekt eingerichtet und eine wiederkehrende Aufgabe, zum Beispiel den Wochenbericht, als n8n-Ablauf mit Freigabeschritt gebaut."
  - EN: "After this you have set Claude up for one real project and turned a recurring task, such as your weekly report, into an n8n workflow with an approval step."
- **Time:** DE "ca. 5 Std. Lektionen plus 4-6 Std. Einrichten und Abschlussprojekt" (the current "12 h" is not backed by the 303 min of lessons). EN: "about 5 hrs of lessons plus 4-6 hrs of setup and capstone".
- **Audience:** DE "Wissensarbeiter, die Claude schon nutzen und Mails, Protokolle oder Berichte automatisieren wollen. Programmieren nicht nötig; für n8n brauchst du etwas Technikmut." / EN "Knowledge workers who already use Claude and want to automate emails, minutes or reports. No coding; the n8n part needs some technical curiosity."
- **Cut**
  - "AI-Native · Arbeitsinstrument" and "Arbeitsvertrag · Drei Entscheidungen vor jedem KI-Schritt."
  - "Vier Projekte, ein kontrollierter Ablauf." and the four repeated "ENTSCHEIDUNGEN UND ÜBUNGEN" labels.
  - Headline "Aufgabe definieren. Output prüfen." (says nothing about Claude, n8n or the result).
- **Also**
  - Make Modul 3 (Obsidian) an optional bonus.
  - Replace "EU AI Act im Detail: Annex III" with a link to the EU course.
  - Rename to avoid the Operator collision (e.g. "KI im Arbeitsalltag: Claude und n8n"; title pinned in `catalog.test.ts:380`).

### 6.5 Claude Course (`/kurse/open-source/claude`)
- **Promise**
  - DE: "Nach dem Kurs schreibst du Prompts mit Kontext, Beispielen und festem Ausgabeformat und legst für dein Projekt eine CLAUDE.md an, die Claude wirklich lädt."
  - EN: "After this you write prompts with context, examples and a fixed output format, and you set up a CLAUDE.md that Claude actually loads for your project."
- **Time:** DE "ca. 2-3 Std. mit Übungen" / EN "2-3 hrs with exercises".
- **Audience:** DE "Alle, die Claude täglich für Text, Analyse oder Code nutzen. Die Lektionen 4, 7 und 8 setzen Claude Code voraus." / EN "People who use Claude daily for writing, analysis or code. Lessons 4, 7 and 8 assume Claude Code."
- **Cut**
  - L1 subtitle "Ein mentales Modell, das unter Druck hält." and EN section "Prompts are contracts, not incantations".
  - Reader UI: "Lektionsmission · Signalstrecke · Grounding-Komparator", "Grenzenlinse", "Verteiltes Abrufen · Abrufwarteschlange" (say "Übung", "Wiederholen").
  - Catalog "Zwölf Lektionen, immer dasselbe Muster: ein Modell, eine begrenzte Übung."
- **Also:** use one DE title, "Claude-Kurs" (the catalog currently says "Claude Course").

### 6.6 Codex-Kurs (`/kurse/open-source/codex`)
- **Promise**
  - DE: "Nach dem Kurs gibst du Codex eine Aufgabe mit AGENTS.md, klarer Grenze und Akzeptanzkriterien und prüfst den Pull Request, bevor du ihn mergst."
  - EN: "After this you hand Codex a task with an AGENTS.md, a clear scope and acceptance criteria, and you review the pull request before you merge it."
- **Time:** DE "ca. 2-3 Std.; am besten mit einem eigenen Repository" / EN "2-3 hrs, ideally with a repository of your own".
- **Audience:** DE "Entwicklerinnen und Entwickler, die Coding-Agenten im Team einsetzen wollen." / EN "Developers who want to use coding agents in a team codebase."
- **Cut**
  - Headline "Codex kontrolliert im Repository einsetzen." and "auftragsorientierten Coding-Agenten".
  - "Vier Tracks. Zwölf Lektionen. Ein Abschlussfall."
  - Aphorism subtitles "Agent statt Assistent." and "Absicht, Nachweis und Verantwortung bleiben verbunden."

### 6.7 Data Infrastructure (`/kurse/open-source/data-infrastructure`)
- **Promise**
  - DE: "Nach dem Kurs kannst du für eine Datenplattform begründen, welches Tabellenformat, welche Partitionierung und welche Streaming-Garantie du wählst, und das im Design-Review vertreten."
  - EN: "After this you can justify your table format, partitioning and streaming guarantees for a data platform and defend them in a design review."
- **Time:** DE "ca. 4 Std." / EN "about 4 hrs".
- **Audience:** DE "Data Engineers mit einigen Jahren Praxis, die Architekturentscheidungen treffen oder sich auf Senior-Interviews vorbereiten. Vorher empfohlen: Data Engineering Fundamentals." / EN "Data engineers with a few years of practice who make architecture calls or prepare for senior interviews. Take Data Engineering Fundamentals first."
- **Cut**
  - "Datenplattformen anhand ihrer Systemgrenzen entwerfen."
  - "Jede Lektion trennt Anforderungen, technische Entscheidung, Ausfallmodus und Betriebsnachweis."
  - Audience jargon "IC5+-Kandidaten" and catalog "Simulationen zeigen die Ausfall- und Skalierungsgrenze, bevor der Betrieb sie zeigt."

### 6.8 Data Engineering Fundamentals (`/kurse/open-source/data-engineering-fundamentals`)
- **Promise**
  - DE: "Nach dem Kurs kannst du eine Pipeline von der Quelle bis zum Dashboard aufzeichnen und für jede Station sagen, wo sie typischerweise bricht und welche Prüfung das abfängt."
  - EN: "After this you can sketch a pipeline from source to dashboard and say, for each stage, where it usually breaks and which check catches it."
- **Time:** DE "ca. 2-2,5 Std. mit Simulationen" (not "90 Min.") / EN "2-2.5 hrs including simulations".
- **Audience:** DE "Analysten, Analytics Engineers und Einsteiger ins Data Engineering. SQL-Grundlagen helfen." / EN "Analysts, analytics engineers and people new to data engineering. Basic SQL helps."
- **Cut**
  - Headline "Eine Datenpipeline ist ein zusammenhängendes System."
  - "… stehen hier als ausführbare Simulationen, nicht als Aufzählung."
  - "Eine Pipeline. Zwölf Kapitel. Ein durchgängiger Fall."
- **Also:** fix the "KURSÜBERBLICK" wrap in the 6rem label column.

### 6.9 Data Science Fundamentals (`/kurse/open-source/data-science`)
- **Promise**
  - DE: "Nach dem Kurs kannst du eine Modellkennzahl wie „92 % Accuracy" hinterfragen: Du prüfst Datenleck, Klassenverteilung und Schwellenwert und erkennst, wann ein A/B-Test zu früh gestoppt wurde."
  - EN: "After this you can question a metric like '92% accuracy': you check for leakage, class balance and threshold, and you spot an A/B test that was stopped too early."
- **Time:** DE "ca. 3 Std. mit Simulationen" / EN "about 3 hrs including simulations".
- **Audience:** DE "Analysten, Produktleute und Einsteiger, die Modellergebnisse lesen oder beauftragen. Python ist nicht nötig." / EN "Analysts, product people and beginners who read or commission model results. No Python needed." (Drop "Data Scientists, ML Engineers": the content is fundamentals.)
- **Cut**
  - Headline "Data Science bedeutet, aus Daten Entscheidungen abzuleiten."
  - "Verfahren anwenden und ihre Aussagekraft prüfen."
  - "Zwölf Kapitel, ein Arbeitszyklus."
- **Keep:** the outcome cards ("Eine Konfusionsmatrix korrekt auswerten", "Einen belastbaren A/B-Test entwerfen"). They are the best copy on any landing.

### 6.10 The AI-Native Operator (`/kurse/open-source/ai-native-operator`)
- **Promise**
  - DE: "Nach dem Kurs kannst du für dein Team festlegen, welche Aufgaben KI übernimmt, wer die Ergebnisse freigibt und woran ihr nach drei Monaten messt, ob es sich gelohnt hat."
  - EN: "After this you can decide which tasks your team hands to AI, who signs off the results, and how you will tell after three months whether it paid off."
- **Time:** DE "ca. 14 Std.; in drei Teilen à 4-5 Std. machbar" / EN "about 14 hrs; doable in three parts of 4-5 hrs".
- **Audience:** DE "Team- und Bereichsleitungen, die KI-Nutzung in ihrem Bereich einführen und verantworten." / EN "Team and department leads who introduce AI in their area and are accountable for it." (Not "Fach- und Führungskräfte".)
- **Cut**
  - Eyebrow "Kurs zu modellgestütztem Betrieb" and intro "Ein Kurs in neun Modulen zur Auswahl, Entwicklung, zum Betrieb, zur Steuerung und zur Messung modellgestützter Abläufe."
  - "Register, Prüfpfade, Schutzgrößen und belastbare Ergebnisvergleiche führen."
  - "Workshop-Quiz" (it is a course).
- **Also:** offer three entry points on the landing: "Für Engineering-Leads" (M01-M03), "Für Team- und Betriebsleitung" (M04-M06), "Für Governance und Controlling" (M07-M09).

---

## 7. `/kurse` hub copy

Source files: `src/lib/courses/course-hub-copy.ts`, `learning-atlas.tsx` `ATLAS_COPY`, `goals.ts`, `catalog.ts` / `catalog-copy.ts`.

| Now (DE) | Proposed DE | Proposed EN |
|---|---|---|
| H1 "KI verstehen, / einsetzen und prüfen." | "Kostenlose KI-Kurse für den Arbeitsalltag." | "Free AI courses for everyday work." |
| "Lernatlas · ein nächster Schritt" / "Welchen Nachweis brauchst du als Nächstes?" | "Womit fängst du an?" | "Where do you want to start?" |
| Goals "Sicher starten / Folgen beurteilen / Mit KI bauen / Daten entscheiden" | "Ich nutze KI im Job" / "Ich bin für KI-Regeln zuständig" / "Ich baue mit KI" / "Ich arbeite mit Daten" | "I use AI at work" / "I own our AI rules" / "I build with AI" / "I work with data" |
| "Nächster Nachweis" / CTA "Nachweis beginnen" / "Nachweis fortsetzen" | "Empfohlen als Nächstes" / "Kurs starten" / "Weiterlernen" | "Suggested next" / "Start course" / "Continue" |
| `proofs` lines per course (e.g. "Fordere eine Modellkennzahl mit einem Gegenbeispiel heraus.") | Use the promise line from section 6 | Use the promise line from section 6 |
| Eyebrows "Schritt 05 · Prompting" … "Schritt 10" on technical courses | Topic only ("Prompting", "Data Science") | same |
| "§ Warum kostenlos" / "Alles kostenlos. Vier Reader brauchen trotzdem ein Konto." | "Kostet das etwas?" / "Nein. Für die vier Grundlagenkurse brauchst du ein kostenloses Konto, damit dein Fortschritt gespeichert wird." | "Is it free?" / "Yes. The four foundation courses need a free account so your progress is saved." |
| Row CTA "Praxisbeispiel testen" in mono caps | "Beispiel ansehen" (sentence case) | "See an example" |

Related test updates: `learning-atlas.test.tsx` lines 170, 315, 638 and 643 assert "Nachweis beginnen …".

---

## 8. Suggested course structure (keeps all URLs)

- **Grundlagen, für alle:**
  - KI-Führerschein
  - KI und Gesellschaft
  - EU AI Act, core path of Blocks 1, 2 and 6, with the rest as reference
- **Im Job anwenden:**
  - AI-Native, renamed "KI im Arbeitsalltag", with Obsidian optional
  - Claude-Kurs and Codex-Kurs, shown together as "Coding-Agenten" for developers
- **Mit Daten arbeiten:**
  - Data Engineering Fundamentals, then Data Infrastructure (explicit order)
  - Data Science Fundamentals
- **KI im Team verantworten:**
  - The AI-Native Operator, renamed, with three entry points

This makes the hub say *who a course is for*, not what number it is. It also fixes the two naming collisions without moving any route.

---

## 9. Method notes

- Greps ran over `.tsx/.ts/.css` excluding tests; the count script is at `/tmp/claude-0/-home-user-platform/614e303c-f8f0-55ca-be18-13442a9af90b/scratchpad/tmp/grep-brutal.sh`.
- Playwright scripts are in the same `scratchpad/tmp/` folder:
  - `course-shots.mjs` (main screenshots);
  - `ds-open.mjs` and `more-open.mjs` (force-open the `LessonReference` details);
  - `landings-text.mjs` (screenshots of the remaining landings plus the text dump).
- Native lesson readers redirect to `/login?reason=auth-not-configured` locally, so KF is covered by its landing plus the shared-reader analysis (`block-page-shell` → `lesson-layout` → `LessonShell`).
- No file inside `/home/user/platform` was created, modified or deleted.
