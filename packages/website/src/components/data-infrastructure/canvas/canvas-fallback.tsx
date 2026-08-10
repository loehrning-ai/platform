"use client";

import type { JSX } from "react";
import { useDataInfraWidgetLocale } from "../widget-locale-context";

// ─── CanvasFallbackNotice ────────────────────────
//
// Every canvas widget must null-check `canvas.getContext('2d')` — privacy-
// hardened browsers (Brave's canvas-fingerprint blocking, Firefox's
// `resistFingerprinting`) can return `null`, and the source never
// null-checks this. Shared fallback so all 10 canvas widgets render a
// consistent static text summary instead of crashing or showing a blank box.

export interface CanvasFallbackNoticeProps {
  readonly title: string;
  readonly summary: string;
}

export function CanvasFallbackNotice({
  title,
  summary,
}: CanvasFallbackNoticeProps): JSX.Element {
  const { text } = useDataInfraWidgetLocale();

  return (
    <div
      role="img"
      aria-label={`${title}. ${summary}`}
      className="flex min-h-[160px] min-w-0 max-w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-card/40 p-4 text-center sm:p-6"
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <p className="max-w-[440px] break-words text-[13px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
        {summary}
      </p>
      <p className="break-words text-[11px] text-muted-foreground/70 [overflow-wrap:anywhere]">
        {text(
          "Canvas rendering is unavailable in this browser. The model is summarized as text instead.",
          "Die Canvas-Darstellung ist in diesem Browser nicht verfügbar. Das Modell wird stattdessen als Text zusammengefasst.",
        )}
      </p>
    </div>
  );
}

export default CanvasFallbackNotice;
