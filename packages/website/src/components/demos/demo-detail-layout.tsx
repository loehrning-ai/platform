import Link from "next/link";
import type { Demo } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
  getNextDemoForLocale,
} from "@/lib/demos-localization";
import {
  DEMO_ACTION_LABELS,
  DEMO_EVIDENCE_COPY,
  DEMOS_PAGE_COPY,
} from "@/lib/demos-ui-copy";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import { getDemoCopy } from "@/lib/demos-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  ArrowGlyph,
  BUTTON_CLASSES,
  Chip,
  cx,
  Kicker,
  SectionHead,
} from "@/components/werk";
import { DemoShell } from "./demo-shell";
import { AnimatedMetaTable } from "./animated-meta-table";
import { EvidenceBadge } from "./evidence-badge";
import { DemoCta } from "./demo-cta";

/**
 * Derive a human-readable lesson label from a lessonId string.
 * Handles two patterns:
 *   - AI-Native:  "modul_3_lesson_5" → "Modul 3 · Lektion 5"
 *   - Block-based: "block_2" → "Block 2"
 */
function lessonLabel(
  lessonId: string,
  labels: {
    readonly module: string;
    readonly lesson: string;
    readonly block: string;
  },
): string {
  const moduleMatch = lessonId.match(/^modul_(\d+)_lesson_(\d+)$/);
  if (moduleMatch)
    return `${labels.module} ${moduleMatch[1]} · ${labels.lesson} ${moduleMatch[2]}`;
  const blockMatch = lessonId.match(/^block_(\d+)$/);
  if (blockMatch) return `${labels.block} ${blockMatch[1]}`;
  return lessonId;
}

/**
 * Derive the direct lesson URL from courseSlug + lessonId.
 * - ai-native:      /ai-native/kurs/modul_3/modul_3_lesson_5
 * - ki-fuehrerschein: /ki-fuehrerschein/kurs/block_2
 * - eu-ai-act-kurs: /eu-ai-act-kurs/kurs/block_2
 */
function lessonHref(
  courseSlug: string,
  basePath: string,
  lessonId: string,
): string {
  const moduleMatch = lessonId.match(/^(modul_\d+)_lesson_\d+$/);
  if (moduleMatch) return `${basePath}/kurs/${moduleMatch[1]}/${lessonId}`;
  return `${basePath}/kurs/${lessonId}`;
}

