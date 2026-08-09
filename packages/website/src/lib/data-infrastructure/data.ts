import type { Locale } from "@/lib/i18n/locale";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleRegistry,
} from "@/lib/technical-courses/localization";
import {
  DATA_INFRASTRUCTURE_CONFIG,
  DATA_INFRASTRUCTURE_CONFIG_DE,
} from "./config";
import type {
  DataInfraLesson,
  DataInfraLessonId,
  DataInfraTrack,
} from "./types";
import {
  checkpointLessonId,
  DATA_INFRA_LESSON_IDS,
  DATA_INFRA_TRACKS,
  DATA_INFRA_TRACKS_DE,
} from "./types";

type LessonModule = { default: DataInfraLesson };
type LessonLoader = () => Promise<LessonModule>;

const EN_LESSON_LOADERS: Record<DataInfraLessonId, LessonLoader> = {
  "mental-model": () => import("./lessons/mental-model"),
  "cap-pacelc": () => import("./lessons/cap-pacelc"),
  modeling: () => import("./lessons/modeling"),
  "storage-formats": () => import("./lessons/storage-formats"),
  lakehouse: () => import("./lessons/lakehouse"),
  partitioning: () => import("./lessons/partitioning"),
  "batch-elt": () => import("./lessons/batch-elt"),
  streaming: () => import("./lessons/streaming"),
  "cdc-lambda-kappa": () => import("./lessons/cdc-lambda-kappa"),
  idempotency: () => import("./lessons/idempotency"),
  "sla-quality": () => import("./lessons/sla-quality"),
  "interview-playbook": () => import("./lessons/interview-playbook"),
};

const DE_LESSON_LOADERS: Record<DataInfraLessonId, LessonLoader> = {
  "mental-model": () => import("./lessons/de/mental-model"),
  "cap-pacelc": () => import("./lessons/de/cap-pacelc"),
  modeling: () => import("./lessons/de/modeling"),
  "storage-formats": () => import("./lessons/de/storage-formats"),
  lakehouse: () => import("./lessons/de/lakehouse"),
  partitioning: () => import("./lessons/de/partitioning"),
  "batch-elt": () => import("./lessons/de/batch-elt"),
  streaming: () => import("./lessons/de/streaming"),
  "cdc-lambda-kappa": () => import("./lessons/de/cdc-lambda-kappa"),
  idempotency: () => import("./lessons/de/idempotency"),
  "sla-quality": () => import("./lessons/de/sla-quality"),
  "interview-playbook": () => import("./lessons/de/interview-playbook"),
};

const LESSON_LOADERS = Object.freeze({
  de: DE_LESSON_LOADERS,
  en: EN_LESSON_LOADERS,
}) satisfies Readonly<Record<Locale, Record<DataInfraLessonId, LessonLoader>>>;

const TRACKS = Object.freeze({
  de: DATA_INFRA_TRACKS_DE,
  en: DATA_INFRA_TRACKS,
}) satisfies Readonly<Record<Locale, readonly DataInfraTrack[]>>;

const lessonCaches: Record<Locale, Map<DataInfraLessonId, DataInfraLesson>> = {
  de: new Map(),
  en: new Map(),
};

export interface DataInfraLocaleContent {
  readonly lessons: readonly DataInfraLesson[];
  readonly tracks: readonly DataInfraTrack[];
}

export type DataInfraLocaleBundle<L extends Locale = Locale> =
  TechnicalCourseLocaleBundle<"data-infrastructure", L, DataInfraLocaleContent>;

const BESPOKE_CHECKPOINTS: Readonly<
  Record<DataInfraLessonId, readonly string[]>
> = {
  "mental-model": ["flow"],
  "cap-pacelc": ["cap"],
  modeling: ["rc"],
  "storage-formats": ["rc", "bf"],
  lakehouse: ["snap"],
  partitioning: ["part"],
  "batch-elt": ["dag"],
  streaming: ["kafka", "wm"],
  "cdc-lambda-kappa": ["cdc"],
  idempotency: ["bdag"],
  "sla-quality": ["sla"],
  "interview-playbook": ["iv"],
};

