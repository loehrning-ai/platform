import "server-only";

import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reportApiError } from "@/lib/observability/api-error";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import { personalTokenClientLabel } from "./record";

/**
 * Personal access tokens: the format, the digest, and the lookup.
 *
 * A clear token exists exactly twice in its life. It is generated once by the
 * mint route and shown to its owner once. What is stored is a SHA-256 digest
 * and a short non-secret display prefix, so a disclosure of the table yields
 * nothing a client could present.
 *
 * This module is the single source of that format. The mint route, the
 * account page, and the bearer resolver all read it from here, so a token
 * cannot be created in a shape the resolver would refuse.
 *
 * The clear token is never logged, never reported to error tracking, and
 * never returned by anything below.
 */

export const AGENT_ACCESS_TOKENS_TABLE = "agent_access_tokens";

/**
 * Service-role function that answers whether a token owner may still use
 * one: the account exists, is not banned, and is not soft-deleted. Defined in
 * supabase/migrations/20260927100200_add_agent_access_token_expiry.sql.
 */
export const AGENT_ACCESS_TOKEN_OWNER_ACTIVE_RPC =
  "agent_access_token_owner_active";

/** Every minted token begins with this. */
export const PERSONAL_ACCESS_TOKEN_PREFIX = "lat_";
/** 32 random bytes, base64url encoded without padding, is 43 characters. */
export const PERSONAL_ACCESS_TOKEN_SECRET_BYTES = 32;
export const PERSONAL_ACCESS_TOKEN_SECRET_LENGTH = 43;
/** Characters of the secret kept in the non-secret display prefix. */
export const PERSONAL_ACCESS_TOKEN_DISPLAY_LENGTH = 8;

const PERSONAL_ACCESS_TOKEN_PATTERN = new RegExp(
  `^${PERSONAL_ACCESS_TOKEN_PREFIX}[A-Za-z0-9_-]{${PERSONAL_ACCESS_TOKEN_SECRET_LENGTH}}$`,
);

export function isPersonalAccessToken(value: string): boolean {
  return PERSONAL_ACCESS_TOKEN_PATTERN.test(value);
}

/**
 * The non-secret fragment stored beside the digest so an owner can tell two
 * tokens apart in the account without ever seeing the secret again.
 */
export function personalAccessTokenDisplayPrefix(token: string): string | null {
  if (!isPersonalAccessToken(token)) return null;
  return token.slice(
    0,
    PERSONAL_ACCESS_TOKEN_PREFIX.length + PERSONAL_ACCESS_TOKEN_DISPLAY_LENGTH,
  );
}

/** Lowercase hex SHA-256 digest, the only representation ever persisted. */
export async function hashPersonalAccessToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export type PersonalTokenLookup =
  | {
      readonly ok: true;
      readonly userId: string;
      /** Audit-trail label for the token, `pat:<name>`. */
      readonly client: string;
    }
  | {
      readonly ok: false;
      /**
       * `unknown`: no such token. `revoked`: its owner withdrew it.
       * `expired`: its expiry has passed. `account_inactive`: the owning
       * account is banned or soft-deleted. `unavailable`: the store could not
       * answer, which is never read as a yes.
       */
      readonly reason:
        | "unknown"
        | "revoked"
        | "expired"
        | "account_inactive"
        | "unavailable";
    };

export type PersonalTokenRefusal = Extract<
  PersonalTokenLookup,
  { readonly ok: false }
>["reason"];

interface AgentAccessTokenRow {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly revoked_at: string | null;
  readonly expires_at: string | null;
}

/**
 * Ask the database whether the token owner's account is still in good
 * standing. Only a boolean is an answer; an error, a throw, or any other value
 * is `unavailable`, and the caller refuses the token.
 */
