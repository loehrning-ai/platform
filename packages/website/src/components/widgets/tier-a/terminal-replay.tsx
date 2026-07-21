"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "framer-motion";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * TerminalReplay — character-level typewriter playback of a terminal
 * session. Ported from `codex/js/widgets.js` (Terminal).
 *
 *  - Line-by-line playback; within each line, characters reveal one at a
 *    time via a jittered `setTimeout` chain (mirroring the source's
 *    per-character "typing" loop), tinted per segment tone.
 *  - The source guards every scheduled DOM write with a `cancel` flag
 *    checked before each write. This port's equivalent: an incrementing
 *    `runId` ref invalidates any in-flight loop on Reset, and an unmount
 *    effect flips `isMountedRef` to false AND clears the single pending
 *    `setTimeout` so no timer outlives the component and no state write
 *    ever lands on a detached component.
 *  - `prefers-reduced-motion`: Run replay skips the typewriter loop
 *    entirely and renders every frame's full text in one synchronous
 *    update — no timers are ever scheduled.
 *  - Awards the checkpoint once, when the full replay completes without
 *    being reset or interrupted.
 */

export type TerminalReplaySegmentTone =
  | "prompt"
  | "comment"
  | "error"
  | "output"
  | "plain";

export interface TerminalReplaySegment {
  readonly text: string;
  readonly tone?: TerminalReplaySegmentTone;
}

export interface TerminalReplayFrame {
  readonly segments: readonly TerminalReplaySegment[];
  /** Whole-line muted treatment, mirroring the source's `cls: 'dim'`. */
  readonly dim?: boolean;
  /** Delay in ms after this frame finishes typing, before the next starts. */
  readonly delayMs?: number;
}

export interface TerminalReplayWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  /** Widget-frame heading, e.g. 'Session replay: "add rate limiting to /login"'. */
  readonly title: string;
  /** Terminal window chrome title, e.g. "codex@sandbox · task-4a92". */
  readonly windowTitle?: string;
  readonly frames: readonly TerminalReplayFrame[];
}

const SPEEDS = [0.5, 1, 2, 4] as const;

const SEGMENT_TONE_CLASS: Record<TerminalReplaySegmentTone, string> = {
  prompt: "text-brand-orange",
  comment: "text-muted-foreground",
  error: "text-destructive",
  output: "text-[#22c55e]",
  plain: "text-foreground",
};

function frameText(frame: TerminalReplayFrame): string {
  return frame.segments.map((s) => s.text).join("");
}

function delay(ms: number, ref: { current: ReturnType<typeof setTimeout> | null }): Promise<void> {
  return new Promise((resolve) => {
    ref.current = setTimeout(() => {
      ref.current = null;
      resolve();
    }, ms);
  });
}

/** Renders a frame's segments, revealing only `typedChars` characters total. */
function TypedLine({
  frame,
  typedChars,
}: {
  readonly frame: TerminalReplayFrame;
  readonly typedChars: number | null;
}): JSX.Element {
  const full = typedChars === null;
  let remaining = typedChars ?? Infinity;
  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.7]",
        frame.dim && "text-muted-foreground/70",
      )}
    >
      {frame.segments.map((seg, i) => {
        if (remaining <= 0 && !full) return null;
        const take = full ? seg.text.length : Math.min(seg.text.length, remaining);
        remaining -= take;
        const visible = seg.text.slice(0, take);
        if (visible.length === 0) return null;
        return (
          <span key={i} className={SEGMENT_TONE_CLASS[seg.tone ?? "plain"]}>
            {visible}
          </span>
        );
      })}
      {!full && typedChars! < frameText(frame).length && (
        <span aria-hidden="true" className="text-brand-orange">
          ▍
        </span>
      )}
    </div>
  );
}

export function TerminalReplayWidget({
  lessonId,
  cpId,
  title,
  windowTitle = "codex@sandbox",
  frames,
}: TerminalReplayWidgetProps): JSX.Element {
  const reduced = useReducedMotion();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [revealedCount, setRevealedCount] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const runIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      runIdRef.current += 1;
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
    };
  }, []);

  const run = useCallback(async () => {
    if (status === "running" || frames.length === 0) return;
    const runId = (runIdRef.current += 1);
    setStatus("running");
    setRevealedCount(0);
    setTypedChars(0);

    if (reduced) {
      setRevealedCount(frames.length);
      setTypedChars(0);
      setStatus("done");
      complete();
      return;
    }

    for (let f = 0; f < frames.length; f += 1) {
      const frame = frames[f];
      const text = frameText(frame);
      for (let c = 1; c <= text.length; c += 1) {
        const jitter = 8 + Math.random() * 10;
        await delay(jitter / speed, pendingTimeoutRef);
        if (runIdRef.current !== runId || !isMountedRef.current) return;
        setTypedChars(c);
      }
      if (runIdRef.current !== runId || !isMountedRef.current) return;
      setRevealedCount(f + 1);
      setTypedChars(0);
      await delay((frame.delayMs ?? 200) / speed, pendingTimeoutRef);
      if (runIdRef.current !== runId || !isMountedRef.current) return;
    }

    setStatus("done");
    complete();
  }, [status, frames, reduced, speed, complete]);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    setStatus("idle");
    setRevealedCount(0);
    setTypedChars(0);
  }, []);

  const statusLabel =
    status === "running" ? "running" : status === "done" ? "done" : "idle";
  const statusDotClass =
    status === "running"
      ? "bg-brand-orange"
      : status === "done"
        ? "bg-[#22c55e]"
        : "bg-muted-foreground";

  return (
    <WidgetFrame
      kindLabel="Replay"
      title={title}
      done={done}
      xpLabel="+10 XP"
    >
      <div className="border-2 border-border bg-background">
        <div className="flex items-center gap-3 border-b border-border bg-card/60 px-3 py-2">
          <span aria-hidden="true" className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="h-2 w-2 rounded-full bg-border" />
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{windowTitle}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)} />
            {statusLabel}
          </span>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-3">
          {revealedCount === 0 && status !== "running" ? (
            <p className="font-mono text-[12px] text-muted-foreground/70">
              # press &quot;Run replay&quot; to watch this session play out
            </p>
          ) : (
            <>
              {frames.slice(0, revealedCount).map((frame, i) => (
                <TypedLine key={i} frame={frame} typedChars={null} />
              ))}
              {status === "running" && revealedCount < frames.length && (
                <TypedLine frame={frames[revealedCount]} typedChars={typedChars} />
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={status === "running"}
          className="inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-orange px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          ▶ Run replay
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 border-2 border-border bg-background px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand-orange"
        >
          ↺ Reset
        </button>
        <label className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          speed
          <select
            value={speed}
            onChange={(e) => setSpeed(Number.parseFloat(e.target.value) || 1)}
            className="border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </WidgetFrame>
  );
}

export default TerminalReplayWidget;
