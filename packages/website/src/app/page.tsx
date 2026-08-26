import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero";
import { CredibilityStrip } from "@/components/home/credibility-strip";
import { Offering } from "@/components/home/offering";
import { Workflow } from "@/components/home/workflow";
import { HOME_COPY } from "@/components/home/home-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

// Next applies a layout's title template to its CHILD segments, not to the
// segment that declares it. The root layout owns "%s | loehrning.ai", so "/en"
// gets the suffix one segment deeper while "/" would render bare — every other
// route on the site is suffixed. Set the document title absolutely here so the
// homepage matches, without double-suffixing the OpenGraph title below.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = HOME_COPY[locale].metadata;
  const localizedPath = localizeHref("/", locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
    documentTitle: { absolute: `${copy.title} | loehrning.ai` },
  });
  const localeAlternates = buildLocaleAlternates(
    "/",
    contentLocalesForPath("/"),
  );

  return {
    ...metadata,
    alternates: {
      ...localeAlternates,
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

export default async function HomePage() {
  const locale = await getRequestLocale();

  return (
    <>
      {/* 1. Hero — the promise, stated once */}
      <HeroSection locale={locale} />

      {/* 2. Kurse — the learning path + deeper labs */}
      <Offering locale={locale} />

      {/* 3. Ressourcen — supporting material, one clear home */}
      <Workflow locale={locale} />

      {/* 4. Platform principles / trust */}
      <CredibilityStrip locale={locale} />
    </>
  );
}
