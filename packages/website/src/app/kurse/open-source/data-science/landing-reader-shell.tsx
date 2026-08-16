"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LessonShell } from "@/components/course/lesson-shell";
import { DsChapterSidebar } from "@/components/data-science/ds-chapter-sidebar";
import { isInteractiveShortcutTarget } from "@/lib/a11y/keyboard-shortcuts";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import { DS_FONT_VARIABLES } from "@/lib/data-science/fonts";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { ChapterMeta } from "@/lib/data-science/types";
import type { Locale } from "@/lib/i18n/locale";
import "@/components/data-science/ds-v8-scope.css";

const LazyCourseProjectStudio = lazy(async () => {
  const projectStudioModule =
    await import("@/components/course-projects/course-project-studio");
  return { default: projectStudioModule.CourseProjectStudio };
});

const DEFERRED_STUDIO_COPY = {
  de: {
    eyebrow: "Optionale Projektvorschau",
    title: "Experimentdesign in einer eigenständigen Werkstatt erkunden.",
    body: "Lade die zustandsbehaftete Projektvorschau erst bei Bedarf. Sie schreibt keinen Lektionsabschluss; ein Entwurf bleibt an den aktiven lokalen Lernstand gebunden.",
    open: "Projektvorschau öffnen",
    loading: "Projektvorschau wird geladen",
  },
  en: {
    eyebrow: "Optional project preview",
    title: "Explore experiment design in a standalone workspace.",
    body: "Load the stateful project preview only when needed. It does not record lesson completion; a draft remains bound to the active local learning record.",
    open: "Open project preview",
    loading: "Loading project preview",
  },
} as const;

interface DataScienceLandingReaderShellProps {
  readonly locale: Locale;
  readonly chapters: readonly ChapterMeta[];
  readonly children: ReactNode;
}

function DeferredProjectStudio({
  locale,
  overview,
}: {
  readonly locale: Locale;
  readonly overview: ChapterMeta;
}): JSX.Element {
  const [requested, setRequested] = useState(false);
  const copy = DEFERRED_STUDIO_COPY[locale];

  if (!requested) {
    return (
      <section
        className="my-10 border-2 border-foreground bg-card p-5 shadow-[7px_7px_0_0_var(--color-foreground)] sm:p-7"
        data-course-project-deferred="data-science"
        aria-labelledby="data-science-project-entry-title"
      >
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-brand-orange-dark">
          {copy.eyebrow}
        </p>
        <h2
          id="data-science-project-entry-title"
          className="mt-3 max-w-[24ch] text-balance text-2xl font-black leading-tight tracking-[-0.035em] text-foreground sm:text-3xl"
        >
          {copy.title}
        </h2>
        <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
          {copy.body}
        </p>
        <button
          type="button"
          className="mt-6 inline-flex min-h-12 items-center border-2 border-foreground bg-brand-orange px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
          onClick={() => setRequested(true)}
        >
          {copy.open}
        </button>
      </section>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          className="my-10 border-2 border-border bg-card p-6 text-sm font-semibold"
          role="status"
          aria-live="polite"
        >
          {copy.loading}
        </div>
      }
    >
      <LazyCourseProjectStudio
        courseSlug="data-science"
        lessonId="home"
        locale={locale}
        lessonContext={{
          title: overview.title,
          objective: overview.subtitle,
        }}
      />
    </Suspense>
  );
}

/**
 * Landing-only reader chrome. The numbered chapter reader mounts the project
 * studio immediately because the learner has selected a canonical lesson.
 * The noncanonical landing keeps the same navigation and exposes its optional
 * project preview only after explicit learner intent; it grants no lesson
 * mission credit.
 */
export function DataScienceLandingReaderShell({
  locale,
  chapters,
  children,
}: DataScienceLandingReaderShellProps): JSX.Element {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const copy = getDataScienceCourseCopy(locale).reader;
  const overview = chapters[0];
  const next = chapters[1];

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isInteractiveShortcutTarget(event.target)
      ) {
        return;
      }
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        router.push(dsChapterHref(next.id, locale));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [locale, next, router]);

  if (!overview || overview.id !== "home") {
    throw new Error("Data Science landing shell is missing its overview.");
  }

  return (
    <div className={`ds-v8-scope ${DS_FONT_VARIABLES}`}>
      <LessonShell
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        navLabel={copy.navLabel}
        openNavLabel={
          locale === "de"
            ? "Kapitelnavigation öffnen"
            : "Open chapter navigation"
        }
        closeNavLabel={
          locale === "de"
            ? "Kapitelnavigation schließen"
            : "Close chapter navigation"
        }
        collapseNavLabel={
          locale === "de"
            ? "Kapitelnavigation einklappen"
            : "Collapse chapter navigation"
        }
        expandNavLabel={
          locale === "de"
            ? "Kapitelnavigation ausklappen"
            : "Expand chapter navigation"
        }
        sidebar={
          <DsChapterSidebar
            activeId="home"
            locale={locale}
            chapters={chapters}
            onNavigate={() => setNavOpen(false)}
          />
        }
      >
        <DeferredProjectStudio locale={locale} overview={overview} />
        {children}
      </LessonShell>
    </div>
  );
}
