import { VerificationPage } from "@/components/course/kurs/verification-page";
import { getCodexLocaleRegistry } from "@/lib/codex/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function CodexVerifizierungPage() {
  const locale = await getRequestLocale();
  (await getCodexLocaleRegistry()).get(locale);
  return <VerificationPage courseSlug="codex" locale={locale} />;
}
