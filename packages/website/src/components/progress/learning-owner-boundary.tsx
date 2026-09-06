"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LearningOwnerPanel } from "@/components/progress/learning-owner-panel";
import { isLearningOwnerRoute } from "@/lib/progress/learning-route-policy";

/**
 * A local continuation chosen before the deferred runtime has landed pulls the
 * store on demand, so the choice never waits on a chunk the learner cannot see.
 * The runtime observes the resulting owner change like any other.
 */
function requestLocalContinuation(): void {
  import("@/lib/progress/store")
    .then((mod) => {
      mod.continueWithAnonymousProgress();
    })
    .catch((error: unknown) => {
      console.error("The local learning continuation is unavailable.", error);
    });
}

const LearningOwnerBoundaryRuntime = dynamic(
  () =>
    import("@/components/progress/learning-owner-boundary-runtime").then(
      (mod) => mod.LearningOwnerBoundaryRuntime,
    ),
  {
    ssr: false,
    loading: () => (
      <LearningOwnerPanel ready onContinue={requestLocalContinuation} />
    ),
  },
);

/**
 * Only the pure, dependency-free route gate stays in the initial client graph
 * on every route. The ownership runtime is requested on learning-owner routes
 * alone. The progress store and the browser learning storage behind it are a
 * separate async chunk shared with the root layout's reconciliation gate, which
 * requests it on the wider progress-route set and on no route outside it. The
 * store fails closed on its own while the owner is unknown, so the runtime
 * arriving one chunk after hydration cannot let an unattributed write through.
 *
 * It deliberately does not own the streamed page children. Wrapping those
 * children in a client host element creates a hydration race when a deferred
 * route segment arrives while React is claiming the root layout.
 */
export function LearningOwnerBoundary() {
  const pathname = usePathname();
  return isLearningOwnerRoute(pathname) ? <LearningOwnerRuntimeHost /> : null;
}

/**
 * Leaf host for the deferred runtime. The server and the first client render
 * show the same disabled in-flow choice, so hydration claims identical markup
 * and the async chunk is requested only after the layout has committed.
 */
function LearningOwnerRuntimeHost() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? (
    <LearningOwnerBoundaryRuntime />
  ) : (
    <LearningOwnerPanel ready={false} onContinue={requestLocalContinuation} />
  );
}
