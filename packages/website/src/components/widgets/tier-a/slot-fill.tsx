"use client";

import { useEffect, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import { WidgetFrame } from "./_frame";
import type { Locale } from "@/lib/i18n/locale";

/**
 * SlotFill — a numbered list of short-text inputs, one per named slot.
 * Ported from `ai-native-operator/course-app.js:192` (Slots). English copy
 * — 4 instances in the AI-Native Operator course: fleet-design (engineering
 * lesson 3), eval-builder (engineering lesson 4), ladder (talent lesson 2),
 * review-template (measurement lesson 3).
 *
 *  - One text input per slot, each with a source-faithful per-kind
 *    placeholder (the source's own `placeholders` map keyed by exercise
 *    kind, e.g. "Agent A — role" for fleet-design). The caller passes the
 *    resolved placeholder strings directly (course-agnostic component).
 *  - Values persist locally (private, not gamified) via useDraftValue,
 *    matching the source's own `useLocalStore(lessonKey + "/slots", ...)`.
 *  - Once every slot is non-empty, awards the checkpoint once.
 *  - No motion to gate; typing is a native input interaction.
 */

export interface SlotFillWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  readonly placeholders: readonly string[];
  readonly locale?: Locale;
}

export function SlotFillWidget({
  lessonId,
  cpId,
  title,
  scenario,
  placeholders,
  locale = "en",
}: SlotFillWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [values, setValues, draftReady] = useDraftValue<readonly string[]>(
    `slots::${lessonId}::${cpId}`,
    Array(placeholders.length).fill(""),
  );

  const allFilled =
    draftReady &&
    placeholders.length > 0 &&
    values.length === placeholders.length &&
    values.every((v) => v.trim().length > 0);

  useEffect(() => {
    if (draftReady && allFilled) complete();
  }, [draftReady, allFilled, complete]);

  const setSlot = (index: number, next: string) => {
    const nv = [...values];
    nv[index] = next;
    setValues(nv);
  };

  return (
    <WidgetFrame
      kindLabel={locale === "de" ? "Ausfüllen" : "Build"}
      title={
        title ?? (locale === "de" ? "Felder ausfüllen" : "Fill in the slots")
      }
      scenario={scenario}
      done={done}
      doneLabel={locale === "de" ? "Erledigt" : "Done"}
    >
      <div className="flex flex-col gap-2.5">
        {placeholders.map((placeholder, i) => (
          <div key={i} className="flex min-w-0 items-center gap-3">
            <span className="w-6 shrink-0 font-mono text-xs font-bold text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <input
              type="text"
              placeholder={
                placeholder ||
                `${locale === "de" ? "Eintrag" : "Item"} ${i + 1}`
              }
              value={draftReady ? (values[i] ?? "") : ""}
              onChange={(e) => setSlot(i, e.target.value)}
              disabled={!draftReady}
              aria-label={
                placeholder ||
                `${locale === "de" ? "Eintrag" : "Item"} ${i + 1}`
              }
              className="min-h-11 min-w-0 flex-1 border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
            />
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
}

export default SlotFillWidget;
