import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SoftwareArtifactGuide } from "@/components/open-source/software-artifact-guide";
import {
  OPEN_SOURCE_PROJECT_ARTIFACTS,
  OPEN_SOURCE_TOOL_ARTIFACTS,
  OPEN_SOURCE_VIDEO_ARTIFACTS,
  getOpenSourceArtifactByRoute,
} from "@/lib/open-source/artifacts";
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
  const artifact = getOpenSourceArtifactByRoute(kind, slug);
  if (!artifact) return {};

  return {
    title: artifact.title,
    description: artifact.description,
    alternates: { canonical: artifact.href },
    robots: { index: true, follow: true },
    openGraph: {
      title: artifact.title,
      description: artifact.description,
      url: absoluteUrl(artifact.href),
      siteName: "loehrning.ai",
      locale: "de_DE",
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
  const artifact = getOpenSourceArtifactByRoute(kind, slug);
  if (!artifact) notFound();

  const launchHref =
    artifact.kind === "video" ? artifact.watchHref : artifact.launchHref;
  const artifactUrl = absoluteUrl(artifact.href);
  const jsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Open Source",
            item: `${SITE_URL}/open-source`,
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
          href="/open-source"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Open Source
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
          <section className="mt-10" aria-label={`Video: ${artifact.title}`}>
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
              Transkript lesen
            </Link>
          </section>
        ) : null}

        {artifact.kind === "tool" || artifact.kind === "project" ? (
          <SoftwareArtifactGuide artifact={artifact} />
        ) : null}

        <dl className="mt-10 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Sprache</dt>
            <dd className="mt-2 font-semibold">{artifact.language}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Commit</dt>
            <dd className="mt-2 font-mono text-sm">{artifact.source.revision.slice(0, 12)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Lizenz</dt>
            <dd className="mt-2">
              <Link href={artifact.license.href} className="font-semibold underline-offset-4 hover:underline">
                Lizenztext
              </Link>
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
                Öffnen
                <span className="sr-only">, öffnet in neuem Tab</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : (
              <Link href={launchHref} className="border border-foreground px-4 py-2 text-sm font-semibold">
                Öffnen
              </Link>
            )
          ) : null}
          <a
            href={artifact.source.revisionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold hover:border-brand-orange"
          >
            Quellstand
            <span className="sr-only">, öffnet in neuem Tab</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}
