import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { OpenSourceArtifact } from "@/lib/open-source/artifacts";

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

  return (
    <article
      className="border border-border bg-card/30 p-5"
      aria-labelledby={titleId}
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        {artifact.eyebrow}
      </p>
      <h3
        id={titleId}
        className="mt-3 text-xl font-bold tracking-[-0.02em] text-foreground"
      >
        {artifact.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {artifact.description}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
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
      </dl>
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
    </article>
  );
}
