"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Flame,
  GitCommitHorizontal,
  Share2,
  Sparkles,
} from "lucide-react";
import { Github } from "@/components/icons/brand";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  ALL_COURSE_CATALOG,
  type CatalogCourse,
  type ImportedCourse,
} from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import { COURSE_GALLERY_COPY } from "@/lib/courses/course-gallery-copy";
import {
  courseBadges,
  courseGroupFor,
  courseIconName,
  courseSections,
  type BadgeTone,
  type CourseBadge,
} from "@/lib/courses/tracks";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { iconByName } from "@/lib/courses/track-icon";
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { withMotionProvider } from "@/components/motion/with-motion-provider";
import { serializeProgress } from "@/lib/course/progress";
import {
  getCompletedLessonsCount,
  getXp,
  getStreak,
  isCertificateEligible,
  subscribe,
} from "@/lib/progress/store";
import {
  hasCourseStarted,
  resolveCourseResumeHref,
} from "@/lib/courses/resume";
import type { UnifiedProgress } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

// ─── Two treatments, one honest vocabulary ───────────────────────────────
// The spine renders as illustrated path cards: an ordered route, a step number,
// a cover, a full fact grid. The deeper shelf renders as framed specimen rows —
// a source screenshot on a mat, the stack it teaches, and a plate led by the
// exercise the course actually runs — so the two are told apart before a word
// is read. Both share the badge chips (language, record), the progress bar, and
// the accents declared in COURSE_FACTS: kupfer for the path, sand for the shelf.

const BADGE_TINT: Record<BadgeTone, string> = {
  record: "bg-kupfer-mist text-brand-orange",
  language: "bg-card-hover text-muted-foreground",
  external: "bg-brand-sand/20 text-foreground",
};

function BadgeRow({
  slug,
  extra,
  label,
  locale,
}: {
  readonly slug: string;
  readonly extra?: readonly CourseBadge[];
  readonly label: string;
  readonly locale: Locale;
}) {
  const badges = [...courseBadges(slug, locale), ...(extra ?? [])];
  if (badges.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label={label}>
      {badges.map((badge) => (
        <li
          key={badge.label}
          className={cn(
            "rounded-none px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]",
            BADGE_TINT[badge.tone],
          )}
        >
          {badge.label}
        </li>
      ))}
    </ul>
  );
}

interface CourseStat {
  readonly completed: number;
  readonly certified: boolean;
  readonly started: boolean;
  readonly resumeHref: string;
}

function readStat(
  course: CatalogCourse,
  progress?: UnifiedProgress,
): CourseStat {
  const completed = getCompletedLessonsCount(course.slug);
  return {
    completed,
    certified: isCertificateEligible(course.slug),
    started: completed > 0 || hasCourseStarted(progress, course.slug),
    resumeHref: resolveCourseResumeHref(progress, course.slug),
  };
}

// `sourceFacts` mixes three kinds of claim: structure ("4 Tracks", "12
// Lektionen"), practice ("22 interaktive Simulationen", "Abschlussfall") and
// hosting ("Auf loehrning.ai gehostet"). The shelf's plate already states the
// structure and its badge row already states where the course runs, so the
// specimen keeps only what is left: what the course asks the learner to do.
function practiceFacts(course: CatalogCourse): readonly string[] {
  const structure = new Set([
    String(course.unitCount),
    String(course.totalLessons),
  ]);
  return (course.sourceFacts ?? []).filter((fact) => {
    if (fact.includes("loehrning.ai")) return false;
    const leadingCount = /^\d+/.exec(fact)?.[0];
    return leadingCount === undefined || !structure.has(leadingCount);
  });
}

