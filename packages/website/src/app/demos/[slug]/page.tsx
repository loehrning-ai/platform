import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demos } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  getDemoForLocale,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { getDemoCopy } from "@/lib/demos-copy";
import { DemoDetailLayout } from "@/components/demos/demo-detail-layout";
import { ResourceContextBanner } from "@/components/learning/resource-context-banner";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return demos.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const demo = getDemoForLocale(slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale].metadata;
  if (!demo) return { title: pageCopy.missingTitle, robots: { index: false, follow: false } };
  const copy = getDemoCopy(slug, locale);
  const description = copy?.ogSubtitle ?? demo.description;
  const basePath = `/demos/${demo.slug}`;
  const localizedPath = localizeHref(basePath, locale);
  const alternates = buildLocaleAlternates(
    basePath,
    contentLocalesForPath(basePath),
  );

  return {
    title: `${demo.title} ${demo.titleKicker} · ${pageCopy.detailSuffix}`,
    description,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: `${demo.title} ${demo.titleKicker}`,
      description,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "article",
      // Machine-readable freshness from the catalog date (public-content contract)
      modifiedTime: demo.lastReviewed,
    },
    twitter: {
      card: "summary_large_image",
      title: `${demo.title} ${demo.titleKicker}`,
      description,
    },
  };
}

export default async function DemoDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const demo = getDemoForLocale(slug, locale);
  if (!demo) notFound();
  const copy = getDemoCopy(slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale];
  const detailPath = localizeHref(`/demos/${demo.slug}`, locale);
  const catalogPath = localizeHref("/demos", locale);

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: pageCopy.detail.home,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: pageCopy.detail.catalog,
            item: `${SITE_URL}${catalogPath}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${demo.title} ${demo.titleKicker}`,
            item: `${SITE_URL}${detailPath}`,
          },
        ],
      },
      {
        "@type": "LearningResource",
        name: `${demo.title} ${demo.titleKicker}`,
        description: copy?.ogSubtitle ?? demo.description,
        url: `${SITE_URL}${detailPath}`,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        publisher: { "@id": ORG_ID },
        isAccessibleForFree: true,
        learningResourceType: "Interactive practice example",
        educationalUse: "self-study",
        dateModified: demo.lastReviewed,
        keywords: [
          DEMO_CATEGORY_LABELS[locale][demo.category],
          ...demo.tags,
          ...demo.industries,
        ].join(", "),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`demo-${demo.slug}-jsonld`} />
      {locale === "de" ? <ResourceContextBanner nodeId={`demo:${demo.slug}`} /> : null}
      <DemoDetailLayout demo={demo} locale={locale} />
    </>
  );
}
