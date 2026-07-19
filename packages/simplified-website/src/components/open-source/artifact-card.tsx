import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OpenSourceArtifact } from "@/lib/open-source/artifacts";
import { STATUS_LABELS } from "./status-labels";

/**
 * The hub renders one card per row inside `mx-auto max-w-6xl px-6`, so the
 * layout width is 1152 - 48 = 1104 CSS px above the container breakpoint.
 */
const CARD_MEDIA_SIZES = "(min-width: 1152px) 1104px, calc(100vw - 48px)";

interface ArtifactPrimaryAction {
  readonly href: string;
  readonly label: string;
  readonly external: boolean;
}

function getPrimaryAction(
  artifact: OpenSourceArtifact,
): ArtifactPrimaryAction {
  switch (artifact.kind) {
    case "tool":
      return artifact.launchHref
        ? {
            href: artifact.launchHref,
            label: "Öffnen",
            external: artifact.launchHref.startsWith("http"),
          }
        : { href: artifact.href, label: "Detail", external: false };
    case "project":
      return artifact.launchHref
        ? {
            href: artifact.launchHref,
            label: "Praxisbeispiel",
            external: artifact.launchHref.startsWith("http"),
          }
        : { href: artifact.href, label: "Detail", external: false };
    case "video":
      return {
        href: artifact.href,
        label: "Detail",
        external: false,
      };
  }
}

/**
 * Lead image of the card. Videos carry a poster without stored dimensions, so
 * they are framed at 16:9; software artifacts have exact screenshot dimensions
 * and render at their intrinsic aspect ratio.
 */
function ArtifactCardMedia({ artifact }: { artifact: OpenSourceArtifact }) {
  if (artifact.kind === "video") {
    return (
      <div className="relative aspect-video w-full border-b border-border bg-card">
        <Image
          src={artifact.posterSrc}
          alt={artifact.posterAlt}
          fill
          sizes={CARD_MEDIA_SIZES}
          className="object-cover"
        />
      </div>
    );
  }

  const { screenshot } = artifact.guide;

  return (
    <Image
      src={screenshot.src}
      alt={screenshot.alt}
      width={screenshot.width}
      height={screenshot.height}
      sizes={CARD_MEDIA_SIZES}
      className="h-auto w-full border-b border-border bg-card object-contain"
    />
  );
}

export function OpenSourceArtifactCard({
  artifact,
}: {
  artifact: OpenSourceArtifact;
}) {
  const primaryAction = getPrimaryAction(artifact);
  const idPrefix = `open-source-artifact-${artifact.kind}-${artifact.slug}`;
  const titleId = `${idPrefix}-title`;
  const primaryActionId = `${idPrefix}-primary-action`;
  const sourceActionId = `${idPrefix}-source-action`;
  const licenseActionId = `${idPrefix}-license-action`;
  const guide = artifact.kind === "video" ? null : artifact.guide;

  return (
    <article
      className="border border-border bg-card/30"
      aria-labelledby={titleId}
    >
      <ArtifactCardMedia artifact={artifact} />
      <div className="p-5 sm:p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          {artifact.eyebrow}
        </p>
        <h3
          id={titleId}
          className="mt-3 text-xl font-bold tracking-[-0.02em] text-foreground"
        >
          {artifact.title}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {artifact.description}
        </p>
        {guide?.dataFlow ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Datenfluss
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground">
              {guide.dataFlow}
            </p>
          </div>
        ) : null}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <dt className="font-mono uppercase tracking-[0.1em]">Sprache</dt>
            <dd className="mt-1 text-foreground">{artifact.language}</dd>
          </div>
          <div>
            <dt className="font-mono uppercase tracking-[0.1em]">Commit</dt>
            <dd className="mt-1 truncate font-mono text-foreground">
              {artifact.source.revision.slice(0, 10)}
            </dd>
          </div>
          <div>
            <dt className="font-mono uppercase tracking-[0.1em]">Lizenz</dt>
            <dd className="mt-1 truncate text-foreground">
              {artifact.license.licenseId ?? artifact.license.sourcePath}
            </dd>
          </div>
          {guide ? (
            <div>
              <dt className="font-mono uppercase tracking-[0.1em]">Status</dt>
              <dd className="mt-1 text-foreground">
                {STATUS_LABELS[guide.status]}
              </dd>
            </div>
          ) : null}
        </dl>
        {guide && guide.integration.targets.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {guide.integration.targets.map((target) => (
              <li key={target}>
                <Badge variant="neutral">{target}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {primaryAction.external ? (
            <a
              href={primaryAction.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-labelledby={`${primaryActionId} ${titleId}`}
              className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-brand-orange"
            >
              <span id={primaryActionId}>{primaryAction.label}</span>{" "}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : (
            <Link
              href={primaryAction.href}
              aria-labelledby={`${primaryActionId} ${titleId}`}
              className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-brand-orange"
            >
              <span id={primaryActionId}>{primaryAction.label}</span>{" "}
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
          <a
            href={artifact.source.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-labelledby={`${sourceActionId} ${titleId}`}
            className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-brand-orange"
          >
            <span id={sourceActionId}>Quelle</span>{" "}
            <ExternalLink size={12} aria-hidden="true" />
          </a>
          <Link
            href={artifact.license.href}
            aria-labelledby={`${licenseActionId} ${titleId}`}
            className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-brand-orange"
          >
            <span id={licenseActionId}>Lizenz</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
