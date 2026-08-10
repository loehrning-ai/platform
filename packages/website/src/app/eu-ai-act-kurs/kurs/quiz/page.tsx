import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function EuAiActQuizPage() {
  const locale = resolveFoundationCourseContentLocale(
    "eu-ai-act-kurs",
    await getRequestLocale(),
  );
  return <WorkshopQuizPage courseSlug="eu-ai-act-kurs" locale={locale} />;
}
