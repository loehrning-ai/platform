import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComprehensionCheck } from "@/components/wie-ki-funktioniert/ComprehensionCheck";
import { LessonReference } from "@/components/course/lesson-reference";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import {
  createNoindexPageMetadata,
  createPublicPageMetadata,
} from "@/lib/seo/page-metadata";
import {
  WIE_KI_LEKTIONEN,
  formatReviewDate,
  getLektionById,
  getNextLektion,
  getPrevLektion,
  getWieKiContent,
  type WieKiLektion,
} from "@/lib/wie-ki-funktioniert";
import {
  WIE_KI_COMPREHENSION_CHECKS,
  WIE_KI_LESSON_COPY,
} from "@/lib/wie-ki-funktioniert-copy";

const COURSE_PATH = "/wie-ki-funktioniert";

interface PageParams {
  readonly lektionId: string;
}

export const dynamicParams = false;

export async function generateStaticParams(): Promise<PageParams[]> {
  return WIE_KI_LEKTIONEN.map((lektion) => ({ lektionId: lektion.id }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<PageParams>;
}): Promise<Metadata> {
  const [{ lektionId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const lektion = getLektionById(lektionId, locale);
  const copy = WIE_KI_LESSON_COPY[locale];
  if (!lektion) {
    return createNoindexPageMetadata({
      title:
        locale === "de" ? "Lektion nicht gefunden" : "Lesson not found",
      description:
        locale === "de"
          ? "Diese Lektion ist nicht veröffentlicht."
          : "This lesson has not been published.",
    });
  }

  const path = `${COURSE_PATH}/${lektionId}`;
  const localizedPath = localizeHref(path, locale);
  const metadata = createPublicPageMetadata({
    title: `${lektion.title} | ${copy.metadataSuffix}`,
    description: lektion.subtitle,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(path, contentLocalesForPath(path)),
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          type: "article",
          locale: locale === "de" ? "de_DE" : "en_GB",
          alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
        }
      : metadata.openGraph,
  };
}

function lessonGraph({
  locale,
  lektion,
}: {
  readonly locale: Locale;
  readonly lektion: WieKiLektion;
}) {
  const copy = WIE_KI_LESSON_COPY[locale];
  const localizedCoursePath = localizeHref(COURSE_PATH, locale);
  const localizedLessonPath = localizeHref(
    `${COURSE_PATH}/${lektion.id}`,
    locale,
  );
  const courseUrl = `${SITE_URL}${localizedCoursePath}`;
  const lessonUrl = `${SITE_URL}${localizedLessonPath}`;

  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${lessonUrl}#breadcrumb`,
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
            name: copy.courseTitle,
            item: courseUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: lektion.title,
            item: lessonUrl,
          },
        ],
      },
      {
        "@type": "LearningResource",
        "@id": `${lessonUrl}#lesson`,
        name: lektion.title,
        description: lektion.subtitle || copy.schemaDescription,
        url: lessonUrl,
        inLanguage: locale,
        learningResourceType: "lesson",
        educationalLevel: "Beginner",
        isAccessibleForFree: true,
        timeRequired: `PT${lektion.durationMinutes}M`,
        dateModified: getWieKiContent(locale).meta.lastReviewed,
        provider: { "@id": ORG_ID },
        isPartOf: {
          "@type": "Course",
          "@id": `${courseUrl}#course`,
          name: copy.courseTitle,
          url: courseUrl,
        },
        teaches: lektion.keyConcepts,
        breadcrumb: { "@id": `${lessonUrl}#breadcrumb` },
      },
    ],
  };
}

