import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function KiFuehrerscheinQuizPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-fuehrerschein",
    await getRequestLocale(),
  );
  return <WorkshopQuizPage courseSlug="ki-fuehrerschein" locale={locale} />;
}
