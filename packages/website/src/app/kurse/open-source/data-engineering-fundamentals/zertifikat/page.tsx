import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getDefLocaleRegistry } from "@/lib/data-engineering-fundamentals/content";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataEngineeringFundamentalsZertifikatPage() {
  const locale = await getRequestLocale();
  (await getDefLocaleRegistry()).get(locale);
  return (
    <CertificatePage
      courseSlug="data-engineering-fundamentals"
      locale={locale}
    />
  );
}
