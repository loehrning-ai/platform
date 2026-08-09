"use client";

import { LearningOwnerBoundaryRuntime } from "@/components/progress/learning-owner-boundary-runtime";

/**
 * This fail-closed boundary stays in the initial client graph so progress
 * controls cannot hydrate before ownership isolation. Less critical progress
 * UI and network reconciliation are split into deferred chunks elsewhere.
 *
 * It deliberately does not own the streamed page children. Wrapping those
 * children in a client host element creates a hydration race when a deferred
 * route segment arrives while React is claiming the root layout.
 */
export function LearningOwnerBoundary() {
  return <LearningOwnerBoundaryRuntime />;
}