async function ownerStanding(
  client: SupabaseClient,
  userId: string,
): Promise<"active" | "inactive" | "unavailable"> {
  try {
    const { data, error } = await client.rpc(
      AGENT_ACCESS_TOKEN_OWNER_ACTIVE_RPC,
      { p_user_id: userId },
    );
    if (error) {
      reportApiError({ step: "supabase-read", error });
      return "unavailable";
    }
    if (data === true) return "active";
    if (data === false) return "inactive";
    return "unavailable";
  } catch (error) {
    reportApiError({ step: "supabase-read", error });
    return "unavailable";
  }
}

/**
 * Record that a token was used. Fire and forget on purpose: recognising a
 * credential must not wait for a write, and a failed touch must never turn a
 * valid token into a rejection.
 */
function touchLastUsedAt(tokenId: string, at: Date): void {
  const write = async (): Promise<void> => {
    try {
      const client = tryCreateServiceClient();
      if (!client) return;
      const { error } = await client
        .from(AGENT_ACCESS_TOKENS_TABLE)
        .update({ last_used_at: at.toISOString() })
        .eq("id", tokenId);
      if (error) reportApiError({ step: "supabase-write", error });
    } catch (error) {
      reportApiError({ step: "supabase-write", error });
    }
  };
  try {
    // Inside a request scope the touch runs once the response is out.
    after(() => write());
    return;
  } catch {
    // `after` throws outside a request scope (a scheduled job, a test).
  }
  try {
    void write().catch(() => undefined);
  } catch {
    // A bookkeeping write must never break the call it describes.
  }
}

/**
 * Recognise a presented token by its digest.
 *
 * The digest is what reaches the query; the clear token never does. The
 * select names its columns so `token_hash` stays out of the result set even
 * for the service role, which means a verifier value cannot be read back out
 * of the table by this path at all.
 *
 * A recognised token is accepted only while all of this holds, checked in
 * this order and each refused with its own reason:
 *
 * 1. its owner has not revoked it;
 * 2. its `expires_at` lies after `now` (the column is NOT NULL and capped at
 *    366 days after creation; an unreadable value fails closed);
 * 3. the owning account is neither banned nor soft-deleted, asked through
 *    `public.agent_access_token_owner_active`. Deleting the account removes
 *    the row itself through `ON DELETE CASCADE`.
 *
 * Nothing is cached, so a revocation, an expiry, or a ban takes effect on the
 * next call. `last_used_at` is touched only for an accepted token.
 */
export async function lookupPersonalAccessToken(
  token: string,
  now: Date,
): Promise<PersonalTokenLookup> {
  if (!isPersonalAccessToken(token)) return { ok: false, reason: "unknown" };

  const client = tryCreateServiceClient();
  if (!client) return { ok: false, reason: "unavailable" };

  let digest: string;
  try {
    digest = await hashPersonalAccessToken(token);
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  let row: AgentAccessTokenRow | null;
  try {
    const { data, error } = await client
      .from(AGENT_ACCESS_TOKENS_TABLE)
      .select("id, user_id, name, revoked_at, expires_at")
      .eq("token_hash", digest)
      .maybeSingle();
    if (error) {
      reportApiError({ step: "supabase-read", error });
      return { ok: false, reason: "unavailable" };
    }
    row = (data as AgentAccessTokenRow | null) ?? null;
  } catch (error) {
    reportApiError({ step: "supabase-read", error });
    return { ok: false, reason: "unavailable" };
  }

  if (!row) return { ok: false, reason: "unknown" };
  if (row.revoked_at !== null) return { ok: false, reason: "revoked" };

  const expiresAt =
    typeof row.expires_at === "string" ? Date.parse(row.expires_at) : Number.NaN;
  if (Number.isNaN(expiresAt)) return { ok: false, reason: "unavailable" };
  if (expiresAt <= now.getTime()) return { ok: false, reason: "expired" };

  const standing = await ownerStanding(client, row.user_id);
  if (standing === "inactive") {
    return { ok: false, reason: "account_inactive" };
  }
  if (standing !== "active") return { ok: false, reason: "unavailable" };

  touchLastUsedAt(row.id, now);

  return {
    ok: true,
    userId: row.user_id,
    client: personalTokenClientLabel(row.name),
  };
}
