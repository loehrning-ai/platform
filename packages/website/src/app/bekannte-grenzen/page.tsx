import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { books } from "@/lib/books";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { LIMITS_COPY } from "@/lib/i18n/public-info-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  getRuntimeFeatures,
  type RuntimeFeatures,
} from "@/lib/runtime-features";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PATH = "/bekannte-grenzen";
const ARTICLE_4_SOURCE =
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = LIMITS_COPY[locale].metadata;
  const localizedPath = localizeHref(PATH, locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

type Limitation = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly mitigation: ReactNode;
};

function withLocalizedNewsLink(text: string, locale: Locale): ReactNode {
  const marker = locale === "de" ? "/neuigkeiten" : "/en/neuigkeiten";
  const [before, after = ""] = text.split(marker);
  return (
    <>
      {before}
      <Link href={localizeHref("/neuigkeiten", locale)}>{marker}</Link>
      {after}
    </>
  );
}

function getLimitations(
  locale: Locale,
  features: RuntimeFeatures,
): readonly Limitation[] {
  const copy = LIMITS_COPY[locale].limitations;
  const accountAvailable =
    features.account && (features.magicLink || features.google);

  return [
    {
      id: "abschlussdokumente",
      title: copy.record.title,
      description: copy.record.description,
      mitigation: copy.record.mitigation,
    },
    {
      id: "praxisbeispiele",
      title: copy.simulations.title,
      description: copy.simulations.description,
      mitigation: copy.simulations.mitigation,
    },
    {
      id: "aktualitaet",
      title: copy.freshness.title,
      description: copy.freshness.description,
      mitigation: withLocalizedNewsLink(copy.freshness.mitigation, locale),
    },
    {
      id: "fortschritt-lokal",
      title: copy.progress.title,
      description: copy.progress.description,
      mitigation: accountAvailable
        ? copy.progress.mitigationAvailable
        : copy.progress.mitigationUnavailable,
    },
    {
      id: "buecher-rechtlich",
      title: copy.books.title,
      description:
        books.length === 1
          ? copy.books.descriptionOne
          : copy.books.descriptionMany.replace(
              "{bookCount}",
              String(books.length),
            ),
      mitigation: copy.books.mitigation,
    },
  ];
}

function BekannteGrenzenContent({
  locale,
  features,
}: {
  readonly locale: Locale;
  readonly features: RuntimeFeatures;
}) {
  const copy = LIMITS_COPY[locale];
  const limitations = getLimitations(locale, features);

  return (
    <article className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
        <div className="min-w-0">
          <div className="h-[3px] w-16 bg-brand-orange" />
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-pretty text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-[68ch] text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {copy.intro}
          </p>
        </div>

        <dl className="border-y border-border lg:border-b-0">
          <div className="py-3 lg:px-4">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {copy.reviewedLabel}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-foreground">
              <time dateTime="2026-08-08">{copy.reviewedDate}</time>
            </dd>
          </div>
          <div className="border-t border-border py-3 lg:px-4">
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {copy.sourceLabel}
            </dt>
            <dd className="mt-2">
              <a
                href={ARTICLE_4_SOURCE}
                className="inline-flex min-h-11 items-center gap-2 break-words text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                EUR-Lex
                <span aria-hidden="true">↗</span>
              </a>
            </dd>
          </div>
        </dl>
      </header>

      <section aria-label={copy.title} className="pt-8">
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          {limitations.map((item, index) => (
            <article
              key={item.id}
              id={item.id}
              className="min-w-0 scroll-mt-24 bg-background p-4 sm:p-6"
            >
              <div className="flex items-center justify-between gap-5">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {copy.scopeLabel}
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className="mt-4 text-pretty text-xl font-bold tracking-[-0.03em] text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <div className="mt-4 border-l-[3px] border-brand-orange pl-3 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] [&_a]:text-foreground [&_a]:underline [&_a]:decoration-brand-orange/50 [&_a]:underline-offset-4 [&_a]:hover:decoration-brand-orange [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-brand-orange">
                <p>
                  <span className="font-semibold text-foreground">
                    {copy.consequenceLabel}{" "}
                  </span>
                  {item.mitigation}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 border-y border-border py-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
          {copy.reportEyebrow}
        </p>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground">
            {copy.reportHeading}
          </h2>
          <p className="mt-3 max-w-3xl break-words text-sm leading-relaxed text-muted-foreground">
            {features.feedback ? (
              <>
                {copy.reportAvailableBeforeLink}
                <Link
                  href={localizeHref("/feedback", locale)}
                  className="text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {copy.reportLink}
                </Link>
                {copy.reportAvailableAfterLink}
              </>
            ) : (
              <>
                {copy.reportUnavailableBeforeEmail}
                <a
                  href="mailto:tim@loehrning.ai"
                  className="text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  tim@loehrning.ai
                </a>
                {copy.reportUnavailableAfterEmail}
              </>
            )}
          </p>
        </div>
      </section>
    </article>
  );
}

export default async function BekanntGrenzenPage() {
  const locale = await getRequestLocale();
  return (
    <BekannteGrenzenContent locale={locale} features={getRuntimeFeatures()} />
  );
}
