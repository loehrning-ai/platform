import { OpenSourceArtifactCard } from "./artifact-card";
import { ShelfReveal } from "./shelf-reveal";
import {
  OPEN_SOURCE_ARTIFACTS,
  type OpenSourceArtifact,
} from "@/lib/open-source/artifacts";
import type { Locale } from "@/lib/i18n/locale";
import { OPEN_SOURCE_SHARED_COPY } from "@/lib/open-source/display-copy";

/**
 * The Werkverzeichnis shelf: every published artifact in ONE ruled grid,
 * ordered tool → project → video by the registry. The old per-kind lanes
 * ("Werkzeuge" / "Projekte" / "Videos" h2 sections) are gone; the kind lives
 * as a stamp on each card, and a kind with no entries simply never appears.
 * With zero entries the shelf renders nothing at all: no placeholder copy,
 * no empty-state promise.
 */
export function OpenSourceArtifactShelf({
  artifacts = OPEN_SOURCE_ARTIFACTS,
  locale = "de",
}: {
  artifacts?: readonly OpenSourceArtifact[];
  locale?: Locale;
}) {
  if (artifacts.length === 0) return null;
  const copy = OPEN_SOURCE_SHARED_COPY[locale];

  return (
    <section
      aria-labelledby="open-source-shelf-heading"
      className="mt-14 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2
          id="open-source-shelf-heading"
          className="text-2xl font-bold tracking-[-0.03em] text-foreground"
        >
          {copy.published}
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {copy.entries(artifacts.length)}
        </p>
      </div>
      <div
        className={
          artifacts.length === 1
            ? "mt-6 grid gap-5"
            : "mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {artifacts.map((artifact, index) => (
          <ShelfReveal key={artifact.id} index={index} className="h-full">
            <OpenSourceArtifactCard
              artifact={artifact}
              position={index + 1}
              featured={artifacts.length === 1}
              locale={locale}
            />
          </ShelfReveal>
        ))}
      </div>
    </section>
  );
}
