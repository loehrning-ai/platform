"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCompletedLessonIds, subscribe } from "@/lib/progress";
import { MODULE_IDS, type ModuleId } from "@/lib/ai-native/types";
import {
  canonicalLocalePathname,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export interface AiNativeLessonNavItem {
  readonly moduleId: ModuleId;
  readonly moduleNumber: number;
  readonly moduleTitle: string;
  readonly lessonId: string;
  readonly lessonNumber: number;
  readonly title: string;
}

interface AiNativeLessonSidebarProps {
  readonly locale: Locale;
  readonly lessons: readonly AiNativeLessonNavItem[];
  readonly idPrefix?: string;
}

/** Complete, module-grouped navigation for the native AI course. */
export function AiNativeLessonSidebar({
  locale,
  lessons,
  idPrefix = "ai-native-nav",
}: AiNativeLessonSidebarProps): JSX.Element {
  const pathname = usePathname();
  const routePathname = canonicalLocalePathname(pathname);
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(
    () =>
      subscribe(() => {
        setCompletedIds(getCompletedLessonIds("ai-native"));
      }),
    [],
  );

  return (
    <nav
      aria-label={locale === "de" ? "Kursnavigation" : "Course navigation"}
      className="flex flex-col gap-6"
    >
      {MODULE_IDS.map((moduleId) => {
        const moduleLessons = lessons.filter(
          (lesson) => lesson.moduleId === moduleId,
        );
        const first = moduleLessons[0];
        if (!first) return null;

        return (
          <section key={moduleId} aria-labelledby={`${idPrefix}-${moduleId}`}>
            <h2
              id={`${idPrefix}-${moduleId}`}
              className="mb-2 truncate font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
              title={`${locale === "de" ? "Modul" : "Module"} ${first.moduleNumber}: ${first.moduleTitle}`}
            >
              {locale === "de" ? "Modul" : "Module"} {first.moduleNumber} ·{" "}
              {first.moduleTitle}
            </h2>
            <ol className="flex flex-col gap-0.5">
              {moduleLessons.map((lesson) => {
                const href = localizeHref(
                  `/ai-native/kurs/${lesson.moduleId}/${lesson.lessonId}`,
                  locale,
                );
                const active =
                  routePathname !== null &&
                  routePathname === canonicalLocalePathname(href);
                const done = completedIds.has(lesson.lessonId);

                return (
                  <li key={lesson.lessonId}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      title={`${lesson.lessonNumber}. ${lesson.title}`}
                      className={cn(
                        "flex min-h-11 min-w-0 items-start gap-2 border-l-2 px-2.5 py-2.5 text-[13px] leading-[1.35] transition-colors",
                        active
                          ? "border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                          : "border-transparent text-muted-foreground hover:border-brand-orange/40 hover:text-foreground",
                      )}
                    >
                      {done ? (
                        <CheckCircle2
                          size={13}
                          className="mt-0.5 shrink-0 text-risk-green"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="w-[13px] shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                          {lesson.lessonNumber}
                        </span>
                      )}
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {lesson.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}

export default AiNativeLessonSidebar;
