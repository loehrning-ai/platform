import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export default async function KiFuehrerscheinVerifizierungPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ki-fuehrerschein",
    await getRequestLocale(),
  );
  return <VerificationPage courseSlug="ki-fuehrerschein" locale={locale} />;
}
