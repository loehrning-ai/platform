import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAuthServerClient,
  getAuthenticatedUser,
} from "@/lib/supabase/auth-server";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import { hasJsonContentType, readBoundedJson } from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  mergeProgress,
  readLocalImportMarker,
  type MergeProgressResult,
} from "@/lib/progress/merge";
import {
  fetchUnifiedProgressForUser,
  isRowSizeViolation,
  upsertUnifiedProgressForUser,
} from "@/lib/progress/server-store";
import { UNIFIED_SCHEMA_VERSION } from "@/lib/progress/types";

// ─── POST /api/progress/import ──
//
// One-shot fold of a browser's ANONYMOUS localStorage namespace into the
// signed-in account. Same skeleton as PUT /api/progress: media type, session,
// paired rate limit, bounded body, strict schema, owner check, service-client
// write, private/no-store on every answer.
//
// Two things are specific to the import. The account state is read first
// through the COOKIE-BOUND client under RLS, so a second import is refused
// with 409 on the marker the first one left behind. And the anonymous
// namespace is only ever read here: nothing in this route writes back to it,
// so a failed or refused import leaves the browser's local data intact.

const MAX_IMPORT_PAYLOAD_BYTES = 262_144;

// Import is a once-per-account action, not ordinary sync traffic, so the
// budget only has to cover honest retries after a transport or conflict
// failure. Same durable, cross-region limiter as the sync route: an account
// budget paired with an independent client-IP ceiling, so neither IP rotation
// nor cheap account creation buys a fresh quota.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_RATE_LIMIT_MAX = 10;
const CLIENT_RATE_LIMIT_MAX = 100;

const ROUTE = "/api/progress/import";

const payloadSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
    // Validated by mergeProgress, which names the exact invalid path for the
    // 400 body instead of collapsing every shape error into one message.
    progress: z.unknown(),
  })
  .strict();

/** Only schema-owned, printable path segments may be echoed to a caller. */
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

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

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

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

function schemaIssuePath(issue: { readonly path: PropertyKey[] }): string {
  const segments = issue.path.map(String);
  if (segments.length === 0) return "body";
  return segments.every((segment) => SAFE_PATH_SEGMENT.test(segment))
    ? segments.join(".")
    : "body";
}

/** Translate a merge rejection into its named response. */
function rejectionResponse(
  rejection: Extract<MergeProgressResult, { ok: false }>,
): NextResponse {
  if (rejection.reason === "unsupported_schema_version") {
    return privateJson(
      {
        error: "unsupported_schema_version",
        path: rejection.path,
        expected: UNIFIED_SCHEMA_VERSION,
      },
      { status: 400 },
    );
  }
  if (rejection.reason === "invalid_import") {
    return privateJson(
      { error: "invalid_import", path: rejection.path },
      { status: 400 },
    );
  }
  // The remaining rejections describe server-side inputs the caller cannot
  // influence: our own stored rows, or our own clock. Neither is a bad
  // request, so neither answers 400.
  if (rejection.reason === "invalid_account") {
    reportApiError({
      route: ROUTE,
      step: "supabase-read",
      error: new Error("Stored account progress failed validation"),
    });
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }
  reportApiError({
    route: ROUTE,
    step: "supabase-write",
    error: new Error("Import marker timestamp failed validation"),
  });
  return privateJson({ error: "progress_write_failed" }, { status: 500 });
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return privateJson({ error: "unsupported_media_type" }, { status: 415 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        "progress-import",
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
      key: await hashedClientRateLimitKey("progress-import-ip", request),
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

  const body = await readBoundedJson(request, MAX_IMPORT_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return privateJson({ error: "payload_too_large" }, { status: 413 });
  }

  const parsed = payloadSchema.safeParse(body.ok ? body.value : null);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return privateJson(
      {
        error: "invalid_import",
        path: issue ? schemaIssuePath(issue) : "body",
      },
      { status: 400 },
    );
  }
  if (parsed.data.expectedOwnerId !== auth.user.id) {
    // The cookie-bound session changed after the browser picked its local
    // namespace. Never fold account A's snapshot into account B.
    return privateJson({ error: "progress_owner_mismatch" }, { status: 409 });
  }

  // Read under RLS with the cookie-bound client, the same way GET
  // /api/progress does. The service client is only reached for the write.
  let fetched;
  try {
    fetched = await fetchUnifiedProgressForUser(auth.supabase, auth.user.id);
  } catch (error) {
    reportApiError({ route: ROUTE, step: "supabase-read", error, request });
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }
  if (!fetched.ok) {
    reportApiError({
      route: ROUTE,
      step: "supabase-read",
      error: fetched.error,
    });
    return privateJson({ error: "progress_read_failed" }, { status: 500 });
  }

  const alreadyImportedAt = readLocalImportMarker(fetched.result.progress);
  if (alreadyImportedAt) {
    return privateJson(
      { error: "progress_already_imported", importedAt: alreadyImportedAt },
      { status: 409 },
    );
  }

  const importedAt = new Date().toISOString();
  const merge = mergeProgress({
    account: fetched.result.progress,
    incoming: parsed.data.progress,
    importedAt,
    courseResetAt: fetched.result.courseResetAt,
  });
  if (!merge.ok) return rejectionResponse(merge);

  // Mutations use the server-only service client after the cookie-bound
  // session has been verified with getUser(). The authenticated browser role
  // has no direct write grants, so this validated, rate-limited path is the
  // only way an import can reach the table, and user.id stays server-derived.
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "progress_store_unavailable" }, { status: 503 });
  }

  // server-store writes course rows before the ledger row that carries the
  // marker. A failure between the two leaves the import unmarked, and a retry
  // is safe: every conflict rule resolves upward, so folding the same
  // snapshot in twice reaches the same state.
  let result;
  try {
    result = await upsertUnifiedProgressForUser(
      serviceClient,
      auth.user.id,
      merge.merged,
    );
  } catch (error) {
    reportApiError({ route: ROUTE, step: "supabase-write", error, request });
    return privateJson({ error: "progress_write_failed" }, { status: 500 });
  }

  if (!result.ok && !result.conflict) {
    reportApiError({
      route: ROUTE,
      step: "supabase-write",
      error: result.error,
    });
    // One course row can exceed the 64 KiB DB CHECK while the whole request
    // stays inside the body cap: the two bound different things. Naming it
    // keeps an oversize row from reading as a transient 500 to retry forever.
    if (isRowSizeViolation(result.error)) {
      return privateJson({ error: "progress_too_large" }, { status: 413 });
    }
    return privateJson({ error: "progress_write_failed" }, { status: 500 });
  }

  if (!result.ok) {
    return privateJson(
      {
        error: "progress_conflict",
        progress: result.result.progress,
        updatedAt: result.result.updatedAt,
      },
      { status: 409 },
    );
  }

  return privateJson({
    ok: true,
    importedAt,
    merged: merge.summary,
    progress: result.result.progress,
    updatedAt: result.result.updatedAt,
  });
}
