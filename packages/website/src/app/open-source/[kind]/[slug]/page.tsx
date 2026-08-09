import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SoftwareArtifactGuide } from "@/components/open-source/software-artifact-guide";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  getOpenSourceArtifactByRoute,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_DETAIL_COPY,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function OpenSourceArtifactDetailPage({ params }: PageProps) {
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
          { "@type": "ListItem", position: 1, name: copy.breadcrumbHome, item: homeUrl },
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

  return (
    <>
      <JsonLd data={jsonLd} id={`open-source-${artifact.kind}-${artifact.slug}-jsonld`} />
      <section className="mx-auto max-w-4xl px-6 py-20" aria-labelledby="artifact-title">
        <Link
          href={localizeHref("/open-source", locale)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {copy.back}
        </Link>
        <p className="mt-10 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
          {artifact.eyebrow}
        </p>
        <h1 id="artifact-title" className="mt-4 text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-6xl">
          {artifact.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {artifact.description}
        </p>

        {artifact.kind === "video" ? (
          <section className="mt-10" aria-label={`${copy.videoLabel}: ${artifact.title}`}>
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
              className="mt-4 inline-flex border border-border px-4 py-2 text-sm font-semibold hover:border-brand-orange"
            >
              {copy.transcript}
            </Link>
          </section>
        ) : null}

        <dl className="mt-10 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{copy.language}</dt>
            <dd className="mt-2 font-semibold">{artifact.language}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{copy.commit}</dt>
            <dd className="mt-2 font-mono text-sm">{artifact.source.revision.slice(0, 12)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{copy.license}</dt>
            <dd className="mt-2">
              <a href={artifact.license.href} className="font-semibold underline-offset-4 hover:underline">
                {copy.licenseText}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {launchHref ? (
            launchHref.startsWith("https://") ? (
              <a
                href={launchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-sm font-semibold"
              >
                {copy.open}
                <span className="sr-only">{copy.externalTab}</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : (
              <Link href={localizeHref(launchHref, locale)} className="border border-foreground px-4 py-2 text-sm font-semibold">
                {copy.open}
              </Link>
            )
          ) : null}
          <a
            href={artifact.source.revisionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold hover:border-brand-orange"
          >
            {copy.sourceRevision}
            <span className="sr-only">{copy.externalTab}</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>

        {artifact.kind === "tool" || artifact.kind === "project" ? (
          <SoftwareArtifactGuide artifact={artifact} locale={locale} />
        ) : null}
      </section>
    </>
  );
}
