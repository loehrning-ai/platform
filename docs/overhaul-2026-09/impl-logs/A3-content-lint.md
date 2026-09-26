# A3-content-lint: change log

## Files changed
- packages/website/scripts/content-voice-rules.mjs
  - New rule ids: VOICE-CONTRAST, VOICE-PUFFERY, VOICE-RESIDUE (strict), VOICE-NOMINAL, VOICE-APHORISM, VOICE-SHAPE, VOICE-RHYTHM (warning only). CATEGORY_RULE entries contrast/puffery/residue/nominal/aphorism.
  - 36 phrase rules from research paste-ready-rules.mjs appended to VOICE_PHRASE_RULES (ASCII-only). Extensions of existing lists: en/de-opener-signpost (OPENER), en/de-hedge-stack (HEDGE), en/de-transition-adverb (TRANSITION), en-claim-studies-show / de-claim-untersuchungen-zeigen (CLAIM), budgets de-count-nicht-sondern, de-count-kein-sondern, de-count-entscheidend, de-count-amtsdeutsch (2/lesson), en-count-crucial, de-count-spannend (1/course).
  - ESRS guard: "wesentliche" removed from de-puffery-rolle-spielen's adjective list, so no rule touches wesentlich/Wesentlichkeit/material/double materiality. Optional de-ambiguous-wesentlich NOT added (research: only if W04 authors misuse it).
  - CLOSER_MARKER extended: Unterm Strich, Das Wichtigste in Kuerze, Alles in allem, Abschliessend, Overall, The bottom line, Bottom line, All in all.
  - SHAPE_RULES + analyzeShapes(): colon reveals (DE/EN), count-first fragment (now requires a closing "." or ":" so titles/labels without punctuation are exempt), list-colon opener, rhetorical reveal (only when next sentence <= 8 words), stacked colons (quote blocks skipped: prompt templates), fragment-run (3 sentences <= 4 words), tail-negation density (> 4 / 1k words in files >= 800 words), sentence-length CV < 0.35 with >= 40 sentences (quiz/glossary exempt).
  - VOICE_ADVISORY_PHRASES: phrase ids of strict rules that stay warnings because they hit strict files today (de-contrast-kein-das-ist, de-contrast-es-geht-nicht, en-contrast-its-not-its, en-contrast-question-isnt, de-count-nicht-sondern, de-puffery-buzz, en-claim-studies-show). Every other new phrase in a strict rule had 0 hits in strict files and is an error there now.
  - VOICE_ADVISORY_PATHS = ["public/"]: findings under public/ are never errors, even if someone adds public/ to the strict scope.
  - computeVoiceMetrics(): sentenceLengthCv, shortSentences, shortSentenceShare, contrastHits, colonReveals, tailNegations, tailNegationsPer1k.
