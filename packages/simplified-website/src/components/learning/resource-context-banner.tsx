import { LEARNING_NODES, LEARNING_EDGES, PATHWAY_STAGE_DISPLAY } from "@/lib/learning-graph";
import type { LearningStage } from "@/lib/learning-graph";

const STAGE_NUMBERS: Record<LearningStage, number> = {
  pruefen: 1,
  grundlagen: 2,
  regeln: 3,
  anwenden: 4,
  dokumentieren: 5,
  vertiefen: 6,
};

interface ResourceContextBannerProps {
  nodeId: string;
}

export function ResourceContextBanner({ nodeId }: ResourceContextBannerProps) {
  const node = LEARNING_NODES.find((n) => n.id === nodeId);
  if (!node) return null;

  const stage = node.stage;
  const stageDisplay = PATHWAY_STAGE_DISPLAY[stage];
  const stageNumber = STAGE_NUMBERS[stage];

  // Find related course via edges
  const courseEdge = LEARNING_EDGES.find(
    (e) =>
      e.from === nodeId &&
      (e.type === "practice_for" || e.type === "governance_artifact_for" || e.type === "supports"),
  );
  const courseNode = courseEdge ? LEARNING_NODES.find((n) => n.id === courseEdge.to) : undefined;

  const resourceTypeLabel =
    node.type === "demo"
      ? "Praxisbeispiel"
      : node.type === "template"
        ? "Arbeitsvorlage"
        : node.type === "book"
          ? "Lernbuch"
          : "Ressource";

  const resourceArticleLabel =
    node.type === "demo"
      ? "Dieses Praxisbeispiel"
      : node.type === "template"
        ? "Diese Arbeitsvorlage"
        : node.type === "book"
          ? "Dieses Lernbuch"
          : "Diese Ressource";

  const courseText = courseNode ? `. Passend zum ${courseNode.title}` : "";

  return (
    <div
      className="border-l-2 border-brand-orange bg-card px-4 py-3 font-mono text-[12px] uppercase tracking-[0.08em] text-muted-foreground"
      role="note"
      aria-label={`Lernkontext: ${resourceTypeLabel} in Stufe ${stageNumber}`}
    >
      <span className="font-bold text-brand-orange">
        Stufe {stageNumber}: {stageDisplay.displayLabel}
      </span>
      {" · "}
      <span>
        {resourceArticleLabel} gehört zu dieser Stufe{courseText}.
      </span>
    </div>
  );
}
