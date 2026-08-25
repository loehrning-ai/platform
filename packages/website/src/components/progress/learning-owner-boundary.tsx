"use client";

import { LearningOwnerBoundaryRuntime } from "@/components/progress/learning-owner-boundary-runtime";

/**
 * This boundary stays in the initial client graph so unresolved ownership is
 * visible while the progress store independently rejects unattributed writes.
 * Less critical progress UI and network reconciliation remain deferred.
 *
 * It deliberately does not own the streamed page children. Wrapping those
 * children in a client host element creates a hydration race when a deferred
 * route segment arrives while React is claiming the root layout.
 */
export function LearningOwnerBoundary() {
  return <LearningOwnerBoundaryRuntime />;
}