function WieKiLektionContent({
  locale,
  lektionId,
}: {
  readonly locale: Locale;
  readonly lektionId: string;
}) {
  const { meta, lektionen } = getWieKiContent(locale);
  const lektion = getLektionById(lektionId, locale);
  if (!lektion) notFound();

  const copy = WIE_KI_LESSON_COPY[locale];
  const prev = getPrevLektion(lektionId, locale);
  const next = getNextLektion(lektionId, locale);
  const check = WIE_KI_COMPREHENSION_CHECKS[locale][lektionId];
  const standDate = formatReviewDate(meta.lastReviewed, locale);
  const isLastLektion = !next;

  return (
    <>
      <JsonLd
        data={lessonGraph({ locale, lektion })}
        id="wie-ki-lesson-jsonld"
      />

      <div className="mx-auto w-full max-w-5xl min-w-0 px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-10 lg:px-10">
        <nav aria-label={copy.breadcrumbLabel} className="mb-3 min-w-0 sm:mb-5">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground sm:tracking-[0.1em]">
            <li>
              <Link
                href={localizeHref("/", locale)}
                className="break-words hover:text-foreground"
              >
                {copy.home}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="min-w-0">
              <Link
                href={localizeHref(COURSE_PATH, locale)}
                className="break-words hover:text-foreground [overflow-wrap:anywhere]"
              >
                {copy.courseTitle}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li
              className="min-w-0 break-words text-foreground [overflow-wrap:anywhere]"
              aria-current="page"
            >
              {copy.lessonBreadcrumb(lektion.number)}
            </li>
          </ol>
        </nav>

        <article className="min-w-0">
          <header className="min-w-0 border-b-2 border-foreground pb-3 sm:pb-5">
            <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange sm:tracking-[0.14em]">
              {copy.lessonProgress(
                lektion.number,
                lektionen.length,
                lektion.durationMinutes,
              )}
            </p>
            <h1 className="mt-2 max-w-4xl break-words text-[clamp(1.875rem,6vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere]">
              {lektion.title}
            </h1>
            <p className="mt-2 max-w-3xl break-words text-[15px] leading-[1.4] text-muted-foreground [overflow-wrap:anywhere] sm:text-[19px] sm:leading-[1.45]">
              {lektion.subtitle}
            </p>
          </header>

          {check ? (
            <div className="mt-3 max-w-3xl sm:mt-4">
              <ComprehensionCheck
                id={lektion.id}
                question={check.question}
                criteria={check.criteria}
                label={copy.selfCheck}
                responseLabel={copy.responseLabel}
                responsePlaceholder={copy.responsePlaceholder}
                compareLabel={copy.compareCriteria}
                hideLabel={copy.hideCriteria}
                criteriaLabel={copy.criteriaHeading}
                sessionOnlyLabel={copy.sessionOnly}
              />
            </div>
          ) : null}

          <div className="mt-5 min-w-0">
            <LessonReference
              locale={locale}
              title={copy.referenceTitle}
              headingLevel={2}
            >
              <div className="min-w-0 space-y-10">
                <div className="max-w-3xl border-b border-border pb-4">
                  <p className="break-words font-mono text-[11px] text-muted-foreground">
                    <time dateTime={meta.lastReviewed}>
                      {copy.reviewed}: {standDate}
                    </time>
                  </p>
                  <ul
                    className="mt-3 flex min-w-0 flex-wrap gap-2"
                    aria-label={copy.conceptsLabel}
                  >
                    {lektion.keyConcepts.map((concept) => (
                      <li
                        key={concept}
                        className="max-w-full break-words border border-border bg-card px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground [overflow-wrap:anywhere] sm:tracking-[0.08em]"
                      >
                        {concept}
                      </li>
                    ))}
                  </ul>
                </div>
                {lektion.sections.map((section, index) => (
                  <section
                    key={section.id}
                    className="min-w-0 scroll-mt-24"
                    aria-labelledby={`section-${section.id}`}
                  >
                    <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange sm:tracking-[0.12em]">
                        {copy.section(index + 1)}
                      </span>
                      <span className="break-words font-mono text-[10px] text-muted-foreground">
                        {copy.readTime(section.readTimeMinutes)}
                      </span>
                    </div>
                    <h3
                      id={`section-${section.id}`}
                      className="mb-4 max-w-3xl break-words text-[26px] font-bold leading-tight tracking-[-0.025em] text-foreground [overflow-wrap:anywhere] sm:text-[32px]"
                    >
                      {section.title}
                    </h3>

                    <div className="max-w-3xl min-w-0 space-y-4">
                      {section.content
                        .split("\n\n")
                        .map((paragraph, paragraphIndex) => (
                          <p
                            key={paragraphIndex}
                            className="break-words text-[16px] leading-[1.7] text-foreground [overflow-wrap:anywhere] sm:text-[17px]"
                          >
                            {paragraph}
                          </p>
                        ))}
                    </div>

                    <aside className="mt-5 max-w-3xl min-w-0 border-l-4 border-brand-orange bg-brand-orange/5 py-3 pl-4 pr-4 sm:pl-5">
                      <p className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange sm:tracking-[0.1em]">
                        {copy.takeaway}
                      </p>
                      <p className="mt-2 break-words text-[15px] font-bold leading-[1.5] text-foreground [overflow-wrap:anywhere] sm:text-[16px]">
                        {section.keyTakeaway}
                      </p>
                    </aside>
                  </section>
                ))}
              </div>
            </LessonReference>
          </div>
        </article>

        <nav
          aria-label={copy.lessonNavigation}
          className="mt-8 min-w-0 border-t border-border pt-6"
        >
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:items-center">
            <div className="min-w-0">
              {prev && (
                <Link
                  href={localizeHref(`${COURSE_PATH}/${prev.id}`, locale)}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 break-words py-2 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange sm:tracking-[0.08em]"
                >
                  <span aria-hidden="true" className="shrink-0">←</span>
                  {copy.previousLesson}
                </Link>
              )}
            </div>
            <div className="min-w-0 sm:text-right">
              {next && (
                <Link
                  href={localizeHref(`${COURSE_PATH}/${next.id}`, locale)}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 break-words py-2 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-brand-orange hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange sm:tracking-[0.08em]"
                >
                  {copy.nextLesson}
                  <span aria-hidden="true" className="shrink-0">→</span>
                </Link>
              )}
            </div>
          </div>

          {isLastLektion && (
            <aside className="mt-10 min-w-0 border-2 border-brand-orange bg-brand-orange/5 p-5 sm:p-7">
              <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange sm:tracking-[0.14em]">
                {copy.completedEyebrow}
              </p>
              <p className="mt-3 max-w-3xl break-words text-[20px] font-bold leading-snug tracking-[-0.02em] text-foreground [overflow-wrap:anywhere] sm:text-[24px]">
                {copy.completedHeading}
              </p>
              <p className="mt-3 max-w-3xl break-words text-[15px] leading-[1.65] text-muted-foreground [overflow-wrap:anywhere]">
                {copy.completedBody}
              </p>
              <div className="mt-6 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={localizeHref("/ki-fuehrerschein", locale)}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 break-words bg-brand-orange px-5 py-3 text-left font-mono text-[12px] font-bold text-white transition-colors hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  {copy.driverLicense} <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={localizeHref("/einstieg", locale)}
                  className="inline-flex min-h-11 max-w-full items-center gap-2 break-words border border-border bg-background px-5 py-3 text-left font-mono text-[12px] font-bold text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {copy.backToEntry}
                </Link>
              </div>
            </aside>
          )}
        </nav>
      </div>
    </>
  );
}

export default async function LektionPage({
  params,
}: {
  readonly params: Promise<PageParams>;
}) {
  const [{ lektionId }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  return <WieKiLektionContent locale={locale} lektionId={lektionId} />;
}
