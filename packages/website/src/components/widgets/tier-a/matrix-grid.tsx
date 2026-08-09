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
 * MatrixGrid — a row-by-column selection matrix: for each row, pick exactly
 * one column. Ported from `ai-native-operator/course-app.js:159` (MatrixEx).
 * English copy — 1 instance in the AI-Native Operator course (mindset
 * lesson 3, "trust calibration").
 *
 *  - Each row is a `role="radiogroup"`; each cell is a `role="radio"`
 *    button, mirroring the source's own aria wiring.
 *  - The chosen column per row persists locally (private, not gamified) via
 *    useDraftValue, keyed by row label — matches the source's own
 *    `useLocalStore(lessonKey + "/matrix", {})`.
 *  - Once every row has a pick, awards the checkpoint once.
 *  - No motion to gate; selection is a CSS color/glyph change only.
 */

export interface MatrixGridWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  readonly rows: readonly string[];
  readonly cols: readonly string[];
  readonly locale?: Locale;
}

type Picks = Readonly<Record<string, number>>;

export function MatrixGridWidget({
  lessonId,
  cpId,
  title = "Matrix",
  scenario,
  rows,
  cols,
  locale = "en",
}: MatrixGridWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [picks, setPicks] = useDraftValue<Picks>(
    `matrix::${lessonId}::${cpId}`,
    {},
  );

  const allRowsPicked =
    rows.length > 0 && rows.every((row) => picks[row] != null);

  useEffect(() => {
    if (allRowsPicked) complete();
  }, [allRowsPicked, complete]);

  const pick = (row: string, colIndex: number) =>
    setPicks({ ...picks, [row]: colIndex });

  return (
    <WidgetFrame
      kindLabel="Matrix"
      title={title}
      scenario={scenario}
      done={done}
      xpLabel="+10 XP"
      doneLabel={locale === "de" ? "Erledigt" : "Done"}
    >
      <div
        role="region"
        aria-label={title}
        tabIndex={0}
        className="max-w-full overflow-x-auto"
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="p-2 text-left" />
              {cols.map((col) => (
                <th
                  key={col}
                  className="p-2 text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row}
                role="radiogroup"
                aria-label={row}
                data-roving-group
              >
                <td className="p-2 pr-4 text-[13px] font-medium text-foreground">
                  {row}
                </td>
                {cols.map((col, colIndex) => {
                  const active = picks[row] === colIndex;
                  const storedIndex = picks[row];
                  const selectedIndex =
                    storedIndex != null &&
                    storedIndex >= 0 &&
                    storedIndex < cols.length
                      ? storedIndex
                      : null;
                  return (
                    <td key={col} className="p-2 text-center">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={`${row}, ${col}`}
                        data-roving-item
                        tabIndex={rovingTabIndex(selectedIndex, colIndex)}
                        onClick={() => pick(row, colIndex)}
                        onKeyDown={(event) =>
                          handleRovingFocusKeyDown(event, {
                            currentIndex: colIndex,
                            itemCount: cols.length,
                            orientation: "horizontal",
                            onMove: (nextIndex) => pick(row, nextIndex),
                          })
                        }
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                          active
                            ? "border-brand-orange bg-brand-orange text-white"
                            : "border-border bg-background text-transparent hover:border-brand-orange/60",
                        )}
                      >
                        <span aria-hidden="true">{active ? "●" : ""}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}

export default MatrixGridWidget;
