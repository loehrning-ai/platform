"use client";

import type { JSX, ReactNode } from "react";
import { m } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_EASE, APP_FOCUS } from "./app-ui";

export interface StepFlowStep {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly done: boolean;
  readonly icon: ReactNode;
}

/**
 * The three-beat lesson indicator: Verstehen → Ausprobieren → Prüfen.
 *
 * A track joins the three stops and fills as steps are done (finite tween;
 * MotionConfig resolves it at once under reduced motion). The step in view
 * carries aria-current="step"; done steps turn green with a check that
 * springs in. Every stop is a 44px in-page link.
 */
export function StepFlow({
  steps,
  activeKey,
  label,
  stateLabel,
}: {
  readonly steps: readonly StepFlowStep[];
  /** The step whose section is in view. */
  readonly activeKey: string;
  /** Accessible name of the navigation. */
  readonly label: string;
  readonly stateLabel: { readonly done: string; readonly open: string };
}): JSX.Element {
  // The track fills up to the first open step: one done step reaches the
  // middle stop, two reach the end.
  const leadingDone = steps.findIndex((step) => !step.done);
  const reached = leadingDone === -1 ? steps.length - 1 : leadingDone;
  const fill = steps.length > 1 ? Math.min(1, reached / (steps.length - 1)) : 0;
  return (
    <nav aria-label={label} data-step-flow className="w-full">
      <ol className="relative grid grid-cols-3">
        <span
          aria-hidden="true"
          className="absolute left-[16.67%] right-[16.67%] top-[21px] h-1.5 overflow-hidden rounded-full bg-lab-line"
        >
          <m.span
            className="block h-full origin-left rounded-full bg-gradient-to-r from-lab-accent to-lab-good"
            initial={false}
            animate={{ scaleX: fill }}
            transition={{ duration: 0.7, ease: APP_EASE }}
          />
        </span>
        {steps.map((step, index) => {
          const active = step.key === activeKey;
          return (
            <li key={step.key} className="relative flex justify-center">
              <a
                href={step.href}
                aria-current={active ? "step" : undefined}
                data-step={step.key}
                data-step-state={step.done ? "done" : "open"}
                className={cn(
                  "group flex min-h-11 min-w-11 flex-col items-center gap-1.5 rounded-2xl px-1 pb-1 text-center",
                  APP_FOCUS,
                )}
              >
                <m.span
                  aria-hidden="true"
                  initial={false}
                  animate={{ scale: active ? 1.08 : 1 }}
                  transition={{ duration: 0.3, ease: APP_EASE }}
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-[background-color,color,box-shadow] duration-300 motion-reduce:transition-none",
                    step.done
                      ? "bg-lab-good text-paper shadow-lab-sm"
                      : active
                        ? "bg-lab-accent text-paper shadow-lab-lg"
                        : "bg-card text-muted-foreground ring-2 ring-lab-line",
                  )}
                >
                  {step.done ? (
                    <m.span
                      key="done"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 20 }}
                      className="flex"
                    >
                      <Check className="h-5 w-5" strokeWidth={2.75} />
                    </m.span>
                  ) : (
                    <span className="flex">{step.icon}</span>
                  )}
                </m.span>
                <span
                  className={cn(
                    "text-[13px] font-semibold leading-tight sm:text-sm",
                    active || step.done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="sr-only">{index + 1}. </span>
                  {step.label}
                  <span className="sr-only">
                    {" "}
                    ({step.done ? stateLabel.done : stateLabel.open})
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
