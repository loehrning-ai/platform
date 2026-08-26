"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import { WIE_KI_ERROR_COPY } from "@/lib/wie-ki-funktioniert-copy";

export default function WieKiFunktioniertError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy = WIE_KI_ERROR_COPY[locale];

  useEffect(() => {
    reportClientBoundaryError("wie-ki-funktioniert", error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] min-w-0 items-center justify-center bg-background px-4 py-12 sm:px-6">
      <div className="w-full max-w-lg min-w-0 border-y-2 border-foreground py-6">
        <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 break-words text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground [overflow-wrap:anywhere]">
          {copy.heading}
        </h1>
        <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {copy.body}
        </p>
        <div className="mt-7 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 max-w-full items-center justify-center break-words bg-brand-orange px-5 py-3 text-left font-mono text-xs font-bold text-white hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            {copy.retry}
          </button>
          <Link
            href={localizeHref("/wie-ki-funktioniert", locale)}
            className="inline-flex min-h-11 max-w-full items-center justify-center break-words border border-border bg-background px-5 py-3 text-left font-mono text-xs font-bold text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {copy.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
