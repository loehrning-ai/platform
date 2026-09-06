import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { AccountPageCopy } from "../account-copy";
import { ImportProgressIsland } from "../import-progress-island";
import { KONTO_SECTION_IDS, type AccountCourseEntry } from "./account-data";

/**
 * Weiterlernen: the one learning thread across devices.
 *
 * Three honest rollups, the next step, and the reference material that stays
 * useful even when the record itself cannot be read. The outage alert lives
 * here rather than above the regions because this is the region it replaces:
 * an unreadable record must not be rendered as an empty one, and an auth
 * outage must never sign a learner out of a page they are entitled to see.
 *
 * The page's one client island sits in the same branch as the rollups. It
 * offers this browser's anonymous learning namespace to the account, and it
 * belongs only where the account's own record could actually be read: an
 * import cannot honestly be offered against a record the page just failed to
 * load, and it would fail against the same backend on the way to the server.
 */
export function WeiterlernenSection({
  copy,
  locale,
  progressUnavailable,
  authUnavailable,
  coursesDone,
  courseCount,
  coveredCount,
  totalOutcomes,
  updatedAt,
  nextCourse,
}: {
  readonly copy: AccountPageCopy;
  readonly locale: Locale;
  readonly progressUnavailable: boolean;
  readonly authUnavailable: boolean;
  readonly coursesDone: number;
  readonly courseCount: number;
  readonly coveredCount: number;
  readonly totalOutcomes: number;
  readonly updatedAt: string | null;
  readonly nextCourse: AccountCourseEntry | null;
}) {
  return (
    <section
      id={KONTO_SECTION_IDS.weiterlernen}
      aria-labelledby="konto-weiterlernen-heading"
      className="mt-8 scroll-mt-24"
    >
      <h2
        id="konto-weiterlernen-heading"
        className="text-2xl font-bold tracking-[-0.03em] text-foreground"
      >
        {copy.continueHeading}
      </h2>

      {progressUnavailable ? (
        <div
          role="alert"
          className="mt-4 border border-border border-l-[3px] border-l-brand-orange bg-kupfer-mist p-4"
        >
          <p className="font-semibold text-foreground">
            {authUnavailable ? copy.authUnavailableTitle : copy.unavailableTitle}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {authUnavailable ? copy.authUnavailableBody : copy.unavailableBody}
          </p>
        </div>
      ) : (
        <>
          {/* Overview: three honest rollups */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Card className="gap-1">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {copy.coursesCompleted}
              </span>
              <span className="text-2xl font-bold tracking-[-0.03em] text-foreground">
                {coursesDone}
                <span className="text-muted-foreground">/{courseCount}</span>
              </span>
            </Card>
            <Card className="gap-1">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {copy.outcomesCovered}
              </span>
              <span className="text-2xl font-bold tracking-[-0.03em] text-foreground">
                {coveredCount}
                <span className="text-muted-foreground">/{totalOutcomes}</span>
              </span>
            </Card>
            <Card className="gap-1">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {copy.lastSynchronized}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {updatedAt
                  ? new Date(updatedAt).toLocaleDateString(
                      locale === "de" ? "de-DE" : "en-GB",
                    )
                  : copy.noSavedProgress}
              </span>
            </Card>
          </div>

          {/* Continue where you left off */}
          {nextCourse ? (
            <Card accent="kupfer" className="mt-4 bg-kupfer-mist">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {copy.continueLabel}
              </p>
              <p className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground">
                {nextCourse.course.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextCourse.course.tagline}
              </p>
              <div className="mt-4">
                <BrandButton
                  href={
                    nextCourse.started
                      ? localizeHref(nextCourse.resumeHref, locale)
                      : localizeHref(nextCourse.course.startHref, locale)
                  }
                  variant="primary"
                  size="sm"
                >
                  {nextCourse.started ? copy.resume : copy.start}{" "}
                  <ArrowRight size={15} aria-hidden="true" />
                </BrandButton>
              </div>
            </Card>
          ) : (
            <Card accent="kupfer" className="mt-4 bg-kupfer-mist">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {copy.statusLabel}
              </p>
              <p className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground">
                {copy.allComplete}
              </p>
              <div className="mt-4">
                <BrandButton
                  href={localizeHref("/buecher", locale)}
                  variant="outline"
                  size="sm"
                >
                  {copy.booksLink} <ArrowRight size={15} aria-hidden="true" />
                </BrandButton>
              </div>
            </Card>
          )}

          <ImportProgressIsland locale={locale} />
        </>
      )}

      {/* Reference material. Deliberately outside the progress branch: books
          and applied examples stay reachable while the record is unavailable. */}
      <h3
        id="konto-material"
        className="mt-10 scroll-mt-24 text-lg font-bold tracking-[-0.02em] text-foreground"
      >
        {copy.deepenHeading}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {copy.resources.map((tile) => (
          <Card
            key={tile.href}
            href={localizeHref(tile.href, locale)}
            className="h-full gap-2"
          >
            <span className="font-bold text-foreground group-hover:text-brand-orange">
              {tile.title}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {tile.body}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}
