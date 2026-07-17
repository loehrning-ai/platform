"use client";

// ─── useCheckpoint hook (shared course architecture) ──
//
// In-lesson micro-progress: a checkpoint is a named beat inside a lesson (a
// widget solved, a section confirmed, a reflection answered). Completing one
// awards XP once and may unlock a badge. Subscribes to the unified store so
// every mounted checkpoint stays in sync across tabs.

import { useCallback, useSyncExternalStore } from "react";
import {
  completeCheckpoint,
  isCheckpointDone,
  subscribe,
} from "./store";

export interface UseCheckpointResult {
  /** Whether this checkpoint has already been completed. */
  readonly done: boolean;
  /** Mark it complete (idempotent). Returns true only on first completion. */
  readonly complete: () => boolean;
}

/**
 * Track a single in-lesson checkpoint.
 *
 * @param lessonId stable lesson identifier
 * @param cpId     checkpoint id, unique within the lesson
 */
export function useCheckpoint(lessonId: string, cpId: string): UseCheckpointResult {
  const subscribeStore = useCallback(
    (onChange: () => void) => subscribe(() => onChange()),
    [],
  );
  const getSnapshot = useCallback(
    () => isCheckpointDone(lessonId, cpId),
    [lessonId, cpId],
  );
  // Server snapshot: checkpoints are client-only (localStorage), so SSR is false.
  const getServerSnapshot = useCallback(() => false, []);

  const done = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  const complete = useCallback(
    () => completeCheckpoint(lessonId, cpId),
    [lessonId, cpId],
  );

  return { done, complete };
}
