// KI-Check — types for the client-side AI-literacy self-assessment.
//
// Adapted for individual learners on the KI-Kompetenzweg: five literacy
// dimensions, a short Likert scale per question, a deterministic per-dimension
// and composite score, and a stage ladder. No backend, no lead capture, no
// service tiers. Pure data shapes so scoring stays unit-testable.

/** The five AI-literacy dimensions the check measures. */
export type DimensionId =
  | "grundlagen"
  | "urteil"
  | "recht"
  | "verantwortung"
  | "praxis";

/** Warm CI accent that ties a dimension to its icon tile and bar colour. */
export type Accent = "kupfer" | "sand" | "amber";

/** Likert value carried by a single answer option (1 lowest, 4 highest). */
export type LikertScore = 1 | 2 | 3 | 4;

/** Stage on the five-rung composite ladder. */
export type StageLevel = 1 | 2 | 3 | 4 | 5;

export interface QuestionOption {
  readonly score: LikertScore;
  /** The learner-facing choice. */
  readonly text: string;
  /** Short reveal shown once the option is picked: what this answer says. */
  readonly meaning: string;
}

export interface Question {
  readonly id: string;
  readonly dimensionId: DimensionId;
  readonly text: string;
  readonly options: readonly QuestionOption[];
}

export interface DimensionMeta {
  readonly id: DimensionId;
  /** Full name for the result cards. */
  readonly name: string;
  /** Short axis label for the radar and the step indicator. */
  readonly short: string;
  /** One-line promise of what the dimension covers. */
  readonly description: string;
  readonly accent: Accent;
  /** lucide-react export name, resolved to a component in the UI layer. */
  readonly iconName: string;
}

export interface StageBand {
  readonly level: StageLevel;
  readonly label: string;
  /** Inclusive lower bound on the 0-100 composite. */
  readonly min: number;
  /** Exclusive upper bound (inclusive on the final band). */
  readonly max: number;
  readonly blurb: string;
}

export interface RatingBand {
  readonly min: number;
  readonly max: number;
  readonly label: string;
  /** CSS custom property used to tint the dimension bar and radar. */
  readonly toneVar: string;
}

/** A single recorded answer. */
export interface Answer {
  readonly questionId: string;
  readonly dimensionId: DimensionId;
  readonly score: number;
}

export interface DimensionResult {
  readonly id: DimensionId;
  readonly name: string;
  readonly short: string;
  readonly accent: Accent;
  readonly iconName: string;
  /** Sum of the Likert scores answered in this dimension. */
  readonly rawScore: number;
  /** Highest reachable raw score for this dimension. */
  readonly maxRaw: number;
  /** 0-100, one decimal. */
  readonly normalizedScore: number;
  readonly stageLevel: StageLevel;
  readonly ratingLabel: string;
  readonly ratingToneVar: string;
}

export interface KiCheckResult {
  readonly answeredCount: number;
  readonly totalQuestions: number;
  /** 0-100, one decimal — unweighted mean of the dimension scores. */
  readonly compositeScore: number;
  readonly stageLevel: StageLevel;
  readonly stageLabel: string;
  readonly stageBlurb: string;
  /** Dimensions in canonical order. */
  readonly dimensions: readonly DimensionResult[];
  /** Top two dimensions by score (strongest first). */
  readonly strengths: readonly DimensionResult[];
  /** Bottom two dimensions by score (weakest first). */
  readonly gaps: readonly DimensionResult[];
}
