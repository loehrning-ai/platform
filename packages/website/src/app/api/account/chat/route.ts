/**
 * POST /api/account/chat — the account chat, on the student's own key.
 *
 * The order of the gates is the security model: authenticate the caller,
 * confirm the capability is configured, spend the caller's budget, read the
 * body inside a ceiling, validate it strictly, confirm ownership, and only
 * then open the student's stored key and talk to the provider.
 *
 * The operator's Anthropic credential is unreachable from here. Nothing in
 * this route or in `@/lib/anthropic-chat` imports `@/lib/anthropic` or reads
 * `ANTHROPIC_API_KEY`; the provider client is constructed once per request
 * from the key this account stored, and refuses to be constructed without it.
 *
 * Node runtime, never edge: the stored key is opened with `node:crypto`
 * through the account key vault. Streaming does not need the edge runtime.
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";
import { tryCreateServiceClient } from "@/lib/supabase/server";
import { hasJsonContentType, readBoundedJson } from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  consumeRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { byoChatAllowedModels, isByoChatReady } from "@/lib/provider-readiness";
import { DEFAULT_LOCALE } from "@/lib/i18n/locale";
import { resolveAccountChatKey } from "@/lib/anthropic-chat/account-key";
import {
  ACCOUNT_CHAT_CLIENT_RATE_LIMIT_MAX,
  ACCOUNT_CHAT_IP_RATE_LIMIT_NAMESPACE,
  ACCOUNT_CHAT_MAX_PAYLOAD_BYTES,
  ACCOUNT_CHAT_RATE_LIMIT_NAMESPACE,
  ACCOUNT_CHAT_RATE_LIMIT_WINDOW_SECONDS,
  ACCOUNT_CHAT_ROUTE,
  ACCOUNT_CHAT_USER_RATE_LIMIT_MAX,
} from "@/lib/anthropic-chat/config";
import { startAccountChat } from "@/lib/anthropic-chat/conversation";
import {
  isAccountChatError,
  type AccountChatError,
  type AccountChatErrorCode,
} from "@/lib/anthropic-chat/errors";
import { accountChatSystemPrompt } from "@/lib/anthropic-chat/prompt";
import {
  AccountChatKeyRequiredError,
  createAccountChatProvider,
} from "@/lib/anthropic-chat/provider";
import {
  parseAccountChatRequest,
  resolveChatModel,
} from "@/lib/anthropic-chat/request";
import {
  accountChatStreamResponse,
  createAccountChatAbortHandles,
} from "@/lib/anthropic-chat/stream";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

/** The only provider a student can store a key for today. */
const CHAT_PROVIDER = "anthropic" as const;

type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]
>;
type RequireUserResult =
  | { readonly ok: false; readonly response: NextResponse }
  | { readonly ok: true; readonly user: AuthenticatedUser };

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return NextResponse.json(body, { ...init, headers });
}

function errorResponse(
  code: AccountChatErrorCode,
  status: number,
  retryAfterSeconds?: number,
): NextResponse {
  const headers = new Headers();
  if (typeof retryAfterSeconds === "number") {
    headers.set("Retry-After", String(retryAfterSeconds));
  }
  return privateJson(
    {
      error: code,
      ...(typeof retryAfterSeconds === "number"
        ? { retryAfter: retryAfterSeconds }
        : {}),
    },
    { status, headers },
  );
}

function fromChatError(error: AccountChatError): NextResponse {
  return errorResponse(error.code, error.status, error.retryAfterSeconds);
}

async function requireUser(): Promise<RequireUserResult> {
  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({ route: ACCOUNT_CHAT_ROUTE, step: "auth-get-user", error });
    return { ok: false, response: errorResponse("auth_unavailable", 503) };
  }
  const { configured, user, error: authError } = auth;
  if (!configured) {
    return { ok: false, response: errorResponse("auth_not_configured", 503) };
  }
  if (authError) {
    // Supabase Auth unreachable is not the same as "logged out": an outage
    // must not read to the browser as a failed sign-in.
    reportApiError({
      route: ACCOUNT_CHAT_ROUTE,
      step: "auth-get-user",
      error: authError,
    });
    return { ok: false, response: errorResponse("auth_unavailable", 503) };
  }
  if (!user) {
    return { ok: false, response: errorResponse("unauthorized", 401) };
  }
  // No cookie-bound client is built here on purpose. Everything this route
  // reads afterwards is behind the service client: the sealed key columns are
  // not granted to the browser role at all.
  return { ok: true, user };
}

