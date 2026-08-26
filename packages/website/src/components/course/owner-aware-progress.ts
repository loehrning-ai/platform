"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n/locale";
import {
  getLearningOwnerContext,
  subscribeLearningOwner,
  type LearningOwnerContext,
} from "@/lib/progress/browser-learning-storage";

const SERVER_OWNER_CONTEXT: LearningOwnerContext = {
  kind: "unknown",
  generation: 0,
};

const OWNER_REQUIRED_COPY: Readonly<Record<Locale, string>> = {
  de: "Wähle oben zuerst Konto oder lokalen Fortschritt.",
  en: "Choose account or local progress above first.",
};

interface OwnerAwareProgressReadiness {
  readonly hydrated: boolean;
  readonly ownerReady: boolean;
  readonly interactionReady: boolean;
  readonly checkpointKey: string;
}

/** Stable key for remounting transient lesson UI when the learning owner changes. */
export function useLearningOwnerStateKey(identity: string): string {
  const owner = useSyncExternalStore(
    subscribeLearningOwner,
    getLearningOwnerContext,
    () => SERVER_OWNER_CONTEXT,
  );
  return `${identity}:${owner.generation}`;
}

/**
 * Fence owner-scoped React state against account changes. A progress snapshot
 * is usable only when it was loaded for the active owner generation.
 */
export function useOwnerAwareProgressReadiness(
  identity: string,
  readyIdentity: string | null,
  loadedOwnerGeneration: number | null,
): OwnerAwareProgressReadiness {
  const owner = useSyncExternalStore(
    subscribeLearningOwner,
    getLearningOwnerContext,
    () => SERVER_OWNER_CONTEXT,
  );
  const hydrated =
    readyIdentity === identity && loadedOwnerGeneration === owner.generation;
  const ownerReady = owner.kind !== "unknown";

  return {
    hydrated,
    ownerReady,
    interactionReady: hydrated && ownerReady,
    checkpointKey: `${identity}:${owner.generation}`,
  };
}

function isSameLearningOwner(
  before: LearningOwnerContext,
  after: LearningOwnerContext,
): boolean {
  if (before.kind !== after.kind || before.generation !== after.generation) {
    return false;
  }
  return (
    before.kind !== "account" ||
    (after.kind === "account" && before.accountId === after.accountId)
  );
}

/**
 * Run a synchronous progress mutation only for a resolved owner and report
 * success only when the same owner still owns a verified persisted result.
 */
export function persistForActiveLearningOwner(
  mutate: () => void,
  didPersist: () => boolean,
): boolean {
  const ownerBefore = getLearningOwnerContext();
  if (ownerBefore.kind === "unknown") return false;

  mutate();

  const ownerAfter = getLearningOwnerContext();
  return isSameLearningOwner(ownerBefore, ownerAfter) && didPersist();
}

export function getOwnerRequiredHint(locale: Locale): string {
  return OWNER_REQUIRED_COPY[locale];
}