export function DemoDetailLayout({
  demo,
  locale = "de",
}: {
  demo: Demo;
  locale?: Locale;
}) {
  const copy = getDemoCopy(demo.slug, locale);
  const pageCopy = DEMOS_PAGE_COPY[locale].detail;
  const next = getNextDemoForLocale(demo, locale);
  const baseCourse = COURSE_CATALOG.find(
    (item) => item.slug === demo.courseSlug,
  );
  const course = baseCourse
    ? localizeCatalogCourse(baseCourse, locale)
    : undefined;
  const relatedBooks = demo.bookSlugs
    .map((slug) => books.find((book) => book.id === slug))
    .filter((book): book is (typeof books)[number] => book !== undefined);

  const stufe = pageCopy.stages[demo.level];
  const lessonLink =
    demo.lessonId && course
      ? lessonHref(demo.courseSlug, course.href, demo.lessonId)
      : (course?.startHref ?? "/kurse");
  const lessonDisplay = demo.lessonId
    ? lessonLabel(demo.lessonId, pageCopy)
    : null;
  const catalogHref = localizeHref("/demos", locale);
  const categoryLabel = DEMO_CATEGORY_LABELS[locale][demo.category];
  const levelLabel = DEMO_LEVEL_LABELS_BY_LOCALE[locale][demo.level];
  const evidenceLabel = DEMO_EVIDENCE_COPY[locale][demo.evidenceMode].label;
  const actionLabel =
    DEMO_ACTION_LABELS[locale][demo.externalActionMode] ?? pageCopy.noActions;
  const localizedLessonLink = localizeHref(lessonLink, locale);
  const localizedCourseLink = localizeHref(
    course?.startHref ?? "/kurse",
    locale,
  );
  const runRows = [
    { label: pageCopy.setupLabel, value: demo.background },
    { label: pageCopy.executionLabel, value: evidenceLabel },
    { label: pageCopy.actionsLabel, value: actionLabel },
  ];

  return (
    <article className="overflow-x-clip" data-demo-detail-layout>
      <nav
        aria-label={pageCopy.catalog}
        className="px-4 pt-4 sm:px-6 sm:pt-6"
      >
        <div className="mx-auto max-w-[75rem]">
          <Link
            href={catalogHref}
            className="group inline-flex min-h-11 items-center gap-2 text-label text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
          >
            <ArrowGlyph className="rotate-180" />
            {pageCopy.allExamples}
          </Link>
        </div>
      </nav>

      {/*
        Header and instrument share one paper band: kicker, one-colour H1,
        lead, then a single evidence line (mode, actions, what is invented)
        directly above the engine. The engine never server-renders
        (dynamic(..., {ssr:false})), so this band carries first paint. A dark
        engine only turns its own frame graphit (DemoShell); the band stays
        paper.
      */}
      <section
        data-demo-detail-hero
        data-demo-instrument
        aria-labelledby="demo-title"
        className="px-4 pb-12 pt-4 sm:px-6 sm:pt-6"
      >
        <div className="mx-auto max-w-[75rem]">
          <Kicker>
            {pageCopy.example} {demo.n} · {categoryLabel} · {levelLabel}
          </Kicker>
          <h1
            id="demo-title"
            className="mt-3 max-w-[26ch] break-words text-fluid-h1 font-bold text-foreground"
          >
            {demo.title} {demo.titleKicker}
          </h1>
          <p className="mt-4 max-w-[60ch] text-lead text-muted-foreground text-pretty">
            {demo.description}
          </p>

          <div className="mt-6">
            <EvidenceBadge
              evidenceMode={demo.evidenceMode}
              externalActionMode={demo.externalActionMode}
              note={demo.syntheticDataLabel}
              locale={locale}
            />
          </div>
          <div className="mt-4">
            <DemoShell demo={demo} locale={locale} />
          </div>
        </div>
      </section>

      <section
        id="demo-notes"
        data-demo-notes
        className="scroll-mt-24 px-4 pb-12 sm:px-6 sm:pb-16"
      >
        <div className="mx-auto grid max-w-[75rem] gap-12 lg:grid-cols-12 lg:gap-x-12">
          <div className="min-w-0 lg:col-span-7">
            <SectionHead title={pageCopy.aboutHeading} />
            {copy ? (
              <div className="mt-6 max-w-[64ch] space-y-4 text-body text-foreground">
                <p>{copy.why}</p>
                <p className="text-muted-foreground">{copy.proof}</p>
              </div>
            ) : null}

            {demo.riskNotes.length > 0 ? (
              <div className="mt-10">
                <h3 className="text-label text-foreground">
                  {pageCopy.checksHeading}
                </h3>
                <ul className="mt-3 max-w-[64ch] border-t border-hairline">
                  {demo.riskNotes.map((note) => (
                    <li
                      key={note}
                      className="flex items-baseline gap-3 border-b border-hairline py-3 text-body text-foreground"
                    >
                      <span
                        className="size-2.5 shrink-0 bg-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-10">
              <h3 className="text-label text-foreground">
                {pageCopy.workContexts}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {demo.industries.map((industry) => (
                  <li key={industry}>
                    <Link
                      href={localizeHref(
                        `/demos?industry=${encodeURIComponent(industry)}`,
                        locale,
                      )}
                      className="inline-flex min-h-11 items-center border border-border px-3 text-label text-foreground transition-colors duration-[120ms] hover:border-foreground motion-reduce:transition-none"
                    >
                      {industry}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <SectionHead title={pageCopy.runHeading} />
            <dl className="mt-6 border-t border-hairline">
              {runRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-hairline py-3"
                >
                  <dt className="text-label text-muted-foreground">{row.label}</dt>
                  <dd className="min-w-0 break-words text-body text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <AnimatedMetaTable meta={demo.meta} locale={locale} />
            {demo.tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {demo.tags.map((tag) => (
                  <li key={tag}>
                    <Chip>{tag}</Chip>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-10">
              <SectionHead title={pageCopy.courseHeading} as="h3" />
              <p className="mt-4 text-body font-semibold text-foreground">
                {course ? course.title : demo.courseSlug}
              </p>
              <p className="mt-1 text-caption text-muted-foreground">
                {lessonDisplay ? `${lessonDisplay} · ` : ""}
                {pageCopy.pathway} · {stufe}
              </p>
              <Link
                href={localizedLessonLink}
                prefetch={false}
                className={cx(BUTTON_CLASSES.paper.text, "mt-2")}
              >
                {pageCopy.toLesson}
                <ArrowGlyph />
              </Link>

              {relatedBooks.length > 0 ? (
                <div className="mt-6">
                  <h4 className="text-label text-foreground">
                    {pageCopy.relatedBooks}
                  </h4>
                  <ul className="mt-2 border-t border-hairline">
                    {relatedBooks.map((book) => (
                      <li key={book.id} className="border-b border-hairline">
                        <Link
                          href={localizeHref(book.readerHref, locale)}
                          className="flex min-h-11 items-center justify-between gap-3 py-2 text-body text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                        >
                          <span className="min-w-0 break-words">
                            {locale === "en" && book.id === "ki-landschaft"
                              ? "AI in German small and medium-sized businesses"
                              : book.title}
                          </span>
                          <span className="shrink-0 text-caption text-muted-foreground no-underline">
                            {pageCopy.publicLabel}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-[75rem] gap-8 border-t-2 border-foreground pt-6 md:grid-cols-2 md:gap-12">
          <div data-demo-continuation className="flex min-w-0 flex-col items-start gap-3">
            <p className="text-label text-muted-foreground">
              {pageCopy.continueLearning}
            </p>
            <p className="text-fluid-h3 font-bold text-foreground">
              {course ? course.title : demo.courseSlug}
            </p>
            <Link
              href={localizedCourseLink}
              prefetch={false}
              className="group inline-flex min-h-11 items-center gap-2 border border-brand-orange bg-brand-orange px-5 text-[0.9375rem] font-semibold text-paper transition-colors duration-[120ms] hover:border-kupfer-dark hover:bg-kupfer-dark motion-reduce:transition-none"
            >
              {course
                ? pageCopy.openCourse(course.title)
                : pageCopy.openSuitableCourse}
              <ArrowGlyph />
            </Link>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-3 md:border-l md:border-hairline md:pl-12">
            <p className="text-label text-muted-foreground tabular-nums">
              {pageCopy.nextExample} · {next.n}
            </p>
            <p className="text-fluid-h3 font-bold text-foreground">
              {next.title} {next.titleKicker}
            </p>
            <DemoCta
              slug={demo.slug}
              target="next-demo"
              href={localizeHref(`/demos/${next.slug}?source=next-demo`, locale)}
              variant="secondary"
            >
              {pageCopy.next}
            </DemoCta>
          </div>
        </div>
      </section>
    </article>
  );
}
