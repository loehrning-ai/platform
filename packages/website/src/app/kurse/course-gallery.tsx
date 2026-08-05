"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Flame,
  Share2,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { COURSE_CATALOG, type CatalogCourse } from "@/lib/courses/catalog";
import {
  COURSE_SECTIONS,
  courseBadges,
  courseFacts,
  type BadgeTone,
  type CourseBadge,
} from "@/lib/courses/tracks";
import { iconByName } from "@/lib/courses/track-icon";
import { Card } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { CourseMark } from "./course-mark";
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
            "rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]",
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

const SPINE_COURSES = COURSE_CATALOG.filter(
  (course) => courseFacts(course.slug).group === "spine",
);
const DEEPER_COURSES = COURSE_CATALOG.filter(
  (course) => courseFacts(course.slug).group === "deeper",
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
      for (const course of COURSE_CATALOG) next[course.slug] = readStat(course);
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

  function renderCourseCard(course: CatalogCourse) {
    const meta = courseFacts(course.slug);
    const Icon = iconByName(meta.iconName);
    const stat = stats[course.slug] ?? { completed: 0, certified: false };
    const dots = dotCount(course);
    const filled = filledDots(stat, course);
    const pct =
      course.totalLessons === 0
        ? 0
        : Math.round((stat.completed / course.totalLessons) * 100);
    const inProgress = stat.completed > 0 && !stat.certified;
    const startLabel = stat.completed > 0 ? "Weiterlernen" : "Kurs starten";
    const startHref =
      stat.completed > 0 ? course.continueHref : course.startHref;

    return (
      <li key={course.slug}>
        <Card accent={meta.accent} className="h-full">
          <CourseMark
            coverImage={course.coverImage}
            coverImageAlt={course.coverImageAlt}
            step={course.step}
            icon={Icon}
            certified={hydrated && stat.certified}
            certifiedTestId={`certified-${course.slug}`}
          />

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

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <div>
              <dt className="sr-only">Umfang</dt>
              <dd>
                {course.unitCount} {course.unitLabel} · {course.totalLessons}{" "}
                Lektionen
              </dd>
            </div>
            <div>
              <dt className="sr-only">Dauer</dt>
              <dd>{course.duration}</dd>
            </div>
            <div>
              <dt className="sr-only">Preis</dt>
              <dd className="text-brand-orange">Kostenlos</dd>
            </div>
          </dl>

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
                    "h-2.5 w-2.5 rounded-full",
                    hydrated && d < filled ? "bg-brand-orange" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>

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
                    className="inline-flex items-center gap-1.5"
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
      </li>
    );
  }

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

        <ol className="grid gap-6 sm:grid-cols-2">
          {SPINE_COURSES.map(renderCourseCard)}
        </ol>
      </section>

      {/* ── Section 2: Tiefer gehen (native English technical courses) ── */}
      <section id="tiefer-gehen" className="scroll-mt-24">
        <SectionHeader
          eyebrow={COURSE_SECTIONS.deeper.eyebrow}
          title={COURSE_SECTIONS.deeper.title}
          blurb={COURSE_SECTIONS.deeper.blurb}
        />

        <div id="technische-vertiefung" className="scroll-mt-24">
          <SubHeader>
            <TerminalSquare
              className="h-4 w-4"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            Native technische Kurse
          </SubHeader>

          <ol className="grid gap-6 sm:grid-cols-2">
            {DEEPER_COURSES.map(renderCourseCard)}
          </ol>
        </div>
      </section>
    </div>
  );
}
