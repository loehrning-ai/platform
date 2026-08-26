"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  setOwnedLocalLearningItem,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";

const UNKNOWN_OWNER_CONTEXT = { kind: "unknown", generation: 0 } as const;

/**
 * useDraftValue — tiny localStorage-backed state for the reflective Tier-A
 * widgets (SelfRate / Plays). Ported from the `useLocalStore` helper in
 * `ai-native/course-app.js`. Kept separate from the unified progress store:
 * these drafts are private notes, not completion evidence.
 *
 *  - SSR-safe: starts from `initial` on the server; hydrates from storage in
 *    a `useEffect` so it never touches `localStorage` during render.
 *  - Immutable: setter always replaces the value (callers pass new objects).
 *  - Resilient: storage read/write errors fall back to in-memory state.
 *  - The third tuple value becomes true only after the exact active learning
 *    owner generation has loaded. Callers must keep controls non-interactive
 *    until then so an unowned edit cannot be displayed and later discarded.
 */
export function useDraftValue<T>(
  key: string,
  initial: T,
): readonly [T, (next: T) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const initialRef = useRef(initial);
  const owner = useSyncExternalStore(
    subscribeLearningOwner,
    getLearningOwnerContext,
    () => UNKNOWN_OWNER_CONTEXT,
  );

  useEffect(() => {
    const loadOwnedDraft = () => {
      const activeOwner = getLearningOwnerContext();
      setLoadedOwnerGeneration(activeOwner.generation);
      setValue(initialRef.current);
      try {
        const raw = getOwnedLocalLearningItem(key);
        if (raw != null) setValue(JSON.parse(raw) as T);
      } catch {
        // unreadable / unavailable storage — keep the initial value
      }
    };
    loadOwnedDraft();
    return subscribeLearningOwner(loadOwnedDraft);
  }, [key]);

  const ready =
    owner.kind !== "unknown" &&
    loadedOwnerGeneration !== null &&
    loadedOwnerGeneration === owner.generation;

  const update = useCallback(
    (next: T) => {
      const activeOwner = getLearningOwnerContext();
      if (
        activeOwner.kind === "unknown" ||
        loadedOwnerGeneration === null ||
        activeOwner.generation !== loadedOwnerGeneration
      ) {
        return;
      }
      setValue(next);
      setOwnedLocalLearningItem(
        key,
        JSON.stringify(next),
        loadedOwnerGeneration,
      );
    },
    [key, loadedOwnerGeneration],
  );

  return [value, update, ready] as const;
}
