import Link from "next/link";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import type { Locale } from "@/lib/i18n/locale";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

export function DefCourseNotFoundState({
  locale,
}: {
  readonly locale: Locale;
}) {
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).notFound;

  return (
    <div className="flex min-h-[70svh] min-w-0 items-center justify-center bg-background px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg min-w-0 border-2 border-foreground bg-card p-6 sm:p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
          Data Engineering / 404
        </p>
        <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground [overflow-wrap:anywhere]">
          {copy.title}
        </h1>
        <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {copy.body}
        </p>
        <Link
          href={technicalCourseHref("data-engineering-fundamentals", locale, {
            kind: "landing",
          })}
          className="mt-7 inline-flex min-h-11 max-w-full items-center justify-center break-words bg-brand-orange px-5 py-3 text-left font-mono text-xs font-bold text-white [overflow-wrap:anywhere] hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          {copy.back}
        </Link>
      </div>
    </div>
  );
}
