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
  labels: { readonly module: string; readonly lesson: string; readonly block: string },
): string {
  const moduleMatch = lessonId.match(/^modul_(\d+)_lesson_(\d+)$/);
  if (moduleMatch) return `${labels.module} ${moduleMatch[1]} · ${labels.lesson} ${moduleMatch[2]}`;
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
function lessonHref(courseSlug: string, basePath: string, lessonId: string): string {
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
  const baseCourse = COURSE_CATALOG.find((item) => item.slug === demo.courseSlug);
  const course = baseCourse ? localizeCatalogCourse(baseCourse, locale) : undefined;
  const relatedBooks = demo.bookSlugs
    .map((slug) => books.find((book) => book.id === slug))
    .filter((book): book is (typeof books)[number] => book !== undefined);

  const stufe = pageCopy.stages[demo.level];
  const lessonLink = demo.lessonId && course
    ? lessonHref(demo.courseSlug, course.href, demo.lessonId)
    : (course?.startHref ?? "/kurse");
  const lessonDisplay = demo.lessonId ? lessonLabel(demo.lessonId, pageCopy) : null;
  const catalogHref = localizeHref("/demos", locale);
  const categoryLabel = DEMO_CATEGORY_LABELS[locale][demo.category];
  const levelLabel = DEMO_LEVEL_LABELS_BY_LOCALE[locale][demo.level];
  const localizedLessonLink = localizeHref(lessonLink, locale);
  const localizedCourseLink = localizeHref(course?.startHref ?? "/kurse", locale);

  return (
    <article className="min-h-[100svh] overflow-x-clip pt-20">
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-card/10 px-4 py-3 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-muted-foreground sm:text-xs sm:tracking-[0.14em]">
          <Link
            href={catalogHref}
            className="inline-flex min-h-11 items-center gap-2 hover:text-foreground"
          >
            <ArrowLeft size={12} strokeWidth={2.5} />
            {pageCopy.allExamples}
          </Link>
          <span className="break-words text-right">
            {pageCopy.example} {demo.n} · {categoryLabel} · {levelLabel}
          </span>
        </div>
      </div>

      {/* Kurskontext banner — visible without scrolling, primary navigation signal */}
      <div className="border-b border-brand-orange/30 bg-brand-orange/5 px-4 py-3 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <BookOpen
              size={14}
              strokeWidth={2}
              className="shrink-0 text-brand-orange"
              aria-hidden="true"
            />
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {pageCopy.courseContext}
            </div>
            <div className="min-w-0 break-words font-mono text-[11px] text-foreground">
              <span className="font-bold text-brand-orange">
                {course ? course.title : demo.courseSlug}
              </span>
              {lessonDisplay && (
                <span className="text-muted-foreground"> · {lessonDisplay}</span>
              )}
              <span className="ml-0 mt-1 inline-block border border-border bg-card/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:ml-3 sm:mt-0 sm:tracking-[0.1em]">
                {pageCopy.pathway} · {stufe}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={localizedLessonLink}
              prefetch={false}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange hover:underline"
            >
              {pageCopy.toLesson}
              <ArrowUpRight size={11} strokeWidth={2.5} />
            </Link>
            <Link
              href={catalogHref}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground"
            >
              {pageCopy.toGallery}
              <ArrowUpRight size={11} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="px-4 py-12 sm:px-6 md:px-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-brand-orange bg-brand-orange/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              {categoryLabel}
            </span>
            <span className="border border-foreground/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground">
              {levelLabel}
            </span>
            {demo.illustrative && (
              <span
                className="border border-foreground/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                title={pageCopy.illustrativeTitle}
              >
                ◆ {pageCopy.illustrative}
              </span>
            )}
          </div>
          <h1 className="mt-5 max-w-5xl break-words text-[clamp(2.25rem,8vw,4.75rem)] font-black leading-[0.98] tracking-[-0.04em]">
            {demo.title}{" "}
            <span className="text-brand-orange">{demo.titleKicker}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {demo.description}
          </p>
          <div className="mt-3 max-w-3xl break-words font-mono text-[11px] uppercase leading-5 tracking-[0.1em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">
            ◆ {demo.background}
          </div>
        </div>
      </section>

      {/* Interactive demo */}
      <section className="border-y border-border/40 bg-card/10 px-2 py-8 sm:px-4 sm:py-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <EvidenceBadge
            evidenceMode={demo.evidenceMode}
            externalActionMode={demo.externalActionMode}
            locale={locale}
          />
          <DemoShell demo={demo} locale={locale} />
        </div>
      </section>

      {/* Learning CTAs */}
      <section className="border-b border-border/40 px-4 py-8 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {pageCopy.continueLearning}
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href={localizedCourseLink}
              prefetch={false}
              className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
            >
              {course ? pageCopy.openCourse(course.title) : pageCopy.openSuitableCourse}
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
            <Link
              href="#demo-notes"
              className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
            >
              {pageCopy.inspectAssumptions}
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
            {relatedBooks.slice(0, 1).map((book) => (
              <Link
                key={book.id}
                href={localizeHref(book.readerHref, locale)}
                className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
              >
                {pageCopy.readBook}
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Meta + Why */}
      <section id="demo-notes" className="scroll-mt-24 px-4 py-12 sm:px-6 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {pageCopy.practiceData}
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
              {pageCopy.outputHeading}
            </h2>
            <div className="mt-5">
              <AnimatedMetaTable meta={demo.meta} locale={locale} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {demo.tags.map((t) => (
                <span
                  key={t}
                  className="border border-border bg-card/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {pageCopy.learningContext}
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
              {pageCopy.sandboxScenario}
            </h2>
            {copy && (
              <>
                <p className="mt-5 text-base leading-relaxed text-foreground/90">{copy.why}</p>
                <div className="mt-6 border-l-4 border-brand-orange bg-card/30 p-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                    ◆ {pageCopy.illustrative}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{copy.proof}</p>
                </div>
              </>
            )}
            <div className="mt-6 border border-border bg-background p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                {pageCopy.sandboxBoundary}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {demo.syntheticDataLabel}
              </p>
              {demo.riskNotes.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {demo.riskNotes.map((note) => (
                    <li key={note} className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-1">
                      <span aria-hidden="true">/</span>
                      <span className="min-w-0 break-words">{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {pageCopy.workContexts}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {demo.industries.map((i) => (
                  <Link
                    key={i}
                    href={localizeHref(`/demos?industry=${encodeURIComponent(i)}`, locale)}
                    className="min-h-11 break-words border border-border bg-background px-2.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground hover:border-brand-orange hover:text-brand-orange"
                  >
                    {i}
                  </Link>
                ))}
              </div>
            </div>
            {relatedBooks.length > 0 && (
              <div className="mt-6 border border-border bg-background p-4">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {pageCopy.relatedBooks}
                </div>
                <div className="mt-3 space-y-2">
                  {relatedBooks.map((book) => (
                    <Link
                      key={book.id}
                      href={localizeHref(book.readerHref, locale)}
                      className="flex items-center justify-between gap-3 border border-border bg-card/30 px-3 py-2 text-sm font-medium text-foreground hover:border-brand-orange hover:text-brand-orange"
                    >
                      <span className="min-w-0 break-words">
                        {locale === "en" && book.id === "ki-landschaft"
                          ? "AI in German small and medium-sized businesses"
                          : book.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {pageCopy.publicLabel}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Next demo */}
      <section className="border-t border-border/40 bg-card/10 px-4 py-10 sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {pageCopy.nextExample} · {next.n}
            </div>
            <div className="mt-1 text-xl font-bold tracking-[-0.02em]">
              {next.title} <span className="text-brand-orange">{next.titleKicker}</span>
            </div>
          </div>
          <DemoCta
            slug={demo.slug}
            target="next-demo"
            href={localizeHref(`/demos/${next.slug}?source=next-demo`, locale)}
          >
            {pageCopy.next}
          </DemoCta>
        </div>
      </section>
    </article>
  );
}
