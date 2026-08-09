import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getAiNativeOperatorLocaleRegistry } from "@/lib/ai-native-operator/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function AiNativeOperatorZertifikatPage() {
  const locale = await getRequestLocale();
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  return <CertificatePage courseSlug="ai-native-operator" locale={locale} />;
}
