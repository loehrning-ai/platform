"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { BrandButton } from "@/components/ui/brand-button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV === "development") console.error("Page error:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 block h-[2px] w-10 bg-brand-orange" />
      <h1 className="text-4xl font-bold tracking-[-0.04em] text-foreground">
        Etwas ist schiefgelaufen.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Der Blog konnte gerade nicht geladen werden. Bitte versuch es noch einmal.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => reset()}
          className="border-2 border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-brand-orange"
        >
          Erneut versuchen
        </button>
        <BrandButton href="/" variant="primary" surface="light">
          Zur Startseite
        </BrandButton>
      </div>
    </div>
  );
}
