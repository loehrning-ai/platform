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
import {
  competencyProgress,
  earnedCompetencies,
  isCourseRecordEarned,
} from "@/lib/courses/competencies";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";
import type { UnifiedProgress } from "@/lib/progress/types";
import { Card, IconTile } from "@/components/ui/card";
import { BrandButton } from "@/components/ui/brand-button";

export const metadata: Metadata = {
  title: "Konto | Freie Lernplattform",
  description: "Konto, Kursfortschritt und Kompetenzen der kostenlosen KI-Lernplattform.",
  robots: { index: false, follow: false },
  // Noindex utility page: suppress the canonical inherited from the root layout.
  alternates: { canonical: null },
};

function completedLessons(progress: UnifiedProgress | null, slug: string): number {
  const slice = progress?.courses[slug as keyof UnifiedProgress["courses"]];
  if (!slice) return 0;
  return Object.values(slice.lessons).filter((lesson) => lesson.completed).length;
}

const SUPPORT_TILES = [
  {
    icon: BookOpen,
    title: "Lernbücher",
    body: "Lesefassungen zum Nachschlagen.",
    href: "/buecher",
    accent: "amber" as const,
  },
  {
    icon: LayoutDashboard,
    title: "Praxisbeispiele",
    body: "Interaktive Beispiele zum Ausprobieren.",
    href: "/demos",
    accent: "sand" as const,
  },
];

