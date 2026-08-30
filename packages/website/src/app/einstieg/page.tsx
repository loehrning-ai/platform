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

const EXAMPLE_TONES = [
  "bg-brand-acid/18",
  "bg-brand-sky/18",
  "bg-brand-pink/18",
] as const;

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

      <article
        className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8"
        data-orientation-instrument
      >
        <header className="overflow-hidden border border-foreground bg-card">
          <div className="h-1 bg-brand-orange" aria-hidden="true" />
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 p-5 sm:p-7 lg:p-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                {copy.eyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-pretty text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-[62ch] text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.intro}
              </p>
            </div>

            <dl
              className="grid min-w-0 border-t border-foreground bg-kupfer-mist sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0"
              data-orientation-checklist
            >
              {copy.facts.map((fact, index) => (
                <div
                  key={fact}
                  className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 border-b border-border p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b lg:border-r-0 lg:last:border-b-0"
                >
                  <dt className="flex h-7 w-7 items-center justify-center border border-brand-orange bg-background font-mono text-xs font-bold tabular-nums text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </dt>
                  <dd className="min-w-0 break-words text-sm font-semibold text-foreground">
                    {fact}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section
          aria-labelledby="weiter-heading"
          className="mt-4 border border-foreground"
          data-orientation-actions
        >
          <div className="grid gap-3 border-b border-foreground p-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-start sm:p-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.nextIndex}
            </p>
            <div className="min-w-0">
              <h2
                id="weiter-heading"
                className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
              >
                {copy.nextHeading}
              </h2>
              <p className="mt-2 max-w-[68ch] text-pretty text-sm leading-6 text-muted-foreground">
                {copy.nextIntro}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-px bg-border lg:grid-cols-12">
            <article className="dark-section flex min-w-0 flex-col bg-background p-5 sm:p-6 lg:col-span-6">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                  {copy.primaryLabel}
                </p>
                <span className="border border-border px-2 py-1 font-mono text-xs text-muted-foreground">
                  {copy.primaryMeta}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-foreground">
                {copy.primaryTitle}
              </h3>
              <p className="mt-3 max-w-[54ch] flex-1 break-words text-sm leading-6 text-muted-foreground">
                {copy.primaryBody.replace("{count}", String(TOTAL_QUESTIONS))}
              </p>
              <Link
                href={localizeHref("/ki-check", locale)}
                className="mt-5 inline-flex min-h-11 max-w-full items-center justify-between gap-4 self-start border border-[#A5370F] bg-[#A5370F] px-4 py-3 font-mono text-xs font-bold text-white transition-[background-color,border-color,color] duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                <span className="min-w-0 break-words">{copy.primaryCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="flex min-w-0 flex-col bg-brand-sky/20 p-5 sm:p-6 lg:col-span-3">
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
                className="mt-4 inline-flex min-h-11 items-center justify-between gap-4 border border-border px-4 py-3 font-mono text-xs font-bold text-foreground transition-colors duration-150 hover:border-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                <span className="min-w-0 break-words">{copy.courseCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="flex min-w-0 flex-col bg-kupfer-mist p-5 sm:p-6 lg:col-span-3">
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
                href={localizeHref("/blog", locale)}
                className="mt-4 inline-flex min-h-11 items-center justify-between gap-4 border border-border bg-background px-4 py-3 font-mono text-xs font-bold text-foreground transition-colors duration-150 hover:border-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
              >
                <span className="min-w-0 break-words">{copy.primerCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="definition-heading"
          className="mt-8 grid min-w-0 border border-foreground md:grid-cols-[10rem_minmax(0,1fr)]"
        >
          <p className="border-b border-foreground bg-kupfer-mist p-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange md:border-b-0 md:border-r sm:p-5">
            {copy.definitionIndex}
          </p>
          <div className="min-w-0 p-4 sm:p-6">
            <h2
              id="definition-heading"
              className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
            >
              {copy.definitionHeading}
            </h2>
            <p className="mt-4 border-l-[3px] border-brand-orange pl-4 text-pretty text-lg leading-7 text-foreground sm:text-xl">
              {copy.definition}
            </p>
            <details className="group mt-4 border-t border-border pt-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                <span>{copy.definitionSourceLabel}</span>
                <span
                  aria-hidden="true"
                  className="font-mono transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
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

        <section aria-labelledby="beispiele-heading" className="mt-8">
          <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.examplesIndex}
            </p>
            <div className="min-w-0">
              <h2
                id="beispiele-heading"
                className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
              >
                {copy.examplesHeading}
              </h2>
              <p className="mt-2 max-w-[68ch] text-pretty text-sm leading-6 text-muted-foreground">
                {copy.examplesIntro}
              </p>
            </div>
          </div>

          <div
            className="mt-5 grid min-w-0 gap-3 md:grid-cols-6"
            data-testid="beispiel-cards"
            data-orientation-bento
          >
            {copy.examples.map((example, index) => (
              <article
                key={example.id}
                className={`min-w-0 border border-border p-4 sm:p-5 ${EXAMPLE_TONES[index % EXAMPLE_TONES.length]} ${
                  example.id === "route" ? "md:col-span-2" : "md:col-span-4"
                }`}
                data-testid={`beispiel-${example.id}`}
              >
                <div className="flex items-start justify-between gap-4 text-brand-orange">
                  <ExampleIcon id={example.id} />
                  <span className="font-mono text-xs tabular-nums tracking-[0.12em]">
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

            <aside className="min-w-0 border border-brand-orange bg-kupfer-mist p-4 sm:p-5 md:col-span-2">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {copy.boundaryLabel}
              </p>
              <h3 className="mt-3 text-pretty text-xl font-bold tracking-[-0.03em] text-foreground">
                {copy.boundaryHeading}
              </h3>
              <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
                {copy.boundaryBody}
              </p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="mt-8 border-t border-foreground pt-6">
          <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.faqIndex}
            </p>
            <h2
              id="faq-heading"
              className="text-pretty text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl"
            >
              {copy.faqHeading}
            </h2>
          </div>
          <div className="mt-5 grid min-w-0 gap-2 md:grid-cols-3">
            {copy.faqs.map((faq, index) => (
              <details
                key={faq.question}
                className="group min-w-0 scroll-mt-24 border border-border bg-card"
              >
                <summary className="grid min-h-14 cursor-pointer list-none grid-cols-[1.75rem_minmax(0,1fr)_1rem] items-center gap-2 p-3 font-semibold text-foreground outline-none hover:border-brand-orange hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-xs tabular-nums text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 break-words">{faq.question}</span>
                  <span
                    className="font-mono text-muted-foreground transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="border-t border-border p-4 text-sm leading-6 text-muted-foreground">
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
        </section>
      </article>
    </>
  );
}

export default async function EinstiegPage() {
  const locale = await getRequestLocale();
  return <EinstiegContent locale={locale} />;
}
