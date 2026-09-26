import Link from "next/link";
import { demoName, type Demo } from "@/lib/demos";
import {
  DEMO_CATEGORY_LABELS,
  DEMO_LEVEL_LABELS_BY_LOCALE,
  getNextDemoForLocale,
} from "@/lib/demos-localization";
import { DEMO_EVIDENCE_COPY, DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { books } from "@/lib/books";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import { getDemoCopy } from "@/lib/demos-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { ArrowGlyph, Kicker, SectionHead } from "@/components/werk";
import { DemoShell } from "./demo-shell";
import { DemoCta } from "./demo-cta";
import {
  DemoNotesDisclosure,
  DemoNotesPanel,
  DemoNotesToggle,
} from "./demo-notes-disclosure";

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
  const tileCopy = DEMOS_PAGE_COPY[locale].tile;
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
  const actionValue = pageCopy.actionValue[demo.externalActionMode];
  const localizedLessonLink = localizeHref(lessonLink, locale);
  const name = demoName(demo);
  const nextName = demoName(next);
  // Blueprint 7.6: four rows, values in body. The data row says once what
  // is invented; the evidence line in the engine header does not repeat it.
  // The actions row takes a short value ("Simuliert"), because its label
  // already says "Externe Aktionen".
  // Below sm the execution and actions rows drop out: the evidence line in
  // the engine header already states both.
  const notesPanels =
    demo.riskNotes.length > 0 ? ["checks", "run"] : ["run"];
  const runRows = [
    { label: pageCopy.dataLabel, value: demo.syntheticDataLabel, phone: true },
    { label: pageCopy.executionLabel, value: evidenceLabel, phone: false },
    { label: pageCopy.actionsLabel, value: actionValue, phone: false },
    ...(copy
      ? [{ label: pageCopy.stopLabel, value: copy.stop, phone: true }]
      : []),
  ];

  return (
    <article className="overflow-x-clip" data-demo-detail-layout>
      {/*
        Header and instrument share one paper band: back link, kicker,
        one-colour H1, lead, then the engine. Its evidence line (mode and
        actions) sits in the engine's own header row. The engine never
        server-renders (dynamic(..., {ssr:false})), so this band carries first
        paint. A dark engine only turns its own frame graphit (DemoShell); the
        band stays paper. The section is deliberately unnamed: named, it
        became a region landmark whose name matched the engine's own region
        (landmark-unique).

        Below sm the back link and the kicker share one 44px row, the lead is
        the one-sentence teaser and the gaps are tighter, so the engine starts
        in the first screen even at 320. From sm up the link sits on its own
        line above the kicker and the full description returns.
      */}
      <section
        data-demo-detail-hero
        data-demo-instrument
        className="px-4 pb-10 pt-0 sm:px-6 sm:pb-12 sm:pt-6"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-wrap items-center gap-x-3 sm:block"
            data-demo-detail-top
          >
            <nav aria-label={pageCopy.catalog}>
              <Link
                href={catalogHref}
                aria-label={pageCopy.allExamples}
                className="inline-flex min-h-11 items-center gap-2 text-label text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
              >
                <ArrowGlyph className="rotate-180" />
                <span className="sm:hidden">{pageCopy.catalog}</span>
                <span className="max-sm:hidden">{pageCopy.allExamples}</span>
              </Link>
            </nav>
            <Kicker className="sm:mt-6">
              <span className="max-sm:hidden">{pageCopy.example} </span>
              {demo.n} · {categoryLabel}
              {/* Under 360px the level drops so link and kicker keep one row. */}
              <span className="max-[359px]:hidden"> · {levelLabel}</span>
            </Kicker>
          </div>
          <h1
            id="demo-title"
            className="mt-1 max-w-[26ch] break-words text-fluid-h1 font-bold text-foreground text-balance hyphens-manual max-[359px]:text-[1.875rem] sm:mt-3"
          >
            {name}
          </h1>
          <p
            className="mt-2 text-[1.0625rem] leading-normal text-muted-foreground text-pretty sm:hidden"
            data-demo-detail-teaser
          >
            {demo.teaser}
          </p>
          <p className="mt-4 max-w-[60ch] text-lead text-muted-foreground text-pretty max-sm:hidden">
            {demo.description}
          </p>

          <div className="mt-4 sm:mt-6">
            <DemoShell demo={demo} locale={locale} />
          </div>
        </div>
      </section>

      <section
        id="demo-notes"
        data-demo-notes
        className="scroll-mt-24 px-4 pb-12 sm:px-6 sm:pb-16"
      >
        {/* Below sm the checks and the run table fold behind one closed
            "So prüfst du das Beispiel" button; from sm up both columns read
            as before. */}
        <DemoNotesDisclosure
          panels={notesPanels}
          className="mx-auto grid max-w-6xl items-start gap-12 max-sm:gap-8 lg:grid-cols-12 lg:gap-x-12"
        >
          <div className="min-w-0 lg:col-span-7">
            <SectionHead title={pageCopy.aboutHeading} />
            {copy ? (
              <div className="mt-6 max-w-[64ch] space-y-4 text-body text-foreground max-sm:mt-4">
                <p>{copy.why}</p>
                <p className="text-muted-foreground">{copy.proof}</p>
              </div>
            ) : null}

            <DemoNotesToggle
              label={pageCopy.notesToggle}
              panels={notesPanels}
              className="mt-6"
            />

            {demo.riskNotes.length > 0 ? (
              <DemoNotesPanel part="checks" className="mt-10 max-sm:mt-4">
                <h3 className="text-label text-foreground">
                  {pageCopy.checksHeading}
                </h3>
                <ul className="mt-3 max-w-[64ch] border-t border-hairline text-body">
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
              </DemoNotesPanel>
            ) : null}
          </div>

          <div className="min-w-0 lg:col-span-5">
            <DemoNotesPanel part="run" className="max-sm:mb-6">
              <SectionHead title={pageCopy.runHeading} />
              <dl className="mt-6 border-t border-hairline max-sm:mt-4" data-demo-run-rows>
                {runRows.map((row) => (
                  <div
                    key={row.label}
                    data-demo-run-row-phone={row.phone ? "true" : "false"}
                    className={`grid grid-cols-[8.5rem_minmax(0,1fr)] items-baseline gap-4 border-b border-hairline py-3 max-sm:grid-cols-[6rem_minmax(0,1fr)] max-sm:gap-3${row.phone ? "" : " max-sm:hidden"}`}
                  >
                    <dt className="text-label text-muted-foreground">{row.label}</dt>
                    <dd className="min-w-0 break-words text-body text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </DemoNotesPanel>

            {/* Work contexts are real links into the filtered gallery, drawn
                as text links so they do not pose as filter buttons. */}
            <div className="mt-8 max-sm:mt-0">
              <h3 className="text-label text-foreground">
                {pageCopy.workContexts}
              </h3>
              <ul className="mt-1 flex flex-wrap gap-x-5">
                {demo.industries.map((industry) => (
                  <li key={industry}>
                    <Link
                      href={localizeHref(
                        `/demos?industry=${encodeURIComponent(industry)}`,
                        locale,
                      )}
                      aria-label={pageCopy.workContextAria(industry)}
                      className="inline-flex min-h-11 min-w-6 items-center text-body text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                    >
                      {industry}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {relatedBooks.length > 0 ? (
              <div className="mt-8">
                <h3 className="text-label text-foreground">
                  {pageCopy.relatedBooks}
                </h3>
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
        </DemoNotesDisclosure>
      </section>

      {/* Continuation: the course lesson (the page's one Mennige button) and
          the next example, each named once. */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-6xl gap-8 border-t-2 border-foreground pt-6 md:grid-cols-2 md:gap-12">
          <div data-demo-continuation className="flex min-w-0 flex-col items-start gap-3">
            <p className="text-label text-muted-foreground tabular-nums">
              {pageCopy.courseHeading}
              {lessonDisplay ? ` · ${lessonDisplay}` : ""}
            </p>
            <p className="text-fluid-h3 font-bold text-foreground text-balance">
              {course ? course.title : demo.courseSlug}
            </p>
            <Link
              href={localizedLessonLink}
              prefetch={false}
              className="group inline-flex min-h-11 items-center gap-2 border border-brand-orange bg-brand-orange px-5 text-[0.9375rem] font-semibold text-paper transition-colors duration-[120ms] hover:border-kupfer-dark hover:bg-kupfer-dark motion-reduce:transition-none"
            >
              {demo.lessonId ? pageCopy.toLesson : pageCopy.openCourse}
              <ArrowGlyph />
            </Link>
          </div>
          {/* Same order as the course side: kicker, title, action. Below md
              the two stack, so a hairline separates them. */}
          <div
            data-demo-next
            className="flex min-w-0 flex-col items-start gap-3 max-md:border-t max-md:border-hairline max-md:pt-6 md:border-l md:border-hairline md:pl-12"
          >
            <p className="text-label text-muted-foreground tabular-nums">
              {pageCopy.nextExample} · {next.n}
            </p>
            <p className="text-fluid-h3 font-bold text-foreground text-balance">
              {nextName}
            </p>
            {/* The one-sentence teaser, never clamped: a cut description
                read as unfinished. */}
            <p className="max-w-[48ch] text-caption text-muted-foreground max-sm:text-[0.875rem]">
              {next.teaser}
            </p>
            <DemoCta
              slug={demo.slug}
              target="next-demo"
              href={localizeHref(`/demos/${next.slug}?source=next-demo`, locale)}
              variant="secondary"
              ariaLabel={`${tileCopy.open}: ${nextName}`}
            >
              {tileCopy.open}
            </DemoCta>
          </div>
        </div>
      </section>
    </article>
  );
}
