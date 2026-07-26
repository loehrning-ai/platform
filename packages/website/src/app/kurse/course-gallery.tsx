"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { m } from "framer-motion";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Flame,
  GitCommitHorizontal,
  Github,
  Share2,
  Sparkles,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  ALL_COURSE_CATALOG,
  type CatalogCourse,
  type ImportedCourse,
} from "@/lib/courses/catalog";
import {
  COURSE_FACTS,
  COURSE_SECTIONS,
  courseBadges,
  courseGroupFor,
  courseIconName,
  type BadgeTone,
  type CourseBadge,
} from "@/lib/courses/tracks";
import { iconByName } from "@/lib/courses/track-icon";
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { CoursePlate } from "./course-plate";
import { PlateReveal } from "@/components/motion/plate-reveal";
import { serializeProgress } from "@/lib/course/progress";
import {
  getCompletedLessonsCount,
  getXp,
  getStreak,
  isCertificateEligible,
} from "@/lib/progress/store";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

// ─── One consistent card system ──────────────────────────────────────────
// The redesign drops the three colour-banded "universes". Differentiation now
// rides on honest badge chips (language, record, extern) — the same component
// on every card — plus the icon tile and a single kupfer accent for the path.

const BADGE_TINT: Record<BadgeTone, string> = {
  record: "bg-kupfer-mist text-brand-orange",
  language: "bg-card-hover text-muted-foreground",
  external: "bg-brand-sand/20 text-foreground",
};

function BadgeRow({
  slug,
  extra,
  label,
}: {
  readonly slug: string;
  readonly extra?: readonly CourseBadge[];
  readonly label: string;
}) {
  const badges = [...courseBadges(slug), ...(extra ?? [])];
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
}

function readStat(course: CatalogCourse): CourseStat {
  return {
    completed: getCompletedLessonsCount(course.slug),
    certified: isCertificateEligible(course.slug),
  };
}

/** Up to 12 dots per course so a 27-lesson course stays a single tidy row. */
function dotCount(course: CatalogCourse): number {
  return Math.min(course.totalLessons, 12);
}

function filledDots(stat: CourseStat, course: CatalogCourse): number {
  if (course.totalLessons === 0) return 0;
  const ratio = stat.completed / course.totalLessons;
  return Math.round(ratio * dotCount(course));
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
    <div className="mb-7 max-w-3xl">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[34px]">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {blurb}
      </p>
    </div>
  );
}

function SubHeader({ children }: { readonly children: React.ReactNode }) {
  return (
    <h3 className="mb-5 flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-foreground">
      {children}
    </h3>
  );
}

// Both sections branch card treatment on nativeStatus, not on which array a
// course came from — so a course plan's single-field flip
// is sufficient to move it between "Der Lernpfad" and "Tiefer gehen".
function isLiveCourse(course: CatalogCourse | ImportedCourse): course is CatalogCourse {
  return course.nativeStatus === "live";
}

function isPendingCourse(course: CatalogCourse | ImportedCourse): course is ImportedCourse {
  return course.nativeStatus === "pending";
}

const LIVE_COURSES = ALL_COURSE_CATALOG.filter(isLiveCourse);
const PENDING_COURSES = ALL_COURSE_CATALOG.filter(isPendingCourse);

// The visual split follows the declared classification in COURSE_FACTS: the
// four German spine courses form "Der Lernpfad" with Typenschild plates; the
// six English ported courses shelve under "Tiefer gehen" as framed specimens.
// Unknown slugs default to the spine treatment (the tracks guard test forces
// every catalog slug into COURSE_FACTS, so the hole is fenced).
const SPINE_COURSES = LIVE_COURSES.filter(
  (course) => courseGroupFor(course.slug) !== "deeper",
);
const DEEPER_NATIVE_COURSES = LIVE_COURSES.filter(
  (course) => courseGroupFor(course.slug) === "deeper",
);

