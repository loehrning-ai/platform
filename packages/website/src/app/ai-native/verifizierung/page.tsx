import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function AiNativeVerifizierungPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return <VerificationPage courseSlug="ai-native" locale={locale} />;
}
