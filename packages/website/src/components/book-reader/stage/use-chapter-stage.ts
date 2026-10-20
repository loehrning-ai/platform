"use client";

import { useCallback, useSyncExternalStore, type RefObject } from "react";
import { closestStage, FINISHED_STATE, getStageState, subscribeStage, type StageState } from "./stage-protocol";

/**
 * For a figure island that lives inside a chapter stage: the stage's current
 * state. Pass a ref to any element of the island. Outside a stage, on the
 * server, before the shell has run, under reduced motion and when paused it is
 * FINISHED_STATE (progress 1), so the finished figure is always the base case.
 *
 * A canvas painter that must not re-render React per frame should call
 * subscribeStage(closestStage(node), listener) from an effect instead.
 */
export function useChapterStage(ref: RefObject<Element | null>): StageState {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const root = closestStage(ref.current);
      return root ? subscribeStage(root, onChange) : () => {};
    },
    [ref],
  );
  const getSnapshot = useCallback(() => getStageState(closestStage(ref.current)), [ref]);
  return useSyncExternalStore(subscribe, getSnapshot, () => FINISHED_STATE);
}
