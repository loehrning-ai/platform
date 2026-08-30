import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import {
  courseOutcomeCoverage,
  coveredCourseOutcomes,
  isCourseRecordEarned,
} from "@/lib/courses/competencies";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import { reportApiError } from "@/lib/observability/api-error";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";
import type { UnifiedProgress } from "@/lib/progress/types";
import { completedCanonicalLessonCount } from "@/lib/courses/completion";
import {
  hasCourseStarted,
  resolveCourseResumeHref,
} from "@/lib/courses/resume";
import type { CourseSlug } from "@/lib/course/types";
import { Card } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { ProgressSyncNotice } from "@/components/auth/progress-sync-notice";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { createNoindexPageMetadata } from "@/lib/seo/page-metadata";
import { ACCOUNT_COPY } from "./account-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return createNoindexPageMetadata(ACCOUNT_COPY[locale].metadata);
}

function completedLessons(
  progress: UnifiedProgress | null,
  slug: CourseSlug,
): number {
  return completedCanonicalLessonCount(progress, slug);
}

export default async function KontoPage() {
  const [locale, auth] = await Promise.all([
    getRequestLocale(),
    getAuthenticatedUser(),
  ]);
  const { configured, user, error: authError } = auth;
  const copy = ACCOUNT_COPY[locale];
  const courses = localizeCatalog(COURSE_CATALOG, locale);
  // An auth-backend outage returns {configured:true, user:null, error} — the
  // same shape as "logged out" minus the error. Redirecting on it signs a
  // signed-in learner out of a page they are still entitled to see, so the
  // outage is rendered instead.
  if (authError) {
    reportApiError({ route: "/konto", step: "auth-get-user", error: authError });
  }
  if (configured && !user && !authError) {
    const accountHref = localizeHref("/konto", locale);
    redirect(localizeHref(`/login?next=${accountHref}`, locale));
  }

  const authUnavailable = Boolean(authError);
  let progress: UnifiedProgress | null = null;
  let updatedAt: string | null = null;
  let progressUnavailable = authUnavailable;
  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({
      route: "/konto",
      step: "auth-create-client",
      error,
    });
    supabase = null;
    progressUnavailable = true;
  }
  if (user && !supabase) progressUnavailable = true;
  if (supabase && user) {
    const fetched = await fetchUnifiedProgressForUser(supabase, user.id);
    if (fetched.ok) {
      progress = fetched.result.progress;
      updatedAt = fetched.result.updatedAt;
    } else {
      progressUnavailable = true;
    }
  }

  // Course-level rollups.
  const courseState = courses.map((course) => {
    const done = completedLessons(progress, course.slug);
    const pct =
      course.totalLessons > 0
        ? Math.min(100, Math.round((done / course.totalLessons) * 100))
        : 0;
    return {
      course,
      done,
      pct,
      recordEarned: isCourseRecordEarned(progress, course.slug),
      started: done > 0 || hasCourseStarted(progress, course.slug),
      resumeHref: resolveCourseResumeHref(progress, course.slug),
      lastActivity: progress?.courses[course.slug]?.lastActivity ?? null,
    };
  });

  const coursesDone = courseState.filter((c) => c.recordEarned).length;
  // "Next" and the "all done" state use the same record-earned definition as
  // the count, so the available action cannot contradict the tally.
  const nextCourse =
    courseState
      .filter((c) => !c.recordEarned)
      .sort((left, right) => {
        const leftAt = left.lastActivity ? Date.parse(left.lastActivity) : 0;
        const rightAt = right.lastActivity ? Date.parse(right.lastActivity) : 0;
        return rightAt - leftAt;
      })[0] ?? null;
  const { covered: coveredCount, total: totalOutcomes } =
    courseOutcomeCoverage(progress);
  const covered = coveredCourseOutcomes(progress, locale);

  // Group curriculum outcomes under the completed course that covered them.
  const coveredByCourse = courses
    .map((course) => ({
      course,
      items: covered.filter((outcome) => outcome.courseSlug === course.slug),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {authUnavailable
                ? copy.authUnavailableIdentity
                : copy.signedIn(user?.email ?? copy.localIdentity)}
            </p>
          </div>
          {authUnavailable ? null : (
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {copy.logout}
                <LogOut size={14} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        {/* A stopped or exhausted background sync leaves the record below
            stale on other devices. It was previously announced only on
            /konto/datenschutz, which a learner reading their record never
            passes through. */}
        <ProgressSyncNotice locale={locale} />

        {progressUnavailable ? (
          <div
            role="alert"
            className="mt-6 border border-border border-l-[3px] border-l-brand-orange bg-kupfer-mist p-4"
          >
            <p className="font-semibold text-foreground">
              {authUnavailable
                ? copy.authUnavailableTitle
                : copy.unavailableTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {authUnavailable ? copy.authUnavailableBody : copy.unavailableBody}
            </p>
          </div>
        ) : (
          <>
            {/* Overview: three honest rollups */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Card className="gap-1">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.coursesCompleted}
                </span>
                <span className="text-2xl font-bold tracking-[-0.03em] text-foreground">
                  {coursesDone}
                  <span className="text-muted-foreground">
                    /{COURSE_CATALOG.length}
                  </span>
                </span>
              </Card>
              <Card className="gap-1">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.outcomesCovered}
                </span>
                <span className="text-2xl font-bold tracking-[-0.03em] text-foreground">
                  {coveredCount}
                  <span className="text-muted-foreground">
                    /{totalOutcomes}
                  </span>
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

            {/* Per-course progress */}
            <h2 className="mt-12 text-2xl font-bold tracking-[-0.03em] text-foreground">
              {copy.coursesHeading}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {courseState.map(
                ({ course, done, pct, recordEarned, started, resumeHref }) => (
                  <Card key={course.slug} className="h-full gap-0">
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
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {copy.lessonProgress(done, course.totalLessons, pct)}
                    </p>
                    {/* Progress bar */}
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden bg-track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={copy.progressAria(course.title)}
                    >
                      <div
                        className="h-full bg-brand-orange"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <Link
                      href={localizeHref(
                        started ? resumeHref : course.startHref,
                        locale,
                      )}
                      className="mt-3 inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                    >
                      {recordEarned
                        ? copy.viewRecord
                        : started
                          ? copy.resume
                          : copy.start}{" "}
                      →
                    </Link>
                  </Card>
                ),
              )}
            </div>

            {/* Course outcomes covered by completed curriculum. */}
            <section className="mt-12" aria-labelledby="outcomes-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  id="outcomes-heading"
                  className="text-2xl font-bold tracking-[-0.03em] text-foreground"
                >
                  {copy.outcomesHeading}
                </h2>
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
          </>
        )}

        {/* Supporting resources */}
        <h2 className="mt-12 text-2xl font-bold tracking-[-0.03em] text-foreground">
          {copy.deepenHeading}
        </h2>
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

        {/* Storage and legacy-export disclosure */}
        <aside className="mt-8 border border-border border-l-[3px] border-l-brand-orange p-4">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {copy.localDataHeading}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {copy.localDataBody}
          </p>
        </aside>

        <nav
          aria-label={copy.privacyNavigationLabel}
          className="mt-4 border-t border-border pt-4"
        >
          <p className="text-sm text-muted-foreground">
            <Link
              href={localizeHref("/konto/datenschutz", locale)}
              className="inline-flex min-h-11 items-center font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.privacyLink}
            </Link>
            {": "}
            {copy.privacySummary}
          </p>
        </nav>
      </div>
    </section>
  );
}
