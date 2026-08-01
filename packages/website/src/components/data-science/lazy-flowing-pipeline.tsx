"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

type PipelineComponent = ComponentType<Record<string, never>>;

/**
 * Keeps the animated overview SVG out of the initial mobile hydration path.
 * The placeholder reserves the final aspect ratio; the interactive module is
 * fetched only after the slot enters the inner half of the viewport.
 */
export function LazyFlowingPipeline() {
  const slotRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [Pipeline, setPipeline] = useState<PipelineComponent | null>(null);

  useEffect(() => {
    let disposed = false;

    async function loadPipeline() {
      if (loadingRef.current) return;
      loadingRef.current = true;
      const importedPipeline = await import(
        "@/components/data-science/simulators/flowing-pipeline"
      );
      if (!disposed) {
        setPipeline(() => importedPipeline.FlowingPipeline);
      }
    }

    const slot = slotRef.current;
    if (!slot || typeof IntersectionObserver === "undefined") {
      void loadPipeline();
      return () => {
        disposed = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void loadPipeline();
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    observer.observe(slot);

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={slotRef} className="ov-loop-slot">
      {Pipeline ? (
        <Pipeline />
      ) : (
        <div className="ov-loop-wrap ov-loop-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

export default LazyFlowingPipeline;
