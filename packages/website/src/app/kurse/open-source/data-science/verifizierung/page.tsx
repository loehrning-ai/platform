import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getDsLocaleRegistry } from "@/lib/data-science/content";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataScienceVerifizierungPage() {
  const locale = await getRequestLocale();
  (await getDsLocaleRegistry()).get(locale);
  return <VerificationPage courseSlug="data-science" locale={locale} />;
}
