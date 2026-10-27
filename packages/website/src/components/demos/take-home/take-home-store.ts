"use client";

import { useSyncExternalStore } from "react";

/**
 * The visitor's own line from the demo's "own" beat, per slug, in memory
 * only: it never touches storage and never leaves the tab. The demo writes it
 * with setTakeHomeLine; the "Für deinen Claude" block reads it.
 */
const lines = new Map<string, string>();
const listeners = new Set<() => void>();

export function setTakeHomeLine(slug: string, text: string): void {
  const next = text.trim();
  if ((lines.get(slug) ?? "") === next) return;
  if (next === "") lines.delete(slug);
  else lines.set(slug, next);
  for (const listener of listeners) listener();
}

export function getTakeHomeLine(slug: string): string {
  return lines.get(slug) ?? "";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTakeHomeLine(slug: string): string {
  return useSyncExternalStore(
    subscribe,
    () => getTakeHomeLine(slug),
    () => "",
  );
}
