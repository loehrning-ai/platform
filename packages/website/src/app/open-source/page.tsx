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
import { ContentsTable } from "@/components/open-source/contents-table";
import { ToolWall, plateEntries } from "@/components/open-source/tool-plate";

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
  const software = OPEN_SOURCE_ARTIFACTS.filter(
    (artifact) => artifact.kind !== "video",
  );
  const entries = plateEntries(software);
  const linkClass =
    "inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:decoration-2";

  return (
    <>
      <JsonLd data={graph} id="open-source-jsonld" />
      <section className="pb-12 pt-3 sm:pb-20 sm:pt-12 lg:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Compact on purpose: on a phone and at 1440 x 900 the first
              stage and its ruler sit above the fold. */}
          <header className="grid gap-x-10 gap-y-2 sm:gap-y-3 lg:grid-cols-12 lg:items-end">
            <div className="min-w-0 lg:col-span-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                {copy.eyebrow}
              </p>
              <h1 className="mt-1.5 text-balance text-[2.25rem] font-bold leading-none tracking-[-0.045em] text-foreground min-[380px]:text-[2.5rem] min-[380px]:leading-[1.02] sm:mt-3 sm:text-[clamp(3rem,5.5vw,4.5rem)] sm:leading-[0.95] lg:text-[clamp(3rem,4.3vw,4rem)]">
                {copy.title}
              </h1>
            </div>
            <p className="min-w-0 max-w-xl text-pretty text-[0.9375rem] leading-normal text-muted-foreground sm:text-lg sm:leading-relaxed lg:col-span-4 lg:pb-1 lg:text-base">
              {copy.introduction}
            </p>
            {/* With one or two tools the plates sit right below; a contents
                table would only repeat them. */}
            {entries.length >= 3 ? (
              <div className="mt-5 min-w-0 lg:col-span-12">
                <ContentsTable entries={entries} locale={locale} />
              </div>
            ) : null}
          </header>

          <div className="mt-4 sm:mt-10 lg:mt-8">
            <ToolWall artifacts={software} locale={locale} />
          </div>

          <p
            id="lizenzmodell"
            className="mt-10 flex flex-wrap gap-x-5 border-t border-foreground pt-4 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="w-full">{copy.rights}</span>
            <a
              href={PLATFORM_REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {copy.platformCode}
              <span className="sr-only">{copy.externalTab}</span>
            </a>
            <Link
              href={localizeHref("/open-source/lizenzrichtlinie", locale)}
              className={linkClass}
            >
              {copy.licensePolicy}
            </Link>
            <Link href={localizeHref("/kurse", locale)} className={linkClass}>
              {copy.courses}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
