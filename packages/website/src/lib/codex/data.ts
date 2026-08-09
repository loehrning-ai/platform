import type { Locale } from "@/lib/i18n/locale";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleRegistry,
} from "@/lib/technical-courses/localization";
import { CODEX_CONFIG, CODEX_CONFIG_DE } from "./config";
import type { CodexLesson, CodexTrack, LessonId } from "./types";
import {
  CODEX_LESSON_IDS,
  CODEX_TRACKS,
  CODEX_TRACKS_DE,
} from "./types";

type LessonModule = { default: CodexLesson };
type LessonLoader = () => Promise<LessonModule>;

const EN_LESSON_LOADERS: Record<LessonId, LessonLoader> = {
  L01: () => import("./lessons/l01-mental-model"),
  L02: () => import("./lessons/l02-sandbox"),
  L03: () => import("./lessons/l03-agents-md"),
  L04: () => import("./lessons/l04-task-spec"),
  L05: () => import("./lessons/l05-scope"),
  L06: () => import("./lessons/l06-acceptance"),
  L07: () => import("./lessons/l07-review"),
  L08: () => import("./lessons/l08-iterate"),
  L09: () => import("./lessons/l09-tools"),
  L10: () => import("./lessons/l10-parallelism"),
  L11: () => import("./lessons/l11-patterns"),
  L12: () => import("./lessons/l12-workflow"),
};

const DE_LESSON_LOADERS: Record<LessonId, LessonLoader> = {
  L01: () => import("./lessons/de/l01-mental-model"),
  L02: () => import("./lessons/de/l02-sandbox"),
  L03: () => import("./lessons/de/l03-agents-md"),
  L04: () => import("./lessons/de/l04-task-spec"),
  L05: () => import("./lessons/de/l05-scope"),
  L06: () => import("./lessons/de/l06-acceptance"),
  L07: () => import("./lessons/de/l07-review"),
  L08: () => import("./lessons/de/l08-iterate"),
  L09: () => import("./lessons/de/l09-tools"),
  L10: () => import("./lessons/de/l10-parallelism"),
  L11: () => import("./lessons/de/l11-patterns"),
  L12: () => import("./lessons/de/l12-workflow"),
};

const LESSON_LOADERS = Object.freeze({
  en: EN_LESSON_LOADERS,
  de: DE_LESSON_LOADERS,
}) satisfies Readonly<Record<Locale, Record<LessonId, LessonLoader>>>;

const TRACKS = Object.freeze({
  en: CODEX_TRACKS,
  de: CODEX_TRACKS_DE,
}) satisfies Readonly<Record<Locale, readonly CodexTrack[]>>;

const lessonCaches: Record<Locale, Map<LessonId, CodexLesson>> = {
  de: new Map(),
  en: new Map(),
};

export interface CodexLocaleContent {
  readonly lessons: readonly CodexLesson[];
  readonly tracks: readonly CodexTrack[];
}

export type CodexLocaleBundle<L extends Locale = Locale> =
  TechnicalCourseLocaleBundle<"codex", L, CodexLocaleContent>;

function orderedLessons(lessons: readonly CodexLesson[]): readonly CodexLesson[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return CODEX_LESSON_IDS.map((id) => {
    const lesson = byId.get(id);
    if (!lesson) throw new Error(`Codex bundle is missing lesson "${id}".`);
    return lesson;
  });
}

function stringProp(
  props: Readonly<Record<string, unknown>>,
  key: string,
): string | null {
  const value = props[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Derive all route, progress, section, quiz and checkpoint identity from content. */
export function extractCodexContentIdentity(
  lessons: readonly CodexLesson[],
  tracks: readonly CodexTrack[],
) {
  const ordered = orderedLessons(lessons);
  const workshopQuestions = ordered.flatMap((lesson) =>
    (lesson.widgets ?? []).flatMap((widget) => {
      if (widget.kind !== "quiz") return [];
      const props = widget.props ?? {};
      const cpId = stringProp(props, "cpId");
      const options = props.options;
      const correct = props.correct;
      if (
        cpId === null ||
        !Array.isArray(options) ||
        !Number.isSafeInteger(correct) ||
        (correct as number) < 0 ||
        (correct as number) >= options.length
      ) {
        throw new Error(
          `Codex ${lesson.id} has an invalid quiz checkpoint identity.`,
        );
      }
      const questionId = `${lesson.id}::${cpId}`;
      return [
        {
          id: questionId,
          answerOptions: options.map((_, index) => ({
            id: `${questionId}::${index}`,
            isCorrect: index === correct,
          })),
        },
      ];
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
          `Codex ${lesson.id} carries checkpoint identity for "${lessonId}".`,
        );
      }
      return [`${lessonId}::${cpId}`];
    }),
    `${lesson.id}::bespoke`,
  ]);

  return defineTechnicalCourseContentIdentity("codex", {
    unitIds: tracks.map((track) => track.id),
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

export async function getCodexLesson(
  id: LessonId,
  locale: Locale,
): Promise<CodexLesson | undefined> {
  const cache = lessonCaches[locale];
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = LESSON_LOADERS[locale][id];
  if (!loader) return undefined;
  const mod = await loader();
  cache.set(id, mod.default);
  return mod.default;
}

export async function getAllCodexLessons(
  locale: Locale,
): Promise<readonly CodexLesson[]> {
  const all = await Promise.all(
    CODEX_LESSON_IDS.map((id) => getCodexLesson(id, locale)),
  );
  return orderedLessons(all.filter((lesson): lesson is CodexLesson => lesson != null));
}

export function getCodexTracks(locale: Locale): readonly CodexTrack[] {
  return TRACKS[locale];
}

export function getCodexTotalLessons(): number {
  return CODEX_LESSON_IDS.length;
}

let registryPromise: Promise<
  TechnicalCourseLocaleRegistry<"codex", CodexLocaleContent>
> | null = null;

export function getCodexLocaleRegistry(): Promise<
  TechnicalCourseLocaleRegistry<"codex", CodexLocaleContent>
> {
  registryPromise ??= Promise.all([
    getAllCodexLessons("en"),
    getAllCodexLessons("de"),
  ]).then(([enLessons, deLessons]) => {
    const enBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "codex",
      locale: "en",
      config: CODEX_CONFIG,
      identity: extractCodexContentIdentity(enLessons, CODEX_TRACKS),
      content: { lessons: enLessons, tracks: CODEX_TRACKS },
    });
    const deBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "codex",
      locale: "de",
      config: CODEX_CONFIG_DE,
      identity: extractCodexContentIdentity(deLessons, CODEX_TRACKS_DE),
      content: { lessons: deLessons, tracks: CODEX_TRACKS_DE },
    });
    return createTechnicalCourseLocaleRegistry({
      courseSlug: "codex",
      sourceLocale: "en",
      bundles: { en: enBundle, de: deBundle },
    });
  });
  return registryPromise;
}

export async function getCodexLocaleBundle<L extends Locale>(
  locale: L,
): Promise<CodexLocaleBundle<L>> {
  const registry = await getCodexLocaleRegistry();
  return registry.get(locale);
}

/** Test-only: clear per-locale lesson and registry caches between cases. */
export function __resetCodexLessonCacheForTests(): void {
  lessonCaches.de.clear();
  lessonCaches.en.clear();
  registryPromise = null;
}
