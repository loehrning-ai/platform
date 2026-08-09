"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";

export default function KursError({
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
          title: "The course could not be loaded",
          body: "The course overview did not load. Retry the request.",
          retry: "Try again",
          back: "Back to course page",
        }
      : {
          eyebrow: "Fehler",
          title: "Der Kurs konnte nicht geladen werden",
          body: "Die Kursübersicht wurde nicht geladen. Versuche die Anfrage erneut.",
          retry: "Erneut versuchen",
          back: "Zur Kursseite",
        };
  useEffect(() => {
    reportClientBoundaryError("ai-native-course", error);
  }, [error]);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-destructive">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.body}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {copy.retry}
          </button>
          <Link
            href={localizeHref("/ai-native", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
