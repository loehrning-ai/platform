import type { Locale } from "@/lib/i18n/locale";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleRegistry,
} from "@/lib/technical-courses/localization";
import {
  AI_NATIVE_OPERATOR_CONFIG,
  AI_NATIVE_OPERATOR_CONFIG_DE,
} from "./config";
import type { AiNativeOperatorLesson, ModuleId } from "./types";
import { MODULE_IDS, MODULE_LESSON_COUNTS, lessonProgressKey } from "./types";

type ModuleLoader = () => Promise<{
  default: readonly AiNativeOperatorLesson[];
}>;

const EN_MODULE_LOADERS: Record<ModuleId, ModuleLoader> = {
  mindset: () =>
    import("./modules/m01-mindset").then((module) => ({
      default: module.MINDSET_LESSONS,
    })),
  engineering: () =>
    import("./modules/m02-engineering").then((module) => ({
      default: module.ENGINEERING_LESSONS,
    })),
  product: () =>
    import("./modules/m03-product").then((module) => ({
      default: module.PRODUCT_LESSONS,
    })),
  operations: () =>
    import("./modules/m04-operations").then((module) => ({
      default: module.OPERATIONS_LESSONS,
    })),
  talent: () =>
    import("./modules/m05-talent").then((module) => ({
      default: module.TALENT_LESSONS,
    })),
  orgmodel: () =>
    import("./modules/m06-orgmodel").then((module) => ({
      default: module.ORGMODEL_LESSONS,
    })),
  data: () =>
    import("./modules/m07-data").then((module) => ({
      default: module.DATA_LESSONS,
    })),
  governance: () =>
    import("./modules/m08-governance").then((module) => ({
      default: module.GOVERNANCE_LESSONS,
    })),
  measurement: () =>
    import("./modules/m09-measurement").then((module) => ({
      default: module.MEASUREMENT_LESSONS,
    })),
};

const DE_MODULE_LOADERS: Record<ModuleId, ModuleLoader> = {
  mindset: () =>
    import("./modules/de/m01-mindset").then((module) => ({
      default: module.MINDSET_LESSONS_DE,
    })),
  engineering: () =>
    import("./modules/de/m02-engineering").then((module) => ({
      default: module.ENGINEERING_LESSONS_DE,
    })),
  product: () =>
    import("./modules/de/m03-product").then((module) => ({
      default: module.PRODUCT_LESSONS_DE,
    })),
  operations: () =>
    import("./modules/de/m04-operations").then((module) => ({
      default: module.OPERATIONS_LESSONS_DE,
    })),
  talent: () =>
    import("./modules/de/m05-talent").then((module) => ({
      default: module.TALENT_LESSONS_DE,
    })),
  orgmodel: () =>
    import("./modules/de/m06-orgmodel").then((module) => ({
      default: module.ORGMODEL_LESSONS_DE,
    })),
  data: () =>
    import("./modules/de/m07-data").then((module) => ({
      default: module.DATA_LESSONS_DE,
    })),
  governance: () =>
    import("./modules/de/m08-governance").then((module) => ({
      default: module.GOVERNANCE_LESSONS_DE,
    })),
  measurement: () =>
    import("./modules/de/m09-measurement").then((module) => ({
      default: module.MEASUREMENT_LESSONS_DE,
    })),
};

const MODULE_LOADERS = Object.freeze({
  de: DE_MODULE_LOADERS,
  en: EN_MODULE_LOADERS,
}) satisfies Readonly<Record<Locale, Record<ModuleId, ModuleLoader>>>;

const moduleCaches: Record<
  Locale,
  Map<ModuleId, readonly AiNativeOperatorLesson[]>
> = {
  de: new Map(),
  en: new Map(),
};

export interface AiNativeOperatorLocaleContent {
  readonly lessons: readonly AiNativeOperatorLesson[];
}

export type AiNativeOperatorLocaleBundle<L extends Locale = Locale> =
  TechnicalCourseLocaleBundle<
    "ai-native-operator",
    L,
    AiNativeOperatorLocaleContent
  >;

function orderedLessons(
  lessons: readonly AiNativeOperatorLesson[],
): readonly AiNativeOperatorLesson[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return MODULE_IDS.flatMap((moduleId) =>
    Array.from({ length: MODULE_LESSON_COUNTS[moduleId] }, (_, index) => {
      const id = lessonProgressKey(moduleId, index + 1);
      const lesson = byId.get(id);
      if (!lesson) {
        throw new Error(`AI-Native Operator bundle is missing lesson "${id}".`);
      }
      return lesson;
    }),
  );
}

