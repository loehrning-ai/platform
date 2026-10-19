"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { Chip } from "@/components/werk/chip";
import { cx } from "@/components/werk/cx";
import type {
  WorkshopKitSegment,
  WorkshopKitStep,
  WorkshopKitTone,
} from "@/lib/workshop-kit";

/** The words of the stepper, resolved by the server component for the page locale. */
export interface KitStepperLabels {
  readonly stepperLabel: string;
  readonly inLabel: string;
  readonly claudeLabel: string;
  readonly outLabel: string;
  readonly resultLabel: string;
  readonly fileLabel: string;
  readonly restart: string;
  /** "Weiter: <title>", already resolved per step, same order as `steps`. */
  readonly next: readonly string[];
}

interface Props {
  readonly steps: readonly WorkshopKitStep[];
  readonly labels: KitStepperLabels;
  readonly idPrefix: string;
}

/**
 * The look of a status. The word always sits next to it, so the look only
 * repeats the meaning: solid ink, a Mennige outline, solid Mennige or the
 * hatch of the deck's "partly" cells.
 */
const TONE_CLASS: Readonly<Record<WorkshopKitTone, string>> = {
  ok: "bg-foreground border-foreground",
  check: "border-mennige bg-transparent",
  missing: "bg-mennige border-mennige",
  partial: "kit-hatch border-mennige",
  ink: "bg-foreground border-foreground",
  accent: "bg-mennige border-mennige",
};

function Swatch({ tone, className }: { readonly tone: WorkshopKitTone; readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block shrink-0 border-2", TONE_CLASS[tone], className)}
    />
  );
}

/** Whole numbers up to 12 are drawn as that many cells, so "8 questions" shows eight blocks. */
function cellCount(segment: WorkshopKitSegment): number {
  return Number.isInteger(segment.value) && segment.value <= 12 ? segment.value : 1;
}