function SectionHeader({
  eyebrow,
  title,
  blurb,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly blurb: string;
}) {
  return (
    <div className="mb-5 max-w-3xl">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-[28px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[34px]">
        {title}
      </h2>
      <p className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">
        {blurb}
      </p>
    </div>
  );
}

// Both sections branch card treatment on nativeStatus, not on which array a
// course came from — so a course plan's single-field flip
// is sufficient to move it between "Der Lernpfad" and "Tiefer gehen".
function isLiveCourse(
  course: CatalogCourse | ImportedCourse,
): course is CatalogCourse {
  return course.nativeStatus === "live";
}

function isPendingCourse(
  course: CatalogCourse | ImportedCourse,
): course is ImportedCourse {
  return course.nativeStatus === "pending";
}

const LIVE_COURSES = ALL_COURSE_CATALOG.filter(isLiveCourse);
const PENDING_COURSES = ALL_COURSE_CATALOG.filter(isPendingCourse);

// The visual split follows the declared classification in COURSE_FACTS: the
// four ordered foundation courses form "Der Lernpfad" with Typenschild plates;
// the six source-pinned technical courses sit under "Tiefer gehen" as framed specimens.
// Unknown slugs default to the spine treatment (the tracks guard test forces
// every catalog slug into COURSE_FACTS, so the hole is fenced).
const SPINE_COURSES = LIVE_COURSES.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);
const DEEPER_NATIVE_COURSES = LIVE_COURSES.filter(
  (course) => courseGroupFor(course.slug) === "deeper",
);

