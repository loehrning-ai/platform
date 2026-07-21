"use client";

import { useEffect, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import { WidgetFrame } from "./_frame";

/**
 * ReflectBox — a single free-text reflection prompt, saved locally only.
 * Ported from `ai-native-operator/course-app.js:134` (ReflectBox). English
 * copy — reuses 23 of the AI-Native Operator course's 30 exercises (every
 * source exercise kind that routes through `ReflectBox` in the source
 * dispatcher: reflect, audit, flow-compress, comp-design, kpi-pick,
 * kpi-design, rubric-build, context-design, meeting-audit, pipeline-design,
 * team-shape, spec-builder).
 *
 *  - A single textarea; the typed text persists locally (private, not
 *    gamified) via useDraftValue, mirroring the source's own
 *    `useLocalStore(lessonKey + "/reflect", "")`.
 *  - Once the trimmed text is non-empty, awards the checkpoint once — the
 *    source itself has no completion signal at all (it is a plain
 *    textarea), so this is the deterministic, storage-safe substitute: no
 *    AI grading, no server-side text persistence, just a boolean
 *    checkpoint.
 *  - No motion to gate; typing is a native textarea interaction.
 */

export interface ReflectBoxWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly scenario?: string;
  readonly rows?: number;
  readonly placeholder?: string;
}

export function ReflectBoxWidget({
  lessonId,
  cpId,
  title = "Reflect",
  scenario,
  rows = 4,
  placeholder = "Type here. Saved locally — only you see this.",
}: ReflectBoxWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useDraftValue<string>(`reflect::${lessonId}::${cpId}`, "");

  const hasContent = value.trim().length > 0;

  useEffect(() => {
    if (hasContent) complete();
  }, [hasContent, complete]);

  return (
    <WidgetFrame kindLabel="Reflection" title={title} scenario={scenario} done={done} xpLabel="+10 XP">
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={title}
        className="w-full resize-y border-2 border-border bg-background p-3 text-[14px] leading-[1.5] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none"
      />
    </WidgetFrame>
  );
}

export default ReflectBoxWidget;
