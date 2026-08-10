import type { Metadata } from "next";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { KI_CHECK_PAGE_COPY } from "@/lib/ki-check/localization";
import { absoluteUrl } from "@/lib/seo/entity";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { KiCheckClient } from "./ki-check-client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = KI_CHECK_PAGE_COPY[locale];
  const path = localizeHref("/ki-check", locale);
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: {
      ...buildLocaleAlternates("/ki-check", contentLocalesForPath("/ki-check")),
      canonical: path,
    },
    openGraph: {
      title: `${copy.title} | loehrning.ai`,
      description: copy.description,
      url: absoluteUrl(path),
      locale: locale === "de" ? "de_DE" : "en_GB",
      type: "website",
    },
  };
}

function createKiCheckGraph(locale: "de" | "en") {
  const copy = KI_CHECK_PAGE_COPY[locale];
  const path = localizeHref("/ki-check", locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: copy.applicationName,
    url: absoluteUrl(path),
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: locale === "de" ? "de-DE" : "en-GB",
    isAccessibleForFree: true,
    description: copy.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  } as const;
}

export default async function KiCheckPage() {
  const locale = await getRequestLocale();
  return (
    <>
      <JsonLd data={createKiCheckGraph(locale)} id="ki-check-jsonld" />
      <KiCheckClient locale={locale} />
    </>
  );
}
