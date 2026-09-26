import type { Metadata } from "next";
import { getWorkshops } from "@/lib/workshops";
import { WorkshopsContent } from "./workshops-content";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { WORKSHOP_PAGE_COPY } from "./workshop-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const workshops = getWorkshops(locale);
  const copy = WORKSHOP_PAGE_COPY[locale].metadata;
  const localizedPath = localizeHref("/workshops", locale);
  const alternates = buildLocaleAlternates(
    "/workshops",
    contentLocalesForPath("/workshops"),
  );

  const image = {
    url: "/workshops/ki-prognosen-einschaetzen/card-preview.webp",
    width: 1024,
    height: 576,
    alt: copy.imageAlt,
  };

  return {
    title: copy.title,
    description: copy.description(workshops.length),
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: copy.title,
      description: copy.openGraphDescription,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.openGraphDescription,
      images: [image],
    },
  };
}

export default async function WorkshopsPage() {
  const locale = await getRequestLocale();
  const workshops = getWorkshops(locale);
  const copy = WORKSHOP_PAGE_COPY[locale].metadata;
  const localizedPath = localizeHref("/workshops", locale);
  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: copy.title,
        description: copy.collectionDescription,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        url: `${SITE_URL}${localizedPath}`,
        publisher: { "@id": ORG_ID },
        hasPart: workshops.map((workshop) => ({
          "@type": "LearningResource",
          name: workshop.title,
          description: workshop.description,
          url: `${SITE_URL}${localizeHref(`/workshops/${workshop.slug}`, locale)}`,
          inLanguage: locale === "de" ? "de-DE" : "en-GB",
          isAccessibleForFree: true,
          learningResourceType: "Workshop",
          educationalUse: "self-study",
          timeRequired: `PT${workshop.minutesLive ?? workshop.minutesSelfStudy}M`,
          teaches: workshop.outcomes,
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id="workshops-jsonld" />
      <WorkshopsContent workshops={workshops} locale={locale} />
    </>
  );
}
