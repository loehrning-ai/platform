import type { Metadata } from "next";
import Link from "next/link";
import { TOTAL_QUESTIONS } from "@/lib/ki-check/questions";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { ENTRY_COPY } from "@/lib/i18n/public-info-copy";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PATH = "/einstieg";
const AI_ACT_SOURCE = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = ENTRY_COPY[locale].metadata;
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
          type: "article",
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

function ExampleIcon({ id }: { readonly id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-7 w-7",
  };

  if (id === "gesicht") {
    return (
      <svg {...common}>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M9 10a3 3 0 0 0 6 0" />
        <circle cx="9.5" cy="8.5" r=".5" fill="currentColor" />
        <circle cx="14.5" cy="8.5" r=".5" fill="currentColor" />
      </svg>
    );
  }

  if (id === "route") {
    return (
      <svg {...common}>
        <path d="M4 19c4-7 6-10 9-10 2.5 0 3.5 2 7 2" />
        <circle cx="4" cy="19" r="2" />
        <circle cx="20" cy="11" r="2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 7h16M4 12h11M4 17h7" />
      <circle cx="18" cy="17" r="2" />
    </svg>
  );
}

function EinstiegContent({ locale }: { readonly locale: Locale }) {
  const copy = ENTRY_COPY[locale];
  const localizedPath = localizeHref(PATH, locale);
  const article = {
    "@context": "https://schema.org" as const,
    "@type": "Article",
    headline: copy.metadata.title,
    description: copy.metadata.description,
    url: `${SITE_URL}${localizedPath}`,
    inLanguage: locale === "de" ? "de-DE" : "en-GB",
    isAccessibleForFree: true,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };

  return (
    <>
      <JsonLd data={article} id="einstieg-article-jsonld" />

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

          <dl className="grid border-t border-border sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0">
            {copy.facts.map((fact, index) => (
              <div
                key={fact}
                className="min-w-0 border-b border-border py-3 sm:border-r sm:px-3 lg:border-r-0 lg:px-4"
              >
                <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-foreground">
                  {fact}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <section
          aria-labelledby="definition-heading"
          className="grid gap-6 border-b border-border py-8 md:grid-cols-[12rem_minmax(0,1fr)]"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.definitionIndex}
          </p>
          <div className="min-w-0">
            <h2
              id="definition-heading"
              className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
            >
              {copy.definitionHeading}
            </h2>
            <p className="mt-4 border-l-[3px] border-brand-orange pl-4 text-pretty text-lg leading-7 text-foreground sm:text-xl">
              {copy.definition}
            </p>
            <details className="group mt-4 border-t border-border pt-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                <span>{copy.definitionSourceLabel}</span>
                <span
                  aria-hidden="true"
                  className="font-mono group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {copy.definitionSource}{" "}
                <a
                  href={AI_ACT_SOURCE}
                  className="break-words text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  EUR-Lex
                </a>
              </p>
            </details>
          </div>
        </section>

        <section aria-labelledby="beispiele-heading" className="py-8">
          <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.examplesIndex}
            </p>
            <div>
              <h2
                id="beispiele-heading"
                className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
              >
                {copy.examplesHeading}
              </h2>
              <p className="mt-3 max-w-[68ch] text-pretty leading-7 text-muted-foreground">
                {copy.examplesIntro}
              </p>
            </div>
          </div>

          <div
            className="mt-6 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3"
            data-testid="beispiel-cards"
          >
            {copy.examples.map((example) => (
              <article
                key={example.id}
                className="min-w-0 bg-background p-4 sm:p-6"
                data-testid={`beispiel-${example.id}`}
              >
                <div className="flex items-start justify-between gap-4 text-brand-orange">
                  <ExampleIcon id={example.id} />
                  <span className="font-mono text-xs tracking-[0.12em]">
                    {example.number}
                  </span>
                </div>
                <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {example.task}
                </p>
                <h3 className="mt-2 text-pretty text-xl font-bold tracking-[-0.02em] text-foreground">
                  {example.heading}
                </h3>
                <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
                  {example.body}
                </p>
              </article>
            ))}
          </div>

          <div className="grid border-x border-b border-border bg-card/40 md:grid-cols-[12rem_minmax(0,1fr)]">
            <p className="border-b border-border p-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange md:border-b-0 md:border-r sm:p-6">
              {copy.boundaryLabel}
            </p>
            <div className="min-w-0 p-4 sm:p-6">
              <h3 className="text-pretty text-xl font-bold tracking-[-0.03em] text-foreground">
                {copy.boundaryHeading}
              </h3>
              <p className="mt-3 max-w-3xl break-words leading-relaxed text-muted-foreground">
                {copy.boundaryBody}
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="faq-heading"
          className="grid gap-6 border-y border-border py-8 md:grid-cols-[12rem_minmax(0,1fr)]"
        >
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
            {copy.faqIndex}
          </p>
          <div className="min-w-0">
            <h2
              id="faq-heading"
              className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
            >
              {copy.faqHeading}
            </h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {copy.faqs.map((faq) => (
                <details key={faq.question} className="group scroll-mt-24 py-1">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-foreground outline-none hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 text-pretty">{faq.question}</span>
                    <span
                      className="shrink-0 font-mono text-muted-foreground group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[68ch] pb-4 pr-6 text-sm leading-6 text-muted-foreground">
                    {"answer" in faq ? faq.answer : faq.answerBeforeLink}
                    {"linkLabel" in faq ? (
                      <Link
                        href={localizeHref("/ueber-mich", locale)}
                        className="text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                      >
                        {faq.linkLabel}
                      </Link>
                    ) : null}
                    {"answerAfterLink" in faq ? faq.answerAfterLink : null}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="weiter-heading" className="pt-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.nextIndex}
            </p>
            <h2
              id="weiter-heading"
              className="mt-3 text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
            >
              {copy.nextHeading}
            </h2>
            <p className="mt-3 text-pretty leading-7 text-muted-foreground">
              {copy.nextIntro}
            </p>
          </div>

          <div className="mt-6 grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
            <article className="flex min-w-0 flex-col bg-brand-orange/[0.06] p-4 sm:p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                {copy.primaryLabel}
              </p>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                  {copy.primaryTitle}
                </h3>
                <span className="font-mono text-xs text-foreground">
                  {copy.primaryMeta}
                </span>
              </div>
              <p className="mt-3 flex-1 break-words text-sm leading-6 text-foreground">
                {copy.primaryBody.replace("{count}", String(TOTAL_QUESTIONS))}
              </p>
              <Link
                href={localizeHref("/ki-check", locale)}
                className="mt-4 inline-flex min-h-11 items-center justify-between gap-4 border border-brand-orange bg-brand-orange px-4 py-3 font-mono text-xs font-bold text-white transition-colors hover:bg-kupfer-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span>{copy.primaryCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="flex min-w-0 flex-col bg-background p-4 sm:p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {copy.courseLabel}
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-[-0.03em] text-foreground">
                {copy.courseTitle}
              </h3>
              <p className="mt-3 flex-1 break-words text-sm leading-6 text-muted-foreground">
                {copy.courseBody}
              </p>
              <Link
                href={localizeHref("/ki-fuehrerschein", locale)}
                className="mt-4 inline-flex min-h-11 items-center justify-between gap-4 border border-border px-4 py-3 font-mono text-xs font-bold text-foreground transition-colors hover:border-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span>{copy.courseCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="flex min-w-0 flex-col bg-background p-4 sm:p-6">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {copy.primerLabel}
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-[-0.03em] text-foreground">
                {copy.primerTitle}
              </h3>
              <p className="mt-3 flex-1 break-words text-sm leading-6 text-muted-foreground">
                {copy.primerBody}
              </p>
              <Link
                href={localizeHref("/wie-ki-funktioniert", locale)}
                className="mt-4 inline-flex min-h-11 items-center justify-between gap-4 border border-border px-4 py-3 font-mono text-xs font-bold text-foreground transition-colors hover:border-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span>{copy.primerCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </section>
      </article>
    </>
  );
}

export default async function EinstiegPage() {
  const locale = await getRequestLocale();
  return <EinstiegContent locale={locale} />;
}
