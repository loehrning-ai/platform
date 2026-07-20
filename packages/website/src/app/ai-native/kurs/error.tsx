"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function KursError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-destructive">
          Fehler
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
          Kurs konnte nicht geladen werden
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Beim Laden der Kursübersicht ist ein Fehler aufgetreten. Bitte
          versuch es noch einmal.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-[1px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Erneut versuchen
          </button>
          <Link
            href="/ai-native"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Zur Kursseite
          </Link>
        </div>
      </div>
    </div>
  );
}
