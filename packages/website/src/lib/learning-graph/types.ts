import type { CourseSlug } from "@/lib/course/types";

export type LearningAccessClass =
  | "public"
  | "public-preview"
  | "gated-learning-app"
  | "private-api"
  | "static-public"
  | "static-gated";

export type LearningNodeType =
  | "course"
  | "lesson"
  | "book"
  | "demo"
  | "template"
  | "self_test"
  | "open_source_lab"
  | "conceptual_block";

export type LearningEdgeType =
  | "requires"
  | "recommended_before"
  | "supports"
  | "practice_for"
  | "assessment_for"
  | "governance_artifact_for"
  | "next_step";

export type LearnerPersona =
  | "mitarbeitende"
  | "verantwortliche"
  | "praktiker"
  | "technische-vertiefung";

export type LearningStage =
  | "pruefen"
  | "grundlagen"
  | "regeln"
  | "anwenden"
  | "dokumentieren"
  | "vertiefen";

export type EvidenceMode =
  | "source_backed"
  | "self_attested"
  | "synthetic"
  | "rule_based"
  | "live_api"
  | "recorded_trace"
  | "external";

export interface LearningNode {
  readonly id: string;
  readonly type: LearningNodeType;
  readonly title: string;
  readonly route: string;
  readonly access: LearningAccessClass;
  readonly language: "de" | "en";
  readonly audience: readonly LearnerPersona[];
  readonly level: "entry" | "intermediate" | "advanced" | "technical";
  readonly stage: LearningStage;
  readonly evidenceMode: EvidenceMode;
  readonly sourceOwner: string;
  readonly courseSlug?: CourseSlug;
  readonly parentId?: string;
  readonly summary?: string;
}

export interface LearningEdge {
  readonly from: string;
  readonly to: string;
  readonly type: LearningEdgeType;
}
