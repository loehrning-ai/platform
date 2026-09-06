import Image from "next/image";
import Link from "next/link";
import { COURSE_LEVEL_LABELS_BY_LOCALE } from "@/lib/courses/catalog-copy";
import { Card } from "@/components/ui/card";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { AccountPageCopy } from "../account-copy";
import type { AccountCourseEntry } from "./account-data";

/**
 * Catalog tile for one course on the account page.
 *
 * The heading sits exactly two levels below the card body (h3 -> header row ->
 * body), which the authenticated e2e walks up from to find the tile. Keep that
 * nesting when changing the layout.
 */
export function CourseCatalogCard({
  entry,
  copy,
  locale,
}: {
  readonly entry: AccountCourseEntry;
  readonly copy: AccountPageCopy;
  readonly locale: Locale;
}) {
  const { course, done, pct, recordEarned, started, resumeHref } = entry;
  return (
    <Card className="h-full gap-0 overflow-hidden p-0 sm:p-0">
      {course.coverImage ? (
        <span className="relative block aspect-[16/9] w-full overflow-hidden border-b border-border bg-background">
          <Image
            src={course.coverImage}
            alt={course.coverImageAlt ?? ""}
            fill
            loading="lazy"
            sizes="(min-width: 640px) 320px, 100vw"
            className="object-cover"
          />
        </span>
      ) : null}
      <div className="flex h-full flex-col gap-0 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
            {course.title}
          </h3>
          {recordEarned ? (
            <span className="border-l-[3px] border-brand-orange pl-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
              {copy.recordEarned}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {course.tagline}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
          <span>{copy.lessonProgress(done, course.totalLessons, pct)}</span>
          <span aria-hidden="true">·</span>
          <span>{COURSE_LEVEL_LABELS_BY_LOCALE[locale][course.level]}</span>
          <span aria-hidden="true">·</span>
          <span>{course.duration}</span>
        </div>
        {/* Progress bar */}
        <div
          className="mt-2 h-1.5 w-full overflow-hidden bg-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={copy.progressAria(course.title)}
        >
          <div className="h-full bg-brand-orange" style={{ width: `${pct}%` }} />
        </div>
        <Link
          href={localizeHref(started ? resumeHref : course.startHref, locale)}
          className="mt-3 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          {recordEarned ? copy.viewRecord : started ? copy.resume : copy.start}{" "}
          →
        </Link>
      </div>
    </Card>
  );
}
