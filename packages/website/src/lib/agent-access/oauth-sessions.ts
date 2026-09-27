import "server-only";

import { reportApiError } from "@/lib/observability/api-error";
import { tryCreateServiceClient } from "@/lib/supabase/server";

/**
 * Is the Auth session behind an OAuth access token still alive?
 *
 * A Supabase OAuth access token is a self-contained JWT. Revoking the grant
 * on /konto/ki, a global sign-out, a ban, or deleting the account removes or
 * ends the session in `auth.sessions`, but the tokens already issued stay
 * cryptographically valid until they expire. The signature check alone
 * would keep answering an agent that the learner already cut off.
 *
 * This asks the database whether the token's `session_id` still names a live
 * session of the same user (see the migration that defines
 * `public.agent_oauth_session_live`). It lives here rather than in
 * `src/lib/mcp`, because that directory holds no database client.
 *
 * Only positive answers are cached, and for at most a minute, so a
 * revocation takes effect within that window on a warm instance and
 * immediately on a cold one. A failed lookup is never cached and never
 * treated as live: it fails closed.
 */

export const AGENT_OAUTH_SESSION_LIVE_RPC = "agent_oauth_session_live";

/** Upper bound for how long a positive answer is reused. */
export const OAUTH_SESSION_LIVE_CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 1_024;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OAuthSessionLiveness =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "revoked" | "unavailable" };

/** key -> epoch milliseconds until which the positive answer may be reused */
const liveUntil = new Map<string, number>();

function cacheKey(sessionId: string, userId: string): string {
  return `${sessionId.toLowerCase()}:${userId.toLowerCase()}`;
}

function rememberLive(key: string, nowMs: number, tokenExpiresAtMs: number) {
  // Never reuse an answer past the token's own expiry.
  const until = Math.min(nowMs + OAUTH_SESSION_LIVE_CACHE_TTL_MS, tokenExpiresAtMs);
  if (until <= nowMs) return;
  liveUntil.delete(key);
  liveUntil.set(key, until);
  while (liveUntil.size > MAX_CACHE_ENTRIES) {
    const oldest = liveUntil.keys().next();
    if (oldest.done) break;
    liveUntil.delete(oldest.value);
  }
}

/** Test seam: forget every cached positive answer. */
export function clearOAuthSessionLivenessCache(): void {
  liveUntil.clear();
}

export async function checkOAuthSessionLive(
  sessionId: string,
  userId: string,
  now: Date,
  tokenExpiresAtSeconds: number,
): Promise<OAuthSessionLiveness> {
  if (!UUID_PATTERN.test(sessionId) || !UUID_PATTERN.test(userId)) {
    return { ok: false, reason: "revoked" };
  }

  const nowMs = now.getTime();
  const key = cacheKey(sessionId, userId);
  const cached = liveUntil.get(key);
  if (cached !== undefined) {
    if (cached > nowMs) return { ok: true };
    liveUntil.delete(key);
  }

  const client = tryCreateServiceClient();
  if (!client) return { ok: false, reason: "unavailable" };

  let live: unknown;
  try {
    const { data, error } = await client.rpc(AGENT_OAUTH_SESSION_LIVE_RPC, {
      p_session_id: sessionId,
      p_user_id: userId,
    });
    if (error) {
      reportApiError({ step: "supabase-read", error });
      return { ok: false, reason: "unavailable" };
    }
    live = data;
  } catch (error) {
    reportApiError({ step: "supabase-read", error });
    return { ok: false, reason: "unavailable" };
  }

  if (live === true) {
    rememberLive(key, nowMs, tokenExpiresAtSeconds * 1000);
    return { ok: true };
  }
  if (live === false) return { ok: false, reason: "revoked" };
  // Anything but a boolean is not an answer to the question asked.
  return { ok: false, reason: "unavailable" };
}
