import type { Metadata } from "next";
import Link from "next/link";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { JsonLd, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";
import { PLATFORM_COPY } from "./platform-copy";

const PATH = "/ueber-die-plattform";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = PLATFORM_COPY[locale].metadata;
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

function platformGraph(locale: Locale) {
  const copy = PLATFORM_COPY[locale];
  const path = localizeHref(PATH, locale);
  const home = localizeHref("/", locale);
  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: locale === "de" ? "Start" : "Home",
            item: `${SITE_URL}${home === "/" ? "" : home}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.metadata.title,
            item: `${SITE_URL}${path}`,
          },
        ],
      },
      {
        "@type": "WebPage",
        url: `${SITE_URL}${path}`,
        name: copy.metadata.title,
        description: copy.metadata.description,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

export default async function UeberDiePlattformPage() {
  const locale = await getRequestLocale();
  const copy = PLATFORM_COPY[locale];
  const features = getRuntimeFeatures();
  const accountReady =
    features.account && (features.magicLink || features.google);

  const operationalSections = [
    ...copy.sections,
    {
      title: copy.accountSectionTitle,
      body: accountReady
        ? copy.accountSectionReady
        : copy.accountSectionUnavailable,
    },
    {
      title: copy.feedbackSectionTitle,
      body: features.feedback
        ? copy.feedbackSectionReady
        : copy.feedbackSectionUnavailable,
    },
  ];

  return (
    <>
      <JsonLd data={platformGraph(locale)} id="plattform-jsonld" />
      <article className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <header className="border-b border-border pb-8">
          <div className="h-[3px] w-16 bg-brand-orange" />
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-pretty text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-[68ch] text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {copy.intro}
          </p>
        </header>

        <section className="pt-8" aria-label={copy.metadata.title}>
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
            {operationalSections.map((section, index) => (
              <section
                key={section.title}
                className="min-w-0 bg-background p-4 sm:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="h-2.5 w-2.5 bg-brand-orange" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-4 text-pretty text-xl font-bold tracking-[-0.03em] text-foreground">
                  {section.title}
                </h2>
                <p className="mt-3 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </section>

        <nav
          aria-label={copy.linksEyebrow}
          className="mt-8 grid gap-px overflow-hidden border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
        >
          <Link
            href={localizeHref("/bekannte-grenzen", locale)}
            className="inline-flex min-h-12 min-w-0 items-center bg-background px-4 py-3 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
          >
            {copy.limitsLink}
          </Link>
          <Link
            href={localizeHref("/open-source", locale)}
            className="inline-flex min-h-12 min-w-0 items-center bg-background px-4 py-3 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
          >
            {copy.sourceLink}
          </Link>
          {features.feedback ? (
            <Link
              href={localizeHref("/feedback", locale)}
              className="inline-flex min-h-12 min-w-0 items-center bg-background px-4 py-3 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange sm:col-span-2 lg:col-span-1"
            >
              {copy.feedbackLink}
            </Link>
          ) : (
            <a
              href="mailto:tim@loehrning.ai"
              className="inline-flex min-h-12 min-w-0 items-center bg-background px-4 py-3 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange sm:col-span-2 lg:col-span-1"
            >
              {copy.emailLink}
            </a>
          )}
        </nav>
      </article>
    </>
  );
}
