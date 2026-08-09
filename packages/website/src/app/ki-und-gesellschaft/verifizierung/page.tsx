import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function KiUndGesellschaftVerifizierungPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-und-gesellschaft",
    await getRequestLocale(),
  );
  return <VerificationPage courseSlug="ki-und-gesellschaft" locale={locale} />;
}
