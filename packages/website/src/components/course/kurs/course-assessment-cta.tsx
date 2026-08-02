"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import {
  Award,
  GraduationCap,
  LockKeyhole,
  Trophy,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { getCourseConfig } from "@/lib/course/config";
import type { CourseSlug } from "@/lib/course/types";
import {
  CANONICAL_LESSON_IDS,
  completedCanonicalLessonCount,
  isCourseCompletionEarned,
  isCourseFullyCompleted,
} from "@/lib/courses/completion";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { subscribe } from "@/lib/progress/store";
import type { UnifiedProgress } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

interface CourseAssessmentCtaProps {
  readonly courseSlug: CourseSlug;
  readonly className?: string;
}

interface AssessmentProgress {
  readonly completedLessons: number;
  readonly courseCompleted: boolean;
  readonly quizPassed: boolean;
  readonly certificateEligible: boolean;
}

interface AssessmentCopy {
  readonly eyebrow: string;
  readonly heading: (recordLabel: string) => string;
  readonly loading: string;
  readonly details: (
    questions: number,
    passPercentage: number,
    minutes: number,
  ) => string;
  readonly progress: (completed: number, total: number) => string;
  readonly locked: (remaining: number, total: number) => string;
  readonly ready: (total: number) => string;
  readonly passed: (recordPossessive: string) => string;
  readonly capstoneEligible: (recordPossessive: string) => string;
  readonly localRecordNotice: string;
  readonly lockedLabel: string;
  readonly startQuiz: string;
  readonly retakeQuiz: string;
  readonly downloadRecord: (recordLabel: string) => string;
}

const ASSESSMENT_COPY: Readonly<Record<"de" | "en", AssessmentCopy>> = {
  de: {
    eyebrow: "Abschluss",
    heading: (recordLabel) => `Workshop-Quiz und ${recordLabel}`,
    loading: "Fortschritt wird geprüft…",
    details: (questions, passPercentage, minutes) =>
      `${questions} Fragen · ${passPercentage}% zum Bestehen · ${minutes} Minuten`,
    progress: (completed, total) =>
      `${completed} von ${total} Lektionen abgeschlossen`,
    locked: (remaining, total) =>
      `Schließe alle ${total} Lektionen ab, um das Workshop-Quiz freizuschalten. Noch ${remaining} ${
        remaining === 1 ? "Lektion" : "Lektionen"
      }.`,
    ready: (total) =>
      `Alle ${total} Lektionen sind abgeschlossen. Das Workshop-Quiz ist jetzt freigeschaltet.`,
    passed: (recordPossessive) =>
      `Bestanden. Du kannst das Quiz wiederholen. ${recordPossessive} steht zum Download bereit.`,
    capstoneEligible: (recordPossessive) =>
      `Alle Lektionen und die Capstone-Rubrik sind abgeschlossen. ${recordPossessive} steht zum Download bereit; das Quiz bleibt verfügbar.`,
    localRecordNotice:
      "Die PDF wird lokal erzeugt, ist nicht servergeprüft und kein akkreditierter Abschluss.",
    lockedLabel: "Quiz gesperrt",
    startQuiz: "Workshop-Quiz starten",
    retakeQuiz: "Quiz wiederholen",
    downloadRecord: (recordLabel) => `${recordLabel} herunterladen`,
  },
  en: {
    eyebrow: "Final assessment",
    heading: (recordLabel) => `Workshop quiz and ${recordLabel}`,
    loading: "Checking course progress…",
    details: (questions, passPercentage, minutes) =>
      `${questions} questions · ${passPercentage}% to pass · ${minutes} minutes`,
    progress: (completed, total) =>
      `${completed} of ${total} lessons complete`,
    locked: (remaining, total) =>
      `Complete all ${total} lessons to unlock the workshop quiz. ${remaining} ${
        remaining === 1 ? "lesson" : "lessons"
      } remaining.`,
    ready: (total) =>
      `All ${total} lessons are complete. The workshop quiz is now unlocked.`,
    passed: (recordPossessive) =>
      `Passed. You can retake the quiz. ${recordPossessive} is ready to download.`,
    capstoneEligible: (recordPossessive) =>
      `Every lesson and the capstone rubric are complete. ${recordPossessive} is ready to download; the quiz remains available.`,
    localRecordNotice:
      "The PDF is generated locally, is not server-verified, and is not an accredited qualification.",
    lockedLabel: "Quiz locked",
    startQuiz: "Start workshop quiz",
    retakeQuiz: "Retake quiz",
    downloadRecord: (recordLabel) => `Download ${recordLabel}`,
  },
};

