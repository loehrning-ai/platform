import type { Metadata } from "next";
import Link from "next/link";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_PAGE_COPY,
} from "@/lib/open-source/display-copy";
import { JsonLd, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";
import { absoluteUrl, GITHUB_ORG } from "@/lib/seo/entity";
import { ArtifactLedger } from "./artifact-ledger";

const PLATFORM_REPOSITORY_URL = `${GITHUB_ORG.url}/platform`;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = OPEN_SOURCE_PAGE_COPY[locale].metadata;
  const localizedPath = localizeHref("/open-source", locale);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      ...buildLocaleAlternates(
        "/open-source",
        contentLocalesForPath("/open-source"),
      ),
      canonical: localizedPath,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${copy.title} | loehrning.ai`,
      description: copy.socialDescription,
      url: absoluteUrl(localizedPath),
      locale: locale === "de" ? "de_DE" : "en_GB",
      type: "website",
    },
  };
}

function openSourceGraph(locale: "de" | "en") {
  const copy = OPEN_SOURCE_PAGE_COPY[locale];
  const pagePath = localizeHref("/open-source", locale);
  const pageUrl = absoluteUrl(pagePath);

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
            item: locale === "de" ? SITE_URL : absoluteUrl("/en"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.metadata.title,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        name: copy.metadata.title,
        description: copy.metadata.description,
        url: pageUrl,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        isPartOf: { "@id": WEBSITE_ID },
        hasPart: OPEN_SOURCE_ARTIFACTS.map((registryArtifact) => {
          const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
          return {
            "@type":
              artifact.kind === "tool"
                ? "SoftwareApplication"
                : artifact.kind === "project"
                  ? "SoftwareSourceCode"
                  : "VideoObject",
            name: artifact.title,
            description: artifact.description,
            url: absoluteUrl(localizeHref(artifact.href, locale)),
            isAccessibleForFree: true,
            inLanguage: artifact.languageTag,
            license: absoluteUrl(artifact.license.href),
            codeRepository: artifact.source.href,
            version: artifact.source.revision,
            ...(artifact.kind === "video"
              ? {
                  contentUrl: absoluteUrl(artifact.watchHref),
                  thumbnailUrl: absoluteUrl(artifact.posterSrc),
                  duration: artifact.duration,
                  uploadDate: artifact.datePublished,
                  hasPart: [
                    {
                      "@type": "CreativeWork",
                      name: "Transcript",
                      url: absoluteUrl(artifact.transcriptHref),
                    },
                    {
                      "@type": "MediaObject",
                      name: "Captions",
                      contentUrl: absoluteUrl(artifact.captionsHref),
                    },
                  ],
                }
              : {}),
          };
        }),
      },
    ],
  };
}

export default async function OpenSourcePage() {
  const locale = await getRequestLocale();
  const copy = OPEN_SOURCE_PAGE_COPY[locale];
  const graph = openSourceGraph(locale);

  return (
    <>
      <JsonLd data={graph} id="open-source-jsonld" />
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="max-w-5xl">
            <div className="h-[3px] w-16 bg-brand-orange" />
            <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.4rem,5vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.045em] text-foreground">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.introduction}
            </p>
          </header>

          <ArtifactLedger locale={locale} />

          <section
            id="lizenzmodell"
            className="grid gap-4 border-t border-border py-6 md:grid-cols-[minmax(14rem,0.5fr)_minmax(0,1.5fr)] md:items-start"
          >
            <h2 className="text-balance text-2xl font-bold tracking-[-0.03em] text-foreground">
              {copy.footnoteTitle}
            </h2>
            <div className="max-w-3xl">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {copy.footnote}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <a
                  href={PLATFORM_REPOSITORY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:decoration-brand-orange"
                >
                  {copy.platformCode}
                  <span className="sr-only">{copy.externalTab}</span>
                </a>
                <Link
                  href={localizeHref("/open-source/lizenzrichtlinie", locale)}
                  className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:decoration-brand-orange"
                >
                  {copy.licensePolicy}
                </Link>
                <Link
                  href={localizeHref("/kurse", locale)}
                  className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:decoration-brand-orange"
                >
                  {copy.courses}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
