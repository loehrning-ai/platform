"use client";

import { useState, type MouseEvent } from "react";
import { formatValue, type FigureSpecOf, type NumFmt } from "@/lib/figures";
import { FigureShell } from "./figure-shell";
import { FigureSvg } from "./figure-svg";
import type { SurveyDetail } from "./fixtures.provisional";
import { StepChips, type Chip } from "./step-chips";
import { useRevealOnView } from "./use-motion";

interface SurveyLadderProps {
  readonly spec: FigureSpecOf<"ladder">;
  /** One entry per rung (same ids), plus "ours" and an "overview" shown first. */
  readonly details: readonly SurveyDetail[];
  readonly provisional?: boolean;
  readonly csvHref?: string;
}

/**
 * C1, the survey ladder. Four published shares on one axis, each with its
 * wording; our own web measure sits on a separate axis labelled "anderes Maß".
 * The dots slide in once when the figure first scrolls into view. Click, tap
 * or the buttons below choose a source and show its wording, base and limits.
 */
export function SurveyLadder({ spec, details, provisional, csvHref }: SurveyLadderProps) {
  const { ref, progress } = useRevealOnView<HTMLDivElement>(450);
  const [selected, setSelected] = useState("overview");
  const ours = spec.data.ours;
  /** Chips print a published value exactly: 54,5 stays 54,5 even when the axis rounds to whole percent. */
  const exact = (fmt: NumFmt, value: number): string =>
    formatValue(Number.isInteger(value) ? fmt : { ...fmt, digits: Math.max(fmt.digits ?? 0, 1) }, value);

  const chips: Chip[] = [
    ...spec.data.rungs.map((rung) => ({
      id: rung.id,
      label: (
        <>
          <span className="bf-chip-name">{rung.label}</span> <span className="bf-chip-value">{exact(spec.data.fmt, rung.value)}</span>
        </>
      ),
      ariaLabel: `${rung.label}, ${exact(spec.data.fmt, rung.value)}: Wortlaut und Basis zeigen`,
    })),
    ...(ours
      ? [
          {
            id: ours.id,
            label: (
              <>
                <span className="bf-chip-name">Unser Maß</span> <span className="bf-chip-value">{formatValue(ours.fmt ?? spec.data.fmt, ours.value)}</span>
              </>
            ),
            ariaLabel: `Unser Maß, ${formatValue(ours.fmt ?? spec.data.fmt, ours.value)}, anderes Maß: Wortlaut und Basis zeigen`,
          },
        ]
      : []),
  ];

  const pick = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as Element).closest("[data-id]");
    const id = target?.getAttribute("data-id");
    if (id && details.some((detail) => detail.id === id)) setSelected(id);
  };

  return (
    <FigureShell spec={spec} provisional={provisional} csvHref={csvHref} className="bf-ladder-figure">
      <div ref={ref} className="bf-ladder" data-selected={selected}>
        {/* Mouse convenience only: the buttons below are the keyboard and screen reader path. */}
        <div className="bf-ladder-svg" onClick={pick}>
          <FigureSvg spec={spec} progress={progress} highlight={selected !== "overview" ? selected : undefined} layout="pair" />
        </div>
        <StepChips label="Quelle wählen" chips={chips} selected={selected === "overview" ? null : selected} onSelect={(id) => setSelected((current) => (current === id ? "overview" : id))} />
        <p className="bf-visually-hidden" role="status">
          {details.find((detail) => detail.id === selected)?.title}: Wortlaut und Basis stehen unter den Schaltflächen.
        </p>
        <div className="bf-details">
          {details.map((detail) => (
            <section key={detail.id} className="bf-detail" data-open={detail.id === selected ? "true" : undefined}>
              <p className="bf-detail-title">{detail.title}</p>
              <dl className="bf-dl">
                <div>
                  <dt>Frage</dt>
                  <dd>{detail.wording}</dd>
                </div>
                <div>
                  <dt>Basis</dt>
                  <dd>{detail.base}</dd>
                </div>
                <div>
                  <dt>Stichprobe</dt>
                  <dd>{detail.sample}</dd>
                </div>
                <div>
                  <dt>Grenzen</dt>
                  <dd>{detail.limits}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      </div>
    </FigureShell>
  );
}