function deriveAssessmentProgress(
  progress: UnifiedProgress,
  courseSlug: CourseSlug,
): AssessmentProgress {
  return {
    completedLessons: completedCanonicalLessonCount(progress, courseSlug),
    courseCompleted: isCourseFullyCompleted(progress, courseSlug),
    quizPassed:
      progress.courses[courseSlug]?.workshopQuiz.passed === true,
    certificateEligible: isCourseCompletionEarned(progress, courseSlug),
  };
}

/**
 * Shared final-assessment pathway for course hubs.
 *
 * No quiz link is rendered before browser progress resolves or while lessons
 * remain incomplete. This keeps the hub and the quiz route's access gate in
 * one contract: requirements first, then start, then retake/download.
 */
export function CourseAssessmentCta({
  courseSlug,
  className,
}: CourseAssessmentCtaProps) {
  const config = getCourseConfig(courseSlug);
  const copy = ASSESSMENT_COPY[config.language];
  const totalLessons = CANONICAL_LESSON_IDS[courseSlug].length;
  const quizHref = `${config.coursePath}/quiz`;
  const certificateHref = `${config.coursePath}/zertifikat`;
  const passPercentage = Math.round(
    config.workshopQuizPassThreshold * 100,
  );
  const headingId = `course-assessment-${courseSlug}-heading`;
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);

  useEffect(() => {
    const unsubscribeOwner = subscribeLearningOwner(() => {
      // Never show one owner's assessment state while the store switches
      // namespaces. The matching progress emission resolves the new owner.
      setProgress(null);
    });
    const unsubscribeProgress = subscribe((snapshot) => {
      if (getLearningOwnerContext().kind === "unknown") {
        setProgress(null);
        return;
      }
      setProgress(deriveAssessmentProgress(snapshot, courseSlug));
    });
    return () => {
      unsubscribeOwner();
      unsubscribeProgress();
    };
  }, [courseSlug]);

  const remainingLessons = progress
    ? Math.max(0, totalLessons - progress.completedLessons)
    : totalLessons;

  let stateCopy = copy.loading;
  if (progress) {
    if (!progress.courseCompleted) {
      stateCopy = copy.locked(remainingLessons, totalLessons);
    } else if (progress.quizPassed) {
      stateCopy = copy.passed(config.recordNoun.possessive);
    } else if (
      courseSlug === "ai-native" &&
      progress.certificateEligible
    ) {
      stateCopy = copy.capstoneEligible(config.recordNoun.possessive);
    } else {
      stateCopy = copy.ready(totalLessons);
    }
  }

  return (
    <m.section
      id="final-assessment"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className={cn(
        "mt-12 scroll-mt-24 border-2 border-foreground bg-card/40 p-6 shadow-[4px_4px_0_0_var(--color-foreground)] md:p-8",
        className,
      )}
      aria-labelledby={headingId}
      data-assessment-state={
        progress === null
          ? "loading"
          : progress.courseCompleted
            ? progress.quizPassed
              ? "passed"
              : progress.certificateEligible
                ? "certificate-eligible"
                : "ready"
            : "locked"
      }
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        <Award
          size={12}
          className="mr-1.5 inline"
          aria-hidden="true"
        />
        {copy.eyebrow}
      </p>
      <h2
        id={headingId}
        className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-foreground"
      >
        {copy.heading(config.recordNoun.label)}
      </h2>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        {copy.details(
          config.workshopQuizQuestionCount,
          passPercentage,
          config.workshopQuizTimeLimitMinutes,
        )}
      </p>
      <p
        className="mt-3 max-w-[680px] text-[14.5px] leading-[1.55] text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {stateCopy}
      </p>

      {progress && (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {copy.progress(progress.completedLessons, totalLessons)}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {progress === null ? null : progress.courseCompleted ? (
          <>
            <Link
              href={quizHref}
              className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-7 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
            >
              <Trophy className="h-4 w-4" aria-hidden="true" />
              {progress.quizPassed ? copy.retakeQuiz : copy.startQuiz}
            </Link>

            {progress.certificateEligible && (
              <Link
                href={certificateHref}
                className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-card px-5 py-3 text-sm font-bold uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
              >
                <GraduationCap
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {copy.downloadRecord(config.recordNoun.label)}
              </Link>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 border border-border bg-background px-5 py-3 text-sm font-bold uppercase tracking-wide text-muted-foreground"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            {copy.lockedLabel}
          </button>
        )}
      </div>

      {progress?.certificateEligible && (
        <p className="mt-4 max-w-[680px] text-xs leading-relaxed text-muted-foreground">
          {copy.localRecordNotice}
        </p>
      )}
    </m.section>
  );
}
