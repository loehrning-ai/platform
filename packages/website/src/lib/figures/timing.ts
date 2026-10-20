/**
 * Progress to element timing. Every figure is a pure function of progress
 * (0 to 1); these helpers turn that one number into per-element reveal values
 * and into the active step of a stepped figure.
 */

import { clamp, easeOutCubic } from "./math.ts";
import type { FigureBase } from "./types.ts";

type StepSource = Pick<FigureBase, "steps">;

/** Linear 0 to 1 while progress runs from start to end. */
export function segment(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp((progress - start) / (end - start));
}

export interface Window {
  readonly start: number;
  readonly end: number;
}

/** Window length for n evenly staggered items. */
function evenLength(count: number): number {
  return clamp(1.5 / Math.max(1, count), 0.25, 0.6);
}

/**
 * When element `id` (the index-th of `count`) animates in. Elements named by a
 * step appear inside that step; the others are spread evenly over 0 to 1.
 */
export function revealWindow(
  spec: StepSource,
  id: string,
  index: number,
  count: number,
): Window {
  const steps = spec.steps ?? [];
  const stepIndex = steps.findIndex((s) => s.reveal?.includes(id));
  if (stepIndex >= 0) {
    const step = steps[stepIndex];
    const list = step?.reveal ?? [];
    const within = Math.max(0, list.indexOf(id));
    const width = 1 / steps.length;
    const start = stepIndex * width + (list.length > 1 ? (within / list.length) * width * 0.5 : 0);
    return { start, end: (stepIndex + 1) * width };
  }
  const length = evenLength(count);
  const start = count > 1 ? (index / (count - 1)) * (1 - length) : 0;
  return { start, end: start + length };
}

/** Eased 0 to 1 reveal of one element. */
export function reveal(
  spec: StepSource,
  progress: number,
  id: string,
  index: number,
  count: number,
): number {
  const w = revealWindow(spec, id, index, count);
  return easeOutCubic(segment(progress, w.start, w.end));
}

/** Axes, grids and frames: a short fade at the very start. */
export function frameReveal(progress: number): number {
  return segment(progress, 0, 0.1);
}

export function stepCount(spec: StepSource): number {
  return spec.steps?.length ?? 0;
}

/** Progress at which step `index` (0-based) is fully shown. */
export function stepProgress(spec: StepSource, index: number): number {
  const count = stepCount(spec);
  if (count === 0) return 1;
  return clamp((index + 1) / count);
}

/** Active step at a progress, or -1 for figures without steps. */
export function activeStep(spec: StepSource, progress: number): number {
  const count = stepCount(spec);
  if (count === 0) return -1;
  return Math.min(count - 1, Math.max(0, Math.floor(clamp(progress) * count - 1e-9)));
}

/**
 * Ids to emphasise at this progress, or null when nothing is emphasised. At
 * progress 1 (print, reduced motion, no JS) nothing is ever dimmed.
 */
export function focusIds(spec: StepSource, progress: number): ReadonlySet<string> | null {
  if (progress >= 1) return null;
  const index = activeStep(spec, progress);
  const focus = index >= 0 ? spec.steps?.[index]?.focus : undefined;
  return focus && focus.length > 0 ? new Set(focus) : null;
}
