# w2-courses-polish: critique pass on course landings and the lesson reader

Date: 2026-09-26. Key: `w2-courses-polish`. Nothing committed.
Scripts and screenshots are in `scratchpad/mobile/w2-courses-polish/`:
- `after/` has the first viewport (`*-v1.png`, DPR 3) and the full page (`*-full.png`) at 320x568, 390x844 and 1440x900, plus `metrics.json`. The baseline is `../w2-courses-critique/metrics.json`.
- `lesson-top.png` and `lesson-top-320.png` show the lesson from the top down to the first text heading. `lesson-kern.png` shows the flat Kernaussage and the quiz that is still boxed (not mine).
- `claude-390-open-full.png` and `claude-320-open-full.png` show the Claude workbench open.
- `measure.mjs`, `p2.mjs`, `p3.mjs`, `tall.mjs` and `summ.py` are the scripts.

## Numbers (page height in px, dev server with warm fonts)

| Page | 390 critique → now | 320 critique → now | 1440 | Key position |
|---|---|---|---|---|
| /ki-fuehrerschein | 2384 → 2357 | 2754 → 2640 | 2300 = | At 320 the H1 is 2 lines (113 → 67px) and the CTA ends at y=428, 84px above the tab bar (was 19px) |
| DS landing | 3944 → **3556** (4.21 screens) | 4338 → 3937 | 4063 = | 'Ergebnisse' H2 846 → **550** at 390. The drawing and the blank 260px are gone |
| Claude landing | 2699 → 2551 | 3162 → 2885 | 3179 = | Syllabus H2 684 → **586** at 390, 625 at 320. The collapsed workbench is one 74px row |
| Claude lesson | 8075 → **7524** | 8950 → 8355 | 7064 = | First lesson H2 1495 → **989** at 390 and 1678 → **1147** at 320 (targets 1100 / 1250) |
| Codex landing | 2580 → 2530 | 3026 → 2880 | 2054 = | CTA at 337 (390) and 362 (320) |
| EU AI Act | 2925 → 2892 | 3362 → 3260 | 2630 → 2601 (shorter lead) | CTA 363 → 312 at 390 |

At every width, no page scrolls sideways. On phones no text is under 12px. The only targets under 44px are the skip link and the 20px lesson radios; each radio's label is its 48px target. The two 14px fields still on the lesson belong to widgets (see below). Desktop heights did not change, except EU at 1440, which is 29px shorter because the legal basis moved from the lead into the facts.

## Changes

### Data Science landing (high)
- `ds-v8-scope.css` phone layer:
  - `.ov-landing .ov-hero-sim { display: none }`. Because the element is hidden, it never intersects, so `LazyFlowingPipeline` never mounts on phones (the performance contract still holds). From sm it renders as before.
  - The H1 is `clamp(2rem, 1.2rem + 3.5vw, 2.25rem)`: 4 lines at 320 instead of 5.
  - The closing pagination `.tb` is hidden below sm. It repeated the hero action right after the chapter list, whose every row is already a link.
- `ch-overview.tsx` (de + en):
  - The eyebrow reads "Data-Science-Kurs · kostenlos" / "Data science course · free" (the old one had "Fundamentals · v8").
  - The CTA reads "Kapitel 1 starten →" / "Start chapter 1 →".
  - The stat is "2 Std. / ungefähre Lernzeit" / "2 h / approximate study time". I rejected "ca. 2 Std." because it wrapped in the desktop stat card (+24px at 1440).
- Tests: `ds-v8-scope-css.test.ts` asserts the hidden drawing and the hidden pagination. In `route-data-science.spec.ts` the landing CTA name is now "Start chapter 1".

### Lesson page (high + medium)
- `retrieval-queue.tsx`:
  - With nothing due and the queue never toggled (this includes the "no local state" case), the section is `max-sm:hidden`. The server markup is the empty state, so nothing jumps after hydration.
  - The dot is Mennige only when a review is due; otherwise it is `bg-muted-foreground ring-0` and `aria-hidden`.
- `course-project-studio.tsx`: the raw ` · {engineKind}` slug is gone from the band label (at all widths). The studio passes `phoneStatus` (for example "Noch nicht verifiziert") to the frame.
- `course-workspace-frame.tsx`:
  - New `phoneStatus` prop.
  - While the phone frame is collapsed, the header band is wrapped `max-md:hidden`, so the frame is one row: "Projektwerkstatt: Das Grounding-Labor · Noch nicht verifiziert".
  - The band returns when the frame opens or the studio activates it.
- `lesson-reference.tsx` (only with `objectiveRepeatedAbove`, which checkpoint lessons pass):
  - The head sits in a wrapper with `sr-only sm:not-sr-only`. It is still the level-1 heading for assistive technology. A plain `max-sm:sr-only` on the header tripped the DS containment probe, which excludes only `.sr-only`.
  - The Einklappen summary is `max-sm:hidden`, and the details element stays open.
  - The content drops its double rule on phones and hides a reader's `.lesson-head-position` and `.lesson-head-concepts`.
- `claude-lesson-reader.tsx`:
  - The position line and the concept run carry those class names. The mission above lists the concepts, and the bar shows 1 / 12.
  - The Kernaussage is a plain labelled paragraph below sm: no tint, stripe or icon, a sentence-case 14px label and 16px semibold text. From sm it is unchanged.
