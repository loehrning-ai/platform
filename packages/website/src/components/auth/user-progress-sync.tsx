"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isProgressRuntimeRoute } from "@/lib/progress/learning-route-policy";

const UserProgressSyncRuntime = dynamic(
  () =>
    import("@/components/auth/user-progress-sync-runtime").then(
      (mod) => mod.UserProgressSyncRuntime,
    ),
  { ssr: false },
);

/**
 * Only the pure, dependency-free route gate stays in the initial client graph.
 * The reconciliation runtime, and the progress store it imports at module
 * scope, are requested on progress routes alone, so a route that cannot hold
 * progress requests them neither in the initial graph nor after load.
 *
 * The gate latches rather than tracking the current route. The runtime owns
 * document-level listeners, a debounced upload, and the deletion pause, and it
 * expects to outlive a single route: a lesson completed a few hundred
 * milliseconds before the learner navigates to a public page must still reach
 * the server from the same document, and the account sync notice must still be
 * able to read a failure raised on the route the learner came from. Once a
 * progress route is reached the runtime therefore stays mounted for the life of
 * the document, exactly as it did before this gate existed. A document that
 * never reaches one never requests it.
 */
export function UserProgressSync() {
  const pathname = usePathname();
  const [reached, setReached] = useState(false);

  useEffect(() => {
    if (isProgressRuntimeRoute(pathname)) setReached(true);
  }, [pathname]);

  return reached ? <UserProgressSyncRuntime /> : null;
}
