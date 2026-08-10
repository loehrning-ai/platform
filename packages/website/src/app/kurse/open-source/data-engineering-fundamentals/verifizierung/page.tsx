import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getDefLocaleRegistry } from "@/lib/data-engineering-fundamentals/content";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataEngineeringFundamentalsVerifizierungPage() {
  const locale = await getRequestLocale();
  (await getDefLocaleRegistry()).get(locale);
  return (
    <VerificationPage
      courseSlug="data-engineering-fundamentals"
      locale={locale}
    />
  );
}
