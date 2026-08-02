"use client";

export type ProgressSyncFailure =
  | "permanent"
  | "retry_exhausted"
  | "startup";

let failure: ProgressSyncFailure | null = null;
const listeners = new Set<() => void>();

export function getProgressSyncFailure(): ProgressSyncFailure | null {
  return failure;
}

export function getServerProgressSyncFailure(): null {
  return null;
}

export function subscribeProgressSyncFailure(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setProgressSyncFailure(
  next: ProgressSyncFailure | null,
): void {
  if (failure === next) return;
  failure = next;
  for (const listener of listeners) listener();
}

export function __resetProgressSyncFailureForTests(): void {
  failure = null;
  listeners.clear();
}
