"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  getUnifiedState,
  replaceUnifiedState,
  subscribe,
} from "@/lib/progress/store";
import {
  isUnifiedProgress,
  mergeUnifiedProgress,
} from "@/lib/progress/server-sync";
import type { UnifiedProgress } from "@/lib/progress/types";

async function loadRemoteProgress(): Promise<UnifiedProgress | null> {
  const response = await fetch("/api/progress", {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) return null;
  const body = await response.json() as { progress?: unknown };
  return isUnifiedProgress(body.progress) ? body.progress : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function saveRemoteProgress(
  progress: UnifiedProgress,
  retryOnConflict = true,
): Promise<UnifiedProgress | null> {
  const response = await fetch("/api/progress", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress }),
  });
  const body = await response.json() as { progress?: unknown };
  if (response.status === 409 && retryOnConflict && isUnifiedProgress(body.progress)) {
    const merged = mergeUnifiedProgress(getUnifiedState(), body.progress);
    await sleep(300);
    return saveRemoteProgress(merged, false);
  }
  if (!response.ok) return isUnifiedProgress(body.progress) ? body.progress : null;
  return isUnifiedProgress(body.progress) ? body.progress : null;
}

export function UserProgressSync() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const client = supabase;

    let active = true;
    let timeout: number | null = null;
    let syncingFromServer = false;
    let unsubscribe: (() => void) | null = null;

    async function boot() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!active || !user) return;

      const remote = await loadRemoteProgress();
      if (!active) return;

      const local = getUnifiedState();
      const merged = remote ? mergeUnifiedProgress(local, remote) : local;
      syncingFromServer = true;
      replaceUnifiedState(merged);
      syncingFromServer = false;
      const saved = await saveRemoteProgress(merged);
      if (!active) return;
      if (saved) {
        syncingFromServer = true;
        replaceUnifiedState(saved);
        syncingFromServer = false;
      }

      unsubscribe = subscribe((state) => {
        if (syncingFromServer) return;
        if (timeout !== null) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          void saveRemoteProgress(state).then((savedState) => {
            if (!active || !savedState) return;
            syncingFromServer = true;
            replaceUnifiedState(savedState);
            syncingFromServer = false;
          });
        }, 900);
      });
    }

    void boot();

    return () => {
      active = false;
      if (timeout !== null) window.clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  return null;
}