async function enforceRateLimits(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  // An account budget paired with an independent client ceiling: a new address
  // cannot reset the account's hour, and cheap account creation cannot bypass
  // the per-client limit.
  let clientAllowed: boolean;
  try {
    const userAllowed = await consumeRateLimit({
      key: await hashedAuthenticatedRateLimitKey(
        ACCOUNT_CHAT_RATE_LIMIT_NAMESPACE,
        request,
        userId,
      ),
      windowSeconds: ACCOUNT_CHAT_RATE_LIMIT_WINDOW_SECONDS,
      max: ACCOUNT_CHAT_USER_RATE_LIMIT_MAX,
    });
    if (!userAllowed) {
      return errorResponse("rate_limit_exceeded", 429);
    }
    clientAllowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey(
        ACCOUNT_CHAT_IP_RATE_LIMIT_NAMESPACE,
        request,
      ),
      windowSeconds: ACCOUNT_CHAT_RATE_LIMIT_WINDOW_SECONDS,
      max: ACCOUNT_CHAT_CLIENT_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ACCOUNT_CHAT_ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return errorResponse("rate_limit_unavailable", 503);
  }
  return clientAllowed ? null : errorResponse("rate_limit_exceeded", 429);
}

export async function POST(request: Request): Promise<Response> {
  if (!hasJsonContentType(request)) {
    return errorResponse("unsupported_media_type", 415);
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!isByoChatReady()) {
    return errorResponse("chat_not_enabled", 503);
  }

  const limited = await enforceRateLimits(request, auth.user.id);
  if (limited) return limited;

  const body = await readBoundedJson(request, ACCOUNT_CHAT_MAX_PAYLOAD_BYTES);
  if (!body.ok && body.error === "body_too_large") {
    return errorResponse("payload_too_large", 413);
  }

  const parsed = parseAccountChatRequest(body.ok ? body.value : null);
  if (!parsed.ok) {
    return errorResponse(
      parsed.reason,
      parsed.reason === "message_too_large" ? 413 : 400,
    );
  }
  const chat = parsed.value;

  if (
    chat.expectedOwnerId !== undefined &&
    chat.expectedOwnerId !== auth.user.id
  ) {
    // The cookie-bound session changed after the browser picked its local
    // transcript namespace. Never run account A's conversation on account B's
    // key.
    return errorResponse("chat_owner_mismatch", 409);
  }

  const model = resolveChatModel(chat.model, byoChatAllowedModels());
  if (!model) {
    return errorResponse("model_not_allowed", 400);
  }

  // Reading the sealed key needs the service client: the browser role holds a
  // grant for the hint columns only, and never for the ciphertext.
  const serviceClient = tryCreateServiceClient();
  if (!serviceClient) {
    return errorResponse("llm_key_unavailable", 503);
  }

  const key = await resolveAccountChatKey(
    serviceClient,
    auth.user.id,
    CHAT_PROVIDER,
  );
  if (!key.ok) {
    if (key.cause !== undefined) {
      reportApiError({
        route: ACCOUNT_CHAT_ROUTE,
        step: "supabase-read",
        error: key.cause,
      });
    }
    return fromChatError(key.error);
  }

  const handles = createAccountChatAbortHandles(request);
  try {
    const session = await startAccountChat({
      provider: createAccountChatProvider(CHAT_PROVIDER, key.apiKey),
      model,
      system: accountChatSystemPrompt(
        chat.locale ?? chat.lesson?.locale ?? DEFAULT_LOCALE,
        chat.lesson,
      ),
      messages: chat.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      userId: auth.user.id,
      abort: handles.abort,
    });
    return accountChatStreamResponse(session, handles, (error) => {
      reportApiError({
        route: ACCOUNT_CHAT_ROUTE,
        step: "llm-call",
        error,
      });
    });
  } catch (error) {
    handles.dispose();
    if (isAccountChatError(error)) {
      // A named provider failure is expected operational reality, not a
      // defect. Only the codes that point at the platform are reported.
      if (
        error.code === "llm_unavailable" ||
        error.code === "llm_request_rejected"
      ) {
        reportApiError({ route: ACCOUNT_CHAT_ROUTE, step: "llm-call", error });
      }
      return fromChatError(error);
    }
    if (error instanceof AccountChatKeyRequiredError) {
      // The vault handed back something the provider would not accept. That
      // is an operator problem, reported here, but the answer the student can
      // act on is the same one a missing key gets: store the key again.
      reportApiError({ route: ACCOUNT_CHAT_ROUTE, step: "llm-call", error });
      return errorResponse("llm_key_missing", 409);
    }
    reportApiError({ route: ACCOUNT_CHAT_ROUTE, step: "llm-call", error });
    return errorResponse("llm_unavailable", 502);
  }
}
