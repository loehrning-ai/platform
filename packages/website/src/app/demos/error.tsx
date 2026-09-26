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
    <div className="px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
      <div className="mx-auto max-w-[75rem]">
        <p className="text-label text-muted-foreground">{copy.indexKicker}</p>
        <h1 className="mt-3 max-w-[24ch] text-fluid-h1 font-bold text-foreground">
          {copy.indexHeading}
        </h1>
        <p className="mt-4 max-w-[56ch] text-lead text-muted-foreground">
          {copy.indexBody}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center bg-foreground px-5 text-[0.9375rem] font-semibold text-background transition-colors duration-[120ms] hover:bg-muted-foreground motion-reduce:transition-none"
          >
            {copy.retry}
          </button>
          <Link
            href={localizeHref("/kurse", locale)}
            className="inline-flex min-h-11 items-center border border-foreground px-5 text-[0.9375rem] font-semibold text-foreground transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none"
          >
            {copy.courses}
          </Link>
        </div>
      </div>
    </div>
  );
}
