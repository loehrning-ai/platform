import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { createCoursesGraph } from "@/lib/seo/course-discovery";
import { COURSE_HUB_COPY } from "@/lib/courses/course-hub-copy";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { LearningAtlas } from "./learning-atlas";
import { getCourseAccess } from "@/lib/courses/access";
import { ALL_COURSE_CATALOG } from "@/lib/courses/catalog";
import { getWorkshops } from "@/lib/workshops";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import {
  ArrowGlyph,
  BUTTON_CLASSES,
  ButtonLink,
  Kicker,
  SectionHead,
  cx,
} from "@/components/werk";

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
  const workshopCount = getWorkshops(locale).length;

  return (
    <>
      <JsonLd data={createCoursesGraph(locale)} id="kurse-hub-jsonld" />
      {/* Paper hero, no band: kicker, the ink poster title (SPEC §4: fit to
          its longest word, 36 to 50px on a phone), one lead sentence and the
          KI-Check as a text link. Phones skip the lead (the kicker and the
          grouped ledger say the same), so the goal rail and the recommended
          course share the first screen with the poster title. */}
      <div className="mx-auto max-w-[75rem] px-4 pb-6 pt-4 sm:px-6 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-10">
        <header className="@container max-w-[46rem]">
          <Kicker>{copy.kicker(ALL_COURSE_CATALOG.length)}</Kicker>
          <h1
            className="poster-title mt-2 max-w-[16ch] text-foreground sm:mt-3"
            style={posterTitleFallbackStyle(copy.heading)}
          >
            {copy.heading}
          </h1>
          <p className="mt-4 max-w-[58ch] text-lead text-muted-foreground text-pretty max-sm:hidden">
            {copy.intro}
          </p>
          {/* Question and link share one line on every phone: under 430px
              the question shortens to "Unsicher?". On a phone the line is
              exactly the link's 44px target, centred, and gives some of it
              back into the lead above and the gap before the goal chips. */}
          <p className="mt-1 text-[0.9375rem] text-muted-foreground max-sm:-mb-2 max-sm:-mt-0.5 max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-1 sm:mt-2 sm:text-body">
            <span className="min-[430px]:hidden">{copy.firstStepShort}</span>
            <span className="max-[429px]:hidden">{copy.firstStep}</span>{" "}
            <Link
              href={localizeHref("/ki-check", locale)}
              className={cx(BUTTON_CLASSES.paper.text, "align-baseline")}
            >
              {copy.checkLabel}
              <ArrowGlyph />
            </Link>
          </p>
        </header>

        <section className="mt-5 sm:mt-10 lg:mt-8" data-learning-gallery>
          <LearningAtlas locale={locale} access={getCourseAccess()} />
        </section>

        {/* Cost and account sit with the ledger they explain, before the
            workshop band, so the page ends ledger, note, band, footer. */}
        <section
          aria-labelledby="kurse-access-heading"
          className="mt-12 sm:mt-16 lg:mt-20"
        >
          <SectionHead
            id="kurse-access-heading"
            title={copy.accessHeading}
            size="compact"
          />
          {/* One cost note at every width. */}
          <p className="mt-3 max-w-[64ch] text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:mt-4 sm:text-body">
            {copy.accessBody}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className={cx(BUTTON_CLASSES.paper.text, "mt-3")}
          >
            {copy.accessAction}
            <ArrowGlyph />
          </Link>
        </section>
      </div>

      {/* Workshops as the practical companion: an in-flow Beton band across
          the full width, no negative margins. */}
      <section
        aria-labelledby="kurse-workshops-heading"
        className="bg-inset"
        data-kurse-workshops
      >
        <div className="mx-auto grid max-w-[75rem] gap-4 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 lg:py-12">
          <div className="min-w-0">
            <h2
              id="kurse-workshops-heading"
              className="text-[1.375rem]/[1.2] font-bold text-foreground sm:text-fluid-h2"
            >
              {copy.workshopsHeading}
            </h2>
            <p className="mt-2 max-w-[60ch] text-[0.9375rem]/[1.5] text-foreground text-pretty sm:text-body">
              {copy.workshopsBody(workshopCount)}
            </p>
            <p className="mt-3 text-caption text-muted-foreground">
              {copy.workshopsNote}
            </p>
          </div>
          <ButtonLink
            href={localizeHref("/workshops", locale)}
            variant="secondary"
            locale={locale}
            className="justify-self-start"
          >
            {copy.workshopsAction}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
