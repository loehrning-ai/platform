"use client";

import { useEffect, useRef } from "react";
import { CV_ENGINE_DURATION_S, cvEngineFrame } from "./cv-engine-frame";
import { driverSlot, type StageDriver } from "./stage-driver";

/**
 * The only client part of the drawn stage. The markup comes from the server
 * at rest; this finds its moving nodes by `data-k` and writes each frame's
 * transform, opacity and clip straight to them, skipping unchanged ones.
 */
export function CvEngineDriver({ id }: { readonly id: string }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = anchor.current?.parentElement;
    if (!stage) return;
    const nodes = new Map<string, HTMLElement>();
    for (const node of stage.querySelectorAll<HTMLElement>("[data-k]")) {
      nodes.set(node.dataset.k ?? "", node);
    }
    const applied = new Map<string, string>();
    const driver: StageDriver = {
      seek(s) {
        const look = cvEngineFrame(s / CV_ENGINE_DURATION_S);
        for (const [key, value] of Object.entries(look)) {
          const node = nodes.get(key);
          if (!node) continue;
          const signature = `${value.transform}|${value.opacity}|${value.clipPath}`;
          if (applied.get(key) === signature) continue;
          applied.set(key, signature);
          if (value.transform !== undefined) node.style.transform = value.transform;
          if (value.opacity !== undefined) node.style.opacity = String(value.opacity);
          if (value.clipPath !== undefined) node.style.clipPath = value.clipPath;
        }
      },
    };
    const slot = driverSlot(id);
    slot.current = driver;
    return () => {
      if (slot.current === driver) slot.current = null;
    };
  }, [id]);

  return <span ref={anchor} hidden />;
}
