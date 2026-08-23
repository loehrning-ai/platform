"use client";

import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCompletedLessonIds } from "@/lib/course/progress";
import {
  MODULE_IDS,
  getModuleMeta,
  lessonProgressKey,
  type ModuleId,
} from "@/lib/ai-native-operator/types";
import { lessonHref } from "@/lib/ai-native-operator/routes";
import { canonicalLocalePathname, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { subscribe } from "@/lib/progress";

export interface AiNativeOperatorLessonNavItem {
  readonly moduleId: ModuleId;
  readonly lessonNumber: number;
  readonly title: string;
}

interface LessonSidebarProps {
  readonly locale?: Locale;
  readonly lessons: readonly AiNativeOperatorLessonNavItem[];
}

/**
 * AiNativeOperatorLessonSidebar — module-grouped lesson nav for
 * `<LessonShell>`'s `sidebar` slot ( primitive), mirroring
 * `CodexLessonSidebar`'s track-grouped precedent.
 */
export function AiNativeOperatorLessonSidebar({
  locale = "en",
  lessons,
}: LessonSidebarProps): JSX.Element {
  const pathname = usePathname();
  const routePathname = canonicalLocalePathname(pathname);
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    return subscribe(() => {
      setCompletedIds(getCompletedLessonIds("ai-native-operator"));
    });
  }, [pathname]);

  return (
    <nav
      aria-label={locale === "de" ? "Modulnavigation" : "Module navigation"}
      className="flex flex-col gap-6"
    >
      {MODULE_IDS.map((moduleId) => {
        const meta = getModuleMeta(moduleId, locale);
        const moduleLessons = lessons.filter((l) => l.moduleId === moduleId);
        if (moduleLessons.length === 0) return null;
        return (
          <div key={moduleId}>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {meta.code} · {meta.name}
            </p>
            <ul className="flex flex-col gap-0.5">
              {moduleLessons.map((lesson) => {
                const href = lessonHref(
                  lesson.moduleId,
                  lesson.lessonNumber,
                  locale,
                );
                const active =
                  routePathname !== null &&
                  routePathname === canonicalLocalePathname(href);
                const done = completedIds.has(
                  lessonProgressKey(lesson.moduleId, lesson.lessonNumber),
                );
                return (
                  <li key={lesson.lessonNumber}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
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
                          className="shrink-0 text-risk-green"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="w-[13px] shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                          {lesson.lessonNumber}
                        </span>
                      )}
                      <span className="min-w-0 break-words leading-snug [overflow-wrap:anywhere]">
                        {lesson.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export default AiNativeOperatorLessonSidebar;
