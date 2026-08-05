"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import {
  AiNativeOperatorLessonSidebar,
  type AiNativeOperatorLessonNavItem,
} from "./lesson-sidebar";
import { AiNativeOperatorLessonReader } from "./lesson-reader";
import type { AiNativeOperatorLesson } from "@/lib/ai-native-operator/types";

export interface NextTarget {
  readonly href: string;
  readonly label: string;
  readonly kind: "lesson" | "module" | "final-assessment";
}

interface AiNativeOperatorLessonPageProps {
  readonly lesson: AiNativeOperatorLesson;
  readonly navItems: readonly AiNativeOperatorLessonNavItem[];
  readonly prevHref: string | null;
  readonly prevTitle: string | null;
  readonly next: NextTarget;
}

/** Ties the shared `LessonShell` nav chrome to this course's sidebar + reader. */
export function AiNativeOperatorLessonPage({
  lesson,
  navItems,
  prevHref,
  prevTitle,
  next,
}: AiNativeOperatorLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel="Module navigation"
      sidebar={<AiNativeOperatorLessonSidebar lessons={navItems} />}
    >
      <AiNativeOperatorLessonReader
        lesson={lesson}
        prevHref={prevHref}
        prevTitle={prevTitle}
        next={next}
      />
    </LessonShell>
  );
}

export default AiNativeOperatorLessonPage;
