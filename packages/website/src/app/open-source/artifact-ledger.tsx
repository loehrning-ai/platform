import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import {
  ArtifactPreviewStack,
  type ArtifactPreviewFrame,
} from "@/components/open-source/artifact-preview-stack";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  OPEN_SOURCE_ARTIFACTS,
  type OpenSourceArtifact,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_PAGE_COPY,
  OPEN_SOURCE_SHARED_COPY,
} from "@/lib/open-source/display-copy";

const FACT_BACKGROUNDS = [
  "var(--color-brand-acid, #dfff69)",
  "var(--color-brand-sky, #bfe3ff)",
  "var(--color-brand-pink, #ffbfd6)",
  "var(--color-brand-peach, #ffc19e)",
] as const;

function softwarePreviewFrames(
  artifact: OpenSourceArtifact,
  labels: readonly string[],
): readonly ArtifactPreviewFrame[] {
  if (artifact.kind === "video") return [];

  const lead = artifact.guide.screenshot;
  return [
    {
      src: lead.src,
      width: lead.width,
      height: lead.height,
      label: labels[0] ?? "1",
      caption: lead.alt,
    },
    ...(artifact.guide.demo ?? []).map((image, index) => ({
      src: image.src,
      width: image.width,
      height: image.height,
      label: labels[index + 1] ?? String(index + 2),
      caption: image.caption,
    })),
  ];
}

function artifactStatus(artifact: OpenSourceArtifact, locale: Locale): string {
  if (artifact.kind === "video")
    return OPEN_SOURCE_SHARED_COPY[locale].published;
  return OPEN_SOURCE_SHARED_COPY[locale].statuses[artifact.guide.status];
}

function artifactDelivery(
  artifact: OpenSourceArtifact,
  locale: Locale,
): string {
  if (artifact.kind === "video")
    return OPEN_SOURCE_SHARED_COPY[locale].kinds.video;
  return OPEN_SOURCE_PAGE_COPY[locale].showcase.delivery[artifact.delivery];
}

