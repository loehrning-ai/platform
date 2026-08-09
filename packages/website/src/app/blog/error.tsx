"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BrandButton } from "@/components/ui/brand-button";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";

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
          title: "The blog could not be loaded.",
          body: "The article record is unchanged. Reload the page or return home.",
          retry: "Reload",
          home: "Back to home",
        }
      : {
          title: "Der Blog konnte nicht geladen werden.",
          body: "Der Artikelbestand wurde nicht verändert. Lade die Seite erneut oder kehre zur Startseite zurück.",
          retry: "Erneut laden",
          home: "Zur Startseite",
        };
  useEffect(() => {
    reportClientBoundaryError("app-blog", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 block h-[2px] w-10 bg-brand-orange" />
      <h1 className="text-4xl font-bold tracking-[-0.04em] text-foreground">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">{copy.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="border-2 border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-brand-orange"
        >
          {copy.retry}
        </button>
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
