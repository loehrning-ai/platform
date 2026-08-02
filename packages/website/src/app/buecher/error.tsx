"use client";

import { useEffect } from "react";
import { BrandButton } from "@/components/ui/brand-button";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientBoundaryError("app-books", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 block h-[2px] w-10 bg-brand-orange" />
      <h1 className="text-4xl font-bold tracking-[-0.04em] text-foreground">
        Etwas ist schiefgelaufen.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Die Bücher konnten gerade nicht geladen werden. Bitte versuch es noch einmal.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <BrandButton variant="outline" surface="light" onClick={() => reset()}>
          Erneut versuchen
        </BrandButton>
        <BrandButton href="/" variant="primary" surface="light">
          Zur Startseite
        </BrandButton>
      </div>
    </div>
  );
}
