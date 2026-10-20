"use client";

import { useEffect, useState, type RefObject } from "react";
import { useChapterStage } from "@/components/book-reader/stage/use-chapter-stage";
import { closestStage } from "@/components/book-reader/stage/stage-protocol";
import type { Variant } from "../basic/stage-controller";
import { useStage } from "../basic/use-stage";
import { usePrefersReducedMotion } from "../story/use-motion";

export interface HeroProgress {
  /** 0 to 1, what the engine draws. 1 on the server, before the island runs, under reduced motion and when paused. */
  readonly progress: number;
  /** Index of the stage step in force; the last step outside a stage. */
  readonly step: number;
  readonly steps: number;
  readonly inStage: boolean;
  /** Which SVG layout fits the container (phone or wide); null before measuring. */
  readonly layout: Variant | null;
  readonly reduced: boolean;
  readonly ready: boolean;
}

export interface HeroEnv {
  readonly inStage: boolean;
  /** Progress of the first-view reveal (outside a stage); 1 under reduced motion. */
  readonly revealProgress: number;
  readonly layout: Variant | null;
  readonly reduced: boolean;
  readonly ready: boolean;
}

/**
 * Everything of useHeroProgress except the stage's scroll progress: a painter
 * that draws straight from the stage events (the canvas of Das Feld) uses this
 * and never re-renders React per scroll frame.
 */
export function useHeroEnv(ref: RefObject<HTMLElement | null>): HeroEnv {
  const reveal = useStage(ref);
  const reduced = usePrefersReducedMotion();
  const [inStage, setInStage] = useState(false);
  useEffect(() => {
    setInStage(closestStage(ref.current) !== null);
  }, [ref]);
  return { inStage, revealProgress: reduced ? 1 : reveal.progress, layout: reveal.variant, reduced, ready: reveal.ready };
}

/**
 * Where a hero figure takes its progress from. Inside a chapter stage the
 * shell writes it (scroll scrub); alone on a page the figure plays once when
 * it enters the viewport (the same reveal as the basic islands). Both end at 1
 * and both give 1 at once under reduced motion.
 */
export function useHeroProgress(ref: RefObject<HTMLElement | null>): HeroProgress {
  const stage = useChapterStage(ref);
  const reveal = useStage(ref);
  const reduced = usePrefersReducedMotion();
  const [inStage, setInStage] = useState(false);
  useEffect(() => {
    setInStage(closestStage(ref.current) !== null);
  }, [ref]);
  if (inStage) {
    return {
      progress: reduced ? 1 : stage.progress,
      step: stage.step,
      steps: stage.steps,
      inStage: true,
      layout: reveal.variant,
      reduced,
      ready: reveal.ready,
    };
  }
  return { progress: reduced ? 1 : reveal.progress, step: 0, steps: 1, inStage: false, layout: reveal.variant, reduced, ready: reveal.ready };
}
