/*
 * Interactive lesson primitives.
 *
 * A deep lesson becomes active at the moment the reader has to commit before
 * the text resolves anything. Both blocks below do exactly that and nothing
 * more: local state, no network, no progress store, no course data types, so
 * any course reader can use them.
 */

export { PredictionPrompt } from "./prediction-prompt";
export type {
  PredictionAnswer,
  PredictionOption,
  PredictionPromptProps,
} from "./prediction-prompt";

export { EvidenceReveal } from "./evidence-reveal";
export type { EvidenceItem, EvidenceRevealProps } from "./evidence-reveal";
