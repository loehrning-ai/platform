import type { ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoPage } from "@/components/demos/demo-page";
import type { DemoComponentProps } from "@/components/demos/demo-page";
import { getDemoForLocale, type DemoSlug } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

/** Metadata for one demo route. An unknown slug is never indexable. */
export async function demoMetadata(slug: string): Promise<Metadata> {
  const locale = await getRequestLocale();
  const demo = getDemoForLocale(slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale].metadata;
  if (!demo) return { title: pageCopy.missingTitle, robots: { index: false, follow: false } };
  const basePath = `/demos/${demo.slug}`;
  const localizedPath = localizeHref(basePath, locale);
  const alternates = buildLocaleAlternates(basePath, contentLocalesForPath(basePath));

  return {
    title: `${demo.title} · ${pageCopy.detailSuffix}`,
    description: demo.oneLiner,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: demo.title,
      description: demo.oneLiner,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "article",
      // Machine-readable freshness from the catalog date (public-content contract)
      modifiedTime: demo.lastReviewed,
    },
    twitter: {
      card: "summary_large_image",
      title: demo.title,
      description: demo.oneLiner,
    },
  };
}

/**
 * One demo route: the shell around the demo component the route file passes
 * in. Each route file imports only its own component (and so its own CSS),
 * so a demo page ships one demo, not all five.
 */
export async function renderDemoRoute(slug: DemoSlug, Demo: ComponentType<DemoComponentProps>) {
  const locale = await getRequestLocale();
  const demo = getDemoForLocale(slug, locale);
  if (!demo) notFound();
  const pageCopy = DEMOS_PAGE_COPY[locale].detail;
  const detailPath = localizeHref(`/demos/${demo.slug}`, locale);
  const catalogPath = localizeHref("/demos", locale);
  const inLanguage = locale === "de" ? "de-DE" : "en-GB";

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: pageCopy.home,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: pageCopy.catalog,
            item: `${SITE_URL}${catalogPath}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: demo.title,
            item: `${SITE_URL}${detailPath}`,
          },
        ],
      },
      {
        "@type": "LearningResource",
        name: demo.title,
        description: demo.oneLiner,
        url: `${SITE_URL}${detailPath}`,
        inLanguage,
        publisher: { "@id": ORG_ID },
        isAccessibleForFree: true,
        learningResourceType: "Interactive demo",
        educationalUse: "self-study",
        timeRequired: `PT${demo.minutes}M`,
        dateModified: demo.lastReviewed,
        isPartOf: {
          "@type": "LearningResource",
          url: `${SITE_URL}${localizeHref(`/workshops/${demo.workshopSlug}`, locale)}`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id={`demo-${demo.slug}-jsonld`} />
      <DemoPage demo={demo} locale={locale} Demo={Demo} />
    </>
  );
}
