"use client";

import { useEffect, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { useDraftValue } from "./use-draft-value";
import { WidgetFrame } from "./_frame";
import type { Locale } from "@/lib/i18n/locale";

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
  readonly locale?: Locale;
}

export function ReflectBoxWidget({
  lessonId,
  cpId,
  title,
  scenario,
  rows = 4,
  placeholder,
  locale = "en",
}: ReflectBoxWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useDraftValue<string>(
    `reflect::${lessonId}::${cpId}`,
    "",
  );
  const [hydrated, setHydrated] = useState(false);

  const hasContent = value.trim().length > 0;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hasContent) complete();
  }, [hasContent, complete]);

  const localizedTitle = title ?? (locale === "de" ? "Reflexion" : "Reflect");
  const localizedPlaceholder =
    placeholder ??
    (locale === "de"
      ? "Hier eingeben. Wird nur lokal in diesem Browser gespeichert."
      : "Type here. Stored only in this browser.");

  return (
    <WidgetFrame
      kindLabel={locale === "de" ? "Reflexion" : "Reflection"}
      title={localizedTitle}
      scenario={scenario}
      done={done}
      xpLabel="+10 XP"
      doneLabel={locale === "de" ? "Erledigt" : "Done"}
    >
      <textarea
        rows={rows}
        placeholder={localizedPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!hydrated}
        aria-disabled={!hydrated}
        aria-label={localizedTitle}
        className="w-full resize-y border-2 border-border bg-background p-3 text-[14px] leading-[1.5] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none"
      />
    </WidgetFrame>
  );
}

export default ReflectBoxWidget;
