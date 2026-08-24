import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { createCoursesGraph } from "@/lib/seo/course-discovery";
import { Card } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { COURSE_HUB_COPY } from "@/lib/courses/course-hub-copy";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { CourseGallery } from "./course-gallery";
import { PersonaCourseLinks } from "./persona-filter";

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
      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <h1 className="max-w-[980px] text-[38px] font-bold leading-[0.96] tracking-[-0.04em] text-foreground sm:text-[52px] md:text-[68px]">
          {copy.headingLead}
          <br />
          <span className="text-brand-orange">{copy.headingAccent}</span>
        </h1>

        <p className="mt-5 max-w-[700px] text-[16px] leading-[1.5] text-muted-foreground sm:text-[18px]">
          {copy.intro}
        </p>

        <p className="mt-5 text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">{copy.firstStep}</span>{" "}
          <Link
            href={localizeHref("/ki-check", locale)}
            className="font-semibold text-brand-orange underline decoration-brand-orange/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            {copy.checkLabel}
          </Link>
        </p>

        <PersonaCourseLinks locale={locale} />

        <section className="mt-10" data-learning-gallery>
          <CourseGallery locale={locale} />
        </section>

        <section className="mt-20">
          <Card accent="kupfer" className="bg-kupfer-mist p-8 sm:p-10">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.accessKicker}
            </div>
            <h2 className="mt-3 max-w-[760px] text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
              {copy.accessHeading}
            </h2>
            <p className="mt-5 max-w-[720px] text-[16px] leading-[1.6] text-muted-foreground">
              {copy.accessBody}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <BrandButton
                href={localizeHref("/ueber-die-plattform", locale)}
                variant="outline"
                size="md"
              >
                {copy.aboutPlatform}
                <span aria-hidden="true">→</span>
              </BrandButton>
              <BrandButton
                href={localizeHref("/ki-check", locale)}
                variant="outline"
                size="md"
              >
                {copy.aiCheck}
                <span aria-hidden="true">→</span>
              </BrandButton>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
