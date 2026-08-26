"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import { courseHref } from "@/lib/ai-native-operator/routes";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import {
  reportClientBoundaryError,
  type ClientBoundaryId,
} from "@/lib/observability/client-boundary-error";

export type AiNativeOperatorBoundaryKind = "course" | "module" | "lesson";

export function AiNativeOperatorCourseErrorState({
  error,
  reset,
  kind,
  boundary,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly kind: AiNativeOperatorBoundaryKind;
  readonly boundary: ClientBoundaryId;
}) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy = getAiNativeOperatorCourseCopy(locale).boundaries[kind];
  const backHref =
    kind === "course" ? localizeHref("/kurse", locale) : courseHref(locale);

  useEffect(() => {
    reportClientBoundaryError(boundary, error);
  }, [boundary, error]);

  return (
    <div className="flex min-h-[70svh] min-w-0 items-center justify-center overflow-x-clip bg-background px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg min-w-0 border-2 border-foreground bg-card p-6 sm:p-8">
        <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.14em] text-destructive [overflow-wrap:anywhere]">
          AI-Native Operator / {copy.eyebrow}
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
            className="inline-flex min-h-11 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3 text-left font-mono text-xs font-bold uppercase tracking-wide text-white transition-colors [overflow-wrap:anywhere] hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            {copy.retry}
          </button>
          <Link
            href={backHref}
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
