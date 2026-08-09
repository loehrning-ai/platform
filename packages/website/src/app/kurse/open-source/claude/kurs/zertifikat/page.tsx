import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function ClaudeZertifikatPage() {
  const locale = await getRequestLocale();
  return <CertificatePage courseSlug="claude" locale={locale} />;
}
