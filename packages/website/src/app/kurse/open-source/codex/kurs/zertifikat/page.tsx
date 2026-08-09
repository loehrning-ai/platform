import { CertificatePage } from "@/components/course/kurs/certificate-page";
import { getCodexLocaleRegistry } from "@/lib/codex/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function CodexZertifikatPage() {
  const locale = await getRequestLocale();
  (await getCodexLocaleRegistry()).get(locale);
  return <CertificatePage courseSlug="codex" locale={locale} />;
}
