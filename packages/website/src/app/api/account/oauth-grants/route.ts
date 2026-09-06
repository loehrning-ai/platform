import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";

/**
 * Withdraw one OAuth grant the account owner previously approved.
 *
 * Only DELETE. Granting happens on the consent page, listing happens on
 * /konto/ki through the same auth client, and neither belongs here.
 *
 * Deliberately not gated on a readiness predicate. Issuing a grant is a new
 * capability and fails closed elsewhere; withdrawing one is the off switch for
 * a credential a third party already holds, and an off switch that stops
 * working when a feature flag flips is not an off switch.
 *
 * The revocation runs on the caller's own cookie-bound session, because the
 * authorization server scopes the grant to that session's user. There is no
 * service-role path to reach for and none is wanted: this route can only ever
 * revoke the caller's own grants.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/account/oauth-grants";
const MAX_PAYLOAD_BYTES = 4 * 1024;

// Revoking is a rare, deliberate account action. The pair of budgets keeps a
// single account and a single address independently bounded.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_RATE_LIMIT_MAX = 30;
const CLIENT_RATE_LIMIT_MAX = 200;

/**
 * The client id is interpolated into the authorization server's query string.
 * It is accepted only as an opaque URL-safe token, so a crafted value cannot
 * become a second parameter or address a different endpoint.
 */
const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const revokeSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
    clientId: z.string().trim().regex(CLIENT_ID_PATTERN, "Invalid client id"),
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
type AuthServerClient = NonNullable<
  Awaited<ReturnType<typeof createAuthServerClient>>
>;
type RequireUserResult =
  | { readonly ok: false; readonly response: NextResponse }
  | {
      readonly ok: true;
      readonly user: AuthenticatedUser;
      readonly supabase: AuthServerClient;
    };

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
  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    reportApiError({ route: ROUTE, step: "auth-create-client", error });
    return {
      ok: false,
      response: privateJson({ error: "auth_unavailable" }, { status: 503 }),
    };
  }
  if (!supabase) {
    return {
      ok: false,
      response: privateJson({ error: "auth_not_configured" }, { status: 503 }),
    };
  }
  return { ok: true, user, supabase };
}

function field(source: unknown, key: string): unknown {
  if (typeof source !== "object" || source === null) return undefined;
  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
}

type OAuthRevokeApi = {
  revokeGrant: (options: {
    clientId: string;
  }) => Promise<{ data: unknown; error: unknown }>;
};

/**
 * The OAuth 2.1 namespace exists on auth-js 2.112 but only answers when the
 * project enables the server. Resolving it structurally keeps a client built
 * against an older version from throwing on property access.
 */
function oauthRevokeApi(
  supabase: Pick<SupabaseClient, "auth">,
): OAuthRevokeApi | null {
  const api = field(supabase.auth, "oauth");
  if (typeof field(api, "revokeGrant") !== "function") return null;
  return api as OAuthRevokeApi;
}

export async function DELETE(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson({ error: "unsupported_media_type" }, { status: 415 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "account-oauth-grants",
        request,
        auth.user.id,
      ),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey("account-oauth-grants-ip", request),
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

  const body = await readBoundedJson(request, MAX_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }

  const parsed = revokeSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    return privateJson({ error: "invalid_grant_request" }, { status: 400 });
  }
  if (parsed.data.expectedOwnerId !== auth.user.id) {
    // The cookie-bound session changed after the page rendered. Never revoke
    // a grant in account B because account A's tab asked for it.
    return privateJson({ error: "account_owner_mismatch" }, { status: 409 });
  }

  const api = oauthRevokeApi(auth.supabase);
  if (!api) {
    return privateJson({ error: "oauth_server_unavailable" }, { status: 503 });
  }

  let result: { data: unknown; error: unknown };
  try {
    result = await api.revokeGrant({ clientId: parsed.data.clientId });
  } catch (error) {
    reportApiError({ route: ROUTE, step: "oauth-revoke-grant", error });
    return privateJson({ error: "grant_revoke_failed" }, { status: 502 });
  }
  if (result.error) {
    reportApiError({
      route: ROUTE,
      step: "oauth-revoke-grant",
      error: result.error,
    });
    return privateJson({ error: "grant_revoke_failed" }, { status: 502 });
  }

  return privateJson({
    ok: true,
    ownerId: auth.user.id,
    clientId: parsed.data.clientId,
  });
}