export default async function KontoPage() {
  const { configured, user } = await getAuthenticatedUser();
  if (configured && !user) redirect("/login?next=/konto");

  let progress: UnifiedProgress | null = null;
  let updatedAt: string | null = null;
  const supabase = await createAuthServerClient();
  if (supabase && user) {
    const fetched = await fetchUnifiedProgressForUser(supabase, user.id);
    if (fetched.ok) {
      progress = fetched.result.progress;
      updatedAt = fetched.result.updatedAt;
    }
  }

  // Course-level rollups.
  const courseState = COURSE_CATALOG.map((course) => {
    const done = completedLessons(progress, course.slug);
    const pct =
      course.totalLessons > 0 ? Math.round((done / course.totalLessons) * 100) : 0;
    return {
      course,
      done,
      pct,
      recordEarned: isCourseRecordEarned(progress, course.slug),
    };
  });

  const coursesDone = courseState.filter((c) => c.recordEarned).length;
  // "Next" and the "all done" banner use the SAME definition as the count
  // (record earned), so the celebration can never contradict the "X/4" tally.
  const nextCourse =
    courseState.find((c) => !c.recordEarned)?.course ?? null;
  const { earned: earnedCount, total: totalCompetencies } =
    competencyProgress(progress);
  const earned = earnedCompetencies(progress);

  // Group earned competencies under the course that granted them.
  const earnedByCourse = COURSE_CATALOG.map((course) => ({
    course,
    items: earned.filter((c) => c.courseSlug === course.slug),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-8">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              Freie Lernplattform · Konto
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
              Dein Lernstand.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Angemeldet als {user?.email ?? "lokaler Zugriff ohne Konto"}. Dein
              Fortschritt wird lokal gespeichert und nach Login geräteübergreifend
              synchronisiert.
            </p>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground shadow-tile transition-colors hover:border-foreground hover:text-foreground"
            >
              Logout
              <LogOut size={14} aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Overview: three honest rollups */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="gap-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Kurse abgeschlossen
            </span>
            <span className="text-3xl font-bold tracking-[-0.03em] text-foreground">
              {coursesDone}
              <span className="text-muted-foreground">/{COURSE_CATALOG.length}</span>
            </span>
          </Card>
          <Card className="gap-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Kompetenzen erreicht
            </span>
            <span className="text-3xl font-bold tracking-[-0.03em] text-foreground">
              {earnedCount}
              <span className="text-muted-foreground">/{totalCompetencies}</span>
            </span>
          </Card>
          <Card className="gap-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Zuletzt synchronisiert
            </span>
            <span className="text-sm font-semibold text-foreground">
              {updatedAt
                ? new Date(updatedAt).toLocaleDateString("de-DE")
                : "noch kein gespeicherter Lernstand"}
            </span>
          </Card>
        </div>

        {/* Continue where you left off */}
        {nextCourse ? (
          <Card accent="kupfer" className="mt-6 bg-kupfer-mist">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Weiter lernen
            </p>
            <p className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground">
              {nextCourse.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{nextCourse.tagline}</p>
            <div className="mt-5">
              <BrandButton href={nextCourse.continueHref} variant="primary" size="sm">
                Weiterlernen <ArrowRight size={15} aria-hidden="true" />
              </BrandButton>
            </div>
          </Card>
        ) : (
          <Card accent="kupfer" className="mt-6 bg-kupfer-mist">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Gut gemacht
            </p>
            <p className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-foreground">
              Alle Kurse abgeschlossen. Vertiefe dein Wissen mit den Lernbüchern.
            </p>
            <div className="mt-5">
              <BrandButton href="/buecher" variant="outline" size="sm">
                Zu den Büchern <ArrowRight size={15} aria-hidden="true" />
              </BrandButton>
            </div>
          </Card>
        )}

        {/* Per-course progress */}
        <h2 className="mt-14 text-2xl font-bold tracking-[-0.03em] text-foreground">
          Deine Kurse
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {courseState.map(({ course, done, pct, recordEarned }) => (
            <Card key={course.slug} accent="kupfer" className="h-full">
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={GraduationCap} accent="kupfer" />
                {recordEarned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-kupfer-mist px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                    <Award size={13} aria-hidden="true" />
                    Nachweis erreicht
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-foreground">
                {course.title}
              </h3>
              <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
                {done}/{course.totalLessons} Lektionen · {pct}%
              </p>
              {/* Progress bar */}
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={`Fortschritt ${course.title}`}
              >
                <div
                  className="h-full rounded-full bg-brand-orange"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-5">
                <Link
                  href={done > 0 ? course.continueHref : course.startHref}
                  className="inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
                >
                  {done > 0 ? "Weiterlernen" : "Starten"} →
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Kompetenzen — the honest "what you've learned" record */}
        <section className="mt-16" aria-labelledby="kompetenzen-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="kompetenzen-heading"
              className="text-2xl font-bold tracking-[-0.03em] text-foreground"
            >
              Deine Kompetenzen
            </h2>
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-brand-orange">
              {earnedCount} von {totalCompetencies} erreicht
            </span>
          </div>

          {earnedByCourse.length > 0 ? (
            <div className="mt-6 space-y-6">
              {earnedByCourse.map(({ course, items }) => (
                <div key={course.slug}>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    aus {course.title}
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
                Noch keine Kompetenzen. Schließe einen Kurs ab, um deine erste zu
                sammeln, jede erscheint hier, sobald du den Kurs bestanden hast.
              </p>
            </Card>
          )}

          <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Diese Kompetenzen erarbeitest du dir durch abgeschlossene Kurse. Sie sind
            ein ehrlicher Nachweis deines Lernwegs, kein akkreditiertes Zertifikat.
          </p>
        </section>

        {/* Supporting resources */}
        <h2 className="mt-16 text-2xl font-bold tracking-[-0.03em] text-foreground">
          Weiter vertiefen
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {SUPPORT_TILES.map((tile) => (
            <Card key={tile.href} href={tile.href} accent={tile.accent} className="h-full gap-3">
              <IconTile icon={tile.icon} accent={tile.accent} />
              <div>
                <span className="font-bold text-foreground group-hover:text-brand-orange">
                  {tile.title}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                  {tile.body}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Gamification honesty note */}
        <aside className="mt-10 rounded-lg border border-border p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            XP, Abzeichen &amp; Lernserien
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Punkte und Abzeichen werden lokal auf deinem Gerät gespeichert und sind
            ein spielerisches Hilfsmittel ohne offiziellen Nachweiswert.
          </p>
        </aside>

        <nav className="mt-6 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/konto/datenschutz"
              className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
            >
              Datenschutz &amp; Datenverwaltung
            </Link>
            {": "}Export, Kursfortschritt zurücksetzen, Konto löschen.
          </p>
        </nav>
      </div>
    </section>
  );
}
