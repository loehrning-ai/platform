// ─── AI-Native Operator Course route helpers ─────────
//
// No "/kurs" segment (mirroring data-engineering-fundamentals/data-science):
// modules and lessons live directly under the course root.

import type { ModuleId } from "./types";
import type { Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

export const AI_NATIVE_OPERATOR_BASE_PATH =
  "/kurse/open-source/ai-native-operator";

export function courseHref(locale: Locale = "de"): string {
  return technicalCourseHref("ai-native-operator", locale, {
    kind: "landing",
  });
}

export function moduleHref(moduleId: ModuleId, locale: Locale = "de"): string {
  return technicalCourseHref("ai-native-operator", locale, {
    kind: "module",
    moduleId,
  });
}

export function lessonHref(
  moduleId: ModuleId,
  lessonNumber: number,
  locale: Locale = "de",
): string {
  return technicalCourseHref("ai-native-operator", locale, {
    kind: "lesson",
    moduleId,
    lessonNumber,
  });
}

export function quizHref(locale: Locale = "de"): string {
  return technicalCourseHref("ai-native-operator", locale, { kind: "quiz" });
}
