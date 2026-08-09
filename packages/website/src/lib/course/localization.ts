import type { Locale } from "@/lib/i18n/locale";
import type { CourseConfig, CourseSlug } from "./types";

export const FOUNDATION_COURSE_SLUGS = [
  "ki-fuehrerschein",
  "ki-und-gesellschaft",
  "eu-ai-act-kurs",
  "ai-native",
] as const satisfies readonly CourseSlug[];

export type FoundationCourseSlug = (typeof FOUNDATION_COURSE_SLUGS)[number];

/**
 * This is an internal content-readiness gate, not an SEO parity claim.
 * Add `en` only in the same change that registers the complete reviewed
 * English config, lesson/module, glossary, and workshop-quiz bundle.
 */
const AUDITED_CONTENT_LOCALES: Readonly<
  Record<FoundationCourseSlug, readonly Locale[]>
> = {
  "ki-fuehrerschein": ["de", "en"],
  "ki-und-gesellschaft": ["de", "en"],
  "eu-ai-act-kurs": ["de", "en"],
  "ai-native": ["de", "en"],
};

export function isFoundationCourseSlug(
  courseSlug: CourseSlug,
): courseSlug is FoundationCourseSlug {
  return (FOUNDATION_COURSE_SLUGS as readonly CourseSlug[]).includes(
    courseSlug,
  );
}

export function getAuditedCourseContentLocales(
  courseSlug: FoundationCourseSlug,
): readonly Locale[] {
  return AUDITED_CONTENT_LOCALES[courseSlug];
}

export function hasAuditedCourseContentLocale(
  courseSlug: FoundationCourseSlug,
  locale: Locale,
): boolean {
  return AUDITED_CONTENT_LOCALES[courseSlug].includes(locale);
}

/**
 * Resolve a request to a complete reviewed bundle. German remains the
 * fail-closed fallback until the requested locale is explicitly audited.
 */
export function resolveFoundationCourseContentLocale(
  courseSlug: FoundationCourseSlug,
  requestedLocale: Locale,
): Locale {
  return hasAuditedCourseContentLocale(courseSlug, requestedLocale)
    ? requestedLocale
    : "de";
}

export type LocalizedCourseConfigCopy = Pick<
  CourseConfig,
  | "title"
  | "certificateTitle"
  | "certificateSubtitle"
  | "certificateModules"
  | "certificateReferenceLabel"
  | "quizPassMessage"
  | "certificateFileStem"
  | "recordNoun"
>;

/**
 * Builds translated config copy while inheriting every structural and
 * progress-relevant field from the canonical config.
 */
export function createLocalizedCourseConfig(
  canonical: CourseConfig,
  locale: Locale,
  copy: LocalizedCourseConfigCopy,
): CourseConfig {
  return {
    ...canonical,
    ...copy,
    language: locale,
  };
}
