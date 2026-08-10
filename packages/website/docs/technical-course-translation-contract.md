# Technical course translation contract

This contract covers the six native technical courses under
`/kurse/open-source/*`. Their current authored source is English. German must
be added as a reviewed parallel bundle. German uses the existing unprefixed
URLs; English uses the same paths under `/en`.

The runtime must never fall back from a missing German bundle to English, or
from a missing English bundle to German. `createTechnicalCourseLocaleRegistry`
throws for an unregistered locale. Do not wire a course to request-locale
selection until both bundles resolve and pass the identity comparison.

## Shared modules

- `src/lib/technical-courses/routes.ts` owns stable route shapes, typed hrefs,
  locale prefixes, generated params, localized config construction, metadata,
  JSON-LD, and certificate route identity.
- `src/lib/technical-courses/localization.ts` owns the fail-closed locale
  registry and the machine-identity comparison.
- `src/lib/i18n/request-locale.ts` reads the middleware-owned locale header.
- `src/lib/i18n/content-parity.ts` remains the separate SEO review gate. This
  architecture does not add any technical course path to it.

## Existing route matrix

| Course | Reader model | Content routes | Assessment | Record | Verification |
| --- | --- | --- | --- | --- | --- |
| `claude` | flat under `/kurs` | `/kurs/{lessonId}` | `/kurs/quiz` | `/kurs/zertifikat` | `/verifizierung` |
| `codex` | flat under `/kurs` | `/kurs/{lessonId}` | all lessons | `/kurs/zertifikat` | `/verifizierung` |
| `data-infrastructure` | flat under `/kurs` | `/kurs/{lessonId}` | all lessons | `/kurs/zertifikat` | `/verifizierung` |
| `data-engineering-fundamentals` | direct chapters | `/{chapterId}`, including `/home` | all chapters | `/zertifikat` | `/verifizierung` |
| `data-science` | overview plus direct chapters | `home` is the root; numbered chapters use `/{chapterSlug}` | 12 numbered chapters | `/zertifikat` | `/verifizierung` |
| `ai-native-operator` | module and lesson | `/{moduleId}` and `/{moduleId}/{lessonNum}` | `/quiz` | `/zertifikat` | `/verifizierung` |

Every row has the prefix `/kurse/open-source/{course}`. The German URL is that
path unchanged. The English URL adds `/en` before it. Never rename `kurs`,
`zertifikat`, or `verifizierung`; they are stable URL segments, not visible
copy.

## Per-course adapter locations

| Course | Canonical structure and loader | Reader surfaces to localize | Dynamic param contract |
| --- | --- | --- | --- |
| `claude` | `src/lib/claude-course/types.ts`, `data.ts`, `lessons/*`; config symbol `CLAUDE_CONFIG`; quiz at `content/claude/quiz/questions.json` | `src/components/imported-courses/claude/*` and Claude widgets under `src/components/widgets/claude/*` | 12 `{ lessonId }` values from `CLAUDE_LESSON_IDS` |
| `codex` | `src/lib/codex/types.ts`, `data.ts`, `config.ts`, `lessons/*` | `src/components/codex/*`, including every bespoke lesson component | 12 `{ lessonId }` values from `CODEX_LESSON_IDS` |
| `data-infrastructure` | `src/lib/data-infrastructure/types.ts`, `data.ts`, `config.ts`, `lessons/*` | `src/components/data-infrastructure/*`, including canvas fallbacks and widgets | 12 `{ lessonId }` values from `DATA_INFRA_LESSON_IDS` |
| `data-engineering-fundamentals` | `src/lib/data-engineering-fundamentals/types.ts`, `content.ts`, `config.ts` | `src/components/data-engineering-fundamentals/*`, chapters, simulators, errors, and not-found | 12 `{ chapterId }` values from `DEF_CHAPTER_IDS`, including `home` |
| `data-science` | `src/lib/data-science/types.ts`, `chapters.ts`, `config.ts` | `src/components/data-science/*`, chapter bodies, simulators, shell, and not-found | 12 `{ chapterSlug }` values from `DS_NUMBERED_CHAPTER_IDS`; `home` remains the root |
| `ai-native-operator` | `src/lib/ai-native-operator/types.ts`, `data.ts`, `config.ts`, `modules/*`; quiz at `content/ai-native-operator/quiz/questions.json` | `src/components/ai-native-operator/*` and referenced Tier-A widgets | 39 `{ moduleId, lessonNum }` pairs from `MODULE_IDS` and `MODULE_LESSON_COUNTS` |

The landing pages and every file under
`src/app/kurse/open-source/{course}/` are part of the adapter. Static metadata
in `layout.tsx`, error/not-found copy, Open Graph image text, sidebars, and
client-only widget defaults count as visible content. A translated lesson body
with an English sidebar or simulator is not a complete bundle.

## Immutable identity

Translations may change visible text only. Preserve exactly:

- course slug, `basePath`, `coursePath`, route model, and route segments;
- track, module, lesson, chapter, section, and answer-option IDs and order;
- progress keys, completion semantics, checkpoint `lessonId` and `cpId`;
- quiz question IDs, correct-answer flags, question count, time limit, and pass
  threshold;
