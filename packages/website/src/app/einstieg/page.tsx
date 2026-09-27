import type { Metadata } from "next";
import Link from "next/link";
import { TOTAL_QUESTIONS } from "@/lib/ki-check/questions";
import { ButtonLink, Kicker, SectionHead } from "@/components/werk";
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

      {/* Paper surface (SPEC §2.3): sentence-case labels, hairline rows, one
          Mennige primary. The H1 sits on the 16px phone gutter, in line with
          the header logo. */}
      <article
        className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8"
        data-orientation-instrument
      >
        <header className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-10">
          <div className="min-w-0">
            <Kicker>{copy.eyebrow.split(" / ")[0]}</Kicker>
            <h1 className="mt-3 max-w-4xl text-balance text-fluid-h1 font-bold text-foreground lg:text-display">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-pretty text-body text-muted-foreground">
              {copy.intro}
            </p>
          </div>

          {/* Three plain facts: a numbered label would add no meaning. */}
          <ul
            className="min-w-0 border-t-2 border-foreground"
            data-orientation-checklist
          >
            {copy.facts.map((fact) => (
              <li
                key={fact}
                className="min-w-0 break-words border-b border-border py-3 text-sm font-semibold text-foreground"
              >
                {fact}
              </li>
            ))}
          </ul>
        </header>

        <section
          aria-labelledby="weiter-heading"
          className="mt-10 sm:mt-14"
          data-orientation-actions
        >
          <SectionHead id="weiter-heading" title={copy.nextHeading} size="compact" />

          <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-12 lg:gap-6">
            <article className="flex min-w-0 flex-col border border-foreground bg-card p-5 sm:p-6 lg:col-span-6">
              <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-3">
                <Kicker>{copy.primaryLabel}</Kicker>
                <span className="text-caption tabular-nums text-muted-foreground">
                  {copy.primaryMeta}
                </span>
              </div>
              <h3 className="mt-3 text-fluid-h3 font-bold text-foreground">
                {copy.primaryTitle}
              </h3>
              <p className="mt-3 max-w-[54ch] flex-1 break-words text-sm leading-6 text-muted-foreground">
                {copy.primaryBody.replace("{count}", String(TOTAL_QUESTIONS))}
              </p>
              <ButtonLink
                href={localizeHref("/ki-check", locale)}
                locale={locale}
                className="mt-5 self-start"
              >
                {copy.primaryCta}
              </ButtonLink>
            </article>

            {[
              {
                label: copy.courseLabel,
                title: copy.courseTitle,
                body: copy.courseBody,
                href: "/ki-fuehrerschein",
                cta: copy.courseCta,
              },
              {
                label: copy.primerLabel,
                title: copy.primerTitle,
                body: copy.primerBody,
                href: "/blog",
                cta: copy.primerCta,
              },
            ].map((option) => (
              <article
                key={option.href}
                className="flex min-w-0 flex-col border-t border-border pt-4 lg:col-span-3 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0"
              >
                <Kicker>{option.label}</Kicker>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  {option.title}
                </h3>
                <p className="mt-2 flex-1 break-words text-sm leading-6 text-muted-foreground">
                  {option.body}
                </p>
                <ButtonLink
                  href={localizeHref(option.href, locale)}
                  locale={locale}
                  variant="text"
                  className="mt-3 self-start"
                >
                  {option.cta}
                </ButtonLink>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="definition-heading" className="mt-12 min-w-0 sm:mt-16">
          <SectionHead
            id="definition-heading"
            title={copy.definitionHeading}
            size="compact"
          />
          <p className="mt-5 max-w-[60ch] border-l-2 border-mennige pl-4 text-pretty text-lg leading-7 text-foreground sm:text-xl">
            {copy.definition}
          </p>
          <details className="group mt-4 max-w-3xl border-t border-border pt-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
              <span>{copy.definitionSourceLabel}</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {copy.definitionSource}{" "}
              <a
                href={AI_ACT_SOURCE}
                className="break-words text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                EUR-Lex
              </a>
            </p>
          </details>
        </section>

        <section aria-labelledby="beispiele-heading" className="mt-12 sm:mt-16">
          <SectionHead
            id="beispiele-heading"
            title={copy.examplesHeading}
            size="compact"
          />

          <div
            className="mt-2 grid min-w-0 md:grid-cols-2 md:gap-x-8"
            data-testid="beispiel-cards"
            data-orientation-bento
          >
            {copy.examples.map((example) => (
              <article
                key={example.id}
                className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-5"
                data-testid={`beispiel-${example.id}`}
              >
                <span className="text-foreground">
                  <ExampleIcon id={example.id} />
                </span>
                <div className="min-w-0">
                  <p className="text-label text-muted-foreground">
                    {example.task}
                  </p>
                  <h3 className="mt-1 text-pretty text-xl font-bold text-foreground">
                    {example.heading}
                  </h3>
                  <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                    {example.body}
                  </p>
                </div>
              </article>
            ))}

            <aside className="min-w-0 border-b border-border py-5 md:border-b-0 md:border-l-2 md:border-l-mennige md:pl-6">
              <p className="text-label text-muted-foreground">
                {copy.boundaryLabel}
              </p>
              <h3 className="mt-1 text-pretty text-xl font-bold text-foreground">
                {copy.boundaryHeading}
              </h3>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                {copy.boundaryBody}
              </p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="mt-12 sm:mt-16">
          <SectionHead id="faq-heading" title={copy.faqHeading} size="compact" />
          <div className="mt-2 min-w-0 border-b border-border">
            {copy.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group min-w-0 scroll-mt-24 border-t border-border first:border-t-0"
              >
                <summary className="grid min-h-14 cursor-pointer list-none grid-cols-[minmax(0,1fr)_1rem] items-center gap-3 py-3 font-semibold text-foreground outline-none hover:underline hover:decoration-border hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 break-words">{faq.question}</span>
                  <span
                    className="text-muted-foreground transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[64ch] pb-4 text-sm leading-6 text-muted-foreground">
                  {"answer" in faq ? faq.answer : faq.answerBeforeLink}
                  {"linkLabel" in faq ? (
                    <Link
                      href={localizeHref("/ueber-mich", locale)}
                      className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
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
