/**
 * The contract between the chapter stage (the pinned shell with its steps) and
 * the figure inside it. Pure functions plus a tiny DOM event protocol, so the
 * shell, the field painter, the tests and the film renderer agree on one
 * meaning of "step" and "progress" without sharing React state.
 *
 *   step          index of the step whose card is at the reading line
 *   stepProgress  0 to 1 inside that step; reaches 1 when the card is centred
 *                 on the reading line and holds there until the next step
 *   progress      the whole stage, 0 to 1, continuous (step + stepProgress) / steps
 *   mode          "scrub": the scroll position drives the figure
 *                 "static": reduced motion, no script, paused or a short
 *                 screen; every figure shows its finished frame (progress 1)
 *
 * The shell writes the state onto the stage element (data-step, --cs-p) and
 * dispatches STAGE_EVENT with the state as detail. A figure island listens with
 * useChapterStage (React) or subscribeStage (a painter that draws without
 * React). Nothing outside the stage element changes while the reader scrubs.
 */

export const STAGE_EVENT = "chapterstage";

export type StageMode = "scrub" | "static";

export interface StageState {
  readonly mode: StageMode;
  readonly step: number;
  readonly steps: number;
  readonly stepProgress: number;
  readonly progress: number;
}

/** What every figure shows without a stage, under reduced motion, paused, printed or before script runs. */
export const FINISHED_STATE: StageState = { mode: "static", step: 0, steps: 1, stepProgress: 1, progress: 1 };

export function finishedState(steps: number): StageState {
  const count = Math.max(1, steps);
  return { mode: "static", step: count - 1, steps: count, stepProgress: 1, progress: 1 };
}

export interface StepBox {
  /** Top and height in the same coordinate space as the reading line (viewport pixels). */
  readonly top: number;
  readonly height: number;
}

/** Share of a step block over which the figure plays; the card is centred at 0.5 and the figure is finished there. */
export const STEP_PLAY = 0.5;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The state for a reading line over a column of step blocks. Before the first
 * block the stage sits at step 0 / 0; after the last it holds the last step
 * finished. Blocks may differ in height.
 */
export function computeScrubState(readingLine: number, boxes: readonly StepBox[]): StageState {
  const steps = boxes.length;
  if (steps === 0) return FINISHED_STATE;
  const first = boxes[0] as StepBox;
  if (readingLine < first.top) return { mode: "scrub", step: 0, steps, stepProgress: 0, progress: 0 };
  let index = steps - 1;
  for (let i = 0; i < steps; i += 1) {
    const box = boxes[i] as StepBox;
    if (readingLine < box.top + box.height) {
      index = i;
      break;
    }
  }
  const box = boxes[index] as StepBox;
  const inside = box.height > 0 ? clamp01((readingLine - box.top) / box.height) : 1;
  const stepProgress = readingLine >= box.top + box.height ? 1 : clamp01(inside / STEP_PLAY);
  const progress = (index + stepProgress) / steps;
  return { mode: "scrub", step: index, steps, stepProgress, progress: clamp01(progress) };
}

/**
 * The first step has no entry to play: the stage is already on screen when the chapter opens, and an empty
 * field under a finished numeral reads as broken. So step 0 always shows its finished frame; the figure
 * moves from step to step as the reader scrolls.
 */
export function holdFirstStep(state: StageState): StageState {
  if (state.mode !== "scrub" || state.step !== 0 || state.steps < 1) return state;
  return { ...state, stepProgress: 1, progress: 1 / state.steps };
}

/** Scroll distance that centres step `index` on the reading line, so its figure is finished and its card readable. */
export function scrollDeltaForStep(index: number, readingLine: number, boxes: readonly StepBox[]): number {
  const box = boxes[Math.max(0, Math.min(boxes.length - 1, index))];
  if (!box) return 0;
  return box.top + box.height * STEP_PLAY - readingLine;
}

