"use client";

import { useSyncExternalStore } from "react";

import {
  getLearningOwnerContext,
  subscribeLearningOwner,
} from "./browser-learning-storage";

/**
 * A synchronous render fence for account changes. Consumers must not render
 * or persist owner-scoped drafts until their state was loaded for this exact
 * generation.
 */
export function useLearningOwnerGeneration(): number {
  return useSyncExternalStore(
    subscribeLearningOwner,
    () => getLearningOwnerContext().generation,
    () => 0,
  );
}
