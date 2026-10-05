"use client";

import { useState, type JSX } from "react";
import { m } from "framer-motion";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LAB_SPRING,
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export interface WizardOption {
  readonly label: string;
  /** Next question id. Exactly one of `next` / `result` is set. */
  readonly next?: string;
  /** Result id that ends the walk. */
  readonly result?: string;
}

export interface WizardNode {
  readonly id: string;
  readonly question: string;
  readonly help?: string;
  readonly options: readonly WizardOption[];
}

export interface WizardResult {
  readonly id: string;
  readonly title: string;
  readonly tone: "good" | "warn" | "bad" | "neutral";
  readonly body: string;
  /** Concrete next steps. */
  readonly actions?: readonly string[];
  /** Legal or primary source reference shown under the result. */
  readonly source?: string;
}

export interface WizardScenario {
  readonly id: string;
  readonly text: string;
  /** Result id the walk should end in. */
  readonly expected: string;
  /** Why that result is right (shown after the walk). */
  readonly why?: string;
}

export interface DecisionWizardProps extends LabBaseProps {
  readonly start: string;
  readonly nodes: readonly WizardNode[];
  readonly results: readonly WizardResult[];
  /** Practice cases. When present the exercise is done after all of them. */
  readonly scenarios?: readonly WizardScenario[];
}

interface Step {
  readonly nodeId: string;
  readonly optionIndex: number;
}

const COPY = {
  de: {
    region: "Entscheidungshilfe",
    caseLabel: (index: number, total: number) => `Fall ${index} von ${total}`,
    question: (index: number) => `Frage ${index}`,
    back: "Zurück",
    restart: "Neu starten",
    yourPath: "Dein Weg",
    nextCase: "Nächster Fall",
    expectedRight: "Passt zum Fall.",
    expectedWrong: (title: string) => `Für diesen Fall wäre richtig: ${title}.`,
    summary: (right: number, total: number) => `${right} von ${total} Fällen richtig entschieden`,
    again: "Fälle nochmal durchgehen",
    nextSteps: "Nächste Schritte",
    source: "Grundlage",
  },
  en: {
    region: "Decision aid",
    caseLabel: (index: number, total: number) => `Case ${index} of ${total}`,
    question: (index: number) => `Question ${index}`,
    back: "Back",
    restart: "Start over",
    yourPath: "Your path",
    nextCase: "Next case",
    expectedRight: "Fits the case.",
    expectedWrong: (title: string) => `For this case the right outcome is: ${title}.`,
    summary: (right: number, total: number) => `${right} of ${total} cases decided correctly`,
    again: "Go through the cases again",
    nextSteps: "Next steps",
    source: "Basis",
  },
} as const;

/** Resolve a path of option picks to the current node or result (exported for tests). */
export function walkWizard(
  start: string,
  nodes: readonly WizardNode[],
  steps: readonly Step[],
): { readonly nodeId: string | null; readonly resultId: string | null } {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let nodeId: string | null = start;
  for (const step of steps) {
    const node: WizardNode | undefined = nodeId ? byId.get(nodeId) : undefined;
    const option: WizardOption | undefined = node?.options[step.optionIndex];
    if (!option) return { nodeId: null, resultId: null };
    if (option.result) return { nodeId: null, resultId: option.result };
    nodeId = option.next ?? null;
  }
  return { nodeId, resultId: null };
}

