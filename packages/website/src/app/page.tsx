import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero";
import { CredibilityStrip } from "@/components/home/credibility-strip";
import { Offering } from "@/components/home/offering";
import { Workflow } from "@/components/home/workflow";
import { FinalCta } from "@/components/home/final-cta";
import { HOME_COPY } from "@/components/home/home-copy";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

// The root layout template ("%s | loehrning.ai") appends the site name, so the
// title itself stays descriptive and suffix-free (no "loehrning.ai | loehrning.ai").
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = HOME_COPY[locale].metadata;
  const localizedPath = localizeHref("/", locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
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
      {/* Scroll progress — 2px Kupfer line at viewport top */}
      <ScrollProgress />

      {/* 1. Hero — the promise, stated once */}
      <HeroSection locale={locale} />

      {/* 2. Kurse — the learning path + deeper labs */}
      <Offering locale={locale} />

      {/* 3. Ressourcen — supporting material, one clear home */}
      <Workflow locale={locale} />

      {/* 4. Platform principles / trust */}
      <CredibilityStrip locale={locale} />

      {/* 5. Closing CTA */}
      <FinalCta locale={locale} />
    </>
  );
}
