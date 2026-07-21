import type { JSX } from "react";

// ─── CanvasFallbackNotice (plan 010 stage 2) ────────────────────────
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

export function CanvasFallbackNotice({ title, summary }: CanvasFallbackNoticeProps): JSX.Element {
  return (
    <div
      role="img"
      aria-label={`${title}. ${summary}`}
      className="flex min-h-[160px] flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-card/40 p-6 text-center"
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <p className="max-w-[440px] text-[13px] leading-relaxed text-muted-foreground">{summary}</p>
      <p className="text-[11px] text-muted-foreground/70">
        This browser blocked canvas rendering, so a static summary is shown instead of the live
        simulation.
      </p>
    </div>
  );
}

export default CanvasFallbackNotice;
