import Link from "next/link";
import { getCourseConfig } from "@/lib/course/config";
import { Card } from "@/components/ui/card";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { AccountPageCopy } from "../account-copy";
import {
  KONTO_SECTION_IDS,
  type AccountCourseEntry,
  type CoveredOutcomeGroup,
} from "./account-data";
import { RECORD_VERIFICATION_COPY } from "./region-copy";

/**
 * Teilnahmebestätigungen: the records a completed course actually issues.
 *
 * Every entry carries both halves of one record: the course's own certificate
 * route, which issues the document and its verification code, and the
 * course's public verification route, where that code is checked without a
 * sign-in. The second link is what makes the record worth anything to a third
 * party, so it belongs next to the first rather than only on the printed
 * certificate. Both routes come from the course config, because the courses
 * live under different path shapes and do not all issue the same record.
 *
 * The covered-outcome list below states what those completed courses covered,
 * and says plainly that it proves neither mastery nor an accredited
 * qualification.
 */
export function TeilnahmebestaetigungenSection({
  copy,
  locale,
  earnedRecords,
  coveredCount,
  totalOutcomes,
  coveredByCourse,
}: {
  readonly copy: AccountPageCopy;
  readonly locale: Locale;
  readonly earnedRecords: readonly AccountCourseEntry[];
  readonly coveredCount: number;
  readonly totalOutcomes: number;
  readonly coveredByCourse: readonly CoveredOutcomeGroup[];
}) {
  const verification = RECORD_VERIFICATION_COPY[locale];

  return (
    <section
      id={KONTO_SECTION_IDS.nachweise}
      aria-labelledby="konto-nachweise-heading"
      className="mt-12 scroll-mt-24"
    >
      <h2
        id="konto-nachweise-heading"
        className="text-2xl font-bold tracking-[-0.03em] text-foreground"
      >
        {copy.recordsHeading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.recordsIntro}
      </p>

      {earnedRecords.length > 0 ? (
        <ul className="mt-4 grid gap-px border border-border bg-border">
          {earnedRecords.map((entry) => {
            const config = getCourseConfig(entry.course.slug, locale);
            return (
              <li
                key={entry.course.slug}
                className="border-l-[3px] border-l-brand-orange bg-background"
              >
                <Link
                  href={localizeHref(entry.resumeHref, locale)}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {entry.course.title}
                  </span>{" "}
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                    {copy.recordOpen(config.recordNoun.label)}{" "}
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <p className="border-t border-border px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  <Link
                    href={localizeHref(
                      `${config.basePath}/verifizierung`,
                      locale,
                    )}
                    className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    {verification.link}
                  </Link>
                  {": "}
                  {verification.summary}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <Card className="mt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.recordsEmpty}
          </p>
        </Card>
      )}

      {/* What the completed courses covered. */}
      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
        <h3
          id="outcomes-heading"
          className="scroll-mt-24 text-lg font-bold tracking-[-0.02em] text-foreground"
        >
          {copy.outcomesHeading}
        </h3>
        <span className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-brand-orange">
          {copy.outcomeCount(coveredCount, totalOutcomes)}
        </span>
      </div>

      {coveredByCourse.length > 0 ? (
        <div className="mt-4 space-y-4">
          {coveredByCourse.map(({ course, items }) => (
            <div key={course.slug}>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {copy.outcomeSource(course.title)}
              </p>
              <ul className="mt-2 grid gap-px border border-border bg-border sm:grid-cols-2">
                {items.map((outcome) => (
                  <li
                    key={outcome.id}
                    className="border-l-[3px] border-l-brand-orange bg-background px-3 py-2.5 text-sm font-semibold text-foreground"
                  >
                    {outcome.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <Card className="mt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {copy.noOutcomes}
          </p>
        </Card>
      )}

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {copy.outcomeBoundary}
      </p>
    </section>
  );
}
