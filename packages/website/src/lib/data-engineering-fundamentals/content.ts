import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import {
  createTechnicalCourseLocaleRegistry,
  defineTechnicalCourseContentIdentity,
  defineTechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleBundle,
  type TechnicalCourseLocaleRegistry,
} from "@/lib/technical-courses/localization";
import {
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
} from "./config";
import {
  DEF_TRANSLATED_ADVANCED_IDENTITY,
  __resetDefTranslatedAdvancedChapterCacheForTests,
  getDefTranslatedAdvancedChapterComponent,
  getDefTranslatedAdvancedChapterMeta,
  isDefTranslatedAdvancedChapterId,
} from "./localized-advanced-content";
import {
  DEF_TRANSLATED_CORE_IDENTITY,
  __resetDefTranslatedCoreChapterCacheForTests,
  getDefTranslatedCoreChapterComponent,
  getDefTranslatedCoreChapterMeta,
  isDefTranslatedCoreChapterId,
} from "./localized-core-content";
import type { ChapterMeta, DefChapterId } from "./types";
import { DEF_CHAPTER_IDS, isDefChapterId } from "./types";

export interface ChapterBodyProps {
  readonly chapter: ChapterMeta;
}

export type DefChapterComponent = ComponentType<ChapterBodyProps>;

export interface DefLocalizedChapter {
  readonly id: DefChapterId;
  readonly meta: ChapterMeta;
  readonly component: DefChapterComponent;
  readonly sectionIds: readonly string[];
}

export interface DefLocaleContent {
  readonly chapters: readonly DefLocalizedChapter[];
}

export type DefLocaleBundle<L extends Locale = Locale> =
  TechnicalCourseLocaleBundle<
    "data-engineering-fundamentals",
    L,
    DefLocaleContent
  >;

/**
 * Machine identity stays outside translated prose. These are the exact
 * section anchors extracted and reviewed with the two translation tranches.
 */
export const DEF_SECTION_IDS_BY_CHAPTER = Object.freeze({
  ...DEF_TRANSLATED_CORE_IDENTITY.sectionIdsByChapter,
  ...DEF_TRANSLATED_ADVANCED_IDENTITY.sectionIdsByChapter,
}) satisfies Readonly<Record<DefChapterId, readonly string[]>>;

export function getDefLocalizedChapterMeta(
  id: DefChapterId,
  locale: Locale,
): ChapterMeta {
  if (isDefTranslatedCoreChapterId(id)) {
    return getDefTranslatedCoreChapterMeta(id, locale);
  }
  if (isDefTranslatedAdvancedChapterId(id)) {
    return getDefTranslatedAdvancedChapterMeta(id, locale);
  }
  throw new Error(
    `Data Engineering Fundamentals is missing localized metadata for chapter "${id}".`,
  );
}

export async function getDefChapterComponent(
  id: DefChapterId,
  locale: Locale,
): Promise<DefChapterComponent | undefined> {
  if (!isDefChapterId(id)) return undefined;
  if (isDefTranslatedCoreChapterId(id)) {
    return getDefTranslatedCoreChapterComponent(id, locale);
  }
  if (isDefTranslatedAdvancedChapterId(id)) {
    return getDefTranslatedAdvancedChapterComponent(id, locale);
  }
  return undefined;
}

export async function getAllDefLocalizedChapters(
  locale: Locale,
): Promise<readonly DefLocalizedChapter[]> {
  return Promise.all(
    DEF_CHAPTER_IDS.map(async (id) => {
      const component = await getDefChapterComponent(id, locale);
      if (!component) {
        throw new Error(
          `Data Engineering Fundamentals is missing reviewed ${locale} chapter "${id}".`,
        );
      }
      return Object.freeze({
        id,
        meta: getDefLocalizedChapterMeta(id, locale),
        component,
        sectionIds: DEF_SECTION_IDS_BY_CHAPTER[id],
      });
    }),
  );
}

export async function getAllDefChapterComponents(
  locale: Locale,
): Promise<ReadonlyMap<DefChapterId, DefChapterComponent>> {
  const chapters = await getAllDefLocalizedChapters(locale);
  return new Map(chapters.map((chapter) => [chapter.id, chapter.component]));
}

/** Derive canonical route, progress, and section identity from real content. */
export function extractDefContentIdentity(
  chapters: readonly DefLocalizedChapter[],
) {
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const ordered = DEF_CHAPTER_IDS.map((id) => {
    const chapter = chapterById.get(id);
    if (!chapter) {
      throw new Error(
        `Data Engineering Fundamentals locale bundle is missing chapter "${id}".`,
      );
    }
    return chapter;
  });

  return defineTechnicalCourseContentIdentity("data-engineering-fundamentals", {
    unitIds: [],
    contentItemIds: ordered.map((chapter) => chapter.id),
    progressKeys: ordered.map((chapter) => chapter.id),
    sectionIdsByProgressKey: Object.fromEntries(
      ordered.map((chapter) => [chapter.id, chapter.sectionIds]),
    ),
    workshopQuestions: [],
    checkpointKeys: [],
  });
}

let registryPromise: Promise<
  TechnicalCourseLocaleRegistry<
    "data-engineering-fundamentals",
    DefLocaleContent
  >
> | null = null;

export function getDefLocaleRegistry(): Promise<
  TechnicalCourseLocaleRegistry<
    "data-engineering-fundamentals",
    DefLocaleContent
  >
> {
  registryPromise ??= Promise.all([
    getAllDefLocalizedChapters("en"),
    getAllDefLocalizedChapters("de"),
  ]).then(([enChapters, deChapters]) => {
    const enBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "data-engineering-fundamentals",
      locale: "en",
      config: DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
      identity: extractDefContentIdentity(enChapters),
      content: { chapters: enChapters },
    });
    const deBundle = defineTechnicalCourseLocaleBundle({
      courseSlug: "data-engineering-fundamentals",
      locale: "de",
      config: DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
      identity: extractDefContentIdentity(deChapters),
      content: { chapters: deChapters },
    });
    return createTechnicalCourseLocaleRegistry({
      courseSlug: "data-engineering-fundamentals",
      sourceLocale: "en",
      bundles: { en: enBundle, de: deBundle },
    });
  });
  return registryPromise;
}

export async function getDefLocaleBundle<L extends Locale>(
  locale: L,
): Promise<DefLocaleBundle<L>> {
  return (await getDefLocaleRegistry()).get(locale);
}

/** Test-only: clear all locale-specific component and registry caches. */
export function __resetDefChapterCacheForTests(): void {
  __resetDefTranslatedCoreChapterCacheForTests();
  __resetDefTranslatedAdvancedChapterCacheForTests();
  registryPromise = null;
}
