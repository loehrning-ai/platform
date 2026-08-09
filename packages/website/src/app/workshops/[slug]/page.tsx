import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkshopBySlug, getWorkshopSlugs } from "@/lib/workshops";
import { WorkshopDetailContent } from "./workshop-detail-content";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { WORKSHOP_PAGE_COPY } from "../workshop-copy";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getWorkshopSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const workshop = getWorkshopBySlug(slug, locale);
  const copy = WORKSHOP_PAGE_COPY[locale].metadata;
  if (!workshop) return { title: copy.missingTitle };

  const basePath = `/workshops/${workshop.slug}`;
  const localizedPath = localizeHref(basePath, locale);
  const alternates = buildLocaleAlternates(
    basePath,
    contentLocalesForPath(basePath),
  );

  return {
    title: `${workshop.title} · ${copy.detailTitleSuffix}`,
    description: workshop.description,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: workshop.title,
      description: workshop.description,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: workshop.title,
      description: workshop.description,
    },
  };
}

export default async function WorkshopDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const workshop = getWorkshopBySlug(slug, locale);
  if (!workshop) notFound();

  const copy = WORKSHOP_PAGE_COPY[locale];
  const catalogPath = localizeHref("/workshops", locale);
  const detailPath = localizeHref(`/workshops/${workshop.slug}`, locale);

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: locale === "de" ? "Start" : "Home",
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.metadata.title,
            item: `${SITE_URL}${catalogPath}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: workshop.title,
            item: `${SITE_URL}${detailPath}`,
          },
        ],
      },
      {
        "@type": "LearningResource",
        name: workshop.title,
        description: workshop.description,
        url: `${SITE_URL}${detailPath}`,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        isAccessibleForFree: true,
        learningResourceType: "Workshop",
        educationalUse: "self-study",
        publisher: { "@id": ORG_ID },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`workshop-${workshop.slug}-jsonld`} />
      <WorkshopDetailContent workshop={workshop} locale={locale} />
    </>
  );
}
