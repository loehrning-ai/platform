"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { m } from "framer-motion";
import {
  BookOpen,
  Trophy,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Check,
} from "lucide-react";
import {
  getBlockCompletedLessons,
  getCompletedLessonsCount,
  getOverallProgress,
  isWorkshopQuizPassed,
  importProgress,
  buildProgressUrl,
} from "@/lib/course/progress";
import type { BlockSummary } from "@/lib/course/types";

const COURSE_SLUG = "ki-und-gesellschaft" as const;

function refreshProgress(
  blocks: readonly BlockSummary[],
  totalLessons: number,
) {
  const blockProgress: Record<string, number> = {};
  for (const block of blocks) {
    blockProgress[block.id] = getBlockCompletedLessons(
      COURSE_SLUG,
      block.lessonIds,
    );
  }
  return {
    overall: getOverallProgress(COURSE_SLUG, totalLessons),
    completedLessons: getCompletedLessonsCount(COURSE_SLUG),
    quizPassed: isWorkshopQuizPassed(COURSE_SLUG),
    blockProgress,
  };
}

interface KursContentProps {
  readonly blocks: readonly BlockSummary[];
  readonly totalLessons: number;
}

export function KursContent({ blocks, totalLessons }: KursContentProps) {
  const [progress, setProgress] = useState({
    overall: 0,
    completedLessons: 0,
    quizPassed: false,
    blockProgress: {} as Record<string, number>,
  });
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#progress=")) {
      const encoded = hash.slice("#progress=".length);
      const success = importProgress(COURSE_SLUG, encoded);
      if (success) {
        setImported(true);
        window.history.replaceState(null, "", window.location.pathname);
        setTimeout(() => setImported(false), 3000);
      }
    }
    setProgress(refreshProgress(blocks, totalLessons));
  }, [blocks, totalLessons]);

  const completedBlocks = blocks.filter((b) => {
    const done = progress.blockProgress[b.id] ?? 0;
    return done >= b.lessonIds.length && b.lessonIds.length > 0;
  }).length;

  const allLessonsDone = progress.completedLessons >= totalLessons;

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-16">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>

          <div>
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-orange">
              Ihr Kurs
            </p>
            <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              KI und Gesellschaft
            </h1>
            <p className="mt-2 text-muted-foreground">
              3 Blöcke, {totalLessons} Lektionen, 1 Teilnahmebestätigung. Kostenlos.
            </p>
            <div className="mt-3 h-px w-10 bg-brand-orange" />
          </div>

          <div className="border border-border/50 bg-card/30 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-muted">Hinweis</span>
            <span className="mx-2 text-border">|</span>
            Dieser Kurs vermittelt Wissen über KI und Gesellschaft. Die Quellenangaben beziehen sich auf öffentlich zugängliche Forschungsarbeiten. Er ersetzt keine Rechtsberatung.
          </div>

          {imported && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 border border-brand-sand/30 bg-brand-sand/10 px-4 py-3 text-sm text-brand-sand"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Fortschritt erfolgreich importiert.
            </m.div>
          )}

          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Gesamtfortschritt</span>
                <p className="font-mono text-3xl font-bold text-brand-orange">
                  {progress.overall}%
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="text-center">
                  <div className="font-mono font-semibold text-foreground">
                    {progress.completedLessons}/{totalLessons}
                  </div>
                  <div>Lektionen</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-semibold text-foreground">
                    {completedBlocks}/3
                  </div>
                  <div>Blöcke</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-semibold text-foreground">
                    {progress.quizPassed ? "1" : "0"}/1
                  </div>
                  <div>Quiz</div>
                </div>
              </div>
            </div>
            <div
              className="mt-4 h-1.5 bg-border"
              role="progressbar"
              aria-valuenow={progress.overall}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Gesamtfortschritt"
            >
              <div
                className="h-full bg-brand-orange transition-[width,background-color] duration-500"
                style={{ width: `${progress.overall}%` }}
              />
            </div>

            {progress.completedLessons > 0 && (
              <button
                type="button"
                onClick={() => {
                  const url = buildProgressUrl(
                    COURSE_SLUG,
                    `${window.location.origin}/ki-und-gesellschaft/kurs`,
                  );
                  if (url) {
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }
                }}
                className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-brand-sand" />
                    Link kopiert, auf anderem Gerät öffnen
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Fortschritt auf anderem Gerät fortsetzen
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {blocks.map((block) => {
              const lessonCount = block.lessonIds.length;
              const completedInBlock = progress.blockProgress[block.id] ?? 0;
              const blockDone = completedInBlock >= lessonCount;

              return (
                <div
                  key={block.id}
                  className="group border border-border bg-card transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 hover:border-brand-orange/40"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center text-lg font-bold ${
                            blockDone
                              ? "bg-brand-sand/20 text-brand-sand"
                              : "bg-brand-orange text-white"
                          }`}
                        >
                          {blockDone ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            block.orderIndex + 1
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">
                            Block {block.orderIndex + 1}: {block.title}
                          </h2>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {block.description}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {block.durationMinutes} Min
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-mono">
                          {completedInBlock}/{lessonCount}
                        </span>
                        Lektionen
                      </div>

                      <Link
                        href={`/ki-und-gesellschaft/kurs/${block.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange transition-colors hover:text-kupfer-dark"
                      >
                        {completedInBlock > 0 ? "Weitermachen" : "Block starten"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {lessonCount > 0 && (
                      <div className="mt-3 h-1 bg-border">
                        <div
                          className="h-full bg-brand-sand transition-[width,background-color] duration-500"
                          style={{ width: `${(completedInBlock / lessonCount) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div
              className={`border border-border ${allLessonsDone ? "bg-card" : "bg-card/50 opacity-60"}`}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center ${
                      progress.quizPassed
                        ? "bg-brand-sand/20"
                        : allLessonsDone
                          ? "bg-brand-orange"
                          : "bg-border"
                    }`}
                  >
                    <Trophy
                      className={`h-6 w-6 ${
                        progress.quizPassed
                          ? "text-brand-sand"
                          : allLessonsDone
                            ? "text-white"
                            : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Workshop-Quiz</h2>
                    <p className="text-sm text-muted-foreground">
                      15 Fragen &middot; 70% zum Bestehen &middot; 20 Minuten
                    </p>
                  </div>
                </div>
                {allLessonsDone && !progress.quizPassed ? (
                  <Link
                    href="/ki-und-gesellschaft/kurs/quiz"
                    className="mt-4 inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
                  >
                    Quiz starten
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : progress.quizPassed ? (
                  <Link
                    href="/ki-und-gesellschaft/kurs/zertifikat"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-sand"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Bestanden: Teilnahmebestätigung herunterladen
                  </Link>
                ) : (
                  <p className="mt-3 text-xs text-muted">
                    Verfügbar nach Abschluss aller {totalLessons} Lektionen.
                  </p>
                )}
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
}
