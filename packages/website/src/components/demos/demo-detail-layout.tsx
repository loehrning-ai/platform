import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import type { Demo } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
  getNextDemoForLocale,
} from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import { getDemoCopy } from "@/lib/demos-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
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
  const localizedLessonLink = localizeHref(lessonLink, locale);
  const localizedCourseLink = localizeHref(
    course?.startHref ?? "/kurse",
    locale,
  );

  return (
    <article className="min-h-[100svh] overflow-x-clip">
      <header className="border-b border-border bg-background px-4 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.11em] text-muted-foreground sm:tracking-[0.14em]">
            <Link
              href={catalogHref}
              className="inline-flex min-h-11 items-center gap-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <ArrowLeft size={14} strokeWidth={2.5} aria-hidden="true" />
              {pageCopy.allExamples}
            </Link>
            <span className="break-words text-right">
              {pageCopy.example} {demo.n} · {categoryLabel} · {levelLabel}
            </span>
          </div>

          <div className="grid gap-2 border-t border-border py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <BookOpen
                size={16}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-brand-orange"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {pageCopy.courseContext}
                </div>
                <div className="mt-1 break-words text-sm text-foreground">
                  <span className="font-bold text-brand-orange">
                    {course ? course.title : demo.courseSlug}
                  </span>
                  {lessonDisplay ? ` · ${lessonDisplay}` : ""} ·{" "}
                  {pageCopy.pathway} · {stufe}
                </div>
              </div>
            </div>
            <Link
              href={localizedLessonLink}
              prefetch={false}
              className="inline-flex min-h-11 items-center gap-2 border border-border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {pageCopy.toLesson}
              <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 py-6 sm:px-6 sm:py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-brand-orange bg-brand-orange/10 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {categoryLabel}
            </span>
            <span className="border border-border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground">
              {levelLabel}
            </span>
            {demo.illustrative ? (
              <span
                className="border border-border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
                title={pageCopy.illustrativeTitle}
              >
                ◆ {pageCopy.illustrative}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-5xl break-words text-[clamp(2.25rem,6vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.04em]">
            {demo.title}{" "}
            <span className="text-brand-orange">{demo.titleKicker}</span>
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {demo.description}
          </p>
          <div className="mt-3 max-w-4xl break-words font-mono text-xs uppercase leading-5 tracking-[0.1em] text-muted-foreground">
            ◆ {demo.background}
          </div>
        </div>
      </section>

      <section
        data-demo-instrument
        className="border-y border-border bg-card px-2 py-6 sm:px-4 md:px-10"
        aria-label={`${demo.title} ${demo.titleKicker}`}
      >
        <div className="mx-auto max-w-6xl">
          <EvidenceBadge
            evidenceMode={demo.evidenceMode}
            externalActionMode={demo.externalActionMode}
            locale={locale}
          />
          <DemoShell demo={demo} locale={locale} />
        </div>
      </section>

      <section
        id="demo-notes"
        data-demo-notes
        className="scroll-mt-24 px-4 py-8 sm:px-6 md:px-10"
      >
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {pageCopy.practiceData}
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em]">
              {pageCopy.outputHeading}
            </h2>
            <div className="mt-4">
              <AnimatedMetaTable meta={demo.meta} locale={locale} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {demo.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border bg-card px-2.5 py-1 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {pageCopy.learningContext}
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em]">
              {pageCopy.sandboxScenario}
            </h2>
            {copy ? (
              <>
                <p className="mt-4 text-sm leading-relaxed text-foreground sm:text-base">
                  {copy.why}
                </p>
                <div className="mt-4 border border-border border-l-[3px] border-l-brand-orange bg-card p-4">
                  <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                    ◆ {pageCopy.illustrative}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {copy.proof}
                  </p>
                </div>
              </>
            ) : null}
            <div className="mt-4 border border-border bg-background p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                {pageCopy.sandboxBoundary}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {demo.syntheticDataLabel}
              </p>
              {demo.riskNotes.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {demo.riskNotes.map((note) => (
                    <li
                      key={note}
                      className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-1"
                    >
                      <span aria-hidden="true">/</span>
                      <span className="min-w-0 break-words">{note}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <details className="mt-4 border border-border bg-background">
              <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange">
                {pageCopy.workContexts}
              </summary>
              <div className="flex flex-wrap gap-2 border-t border-border p-3">
                {demo.industries.map((industry) => (
                  <Link
                    key={industry}
                    href={localizeHref(
                      `/demos?industry=${encodeURIComponent(industry)}`,
                      locale,
                    )}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center break-words border border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    {industry}
                  </Link>
                ))}
              </div>
            </details>

            {relatedBooks.length > 0 ? (
              <details className="mt-3 border border-border bg-background">
                <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange">
                  {pageCopy.relatedBooks}
                </summary>
                <div className="grid gap-px border-t border-border bg-border">
                  {relatedBooks.map((book) => (
                    <Link
                      key={book.id}
                      href={localizeHref(book.readerHref, locale)}
                      className="flex min-h-11 items-center justify-between gap-3 bg-background px-3 py-2 text-sm font-medium text-foreground hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                    >
                      <span className="min-w-0 break-words">
                        {locale === "en" && book.id === "ki-landschaft"
                          ? "AI in German small and medium-sized businesses"
                          : book.title}
                      </span>
                      <span className="shrink-0 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                        {pageCopy.publicLabel}
                      </span>
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </section>

      <section
        data-demo-continuation
        className="border-y border-border bg-card px-4 py-6 sm:px-6 md:px-10"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {pageCopy.continueLearning}
            </div>
            <div className="mt-1 break-words text-sm font-semibold text-foreground">
              {course ? course.title : demo.courseSlug}
            </div>
          </div>
          <Link
            href={localizedCourseLink}
            prefetch={false}
            className="inline-flex min-h-11 items-center gap-2 border border-brand-orange bg-brand-orange px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white hover:border-foreground hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {course
              ? pageCopy.openCourse(course.title)
              : pageCopy.openSuitableCourse}
            <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {pageCopy.nextExample} · {next.n}
            </div>
            <div className="mt-1 text-lg font-bold tracking-[-0.02em]">
              {next.title}{" "}
              <span className="text-brand-orange">{next.titleKicker}</span>
            </div>
          </div>
          <DemoCta
            slug={demo.slug}
            target="next-demo"
            href={localizeHref(`/demos/${next.slug}?source=next-demo`, locale)}
            variant="secondary"
          >
            {pageCopy.next}
          </DemoCta>
        </div>
      </section>
    </article>
  );
}
