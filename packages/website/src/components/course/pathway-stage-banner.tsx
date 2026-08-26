import type { Locale } from "@/lib/i18n/locale";
import { PATHWAY_STAGES, PATHWAY_STAGE_COPY } from "@/lib/learning-graph/data";
import type { LearningStage } from "@/lib/learning-graph/types";
import { cn } from "@/lib/utils";

/*
 * PathwayStageBanner — one hairline row naming the stage a surface belongs to
 * and the stage that follows it.
 *
 * The six-stage path in @/lib/learning-graph is what connects the courses,
 * demos, books and workshops; a surface that carries this row states where it
 * sits in that path instead of leaving the reader to infer it.
 */

interface BannerCopy {
  readonly regionLabel: string;
  readonly pathwayLabel: string;
  readonly position: (stage: number, total: number) => string;
  readonly nextLabel: string;
  readonly finalLabel: string;
}

const COPY: Readonly<Record<Locale, BannerCopy>> = {
  de: {
    regionLabel: "Dein Platz auf dem KI-Kompetenzweg",
    pathwayLabel: "KI-Kompetenzweg",
    position: (stage, total) => `Stufe ${stage} von ${total}`,
    nextLabel: "Weiter",
    finalLabel: "Letzte Stufe",
  },
  en: {
    regionLabel: "Position in the AI competency path",
    pathwayLabel: "AI competency path",
    position: (stage, total) => `Stage ${stage} of ${total}`,
    nextLabel: "Next",
    finalLabel: "Final stage",
  },
};

interface PathwayStageBannerProps {
  readonly stage: LearningStage;
  readonly locale: Locale;
  readonly className?: string;
}

export function PathwayStageBanner({
  stage,
  locale,
  className,
}: PathwayStageBannerProps) {
  const stageIndex = PATHWAY_STAGES.findIndex((entry) => entry.id === stage);
  if (stageIndex < 0) return null;

  const copy = COPY[locale];
  const stageCopy = PATHWAY_STAGE_COPY[locale];
  const current = stageCopy[stage];
  const nextStage =
    stageIndex + 1 < PATHWAY_STAGES.length
      ? PATHWAY_STAGES[stageIndex + 1]
      : null;

  return (
    <div
      role="note"
      aria-label={copy.regionLabel}
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-y border-border py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
          {copy.pathwayLabel} ·{" "}
          {copy.position(stageIndex + 1, PATHWAY_STAGES.length)}
        </p>
        <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            {current.displayLabel}
          </span>
          {" · "}
          {current.subtitle}
        </p>
      </div>
      <p className="font-mono text-[12px] leading-relaxed text-muted-foreground">
        {nextStage ? (
          <>
            {copy.nextLabel}:{" "}
            <span className="text-foreground">
              {stageCopy[nextStage.id].displayLabel}
            </span>
          </>
        ) : (
          copy.finalLabel
        )}
      </p>
    </div>
  );
}
