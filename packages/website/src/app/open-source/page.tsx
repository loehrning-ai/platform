import type { Metadata } from "next";
import Link from "next/link";
import { Github } from "@/components/icons/brand";
import { OpenSourceArtifactShelf } from "@/components/open-source/artifact-shelf";
import { DrawRule } from "@/components/motion/draw-rule";
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
        { "@type": "ListItem", position: 2, name: copy.metadata.title, item: pageUrl },
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
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <DrawRule className="h-[3px] w-28 bg-brand-orange" />
          <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
                {/* The trailing space is load-bearing: without it the line
                    break joins the sentences in the accessible name, and a
                    screen reader announces "Werkverzeichnis.Offen". */}
                {copy.title.split(". ")[0]}.{" "}
                <br />
                {copy.title.split(". ").slice(1).join(". ")}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {copy.introductionPrefix}{" "}
                <a
                  href={GITHUB_ORG.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap rounded border border-border bg-background px-1.5 py-0.5 font-mono text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {GITHUB_ORG.slug}
                  <span className="sr-only">
                    {copy.externalTab}
                  </span>
                </a>
                {copy.introductionSuffix}
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {copy.coursesPrefix}{" "}
                <Link
                  href={localizeHref("/kurse", locale)}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  /kurse
                </Link>
                .
              </p>
            </div>

            <aside className="border border-border bg-card/35 p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Github size={16} aria-hidden="true" />
                {copy.sourcePrinciple}
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {copy.sourcePlatform}
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={GITHUB_ORG.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      GitHub · {GITHUB_ORG.slug}
                      <span className="sr-only">
                        {copy.externalTab}
                      </span>
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {copy.snapshot}
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {copy.publishedStatus(OPEN_SOURCE_ARTIFACTS.length)}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>

          <OpenSourceArtifactShelf locale={locale} />

          {OPEN_SOURCE_ARTIFACTS.length > 0 ? (
            <p className="mt-10 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
              {copy.repositoryLanguage}
            </p>
          ) : null}

          <section className="mt-14 border-t border-border pt-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              {copy.publicationStandard}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {copy.publicationStandardBody}
            </p>
          </section>

          <section id="lizenzmodell" className="mt-14 border-t border-border pt-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              {copy.codeAndEditorial}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {copy.codeAndEditorialBefore}{" "}
              <a
                href={PLATFORM_REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {copy.platformCode}
                <span className="sr-only">{copy.externalTab}</span>
              </a>{" "}
              {copy.codeAndEditorialMiddle}{" "}
              <Link
                href={localizeHref("/open-source/lizenzrichtlinie", locale)}
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {copy.licensePolicy}
              </Link>{" "}
              {copy.codeAndEditorialAfter}
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