function Strip({ segments }: { readonly segments: readonly WorkshopKitSegment[] }) {
  let index = 0;
  return (
    <div aria-hidden="true" className="flex gap-1.5">
      {segments.map((segment) => {
        const cells = cellCount(segment);
        return (
          <div
            key={segment.label}
            className="flex min-w-0 gap-1"
            style={{ flexGrow: segment.value, flexBasis: 0 }}
          >
            {Array.from({ length: cells }, () => {
              index += 1;
              return (
                <span
                  key={index}
                  className={cx("kit-grow h-10 min-w-0 flex-1 border-2 sm:h-12", TONE_CLASS[segment.tone])}
                  style={{ ["--i" as string]: index }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Legend({ segments }: { readonly segments: readonly WorkshopKitSegment[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
      {segments.map((segment, i) => (
        <li
          key={segment.label}
          className="kit-rise flex items-center gap-2 text-label text-foreground"
          style={{ ["--i" as string]: i + 3 }}
        >
          <Swatch tone={segment.tone} className="size-3.5" />
          <span className="font-mono text-[0.9375rem] font-bold tabular-nums">
            {segment.display ?? segment.value}
          </span>
          <span className="font-mono text-[0.875rem] uppercase tracking-[0.05em] text-muted-foreground">
            {segment.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FlowCard({
  label,
  children,
  emphasis = false,
  index,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly emphasis?: boolean;
  readonly index: number;
}) {
  return (
    <div
      className={cx(
        "kit-rise kit-lift min-w-0 bg-card p-4 sm:p-5",
        emphasis
          ? "border-2 border-foreground border-t-4 border-t-mennige"
          : "border border-hairline",
      )}
      style={{ ["--i" as string]: index }}
    >
      <p
        className={cx(
          "font-mono text-[0.875rem] font-semibold uppercase tracking-[0.06em]",
          emphasis ? "text-kupfer-dark" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="mt-2 text-[1rem] leading-snug text-foreground text-pretty">{children}</div>
    </div>
  );
}

function Connector({ index }: { readonly index: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center text-foreground max-md:h-6"
      style={{ ["--i" as string]: index }}
    >
      {/* Each arrow draws itself after the card before it (kit-motion.css). */}
      <ArrowGlyph direction="down" className="kit-draw size-5 md:hidden" />
      <ArrowGlyph direction="right" className="kit-draw hidden size-5 md:block" />
    </span>
  );
}

/**
 * The one client island of the kit page: a tab list of the kit's prompts and
 * the panel of the selected one. Everything it shows is the workshop's own
 * kit data; the motion is CSS (keyframes in globals.css, off under
 * prefers-reduced-motion), re-run by remounting the panel on a new selection.
 */
export function KitStepper({ steps, labels, idPrefix }: Props) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = steps[selected];
  const last = selected === steps.length - 1;

  function select(next: number, focus = false) {
    setSelected(next);
    if (focus) tabs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = steps.length - 1;
    const target =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % steps.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + steps.length) % steps.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;
    if (target === null) return;
    event.preventDefault();
    select(target, true);
  }

  return (
    <div data-kit-stepper="">
      <div
        role="tablist"
        aria-label={labels.stepperLabel}
        className="grid gap-1.5 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((item, index) => {
          const active = index === selected;
          return (
            <button
              key={item.tag}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${index}`}
              aria-selected={active}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              data-kit-tab=""
              className={cx(
                "flex min-h-14 flex-col items-center justify-center gap-1 border-2 px-1 py-2 text-center transition-colors duration-[120ms] motion-reduce:transition-none sm:min-h-[4.5rem] sm:items-start sm:px-4 sm:text-left",
                active
                  ? "border-foreground bg-card shadow-[inset_0_4px_0_0_var(--color-mennige)] pt-3"
                  : "border-hairline bg-transparent hover:border-mennige active:border-mennige",
              )}
            >
              <span
                className={cx(
                  "font-mono text-[1.25rem] font-bold leading-none tabular-nums sm:text-[1.5rem]",
                  active ? "text-kupfer-dark" : "text-foreground",
                )}
              >
                {index + 1}
              </span>
              {/* A phone shows the step's name under its number, two lines at
                  most, so no tab is a bare digit. */}
              <span
                className={cx(
                  "line-clamp-2 w-full break-words text-[0.8125rem] font-semibold leading-tight text-foreground [hyphens:auto] sm:block sm:text-label",
                  // Four or more tabs are too narrow for a name on a phone;
                  // the panel's own heading names the step there.
                  steps.length > 3 && "max-sm:hidden",
                )}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={selected}
        role="tabpanel"
        id={`${idPrefix}-panel`}
        aria-labelledby={`${idPrefix}-tab-${selected}`}
        tabIndex={0}
        data-kit-panel={selected + 1}
        className="mt-4 border-t-2 border-foreground pt-5 focus-visible:outline-offset-4 sm:mt-6 sm:pt-6"
      >
        <div className="kit-rise flex flex-wrap items-baseline gap-x-4 gap-y-1" style={{ ["--i" as string]: 0 }}>
          <p className="font-mono text-[0.875rem] font-semibold uppercase tracking-[0.06em] text-kupfer-dark">
            {step.tag}
          </p>
        </div>
        <h3 className="kit-rise mt-1 text-fluid-h3 font-bold text-foreground" style={{ ["--i" as string]: 0 }}>
          {step.title}
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch md:gap-3">
          <FlowCard label={labels.inLabel} index={1}>
            {step.input}
          </FlowCard>
          <Connector index={2} />
          <FlowCard label={labels.claudeLabel} emphasis index={2}>
            {step.action}
          </FlowCard>
          <Connector index={3} />
          <FlowCard label={labels.outLabel} index={3}>
            {step.output}
            {step.file ? (
              <span className="mt-3 flex items-center gap-2">
                <span className="sr-only">{labels.fileLabel}:</span>
                <Chip className="h-auto min-h-7 max-w-full break-all py-1 font-mono text-[0.875rem]">
                  {step.file}
                </Chip>
              </span>
            ) : null}
          </FlowCard>
        </div>

        {step.segments || step.line || step.note ? (
          <div className="mt-5 border border-hairline bg-card p-4 sm:mt-6 sm:p-6" data-kit-result="">
            <p className="font-mono text-[0.875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {labels.resultLabel}
            </p>
            {step.segments ? (
              <div className="mt-3">
                <Strip segments={step.segments} />
                <Legend segments={step.segments} />
              </div>
            ) : null}
            {step.line ? (
              <p
                className="kit-rise mt-4 text-foreground"
                style={{ ["--i" as string]: step.segments ? 5 : 3 }}
              >
                <span className="block break-words font-mono text-[0.9375rem] tabular-nums sm:text-[1.0625rem]">
                  {step.line.text}
                </span>
                <span className="mt-1 block font-mono text-[1.75rem] font-bold leading-tight text-kupfer-dark tabular-nums sm:text-[2.25rem]">
                  {step.line.result}
                </span>
              </p>
            ) : null}
            {step.note ? (
              <p
                className="kit-rise mt-4 max-w-[64ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty"
                style={{ ["--i" as string]: 6 }}
              >
                {step.note}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            onClick={() => select(last ? 0 : selected + 1, false)}
            className="group inline-flex min-h-11 items-center gap-2 border border-foreground px-5 text-[0.9375rem] font-semibold text-foreground transition-transform duration-[120ms] motion-reduce:transition-none anti-btn [--anti:var(--color-mennige)] max-sm:w-full max-sm:justify-between"
          >
            <span>{last ? labels.restart : labels.next[selected]}</span>
            <ArrowGlyph direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
}