- `lesson-mission-control.tsx`, below sm:
  - The summary card is flat (no card fill, no side padding).
  - The step area loses its side padding.
  - The prediction and probe choices are hairline rows (48px, selected row still inverted).
  - The reset row stays hidden until the mission has an interaction.
  - The mission's concept run stays. The critique also asked to hide it, but the lesson-head run is the one now hidden, so exactly one run is shown.
- `markdown-renderer.tsx` (course/kurs): an unlabelled fenced block (inline `code` inside `pre`) is now `display:block`. As a cloned inline box, each wrapped line overhung the text column by 2px at 390, which failed `route-claude-responsive` on the anatomy lesson.
- Tests: `retrieval-queue.test.tsx` covers the quiet phone state and the neutral dot. `course-workspace-frame.test.tsx` covers the band hidden while collapsed and the status in the row name. `lesson-reference.test.tsx` covers the phone head with and without a mission.

### Claude landing (medium)
- `claude/page.tsx`: the H2 "Prompt-Bausteine" and its intro are `max-lg:sr-only` (the section stays labelled), and there is less spacing on phones (mt-4 / mt-6).
- `phone-disclosure.tsx`: new optional `hint` prop, shown as a 13px muted second line. The button is labelled by its label and described by the hint. The landing passes `demoIntro`. A test was added.
- `hero-orrery.tsx`: the "Prompt-Werkbank" kicker is `max-lg:hidden`.
- `hero-transform.tsx`: below sm, the empty output box waits for a run. "Noch nicht ausgeführt" remains.

### Landing kit (medium)
- `technical-course-landing.tsx`:
  - The H1 has `max-[374.98px]:text-[2rem]`, so every kit landing H1 is 2 lines at 320 and unchanged from 375.
  - The section-heading note is `max-sm:hidden`.
- The secondary "jump to syllabus" action is `max-sm:hidden` on Claude, Codex, ai-native-operator, data-engineering-fundamentals and data-infrastructure (all `href="#…"` anchors).
  - I did not put this in the shared class, because `/ai-native` uses it for a real second destination.
  - `technical-course-landings.design.test.ts` now pins that form.
- `ki-fuehrerschein/page.tsx`: the kicker is "KI-Führerschein · Grundlagenkurs" (en: "Everyday AI Literacy · Foundation course"). The button already says "Kostenlos".

### EU AI Act (low)
- The lead is one sentence. The legal basis moved into the facts: "Rechtsstand: VO (EU) 2024/1689, Fassung seit 27. Juli 2026" / "Legal basis: Regulation (EU) 2024/1689 as in force since 27 July 2026".
- The critique's switch to du was **not applied**. CONTENT_GUIDE.md line 6 says: "Du everywhere except the EU AI Act course (Sie)". The page carries a comment saying so. The inconsistency is the du in the syllabus rows in `src/lib/course/data.ts`, which I do not own (see below).

## Checks
- `bunx vitest run` over course, course-projects, imported-courses, codex, data-science, kurse/open-source, ki-fuehrerschein, eu-ai-act-kurs, ki-und-gesellschaft and ai-native: 125 files, 858 tests pass.
- eslint on every touched file: clean.
- `tsc -p tsconfig.typecheck.json`: no errors in the touched files.
- e2e against the dev server (`E2E_REUSE_EXISTING_SERVER=1`, the w2-demos browser path, output dirs removed):
  - chromium: route-data-science, route-data-science-responsive and course-workspace all pass (28/28). technical-course-landings, route-claude, route-codex, route-codex-locales and route-ki-fuehrerschein(-locales) pass, apart from the one below.
  - chromium-claude-responsive: route-claude-responsive passes 16/16, after the markdown fix.
  - mobile-chromium: technical-course-landings and reader-focus-mode pass 27, with 1 flaky (the chapter-reader sheet test, which passed on retry).
  - **Still failing, not mine:** `route-codex-locales.spec.ts:478` (200% zoom on L03). At a 640px effective width, the site header's "DE EN Anmelden" cluster escapes the viewport (left 1079, right 1663). That is the shell nav.
  - The Codex locale reflow runs at 1024 and 1440 were flaky once each and passed on retry.

## Left for the integrator / other owners
- `src/components/widgets/tier-a/_frame.tsx` and `quiz.tsx` (quizzes, about 500px each, 5 per lesson). This is the critique's fix verbatim:
  - Frame: on phones use `border-t border-hairline pt-4`, and from md keep the stripe.
  - Kicker: skip it when it equals the title, otherwise render it as `text-label text-muted-foreground`.
  - Options: hairline rows on phones.
- `src/components/widgets/claude/prompt-sandbox.tsx:79` and `socratic-tutor.tsx:135`: change `text-[14px]` to `text-base md:text-[14px]`. Also check claude-md-builder, rewrite-arena, tokenizer, prompt-library-shaper and prompt-grader. The mono caps buttons should become `text-label font-semibold`, with `opacity-60` when disabled.
- `src/components/learning/reader-focus-bar.tsx` (lines 70 and 143):
  - Change `font-mono text-xs font-bold uppercase tracking-[0.08em]` to `text-label font-semibold`, and "1 / 12" to "1 von 12".
  - Once the proof is saved, the CTA should become "Nächste Lektion".
- `src/lib/course/data.ts`: the EU syllabus titles use "&" ("Warum & Für wen", "GPAI, Art. 4 & Transparenz", "Governance & Sanktionen"), which should be "und". The EU syllabus rows also address the reader as du, but the course rule is Sie.
- Site header at 200% zoom (above): it fails `route-codex-locales.spec.ts:478`.
- `globals.css` `scroll-padding-top` still reserves the retired lesson toolbar height below lg (carried over from w2-courses).
