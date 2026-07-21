// ─── Data Infrastructure course content loader (plan 010 stage 3) ───
//
// Structured as a Record<DataInfraLessonId, () => Promise<...>> loader map,
// mirroring `lib/codex/data.ts`'s LESSON_LOADERS: a per-lesson dynamic
// import(), not one eagerly-imported array, so no lesson route's bundle
// pays for a sibling lesson's content.

import type { DataInfraLesson, DataInfraLessonId } from "./types";
import { DATA_INFRA_LESSON_IDS, DATA_INFRA_TRACKS } from "./types";

const LESSON_LOADERS: Record<
  DataInfraLessonId,
  () => Promise<{ default: DataInfraLesson }>
> = {
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

// Memoized per lesson so a single request that touches a lesson more than
// once (e.g. metadata + page render) imports its module only once.
const lessonCache = new Map<DataInfraLessonId, DataInfraLesson>();

export async function getDataInfraLesson(
  id: DataInfraLessonId,
): Promise<DataInfraLesson | undefined> {
  const cached = lessonCache.get(id);
  if (cached) return cached;
  const loader = LESSON_LOADERS[id];
  if (!loader) return undefined;
  const mod = await loader();
  lessonCache.set(id, mod.default);
  return mod.default;
}

export async function getAllDataInfraLessons(): Promise<readonly DataInfraLesson[]> {
  const all = await Promise.all(DATA_INFRA_LESSON_IDS.map(getDataInfraLesson));
  return all
    .filter((l): l is DataInfraLesson => l != null)
    .sort((a, b) => a.number - b.number);
}

export function getDataInfraTracks() {
  return DATA_INFRA_TRACKS;
}

export function getDataInfraTotalLessons(): number {
  return DATA_INFRA_LESSON_IDS.length;
}

/** Test-only: clear the per-lesson cache between cases. */
export function __resetDataInfraLessonCacheForTests(): void {
  lessonCache.clear();
}
