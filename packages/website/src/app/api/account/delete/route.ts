import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// Account deletion is irreversible and rare: 3 attempts per client per 24h.
// Uses the durable, cross-region limiter (Supabase RPC with in-memory
// fallback) keyed on a secret-keyed HMAC of the Vercel-trusted client IP.
const RATE_LIMIT_WINDOW_SECONDS = 24 * 60 * 60;
const USER_RATE_LIMIT_MAX = 3;
const CLIENT_RATE_LIMIT_MAX = 30;
const MAX_DELETE_PAYLOAD_BYTES = 4 * 1024;
const RECENT_AUTH_MAX_AGE_SECONDS = 15 * 60;
const MAX_AUTH_CLOCK_SKEW_SECONDS = 60;
const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const APP_AUTH_METHODS = new Set(["magiclink", "otp", "email/signup"]);
const deleteBodySchema = z.object({
  expectedOwnerId: z.string().trim().min(1).max(256),
}).strict();

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

function hasErrorCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  try {
    return Reflect.get(error, "code") === code;
  } catch {
    return false;
  }
}

function hasIndependentAsymmetricClaims(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  try {
    const header = Reflect.get(data, "header");
    const signature = Reflect.get(data, "signature");
    if (!header || typeof header !== "object" || Array.isArray(header)) {
      return false;
    }
    const algorithm = Reflect.get(header, "alg");
    const keyId = Reflect.get(header, "kid");
    return (
      typeof algorithm === "string" &&
      algorithm.length > 0 &&
      !algorithm.startsWith("HS") &&
      typeof keyId === "string" &&
      keyId.length > 0 &&
      signature instanceof Uint8Array
    );
  } catch {
    return false;
  }
}

function deleteErrorRequiresReconciliation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return true;
  try {
    const name = Reflect.get(error, "name");
    const status = Reflect.get(error, "status");
    return (
      name === "AuthRetryableFetchError" ||
      name === "AuthUnknownError" ||
      status === 0 ||
      typeof status !== "number" ||
      !Number.isFinite(status) ||
      (typeof status === "number" &&
        status >= 500)
    );
  } catch {
    return true;
  }
}

function hasRecentSessionAuthentication(
  claims: Record<string, unknown>,
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const audience = claims.aud;
  const authenticatedAudience =
    audience === "authenticated" ||
    (Array.isArray(audience) && audience.includes("authenticated"));
  if (
    claims.sub !== userId ||
    claims.role !== "authenticated" ||
    claims.is_anonymous === true ||
    !authenticatedAudience ||
    typeof claims.session_id !== "string" ||
    !SESSION_ID_PATTERN.test(claims.session_id) ||
    !Array.isArray(claims.amr)
  ) {
    return false;
  }

  return claims.amr.some((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry)
    ) {
      return false;
    }
    const method = Reflect.get(entry, "method");
    const timestamp = Reflect.get(entry, "timestamp");
    if (
      typeof method !== "string" ||
      !APP_AUTH_METHODS.has(method) ||
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp)
    ) {
      return false;
    }
    const age = nowSeconds - timestamp;
    return (
      age >= -MAX_AUTH_CLOCK_SKEW_SECONDS &&
      age <= RECENT_AUTH_MAX_AGE_SECONDS
    );
  });
}

