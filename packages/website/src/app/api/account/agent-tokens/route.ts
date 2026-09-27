import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { AGENT_ACCESS_TOKENS_TABLE } from "@/lib/agent-access/personal-tokens";
import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import { isAgentAccessReady } from "@/lib/provider-readiness";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import {
  AGENT_ACCESS_TOKEN_NAME_MAX_LENGTH,
  MAX_ACTIVE_AGENT_ACCESS_TOKENS,
  mintPersonalAccessToken,
} from "./mint";

/**
 * Personal access tokens for agent clients.
 *
 * POST mints one. The clear token is in that response and nowhere else: it is
 * never written to the database, never logged, and never part of the account
 * export. DELETE revokes one by id.
 *
 * Node runtime, never edge: minting uses the Node CSPRNG and the SHA-256
 * digest from `node:crypto`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/account/agent-tokens";
const MAX_PAYLOAD_BYTES = 4 * 1024;

// Minting and revoking are rare account actions. One shared hourly budget
// pairs an account ceiling with an independent client ceiling, so neither
// address rotation nor cheap account creation widens the other.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_RATE_LIMIT_MAX = 30;
const CLIENT_RATE_LIMIT_MAX = 200;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ownerBindingSchema = z
  .object({ expectedOwnerId: z.string().trim().min(1).max(256) })
  .passthrough();

const mintSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
    name: z
      .string()
      .trim()
      .min(1)
      .max(AGENT_ACCESS_TOKEN_NAME_MAX_LENGTH)
      // Control characters are the one hazard in an owner-chosen label: they
      // survive into the audit trail's client column and into log lines.
      .refine((value) => !/\p{Cc}/u.test(value), "Invalid token name"),
  })
  .strict();

const revokeSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
    tokenId: z.string().trim().regex(UUID_PATTERN, "Invalid token id"),
  })
  .strict();

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]
>;
type RequireUserResult =
  | { readonly ok: false; readonly response: NextResponse }
  | { readonly ok: true; readonly user: AuthenticatedUser };

async function requireUser(): Promise<RequireUserResult> {
  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({ route: ROUTE, step: "auth-get-user", error });
    return {
      ok: false,
      response: privateJson({ error: "auth_unavailable" }, { status: 503 }),
    };
  }
  const { configured, user, error: authError } = auth;
  if (!configured) {
    return {
      ok: false,
      response: privateJson({ error: "auth_not_configured" }, { status: 503 }),
    };
  }
  if (authError) {
    // Supabase Auth unreachable: not the same as "logged out". Report and
    // answer 503 so an outage does not masquerade as an auth failure.
    reportApiError({ route: ROUTE, step: "auth-get-user", error: authError });
    return {
      ok: false,
      response: privateJson({ error: "auth_unavailable" }, { status: 503 }),
    };
  }
  if (!user) {
    return {
      ok: false,
      response: privateJson({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

async function reserveBudget(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "account-agent-tokens",
        request,
        userId,
      ),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("account-agent-tokens-ip", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: CLIENT_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return privateJson({ error: "rate_limit_unavailable" }, { status: 503 });
  }
  if (!clientAllowed) {
    return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
  }
  return null;
}

type ParsedBody =
  | { readonly ok: false; readonly response: NextResponse }
  | { readonly ok: true; readonly value: unknown };

async function readOwnerBoundBody(
  request: Request,
  userId: string,
): Promise<ParsedBody> {
  const body = await readBoundedJson(request, MAX_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return {
      ok: false,
      response: privateJson({ error: "payload_too_large" }, { status: 413 }),
    };
  }
  const value = body.ok ? body.value : null;
  const binding = ownerBindingSchema.safeParse(value);
  if (!binding.success) {
    return {
      ok: false,
      response: privateJson({ error: "invalid_owner_binding" }, { status: 400 }),
    };
  }
  if (binding.data.expectedOwnerId !== userId) {
    // The cookie-bound session changed after the page rendered. Never mint or
    // revoke a credential for an account the browser did not mean.
    return {
      ok: false,
      response: privateJson({ error: "account_owner_mismatch" }, { status: 409 }),
    };
  }
  return { ok: true, value };
}

/** Count of tokens the account can still present. Revoked rows are retained. */
async function countActiveTokens(
  client: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await client
    .from(AGENT_ACCESS_TOKENS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson({ error: "unsupported_media_type" }, { status: 415 });
  }
  // Fail closed: with agent access off, a minted token would authorize
  // nothing, so the platform does not hand one out.
  if (!isAgentAccessReady()) {
    return privateJson({ error: "agent_access_disabled" }, { status: 503 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limited = await reserveBudget(request, auth.user.id);
  if (limited) return limited;

  const body = await readOwnerBoundBody(request, auth.user.id);
  if (!body.ok) return body.response;

  const parsed = mintSchema.safeParse(body.value);
  if (!parsed.success) {
    return privateJson({ error: "invalid_token_name" }, { status: 400 });
  }

  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "token_store_unavailable" }, { status: 503 });
  }

  let activeBefore: number;
  try {
    activeBefore = await countActiveTokens(serviceClient, auth.user.id);
  } catch (error) {
    reportApiError({ route: ROUTE, step: "supabase-read", error, request });
    return privateJson({ error: "token_mint_failed" }, { status: 500 });
  }
  if (activeBefore >= MAX_ACTIVE_AGENT_ACCESS_TOKENS) {
    return privateJson(
      { error: "token_limit", limit: MAX_ACTIVE_AGENT_ACCESS_TOKENS },
      { status: 409 },
    );
  }

  let minted;
  try {
    minted = await mintPersonalAccessToken();
  } catch (error) {
    reportApiError({ route: ROUTE, step: "unhandled", error, request });
    return privateJson({ error: "token_mint_failed" }, { status: 500 });
  }

  let inserted;
  try {
    const { data, error } = await serviceClient
      .from(AGENT_ACCESS_TOKENS_TABLE)
      .insert({
        user_id: auth.user.id,
        name: parsed.data.name,
        prefix: minted.prefix,
        token_hash: minted.tokenHash,
      })
      .select("id, name, prefix, created_at")
      .single();
    if (error) throw error;
    inserted = data as {
      id: string;
      name: string;
      prefix: string;
      created_at: string;
    };
  } catch (error) {
    reportApiError({ route: ROUTE, step: "supabase-insert", error, request });
    return privateJson({ error: "token_mint_failed" }, { status: 500 });
  }

  // The ceiling is checked before and after the insert. Two concurrent mints
  // can both pass the first check; the second check sees the row the other
  // request wrote, and the loser withdraws its own token rather than leaving
  // an account holding six live credentials.
  let activeAfter: number;
  try {
    activeAfter = await countActiveTokens(serviceClient, auth.user.id);
  } catch (error) {
    // The confirmation read failed, not the insert. The pre-check already
    // established there was room, so the account keeps the token it just
    // asked for rather than losing it to an unrelated store hiccup.
    reportApiError({ route: ROUTE, step: "supabase-read", error, request });
    activeAfter = activeBefore + 1;
  }
  if (activeAfter > MAX_ACTIVE_AGENT_ACCESS_TOKENS) {
    try {
      await serviceClient
        .from(AGENT_ACCESS_TOKENS_TABLE)
        .delete()
        .eq("id", inserted.id)
        .eq("user_id", auth.user.id);
    } catch (error) {
      reportApiError({ route: ROUTE, step: "supabase-delete", error, request });
    }
    return privateJson(
      { error: "token_limit", limit: MAX_ACTIVE_AGENT_ACCESS_TOKENS },
      { status: 409 },
    );
  }

  // The only response that will ever carry the clear token.
  return privateJson(
    {
      ok: true,
      ownerId: auth.user.id,
      token: minted.token,
      tokenShownOnce: true,
      id: inserted.id,
      name: inserted.name,
      prefix: inserted.prefix,
      createdAt: inserted.created_at,
      activeTokens: activeAfter,
      limit: MAX_ACTIVE_AGENT_ACCESS_TOKENS,
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson({ error: "unsupported_media_type" }, { status: 415 });
  }
  // Revocation is deliberately not gated on the readiness predicate. Minting a
  // credential is a new capability and fails closed; withdrawing one is the
  // off switch and must keep working even while the surface is disabled.

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limited = await reserveBudget(request, auth.user.id);
  if (limited) return limited;

  const body = await readOwnerBoundBody(request, auth.user.id);
  if (!body.ok) return body.response;

  const parsed = revokeSchema.safeParse(body.value);
  if (!parsed.success) {
    return privateJson({ error: "invalid_token_id" }, { status: 400 });
  }

  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "token_store_unavailable" }, { status: 503 });
  }

  // Ownership is part of the statement, not a prior read: a row that is not
  // this account's, or is already revoked, matches nothing and updates nothing.
  let revoked;
  try {
    const { data, error } = await serviceClient
      .from(AGENT_ACCESS_TOKENS_TABLE)
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", parsed.data.tokenId)
      .eq("user_id", auth.user.id)
      .is("revoked_at", null)
      .select("id, name, prefix, revoked_at")
      .maybeSingle();
    if (error) throw error;
    revoked = data as {
      id: string;
      name: string;
      prefix: string;
      revoked_at: string;
    } | null;
  } catch (error) {
    reportApiError({ route: ROUTE, step: "supabase-write", error, request });
    return privateJson({ error: "token_revoke_failed" }, { status: 500 });
  }

  if (!revoked) {
    return privateJson({ error: "token_not_found" }, { status: 404 });
  }

  return privateJson({
    ok: true,
    ownerId: auth.user.id,
    id: revoked.id,
    name: revoked.name,
    prefix: revoked.prefix,
    revokedAt: revoked.revoked_at,
  });
}
