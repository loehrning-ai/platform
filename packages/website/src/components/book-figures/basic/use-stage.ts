"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { StageController, type StageSnapshot } from "./stage-controller";

/**
 * Snapshot of the stage: live flag, SVG variant and reveal progress. The
 * server and the hydrating render both see the finished figure.
 */
export function useStage(ref: RefObject<HTMLElement | null>): StageSnapshot {
  const [controller] = useState(() => new StageController());
  useEffect(() => {
    const el = ref.current;
    return el ? controller.attach(el) : undefined;
  }, [controller, ref]);
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
}

const subscribeNever = (): (() => void) => () => undefined;

/** False on the server and while hydrating, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