export async function DELETE(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson(
      { error: "unsupported_media_type" },
      { status: 415 },
    );
  }
  let authClient;
  try {
    authClient = await createAuthServerClient();
  } catch (error) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-create-client",
      error,
    });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  if (!authClient) {
    return privateJson({ error: "auth_not_configured" }, { status: 503 });
  }

  let sessionResult;
  try {
    sessionResult = await authClient.auth.getSession();
  } catch (error) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-get-session",
      error,
    });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  if (sessionResult.error) {
    if (sessionResult.error.name === "AuthSessionMissingError") {
      return privateJson({ error: "unauthorized" }, { status: 401 });
    }
    reportApiError({
      route: "/api/account/delete",
      step: "auth-get-session",
      error: sessionResult.error,
    });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  const { session } = sessionResult.data;
  if (!session?.access_token) {
    return privateJson({ error: "unauthorized" }, { status: 401 });
  }

  const body = await readBoundedJson(request, MAX_DELETE_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }
  const parsedBody = deleteBodySchema.safeParse(
    body.ok ? body.value : null,
  );
  if (!parsedBody.success) {
    return privateJson(
      { error: "invalid_owner_binding" },
      { status: 400 },
    );
  }
  const expectedOwnerId = parsedBody.data.expectedOwnerId;

  // getSession() supplies the cookie token but is not itself an authorization
  // decision. Authenticate that exact token with the Auth server, then verify
  // its signed claims before using any identity or freshness information.
  let userResult;
  let claimsResult;
  try {
    [userResult, claimsResult] = await Promise.all([
      authClient.auth.getUser(session.access_token),
      authClient.auth.getClaims(session.access_token),
    ]);
  } catch (error) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-verify-session",
      error,
    });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  const user = userResult.data.user;
  const claims = claimsResult.data?.claims as
    | Record<string, unknown>
    | undefined;
  if (
    hasErrorCode(userResult.error, "user_not_found") &&
    !claimsResult.error &&
    claims &&
    hasIndependentAsymmetricClaims(claimsResult.data) &&
    hasRecentSessionAuthentication(claims, expectedOwnerId)
  ) {
    // Another device may have deleted this exact signed owner after this
    // browser obtained its cookie. Independent asymmetric claim verification
    // preserves the owner binding even though getUser now reports absence.
    let localSignOutError: unknown;
    try {
      ({ error: localSignOutError } = await authClient.auth.signOut({
        scope: "local",
      }));
    } catch (error) {
      reportApiError({
        route: "/api/account/delete",
        step: "auth-clear-session",
        error,
      });
    }
    if (localSignOutError) {
      reportApiError({
        route: "/api/account/delete",
        step: "auth-clear-session",
        error: localSignOutError,
      });
    }
    return privateJson({
      deleted: true,
      ownerId: expectedOwnerId,
    });
  }
  if (hasErrorCode(userResult.error, "user_not_found")) {
    // Symmetric getClaims() falls back to getUser(), so account absence cannot
    // establish an owner-bound success in that configuration.
    return privateJson(
      { error: "delete_status_unknown" },
      { status: 503 },
    );
  }
  if (
    userResult.error ||
    claimsResult.error ||
    !user ||
    !claimsResult.data
  ) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-verify-session",
      error: userResult.error ?? claimsResult.error ?? new Error("Verified session missing"),
    });
    return privateJson({ error: "auth_unavailable" }, { status: 503 });
  }
  const userId = user.id;

  if (expectedOwnerId !== userId) {
    return privateJson(
      { error: "account_owner_mismatch" },
      { status: 409 },
    );
  }

  // JWT issuance time is not a reauthentication timestamp: refresh tokens
  // issue fresh JWTs for old sessions. The detailed AMR entry records when
  // this specific session actually authenticated.
  if (
    !hasRecentSessionAuthentication(
      claimsResult.data.claims as Record<string, unknown>,
      userId,
    )
  ) {
    return privateJson(
      { error: "reauthentication_required" },
      { status: 403 },
    );
  }

  // Pair the per-user budget with an independent trusted-client ceiling.
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "account-delete",
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
      key: await hashedClientRateLimitKey("account-delete-ip", request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: CLIENT_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: "/api/account/delete",
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return privateJson({ error: "rate_limit_unavailable" }, { status: 503 });
  }
  if (!clientAllowed) {
    return privateJson({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  // user_course_progress rows are deleted via ON DELETE CASCADE on the user_id FK
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-create-client",
      error,
    });
    return privateJson({ error: "admin_client_unavailable" }, { status: 503 });
  }

  // Best-effort revoke every refresh session before deleting the identity.
  // A concurrent deletion can remove the session before this call reaches
  // Auth, and transport failure does not make account deletion unsafe:
  // deleteUser is the authoritative operation, cascades owned rows, and makes
  // subsequent getUser() verification fail. Never classify a revocation error
  // as proof that another same-account request did not already delete the user.
  let revokeError: unknown;
  try {
    ({ error: revokeError } = await adminClient.auth.admin.signOut(
      session.access_token,
      "global",
    ));
  } catch (error) {
    revokeError = error;
  }
  if (revokeError) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-revoke-sessions",
      error: revokeError,
    });
  }

  async function reconcileDeleteOutcome(
    deleteError: unknown,
  ): Promise<Response | null> {
    let verification;
    try {
      verification = await adminClient.auth.admin.getUserById(userId);
    } catch (verificationError) {
      reportApiError({
        route: "/api/account/delete",
        step: "account-delete",
        error: new AggregateError(
          [deleteError, verificationError],
          "Account deletion and reconciliation failed",
        ),
      });
      return privateJson(
        { error: "delete_status_unknown" },
        { status: 503 },
      );
    }

    if (hasErrorCode(verification.error, "user_not_found")) {
      reportApiError({
        route: "/api/account/delete",
        step: "account-delete",
        error: deleteError,
      });
      return null;
    }

    if (!verification.error && verification.data.user) {
      reportApiError({
        route: "/api/account/delete",
        step: "account-delete",
        error: deleteError,
      });
      // This GET is only a point-in-time observation. A timed-out or otherwise
      // unresolved DELETE can still commit after the read observes the user,
      // so presence cannot safely downgrade the outcome to a definite failure.
      return privateJson(
        { error: "delete_status_unknown" },
        { status: 503 },
      );
    }

    // An error other than the explicit not-found code, or a response with
    // neither a user nor a not-found error, cannot establish the outcome.
    reportApiError({
      route: "/api/account/delete",
      step: "account-delete",
      error: verification.error
        ? new AggregateError(
            [deleteError, verification.error],
            "Account deletion status is unknown",
          )
        : deleteError,
    });
    return privateJson(
      { error: "delete_status_unknown" },
      { status: 503 },
    );
  }

  try {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      if (hasErrorCode(error, "user_not_found")) {
        // Another same-account request may have completed between the verified
        // owner check and this delete call. Absence is the desired idempotent
        // state, so continue through cookie cleanup and explicit confirmation.
      } else if (deleteErrorRequiresReconciliation(error)) {
        // auth-js resolves network, infrastructure, and undecodable responses
        // as `{ error }`. None proves whether DELETE committed.
        const reconciliationResponse = await reconcileDeleteOutcome(error);
        if (reconciliationResponse) return reconciliationResponse;
      } else {
        reportApiError({
          route: "/api/account/delete",
          step: "account-delete",
          error,
        });
        return privateJson({ error: "delete_failed" }, { status: 500 });
      }
    }
  } catch (deleteError) {
    // A transport rejection does not prove whether the Auth service committed
    // the deletion. Reconcile once so a completed deletion still clears local
    // browser state, while an unverifiable outcome remains explicitly unknown.
    const reconciliationResponse =
      await reconcileDeleteOutcome(deleteError);
    if (reconciliationResponse) return reconciliationResponse;
  }

  // Remove the cookie-backed session from this response as well. The global
  // revocation above may make the second Auth call answer 401; auth-js treats
  // that as an expected stale session and still expires local cookies.
  let localSignOutError: unknown;
  try {
    ({ error: localSignOutError } = await authClient.auth.signOut({
      scope: "local",
    }));
  } catch (error) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-clear-session",
      error,
    });
  }
  if (localSignOutError) {
    reportApiError({
      route: "/api/account/delete",
      step: "auth-clear-session",
      error: localSignOutError,
    });
  }

  // Client clears the non-auth learning cache and redirects on success.
  return privateJson({ deleted: true, ownerId: userId });
}
