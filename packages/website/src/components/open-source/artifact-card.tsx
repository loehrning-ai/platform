import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Github } from "@/components/icons/brand";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { OpenSourceArtifact } from "@/lib/open-source/artifacts";
import {
  localizeOpenSourceArtifact,
  OPEN_SOURCE_SHARED_COPY,
} from "@/lib/open-source/display-copy";

/**
 * Cards sit in the shelf grid (1 col, 2 at `sm`, 3 at `xl`) inside the page's
 * `max-w-6xl px-6` container, so a card is ~355 CSS px wide at the 1152px cap
 * and never the old full 1104px row.
 */
const CARD_MEDIA_SIZES =
  "(min-width: 1280px) 355px, (min-width: 640px) 48vw, calc(100vw - 48px)";

interface ArtifactPrimaryAction {
  readonly href: string;
  readonly label: string;
  readonly external: boolean;
}

function getLaunchAction(
  artifact: OpenSourceArtifact,
  locale: Locale,
): ArtifactPrimaryAction | null {
  const copy = OPEN_SOURCE_SHARED_COPY[locale];
  switch (artifact.kind) {
    case "tool":
      return artifact.launchHref
        ? {
            href: artifact.launchHref,
            label: copy.open,
            external: artifact.launchHref.startsWith("http"),
          }
        : null;
    case "project":
      return artifact.launchHref
        ? {
            href: artifact.launchHref,
            label: copy.practiceExample,
            external: artifact.launchHref.startsWith("http"),
          }
        : null;
    case "video":
      return null;
  }
}

/**
 * `owner/repo` from the validated source URL. The registry validator only
 * admits clean `github.com/loehrning-ai/...` repository, `/tree/<rev>/...`,
 * or `/commit/<rev>` URLs, so the first two path segments are always the
 * owner and the repository.
 */
function repoPath(sourceHref: string): string {
  return new URL(sourceHref).pathname.split("/").filter(Boolean).slice(0, 2).join("/");
}

/**
 * Preview plate: one uniform 8:5 frame for every kind, so shelf rows stay
 * ruled. Software artifacts use the pinned guide screenshot (the CV Engine
 * capture is exactly 8:5, so it renders crop-free); videos use their poster.
 * A future non-8:5 screenshot gets edge-cropped here only; the detail page
 * always shows it whole.
 */
function ArtifactCardMedia({
  artifact,
  featured,
  locale,
}: {
  artifact: OpenSourceArtifact;
  featured?: boolean;
  locale: Locale;
}) {
  const media =
    artifact.kind === "video"
      ? { src: artifact.posterSrc, alt: artifact.posterAlt }
      : { src: artifact.guide.screenshot.src, alt: artifact.guide.screenshot.alt };

  return (
    <div
      className={
        featured
          ? "relative aspect-[8/5] w-full overflow-hidden border-b border-border bg-card md:aspect-auto md:min-h-[360px] md:border-b-0 md:border-r"
          : "relative aspect-[8/5] w-full overflow-hidden border-b border-border bg-card"
      }
    >
      {/* The preview is a second route to the detail page. It is deliberately
          removed from the accessibility tree and the tab order: the footer's
          "Detail {Titel}" link already leads here, so an equal image link
          would only add a duplicate tab stop and a duplicate announcement. */}
      <Link
        href={localizeHref(artifact.href, locale)}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-10"
      />
      <Image
        src={media.src}
        alt={media.alt}
        fill
        sizes={CARD_MEDIA_SIZES}
        className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
      <span className="absolute left-3 top-3 z-20 border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-foreground">
        {OPEN_SOURCE_SHARED_COPY[locale].kinds[artifact.kind]}
      </span>
    </div>
  );
}

