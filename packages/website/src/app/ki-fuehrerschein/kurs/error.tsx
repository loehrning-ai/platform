"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";

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
          eyebrow: "Course unavailable",
          title: "The course content could not be loaded",
          body: "Progress data was not changed. Reload the course or return to its overview.",
          retry: "Reload",
          back: "Course overview",
        }
      : {
          eyebrow: "Kurs nicht verfügbar",
          title: "Der Kursinhalt konnte nicht geladen werden",
          body: "Fortschrittsdaten wurden nicht verändert. Lade den Kurs erneut oder kehre zur Übersicht zurück.",
          retry: "Erneut laden",
          back: "Kursübersicht",
        };

  useEffect(() => {
    reportClientBoundaryError("ki-fuehrerschein-course", error);
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
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange/90"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {copy.retry}
          </button>
          <Link
            href={localizeHref("/ki-fuehrerschein/kurs", locale)}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
