"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LearningOwnerPanel } from "@/components/progress/learning-owner-panel";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";
import { continueWithAnonymousProgress } from "@/lib/progress/store";
import { isLearningOwnerRoute } from "@/lib/progress/learning-route-policy";

/**
 * Keep progress persistence fail-closed until Auth selects an isolated account
 * or anonymous namespace. Course content stays usable while the learner makes
 * that storage choice explicitly.
 *
 * This runtime, the progress store, and the browser learning storage load as
 * one learning-only async chunk behind the route gate in
 * learning-owner-boundary.tsx; nothing here may be imported by the root layout.
 */
export function LearningOwnerBoundaryRuntime() {
  const pathname = usePathname();
  // Unknown is the fail-closed initial state. The prompt stays in document
  // flow so it cannot cover the first learning action or an active simulator.
  const [owner, setOwner] = useState<LearningOwnerContext>({
    kind: "unknown",
    generation: 0,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setOwner(getLearningOwnerContext());
    return subscribeLearningOwner(setOwner);
  }, []);

  const unresolved = owner.kind === "unknown" && isLearningOwnerRoute(pathname);

  return unresolved ? (
    <LearningOwnerPanel
      ready={hydrated}
      onContinue={continueWithAnonymousProgress}
    />
  ) : null;
}