export function OpenSourceArtifactCard({
  artifact,
  position,
  featured = false,
  locale = "de",
}: {
  artifact: OpenSourceArtifact;
  /** 1-based shelf position, rendered as a catalog number ("01"). */
  position?: number;
  /** One published entry becomes a full-width case study instead of a sparse grid card. */
  featured?: boolean;
  locale?: Locale;
}) {
  const displayArtifact = localizeOpenSourceArtifact(artifact, locale);
  const copy = OPEN_SOURCE_SHARED_COPY[locale];
  const launchAction = getLaunchAction(displayArtifact, locale);
  const idPrefix = `open-source-artifact-${displayArtifact.kind}-${displayArtifact.slug}`;
  const titleId = `${idPrefix}-title`;
  const detailActionId = `${idPrefix}-detail-action`;
  const launchActionId = `${idPrefix}-launch-action`;
  const sourceActionId = `${idPrefix}-source-action`;
  const licenseActionId = `${idPrefix}-license-action`;
  const newTabDisclosureId = `${idPrefix}-new-tab-disclosure`;
  const guide =
    displayArtifact.kind === "video" ? null : displayArtifact.guide;

  return (
    <article
      className={
        featured
          ? "card-hover group relative grid h-full min-w-0 overflow-hidden border border-border bg-card/30 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
          : "card-hover group relative flex h-full min-w-0 flex-col overflow-hidden border border-border bg-card/30"
      }
      aria-labelledby={titleId}
    >
      <ArtifactCardMedia artifact={displayArtifact} featured={featured} locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3
            id={titleId}
            className="text-lg font-bold tracking-[-0.02em] text-foreground"
          >
            {displayArtifact.title}
          </h3>
          {position ? (
            // Catalog number of the Werkverzeichnis. Positional per deploy:
            // never reference "Eintrag 03" in prose anywhere.
            <span
              aria-hidden="true"
              className="font-mono text-[11px] font-bold text-muted-foreground"
            >
              {String(position).padStart(2, "0")}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {displayArtifact.description}
        </p>
        {/* The separator dots are ::before pseudo-content, never DOM
            children: a <dl> may only directly contain dt/dd groups (or divs
            wrapping them), and pseudo-elements are invisible to the
            accessibility tree by nature. */}
        <dl className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground [&>div]:flex [&>div]:items-baseline [&>div+div]:before:mr-2 [&>div+div]:before:content-['·']">
          <div>
            <dt className="sr-only">{copy.license}</dt>
            <dd>{displayArtifact.license.licenseId ?? displayArtifact.license.sourcePath}</dd>
          </div>
          <div>
            <dt className="sr-only">{copy.commit}</dt>
            <dd>{displayArtifact.source.revision.slice(0, 10)}</dd>
          </div>
          {guide ? (
            <div>
            <dt className="sr-only">{copy.status}</dt>
              <dd>{copy.statuses[guide.status]}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <span id={newTabDisclosureId} className="sr-only">
              {copy.newTab}
            </span>
            <Link
              href={localizeHref(displayArtifact.href, locale)}
              aria-labelledby={`${detailActionId} ${titleId}`}
              className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_var(--color-foreground)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-foreground)]"
            >
              <span id={detailActionId}>{copy.detail}</span>{" "}
              <ArrowRight size={12} aria-hidden="true" className="arrow-nudge" />
            </Link>
            {launchAction?.external ? (
              <a
                href={launchAction.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-labelledby={`${launchActionId} ${titleId}`}
                aria-describedby={newTabDisclosureId}
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-xs font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                <span id={launchActionId}>{launchAction.label}</span>{" "}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : launchAction ? (
              <Link
                href={localizeHref(launchAction.href, locale)}
                aria-labelledby={`${launchActionId} ${titleId}`}
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-xs font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
              >
                <span id={launchActionId}>{launchAction.label}</span>{" "}
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            ) : null}
            <a
              href={displayArtifact.license.href}
              aria-labelledby={`${licenseActionId} ${titleId}`}
              className="inline-flex min-h-11 items-center gap-1 px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span id={licenseActionId}>{copy.license}</span>
            </a>
            {/* The signature line: GitHub named by repo path, framed for
                weight. Accessible name stays the composed
                "Quelle {owner/repo} {Titel}" pattern; the visible path is
                contained in the name (WCAG 2.5.3). */}
            <a
              href={displayArtifact.source.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-labelledby={`${sourceActionId} ${titleId}`}
              aria-describedby={newTabDisclosureId}
              className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange sm:ml-auto"
            >
              <Github size={13} aria-hidden="true" />
              <span id={sourceActionId} className="flex min-w-0 items-center">
                <span className="sr-only">{copy.source}</span>{" "}
                <span className="truncate">{repoPath(displayArtifact.source.href)}</span>
              </span>
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