export function ArtifactLedger({ locale }: { readonly locale: Locale }) {
  if (OPEN_SOURCE_ARTIFACTS.length === 0) return null;
  const pageCopy = OPEN_SOURCE_PAGE_COPY[locale];
  const sharedCopy = OPEN_SOURCE_SHARED_COPY[locale];
  const copy = pageCopy.showcase;

  return (
    <section aria-labelledby="open-source-showcase-heading" className="mt-6">
      <div
        className="flex flex-wrap items-baseline justify-between gap-3 border border-foreground px-4 py-3 sm:px-5"
        style={{ background: "var(--color-brand-acid, #dfff69)" }}
      >
        <h2
          id="open-source-showcase-heading"
          className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl"
        >
          {copy.heading}
        </h2>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {copy.entryCount(OPEN_SOURCE_ARTIFACTS.length)}
        </p>
      </div>

      <ol>
        {OPEN_SOURCE_ARTIFACTS.map((registryArtifact, index) => {
          const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
          const titleId = `open-source-artifact-${artifact.slug}`;
          const frames = softwarePreviewFrames(artifact, copy.previewLabels);
          const license =
            artifact.license.licenseId ?? artifact.license.sourcePath;

          return (
            <li key={artifact.id} className="py-6">
              <div className="relative isolate">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 z-0 translate-x-2 translate-y-2 border border-foreground"
                  style={{
                    background: "var(--color-brand-pink, #ffbfd6)",
                  }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 z-0 translate-x-4 translate-y-4 border border-foreground"
                  style={{
                    background: "var(--color-brand-acid, #dfff69)",
                  }}
                />
                <article
                  aria-labelledby={titleId}
                  className="relative z-10 overflow-hidden border border-foreground bg-background"
                  data-open-source-artifact-sheet
                >
                  <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
                    <div
                      className="order-2 flex min-w-0 flex-col border-t border-foreground p-4 sm:p-6 lg:border-l lg:border-t-0"
                      style={{ background: "var(--color-paper, #f8f3e8)" }}
                    >
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.11em] text-brand-orange">
                        <span className="mr-3 tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {sharedCopy.kinds[artifact.kind]}
                      </p>
                      <h3
                        id={titleId}
                        className="mt-3 text-balance text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-4xl"
                        translate="no"
                      >
                        {artifact.title}
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={localizeHref(artifact.href, locale)}
                          aria-label={`${copy.detail}: ${artifact.title}`}
                          className="inline-flex min-h-11 items-center gap-2 border border-brand-orange bg-brand-orange px-4 py-2 text-sm font-bold text-white outline-none transition-[background-color,border-color] duration-150 hover:border-foreground hover:bg-foreground focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transition-none"
                        >
                          {copy.detail}
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                        <a
                          href={artifact.source.revisionHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${copy.source}: ${artifact.title}. ${sharedCopy.newTab}`}
                          className="inline-flex min-h-11 items-center gap-2 border border-foreground px-4 py-2 text-sm font-bold text-foreground outline-none transition-[background-color,border-color,color] duration-150 hover:border-brand-orange hover:bg-background hover:text-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transition-none"
                        >
                          {copy.source}
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      </div>

                      <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {artifact.description}
                      </p>

                      <dl
                        className="mt-5 grid grid-cols-2 border-l border-t border-foreground text-sm sm:grid-cols-4"
                        data-open-source-fact-rail
                      >
                        {[
                          [copy.facts.kind, sharedCopy.kinds[artifact.kind]],
                          [
                            copy.facts.delivery,
                            artifactDelivery(artifact, locale),
                          ],
                          [copy.facts.license, license],
                          [copy.facts.status, artifactStatus(artifact, locale)],
                        ].map(([label, value], factIndex) => (
                          <div
                            key={label}
                            className="min-w-0 border-b border-r border-foreground p-3"
                            style={{
                              background: FACT_BACKGROUNDS[factIndex],
                            }}
                          >
                            <dt className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                              {label}
                            </dt>
                            <dd className="mt-1 break-words font-semibold text-foreground">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <details
                        className="mt-4 border border-foreground bg-background"
                        data-open-source-evidence
                      >
                        <summary
                          aria-label={`${copy.evidenceSummary}: ${artifact.title}`}
                          className="flex min-h-11 cursor-pointer items-center px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground outline-none hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                        >
                          {copy.evidenceSummary}
                        </summary>
                        <div className="space-y-3 border-t border-border p-3 text-sm leading-relaxed text-muted-foreground">
                          <p>{copy.publicationStandard}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            <a
                              href={artifact.source.revisionHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:decoration-brand-orange"
                            >
                              {copy.pinnedSource}{" "}
                              <code translate="no">
                                {artifact.source.revision.slice(0, 12)}
                              </code>
                              <span className="sr-only">
                                {sharedCopy.newTab}
                              </span>
                            </a>
                            <a
                              href={artifact.license.href}
                              className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:decoration-brand-orange"
                            >
                              {sharedCopy.license}: {license}
                            </a>
                            <Link
                              href={localizeHref(
                                "/open-source/lizenzrichtlinie",
                                locale,
                              )}
                              className="font-semibold text-foreground underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange focus-visible:decoration-brand-orange"
                            >
                              {copy.licensePolicy}
                            </Link>
                          </div>
                        </div>
                      </details>
                    </div>

                    <div
                      className="order-1 min-w-0 p-3 sm:p-5"
                      style={{
                        background: "var(--color-brand-peach, #ffc19e)",
                      }}
                      data-open-source-preview-sheet
                    >
                      <div className="overflow-hidden border border-foreground bg-background shadow-[7px_7px_0_var(--color-brand-acid,#dfff69)]">
                        {artifact.kind === "video" ? (
                          <div className="relative aspect-video min-h-[18rem]">
                            <Image
                              src={artifact.posterSrc}
                              alt={artifact.posterAlt}
                              fill
                              sizes="(min-width: 1024px) 640px, calc(100vw - 48px)"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <ArtifactPreviewStack
                            frames={frames}
                            groupLabel={`${copy.previewGroup}: ${artifact.title}`}
                            counterLabels={frames.map((_, frameIndex) =>
                              copy.previewCounter(
                                frameIndex + 1,
                                frames.length,
                              ),
                            )}
                            selectLabels={frames.map((frame) =>
                              copy.previewSelect(frame.label),
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
