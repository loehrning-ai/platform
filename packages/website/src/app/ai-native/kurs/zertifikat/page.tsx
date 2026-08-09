import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function AiNativeZertifikatPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return <CertificatePage courseSlug="ai-native" locale={locale} />;
}
