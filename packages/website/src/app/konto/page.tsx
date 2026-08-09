import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import {
  competencyProgress,
  earnedCompetencies,
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
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
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

const SUPPORT_TILE_DECORATION = {
  books: { icon: BookOpen, accent: "amber" as const },
  demos: { icon: LayoutDashboard, accent: "sand" as const },
} as const;

export default async function KontoPage() {
  const [locale, auth] = await Promise.all([
    getRequestLocale(),
    getAuthenticatedUser(),
  ]);
  const { configured, user } = auth;
  const copy = ACCOUNT_COPY[locale];
  const courses = localizeCatalog(COURSE_CATALOG, locale);
  if (configured && !user) {
    const accountHref = localizeHref("/konto", locale);
    redirect(localizeHref(`/login?next=${accountHref}`, locale));
  }

  let progress: UnifiedProgress | null = null;
  let updatedAt: string | null = null;
  let progressUnavailable = false;
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
  // "Next" and the "all done" banner use the SAME definition as the count
  // (record earned), so the celebration can never contradict the "X/4" tally.
  const nextCourse =
    courseState
      .filter((c) => !c.recordEarned)
      .sort((left, right) => {
        const leftAt = left.lastActivity ? Date.parse(left.lastActivity) : 0;
        const rightAt = right.lastActivity ? Date.parse(right.lastActivity) : 0;
        return rightAt - leftAt;
      })[0] ?? null;
  const { earned: earnedCount, total: totalCompetencies } =
    competencyProgress(progress);
  const earned = earnedCompetencies(progress, locale);

  // Group earned competencies under the course that granted them.
  const earnedByCourse = courses
    .map((course) => ({
      course,
      items: earned.filter((c) => c.courseSlug === course.slug),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-5xl min-w-0 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-8">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {copy.signedIn(user?.email ?? copy.localIdentity)}
            </p>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-tile transition-colors hover:border-foreground hover:text-foreground"
            >
              {copy.logout}
              <LogOut size={14} aria-hidden="true" />
            </button>
          </form>
        </div>

        {progressUnavailable ? (
          <div
            role="alert"
            className="mt-8 border border-brand-orange bg-kupfer-mist p-5"
          >
            <p className="font-semibold text-foreground">
              {copy.unavailableTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {copy.unavailableBody}
            </p>
          </div>
        ) : (
          <>
            {/* Overview: three honest rollups */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card className="gap-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {copy.coursesCompleted}
                </span>
                <span className="text-3xl font-bold tracking-[-0.03em] text-foreground">
                  {coursesDone}
                  <span className="text-muted-foreground">
                    /{COURSE_CATALOG.length}
                  </span>
                </span>
              </Card>
              <Card className="gap-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {copy.competenciesEarned}
                </span>
                <span className="text-3xl font-bold tracking-[-0.03em] text-foreground">
                  {earnedCount}
                  <span className="text-muted-foreground">
                    /{totalCompetencies}
                  </span>
                </span>
              </Card>
              <Card className="gap-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
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
              <Card accent="kupfer" className="mt-6 bg-kupfer-mist">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.continueLabel}
                </p>
                <p className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground">
                  {nextCourse.course.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nextCourse.course.tagline}
                </p>
                <div className="mt-5">
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
              <Card accent="kupfer" className="mt-6 bg-kupfer-mist">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.statusLabel}
                </p>
                <p className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground">
                  {copy.allComplete}
                </p>
                <div className="mt-5">
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
            <h2 className="mt-14 text-2xl font-bold tracking-[-0.03em] text-foreground">
              {copy.coursesHeading}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {courseState.map(
                ({ course, done, pct, recordEarned, started, resumeHref }) => (
                  <Card key={course.slug} accent="kupfer" className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <IconTile icon={GraduationCap} accent="kupfer" />
                      {recordEarned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-kupfer-mist px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                          <Award size={13} aria-hidden="true" />
                          {copy.recordEarned}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-foreground">
                      {course.title}
                    </h3>
                    <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
                      {copy.lessonProgress(done, course.totalLessons, pct)}
                    </p>
                    {/* Progress bar */}
                    <div
                      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      aria-label={copy.progressAria(course.title)}
                    >
                      <div
                        className="h-full rounded-full bg-brand-orange"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-5">
                      <Link
                        href={localizeHref(
                          started ? resumeHref : course.startHref,
                          locale,
                        )}
                        className="inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
                      >
                        {recordEarned
                          ? copy.viewRecord
                          : started
                            ? copy.resume
                            : copy.start}{" "}
                        →
                      </Link>
                    </div>
                  </Card>
                ),
              )}
            </div>

            {/* Kompetenzen — the honest "what you've learned" record */}
            <section className="mt-16" aria-labelledby="kompetenzen-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  id="kompetenzen-heading"
                  className="text-2xl font-bold tracking-[-0.03em] text-foreground"
                >
                  {copy.competenciesHeading}
                </h2>
                <span className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                  {copy.competencyCount(earnedCount, totalCompetencies)}
                </span>
              </div>

              {earnedByCourse.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {earnedByCourse.map(({ course, items }) => (
                    <div key={course.slug}>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {copy.competencySource(course.title)}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2.5">
                        {items.map((competency) => (
                          <li
                            key={competency.id}
                            className="flex items-center gap-2 rounded-full bg-kupfer-mist px-3.5 py-1.5"
                          >
                            <Award
                              size={13}
                              className="text-brand-orange"
                              aria-hidden="true"
                            />
                            <span className="text-[13px] font-semibold text-foreground">
                              {competency.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="mt-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {copy.noCompetencies}
                  </p>
                </Card>
              )}

              <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                {copy.competencyBoundary}
              </p>
            </section>
          </>
        )}

        {/* Supporting resources */}
        <h2 className="mt-16 text-2xl font-bold tracking-[-0.03em] text-foreground">
          {copy.deepenHeading}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {copy.resources.map((tile) => {
            const decoration = SUPPORT_TILE_DECORATION[tile.key];
            return (
              <Card
                key={tile.href}
                href={localizeHref(tile.href, locale)}
                accent={decoration.accent}
                className="h-full gap-3"
              >
                <IconTile icon={decoration.icon} accent={decoration.accent} />
                <div>
                  <span className="font-bold text-foreground group-hover:text-brand-orange">
                    {tile.title}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                    {tile.body}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Gamification honesty note */}
        <aside className="mt-10 rounded-lg border border-border p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {copy.localDataHeading}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {copy.localDataBody}
          </p>
        </aside>

        <nav className="mt-6 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            <Link
              href={localizeHref("/konto/datenschutz", locale)}
              className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline underline-offset-4"
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