function orderedLessons(
  lessons: readonly DataInfraLesson[],
): readonly DataInfraLesson[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  return DATA_INFRA_LESSON_IDS.map((id) => {
    const lesson = byId.get(id);
    if (!lesson)
      throw new Error(`Data Infrastructure bundle is missing lesson "${id}".`);
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

export function extractDataInfraContentIdentity(
  lessons: readonly DataInfraLesson[],
  tracks: readonly DataInfraTrack[],
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
          `Data Infrastructure ${lesson.id} has an invalid quiz identity.`,
        );
      }
      const questionId = `${checkpointLessonId(lesson.id)}::${cpId}`;
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
      if (lessonId !== checkpointLessonId(lesson.id)) {
        throw new Error(
          `Data Infrastructure ${lesson.id} carries another lesson's checkpoint identity.`,
        );
      }
      return [`${lessonId}::${cpId}`];
    }),
    ...BESPOKE_CHECKPOINTS[lesson.id].map(
      (cpId) => `${checkpointLessonId(lesson.id)}::${cpId}`,
    ),
  ]);

  return defineTechnicalCourseContentIdentity("data-infrastructure", {
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

export async function getDataInfraLesson(
  id: DataInfraLessonId,
  locale: Locale = "en",
): Promise<DataInfraLesson | undefined> {
  const cache = lessonCaches[locale];
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = LESSON_LOADERS[locale][id];
  if (!loader) return undefined;
  const mod = await loader();
  cache.set(id, mod.default);
  return mod.default;
}

export async function getAllDataInfraLessons(
  locale: Locale = "en",
): Promise<readonly DataInfraLesson[]> {
  const all = await Promise.all(
    DATA_INFRA_LESSON_IDS.map((id) => getDataInfraLesson(id, locale)),
  );
  return orderedLessons(
    all.filter((lesson): lesson is DataInfraLesson => lesson != null),
  );
}

export function getDataInfraTracks(
  locale: Locale = "en",
): readonly DataInfraTrack[] {
  return TRACKS[locale];
}

export function getDataInfraTotalLessons(): number {
  return DATA_INFRA_LESSON_IDS.length;
}

let registryPromise: Promise<
  TechnicalCourseLocaleRegistry<"data-infrastructure", DataInfraLocaleContent>
> | null = null;

export function getDataInfraLocaleRegistry(): Promise<
  TechnicalCourseLocaleRegistry<"data-infrastructure", DataInfraLocaleContent>
> {
  registryPromise ??= Promise.all([
    getAllDataInfraLessons("en"),
    getAllDataInfraLessons("de"),
  ]).then(([enLessons, deLessons]) => {
    const enBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "data-infrastructure",
      locale: "en",
      config: DATA_INFRASTRUCTURE_CONFIG,
      identity: extractDataInfraContentIdentity(enLessons, DATA_INFRA_TRACKS),
      content: { lessons: enLessons, tracks: DATA_INFRA_TRACKS },
    });
    const deBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "data-infrastructure",
      locale: "de",
      config: DATA_INFRASTRUCTURE_CONFIG_DE,
      identity: extractDataInfraContentIdentity(
        deLessons,
        DATA_INFRA_TRACKS_DE,
      ),
      content: { lessons: deLessons, tracks: DATA_INFRA_TRACKS_DE },
    });
    return createTechnicalCourseLocaleRegistry({
      courseSlug: "data-infrastructure",
      sourceLocale: "en",
      bundles: { de: deBundle, en: enBundle },
    });
  });
  return registryPromise;
}

export async function getDataInfraLocaleBundle<L extends Locale>(
  locale: L,
): Promise<DataInfraLocaleBundle<L>> {
  return (await getDataInfraLocaleRegistry()).get(locale);
}

/** Test-only cache reset. */
export function __resetDataInfraLessonCacheForTests(): void {
  lessonCaches.de.clear();
  lessonCaches.en.clear();
  registryPromise = null;
}
