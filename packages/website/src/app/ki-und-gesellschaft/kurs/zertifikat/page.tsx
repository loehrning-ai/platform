import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function KiUndGesellschaftZertifikatPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-und-gesellschaft",
    await getRequestLocale(),
  );
  return <CertificatePage courseSlug="ki-und-gesellschaft" locale={locale} />;
}
