"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { subscribe } from "@/lib/progress/store";
import { isEvidenceBackedLessonCompleted } from "@/lib/progress/completion-evidence";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import { useOwnerAwareProgressReadiness } from "./owner-aware-progress";
import type { LessonShellReaderBar } from "./lesson-shell";
import type { ReaderFocusBarAction } from "@/components/learning/reader-focus-bar";
import { LESSON_MISSION_OPEN_TASK_EVENT } from "@/components/course-projects/focus-mission-target";
import { useEngineLessonSteps } from "@/components/lesson-engine/use-engine-lesson-progress";

interface LessonReaderBarOptions {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly ordinal: number;
  readonly total: number;
  readonly locale: Locale;
  readonly next: ReaderFocusBarAction;
  /**
   * Lesson-engine lessons: until the lesson is complete the bar leads to the
   * next open step (exercise, then the two checks) instead of a generic
   * "open task".
   */
  readonly engineSteps?: boolean;
}

/** Read-only navigation: existing owner-fenced proof remains the completion authority. */
export function useLessonReaderBar({
  courseSlug,
  lessonId,
  ordinal,
  total,
  locale,
  next,
  engineSteps = false,
}: LessonReaderBarOptions) {
  const steps = useEngineLessonSteps(courseSlug, lessonId, engineSteps);
  const contentRef = useRef<HTMLDivElement>(null);
  const identity = `${courseSlug}:${lessonId}`;
  const [snapshot, setSnapshot] = useState<{
    identity: string;
    generation: number;
    completed: boolean;
  } | null>(null);

  useEffect(
    () => subscribe(() => {
      const owner = getLearningOwnerContext();
      setSnapshot({
        identity,
        generation: owner.generation,
        completed: owner.kind !== "unknown" &&
          isEvidenceBackedLessonCompleted(courseSlug, lessonId),
      });
    }),
    [courseSlug, identity, lessonId],
  );

  const readiness = useOwnerAwareProgressReadiness(
    identity,
    snapshot?.identity ?? null,
    snapshot?.generation ?? null,
  );
  const completed = readiness.interactionReady && snapshot?.completed === true;

  function openTask() {
    const content = contentRef.current;
    if (!content || content.closest("[inert]")) return;

    const mission = content.querySelector<HTMLElement>("[data-lesson-mission]");
    if (mission && mission.dataset.missionComplete !== "true") {
      // The mission owns controlled collapse, owner prerequisites and post-render
      // focus. Its current panel may still be mounted while hidden.
      mission.dispatchEvent(new Event(LESSON_MISSION_OPEN_TASK_EVENT));
      return;
    }
    const reference = content.querySelector<HTMLDetailsElement>("details[data-lesson-reference]");
    if (reference) reference.open = true;
    const scope = reference ?? content;
    // The lesson title sits in the head above the disclosure (LessonReference),
    // so without a checkpoint the reader lands on that title, not on the
    // "Einklappen" toggle that comes first inside the details.
    const lessonHeading = reference
      ?.closest<HTMLElement>("[data-lesson-reference-block]")
      ?.querySelector<HTMLElement>('[role="heading"]');
    // A disabled textarea is not a usable next step. Its checkpoint heading
    // and prerequisite hint explain the remaining real task without ticking it.
    const target = scope.querySelector<HTMLElement>('[data-lesson-proof-checkpoint="open"]') ??
      lessonHeading ??
      scope.querySelector<HTMLElement>("h1, h2, h3, summary");
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    // Explicit instant movement also respects reduced motion when desktop CSS
    // otherwise requests smooth scrolling. Root scroll padding reserves both bars.
    target.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function goToStep(sectionId: string) {
    const content = contentRef.current;
    if (!content || content.closest("[inert]")) return;
    const section = content.querySelector<HTMLElement>(`#${sectionId}`);
    if (!section) return;
    const heading =
      section.querySelector<HTMLElement>("h2:not(.sr-only)") ?? section;
    if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    section.scrollIntoView({ block: "start", behavior: "instant" });
  }

  const engineAction: ReaderFocusBarAction | null =
    engineSteps && readiness.interactionReady && steps.hydrated && !completed
      ? !steps.exerciseDone
        ? {
            kind: "button",
            label: locale === "de" ? "Zur Übung" : "Try it",
            onSelect: () => goToStep("lesson-exercise"),
          }
        : !steps.checksPassed
          ? {
              kind: "button",
              label: locale === "de" ? "Zu den Fragen" : "To the questions",
              onSelect: () => goToStep("lesson-checks"),
            }
          : null
      : null;

  const bar: LessonShellReaderBar = {
    position: `${ordinal} / ${total}`,
    positionLabel: locale === "de"
      ? `Lektion ${ordinal} von ${total}`
      : `Lesson ${ordinal} of ${total}`,
    next: completed ? next : engineAction ?? {
      kind: "button",
      label: locale === "de" ? "Aufgabe öffnen" : "Open task",
      onSelect: openTask,
    },
  };
  return { bar, contentRef };
}
