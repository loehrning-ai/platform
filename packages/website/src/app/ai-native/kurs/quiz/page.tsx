import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function AiNativeQuizPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return <WorkshopQuizPage courseSlug="ai-native" locale={locale} />;
}
