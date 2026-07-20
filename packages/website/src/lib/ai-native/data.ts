import type {
  AiNativeLesson,
  AiNativeModule,
  AiNativeCourseMeta,
  ModuleId,
} from "./types";
import { MODULE_IDS } from "./types";

// The module index + course meta stay statically imported: they are small
// (~4 KB combined) and feed synchronous, client-safe reads (getModules used
// by landing-page client components).
import modulesIndex from "../../../content/ai-native/modules.json";
import courseMeta from "../../../content/ai-native/course.json";

// Lesson JSON (~223 KB across 4 modules) is loaded PER MODULE via dynamic
// import (shared course architecture). This keeps the heavy lesson bodies out of any
// chunk that only needs the module index, and lets each route fetch just the
// module it renders. Loaders are async; only server components await them.
// Loaders return the raw JSON module; we narrow to AiNativeLesson[] at the
// call site (the JSON's `moduleId` is a plain string, mirroring the cast the
// previous static-import version used).
const LESSON_LOADERS: Record<ModuleId, () => Promise<{ default: unknown }>> = {
  modul_1: () => import("../../../content/ai-native/modul-1-lessons.json"),
  modul_2: () => import("../../../content/ai-native/modul-2-lessons.json"),
  modul_3: () => import("../../../content/ai-native/modul-3-lessons.json"),
  modul_4: () => import("../../../content/ai-native/modul-4-lessons.json"),
};

// Memoize resolved module lessons so a single request that touches a module
// more than once (e.g. metadata + page render) imports the JSON only once.
const lessonCache = new Map<ModuleId, readonly AiNativeLesson[]>();

const MODULES_INDEX = (modulesIndex as { modules: AiNativeModule[] }).modules;
const COURSE_META = courseMeta as AiNativeCourseMeta;

export function getModules(): readonly AiNativeModule[] {
  return MODULES_INDEX;
}

export function getModule(moduleId: ModuleId): AiNativeModule | undefined {
  return MODULES_INDEX.find((m) => m.id === moduleId);
}

export async function getModuleLessons(
  moduleId: ModuleId,
): Promise<readonly AiNativeLesson[]> {
  const cached = lessonCache.get(moduleId);
  if (cached) return cached;
  const loader = LESSON_LOADERS[moduleId];
  if (!loader) return [];
  const mod = await loader();
  const lessons = (mod.default as { lessons: AiNativeLesson[] }).lessons;
  lessonCache.set(moduleId, lessons);
  return lessons;
}

export async function getLesson(
  moduleId: ModuleId,
  lessonId: string,
): Promise<AiNativeLesson | undefined> {
  const lessons = await getModuleLessons(moduleId);
  return lessons.find((l) => l.id === lessonId);
}

export async function getAllLessons(): Promise<readonly AiNativeLesson[]> {
  const perModule = await Promise.all(MODULE_IDS.map((id) => getModuleLessons(id)));
  return perModule.flat();
}

export function getCourseMeta(): AiNativeCourseMeta {
  return COURSE_META;
}

/** Test-only: clear the per-module lesson cache between cases. */
export function __resetLessonCacheForTests(): void {
  lessonCache.clear();
}
