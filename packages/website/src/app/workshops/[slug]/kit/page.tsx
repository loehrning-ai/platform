import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KIT_PAGE_COPY } from "@/components/workshops/kit-copy";
import { KitPage } from "@/components/workshops/kit-page";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { workshopKitPath } from "@/lib/workshop-kit";
import {
  getWorkshopBySlug,
  getWorkshopKitSlugs,
  workshopKitMaterial,
} from "@/lib/workshops";
import { WORKSHOP_PAGE_COPY } from "../../workshop-copy";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Only workshops with a kit block get this route; every other slug is a 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return getWorkshopKitSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const workshop = getWorkshopBySlug(slug, locale);
  const workshopCopy = WORKSHOP_PAGE_COPY[locale].metadata;
  if (!workshop?.kit) return { title: workshopCopy.missingTitle };

  const kitCopy = KIT_PAGE_COPY[locale];
  const basePath = workshopKitPath(workshop.slug);
  const localizedPath = localizeHref(basePath, locale);
  const alternates = buildLocaleAlternates(basePath, contentLocalesForPath(basePath));
  const title = `${workshop.kit.title} · ${workshop.title}`;
  const image = {
    url: `/workshops/${workshop.slug}/card-preview.webp`,
    width: 1200,
    height: 630,
    alt: workshop.title,
  };

  return {
    title: `${title} · ${kitCopy.metaTitleSuffix}`,
    description: workshop.kit.lead,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title,
      description: workshop.kit.lead,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "article",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: workshop.kit.lead,
      images: [image],
    },
  };
}

export default async function WorkshopKitPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const workshop = getWorkshopBySlug(slug, locale);
  const material = workshop ? workshopKitMaterial(workshop) : undefined;
  if (!workshop?.kit || !material) notFound();

  const copy = KIT_PAGE_COPY[locale];
  const workshopCopy = WORKSHOP_PAGE_COPY[locale];
  const catalogPath = localizeHref("/workshops", locale);
  const detailPath = localizeHref(`/workshops/${workshop.slug}`, locale);
  const kitUrl = `${SITE_URL}${localizeHref(workshopKitPath(workshop.slug), locale)}`;

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.home,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: workshopCopy.metadata.title,
            item: `${SITE_URL}${catalogPath}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: workshop.title,
            item: `${SITE_URL}${detailPath}`,
          },
          { "@type": "ListItem", position: 4, name: workshop.kit.title, item: kitUrl },
        ],
      },
      {
        "@type": "LearningResource",
        name: `${workshop.kit.title} · ${workshop.title}`,
        description: workshop.kit.lead,
        url: kitUrl,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        isAccessibleForFree: true,
        learningResourceType: "Kit",
        isPartOf: { "@type": "LearningResource", name: workshop.title, url: `${SITE_URL}${detailPath}` },
        encoding: {
          "@type": "MediaObject",
          contentUrl: `${SITE_URL}${material.href}`,
          encodingFormat: "application/zip",
          ...(material.sizeLabel ? { contentSize: material.sizeLabel } : {}),
        },
        publisher: { "@id": ORG_ID },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`workshop-${workshop.slug}-kit-jsonld`} />
      <KitPage workshop={workshop} locale={locale} />
    </>
  );
}
