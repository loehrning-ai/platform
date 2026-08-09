"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BrandButton } from "@/components/ui/brand-button";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import {
  reportClientBoundaryError,
  validatedNextDigest,
} from "@/lib/observability/client-boundary-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy =
    locale === "en"
      ? {
          title: "The page could not be loaded.",
          body: "An unexpected error occurred. Retry the request.",
          errorId: "Error ID",
          retry: "Retry",
          home: "Back to home",
        }
      : {
          title: "Die Seite konnte nicht geladen werden.",
          body: "Ein unerwarteter Fehler ist aufgetreten. Lade die Anfrage erneut.",
          errorId: "Fehler-ID",
          retry: "Erneut laden",
          home: "Zur Startseite",
        };
  const digest = validatedNextDigest(error);

  useEffect(() => {
    reportClientBoundaryError("app-root", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 block h-[2px] w-10 bg-brand-orange" />
      <h1 className="text-4xl font-bold tracking-[-0.04em] text-foreground">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">{copy.body}</p>
      {digest && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          {copy.errorId}: {digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <BrandButton variant="outline" surface="light" onClick={() => reset()}>
          {copy.retry}
        </BrandButton>
        <BrandButton
          href={localizeHref("/", locale)}
          variant="primary"
          surface="light"
        >
          {copy.home}
        </BrandButton>
      </div>
    </div>
  );
}
