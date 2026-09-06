/**
 * The one gate the hosted cv-engine handoff route is allowed to ask.
 *
 * The readiness rule itself lives with every other runtime predicate in
 * src/lib/provider-readiness.ts, so the origin validation and the dated review
 * exist exactly once: the account surface that offers the tool and the route
 * that mints a token for it can never disagree about whether the deployment is
 * reachable. This module only composes them into a single answer.
 */
import "server-only";

import {
  cvEngineHostedOrigin,
  isCvEngineHostedReady,
} from "@/lib/provider-readiness";

/**
 * The single value the handoff route is allowed to build redirects from.
 *
 * Returning the origin and the readiness decision as one result keeps callers
 * from pairing a valid origin with an unready deployment: there is no way to
 * obtain a destination without also passing the gate.
 */
export function cvEngineHandoffOrigin(): string | null {
  return isCvEngineHostedReady() ? cvEngineHostedOrigin() : null;
}
