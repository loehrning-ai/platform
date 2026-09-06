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

interface LessonReaderBarOptions {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly ordinal: number;
  readonly total: number;
  readonly locale: Locale;
  readonly next: ReaderFocusBarAction;
}

/** Read-only navigation: existing owner-fenced proof remains the completion authority. */
export function useLessonReaderBar({
  courseSlug,
  lessonId,
  ordinal,
  total,
  locale,
  next,
}: LessonReaderBarOptions) {
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
    const reference = content.querySelector<HTMLDetailsElement>("[data-lesson-reference]");
    if (reference) reference.open = true;
    const scope = reference ?? content;
    // A disabled textarea is not a usable next step. Its checkpoint heading
    // and prerequisite hint explain the remaining real task without ticking it.
    const target = scope.querySelector<HTMLElement>('[data-lesson-proof-checkpoint="open"]') ??
      scope.querySelector<HTMLElement>("h1, h2, h3, summary");
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    // Explicit instant movement also respects reduced motion when desktop CSS
    // otherwise requests smooth scrolling. Root scroll padding reserves both bars.
    target.scrollIntoView({ block: "start", behavior: "instant" });
  }

  const bar: LessonShellReaderBar = {
    position: `${ordinal} / ${total}`,
    positionLabel: locale === "de"
      ? `Lektion ${ordinal} von ${total}`
      : `Lesson ${ordinal} of ${total}`,
    next: completed ? next : {
      kind: "button",
      label: locale === "de" ? "Aufgabe öffnen" : "Open task",
      onSelect: openTask,
    },
  };
  return { bar, contentRef };
}
