"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";

export default function ClaudeCourseError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const pathname = usePathname();
  const english = pathname === "/en" || pathname.startsWith("/en/");

  useEffect(() => {
    reportClientBoundaryError("claude-course", error);
  }, [error]);

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6"
      lang={english ? "en" : "de"}
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
        {english ? "Course unavailable" : "Kurs nicht verfügbar"}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground">
        {english
          ? "This course page could not be loaded."
          : "Diese Kursseite konnte nicht geladen werden."}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {english
          ? "No progress data was changed. Retry the page or return to the course overview."
          : "Fortschrittsdaten wurden nicht verändert. Lade die Seite erneut oder kehre zur Kursübersicht zurück."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange/90"
        >
          {english ? "Retry" : "Erneut laden"}
        </button>
        <Link
          href={
            english
              ? "/en/kurse/open-source/claude"
              : "/kurse/open-source/claude"
          }
          className="inline-flex min-h-11 items-center border-2 border-foreground bg-background px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-foreground"
        >
          {english ? "Course overview" : "Kursübersicht"}
        </Link>
      </div>
    </div>
  );
}
