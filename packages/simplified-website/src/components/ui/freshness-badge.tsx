import type { ReactNode } from "react";

interface FreshnessBadgeProps {
  readonly lastReviewed: string;
  readonly nextReview: string;
  readonly riskClass?: string;
}

function formatMonthYear(isoDate: string): string {
  // Parse as UTC to avoid timezone-offset day shifts
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
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
}: FreshnessBadgeProps): ReactNode {
  const overdue = isOverdue(nextReview);

  return (
    <div
      data-testid="freshness-badge"
      role="note"
      aria-label={`Inhalt zuletzt geprüft: ${formatMonthYear(lastReviewed)}`}
      className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
    >
      <span>
        Stand: <time dateTime={lastReviewed}>{formatMonthYear(lastReviewed)}</time>
      </span>
      {riskClass && (
        <span className="rounded border border-border px-1.5 py-0.5 font-mono uppercase tracking-wide">
          {riskClass}
        </span>
      )}
      {overdue && (
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
          Aktualisierung ausstehend
        </span>
      )}
    </div>
  );
}