- packages/website/scripts/content-prose.mjs
  - EXTRA_COPY_MODULE_FILES += src/lib/workshops-data-readiness.ts, src/lib/workshops-esg-reporting.ts (discovery only picks up existing files, so W04 is covered the moment the file lands under that name).
  - Copy-module matcher widened to *-copy.ts, *-copy.de.ts, *-copy.en.ts (picks up eigene-ki-copy.*, ki-copy.*).
  - public/workshops/<slug>/**.html discovered (JS under lib/ stays out), classified { kind: "html", lang: "mixed", surface: public/workshops/<slug> }, extracted by extractHtmlUnits() (visible text of p/li/h1-6/td/th/figcaption/blockquote/dd/dt/summary/caption; script/style/svg/pre/code/comments blanked; single-dash cells skipped; inline tags joined without a gap). decodeHtmlEntities() exported.
- packages/website/scripts/content-lint.mjs: findWorkshopHtmlDashes() (exported) + checkWorkshopHtmlDashes(): em/en dashes in workshop HTML prose reported as WARNINGS only (digit ranges exempt).
- packages/website/scripts/content-voice-report.mjs: BAN_RULES += CONTRAST/PUFFERY/RESIDUE; aggregate + columns "CV", "Short <=4", "Contrast"; finishAggregate derives CV, short share, tail negations per 1k.
- packages/website/scripts/__tests__/content-lint-voice.test.mjs: coverage test now spans german+english+slop-v2 and includes shape/structural ids; new tests for slop-v2 exact findings (DE, EN), density chapter, strict/advisory severity, ESRS guard, per-rule regex positives/negatives (research self-test), closer markers, HTML extraction + dash warnings, discovery/classification.
- packages/website/scripts/__tests__/content-voice-report.test.mjs: CV/short-share asserts, slop metrics test, finishAggregate new fields, header columns.
- New fixtures: packages/website/scripts/__tests__/fixtures/voice/slop-v2/ (content/ki-fuehrerschein/block-9-slop-lessons.json, en twin, content/books/slopbuch/01_kapitel.md, public/workshops/fixture-deck/slides.html, src/lib/fixture-copy.de.ts, src/lib/workshops-data-readiness.ts, src/lib/workshops-esg-reporting.ts).
- CONTENT_GUIDE.md: new section "Sentence shapes that read as generated" (one example per new rule).
- content-lint.voice-scope.json: unchanged (no copy module added to strict yet; see below).

## Results
- `bun run content:lint` (repo root): exit 0, 0 errors, ~397 warnings (was 141). New warnings are VOICE-SHAPE / VOICE-RHYTHM density findings, advisory contrasts, and workshop HTML dashes.
- `bun run --cwd packages/website test:content-lint`: 38 pass, 0 fail.
- eslint: scripts/** is in the eslint ignore pattern, so eslint reports "file ignored" for all six files (0 errors). tsc not relevant (.mjs, not in tsconfig).

## Left for the integrator
- Rewrite the strict-file hits, then delete the matching ids from VOICE_ADVISORY_PHRASES so they become errors:
  12 split-sentence contrasts (ki-arbeitsalltag 06/07/09/11x2/12, ki-tools-selbststaendige 01/03/08, ki-landschaft 09 DE+EN, eu-ai-act-kurs block-1:287, ai-native modul-3:39, ai-native/en modul-4:345), "Die Frage ist nicht ..." (ki-arbeitsalltag/01:125), "Das Problem ist nicht die KI" (ki-tools-selbststaendige/01:235), nicht-sondern budget in 6 chapters, "massgeschneidert" (ki-arbeitsalltag/08:104), "praktisch unerlaesslich" (ki-arbeitsalltag/13:29).
- claude-course/lessons/grounding.ts:38 quotes "studies show" as a bad example: add an allowlist entry (content-lint.allowlist.json is not in my ownership) and then drop en-claim-studies-show from VOICE_ADVISORY_PHRASES.
- After the workshop/demo copy rewrite lands, add src/lib/workshops.ts, src/lib/workshops-data-readiness.ts, src/lib/workshops-esg-reporting.ts, src/lib/demos-copy.ts, src/app/workshops/workshop-copy.ts to content-lint.voice-scope.json (workshops.ts currently has 0 voice findings; demos-copy.ts still has 4 shape warnings, workshops-data-readiness.ts has 2 paragraph warnings and 1 landscape over-budget).
- If Workshop 04's module gets a different name than src/lib/workshops-esg-reporting.ts, either name it *-copy.ts or add the name to EXTRA_COPY_MODULE_FILES.
- Current workshop HTML warnings (W03 deck/builder/demo/guide): tail-negation density in slides/builder/guide/demo, "One question, two databases." count-first fragments, 7 em dashes and 6 en dashes in visible prose.
- Not implemented (research calls them optional/uncalibrated): inline-triad share for VOICE-LISTS, pet-word report column, markdown formatting checks (bold-lead runs, emoji, EN title case), public/workshops lib/*.js string extraction, spaced-hyphen warning.
- `bun run scan:public` currently fails on other agents' public/ edits (tokens.css changed after candidate materialization); unrelated to these files.

## Tests not run
- None skipped among the content-lint tests. No vitest file covers these scripts (they run under node --test).
