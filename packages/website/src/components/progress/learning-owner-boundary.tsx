"use client";

import type { ReactNode } from "react";
import { LearningOwnerBoundaryRuntime } from "@/components/progress/learning-owner-boundary-runtime";

/**
 * This fail-closed boundary stays in the initial client graph so progress
 * controls cannot hydrate before ownership isolation. Less critical progress
 * UI and network reconciliation are split into deferred chunks elsewhere.
 */
export function LearningOwnerBoundary({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <LearningOwnerBoundaryRuntime>{children}</LearningOwnerBoundaryRuntime>
  );
}