function CourseGalleryContent({
  locale = "de",
}: {
  readonly locale?: Locale;
}) {
  const copy = COURSE_GALLERY_COPY[locale];
  const sections = courseSections(locale);
  const spineCourses = localizeCatalog(SPINE_COURSES, locale);
  const deeperNativeCourses = localizeCatalog(DEEPER_NATIVE_COURSES, locale);
  const pendingCourses = localizeCatalog(PENDING_COURSES, locale);
  const [stats, setStats] = useState<Record<string, CourseStat>>({});
  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [shareState, setShareState] = useState<{
    slug: string;
    status: "copied" | "error";
  } | null>(null);
  const shareResetTimer = useRef<number | null>(null);

  useEffect(() => {
    function refresh(progress: UnifiedProgress) {
      const next: Record<string, CourseStat> = {};
      for (const course of LIVE_COURSES) {
        next[course.slug] = readStat(course, progress);
      }
      setStats(next);
      setXp(getXp());
      setStreakDays(getStreak().days);
      setHydrated(true);
    }
    const unsubscribeProgress = subscribe(refresh);
    return () => {
      unsubscribeProgress();
      if (shareResetTimer.current !== null) {
        window.clearTimeout(shareResetTimer.current);
      }
    };
  }, []);

  async function shareProgress(course: CatalogCourse) {
    const encoded = serializeProgress(course.slug);
    if (!encoded) return;
    const url = `${window.location.origin}${localizeHref(course.startHref, locale)}#progress=${encoded}`;
    if (shareResetTimer.current !== null) {
      window.clearTimeout(shareResetTimer.current);
      shareResetTimer.current = null;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState({ slug: course.slug, status: "copied" });
      shareResetTimer.current = window.setTimeout(() => {
        setShareState(null);
        shareResetTimer.current = null;
      }, 2500);
    } catch {
      setShareState({ slug: course.slug, status: "error" });
      shareResetTimer.current = window.setTimeout(() => {
        setShareState(null);
        shareResetTimer.current = null;
      }, 4000);
    }
  }

  const startedAny = Object.values(stats).some((s) => s.started);

  return (
    <div className="space-y-16">
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {shareState?.status === "copied"
          ? copy.linkCopied
          : shareState?.status === "error"
            ? copy.copyFailed
            : ""}
      </p>

      {/* Gamification banner: only once the learner has any progress */}
      {hydrated && startedAny && (
        <div
          data-testid="kurse-gamification"
          className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card px-6 py-4 shadow-card"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-foreground">
            <Sparkles
              size={16}
              className="text-brand-orange"
              aria-hidden="true"
            />
            {xp} XP
          </span>
          {streakDays > 0 && (
            <span className="inline-flex items-center gap-2 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-foreground">
              <Flame
                size={16}
                className="text-brand-orange"
                aria-hidden="true"
              />
              {streakDays} {streakDays === 1 ? copy.day : copy.days}{" "}
              {copy.streak}
            </span>
          )}
        </div>
      )}

      {/* ── Section 1: Grundlagenpfad (numbered certified spine) ── */}
      <section id="lernpfad" className="scroll-mt-24">
        <SectionHeader
          eyebrow={sections.spine.eyebrow}
          title={sections.spine.title}
          blurb={sections.spine.blurb}
        />

        <m.ol
          className="grid gap-6 md:grid-cols-12"
          variants={staggerContainer}
          initial={false}
          animate="visible"
        >
          {spineCourses.map((course, index) => {
            const stat = stats[course.slug] ?? {
              completed: 0,
              certified: false,
              started: false,
              resumeHref: course.startHref,
            };
            const pct =
              course.totalLessons === 0
                ? 0
                : Math.round((stat.completed / course.totalLessons) * 100);
            const inProgress = stat.started && !stat.certified;
            const startLabel = stat.certified
              ? copy.viewRecord
              : stat.started
                ? copy.continue
                : copy.start;
            const startHref = stat.started
              ? localizeHref(stat.resumeHref, locale)
              : localizeHref(course.startHref, locale);

            return (
              <m.li
                key={course.slug}
                variants={staggerItem}
                className={cn(
                  "js-reveal min-w-0",
                  index % 2 === 0 ? "md:col-span-7" : "md:col-span-5",
                )}
              >
                <Card
                  interactive
                  accent="kupfer"
                  className="h-full min-w-0 overflow-hidden"
                >
                  <div className="relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden border-b border-border bg-background">
                    <Image
                      src={course.coverImage ?? ""}
                      alt={course.coverImageAlt ?? ""}
                      fill
                      preload={index === 0}
                      sizes="(min-width: 768px) 58vw, calc(100vw - 48px)"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                    />
                    <span className="absolute left-4 top-4 border border-foreground/20 bg-background/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground backdrop-blur-sm">
                      {copy.step} {String(course.step).padStart(2, "0")} /{" "}
                      {String(spineCourses.length).padStart(2, "0")}
                    </span>
                    {hydrated && stat.certified ? (
                      <span
                        data-testid={`certified-${course.slug}`}
                        className="stamp-in absolute bottom-4 right-4 border border-brand-orange bg-background/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange"
                      >
                        {copy.completed}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                    <span className="sr-only">
                      {copy.step} {course.step}:{" "}
                    </span>
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                    {course.tagline}
                  </p>
                  <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground">
                    {course.description}
                  </p>

                  <BadgeRow
                    slug={course.slug}
                    locale={locale}
                    label={`${course.title}: ${copy.features}`}
                  />

                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 font-mono text-[10px] uppercase tracking-[0.08em] sm:grid-cols-4">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{copy.duration}</dt>
                      <dd className="mt-1 break-words font-bold text-foreground">
                        {course.duration}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{copy.scope}</dt>
                      <dd className="mt-1 break-words font-bold text-foreground">
                        {course.totalLessons} {copy.lessons}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">
                        {copy.structure}
                      </dt>
                      <dd className="mt-1 break-words font-bold text-foreground">
                        {course.unitCount} {course.unitLabel}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">{copy.access}</dt>
                      <dd className="mt-1 break-words font-bold text-foreground">
                        {copy.free}
                      </dd>
                    </div>
                  </dl>

                  {/* Exact course progress. */}
                  <div className="mt-6">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0 break-words font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {course.audience}
                      </span>
                      <span
                        data-testid={`progress-pct-${course.slug}`}
                        className="font-mono text-[11px] font-bold text-foreground"
                      >
                        {hydrated ? `${pct}%` : "—"}
                      </span>
                    </div>
                    <div
                      className="mt-3 h-2 overflow-hidden bg-border"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={course.totalLessons}
                      aria-valuenow={hydrated ? stat.completed : 0}
                      aria-valuetext={
                        hydrated
                          ? copy.progressLoaded(
                              stat.completed,
                              course.totalLessons,
                            )
                          : copy.progressLoading(course.title)
                      }
                      aria-label={`${copy.progress} ${course.title}`}
                      data-testid={`progress-dots-${course.slug}`}
                    >
                      <span
                        aria-hidden="true"
                        className="block h-full bg-brand-orange transition-[width] duration-300"
                        style={{ width: hydrated ? `${pct}%` : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <BrandButton
                      href={startHref}
                      prefetch={false}
                      variant="primary"
                      size="sm"
                    >
                      {startLabel}
                      <span className="sr-only">: {course.title}</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </BrandButton>
                    <Link
                      href={localizeHref(course.href, locale)}
                      className="inline-flex min-h-11 items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                    >
                      {copy.details}
                      <span className="sr-only">: {course.title}</span>
                    </Link>
                    {hydrated && inProgress && (
                      <button
                        type="button"
                        onClick={() => shareProgress(course)}
                        aria-label={`${course.title}: ${copy.shareProgress}`}
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {shareState?.slug === course.slug &&
                        shareState.status === "copied" ? (
                          <span className="stamp-in inline-flex items-center gap-1.5">
                            <Check size={13} aria-hidden="true" />
                            {copy.linkCopied}
                          </span>
                        ) : shareState?.slug === course.slug &&
                          shareState.status === "error" ? (
                          <span className="inline-flex items-center gap-1.5 text-destructive">
                            {copy.copyFailed}
                          </span>
                        ) : (
                          <>
                            <Share2 size={13} aria-hidden="true" />
                            {copy.shareProgress}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </Card>
              </m.li>
            );
          })}
        </m.ol>
      </section>

      {/* ── Section 2: Technikkurse ── */}
      <section id="tiefer-gehen" className="scroll-mt-24">
        <SectionHeader
          eyebrow={sections.deeper.eyebrow}
          title={sections.deeper.title}
          blurb={sections.deeper.blurb}
        />

        {/* One full-width specimen row per ported course — a ledger, not a
            second run of the path cards. */}
        <div id="open-source" className="scroll-mt-24">
          <m.ul
            className="grid gap-4"
            variants={staggerContainer}
            initial={false}
            animate="visible"
          >
            {deeperNativeCourses.map((course) => {
              const stat = stats[course.slug] ?? {
                completed: 0,
                certified: false,
                started: false,
                resumeHref: course.startHref,
              };
              const pct =
                course.totalLessons === 0
                  ? 0
                  : Math.round((stat.completed / course.totalLessons) * 100);
              const startLabel = stat.certified
                ? copy.viewRecord
                : stat.started
                  ? copy.continue
                  : copy.start;
              const startHref = stat.started
                ? localizeHref(stat.resumeHref, locale)
                : localizeHref(course.startHref, locale);
              // The six ported courses all carry provenance; the fields are
              // optional on the type only for foundation-path entries, which
              // never reach this branch.
              const repoPath = course.sourceHref
                ? new URL(course.sourceHref).pathname
                    .split("/")
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("/")
                : null;
              const practice = practiceFacts(course);
              const plate = [
                // A course whose units are its lessons (12 Kapitel = 12
                // Lektionen) would otherwise print the same count twice.
                ...(course.unitCount === course.totalLessons
                  ? []
                  : [
                      {
                        label: copy.structure,
                        value: `${course.unitCount} ${course.unitLabel}`,
                      },
                    ]),
                {
                  label: copy.scope,
                  value:
                    course.lessonCountLabel ??
                    `${course.totalLessons} ${copy.lessons}`,
                },
                { label: copy.duration, value: course.duration },
              ];

              return (
                <m.li
                  key={course.slug}
                  variants={staggerItem}
                  className="js-reveal min-w-0"
                >
                  <div className="grid min-w-0 grid-cols-1 border border-border border-t-[3px] border-t-brand-sand bg-card md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
                    {/* Specimen: the pinned course screenshot mounted on a mat
                        at its true 16:10, labelled underneath with the stack
                        the course teaches. */}
                    <div className="relative border-b border-border bg-background p-4 md:border-b-0 md:border-r">
                      <Image
                        src={course.coverImage ?? course.imageSrc ?? ""}
                        alt={
                          course.coverImageAlt ??
                          course.imageAlt ??
                          course.title
                        }
                        width={1280}
                        height={800}
                        sizes="(min-width: 768px) 268px, calc(100vw - 80px)"
                        className="aspect-[16/10] h-auto w-full border border-border object-cover"
                      />
                      {course.topics && course.topics.length > 0 ? (
                        <ul
                          aria-label={`${course.title}: ${copy.coreFacts}`}
                          className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                        >
                          {course.topics.map((topic) => (
                            <li
                              key={topic}
                              className="border border-border px-1.5 py-0.5"
                            >
                              {topic}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {hydrated && stat.certified && (
                        <span
                          data-testid={`certified-${course.slug}`}
                          className="stamp-in absolute right-6 top-6 border border-brand-orange bg-background/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange"
                        >
                          {copy.achieved}
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col p-6">
                      {/* The shelf leads with the work, the way the path leads
                          with its step number. */}
                      {practice.length > 0 ? (
                        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                          {practice.join(" · ")}
                        </p>
                      ) : null}
                      <h3 className="break-words text-[21px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                        {course.title}
                      </h3>
                      <p className="mt-2 max-w-[62ch] text-[15px] leading-snug text-foreground">
                        {course.tagline}
                      </p>

                      <BadgeRow
                        slug={course.slug}
                        locale={locale}
                        label={`${course.title}: ${copy.features}`}
                      />

                      <dl className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 border-y border-border py-3 font-mono text-[11px] uppercase tracking-[0.08em]">
                        {plate.map((row) => (
                          <div
                            key={row.label}
                            className="flex min-w-0 items-baseline gap-1.5"
                          >
                            <dt className="shrink-0 text-muted-foreground">
                              {row.label}
                            </dt>
                            <dd className="min-w-0 break-words font-bold text-foreground">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {/* mt-auto: rows are as tall as their specimen, so the
                          bar and the actions settle on the frame's floor. */}
                      <div className="mt-auto pt-5">
                        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="min-w-0 break-words text-[13px] leading-snug text-muted-foreground">
                            {course.audience}
                          </span>
                          <span
                            data-testid={`progress-pct-${course.slug}`}
                            className="font-mono text-[11px] font-bold text-foreground"
                          >
                            {hydrated ? `${pct}%` : "—"}
                          </span>
                        </div>
                        <div
                          className="mt-3 h-2 overflow-hidden bg-border"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={course.totalLessons}
                          aria-valuenow={hydrated ? stat.completed : 0}
                          aria-valuetext={
                            hydrated
                              ? copy.progressLoaded(
                                  stat.completed,
                                  course.totalLessons,
                                )
                              : copy.progressLoading(course.title)
                          }
                          aria-label={`${copy.progress} ${course.title}`}
                          data-testid={`progress-dots-${course.slug}`}
                        >
                          <span
                            aria-hidden="true"
                            className="block h-full bg-brand-orange transition-[width] duration-300"
                            style={{ width: hydrated ? `${pct}%` : "0%" }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <BrandButton
                          href={startHref}
                          variant="primary"
                          size="sm"
                        >
                          {startLabel}
                          <span className="sr-only">: {course.title}</span>
                          <ArrowRight size={15} aria-hidden="true" />
                        </BrandButton>
                        <Link
                          href={localizeHref(course.href, locale)}
                          className="inline-flex min-h-11 items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                        >
                          {copy.details}
                          <span className="sr-only">: {course.title}</span>
                        </Link>
                      </div>
                    </div>

                    {/* Specimen label across the full frame: repo · MIT ·
                        commit, no longer squeezed under the screenshot. */}
                    {repoPath &&
                    course.sourceHref &&
                    course.sourceCommit &&
                    course.sourceCommitHref ? (
                      <p className="flex min-w-0 flex-wrap items-center gap-x-4 border-t border-border px-6 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground md:col-span-2">
                        <a
                          href={course.sourceHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          // The visible repo path must appear in the accessible
                          // name (WCAG 2.5.3 Label in Name), or speech input
                          // cannot address the link by what it reads. Same
                          // composition as the Werkverzeichnis card's source
                          // action.
                          aria-label={`${copy.sourceCode}: ${repoPath}, ${course.title}`}
                          className="inline-flex min-h-6 min-w-0 items-center gap-1.5 py-1 transition-colors hover:text-foreground"
                        >
                          <Github
                            className="h-3 w-3 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span className="truncate">{repoPath}</span>
                        </a>
                        <span className="py-1">MIT</span>
                        <a
                          href={course.sourceCommitHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${copy.sourceCommit} ${course.sourceCommit.slice(0, 7)} ${copy.onGitHub}`}
                          className="inline-flex min-h-6 items-center py-1 transition-colors hover:text-foreground"
                        >
                          #{course.sourceCommit.slice(0, 7)}
                        </a>
                      </p>
                    ) : null}
                  </div>
                </m.li>
              );
            })}
          </m.ul>

          {/* Pending imports keep the card grid: an externally hosted lab
              is a different object again. The array is empty until one
              starts its import window. */}
          {pendingCourses.length > 0 && (
            <m.ul
              className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial={false}
              animate="visible"
            >
              {pendingCourses.map((course) => {
                const Icon = iconByName(courseIconName(course.slug));
                return (
                  <m.li
                    key={course.slug}
                    variants={staggerItem}
                    className="js-reveal min-w-0"
                  >
                    <Card
                      accent="sand"
                      className="h-full min-w-0 overflow-hidden"
                    >
                      {/* Screenshot preview + stroke-only GitHub link */}
                      <div className="relative overflow-hidden rounded-lg border border-border">
                        <Image
                          src={course.imageSrc}
                          alt={course.imageAlt}
                          width={1280}
                          height={800}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="h-auto w-full object-cover"
                        />
                        <a
                          href={course.sourceHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={copy.sourceCode}
                          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-tile transition-colors hover:bg-background"
                        >
                          <Github
                            className="h-5 w-5"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </a>
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <IconTile icon={Icon} accent="sand" />
                        <span className="whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          {course.duration}
                        </span>
                      </div>

                      <h3 className="mt-4 text-[22px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                        {course.title}
                      </h3>
                      <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                        {course.tagline}
                      </p>
                      <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground">
                        {course.description}
                      </p>

                      {/* Honest badges: available languages · hosting boundary · licence */}
                      <BadgeRow
                        slug={course.slug}
                        locale={locale}
                        extra={[{ label: "MIT", tone: "external" }]}
                        label={`${course.title}: ${copy.features}`}
                      />

                      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        <div>
                          <dt className="sr-only">{copy.scope}</dt>
                          <dd>
                            {course.unitCount} {course.unitLabel} ·{" "}
                            {course.lessonCountLabel}
                          </dd>
                        </div>
                      </dl>

                      <ul
                        className="mt-4 flex flex-wrap gap-2"
                        aria-label={`${course.title}: ${copy.coreFacts}`}
                      >
                        {course.sourceFacts.slice(0, 4).map((fact) => (
                          <li
                            key={fact}
                            className="rounded-none bg-brand-sand/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground"
                          >
                            {fact}
                          </li>
                        ))}
                        {course.topics.slice(0, 3).map((topic) => (
                          <li
                            key={topic}
                            className="rounded-none bg-card-hover px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                          >
                            {topic}
                          </li>
                        ))}
                      </ul>

                      {/* Commit pin: provenance to the exact source revision */}
                      <a
                        href={course.sourceCommitHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${copy.sourceCommit} ${course.sourceCommit.slice(0, 7)} ${copy.onGitHub}`}
                        className="mt-4 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <GitCommitHorizontal
                          className="h-3.5 w-3.5"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        Commit {course.sourceCommit.slice(0, 7)}
                      </a>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <BrandButton
                          href={course.launchHref}
                          external
                          variant="primary"
                          size="sm"
                        >
                          {copy.openCourse}
                          <span className="sr-only">
                            : {course.title}, {copy.externalNewTab}
                          </span>
                          <ExternalLink size={15} aria-hidden="true" />
                        </BrandButton>
                        <BrandButton
                          href={localizeHref(course.href, locale)}
                          variant="outline"
                          size="sm"
                        >
                          {copy.pendingDetails}
                          <span className="sr-only">: {course.title}</span>
                        </BrandButton>
                      </div>
                    </Card>
                  </m.li>
                );
              })}
            </m.ul>
          )}

          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            {copy.workshopLead}{" "}
            <Link
              href={localizeHref("/workshops", locale)}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              /workshops
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

export const CourseGallery = withMotionProvider(CourseGalleryContent);
