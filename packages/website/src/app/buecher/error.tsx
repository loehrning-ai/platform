"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BrandButton } from "@/components/ui/brand-button";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import { BOOK_PAGE_COPY } from "./book-copy";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy = BOOK_PAGE_COPY[locale].error;

  useEffect(() => {
    reportClientBoundaryError("app-books", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] min-w-0 flex-col items-center justify-center px-4 text-center sm:px-6">
      <span className="mb-6 block h-[2px] w-10 bg-brand-orange" />
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <h1 className="mt-4 max-w-2xl break-words text-4xl font-bold tracking-[-0.04em] text-foreground">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-md break-words text-muted-foreground">
        {copy.body}
      </p>
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
