/**
 * Learning-graph facet for the machine surfaces.
 *
 * Courses and workshops already exist as nodes in src/lib/learning-graph. A
 * machine record repeats none of that: it carries the node id plus the four
 * classification values a consumer needs to place the record in the pathway
 * (stage, level, evidence mode, access), all read straight from the node.
 */

import { getLearningNode } from "@/lib/learning-graph";
import type {
  EvidenceMode,
  LearningAccessClass,
  LearningNode,
  LearningStage,
} from "@/lib/learning-graph";

export interface MachineGraphFacet {
  /** Node id in the learning graph, e.g. "course:ki-fuehrerschein". */
  readonly node_id: string;
  readonly stage: LearningStage;
  readonly level: LearningNode["level"];
  /** How the content backs its claims (source_backed, synthetic, ...). */
  readonly evidence_mode: EvidenceMode;
  readonly access: LearningAccessClass;
}

/** Facet for a graph node, or null when the id has no node. */
export function machineGraphFacet(nodeId: string): MachineGraphFacet | null {
  const node = getLearningNode(nodeId);
  if (!node) return null;

  return {
    node_id: node.id,
    stage: node.stage,
    level: node.level,
    evidence_mode: node.evidenceMode,
    access: node.access,
  };
}