- certificate QR `c` course slug, QR schema version, and verification route;
- source commit, source URL, source image/license paths, SHA-256 values, file
  sizes, license, and attribution.

Specific traps:

- Data Infrastructure checkpoint keys retain the existing `di-` lesson
  namespace even though route and progress lesson IDs do not use it.
- Data Science `home` remains content and the root route, but is not a progress
  key and is not emitted by the dynamic chapter `generateStaticParams`.
- AI-Native Operator keeps the 39 `${moduleId}/${lessonNumber}` progress keys.
  It must never collide with the separate `ai-native` foundation course.
- A certificate hash contains a learner name and result. Keep it in the URL
  fragment, preserve it byte-for-byte across locale links, never send it to a
  server, and never put it in logs, metadata, JSON-LD, analytics, or error
  reports.

## Per-course implementation sequence

Apply the following sequence independently for each course.

1. Keep the existing English modules as the canonical source bundle. Add
   German modules beside them without moving or renaming the source files.
2. Translate every visible field: landing copy, metadata, track/module/chapter
   labels, lesson prose, navigation chrome, callouts, widgets, feedback,
   questions, explanations, certificate copy, verification copy, errors, and
   empty/loading states.
3. Build the German `CourseConfig` with
   `createLocalizedTechnicalCourseConfig`. Do not construct it with a freehand
   object; inherited structural fields are the route and assessment guard.
4. Make loaders accept an explicit `Locale`. Do not infer locale inside data
   modules and do not use `?? englishBundle` or any other fallback.
5. Extract `TechnicalCourseContentIdentity` from each real bundle. Include all
   progress keys, section IDs, workshop question/option/correct-answer identity,
   and global checkpoint keys. Create the locale registry with English as
   `sourceLocale`. Registration fails if German differs.
6. In every route Server Component, call `getRequestLocale()` once, then
   `registry.get(locale)`. A missing bundle is an implementation error, not a
   reason to render another language.
7. Replace hand-built internal paths with `technicalCourseHref`. Pass `locale`
   through client readers, sidebars, pagination, assessment calls to action,
   certificate pages, verification pages, errors, and not-found links.
8. Replace dynamic route arrays with `getTechnicalCourseStaticParams`. Params
   are locale-independent. Keep `dynamicParams = false` and validate params
   before loading content.
9. Build landing and reader metadata with `buildTechnicalCourseMetadata`.
   Supply the result of the separate central parity review for the exact path.
   Reader, quiz, certificate, and verification surfaces remain `noindex,
   follow` in both languages.
10. Build landing course JSON-LD with `buildTechnicalCourseJsonLd`. Use
    localized visible fields and `inLanguage`; keep the canonical course entity
    `@id` and machine `identifier` stable.
11. Pass the locale-owned config into quiz, certificate, and verification
    components. The generated PDF may translate visible certificate text, but
    its QR payload keeps the same course slug and QR version. Build its
    verification URL with the locale-aware route helper and the unchanged
    base64url fragment.
12. Prove the complete route matrix at 320, 390, 768, 1024, and 1440 pixels,
    keyboard navigation, 200% zoom, reduced motion, refresh/deep-link behavior,
    progress continuity while switching locale, assessment eligibility,
    PDF/QR decode, and zero console errors.
13. Only after the complete German and English route families pass may the
    exact public landing path be added to `src/lib/i18n/content-parity.ts`.
    Protected readers and record routes do not become indexable.

## Minimal adapter shape

```ts
const enIdentity = defineTechnicalCourseContentIdentity("codex", {
  unitIds: enTracks.map((track) => track.id),
  contentItemIds: enLessons.map((lesson) => lesson.id),
  progressKeys: enLessons.map((lesson) => lesson.id),
  sectionIdsByProgressKey: Object.fromEntries(
    enLessons.map((lesson) => [
      lesson.id,
      lesson.sections.map((section) => section.id),
    ]),
  ),
  workshopQuestions: [],
  checkpointKeys: extractCheckpointKeys(enLessons),
});

const registry = createTechnicalCourseLocaleRegistry({
  courseSlug: "codex",
  sourceLocale: "en",
  bundles: { en: enBundle, de: deBundle },
});

export default async function Page() {
  const locale = await getRequestLocale();
  const bundle = registry.get(locale);
  return <CourseLanding locale={locale} bundle={bundle} />;
}
```

The adapter must derive identity from loaded content. Copying the English ID
arrays into a German identity fixture without reading the German bundle makes
the test meaningless.

## Required focused proof per course

- both locale bundles load every canonical content item;
- visible German contains reviewed German copy and visible English retains
  reviewed English copy;
- locale identity objects compare exactly;
- every generated param resolves in both locales and unknown params 404;
- every internal link stays in the current locale;
- progress created in one locale appears unchanged in the other;
- questions, scoring, eligibility, certificate QR payload, and verification
  decode are locale-independent;
- English landing metadata stays noindex and has no hreflang until the separate
  parity registry is updated;
- source/provenance values are byte-for-byte unchanged.
