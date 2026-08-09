"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { getCourseReaderCopy } from "@/components/course/kurs/course-ui-copy";

interface FreshnessBadgeProps {
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly riskClass?: string;
  readonly locale?: Locale;
}

function formatMonthYear(isoDate: string, locale: Locale): string {
  // Parse as UTC to avoid timezone-offset day shifts
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(
    getCourseReaderCopy(locale).freshness.dateLocale,
    {
      month: "long",
      year: "numeric",
    },
  );
}

function isOverdue(nextReview: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = nextReview.split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

/**
 * FreshnessBadge — shows "Stand: [Monat Jahr]" for content pages.
 *
 * Per §10b coordination contracts: this component is DISTINCT from
 * <LegalClaimBadge claimId> (legal-source governance), which handles legal-date badges.
 * Do NOT rename to StandBadge.
 */
export function FreshnessBadge({
  lastReviewed,
  nextReview,
  riskClass,
  locale = "de",
}: FreshnessBadgeProps): ReactNode {
  const copy = getCourseReaderCopy(locale).freshness;
  const formattedDate = formatMonthYear(lastReviewed, locale);
  // `new Date()` must not run during render (server/client clocks can disagree
  // across midnight), so the overdue flag is derived after mount.
  const [overdue, setOverdue] = useState(false);
  useEffect(() => {
    setOverdue(isOverdue(nextReview));
  }, [nextReview]);

  return (
    <div
      data-testid="freshness-badge"
      role="note"
      aria-label={copy.aria(formattedDate)}
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
    >
      <span>
        {copy.label}: <time dateTime={lastReviewed}>{formattedDate}</time>
      </span>
      {riskClass && (
        <span className="rounded border border-border px-1.5 py-0.5 font-mono uppercase tracking-wide">
          {riskClass}
        </span>
      )}
      {overdue && (
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
          {copy.overdue}
        </span>
      )}
    </div>
  );
}
