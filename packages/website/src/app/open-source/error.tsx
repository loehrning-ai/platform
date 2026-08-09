"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizeHref, parseLocalePathname } from "@/lib/i18n/locale";

const ERROR_COPY = {
  de: {
    eyebrow: "Open Source",
    title: "Die Artefaktseite konnte nicht geladen werden.",
    body: "Repository- und Publikationsdaten wurden nicht ersetzt. Lade die geprüften Angaben erneut.",
    retry: "Erneut laden",
    back: "Zum Werkverzeichnis",
  },
  en: {
    eyebrow: "Open source",
    title: "The artifact page could not be loaded.",
    body: "Repository and publication data have not been replaced. Reload the verified record.",
    retry: "Reload",
    back: "Back to the directory",
  },
} as const;

export default function OpenSourceError({ reset }: { reset: () => void }) {
  const locale = parseLocalePathname(usePathname()).locale;
  const copy = ERROR_COPY[locale];

  return (
    <section className="mx-auto max-w-3xl px-6 py-20" aria-labelledby="open-source-error-title">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <h1 id="open-source-error-title" className="mt-5 text-4xl font-bold tracking-[-0.04em]">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 border-2 border-foreground bg-brand-orange px-4 py-2 text-sm font-bold text-white"
        >
          {copy.retry}
        </button>
        <Link
          href={localizeHref("/open-source", locale)}
          className="inline-flex min-h-11 items-center border border-border px-4 py-2 text-sm font-semibold hover:border-brand-orange"
        >
          {copy.back}
        </Link>
      </div>
    </section>
  );
}
