import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function KiUndGesellschaftQuizPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-und-gesellschaft",
    await getRequestLocale(),
  );
  return <WorkshopQuizPage courseSlug="ki-und-gesellschaft" locale={locale} />;
}
