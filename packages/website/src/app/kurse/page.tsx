import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, GraduationCap, Presentation } from "lucide-react";
import { Github } from "@/components/icons/brand";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { createCoursesGraph } from "@/lib/seo/course-discovery";
import { Card, IconTile } from "@/components/ui/card";
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
  const trackDiff = [
    {
      icon: GraduationCap,
      accent: "kupfer" as const,
      label: copy.foundations,
      text: copy.foundationDifference,
    },
    {
      icon: Github,
      accent: "sand" as const,
      label: copy.technical,
      text: copy.technicalDifference,
    },
  ];
  const collectionLinks = [
    {
      href: "/kurse#lernpfad",
      label: copy.foundations,
      count: 4,
      icon: GraduationCap,
    },
    {
      href: "/kurse#tiefer-gehen",
      label: copy.technical,
      count: 6,
      icon: Github,
    },
    { href: "/workshops", label: copy.workshops, count: 2, icon: Presentation },
    { href: "/buecher", label: copy.books, count: null, icon: BookOpen },
  ] as const;

  return (
    <>
      <JsonLd data={createCoursesGraph(locale)} id="kurse-hub-jsonld" />
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-20">
        <div className="mb-9 h-[3px] w-[154px] bg-brand-orange" />

        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          {copy.kicker}
        </div>

        <h1 className="mt-6 max-w-[1180px] text-[40px] font-bold leading-[0.94] tracking-[-0.04em] text-foreground sm:text-[56px] md:text-[80px]">
          {copy.headingLead}
          <br />
          <span className="text-brand-orange">{copy.headingAccent}</span>
        </h1>

        <p className="mt-9 max-w-[720px] text-[18px] leading-[1.5] text-muted-foreground sm:text-[21px]">
          {copy.intro}
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card px-5 py-3 shadow-tile">
          <p className="text-[14px] text-muted-foreground">
            <span className="font-bold text-foreground">{copy.firstStep}</span>{" "}
            <Link
              href={localizeHref("/ki-check", locale)}
              className="text-brand-orange underline underline-offset-4"
            >
              {copy.checkLabel}
            </Link>{" "}
            {copy.checkExplanation}
          </p>
        </div>

        <nav
          aria-label={copy.offersLabel}
          className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          {collectionLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={localizeHref(item.href, locale)}
                className="group flex min-w-0 items-center justify-between gap-3 border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-tile transition-[border-color,background-color] hover:border-brand-orange hover:bg-card-hover"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Icon
                    className="h-4 w-4 shrink-0 text-brand-orange"
                    aria-hidden="true"
                  />
                  <span className="break-words">{item.label}</span>
                </span>
                {item.count === null ? null : (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <section
          aria-label={copy.differenceLabel}
          className="mt-10 rounded-2xl border border-border bg-kupfer-mist p-6 sm:p-7"
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.differenceHeading}
          </p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {trackDiff.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <IconTile icon={item.icon} accent={item.accent} />
                <span className="text-[14px] leading-snug text-foreground">
                  <span className="font-bold">{item.label}:</span> {item.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <PersonaCourseLinks locale={locale} />

        <section className="mt-16">
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
