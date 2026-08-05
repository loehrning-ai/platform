"use client";

import dynamic from "next/dynamic";

const UserProgressSyncRuntime = dynamic(
  () =>
    import("@/components/auth/user-progress-sync-runtime").then(
      (mod) => mod.UserProgressSyncRuntime,
    ),
  { ssr: false },
);

/**
 * Account/progress reconciliation remains global for deletion and stale-session
 * safety, but its storage, merge, and network machinery is not first-load JS.
 */
export function UserProgressSync() {
  return <UserProgressSyncRuntime />;
}