export function DecisionWizardWidget({
  start,
  nodes,
  results,
  scenarios = [],
  lessonId,
  cpId,
  locale,
  title,
}: DecisionWizardProps): JSX.Element {
  const copy = COPY[labLocale(locale)];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [steps, setSteps] = useState<readonly Step[]>([]);
  const [caseIndex, setCaseIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<Readonly<Record<string, string>>>({});

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const resultById = new Map(results.map((result) => [result.id, result]));
  const { nodeId, resultId } = walkWizard(start, nodes, steps);
  const node = nodeId ? nodeById.get(nodeId) : undefined;
  const result = resultId ? resultById.get(resultId) : undefined;
  const scenario = scenarios[caseIndex];
  const allCasesDone = scenarios.length > 0 && scenarios.every((entry) => outcomes[entry.id]);

  const choose = (optionIndex: number) => {
    if (!nodeId) return;
    const nextSteps = [...steps, { nodeId, optionIndex }];
    setSteps(nextSteps);
    const walk = walkWizard(start, nodes, nextSteps);
    if (walk.resultId) {
      if (scenario) {
        const nextOutcomes = { ...outcomes, [scenario.id]: walk.resultId };
        setOutcomes(nextOutcomes);
        if (scenarios.every((entry) => nextOutcomes[entry.id])) complete();
      } else {
        complete();
      }
    }
  };

  const back = () => setSteps((previous) => previous.slice(0, -1));
  const restart = () => setSteps([]);
  const nextCase = () => {
    setSteps([]);
    setCaseIndex((index) => Math.min(index + 1, scenarios.length - 1));
  };
  const resetCases = () => {
    setSteps([]);
    setCaseIndex(0);
    setOutcomes({});
  };

  const rightCount = scenarios.filter((entry) => outcomes[entry.id] === entry.expected).length;
  const scenarioOutcome = scenario ? outcomes[scenario.id] : undefined;

  return (
    <LabSurface label={copy.region} title={title}>
      {scenario ? (
        <div className="lab-wash-peach mb-4 rounded-2xl border border-lab-line bg-card p-4">
          <p className="text-label text-muted-foreground">{copy.caseLabel(caseIndex + 1, scenarios.length)}</p>
          <p className="mt-1 text-[17px] font-semibold leading-snug text-foreground">{scenario.text}</p>
        </div>
      ) : null}

      {steps.length > 0 ? (
        <ol aria-label={copy.yourPath} className="mb-3 flex flex-wrap gap-1.5">
          {steps.map((step, index) => {
            const stepNode = nodeById.get(step.nodeId);
            return (
              <li key={`${step.nodeId}-${index}`}>
                <button
                  type="button"
                  onClick={() => setSteps((previous) => previous.slice(0, index))}
                  className="min-h-11 rounded-full border border-lab-line bg-paper px-3 text-left text-xs text-muted-foreground hover:border-lab-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                >
                  <span className="font-semibold text-foreground">{index + 1}.</span>{" "}
                  {stepNode?.options[step.optionIndex]?.label}
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}

      <LabLive>
        <>
          {node ? (
            <m.div
              key={`${node.id}-${steps.length}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-lab-line bg-card p-4 shadow-lab-sm sm:p-5"
            >
              <p className="text-label text-muted-foreground">{copy.question(steps.length + 1)}</p>
              <h4 className="mt-1 text-lg font-bold leading-snug text-foreground">{node.question}</h4>
              {node.help ? <p className="mt-1 text-sm text-muted-foreground">{node.help}</p> : null}
              <div className="mt-4 grid gap-2">
                {node.options.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => choose(index)}
                    className="min-h-11 rounded-2xl border border-lab-line bg-paper px-4 py-3 text-left text-[15px] leading-snug text-foreground transition-[background-color,border-color] duration-150 hover:border-lab-accent/60 hover:bg-lab-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {steps.length > 0 ? (
                <div className="mt-3">
                  <LabButton tone="ghost" onClick={back}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {copy.back}
                  </LabButton>
                </div>
              ) : null}
            </m.div>
          ) : result ? (
            <m.div
              key={`result-${result.id}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={LAB_SPRING}
              data-result-id={result.id}
              className={cn(
                "rounded-2xl border p-4 shadow-lab sm:p-5",
                result.tone === "good" && "border-lab-good/30 bg-lab-good-soft",
                result.tone === "warn" && "border-lab-warn/30 bg-lab-warn-soft",
                result.tone === "bad" && "border-lab-bad/30 bg-lab-bad-soft",
                result.tone === "neutral" && "border-lab-line bg-inset/60",
              )}
            >
              <h4 className="text-xl font-bold tracking-[-0.01em] text-foreground">{result.title}</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground">{result.body}</p>
              {result.actions?.length ? (
                <div className="mt-3">
                  <p className="text-label text-muted-foreground">{copy.nextSteps}</p>
                  <ul className="mt-1 space-y-1 text-[15px] text-foreground">
                    {result.actions.map((action) => (
                      <li key={action} className="flex gap-2">
                        <span aria-hidden="true">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.source ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {copy.source}: {result.source}
                </p>
              ) : null}
              {scenario && scenarioOutcome ? (
                <div className="mt-4 rounded-xl bg-card px-3 py-2 text-sm">
                  <p className={cn("flex items-center gap-2 font-semibold", scenarioOutcome === scenario.expected ? "text-lab-good" : "text-lab-bad")}>
                    {scenarioOutcome === scenario.expected ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <X className="h-4 w-4" aria-hidden="true" />
                    )}
                    {scenarioOutcome === scenario.expected
                      ? copy.expectedRight
                      : copy.expectedWrong(resultById.get(scenario.expected)?.title ?? scenario.expected)}
                  </p>
                  {scenario.why ? <p className="mt-1 text-foreground">{scenario.why}</p> : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {scenario && caseIndex < scenarios.length - 1 ? (
                  <LabButton onClick={nextCase}>{copy.nextCase}</LabButton>
                ) : null}
                <LabButton tone="secondary" onClick={restart}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {copy.restart}
                </LabButton>
              </div>
            </m.div>
          ) : null}
        </>
      </LabLive>

      {allCasesDone ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <LabVerdictPill tone={rightCount === scenarios.length ? "good" : "warn"}>
            {copy.summary(rightCount, scenarios.length)}
          </LabVerdictPill>
          <LabButton tone="ghost" onClick={resetCases}>
            {copy.again}
          </LabButton>
        </div>
      ) : null}
    </LabSurface>
  );
}
