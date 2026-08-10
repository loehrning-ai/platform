import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataInfrastructureZertifikatPage() {
  const locale = await getRequestLocale();
  return <CertificatePage courseSlug="data-infrastructure" locale={locale} />;
}
