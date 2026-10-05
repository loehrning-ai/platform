"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";

export default function BlockError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy =
    locale === "en"
      ? {
          eyebrow: "Error",
          title: "The lesson could not be loaded",
          body: "Your progress is kept.",
          retry: "Try again",
          back: "Back to course overview",
        }
      : {
          eyebrow: "Fehler",
          title: "Die Lektion konnte nicht geladen werden",
          body: "Der Fortschritt bleibt erhalten.",
          retry: "Erneut versuchen",
          back: "Zurück zur Übersicht",
        };
  useEffect(() => {
    reportClientBoundaryError("eu-ai-act-block", error);
  }, [error]);

  return (
    <div className="course-app-ground flex min-h-[100svh] items-center justify-center px-4">
      <div className="max-w-md rounded-[28px] border border-lab-line/80 bg-card p-6 text-center shadow-lab sm:p-8">
        <p className="text-sm font-semibold text-destructive">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-lab-accent px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-[#1f3a99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {copy.retry}
          </button>
          <Link
            href={localizeHref("/eu-ai-act-kurs/kurs", locale)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-lab-accent-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
