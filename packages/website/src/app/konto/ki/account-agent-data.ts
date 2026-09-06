import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server reads for the three account-scoped regions on /konto/ki.
 *
 * Every function returns an outcome instead of throwing, and every row is
 * validated before it becomes a view model. An unreadable region must render
 * its own failure state: an empty list where the store actually failed would
 * tell a learner that no agent ever touched their account, which is the one
 * thing an audit trail must never get wrong.
 *
 * All three reads go through the caller's own cookie-bound client, so the
 * row-level policies (`(select auth.uid()) = user_id`) are what scopes them.
 * The owner id is still passed and filtered on, because a policy is a floor,
 * not a substitute for asking the right question.
 */

export const AGENT_ACCESS_EVENTS_TABLE = "agent_access_events";
export const AGENT_ACCESS_TOKENS_TABLE = "agent_access_tokens";

/** The account page shows the most recent 50 accesses and no more. */
export const AGENT_ACCESS_EVENT_LIMIT = 50;
/** An account may hold five active tokens; revoked rows are retained. */
const AGENT_TOKEN_ROW_LIMIT = 50;
/** A registered client list this long is already pathological. */
const OAUTH_GRANT_LIMIT = 50;
const GRANT_SCOPE_LIMIT = 16;
const GRANT_TEXT_MAX_LENGTH = 200;

/**
 * Exactly the columns the browser role holds a grant for. The token table
 * refuses `select *` by design, so naming them is required, not stylistic.
 */
const AGENT_TOKEN_COLUMNS =
  "id, name, prefix, created_at, last_used_at, revoked_at";
const AGENT_EVENT_COLUMNS = "id, client, tool, ok, duration_ms, created_at";

export interface AgentAccessEventView {
  readonly id: string;
  readonly client: string;
  readonly tool: string;
  readonly ok: boolean;
  readonly durationMs: number;
  readonly createdAt: string;
}

export interface AgentTokenView {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly revokedAt: string | null;
}

export interface OAuthGrantView {
  readonly clientId: string;
  readonly clientName: string | null;
  readonly clientUri: string | null;
  readonly scopes: readonly string[];
  readonly grantedAt: string | null;
}

/**
 * `unavailable` is a third state next to "some rows" and "no rows". The two
 * are not interchangeable in any of these regions.
 */
export type RegionOutcome<Item> =
  | { readonly ok: true; readonly items: readonly Item[] }
  | { readonly ok: false; readonly reason: "unavailable" | "not-configured" };

function field(source: unknown, key: string): unknown {
  if (typeof source !== "object" || source === null) return undefined;
  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
}

function text(value: unknown, maxLength = GRANT_TEXT_MAX_LENGTH): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function instant(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function toEvent(row: unknown): AgentAccessEventView | null {
  const id = text(field(row, "id"), 64);
  const client = text(field(row, "client"), 96);
  const tool = text(field(row, "tool"), 64);
  const createdAt = instant(field(row, "created_at"));
  const durationMs = field(row, "duration_ms");
  const ok = field(row, "ok");
  if (
    id === null ||
    client === null ||
    tool === null ||
    createdAt === null ||
    typeof ok !== "boolean" ||
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs < 0
  ) {
    return null;
  }
  return { id, client, tool, ok, durationMs: Math.round(durationMs), createdAt };
}

function toToken(row: unknown): AgentTokenView | null {
  const id = text(field(row, "id"), 64);
  const name = text(field(row, "name"), 64);
  const prefix = text(field(row, "prefix"), 64);
  const createdAt = instant(field(row, "created_at"));
  if (id === null || name === null || prefix === null || createdAt === null) {
    return null;
  }
  return {
    id,
    name,
    prefix,
    createdAt,
    lastUsedAt: instant(field(row, "last_used_at")),
    revokedAt: instant(field(row, "revoked_at")),
  };
}

/**
 * A grant describes a third party that registered its own display strings, so
 * everything except the client id is optional and bounded. Without a client id
 * the row cannot be revoked, which makes it useless to show.
 */
export function toGrant(entry: unknown): OAuthGrantView | null {
  const client = field(entry, "client");
  const clientId = text(field(client, "id"), 64);
  if (clientId === null) return null;
  const rawScopes = field(entry, "scopes");
  const scopes = Array.isArray(rawScopes)
    ? rawScopes
        .map((scope) => text(scope, 64))
        .filter((scope): scope is string => scope !== null)
        .slice(0, GRANT_SCOPE_LIMIT)
    : [];
  return {
    clientId,
    clientName: text(field(client, "name")),
    clientUri: text(field(client, "uri"), 2_048),
    scopes,
    grantedAt: instant(field(entry, "granted_at")),
  };
}

export async function fetchAgentAccessEvents(
  supabase: SupabaseClient,
  userId: string,
): Promise<RegionOutcome<AgentAccessEventView>> {
  try {
    const { data, error } = await supabase
      .from(AGENT_ACCESS_EVENTS_TABLE)
      .select(AGENT_EVENT_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(AGENT_ACCESS_EVENT_LIMIT);
    if (error || !Array.isArray(data)) {
      return { ok: false, reason: "unavailable" };
    }
    return {
      ok: true,
      items: data
        .map(toEvent)
        .filter((event): event is AgentAccessEventView => event !== null),
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function fetchAgentTokens(
  supabase: SupabaseClient,
  userId: string,
): Promise<RegionOutcome<AgentTokenView>> {
  try {
    const { data, error } = await supabase
      .from(AGENT_ACCESS_TOKENS_TABLE)
      .select(AGENT_TOKEN_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(AGENT_TOKEN_ROW_LIMIT);
    if (error || !Array.isArray(data)) {
      return { ok: false, reason: "unavailable" };
    }
    return {
      ok: true,
      items: data
        .map(toToken)
        .filter((token): token is AgentTokenView => token !== null),
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

type OAuthGrantsApi = {
  listGrants: () => Promise<{ data: unknown; error: unknown }>;
};

/**
 * The OAuth 2.1 server namespace exists on `@supabase/auth-js` 2.112 but only
 * answers when the project has the server enabled. Resolving it defensively
 * keeps an older client from throwing on property access, and lets the page
 * separate "this deployment has no grant path" from "the call failed".
 */
export function oauthGrantsApi(
  supabase: Pick<SupabaseClient, "auth">,
): OAuthGrantsApi | null {
  const api = field(supabase.auth, "oauth");
  if (typeof field(api, "listGrants") !== "function") return null;
  return api as OAuthGrantsApi;
}

export async function fetchOAuthGrants(
  supabase: Pick<SupabaseClient, "auth">,
): Promise<RegionOutcome<OAuthGrantView>> {
  const api = oauthGrantsApi(supabase);
  if (!api) return { ok: false, reason: "not-configured" };

  let result: { data: unknown; error: unknown };
  try {
    result = await api.listGrants();
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (result.error || !Array.isArray(result.data)) {
    return { ok: false, reason: "unavailable" };
  }
  return {
    ok: true,
    items: result.data
      .slice(0, OAUTH_GRANT_LIMIT)
      .map(toGrant)
      .filter((grant): grant is OAuthGrantView => grant !== null),
  };
}
