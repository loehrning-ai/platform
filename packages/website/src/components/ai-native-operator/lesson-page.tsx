"use client";

import { useState, type JSX } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import { CourseProjectStudio } from "@/components/course-projects/course-project-studio";
import {
  AiNativeOperatorLessonSidebar,
  type AiNativeOperatorLessonNavItem,
} from "./lesson-sidebar";
import { AiNativeOperatorLessonReader } from "./lesson-reader";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import type { AiNativeOperatorLesson } from "@/lib/ai-native-operator/types";
import type { Locale } from "@/lib/i18n/locale";

export interface NextTarget {
  readonly href: string;
  readonly label: string;
  readonly kind: "lesson" | "module" | "final-assessment";
}

interface AiNativeOperatorLessonPageProps {
  readonly locale?: Locale;
  readonly lesson: AiNativeOperatorLesson;
  readonly navItems: readonly AiNativeOperatorLessonNavItem[];
  readonly prevHref: string | null;
  readonly prevTitle: string | null;
  readonly next: NextTarget;
}

/** Ties the shared `LessonShell` nav chrome to this course's sidebar + reader. */
export function AiNativeOperatorLessonPage({
  locale = "en",
  lesson,
  navItems,
  prevHref,
  prevTitle,
  next,
}: AiNativeOperatorLessonPageProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const copy = getAiNativeOperatorCourseCopy(locale).lesson;

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={copy.navLabel}
      openNavLabel={copy.openNav}
      closeNavLabel={copy.closeNav}
      collapseNavLabel={
        locale === "de"
          ? "Modulnavigation einklappen"
          : "Collapse module navigation"
      }
      expandNavLabel={
        locale === "de"
          ? "Modulnavigation ausklappen"
          : "Expand module navigation"
      }
      sidebar={
        <AiNativeOperatorLessonSidebar locale={locale} lessons={navItems} />
      }
    >
      <div className="mb-10">
        <CourseProjectStudio
          courseSlug="ai-native-operator"
          lessonId={lesson.id}
          locale={locale}
          lessonContext={{
            title: lesson.title,
            objective: lesson.objective,
            keyConcepts: lesson.keyConcepts,
          }}
        />
      </div>
      <AiNativeOperatorLessonReader
        locale={locale}
        lesson={lesson}
        prevHref={prevHref}
        prevTitle={prevTitle}
        next={next}
      />
    </LessonShell>
  );
}

export default AiNativeOperatorLessonPage;
