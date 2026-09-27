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
  // A build without a public Supabase config has no account to wait for: the
  // progress sync runtime selects the anonymous namespace as soon as it
  // mounts, so the choice could only flash in and then shift the page up
  // (CLS 0.10 at 320x568). Render nothing there. Only the inlined public
  // variables are read, so the server and the client always agree.
  if (!hasPublicAuthProvider()) return null;
  return isLearningOwnerRoute(pathname) ? <LearningOwnerRuntimeHost /> : null;
}

/**
 * Whether the build carries a public auth provider. NEXT_PUBLIC_* values are
 * inlined at build time, so this is the same on the server and in the
 * browser; a malformed value still counts as configured (the choice shows,
 * as before), never the other way round.
 */
function hasPublicAuthProvider(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
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
