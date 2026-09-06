import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import { isByoChatReady } from "@/lib/provider-readiness";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  isAccountKeyEnvelopeError,
  sealAccountKey,
} from "@/lib/llm-keys/envelope";
import { validateAccountLlmKey } from "@/lib/llm-keys/provider-validation";
import {
  ACCOUNT_LLM_PROVIDERS,
  isAccountLlmKeyShape,
} from "@/lib/llm-keys/providers";
import {
  deleteAccountLlmKey,
  upsertAccountLlmKey,
} from "@/lib/llm-keys/store";

/**
 * The bring-your-own-key vault.
 *
 * POST validates a student's own provider key with one cheap provider call,
 * seals it under the deployment key-encryption key, and stores it. DELETE
 * removes it. Nothing else: there is deliberately no read route, because the
 * only clear fragment that may leave the server is the four-character hint,
 * and the account page reads that from the hint-only column grant.
 *
 * The clear key exists in this process for the length of one request. It is
 * never written to a log, never placed in an error, never echoed in a
 * response, and never handed to an error reporter. The response says only
 * which provider is stored, the hint, and when the key last answered.
 */

export const runtime = "nodejs";
export const maxDuration = 15;
export const dynamic = "force-dynamic";

const ROUTE = "/api/account/llm-key";

const MAX_LLM_KEY_PAYLOAD_BYTES = 4 * 1024;

// Every accepted POST makes an outbound provider call, so the account budget
// is deliberately small: storing a key is a rare, deliberate act. The IP
// ceiling keeps cheap account creation from multiplying that budget.
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const SAVE_USER_RATE_LIMIT_MAX = 10;
const SAVE_CLIENT_RATE_LIMIT_MAX = 60;
const DELETE_USER_RATE_LIMIT_MAX = 20;
const DELETE_CLIENT_RATE_LIMIT_MAX = 120;

const ownerBindingSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
  })
  .passthrough();

const providerSchema = z.enum(ACCOUNT_LLM_PROVIDERS);

const saveSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
    provider: providerSchema,
    apiKey: z.string().min(1).max(1024),
  })
  .strict();

const deleteSchema = z
  .object({
    expectedOwnerId: z.string().trim().min(1).max(256),
    provider: providerSchema,
  })
  .strict();

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

type OwnerContext = {
  readonly ok: true;
  readonly userId: string;
  readonly body: unknown;
};

type OwnerRejection = { readonly ok: false; readonly response: NextResponse };

/**
 * Shared front half of both handlers: media type, readiness, session, body
 * ceiling, owner binding, and the paired durable budgets. The readiness gate
 * runs first so a deployment without a key-encryption key answers "off"
 * before any session or store work happens.
 */
async function requireBoundOwner(
  request: Request,
  limits: {
    readonly namespace: string;
    readonly userMax: number;
    readonly clientMax: number;
  },
): Promise<OwnerContext | OwnerRejection> {
  if (!hasJsonContentType(request)) {
    return {
      ok: false,
      response: privateJson({ error: "unsupported_media_type" }, { status: 415 }),
    };
  }

  if (!isByoChatReady()) {
    return {
      ok: false,
      response: privateJson({ error: "byo_chat_not_ready" }, { status: 503 }),
    };
  }

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
    // Supabase Auth unreachable is not the same as logged out.
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

  const body = await readBoundedJson(request, MAX_LLM_KEY_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return {
      ok: false,
      response: privateJson({ error: "payload_too_large" }, { status: 413 }),
    };
  }

  const ownerBinding = ownerBindingSchema.safeParse(
    body.ok ? body.value : null,
  );
  if (!ownerBinding.success) {
    return {
      ok: false,
      response: privateJson({ error: "invalid_owner_binding" }, { status: 400 }),
    };
  }
  if (ownerBinding.data.expectedOwnerId !== user.id) {
    // The cookie-bound session changed after the page rendered. Never let a
    // stale account-A request write or delete a key in account B.
    return {
      ok: false,
      response: privateJson({ error: "account_owner_mismatch" }, { status: 409 }),
    };
  }

  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        limits.namespace,
        request,
        user.id,
      ),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: limits.userMax,
    });
    if (!userAllowed) {
      return {
        ok: false,
        response: privateJson({ error: "rate_limit_exceeded" }, { status: 429 }),
      };
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey(`${limits.namespace}-ip`, request),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      max: limits.clientMax,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return {
      ok: false,
      response: privateJson({ error: "rate_limit_unavailable" }, { status: 503 }),
    };
  }
  if (!clientAllowed) {
    return {
      ok: false,
      response: privateJson({ error: "rate_limit_exceeded" }, { status: 429 }),
    };
  }

  return { ok: true, userId: user.id, body: body.ok ? body.value : null };
}

