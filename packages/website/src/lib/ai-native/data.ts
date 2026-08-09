import type {
  AiNativeLesson,
  AiNativeModule,
  AiNativeCourseMeta,
  ModuleId,
} from "./types";
import { MODULE_IDS } from "./types";
import type { Locale } from "@/lib/i18n/locale";

// The module index + course meta stay statically imported: they are small
// (~4 KB combined) and feed synchronous, client-safe reads (getModules used
// by landing-page client components).
import modulesIndex from "../../../content/ai-native/modules.json";
import courseMeta from "../../../content/ai-native/course.json";
import modulesIndexEn from "../../../content/ai-native/en/modules.json";
import courseMetaEn from "../../../content/ai-native/en/course.json";

// Lesson JSON (~223 KB across 4 modules) is loaded PER MODULE via dynamic
// import (shared course architecture). This keeps the heavy lesson bodies out of any
// chunk that only needs the module index, and lets each route fetch just the
// module it renders. Loaders are async; only server components await them.
// Loaders return the raw JSON module; we narrow to AiNativeLesson[] at the
// call site (the JSON's `moduleId` is a plain string, mirroring the cast the
// previous static-import version used).
const LESSON_LOADERS: Partial<
  Record<Locale, Record<ModuleId, () => Promise<{ default: unknown }>>>
> = {
  de: {
    modul_1: () => import("../../../content/ai-native/modul-1-lessons.json"),
    modul_2: () => import("../../../content/ai-native/modul-2-lessons.json"),
    modul_3: () => import("../../../content/ai-native/modul-3-lessons.json"),
    modul_4: () => import("../../../content/ai-native/modul-4-lessons.json"),
  },
  en: {
    modul_1: () => import("../../../content/ai-native/en/modul-1-lessons.json"),
    modul_2: () => import("../../../content/ai-native/en/modul-2-lessons.json"),
    modul_3: () => import("../../../content/ai-native/en/modul-3-lessons.json"),
    modul_4: () => import("../../../content/ai-native/en/modul-4-lessons.json"),
  },
};

// Memoize resolved module lessons so a single request that touches a module
// more than once (e.g. metadata + page render) imports the JSON only once.
const lessonCache = new Map<string, readonly AiNativeLesson[]>();

const MODULES_INDEX: Partial<Record<Locale, readonly AiNativeModule[]>> = {
  de: (modulesIndex as { modules: AiNativeModule[] }).modules,
  en: (modulesIndexEn as { modules: AiNativeModule[] }).modules,
};
const COURSE_META: Partial<Record<Locale, AiNativeCourseMeta>> = {
  de: courseMeta as AiNativeCourseMeta,
  en: courseMetaEn as AiNativeCourseMeta,
};

function modulesFor(locale: Locale): readonly AiNativeModule[] {
  const modules = MODULES_INDEX[locale];
  if (!modules) {
    throw new Error(
      `AI-Native has no audited "${locale}" module index registered.`,
    );
  }
  return modules;
}

export function getModules(locale: Locale = "de"): readonly AiNativeModule[] {
  return modulesFor(locale);
}

export function getModule(
  moduleId: ModuleId,
  locale: Locale = "de",
): AiNativeModule | undefined {
  return modulesFor(locale).find((m) => m.id === moduleId);
}

export async function getModuleLessons(
  moduleId: ModuleId,
  locale: Locale = "de",
): Promise<readonly AiNativeLesson[]> {
  modulesFor(locale);
  const cacheKey = `${locale}:${moduleId}`;
  const cached = lessonCache.get(cacheKey);
  if (cached) return cached;
  const loader = LESSON_LOADERS[locale]?.[moduleId];
  if (!loader) {
    throw new Error(
      `AI-Native has no audited "${locale}" lessons registered for "${moduleId}".`,
    );
  }
  const mod = await loader();
  const lessons = (mod.default as { lessons: AiNativeLesson[] }).lessons;
  lessonCache.set(cacheKey, lessons);
  return lessons;
}

export async function getLesson(
  moduleId: ModuleId,
  lessonId: string,
  locale: Locale = "de",
): Promise<AiNativeLesson | undefined> {
  const lessons = await getModuleLessons(moduleId, locale);
  return lessons.find((l) => l.id === lessonId);
}

export async function getAllLessons(
  locale: Locale = "de",
): Promise<readonly AiNativeLesson[]> {
  const perModule = await Promise.all(
    MODULE_IDS.map((id) => getModuleLessons(id, locale)),
  );
  return perModule.flat();
}

export function getCourseMeta(locale: Locale = "de"): AiNativeCourseMeta {
  const meta = COURSE_META[locale];
  if (!meta) {
    throw new Error(
      `AI-Native has no audited "${locale}" course metadata registered.`,
    );
  }
  return meta;
}

/** Test-only: clear the per-module lesson cache between cases. */
export function __resetLessonCacheForTests(): void {
  lessonCache.clear();
}
