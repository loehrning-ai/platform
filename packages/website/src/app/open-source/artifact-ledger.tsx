import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  OPEN_SOURCE_ARTIFACTS,
  type OpenSourceArtifact,
} from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_SHARED_COPY,
} from "@/lib/open-source/display-copy";

const LEDGER_COPY = {
  de: {
    provenance: "Quellstand und Lizenz",
    repository: "Gepinnter Quellstand",
  },
  en: {
    provenance: "Source revision and license",
    repository: "Pinned source revision",
  },
} as const;

function launchAction(
  artifact: OpenSourceArtifact,
  locale: Locale,
): {
  readonly href: string;
  readonly label: string;
  readonly external: boolean;
} | null {
  const copy = OPEN_SOURCE_SHARED_COPY[locale];
  if (artifact.kind === "video") return null;
  if (!artifact.launchHref) return null;
  return {
    href: artifact.launchHref,
    label: artifact.kind === "tool" ? copy.open : copy.practiceExample,
    external: artifact.launchHref.startsWith("https://"),
  };
}

export function ArtifactLedger({ locale }: { readonly locale: Locale }) {
  if (OPEN_SOURCE_ARTIFACTS.length === 0) return null;
  const copy = OPEN_SOURCE_SHARED_COPY[locale];
  const ledgerCopy = LEDGER_COPY[locale];

  return (
    <section
      aria-labelledby="open-source-ledger-heading"
      className="mt-12 border-t border-border pt-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="open-source-ledger-heading"
          className="text-2xl font-bold tracking-[-0.03em] text-foreground"
        >
          {copy.published}
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {copy.entries(OPEN_SOURCE_ARTIFACTS.length)}
        </p>
      </div>

      <ol className="mt-4 divide-y divide-border border-y border-border">
        {OPEN_SOURCE_ARTIFACTS.map((registryArtifact, index) => {
          const artifact = localizeOpenSourceArtifact(registryArtifact, locale);
          const launch = launchAction(artifact, locale);
          const status =
            artifact.kind === "video"
              ? null
              : copy.statuses[artifact.guide.status];

          return (
            <li
              key={artifact.id}
              className="grid min-w-0 gap-4 py-4 lg:grid-cols-[5rem_minmax(0,1fr)_auto] lg:items-start"
            >
              <div className="flex items-baseline justify-between gap-3 lg:block">
                <span className="font-mono text-xs font-bold text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground lg:mt-2 lg:block">
                  {copy.kinds[artifact.kind]}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="break-words text-xl font-bold tracking-[-0.025em] text-foreground">
                  {artifact.title}
                </h3>
                <p className="mt-2 max-w-3xl break-words text-sm leading-relaxed text-muted-foreground">
                  {artifact.description}
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <div>
                    <dt className="sr-only">{copy.license}</dt>
                    <dd className="font-mono">
                      {artifact.license.licenseId ??
                        artifact.license.sourcePath}
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">{copy.commit}</dt>
                    <dd className="font-mono">
                      {artifact.source.revision.slice(0, 12)}
                    </dd>
                  </div>
                  {status ? (
                    <div>
                      <dt className="sr-only">{copy.status}</dt>
                      <dd>{status}</dd>
                    </div>
                  ) : null}
                </dl>

                <details className="mt-3 border border-border bg-card">
                  <summary
                    aria-label={`${ledgerCopy.provenance}: ${artifact.title}`}
                    className="flex min-h-11 cursor-pointer items-center px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                  >
                    {ledgerCopy.provenance}
                  </summary>
                  <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
                    <a
                      href={artifact.source.revisionHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${ledgerCopy.repository}: ${artifact.title}. ${copy.newTab}`}
                      className="inline-flex min-h-11 min-w-0 items-center gap-2 bg-background px-3 py-2 text-sm font-semibold text-foreground hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                    >
                      <span className="min-w-0 break-words">
                        {ledgerCopy.repository}
                      </span>
                      <span className="sr-only">{copy.newTab}</span>
                      <ExternalLink
                        size={13}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                    <a
                      href={artifact.license.href}
                      aria-label={`${copy.license}: ${artifact.title}`}
                      className="inline-flex min-h-11 items-center bg-background px-3 py-2 text-sm font-semibold text-foreground hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                    >
                      {copy.license}
                    </a>
                    {launch ? (
                      launch.external ? (
                        <a
                          href={launch.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${launch.label}: ${artifact.title}. ${copy.newTab}`}
                          className="inline-flex min-h-11 items-center gap-2 bg-background px-3 py-2 text-sm font-semibold text-foreground hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                        >
                          {launch.label}
                          <span className="sr-only">{copy.newTab}</span>
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      ) : (
                        <Link
                          href={localizeHref(launch.href, locale)}
                          aria-label={`${launch.label}: ${artifact.title}`}
                          className="inline-flex min-h-11 items-center bg-background px-3 py-2 text-sm font-semibold text-foreground hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                        >
                          {launch.label}
                        </Link>
                      )
                    ) : null}
                  </div>
                </details>
              </div>

              <Link
                href={localizeHref(artifact.href, locale)}
                className="inline-flex min-h-11 items-center justify-center border border-brand-orange bg-brand-orange px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white hover:border-foreground hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {copy.detail}
                <span className="sr-only">: {artifact.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
