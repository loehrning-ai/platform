import type { Metadata } from "next";
import { FluencyTest } from "@/components/ai-native/fluency-test";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { SITE_URL } from "@/lib/seo/json-ld";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const title =
    locale === "en"
      ? "Workflow self-assessment: AI-Native course"
      : "Workflow-Selbsttest: AI-Native Arbeitskurs";
  const description =
    locale === "en"
      ? "Ten workplace scenarios across drafting, delegation, automation, knowledge and governance. A local self-assessment, not a standardized test."
      : "Zehn Arbeitsszenarien zu Entwurf, Delegation, Automatisierung, Wissen und Governance. Lokale Selbstprüfung, kein standardisierter Test.";
  const localizedPath = localizeHref("/ai-native/fluency-test", locale);
  const url = `${SITE_URL}${localizedPath}`;
  const alternates = buildLocaleAlternates("/ai-native/fluency-test", ["de", "en"]);
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
    },
  };
}

export default async function FluencyTestPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return <FluencyTest locale={locale} />;
}
