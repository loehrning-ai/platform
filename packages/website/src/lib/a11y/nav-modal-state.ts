"use client";

import { useSyncExternalStore } from "react";

let navModalOpen = false;
const listeners = new Set<() => void>();

export function setNavModalOpen(next: boolean): void {
  if (navModalOpen === next) return;
  navModalOpen = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return navModalOpen;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Shares the mobile-dialog lock without adding another client provider around
 * streamed route content.
 */
export function useNavModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
