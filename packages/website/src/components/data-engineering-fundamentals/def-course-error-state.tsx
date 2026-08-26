"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import { parseLocalePathname } from "@/lib/i18n/locale";
import {
  reportClientBoundaryError,
  type ClientBoundaryId,
} from "@/lib/observability/client-boundary-error";
import { technicalCourseHref } from "@/lib/technical-courses/routes";

export function DefCourseErrorState({
  error,
  reset,
  boundary,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly boundary: ClientBoundaryId;
}) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).error;

  useEffect(() => {
    reportClientBoundaryError(boundary, error);
  }, [boundary, error]);

  return (
    <div className="flex min-h-[70svh] min-w-0 items-center justify-center bg-background px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg min-w-0 border-2 border-foreground bg-card p-6 sm:p-8">
        <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.14em] text-destructive [overflow-wrap:anywhere]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground [overflow-wrap:anywhere]">
          {copy.title}
        </h1>
        <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {copy.body}
        </p>
        <div className="mt-7 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3 text-left font-mono text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange/90"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            {copy.retry}
          </button>
          <Link
            href={technicalCourseHref("data-engineering-fundamentals", locale, {
              kind: "landing",
            })}
            className="inline-flex min-h-11 max-w-full items-center gap-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            {copy.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
