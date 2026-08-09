import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function ClaudeQuizPage() {
  const locale = await getRequestLocale();
  return <WorkshopQuizPage courseSlug="claude" locale={locale} />;
}