export async function POST(request: Request): Promise<NextResponse> {
  const bound = await requireBoundOwner(request, {
    namespace: "account-llm-key",
    userMax: SAVE_USER_RATE_LIMIT_MAX,
    clientMax: SAVE_CLIENT_RATE_LIMIT_MAX,
  });
  if (!bound.ok) return bound.response;

  const parsed = saveSchema.safeParse(bound.body);
  if (!parsed.success) {
    // The parse error is discarded rather than reported: its issues can quote
    // the submitted value, and the submitted value is a provider key.
    return privateJson({ error: "invalid_llm_key_request" }, { status: 400 });
  }
  const { provider, apiKey } = parsed.data;
  if (!isAccountLlmKeyShape(provider, apiKey)) {
    return privateJson({ error: "invalid_llm_key" }, { status: 400 });
  }

  const validation = await validateAccountLlmKey({ provider, apiKey });
  if (!validation.ok) {
    if (validation.reason === "rejected") {
      return privateJson({ error: "llm_key_rejected" }, { status: 400 });
    }
    if (validation.reason === "timeout") {
      return privateJson({ error: "provider_timeout" }, { status: 504 });
    }
    // The provider is unreachable or unhealthy. That says nothing about the
    // key, so it must not be reported to the student as a bad key.
    return privateJson(
      { error: "llm_key_validation_failed" },
      { status: 502 },
    );
  }

  let sealed;
  try {
    sealed = sealAccountKey({ userId: bound.userId, provider, apiKey });
  } catch (error) {
    if (isAccountKeyEnvelopeError(error, "kek_unavailable")) {
      // Readiness passed a moment ago, so the deployment key changed under a
      // running instance. Answer "not ready" rather than "your key is bad".
      return privateJson({ error: "byo_chat_not_ready" }, { status: 503 });
    }
    reportApiError({ route: ROUTE, step: "supabase-write", error });
    return privateJson({ error: "llm_key_write_failed" }, { status: 500 });
  }

  // Direct authenticated writes are revoked in the database: only this
  // validated, rate-limited server path may store a sealed key, and the owner
  // it is bound to comes from the verified session.
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "llm_key_store_unavailable" }, { status: 503 });
  }

  const stored = await upsertAccountLlmKey(serviceClient, {
    userId: bound.userId,
    provider,
    sealed,
    validatedAt: validation.validatedAt,
  });
  if (!stored.ok) {
    reportApiError({ route: ROUTE, step: "supabase-write", error: stored.error });
    return privateJson({ error: "llm_key_write_failed" }, { status: 500 });
  }

  return privateJson({
    ok: true,
    provider: stored.summary.provider,
    hint: stored.summary.hint,
    createdAt: stored.summary.createdAt,
    validatedAt: stored.summary.validatedAt,
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const bound = await requireBoundOwner(request, {
    namespace: "account-llm-key-delete",
    userMax: DELETE_USER_RATE_LIMIT_MAX,
    clientMax: DELETE_CLIENT_RATE_LIMIT_MAX,
  });
  if (!bound.ok) return bound.response;

  const parsed = deleteSchema.safeParse(bound.body);
  if (!parsed.success) {
    return privateJson({ error: "invalid_llm_key_request" }, { status: 400 });
  }

  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return privateJson({ error: "llm_key_store_unavailable" }, { status: 503 });
  }

  const removed = await deleteAccountLlmKey(
    serviceClient,
    bound.userId,
    parsed.data.provider,
  );
  if (!removed.ok) {
    reportApiError({
      route: ROUTE,
      step: "supabase-delete",
      error: removed.error,
    });
    return privateJson({ error: "llm_key_delete_failed" }, { status: 500 });
  }

  // Removing a key that is not there is a success: the account ends in the
  // state the student asked for, and a 404 would only tell a caller whether
  // some other session had already deleted it.
  return privateJson({
    ok: true,
    provider: parsed.data.provider,
    deleted: removed.deleted,
  });
}
