import type { Metadata } from "next";
import { DemosGalleryView } from "@/components/ai-native/demos-gallery-view";
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
      ? "Course simulations: AI-Native Workflow Course"
      : "Kurssimulationen: AI-Native Arbeitskurs";
  const description =
    locale === "en"
      ? "Nine browser simulations linked to AI-Native course lessons. Synthetic data, explicit assumptions and no provider request."
      : "Neun Browser-Simulationen zu Lektionen des AI-Native-Kurses. Synthetische Daten, offene Annahmen und keine Anbieteranfrage.";
  const localizedPath = localizeHref("/ai-native/demos", locale);
  const url = `${SITE_URL}${localizedPath}`;
  const alternates = buildLocaleAlternates("/ai-native/demos", ["de", "en"]);
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

export default async function AiNativeDemosPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return <DemosGalleryView locale={locale} />;
}
