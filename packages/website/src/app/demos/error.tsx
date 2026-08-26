"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = parseLocalePathname(pathname).locale;
  const copy = DEMOS_PAGE_COPY[locale].errors;

  useEffect(() => {
    reportClientBoundaryError("demos-index", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-20 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.14em] text-brand-orange">
        {copy.indexKicker}
      </div>
      <h1 className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.02em]">
        {copy.indexHeading}
      </h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        {copy.indexBody}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center border-2 border-foreground bg-brand-orange px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand-orange/90"
        >
          {copy.retry}
        </button>
        <Link
          href={localizeHref("/kurse", locale)}
          className="inline-flex min-h-11 items-center border border-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          {copy.courses}
        </Link>
      </div>
    </div>
  );
}
