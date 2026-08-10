"use client";

import { useEffect, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import {
  handleRovingFocusKeyDown,
  rovingTabIndex,
} from "@/lib/a11y/roving-focus";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";
import type { Locale } from "@/lib/i18n/locale";

/**
 * SelfRate — rate yourself along several axes, each a row of anchor pills.
 * Ported from `ai-native/course-app.js:146` (SelfRate). German copy.
 *
 *  - Each axis is a radiogroup with one Tab stop and Arrow/Home/End navigation.
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
  readonly locale?: Locale;
}

type Ratings = Readonly<Record<string, number>>;

export function SelfRateWidget({
  lessonId,
  cpId,
  title,
  scenario,
  axes,
  locale = "de",
}: SelfRateWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [ratings, setRatings] = useDraftValue<Ratings>(
    `selfrate::${lessonId}::${cpId}`,
    {},
  );

  const allRated =
    axes.length > 0 && axes.every((ax) => ratings[ax.id] != null);

  useEffect(() => {
    if (allRated) complete();
  }, [allRated, complete]);

  const set = (axisId: string, level: number) =>
    setRatings({ ...ratings, [axisId]: level });

  return (
    <WidgetFrame
      kindLabel={locale === "de" ? "Einschätzung" : "Assessment"}
      title={
        title ?? (locale === "de" ? "Selbsteinschätzung" : "Self-assessment")
      }
      scenario={
        scenario ??
        (locale === "de"
          ? "Bewerte den aktuellen Stand anhand konkreter Belege."
          : "Rate the current state using concrete evidence.")
      }
      done={done}
      xpLabel="+10 XP"
      doneLabel={locale === "de" ? "Erledigt" : "Done"}
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
              data-roving-group
              className="flex flex-wrap gap-2"
            >
              {ax.anchors.map((anchor, i) => {
                const storedIndex = ratings[ax.id];
                const selectedIndex =
                  storedIndex != null &&
                  storedIndex >= 0 &&
                  storedIndex < ax.anchors.length
                    ? storedIndex
                    : null;
                const active = selectedIndex === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-roving-item
                    tabIndex={rovingTabIndex(selectedIndex, i)}
                    onClick={() => set(ax.id, i)}
                    onKeyDown={(event) =>
                      handleRovingFocusKeyDown(event, {
                        currentIndex: i,
                        itemCount: ax.anchors.length,
                        onMove: (nextIndex) => set(ax.id, nextIndex),
                      })
                    }
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
