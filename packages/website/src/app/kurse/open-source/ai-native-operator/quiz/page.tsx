import { WorkshopQuizPage } from "@/components/course/kurs/workshop-quiz-page";
import { getAiNativeOperatorLocaleRegistry } from "@/lib/ai-native-operator/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function AiNativeOperatorQuizPage() {
  const locale = await getRequestLocale();
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  return <WorkshopQuizPage courseSlug="ai-native-operator" locale={locale} />;
}
