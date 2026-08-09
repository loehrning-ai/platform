# Foundation course translation contract

German course URLs and progress identifiers are canonical. English content is
selected from the middleware-owned request locale; it does not use duplicate
route components.

## Required files

For one course `<slug>`, add the complete English bundle under
`content/<slug>/en/` in one change:

- the same lesson or module filenames as the German source;
- `quiz/questions.json`;
- `glossary.json` when the German course has one;
- `course.json` and `modules.json` for `ai-native`;
- one small localized config copy registered through
  `createLocalizedCourseConfig` in `src/lib/course/config.ts`;
- localized block metadata in `src/lib/course/data.ts` for block-based courses.

The existing German files stay in `content/<slug>/`. Do not move them.

## Immutable identity

Translations must preserve these values exactly:

- course slug, `basePath`, `coursePath`, block IDs and their order;
- lesson and module IDs, lesson numbers, section IDs and lesson-quiz IDs;
- answer-option IDs and which option is correct;
- widget kind, placement, `lessonId`, and `cpId`;
- workshop-question IDs, option IDs, configured count, time limit and pass
  threshold;
- freshness dates, risk class and legal source identifiers.

Only visible copy changes. `createLocalizedCourseConfig` inherits structural
fields so translated config cannot redefine route or progress identity.

## Registration gate

Register English assets in all relevant readers:

- `src/lib/course/config.ts`;
- `src/lib/course/data.ts`;
- `src/lib/course/questions.ts`;
- for AI-Native, `src/lib/ai-native/data.ts` and
  `src/lib/ai-native/glossary.ts`.

Then add `en` to the course in `AUDITED_CONTENT_LOCALES` in
`src/lib/course/localization.ts`. Do this last and in the same change. Until
that marker exists, `/en/...` deliberately resolves to the German bundle.

This marker is only a runtime content-bundle gate. SEO parity remains a
separate route-by-route decision in `src/lib/i18n/content-parity.ts`.
