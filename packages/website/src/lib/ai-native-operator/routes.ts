// ─── AI-Native Operator Course route helpers (plan 013 stage 7) ─────────
//
// No "/kurs" segment (mirroring data-engineering-fundamentals/data-science):
// modules and lessons live directly under the course root.

import type { ModuleId } from "./types";

export const AI_NATIVE_OPERATOR_BASE_PATH = "/kurse/open-source/ai-native-operator";

export function courseHref(): string {
  return AI_NATIVE_OPERATOR_BASE_PATH;
}

export function moduleHref(moduleId: ModuleId): string {
  return `${AI_NATIVE_OPERATOR_BASE_PATH}/${moduleId}`;
}

export function lessonHref(moduleId: ModuleId, lessonNumber: number): string {
  return `${AI_NATIVE_OPERATOR_BASE_PATH}/${moduleId}/${lessonNumber}`;
}