export function sameState(a: StageState, b: StageState): boolean {
  return (
    a.mode === b.mode &&
    a.step === b.step &&
    a.steps === b.steps &&
    Math.abs(a.stepProgress - b.stepProgress) < 0.002 &&
    Math.abs(a.progress - b.progress) < 0.002
  );
}

/* ----------------------------------------------------------- DOM protocol */

const states = new WeakMap<Element, StageState>();

/** The last published state, or the stable finished step already declared by server markup. */
export function getStageState(root: Element | null): StageState {
  if (!root) return FINISHED_STATE;
  const published = states.get(root);
  if (published) return published;
  const count = Number(root.getAttribute("data-steps"));
  const step = Number(root.getAttribute("data-step"));
  const initial = Number.isSafeInteger(count) && count >= 1 && count <= MAX_STEPS && step === count - 1
    ? finishedState(count) : FINISHED_STATE;
  states.set(root, initial);
  return initial;
}

/** The shell calls this on every change; figures never do. */
export function publishStageState(root: Element, state: StageState): void {
  states.set(root, state);
  root.dispatchEvent(new CustomEvent<StageState>(STAGE_EVENT, { detail: state }));
}

/** Listens for state changes of a stage; returns the unsubscribe. The listener is also called once with the current state. */
export function subscribeStage(root: Element, listener: (state: StageState) => void): () => void {
  const handler = (event: Event): void => listener((event as CustomEvent<StageState>).detail);
  root.addEventListener(STAGE_EVENT, handler);
  listener(getStageState(root));
  return () => root.removeEventListener(STAGE_EVENT, handler);
}

/** The stage element that holds a node, or null when the node is not inside a stage. */
export function closestStage(node: Element | null): HTMLElement | null {
  return node ? node.closest<HTMLElement>("[data-chapter-stage]") : null;
}

/* ------------------------------------------------------------- step copy */

export interface StageStepCopy {
  readonly id: string;
  /** Short label for the step buttons' accessible names. */
  readonly label: string;
  /** The card sentence. */
  readonly text: string;
  /** The giant numeral of the step, tokens already resolved. */
  readonly numeral?: string;
  /** The stage claim of the step: at most 12 words. */
  readonly claim?: string;
  /** The unit line under the field: "1 Quadrat = 21 Startseiten". */
  readonly unit?: string;
  /** Detent (variant) id the figure holds in this step, for figures with a control with real detents; none keeps the reader's choice. */
  readonly variant?: string;
}

export const MAX_CLAIM_WORDS = 12;
export const MAX_CARD_WORDS = 30;
export const MAX_STEPS = 6;
export const MIN_STEPS = 1;

const words = (text: string): number => (text.trim() === "" ? 0 : text.trim().split(/\s+/).length);

/** Editorial limits of the stage (DIRECTION section 2 and 3), checked at build time. Returns the problems, empty when fine. */
export function stageCopyProblems(steps: readonly StageStepCopy[]): string[] {
  const problems: string[] = [];
  if (steps.length < MIN_STEPS || steps.length > MAX_STEPS) {
    problems.push(`a stage has ${MIN_STEPS} to ${MAX_STEPS} steps (3 to 4 in the book), found ${steps.length}`);
  }
  const ids = new Set<string>();
  steps.forEach((step, i) => {
    const where = `step ${i + 1} (${step.id})`;
    if (ids.has(step.id)) problems.push(`${where}: duplicate id`);
    ids.add(step.id);
    if (step.text.trim() === "") problems.push(`${where}: the card needs one sentence`);
    if (words(step.text) > MAX_CARD_WORDS) problems.push(`${where}: the card has ${words(step.text)} words, the limit is ${MAX_CARD_WORDS}`);
    if (step.claim && words(step.claim) > MAX_CLAIM_WORDS) problems.push(`${where}: the claim has ${words(step.claim)} words, the limit is ${MAX_CLAIM_WORDS}`);
    if (/[\u2013\u2014]/.test(`${step.text} ${step.claim ?? ""} ${step.numeral ?? ""} ${step.unit ?? ""}`)) {
      problems.push(`${where}: no em or en dashes`);
    }
  });
  return problems;
}
