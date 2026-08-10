import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function EuAiActVerifizierungPage() {
  const locale = resolveFoundationCourseContentLocale(
    "eu-ai-act-kurs",
    await getRequestLocale(),
  );
  return <VerificationPage courseSlug="eu-ai-act-kurs" locale={locale} />;
}
