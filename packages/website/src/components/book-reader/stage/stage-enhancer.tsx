"use client";

import { useEffect } from "react";
import { startStage } from "./stage-controller";

/**
 * Starts the scrub of one chapter stage once the browser is idle. Hostless
 * island: a hidden marker, nothing to hydrate in the stage itself. Before it
 * runs (and without script) Weiter and Zurück are anchors to the step cards
 * and the figure shows its finished frame.
 */
export function StageEnhancer({ stageId }: { readonly stageId: string }) {
  useEffect(() => {
    const root = document.getElementById(`stage-${stageId}`);
    if (!root) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    const start = (): void => {
      if (!cancelled) stop = startStage(root);
    };
    let cancel: () => void;
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      cancel = () => window.cancelIdleCallback(handle);
    } else {
      const handle = window.setTimeout(start, 250);
      cancel = () => window.clearTimeout(handle);
    }
    return () => {
      cancelled = true;
      cancel();
      stop?.();
    };
  }, [stageId]);

  return <span hidden aria-hidden="true" data-stage-runtime={stageId} />;
}
