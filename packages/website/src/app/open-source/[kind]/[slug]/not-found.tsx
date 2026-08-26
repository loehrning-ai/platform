import Link from "next/link";
import { localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";

const NOT_FOUND_COPY = {
  de: {
    eyebrow: "Nicht veröffentlicht",
    title: "Dieses Artefakt ist nicht im Werkverzeichnis.",
    body: "Nur Einträge mit öffentlichem Repository, festem Commit, Lizenz und vollständiger Betriebsanleitung erhalten eine Detailseite.",
    back: "Veröffentlichte Artefakte anzeigen",
  },
  en: {
    eyebrow: "Not published",
    title: "This artifact is not in the directory.",
    body: "Only entries with a public repository, pinned commit, license, and complete operating guide receive a detail page.",
    back: "View published artifacts",
  },
} as const;

export default async function OpenSourceArtifactNotFound() {
  const locale = await getRequestLocale();
  const copy = NOT_FOUND_COPY[locale];

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12"
      aria-labelledby="artifact-not-found-title"
    >
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <h1
        id="artifact-not-found-title"
        className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
      >
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
      <Link
        href={localizeHref("/open-source", locale)}
        className="mt-6 inline-flex min-h-11 items-center border border-brand-orange bg-brand-orange px-4 py-2 text-sm font-bold text-white hover:border-foreground hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        {copy.back}
      </Link>
    </section>
  );
}
