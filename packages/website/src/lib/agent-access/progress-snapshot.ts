import "server-only";

import type { ProgressSnapshot } from "@/lib/mcp/tools/authenticated";
import { reportApiError } from "@/lib/observability/api-error";
import { fetchUnifiedProgressForUser } from "@/lib/progress/server-store";
import { tryCreateServiceClient } from "@/lib/supabase/server";

/**
 * The read path behind the authenticated MCP tools.
 *
 * It lives here rather than under `src/lib/mcp` on purpose: that directory
 * holds no database client at all, so nothing on the agent tool surface can
 * reach a write path even by accident. The tools receive this function as a
 * `ProgressReader` and never learn what backs it.
 *
 * The service client is the right client here, and only here. An agent call
 * carries a bearer, not a cookie, so there is no request-bound Supabase
 * session to read through. The user id is server-derived from the verified
 * bearer before this is ever called, and `fetchUnifiedProgressForUser` scopes
 * every row to it, which is the same shape the account export uses for the
 * tables PostgREST does not serve to the browser role.
 */

export class AgentProgressReadError extends Error {
  constructor(readonly reason: "store_unavailable" | "read_failed") {
    super(`Agent progress read failed: ${reason}`);
    this.name = "AgentProgressReadError";
  }
}

export async function readAgentProgressSnapshot(
  userId: string,
): Promise<ProgressSnapshot> {
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    throw new AgentProgressReadError("store_unavailable");
  }

  let fetched;
  try {
    fetched = await fetchUnifiedProgressForUser(serviceClient, userId);
  } catch (error) {
    reportApiError({ route: "/api/mcp", step: "supabase-read", error });
    throw new AgentProgressReadError("read_failed");
  }
  if (!fetched.ok) {
    // A failed read must never be reported as an empty account. That would
    // tell an agent the learner has done nothing, which is a different and
    // much worse answer than "not available right now".
    reportApiError({
      route: "/api/mcp",
      step: "supabase-read",
      error: fetched.error,
    });
    throw new AgentProgressReadError("read_failed");
  }

  return {
    progress: fetched.result.progress,
    updatedAt: fetched.result.updatedAt,
  };
}
