import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getAiNativeOperatorLocaleRegistry } from "@/lib/ai-native-operator/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function AiNativeOperatorVerifizierungPage() {
  const locale = await getRequestLocale();
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  return <VerificationPage courseSlug="ai-native-operator" locale={locale} />;
}