export function CourseGallery() {
  const [stats, setStats] = useState<Record<string, CourseStat>>({});
  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [shareState, setShareState] = useState<{
    slug: string | null;
    copied: boolean;
  }>({ slug: null, copied: false });

  useEffect(() => {
    function refresh() {
      const next: Record<string, CourseStat> = {};
      for (const course of LIVE_COURSES) next[course.slug] = readStat(course);
      setStats(next);
      setXp(getXp());
      setStreakDays(getStreak().days);
      setHydrated(true);
    }
    refresh();
    function onStorage(e: StorageEvent) {
      if (e.key === UNIFIED_STORAGE_KEY) refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function shareProgress(course: CatalogCourse) {
    const encoded = serializeProgress(course.slug);
    if (!encoded) return;
    const url = `${window.location.origin}${course.startHref}#progress=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState({ slug: course.slug, copied: true });
      window.setTimeout(
        () => setShareState({ slug: null, copied: false }),
        2500,
      );
    } catch {
      // Clipboard blocked (insecure context / permissions): no-op.
    }
  }

  const startedAny = Object.values(stats).some((s) => s.completed > 0);

  return (
    <div className="space-y-16">
      {/* Gamification banner: only once the learner has any progress */}
      {hydrated && startedAny && (
        <div
          data-testid="kurse-gamification"
          className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card px-6 py-4 shadow-card"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-foreground">
            <Sparkles size={16} className="text-brand-orange" aria-hidden="true" />
            {xp} XP
          </span>
          {streakDays > 0 && (
            <span className="inline-flex items-center gap-2 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-foreground">
              <Flame size={16} className="text-brand-orange" aria-hidden="true" />
              {streakDays} {streakDays === 1 ? "Tag" : "Tage"} Serie
            </span>
          )}
        </div>
      )}

      {/* ── Section 1: Der Lernpfad (numbered certified spine) ── */}
      <section id="lernpfad" className="scroll-mt-24">
        <SectionHeader
          eyebrow={COURSE_SECTIONS.spine.eyebrow}
          title={COURSE_SECTIONS.spine.title}
          blurb={COURSE_SECTIONS.spine.blurb}
        />

        <m.ol
          className="grid gap-6 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {SPINE_COURSES.map((course) => {
            const stat = stats[course.slug] ?? { completed: 0, certified: false };
            const dots = dotCount(course);
            const filled = filledDots(stat, course);
            const pct =
              course.totalLessons === 0
                ? 0
                : Math.round((stat.completed / course.totalLessons) * 100);
            const inProgress = stat.completed > 0 && !stat.certified;
            const startLabel = stat.completed > 0 ? "Weiterlernen" : "Kurs starten";
            const startHref = stat.completed > 0 ? course.continueHref : course.startHref;

            return (
              <m.li key={course.slug} variants={staggerItem}>
                <Card interactive accent="kupfer" className="h-full">
                  <PlateReveal>
                    <CoursePlate
                      slug={course.slug}
                      step={course.step}
                      stepCount={SPINE_COURSES.length}
                      unitCount={course.unitCount}
                      unitLabel={course.unitLabel}
                      totalLessons={course.totalLessons}
                      duration={course.duration}
                      // Safe access, not courseFacts(): the flip-test fixture
                      // renders unknown slugs through this branch.
                      record={COURSE_FACTS[course.slug]?.record ?? "zertifikat"}
                      certified={hydrated && stat.certified}
                      certifiedTestId={`certified-${course.slug}`}
                    />
                  </PlateReveal>

                  <h3 className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                    <span className="sr-only">Schritt {course.step}: </span>
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                    {course.tagline}
                  </p>
                  <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground">
                    {course.description}
                  </p>

                  <BadgeRow slug={course.slug} label={`${course.title}: Merkmale`} />

                  {/* Cross-course progress dots (client-side, unified store) */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
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
                      className="mt-2 flex flex-wrap gap-1.5"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={course.totalLessons}
                      aria-valuenow={hydrated ? stat.completed : 0}
                      aria-valuetext={
                        hydrated
                          ? `${stat.completed} von ${course.totalLessons} Lektionen abgeschlossen`
                          : `Fortschritt ${course.title} wird geladen`
                      }
                      aria-label={`Fortschritt ${course.title}`}
                      data-testid={`progress-dots-${course.slug}`}
                    >
                      {Array.from({ length: dots }).map((_, d) => (
                        <span
                          key={d}
                          aria-hidden="true"
                          className={cn(
                            "h-2.5 w-2.5 rounded-full transition-colors duration-300",
                            hydrated && d < filled
                              ? "bg-brand-orange"
                              : "bg-border",
                          )}
                          style={{ transitionDelay: `${d * 25}ms` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <BrandButton href={startHref} variant="primary" size="sm">
                      {startLabel}
                      <span className="sr-only">: {course.title}</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </BrandButton>
                    <BrandButton href={course.href} variant="outline" size="sm">
                      Details
                      <span className="sr-only">: {course.title}</span>
                    </BrandButton>
                    {hydrated && inProgress && (
                      <button
                        type="button"
                        onClick={() => shareProgress(course)}
                        aria-label={`${course.title}: Fortschritt teilen`}
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {shareState.slug === course.slug && shareState.copied ? (
                          <span
                            className="stamp-in inline-flex items-center gap-1.5"
                            role="status"
                            aria-live="polite"
                          >
                            <Check size={13} aria-hidden="true" />
                            Link kopiert
                          </span>
                        ) : (
                          <>
                            <Share2 size={13} aria-hidden="true" />
                            Fortschritt teilen
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

      {/* ── Section 2: Tiefer gehen (external labs + applied courses) ── */}
      <section id="tiefer-gehen" className="scroll-mt-24">
        <SectionHeader
          eyebrow={COURSE_SECTIONS.deeper.eyebrow}
          title={COURSE_SECTIONS.deeper.title}
          blurb={COURSE_SECTIONS.deeper.blurb}
        />

        {/* Sub-shelf: Technikkurse (ported natives as framed specimens, plus
            any still-pending imports). */}
        <div id="open-source" className="scroll-mt-24">
          <SubHeader>
            <Github className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Technikkurse
          </SubHeader>

          <m.ul
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            {DEEPER_NATIVE_COURSES.map((course) => {
              const stat = stats[course.slug] ?? { completed: 0, certified: false };
              const dots = dotCount(course);
              const filled = filledDots(stat, course);
              const pct =
                course.totalLessons === 0
                  ? 0
                  : Math.round((stat.completed / course.totalLessons) * 100);
              const startLabel = stat.completed > 0 ? "Weiterlernen" : "Kurs starten";
              const startHref = stat.completed > 0 ? course.continueHref : course.startHref;
              // The six ported courses all carry provenance; the fields are
              // optional on the type only for German spine entries, which
              // never reach this branch.
              const repoPath = course.sourceHref
                ? new URL(course.sourceHref).pathname
                    .split("/")
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("/")
                : null;

              return (
                <m.li key={course.slug} variants={staggerItem}>
                  <Card interactive accent="sand" className="h-full">
                    {/* Framed specimen: the pinned course screenshot mounted on
                        a mat at its true 16:10, with the provenance caption
                        (repo · MIT · commit) always visible. */}
                    <div className="relative -mx-6 -mt-6 mb-5 rounded-t-xl border-b border-border bg-card-hover p-3">
                      <div className="group/spec overflow-hidden border border-border bg-background">
                        <Image
                          src={course.coverImage ?? course.imageSrc ?? ""}
                          alt={course.coverImageAlt ?? course.imageAlt ?? course.title}
                          width={1280}
                          height={800}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 48vw, calc(100vw - 48px)"
                          className="aspect-[16/10] h-auto w-full object-cover transition-transform duration-300 group-hover/spec:scale-[1.02]"
                        />
                      </div>
                      {repoPath && course.sourceHref && course.sourceCommit && course.sourceCommitHref ? (
                        <p className="mt-2 flex items-center justify-between gap-3 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
                          <a
                            href={course.sourceHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Quellcode auf GitHub: ${course.title}`}
                            className="inline-flex min-w-0 items-center gap-1 truncate transition-colors hover:text-foreground"
                          >
                            <Github className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                            <span className="truncate">{repoPath}</span>
                          </a>
                          <span className="flex shrink-0 items-center gap-3">
                            <span>MIT</span>
                            <a
                              href={course.sourceCommitHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Quell-Commit ${course.sourceCommit.slice(0, 7)} auf GitHub`}
                              className="transition-colors hover:text-foreground"
                            >
                              #{course.sourceCommit.slice(0, 7)}
                            </a>
                          </span>
                        </p>
                      ) : null}
                      {hydrated && stat.certified && (
                        <span
                          data-testid={`certified-${course.slug}`}
                          className="stamp-in absolute right-5 top-5 border border-brand-orange bg-background/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange"
                        >
                          erreicht
                        </span>
                      )}
                    </div>

                    <h3 className="text-[20px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-[14px] font-semibold leading-snug text-foreground">
                      {course.tagline}
                    </p>
                    <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>

                    <BadgeRow slug={course.slug} label={`${course.title}: Merkmale`} />

                    <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      <div>
                        <dt className="sr-only">Umfang</dt>
                        <dd>
                          {course.unitCount} {course.unitLabel} · {course.totalLessons} Lektionen
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Dauer</dt>
                        <dd>{course.duration}</dd>
                      </div>
                    </dl>

                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
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
                        className="mt-2 flex flex-wrap gap-1.5"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={course.totalLessons}
                        aria-valuenow={hydrated ? stat.completed : 0}
                        aria-valuetext={
                          hydrated
                            ? `${stat.completed} von ${course.totalLessons} Lektionen abgeschlossen`
                            : `Fortschritt ${course.title} wird geladen`
                        }
                        aria-label={`Fortschritt ${course.title}`}
                        data-testid={`progress-dots-${course.slug}`}
                      >
                        {Array.from({ length: dots }).map((_, d) => (
                          <span
                            key={d}
                            aria-hidden="true"
                            className={cn(
                              "h-2.5 w-2.5 rounded-full transition-colors duration-300",
                              hydrated && d < filled ? "bg-brand-orange" : "bg-border",
                            )}
                            style={{ transitionDelay: `${d * 25}ms` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <BrandButton href={startHref} variant="primary" size="sm">
                        {startLabel}
                        <span className="sr-only">: {course.title}</span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </BrandButton>
                      <BrandButton href={course.href} variant="outline" size="sm">
                        Details
                        <span className="sr-only">: {course.title}</span>
                      </BrandButton>
                    </div>
                  </Card>
                </m.li>
              );
            })}
            {PENDING_COURSES.map((course) => {
              const Icon = iconByName(courseIconName(course.slug));
              return (
                <m.li key={course.slug} variants={staggerItem}>
                  <Card accent="sand" className="h-full">
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
                        aria-label="Quellcode auf GitHub"
                        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-tile transition-colors hover:bg-background"
                      >
                        <Github className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
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

                    {/* Honest badges: Englisch · extern · GitHub · MIT */}
                    <BadgeRow
                      slug={course.slug}
                      extra={[{ label: "MIT", tone: "external" }]}
                      label={`${course.title}: Merkmale`}
                    />

                    <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      <div>
                        <dt className="sr-only">Umfang</dt>
                        <dd>
                          {course.unitCount} {course.unitLabel} · {course.lessonCountLabel}
                        </dd>
                      </div>
                    </dl>

                    <ul
                      className="mt-4 flex flex-wrap gap-2"
                      aria-label={`${course.title}: Kerndaten und Themen`}
                    >
                      {course.sourceFacts.slice(0, 4).map((fact) => (
                        <li
                          key={fact}
                          className="rounded-full bg-brand-sand/20 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground"
                        >
                          {fact}
                        </li>
                      ))}
                      {course.topics.slice(0, 3).map((topic) => (
                        <li
                          key={topic}
                          className="rounded-full bg-card-hover px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
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
                      aria-label={`Quell-Commit ${course.sourceCommit.slice(0, 7)} auf GitHub`}
                      className="mt-4 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <GitCommitHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      Commit {course.sourceCommit.slice(0, 7)}
                    </a>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <BrandButton href={course.launchHref} external variant="primary" size="sm">
                        Kurs öffnen
                        <span className="sr-only">: {course.title}, extern in neuem Tab</span>
                        <ExternalLink size={15} aria-hidden="true" />
                      </BrandButton>
                      <BrandButton href={course.href} variant="outline" size="sm">
                        Details
                        <span className="sr-only">: {course.title}</span>
                      </BrandButton>
                    </div>
                  </Card>
                </m.li>
              );
            })}
          </m.ul>
        </div>
      </section>
    </div>
  );
}
