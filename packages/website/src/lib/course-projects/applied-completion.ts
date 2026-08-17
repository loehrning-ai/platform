import type { CourseSlug } from "@/lib/course/types";
import { getUnifiedState } from "@/lib/progress/store";

import { hasAppliedProjectCompletion } from "./identity";

/**
 * Read the exact, artifact-bearing applied-project exercise milestone.
 *
 * This lives here rather than in the progress store on purpose. The store is
 * reachable from the root layout's client graph — layout.tsx renders
 * LearningOwnerBoundary, whose runtime imports the store — so anything the
 * store imports ships to every page. Reading this milestone needs
 * hasAppliedProjectCompletion, which value-imports the course-project
 * persistence module, and that pulled roughly 34 KB of artifact parsing and
 * validation onto routes that have no project on them at all.
 *
 * Depending on the store from this direction keeps that graph one-way: the
 * store stays free of course-project code, and this module loads only where a
 * project milestone is actually read.
 */
export function isAppliedProjectCompleted(slug: CourseSlug): boolean {
  return hasAppliedProjectCompletion(getUnifiedState(), slug);
}
