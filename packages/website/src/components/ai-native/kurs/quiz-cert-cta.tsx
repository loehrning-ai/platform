import { CourseAssessmentCta } from "@/components/course/kurs/course-assessment-cta";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Backward-compatible AI-Native course wrapper.
 *
 * The shared CTA now owns the progress gate, localized copy, retake path, and
 * capstone-based certificate alternative. Keeping this wrapper preserves the
 * established course-index import while removing the stale always-open link.
 */
export function AiNativeQuizCertCta({ locale }: { readonly locale?: Locale }) {
  return <CourseAssessmentCta courseSlug="ai-native" locale={locale} />;
}
