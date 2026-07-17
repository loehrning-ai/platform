import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, FileText, GraduationCap, LayoutDashboard, LogOut } from "lucide-react";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { createAuthServerClient, getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { isUnifiedProgress } from "@/lib/progress/server-sync";
import type { UnifiedProgress } from "@/lib/progress/types";
import { PATHWAY_STAGE_DISPLAY } from "@/lib/learning-graph";

export const metadata: Metadata = {
  title: "Konto | Freie Lernplattform",
  description: "Konto, Kursfortschritt und Ressourcen der kostenlosen KI-Lernplattform.",
  robots: { index: false, follow: false },
};

const STAGE_ORDER = ["pruefen", "grundlagen", "regeln", "anwenden", "dokumentieren", "vertiefen"] as const;

const COURSE_STAGE_MAP: Record<string, { stageKey: keyof typeof PATHWAY_STAGE_DISPLAY; stageNumber: number }> = {
  "ki-fuehrerschein": { stageKey: "grundlagen", stageNumber: 2 },
  "eu-ai-act-kurs": { stageKey: "regeln", stageNumber: 3 },
  "ai-native": { stageKey: "anwenden", stageNumber: 4 },
};

function completedLessons(progress: UnifiedProgress | null, slug: string): number {
  const slice = progress?.courses[slug as keyof UnifiedProgress["courses"]];
  if (!slice) return 0;
  return Object.values(slice.lessons).filter((lesson) => lesson.completed).length;
}

export default async function KontoPage() {
  const { configured, user } = await getAuthenticatedUser();
  if (configured && !user) redirect("/login?next=/konto");

  let progress: UnifiedProgress | null = null;
  let updatedAt: string | null = null;
  const supabase = await createAuthServerClient();
  if (supabase && user) {
    const { data } = await supabase
      .from("user_course_progress")
      .select("progress, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (isUnifiedProgress(data?.progress)) progress = data.progress;
    updatedAt = typeof data?.updated_at === "string" ? data.updated_at : null;
  }

  // Find first incomplete course for next-step CTA
  let nextCourse = COURSE_CATALOG[0];
  for (const course of COURSE_CATALOG) {
    const done = completedLessons(progress, course.slug);
    if (done < course.totalLessons) {
      nextCourse = course;
      break;
    }
  }
  const allDone = COURSE_CATALOG.every((c) => completedLessons(progress, c.slug) >= c.totalLessons);

  // Determine current active stage (first incomplete course's stage)
  const activeStageKey = COURSE_STAGE_MAP[nextCourse.slug]?.stageKey ?? "grundlagen";

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">

        {/* 6-stage strip */}
        <nav
          aria-label="KI-Kompetenzweg: dein Fortschritt"
          className="mb-10 overflow-x-auto"
        >
          <div className="flex min-w-max gap-0">
            {STAGE_ORDER.map((stageId, i) => {
              const display = PATHWAY_STAGE_DISPLAY[stageId];
              const isActive = stageId === activeStageKey;
              return (
                <div
                  key={stageId}
                  className={`flex flex-col items-center border px-5 py-3 ${
                    isActive
                      ? "border-brand-orange bg-brand-orange/10"
                      : "border-border"
                  } ${i > 0 ? "-ml-px" : ""}`}
                >
                  <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${isActive ? "text-brand-orange" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <span className={`mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${isActive ? "text-brand-orange" : "text-foreground"}`}>
                    {display.displayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-8">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              Freie Lernplattform · Konto
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl">
              Lernstand und Ressourcen.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Angemeldet als {user?.email ?? "lokaler Zugriff ohne Konto"}.
              Fortschritt wird lokal zwischengespeichert und nach Login mit
              Supabase synchronisiert.
            </p>
          </div>
          <form
            action="/auth/logout"
            method="post"
            className="inline-flex items-center gap-2 border border-border bg-background px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            <button type="submit" className="inline-flex items-center gap-2">
              Logout
              <LogOut size={14} aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* Next step CTA */}
        {!allDone && nextCourse && (
          <div className="mt-8 border-2 border-brand-orange bg-brand-orange/5 p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Nächster Schritt
            </p>
            <p className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-foreground">
              {nextCourse.title}
            </p>
            <div className="mt-4">
              <Link
                href={nextCourse.startHref}
                className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[3px_3px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-foreground)]"
              >
                Weiter lernen
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}
        {allDone && (
          <div className="mt-8 border-2 border-brand-orange bg-brand-orange/5 p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Gut gemacht
            </p>
            <p className="mt-2 text-[18px] font-bold tracking-[-0.02em] text-foreground">
              Alle Kurse abgeschlossen. Vertiefe dein Wissen mit den Vorlagen.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/vorlagen"
                className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[3px_3px_0_var(--color-foreground)]"
              >
                Zu den Vorlagen
              </Link>
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {COURSE_CATALOG.map((course) => {
            const done = completedLessons(progress, course.slug);
            const pct = course.totalLessons > 0
              ? Math.round((done / course.totalLessons) * 100)
              : 0;
            const stageInfo = COURSE_STAGE_MAP[course.slug];
            const stageDisplay = stageInfo ? PATHWAY_STAGE_DISPLAY[stageInfo.stageKey] : null;
            return (
              <article key={course.slug} className="border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_var(--color-foreground)]">
                {stageDisplay && stageInfo && (
                  <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                    Stufe {stageInfo.stageNumber}: {stageDisplay.displayLabel}
                  </p>
                )}
                <GraduationCap size={20} className="text-brand-orange" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-bold tracking-[-0.03em] text-foreground">
                  {course.title}
                </h2>
                <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
                  {done}/{course.totalLessons} Lektionen · {pct}%
                </p>
                <Link
                  href={done > 0 ? course.continueHref : course.startHref}
                  className="mt-5 inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
                >
                  {done > 0 ? "Weiterlernen" : "Starten"}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            [BookOpen, "Lernbücher", "Lesefassungen und Buchnotizen im Lernbereich.", "/buecher"],
            [FileText, "Arbeitsvorlagen", "Governance-Vorlagen passend zu Kursen.", "/vorlagen"],
            [LayoutDashboard, "Praxisbeispiele", "Interaktive Beispiele zum Prüfen von Annahmen.", "/demos"],
          ].map(([Icon, title, body, href]) => (
            <Link
              key={String(title)}
              href={String(href)}
              className="group border border-border bg-background p-5 transition-colors hover:bg-card"
            >
              <Icon size={18} className="text-brand-orange" aria-hidden="true" />
              <h2 className="mt-3 font-bold text-foreground">{String(title)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {String(body)}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Server-Sync: {updatedAt ? new Date(updatedAt).toLocaleString("de-DE") : "noch kein gespeicherter Lernstand"}
        </p>

        {/* Gamification label for the optional-account policy. */}
        <aside className="mt-6 border border-border p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            XP, Abzeichen &amp; Lernserien
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Diese Punkte und Abzeichen werden lokal auf deinem Gerät gespeichert und sind ein spielerisches Hilfsmittel ohne offiziellen Nachweiswert.
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
