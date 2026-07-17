"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  Check,
  ExternalLink,
  Flame,
  GitCommitHorizontal,
  Github,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  COURSE_CATALOG,
  IMPORTED_COURSE_CATALOG,
  type CatalogCourse,
} from "@/lib/courses/catalog";
import {
  BRAINSTER_COURSE_CATALOG,
  TRACK_SECTIONS,
  trackMetaFor,
  type CourseTrack,
  type TrackAccent,
} from "@/lib/courses/tracks";
import { iconByName } from "@/lib/courses/track-icon";
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";
import { serializeProgress } from "@/lib/course/progress";
import {
  getCompletedLessonsCount,
  getXp,
  getStreak,
  isCertificateEligible,
} from "@/lib/progress/store";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

// ─── Track presentation maps ─────────────────────────────────────────────
// Each track carries a tinted section band, a readable eyebrow colour and a
// chip tint. Bands stay light (the /kurse page is a light surface), so dark
// foreground text keeps AA contrast. brand-sand / brand-amber are too light
// for small text, so eyebrows fall back to foreground and the hue identity
// rides on the IconTile, the Card top border and the band.

const BAND: Record<TrackAccent, string> = {
  kupfer: "bg-kupfer-mist",
  sand: "bg-brand-sand/12",
  amber: "bg-brand-amber/10",
};

const EYEBROW: Record<TrackAccent, string> = {
  kupfer: "text-brand-orange",
  sand: "text-foreground",
  amber: "text-foreground",
};

const CHIP: Record<TrackAccent, string> = {
  kupfer: "bg-kupfer-mist text-brand-orange",
  sand: "bg-brand-sand/20 text-foreground",
  amber: "bg-brand-amber/15 text-foreground",
};