function stringProp(
  props: Readonly<Record<string, unknown>>,
  key: string,
): string | null {
  const value = props[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Derive route, progress, section, assessment and checkpoint identity from content. */
export function extractAiNativeOperatorContentIdentity(
  lessons: readonly AiNativeOperatorLesson[],
) {
  const ordered = orderedLessons(lessons);
  let workshopQuestionIndex = 0;
  const workshopQuestions = ordered.flatMap((lesson) =>
    lesson.quiz.map((question) => {
      workshopQuestionIndex += 1;
      return {
        id: `ano-q${String(workshopQuestionIndex).padStart(2, "0")}`,
        answerOptions: question.answerOptions.map((option) => ({
          id: option.id,
          isCorrect: option.isCorrect,
        })),
      };
    }),
  );

  const checkpointKeys = ordered.flatMap((lesson) => [
    ...(lesson.widgets ?? []).flatMap((widget) => {
      const props = widget.props ?? {};
      const lessonId = stringProp(props, "lessonId");
      const cpId = stringProp(props, "cpId");
      if (lessonId === null || cpId === null) return [];
      if (lessonId !== lesson.id) {
        throw new Error(
          `AI-Native Operator ${lesson.id} carries checkpoint identity for "${lessonId}".`,
        );
      }
      return [`${lessonId}::${cpId}`];
    }),
    ...lesson.quiz.map((question) => `${lesson.id}::${question.id}`),
  ]);

  return defineTechnicalCourseContentIdentity("ai-native-operator", {
    unitIds: MODULE_IDS,
    contentItemIds: ordered.map((lesson) => lesson.id),
    progressKeys: ordered.map((lesson) => lesson.id),
    sectionIdsByProgressKey: Object.fromEntries(
      ordered.map((lesson) => [
        lesson.id,
        lesson.sections.map((section) => section.id),
      ]),
    ),
    workshopQuestions,
    checkpointKeys,
  });
}

export async function getModuleLessons(
  moduleId: ModuleId,
  locale: Locale = "en",
): Promise<readonly AiNativeOperatorLesson[]> {
  const cache = moduleCaches[locale];
  const cached = cache.get(moduleId);
  if (cached) return cached;
  const loadedModule = await MODULE_LOADERS[locale][moduleId]();
  cache.set(moduleId, loadedModule.default);
  return loadedModule.default;
}

export async function getLesson(
  moduleId: ModuleId,
  lessonNumber: number,
  locale: Locale = "en",
): Promise<AiNativeOperatorLesson | undefined> {
  const lessons = await getModuleLessons(moduleId, locale);
  return lessons.find((lesson) => lesson.lessonNumber === lessonNumber);
}

export async function getAllModuleLessonPairs(): Promise<
  readonly { readonly moduleId: ModuleId; readonly lessonNumber: number }[]
> {
  return MODULE_IDS.flatMap((moduleId) =>
    Array.from({ length: MODULE_LESSON_COUNTS[moduleId] }, (_, index) => ({
      moduleId,
      lessonNumber: index + 1,
    })),
  );
}

export async function getAllLessons(
  locale: Locale = "en",
): Promise<readonly AiNativeOperatorLesson[]> {
  const all = await Promise.all(
    MODULE_IDS.map((moduleId) => getModuleLessons(moduleId, locale)),
  );
  return orderedLessons(all.flat());
}

let registryPromise: Promise<
  TechnicalCourseLocaleRegistry<
    "ai-native-operator",
    AiNativeOperatorLocaleContent
  >
> | null = null;

export function getAiNativeOperatorLocaleRegistry(): Promise<
  TechnicalCourseLocaleRegistry<
    "ai-native-operator",
    AiNativeOperatorLocaleContent
  >
> {
  registryPromise ??= Promise.all([
    getAllLessons("en"),
    getAllLessons("de"),
  ]).then(([englishLessons, germanLessons]) => {
    const englishBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "ai-native-operator",
      locale: "en",
      config: AI_NATIVE_OPERATOR_CONFIG,
      identity: extractAiNativeOperatorContentIdentity(englishLessons),
      content: { lessons: englishLessons },
    });
    const germanBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "ai-native-operator",
      locale: "de",
      config: AI_NATIVE_OPERATOR_CONFIG_DE,
      identity: extractAiNativeOperatorContentIdentity(germanLessons),
      content: { lessons: germanLessons },
    });
    return createTechnicalCourseLocaleRegistry({
      courseSlug: "ai-native-operator",
      sourceLocale: "en",
      bundles: { de: germanBundle, en: englishBundle },
    });
  });
  return registryPromise;
}

export async function getAiNativeOperatorLocaleBundle<L extends Locale>(
  locale: L,
): Promise<AiNativeOperatorLocaleBundle<L>> {
  return (await getAiNativeOperatorLocaleRegistry()).get(locale);
}

/** Test-only: clear every locale cache and the validated locale registry. */
export function __resetAiNativeOperatorCacheForTests(): void {
  moduleCaches.de.clear();
  moduleCaches.en.clear();
  registryPromise = null;
}
