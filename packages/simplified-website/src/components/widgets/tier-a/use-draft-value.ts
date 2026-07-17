"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useDraftValue — tiny localStorage-backed state for the reflective Tier-A
 * widgets (SelfRate / Plays). Ported from the `useLocalStore` helper in
 * `ai-native/course-app.js`. Kept separate from the unified progress store:
 * these drafts are private notes, not gamified XP.
 *
 *  - SSR-safe: starts from `initial` on the server; hydrates from storage in
 *    a `useEffect` so it never touches `localStorage` during render.
 *  - Immutable: setter always replaces the value (callers pass new objects).
 *  - Resilient: storage read/write errors fall back to in-memory state.
 */
export function useDraftValue<T>(
  key: string,
  initial: T,
): readonly [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      // unreadable / unavailable storage — keep the initial value
    }
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // quota / unavailable — value still lives in memory this session
      }
    },
    [key],
  );

  return [value, update] as const;
}
