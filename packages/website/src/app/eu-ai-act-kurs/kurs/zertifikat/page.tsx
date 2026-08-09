import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function EuAiActZertifikatPage() {
  const locale = resolveFoundationCourseContentLocale(
    "eu-ai-act-kurs",
    await getRequestLocale(),
  );
  return <CertificatePage courseSlug="eu-ai-act-kurs" locale={locale} />;
}