function sectionFor(track: CourseTrack) {
  const section = TRACK_SECTIONS.find((s) => s.track === track);
  if (!section) throw new Error(`Missing TRACK_SECTIONS entry for ${track}`);
  return section;
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

interface SectionHeaderProps {
  readonly accent: TrackAccent;
  readonly eyebrow: string;
  readonly title: string;
  readonly blurb: string;
}

function SectionHeader({ accent, eyebrow, title, blurb }: SectionHeaderProps) {
  return (
    <div className="mb-6 max-w-3xl">
      <p
        className={cn(
          "font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
          EYEBROW[accent],
        )}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[30px]">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {blurb}
      </p>
    </div>
  );
}

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
    // The course reader at `${startHref}` already restores `#progress=` hashes
    // on mount, so the share URL targets that route.
    const url = `${window.location.origin}${course.startHref}#progress=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState({ slug: course.slug, copied: true });
      window.setTimeout(
        () => setShareState({ slug: null, copied: false }),
        2500,
      );
    } catch {
      // Clipboard blocked (insecure context / permissions): no-op, the learner
      // can still continue from the course itself.
    }
  }

  const startedAny = Object.values(stats).some((s) => s.completed > 0);

  const zertifikat = sectionFor("zertifikat");
  const githubLab = sectionFor("github-lab");
  const brainster = sectionFor("brainster");

  return (
    <div className="space-y-12">
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

      {/* ── Track 1: Zertifikatskurse (native, German, certified) ── */}
      <section className={cn("rounded-2xl p-5 sm:p-8", BAND[zertifikat.accent])}>
        <SectionHeader
          accent={zertifikat.accent}
          eyebrow={zertifikat.eyebrow}
          title={zertifikat.title}
          blurb={zertifikat.blurb}
        />

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COURSE_CATALOG.map((course) => {
            const meta = trackMetaFor(course.slug);
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
            const startHref = stat.completed > 0 ? course.continueHref : course.startHref;
            const featured = course.step === 1;

            return (
              <li
                key={course.slug}
                className={cn(featured && "sm:col-span-2 lg:col-span-2")}
              >
                <Card accent="kupfer" className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <IconTile icon={Icon} accent="kupfer" size={featured ? "lg" : "md"} />
                    {hydrated && stat.certified && (
                      <span
                        data-testid={`certified-${course.slug}`}
                        className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange"
                      >
                        <Award size={13} aria-hidden="true" />
                        Zertifikat
                      </span>
                    )}
                  </div>

                  <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                    {course.eyebrow}
                  </p>
                  <h3
                    className={cn(
                      "mt-2 font-bold leading-tight tracking-[-0.03em] text-foreground",
                      featured ? "text-[26px] sm:text-[30px]" : "text-[22px]",
                    )}
                  >
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                    {course.tagline}
                  </p>
                  <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground">
                    {course.description}
                  </p>

                  <span className="mt-4 inline-flex w-fit items-center rounded-full bg-kupfer-mist px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange">
                    {meta.badge}
                  </span>

                  {/* Meta line */}
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
                            "h-2.5 w-2.5 rounded-full",
                            hydrated && d < filled
                              ? "bg-brand-orange"
                              : "bg-border",
                          )}
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
                          <span className="inline-flex items-center gap-1.5" role="status" aria-live="polite">
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
          })}
        </ul>
      </section>

      {/* ── Track 2: GitHub-Labs (imported, MIT, English, external) ── */}
      <section
        id="open-source"
        className={cn("scroll-mt-24 rounded-2xl p-5 sm:p-8", BAND[githubLab.accent])}
      >
        <SectionHeader
          accent={githubLab.accent}
          eyebrow={githubLab.eyebrow}
          title={githubLab.title}
          blurb={githubLab.blurb}
        />

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {IMPORTED_COURSE_CATALOG.map((course) => {
            const meta = trackMetaFor(course.slug);
            const Icon = iconByName(meta.iconName);
            return (
              <li key={course.slug}>
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

                  {/* GitHub identity badge row */}
                  <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    <Github className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    GitHub · MIT · Englisch · extern
                  </p>

                  <h3 className="mt-3 text-[22px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                    {course.tagline}
                  </p>
                  <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground">
                    {course.description}
                  </p>

                  <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <div>
                      <dt className="sr-only">Umfang</dt>
                      <dd>
                        {course.unitCount} {course.unitLabel} · {course.lessonCountLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="sr-only">Sprache</dt>
                      <dd>{course.language}</dd>
                    </div>
                  </dl>

                  <ul
                    className="mt-4 flex flex-wrap gap-2"
                    aria-label={`${course.title}: Kerndaten und Themen`}
                  >
                    {course.sourceFacts.slice(0, 4).map((fact) => (
                      <li
                        key={fact}
                        className={cn(
                          "rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]",
                          CHIP.sand,
                        )}
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
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Track 3: Angewandte Kurse (Brainster, applied, live-built) ── */}
      <section className={cn("rounded-2xl p-5 sm:p-8", BAND[brainster.accent])}>
        <SectionHeader
          accent={brainster.accent}
          eyebrow={brainster.eyebrow}
          title={brainster.title}
          blurb={brainster.blurb}
        />

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BRAINSTER_COURSE_CATALOG.map((course) => {
            const Icon = iconByName(course.iconName);
            const isLive = course.status === "live";
            return (
              <li key={course.slug}>
                <Card accent="amber" className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <IconTile icon={Icon} accent="amber" />
                    {isLive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground">
                        <Sparkles size={12} aria-hidden="true" />
                        Live
                      </span>
                    ) : (
                      <span
                        data-testid={`prep-${course.slug}`}
                        className="inline-flex items-center rounded-full bg-card-hover px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        In Vorbereitung
                      </span>
                    )}
                  </div>

                  <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
                    Angewandt · {course.language}
                  </p>
                  <h3 className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
                    {course.tagline}
                  </p>
                  <p className="mt-3 flex-1 text-[14px] leading-[1.55] text-muted-foreground">
                    {course.description}
                  </p>

                  <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <div>
                      <dt className="sr-only">Dauer</dt>
                      <dd>{course.duration}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Für</dt>
                      <dd>{course.audience}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {isLive ? (
                      <BrandButton href={course.href} variant="primary" size="sm">
                        Kurs öffnen
                        <span className="sr-only">: {course.title}</span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </BrandButton>
                    ) : (
                      <BrandButton variant="outline" size="sm" disabled>
                        Bald verfügbar
                        <span className="sr-only">: {course.title}</span>
                      </BrandButton>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
