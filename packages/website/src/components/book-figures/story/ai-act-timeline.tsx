"use client";

import { useState } from "react";
import { stepCount, stepProgress, type FigureSpecOf } from "@/lib/figures";
import { FigureShell } from "./figure-shell";
import { FigureSvg } from "./figure-svg";
import type { TimelineStepText } from "./fixtures.provisional";
import { StepChips, type Chip } from "./step-chips";
import { usePrefersReducedMotion, useTween } from "./use-motion";

interface AiActTimelineProps {
  readonly spec: FigureSpecOf<"timeline">;
  /** One text per step of the spec, same order. */
  readonly stepTexts: readonly TimelineStepText[];
  readonly provisional?: boolean;
  readonly csvHref?: string;
}

/** Learner-triggered change: 120 to 200 ms in the motion policy. */
const STEP_MS = 180;
const ALL = "all";

/**
 * C12, the AI Act timeline. The finished timeline is the default. The buttons
 * step through the stages: choosing a stage shows the timeline up to it and
 * its text. "Alles" returns to the finished state (progress 1).
 */
export function AiActTimeline({ spec, stepTexts, provisional, csvHref }: AiActTimelineProps) {
  const total = stepCount(spec);
  const [selected, setSelected] = useState<string>(ALL);
  const reduced = usePrefersReducedMotion();
  const index = selected === ALL ? -1 : Number(selected);
  const target = index < 0 ? 1 : stepProgress(spec, index);
  const progress = useTween(target, STEP_MS, !reduced);

  const chips: Chip[] = [
    { id: ALL, label: "Alles", ariaLabel: "Alle Stufen zeigen" },
    ...Array.from({ length: total }, (_, i) => ({
      id: String(i),
      label: stepTexts[i]?.label ?? spec.steps?.[i]?.label ?? `Stufe ${i + 1}`,
      ariaLabel: `Stufe ${i + 1} von ${total}: ${stepTexts[i]?.label ?? ""}`,
    })),
  ];

  const text = index >= 0 ? stepTexts[index]?.text : "Alle Stufen auf einen Blick. Wähle eine Stufe, um die Zeitleiste Schritt für Schritt aufzubauen.";

  return (
    <FigureShell spec={spec} provisional={provisional} csvHref={csvHref} className="bf-tl-figure">
      <div className="bf-tl" data-step={index}>
        <StepChips label="Stufen der KI-Verordnung" chips={chips} selected={selected} onSelect={setSelected} />
        <p className="bf-tl-text" role="status">
          {text}
        </p>
        <FigureSvg spec={spec} progress={progress} layout="pair" />
      </div>
    </FigureShell>
  );
}
