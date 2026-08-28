import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { createCoursesGraph } from "@/lib/seo/course-discovery";
import { COURSE_HUB_COPY } from "@/lib/courses/course-hub-copy";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { LearningAtlas } from "./learning-atlas";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COURSE_HUB_COPY[locale];
  const pathname = localizeHref("/kurse", locale);
  const socialImage = {
    url: `${SITE_URL}/kurse/opengraph-image`,
    width: 1200,
    height: 630,
    alt: copy.metadataImageAlt,
  };

  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    robots: { index: true, follow: true },
    alternates: {
      ...buildLocaleAlternates("/kurse", ["de", "en"]),
      canonical: pathname,
    },
    openGraph: {
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      url: `${SITE_URL}${pathname}`,
      siteName: "loehrning.ai",
      locale: locale === "en" ? "en_GB" : "de_DE",
      alternateLocale: [locale === "en" ? "de_DE" : "en_GB"],
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      images: [{ url: socialImage.url, alt: socialImage.alt }],
    },
  };
}

export default async function KursePage() {
  const locale = await getRequestLocale();
  const copy = COURSE_HUB_COPY[locale];

  return (
    <>
      <JsonLd data={createCoursesGraph(locale)} id="kurse-hub-jsonld" />
      <div className="mx-auto max-w-[1180px] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <header className="grid gap-4 border-b border-border pb-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.65fr)] lg:items-end">
          <h1 className="max-w-[820px] text-[38px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[48px] md:text-[56px]">
            {copy.headingLead}
            <br />
            <span className="text-brand-orange">{copy.headingAccent}</span>
          </h1>

          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {copy.firstStep}
            </span>{" "}
            <Link
              href={localizeHref("/ki-check", locale)}
              className="inline-flex min-h-11 items-center font-semibold text-brand-orange underline decoration-brand-orange/40 underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:text-foreground motion-reduce:transition-none"
            >
              {copy.checkLabel}
            </Link>
          </p>
        </header>

        <section className="mt-6" data-learning-gallery>
          <LearningAtlas locale={locale} />
        </section>

        <aside className="mt-10 border border-border border-t-[3px] border-t-brand-orange bg-kupfer-mist">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                  {copy.accessKicker}
                </span>
                <span className="mt-1 block text-lg font-bold tracking-[-0.02em] text-foreground">
                  {copy.accessHeading}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="font-mono text-lg transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <div className="border-t border-border px-4 py-4 sm:px-5">
              <p className="max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
                {copy.accessBody}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href={localizeHref("/ueber-mich", locale)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  {copy.aboutMe}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={localizeHref("/ki-check", locale)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  {copy.aiCheck}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </details>
        </aside>
      </div>
    </>
  );
}
