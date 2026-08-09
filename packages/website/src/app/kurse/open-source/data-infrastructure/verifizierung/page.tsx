import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function DataInfrastructureVerifizierungPage() {
  const locale = await getRequestLocale();
  return <VerificationPage courseSlug="data-infrastructure" locale={locale} />;
}
