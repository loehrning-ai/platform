import type { Metadata } from "next";
import Image from "next/image";
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
const HERO_FRAME_CLASSES = [
  "left-[12%] top-[15%] z-30 w-[76%] -rotate-[2deg]",
  "left-[3%] top-[7%] z-10 w-[62%] -rotate-[9deg]",
  "right-[2%] top-[5%] z-20 w-[60%] rotate-[8deg]",
] as const;

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
  const leadRegistryArtifact = OPEN_SOURCE_ARTIFACTS.find(
    (artifact) => artifact.kind !== "video",
  );
  const leadArtifact = leadRegistryArtifact
    ? localizeOpenSourceArtifact(leadRegistryArtifact, locale)
    : null;
  const heroFrames = leadArtifact
    ? [leadArtifact.guide.screenshot, ...(leadArtifact.guide.demo ?? [])].slice(
        0,
        3,
      )
    : [];

  return (
    <>
      <JsonLd data={graph} id="open-source-jsonld" />
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <header
            className="relative grid overflow-hidden border border-foreground md:grid-cols-[minmax(0,0.88fr)_minmax(20rem,1.12fr)]"
            data-open-source-risograph-hero
            style={{ background: "var(--color-paper, #f8f3e8)" }}
          >
            <div className="relative z-10 flex min-w-0 flex-col justify-between p-5 sm:p-7 md:min-h-[25rem] md:p-8">
              <div>
                <div className="h-[3px] w-16 bg-brand-orange" />
                <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                  {copy.eyebrow}
                </p>
                <h1 className="mt-3 max-w-3xl text-balance text-[clamp(2.65rem,6vw,5.3rem)] font-bold leading-[0.9] tracking-[-0.055em] text-foreground">
                  {copy.title}
                </h1>
              </div>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {copy.introduction}
              </p>
            </div>

            {leadArtifact && heroFrames.length > 0 ? (
              <figure
                role="img"
                aria-label={`${copy.showcase.previewGroup}: ${leadArtifact.title}`}
                className="relative min-h-[22rem] overflow-hidden border-t border-foreground md:min-h-[25rem] md:border-l md:border-t-0"
                data-open-source-image-fan
                style={{
                  background: "var(--color-brand-peach, #ffc19e)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -bottom-12 left-0 h-40 w-40 rotate-12 border border-foreground"
                  style={{
                    background: "var(--color-brand-acid, #dfff69)",
                  }}
                />
                <span className="absolute left-4 top-4 z-40 border border-foreground bg-background px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-foreground sm:left-6 sm:top-6">
                  {copy.showcase.entryCount(OPEN_SOURCE_ARTIFACTS.length)}
                </span>
                <div className="absolute inset-8 sm:inset-10">
                  {heroFrames.map((frame, index) => (
                    <span
                      key={frame.src}
                      aria-hidden={index === 0 ? undefined : "true"}
                      className={`absolute block aspect-[16/10] overflow-hidden border border-foreground bg-background shadow-[8px_8px_0_var(--color-brand-acid,#dfff69)] transition-[transform] duration-300 ease-out motion-reduce:transition-none ${HERO_FRAME_CLASSES[index] ?? HERO_FRAME_CLASSES[0]}`}
                    >
                      <Image
                        src={frame.src}
                        alt={index === 0 ? frame.alt : ""}
                        width={frame.width}
                        height={frame.height}
                        sizes="(min-width: 768px) 520px, calc(100vw - 96px)"
                        className="h-full w-full object-contain"
                        priority={index === 0}
                      />
                    </span>
                  ))}
                </div>
                <figcaption className="absolute bottom-4 right-4 z-40 max-w-[75%] border border-foreground bg-background px-3 py-2 text-right font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground sm:bottom-6 sm:right-6">
                  {leadArtifact.title}
                </figcaption>
              </figure>
            ) : null}
          </header>

          <ArtifactLedger locale={locale} />

          <section
            id="lizenzmodell"
            className="mt-6 grid gap-4 border border-foreground p-5 md:grid-cols-[minmax(14rem,0.5fr)_minmax(0,1.5fr)] md:items-start md:p-6"
            style={{ background: "var(--color-brand-sky, #bfe3ff)" }}
            data-open-source-license-sheet
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
