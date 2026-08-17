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
      <article className="mx-auto w-full max-w-7xl px-5 pb-28 pt-16 sm:px-8 sm:pt-20 lg:px-10">
        <header className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="min-w-0">
            <div className="h-[3px] w-24 bg-brand-orange" />
            <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-5xl text-pretty text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[0.93] tracking-[-0.04em] text-foreground">
              {copy.title}
            </h1>
            <p className="mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {copy.intro}
            </p>
          </div>

          <aside className="min-w-0 border-2 border-foreground bg-card shadow-[5px_5px_0_var(--color-foreground)]">
            <p className="border-b border-foreground px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
              {copy.statusEyebrow}
            </p>
            <dl className="divide-y divide-border">
              <div className="flex min-w-0 items-center justify-between gap-4 px-5 py-4">
                <dt className="text-sm font-semibold text-foreground">
                  {copy.accountLabel}
                </dt>
                <dd className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {accountReady ? copy.accountReady : copy.accountUnavailable}
                </dd>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4 px-5 py-4">
                <dt className="text-sm font-semibold text-foreground">
                  {copy.feedbackLabel}
                </dt>
                <dd className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {features.feedback
                    ? copy.feedbackReady
                    : copy.feedbackUnavailable}
                </dd>
              </div>
            </dl>
          </aside>
        </header>

        <section className="pt-12" aria-label={copy.metadata.title}>
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
            {operationalSections.map((section, index) => (
              <section
                key={section.title}
                className="min-w-0 bg-background p-6 sm:p-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="h-2.5 w-2.5 bg-brand-orange" />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-8 text-pretty text-2xl font-bold tracking-[-0.03em] text-foreground">
                  {section.title}
                </h2>
                <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </section>

        <nav
          aria-label={copy.linksEyebrow}
          className="mt-12 grid gap-px overflow-hidden border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
        >
          <Link
            href={localizeHref("/bekannte-grenzen", locale)}
            className="min-h-20 min-w-0 bg-background px-5 py-5 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
          >
            {copy.limitsLink}
          </Link>
          <Link
            href={localizeHref("/open-source", locale)}
            className="min-h-20 min-w-0 bg-background px-5 py-5 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
          >
            {copy.sourceLink}
          </Link>
          {features.feedback ? (
            <Link
              href={localizeHref("/feedback", locale)}
              className="min-h-20 min-w-0 bg-background px-5 py-5 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange sm:col-span-2 lg:col-span-1"
            >
              {copy.feedbackLink}
            </Link>
          ) : (
            <a
              href="mailto:tim@loehrning.ai"
              className="min-h-20 min-w-0 bg-background px-5 py-5 text-sm font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange sm:col-span-2 lg:col-span-1"
            >
              {copy.emailLink}
            </a>
          )}
        </nav>
      </article>
    </>
  );
}
