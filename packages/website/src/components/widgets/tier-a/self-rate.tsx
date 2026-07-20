"use client";

import { useEffect, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * SelfRate — rate yourself along several axes, each a row of anchor pills.
 * Ported from `ai-native/course-app.js:146` (SelfRate). German copy.
 *
 *  - Each axis is a radiogroup of anchor buttons (keyboard via native button).
 *  - The chosen levels persist locally (private, not gamified) via useDraftValue.
 *  - Once every axis has a pick, awards the checkpoint once.
 *  - No motion to gate; selection is a CSS color change only.
 */

export interface SelfRateAxis {
  readonly id: string;
  readonly label: string;
  /** Ordered anchor labels (lowest → highest). */
  readonly anchors: readonly string[];
}

export interface SelfRateWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  readonly axes: readonly SelfRateAxis[];
}

type Ratings = Readonly<Record<string, number>>;

export function SelfRateWidget({
  lessonId,
  cpId,
  title = "Selbsteinschätzung",
  scenario = "Wo stehst du gerade? Nur du siehst diese Einschätzung.",
  axes,
}: SelfRateWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [ratings, setRatings] = useDraftValue<Ratings>(
    `selfrate::${lessonId}::${cpId}`,
    {},
  );

  const allRated = axes.length > 0 && axes.every((ax) => ratings[ax.id] != null);

  useEffect(() => {
    if (allRated) complete();
  }, [allRated, complete]);

  const set = (axisId: string, level: number) =>
    setRatings({ ...ratings, [axisId]: level });

  return (
    <WidgetFrame
      kindLabel="Einschätzung"
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+10 XP"
    >
      <div className="flex flex-col gap-5">
        {axes.map((ax) => (
          <div key={ax.id}>
            <p className="mb-2 text-[14px] font-semibold text-foreground">
              {ax.label}
            </p>
            <div
              role="radiogroup"
              aria-label={ax.label}
              className="flex flex-wrap gap-2"
            >
              {ax.anchors.map((anchor, i) => {
                const active = ratings[ax.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set(ax.id, i)}
                    className={cn(
                      "border-2 px-3 py-1.5 text-[13px] transition-colors",
                      active
                        ? "border-brand-orange bg-brand-orange/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-brand-orange/60",
                    )}
                  >
                    {anchor}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
}

export default SelfRateWidget;
