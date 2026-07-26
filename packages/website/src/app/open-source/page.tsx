import type { Metadata } from "next";
import Link from "next/link";
import { Github } from "lucide-react";
import { OpenSourceArtifactShelf } from "@/components/open-source/artifact-shelf";
import { DrawRule } from "@/components/motion/draw-rule";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { JsonLd, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";
import { absoluteUrl, GITHUB_ORG } from "@/lib/seo/entity";

export const metadata: Metadata = {
  title: "Open Source",
  description:
    "Das Werkverzeichnis von loehrning.ai auf github.com/loehrning-ai: Werkzeuge, Projekte und Videos mit geprüftem Quellstand, Lizenz und Anleitung.",
  alternates: { canonical: "/open-source" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Open Source | loehrning.ai",
    description:
      "Werkverzeichnis der GitHub-Organisation loehrning-ai: öffentliches Repository, Commit-Pin, Lizenz und Anleitung für jeden Eintrag.",
    url: `${SITE_URL}/open-source`,
    type: "website",
  },
};

const OPEN_SOURCE_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Open Source", item: `${SITE_URL}/open-source` },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "Open Source",
      url: `${SITE_URL}/open-source`,
      inLanguage: "de-DE",
      isPartOf: { "@id": WEBSITE_ID },
      hasPart: OPEN_SOURCE_ARTIFACTS.map((artifact) => ({
        "@type":
          artifact.kind === "tool"
            ? "SoftwareApplication"
            : artifact.kind === "project"
              ? "SoftwareSourceCode"
              : "VideoObject",
        name: artifact.title,
        url: absoluteUrl(artifact.href),
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
      })),
    },
  ],
};

/**
 * Status line for the Quellenprinzip panel, derived from the canonical
 * registry rather than hand-maintained copy (CONTENT_GUIDE.md: collection
 * counts come from their canonical registries). The singular branch is
 * grammatical, not decorative: German adjective endings must agree with the
 * noun, so "1 veröffentlichte Einträge" would be wrong.
 */
function publishedArtifactsStatus(count: number): string {
  if (count === 0) return "Noch kein Eintrag veröffentlicht";
  if (count === 1) return "1 veröffentlichter Eintrag";
  return `${count} veröffentlichte Einträge`;
}

export default function OpenSourcePage() {
  return (
    <>
      <JsonLd data={OPEN_SOURCE_GRAPH} id="open-source-jsonld" />
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <DrawRule className="h-[3px] w-28 bg-brand-orange" />
          <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            Open Source
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
                Das Werkverzeichnis. Offen auf GitHub.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Hier findest du jedes veröffentlichte Werk aus der
                GitHub-Organisation{" "}
                <a
                  href={GITHUB_ORG.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {GITHUB_ORG.slug}
                  <span className="sr-only">
                    , öffnet in neuem Tab
                  </span>
                </a>
                : Werkzeuge, Projekte und Videos, alle in einem Verzeichnis.
                Jeder Eintrag verweist auf den geprüften Quellstand, seine
                Lizenz und die zugehörige Anleitung.
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Die technischen Lernkurse findest du unter{" "}
                <Link
                  href="/kurse"
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
                Quellenprinzip
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Quellplattform
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
                        , öffnet in neuem Tab
                      </span>
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Stand
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {publishedArtifactsStatus(OPEN_SOURCE_ARTIFACTS.length)}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>

          <OpenSourceArtifactShelf />

          {OPEN_SOURCE_ARTIFACTS.length > 0 ? (
            <p className="mt-10 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
              Die Repositories, Anleitungen und Commits auf GitHub sind auf
              Englisch. Diese Seite bleibt deutsch.
            </p>
          ) : null}

          <section className="mt-14 border-t border-border pt-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              Veröffentlichungsstandard
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Ein Eintrag erscheint hier erst mit vier Nachweisen: einem
              öffentlichen GitHub-Repository, einem unveränderlichen Commit als
              geprüftem Quellstand, einer eindeutigen Lizenz mit lokal
              gespeicherter Kopie und einer Anleitung für Installation,
              Verwendung und Integration. Unvollständige Einträge werden nicht
              gelistet.
            </p>
          </section>

          <section id="lizenzmodell" className="mt-14 border-t border-border pt-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              Code und redaktionelle Inhalte
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Der Plattform-Code steht unter MIT. Sichtbarer Quelltext bedeutet
              nicht automatisch freie Wiederverwendung aller Lerntexte,
              Marken- oder Medieninhalte. Die verbindliche Zuordnung steht in
              der{" "}
              <Link
                href="/open-source/lizenzrichtlinie"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Lizenzrichtlinie
              </Link>{" "}
              und in den Lizenzangaben jedes veröffentlichten Eintrags.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
