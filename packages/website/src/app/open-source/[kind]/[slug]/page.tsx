import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CommandBlock } from "@/components/open-source/command-block";
import { OutputFilm } from "@/components/open-source/output-film";
import { SoftwareArtifactGuide } from "@/components/open-source/software-artifact-guide";
import {
  Colophon,
  Formula,
  PlateStage,
} from "@/components/open-source/tool-plate";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  getOpenSourceArtifactByRoute,
  plateNumber,
  type ProjectArtifact,
  type ToolArtifact,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_DETAIL_COPY,
  OPEN_SOURCE_PAGE_COPY,
  SOFTWARE_GUIDE_COPY,
  SPECIMEN_COPY,
} from "@/lib/open-source/display-copy";
import { absoluteUrl } from "@/lib/seo/entity";
import {
  JsonLd,
  ORG_ID,
  PERSON_ID,
  SITE_URL,
  WEBSITE_ID,
} from "@/lib/seo/json-ld";
import type { JsonLdGraph } from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ kind: string; slug: string }>;
};

const DETAIL_ARTIFACTS = [
  ...OPEN_SOURCE_TOOL_ARTIFACTS,
  ...OPEN_SOURCE_PROJECT_ARTIFACTS,
  ...OPEN_SOURCE_VIDEO_ARTIFACTS,
] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return DETAIL_ARTIFACTS.map((artifact) => ({
    kind: `${artifact.kind}s`,
    slug: artifact.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { kind, slug } = await params;
  const registryArtifact = getOpenSourceArtifactByRoute(kind, slug);
  if (!registryArtifact) return {};
  const locale = await getRequestLocale();
  const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
  const localizedPath = localizeHref(artifact.href, locale);

  return {
    title: artifact.title,
    description: artifact.description,
    alternates: {
      ...buildLocaleAlternates(
        artifact.href,
        contentLocalesForPath(artifact.href),
      ),
      canonical: localizedPath,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: artifact.title,
      description: artifact.description,
      url: absoluteUrl(localizedPath),
      siteName: "loehrning.ai",
      locale: locale === "de" ? "de_DE" : "en_GB",
      type: artifact.kind === "video" ? "video.other" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: artifact.title,
      description: artifact.description,
    },
  };
}

export default async function OpenSourceArtifactDetailPage({
  params,
}: PageProps) {
  const { kind, slug } = await params;
  const registryArtifact = getOpenSourceArtifactByRoute(kind, slug);
  if (!registryArtifact) notFound();
  const locale = await getRequestLocale();
  const copy = OPEN_SOURCE_DETAIL_COPY[locale];
  const artifact = localizeOpenSourceArtifact(registryArtifact, locale);

  const launchHref =
    artifact.kind === "video" ? artifact.watchHref : artifact.launchHref;
  const artifactUrl = absoluteUrl(localizeHref(artifact.href, locale));
  const collectionUrl = absoluteUrl(localizeHref("/open-source", locale));
  const homeUrl = locale === "de" ? SITE_URL : absoluteUrl("/en");
  const jsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.breadcrumbHome,
            item: homeUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Open Source",
            item: collectionUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: artifact.title,
            item: artifactUrl,
          },
        ],
      },
      {
        "@type":
          artifact.kind === "tool"
            ? "SoftwareApplication"
            : artifact.kind === "project"
              ? "SoftwareSourceCode"
              : "VideoObject",
        "@id": `${artifactUrl}#artifact`,
        name: artifact.title,
        description: artifact.description,
        url: artifactUrl,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntityOfPage: artifactUrl,
        publisher: { "@id": ORG_ID },
        creator: { "@id": PERSON_ID },
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
              transcript: absoluteUrl(artifact.transcriptHref),
            }
          : {}),
      },
    ],
  };

  const software = artifact.kind === "video" ? null : artifact;
  const number = software ? plateNumber(software.id) : null;
  const buttonClass =
    "inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-4 text-sm font-semibold transition-colors duration-100";

  return (
    <>
      <JsonLd
        data={jsonLd}
        id={`open-source-${artifact.kind}-${artifact.slug}-jsonld`}
      />
      <section
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
        aria-labelledby="artifact-title"
      >
        <Link
          href={localizeHref("/open-source", locale)}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {copy.back}
        </Link>
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
          {number ? `${OPEN_SOURCE_PAGE_COPY[locale].plate.number} ${number} · ` : ""}
          {artifact.eyebrow}
        </p>
        <h1
          id="artifact-title"
          className="mt-3 text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-none tracking-[-0.045em] text-foreground"
        >
          {artifact.title}
        </h1>
        {software ? (
          <Formula artifact={software} locale={locale} className="mt-4 text-lg" />
        ) : null}
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {artifact.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {launchHref ? (
            launchHref.startsWith("https://") ? (
              <a
                href={launchHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonClass} bg-foreground text-background hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground`}
              >
                {copy.open}
                <span className="sr-only">{copy.externalTab}</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : (
              <Link
                href={localizeHref(launchHref, locale)}
                className={`${buttonClass} bg-foreground text-background hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground`}
              >
                {copy.openInternal}
              </Link>
            )
          ) : null}
          <a
            href={artifact.source.revisionHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonClass} bg-background text-foreground hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background`}
          >
            {copy.sourceRevision}
            <span className="sr-only">{copy.externalTab}</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>

        {artifact.kind === "video" ? (
          <section
            className="mt-6"
            aria-label={`${copy.videoLabel}: ${artifact.title}`}
          >
            <video
              className="aspect-video w-full bg-black"
              controls
              preload="metadata"
              poster={artifact.posterSrc}
            >
              <source
                src={artifact.watchHref}
                type={artifact.mediaFiles.video.mimeType}
              />
              <track
                kind="captions"
                src={artifact.captionsHref}
                srcLang={artifact.publication.captionLanguage}
                label={artifact.publication.captionLanguage}
                default
              />
            </video>
            <Link
              href={artifact.transcriptHref}
              className="mt-3 inline-flex min-h-11 items-center border border-border px-4 py-2 text-sm font-semibold hover:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.transcript}
            </Link>
          </section>
        ) : null}

        {software && number ? (
          <SoftwareDetail
            artifact={software}
            number={number}
            locale={locale}
          />
        ) : null}
      </section>
    </>
  );
}

function SoftwareDetail({
  artifact,
  number,
  locale,
}: {
  readonly artifact: ToolArtifact | ProjectArtifact;
  readonly number: string;
  readonly locale: Locale;
}) {
  const copy = OPEN_SOURCE_DETAIL_COPY[locale];
  const guideCopy = SOFTWARE_GUIDE_COPY[locale];
  const { guide } = artifact;
  const stills = [
    { ...guide.screenshot, caption: guide.screenshot.alt, alt: "" },
    ...(guide.demo ?? []),
  ];
  const films = guide.outputFilms ?? [];
  const formula = guide.formula;
  const heading = "text-xl font-bold tracking-[-0.03em] sm:text-2xl";

  // The one command sits beside the stage from lg on, under the chapters.
  const quickstart = guide.quickstart ? (
    <section aria-labelledby="quickstart" className="pt-4 lg:pt-0">
      <h2 id="quickstart" className={heading}>
        {copy.oneCommand}
      </h2>
      <div className="mt-4">
        <CommandBlock
          command={guide.quickstart.command}
          label={guideCopy.copyCommand(artifact.title)}
          locale={locale}
          quickstart
        />
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {guide.quickstart.note}
      </p>
    </section>
  ) : undefined;

  return (
    <>
      <div className="mt-8">
        <PlateStage
          artifact={artifact}
          number={number}
          locale={locale}
          layout="detail"
          foot={quickstart}
        />
      </div>

      <section className="mt-10 sm:mt-12" aria-labelledby="what-it-does">
        <h2 id="what-it-does" className={heading}>
          {copy.whatItDoes}
        </h2>
        {formula ? (
          <ol className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] border-t border-foreground md:grid-cols-3">
            {[formula.input, formula.process, formula.output].map(
              (text, index) => (
                <li
                  key={copy.formulaColumns[index]}
                  className="col-span-2 grid grid-cols-subgrid items-baseline gap-x-4 border-b border-[var(--color-hairline)] py-3 md:col-span-1 md:block md:border-b-0 md:border-r md:border-foreground md:px-4 md:py-4 md:first:pl-0 md:last:border-r-0"
                >
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {copy.formulaColumns[index]}
                  </p>
                  <p
                    className={`text-pretty leading-snug text-foreground md:mt-2 ${index === 0 ? "font-mono font-semibold" : index === 2 ? "font-semibold" : ""}`}
                  >
                    {text}
                  </p>
                </li>
              ),
            )}
          </ol>
        ) : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
          <Colophon artifact={artifact} locale={locale} />
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {guide.statusNote}
          </p>
        </div>
      </section>

      <section className="mt-10 sm:mt-12" aria-labelledby="real-output">
        <h2 id="real-output" className={heading}>
          {copy.realOutput(films.length + stills.length)}
        </h2>
        {films.map((film) => (
          <figure key={film.src} className="mt-6">
            <OutputFilm
              film={film}
              title={artifact.title}
              labels={{
                play: SPECIMEN_COPY[locale].play,
                pause: SPECIMEN_COPY[locale].pause,
              }}
            />
            <figcaption className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {film.alt}
            </figcaption>
          </figure>
        ))}
        {/* One still per row on a phone, so editor screens stay readable;
            pairs from 768 px. Stills are stored web-ready (each under
            250 KB, see ASSET_MANIFEST.json), so they skip the image
            optimizer: one file per still, nothing to encode or wait on. */}
        <ul className="mt-6 grid gap-y-6 md:grid-cols-2 md:gap-x-6 md:gap-y-8">
          {stills.map((still) => (
            <li key={still.src} className="min-w-0">
              <figure>
                <Image
                  src={still.src}
                  alt={still.alt}
                  width={still.width}
                  height={still.height}
                  unoptimized
                  className="h-auto w-full border border-foreground bg-card"
                />
                <figcaption className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {still.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 max-w-4xl sm:mt-12">
        <SoftwareArtifactGuide artifact={artifact} locale={locale} />
      </div>
    </>
  );
}
