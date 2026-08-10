"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scoped client boundary that makes its Framer Motion subtree respect the user's
 * prefers-reduced-motion setting (transform/layout animations resolve to their
 * final state; opacity is preserved). Server layouts wrap only concrete client
 * islands with this provider; streamed route children remain server-owned.
 *
 * Bundle size (performance hardening): LazyMotion + domAnimation + `m.*` components
 * tree-shake the full-bundle renderer out of every page. `strict` makes any
 * leftover full `motion` component throw in dev, so regressions can't slip in
 * silently. Files that need domMax features (layout animations) load them via
 * their own scoped nested <LazyMotion>: progress/toast-provider.tsx (async) and
 * widgets/interactive-diagram.tsx (static, inside an already-lazy chunk).
 *
 * This covers Framer motion only. Non-Framer motion is guarded separately:
 * the hero clip-path entrance (hero.tsx).
 */
export function MotionProvider({ children }: { readonly children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
