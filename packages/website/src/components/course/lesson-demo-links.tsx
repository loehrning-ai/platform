import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CourseSlug } from "@/lib/course/types";
import { demosForLesson } from "@/lib/demos";
import { getDemoForLocale } from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

interface LessonDemoLinksProps {
  readonly courseSlug: CourseSlug;
  readonly lessonId: string;
  readonly locale: Locale;
  readonly className?: string;
}

interface LessonDemoCopy {
  readonly heading: string;
  readonly headingPlural: string;
}

const LESSON_DEMO_COPY: Readonly<Record<Locale, LessonDemoCopy>> = {
  de: {
    heading: "Praxisbeispiel zu dieser Lektion",
    headingPlural: "Praxisbeispiele zu dieser Lektion",
  },
  en: {
    heading: "Practice example for this lesson",
    headingPlural: "Practice examples for this lesson",
  },
};

/**
 * The lesson side of the demo binding in src/lib/demos.ts: every demo names the
 * course and lesson it belongs to, but only /demos/[slug] used to read it, so
 * the gallery pointed at the course and never back. Each row states what the
 * example actually contains, so the learner leaves the lesson knowing what
 * they will operate. Lessons without a bound demo render nothing.
 *
 * Server-renderable by design — no state, no client boundary.
 */
export function LessonDemoLinks({
  courseSlug,
  lessonId,
  locale,
  className,
}: LessonDemoLinksProps) {
  // The catalog is German; getDemoForLocale swaps in the English fields.
  const lessonDemos = demosForLesson(courseSlug, lessonId).map(
    (demo) => getDemoForLocale(demo.slug, locale) ?? demo,
  );
  if (lessonDemos.length === 0) return null;

  const copy = LESSON_DEMO_COPY[locale];
  const openLabel = DEMOS_PAGE_COPY[locale].tile.openAria;

  return (
    <section className={cn("mt-10", className)}>
      <h3 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {lessonDemos.length === 1 ? copy.heading : copy.headingPlural}
      </h3>
      <ul className="mt-3 divide-y divide-border border-t border-border">
        {lessonDemos.map((demo) => (
          <li key={demo.slug}>
            <Link
              href={localizeHref(`/demos/${demo.slug}`, locale)}
              prefetch={false}
              // The accessible name must contain the visible label (WCAG 2.5.3), and the
              // visible label is title + kicker, as the gallery tile also builds it.
              aria-label={openLabel(`${demo.title} ${demo.titleKicker}`)}
              className="group grid min-h-11 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <span className="font-mono text-xs text-brand-orange">
                {demo.n}
              </span>
              <span className="min-w-0">
                <span className="block break-words text-base font-semibold text-foreground transition-colors group-hover:text-brand-orange">
                  {demo.title} {demo.titleKicker}
                </span>
                <span className="mt-0.5 block break-words text-sm leading-relaxed text-muted-foreground">
                  {demo.background}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-orange"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
