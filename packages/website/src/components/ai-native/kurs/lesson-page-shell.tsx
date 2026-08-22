"use client";

import { useState, type JSX, type ReactNode } from "react";
import { LessonShell } from "@/components/course/lesson-shell";
import {
  AiNativeLessonSidebar,
  type AiNativeLessonNavItem,
} from "./lesson-sidebar";
import type { Locale } from "@/lib/i18n/locale";

interface AiNativeLessonPageShellProps {
  readonly children: ReactNode;
  readonly lessons: readonly AiNativeLessonNavItem[];
  readonly locale: Locale;
}

/** Adds shared responsive course chrome without turning lesson content client-side. */
export function AiNativeLessonPageShell({
  children,
  lessons,
  locale,
}: AiNativeLessonPageShellProps): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const isEnglish = locale === "en";

  return (
    <LessonShell
      navOpen={navOpen}
      onNavOpenChange={setNavOpen}
      navLabel={isEnglish ? "Course navigation" : "Kursnavigation"}
      navId="ai-native-mobile-course-nav"
      openNavLabel={isEnglish ? "Open course navigation" : "Kursnavigation öffnen"}
      closeNavLabel={isEnglish ? "Close course navigation" : "Kursnavigation schließen"}
      collapseNavLabel={isEnglish ? "Collapse course navigation" : "Kursnavigation einklappen"}
      expandNavLabel={isEnglish ? "Expand course navigation" : "Kursnavigation ausklappen"}
      contentMode="stage"
      sidebar={<AiNativeLessonSidebar locale={locale} lessons={lessons} />}
      renderSidebar={(instance) => (
        <AiNativeLessonSidebar
          locale={locale}
          lessons={lessons}
          idPrefix={`ai-native-nav-${instance}`}
        />
      )}
    >
      {children}
    </LessonShell>
  );
}

export default AiNativeLessonPageShell;
