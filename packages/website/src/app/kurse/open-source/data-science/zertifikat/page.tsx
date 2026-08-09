import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getDsLocaleRegistry } from "@/lib/data-science/content";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataScienceZertifikatPage() {
  const locale = await getRequestLocale();
  (await getDsLocaleRegistry()).get(locale);
  return <CertificatePage courseSlug="data-science" locale={locale} />;
}
