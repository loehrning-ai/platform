import type { ComponentType, JSX } from "react";
import type { LessonId } from "@/lib/codex/types";
import { L01ThreeBodyContract } from "./bespoke/l01-three-body-contract";
import { L02SandboxBox } from "./bespoke/l02-sandbox-box";
import { L03AgentsCrystal } from "./bespoke/l03-agents-crystal";
import { L04SpecSurgeon } from "./bespoke/l04-spec-surgeon";
import { L05ScopeSlider } from "./bespoke/l05-scope-slider";
import { L06DoneChecklist } from "./bespoke/l06-done-checklist";
import { L07PrXray } from "./bespoke/l07-pr-xray";
import { L08DecisionBranch } from "./bespoke/l08-decision-branch";
import { L09ToolbeltBuilder } from "./bespoke/l09-toolbelt-builder";
import { L10GitGraphOrchestrator } from "./bespoke/l10-git-graph-orchestrator";
import { L11PatternCardsLab } from "./bespoke/l11-pattern-cards-lab";
import { L12DailyLoop } from "./bespoke/l12-daily-loop";

/**
 * One-off bespoke interactives, keyed by lesson id — outside the shared
 * `WidgetKind` registry by design (plan 009 stage 5), each ported from its
 * own `codex/js/lessons/L0N.js` mount function and never reused elsewhere.
 */
interface BespokeComponentProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const BESPOKE_REGISTRY: Record<LessonId, ComponentType<BespokeComponentProps>> = {
  L01: L01ThreeBodyContract,
  L02: L02SandboxBox,
  L03: L03AgentsCrystal,
  L04: L04SpecSurgeon,
  L05: L05ScopeSlider,
  L06: L06DoneChecklist,
  L07: L07PrXray,
  L08: L08DecisionBranch,
  L09: L09ToolbeltBuilder,
  L10: L10GitGraphOrchestrator,
  L11: L11PatternCardsLab,
  L12: L12DailyLoop,
};

export function CodexBespokeInteractive({
  lessonId,
}: {
  readonly lessonId: LessonId;
}): JSX.Element {
  const Component = BESPOKE_REGISTRY[lessonId];
  return <Component lessonId={lessonId} cpId="bespoke" />;
}

export default CodexBespokeInteractive;
