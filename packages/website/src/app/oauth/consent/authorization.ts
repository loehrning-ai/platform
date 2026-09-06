import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsentErrorKind } from "./consent-copy";

/**
 * The authorization id is interpolated into the Supabase Auth request path
 * (`/oauth/authorizations/<id>`), so it is validated as an opaque URL-safe
 * token before it can reach a request. Slashes, dots, percent escapes, and
 * control characters are rejected outright rather than escaped, which keeps a
 * crafted query parameter from addressing a different endpoint. A canonical
 * UUID, the shape the authorization server issues today, matches this.
 */
const AUTHORIZATION_ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

/** Display cap for strings a third-party client registered about itself. */
const CLIENT_TEXT_MAX_LENGTH = 200;

/** A single authorization request may not ask for an unbounded scope list. */
const MAX_SCOPES = 16;
const SCOPE_MAX_LENGTH = 64;
const SCOPE_PATTERN = /^[\x21\x23-\x5B\x5D-\x7E]+$/;

export type AuthorizationIdResult =
  | { readonly ok: true; readonly authorizationId: string }
  | { readonly ok: false; readonly error: "missing-request" | "invalid-request" };

/**
 * Accepts `unknown` on purpose: Next hands a route a `string[]` when a query
 * key repeats, and a repeated `authorization_id` must be rejected rather than
 * silently resolved to one of the values.
 */
export function readAuthorizationId(value: unknown): AuthorizationIdResult {
  if (value === undefined || value === null || value === "") {
    return { ok: false, error: "missing-request" };
  }
  if (typeof value !== "string" || !AUTHORIZATION_ID_PATTERN.test(value)) {
    return { ok: false, error: "invalid-request" };
  }
  return { ok: true, authorizationId: value };
}

function boundedText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > CLIENT_TEXT_MAX_LENGTH
    ? trimmed.slice(0, CLIENT_TEXT_MAX_LENGTH)
    : trimmed;
}

/**
 * Space-separated scope string into a bounded, de-duplicated list. Values are
 * restricted to RFC 6749 scope-token characters so a client cannot smuggle
 * markup or whitespace tricks into the consent screen.
 */
export function parseScopes(scope: unknown): readonly string[] {
  if (typeof scope !== "string") return [];
  const seen = new Set<string>();
  for (const candidate of scope.split(" ")) {
    if (
      candidate.length === 0 ||
      candidate.length > SCOPE_MAX_LENGTH ||
      !SCOPE_PATTERN.test(candidate)
    ) {
      continue;
    }
    seen.add(candidate);
    if (seen.size >= MAX_SCOPES) break;
  }
  return [...seen];
}

/**
 * The host the browser is sent to after a decision. Only an absolute HTTP(S)
 * URI without embedded credentials yields a host; anything else is shown as
 * unavailable rather than as a half-parsed string a learner might trust.
 */
export function redirectHost(redirectUri: unknown): string | null {
  if (typeof redirectUri !== "string" || redirectUri.length > 2_048) return null;
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    return null;
  }
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.host === ""
  ) {
    return null;
  }
  return parsed.host;
}

/**
 * The completed redirect back to the OAuth client, as produced by Supabase
 * Auth. It carries the authorization code, so it is only ever followed after
 * the authorization server itself returned it, and only when it parses as an
 * absolute HTTP(S) URL without credentials.
 */
export function safeClientRedirect(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2_048) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.host === ""
  ) {
    return null;
  }
  return parsed.toString();
}

export interface ConsentDetails {
  readonly authorizationId: string;
  readonly clientId: string;
  readonly clientName: string | null;
  readonly clientSite: string | null;
  readonly redirectHost: string | null;
  readonly scopes: readonly string[];
  readonly userEmail: string | null;
}

export type AuthorizationRequest =
  | { readonly kind: "consent"; readonly details: ConsentDetails }
  | { readonly kind: "redirect"; readonly url: string }
  | { readonly kind: "error"; readonly error: ConsentErrorKind };

function field(source: unknown, key: string): unknown {
  if (typeof source !== "object" || source === null) return undefined;
  try {
    return Reflect.get(source, key);
  } catch {
    return undefined;
  }
}

/**
 * Supabase passes the authorization payload through without validating it, so
 * the consent screen validates the shape itself. A payload without a client id
 * cannot be rendered honestly and is treated as an unusable request.
 */
export function toConsentDetails(
  data: unknown,
  authorizationId: string,
): ConsentDetails | null {
  const client = field(data, "client");
  const clientId = boundedText(field(client, "id"));
  if (!clientId) return null;
  return {
    authorizationId,
    clientId,
    clientName: boundedText(field(client, "name")),
    clientSite: boundedText(field(client, "uri")),
    redirectHost: redirectHost(field(data, "redirect_uri")),
    scopes: parseScopes(field(data, "scope")),
    userEmail: boundedText(field(field(data, "user"), "email")),
  };
}

function errorStatus(error: unknown): number | null {
  const status = field(error, "status");
  return typeof status === "number" && Number.isFinite(status) ? status : null;
}

function errorName(error: unknown): string | null {
  const name = field(error, "name");
  return typeof name === "string" ? name : null;
}

/**
 * A 4xx from the authorization server means this particular request is gone or
 * was never valid. Anything else (5xx, a transport failure, an unparseable
 * answer) is an outage: the learner is told to retry rather than that their
 * client did something wrong.
 */
export function classifyAuthorizationError(error: unknown): ConsentErrorKind {
  if (errorName(error) === "AuthSessionMissingError") return "backend-unavailable";
  const status = errorStatus(error);
  if (status !== null && status >= 400 && status < 500) return "unknown-request";
  return "backend-unavailable";
}

type OAuthServerApi = {
  getAuthorizationDetails: (
    authorizationId: string,
  ) => Promise<{ data: unknown; error: unknown }>;
  approveAuthorization: (
    authorizationId: string,
    options?: { skipBrowserRedirect?: boolean },
  ) => Promise<{ data: unknown; error: unknown }>;
  denyAuthorization: (
    authorizationId: string,
    options?: { skipBrowserRedirect?: boolean },
  ) => Promise<{ data: unknown; error: unknown }>;
};

/**
 * The OAuth 2.1 server namespace exists on `@supabase/auth-js` 2.112, but only
 * answers when the server is enabled in the project. Resolving it defensively
 * keeps a client built against an older auth-js from throwing on property
 * access; the caller sees the same outage answer as any other failure.
 */
export function oauthServerApi(
  supabase: Pick<SupabaseClient, "auth">,
): OAuthServerApi | null {
  const api = field(supabase.auth, "oauth");
  if (
    typeof field(api, "getAuthorizationDetails") !== "function" ||
    typeof field(api, "approveAuthorization") !== "function" ||
    typeof field(api, "denyAuthorization") !== "function"
  ) {
    return null;
  }
  return api as OAuthServerApi;
}

/**
 * Reads one authorization request. Three outcomes: render consent, follow the
 * redirect the authorization server already decided on (the learner consented
 * to these scopes before), or render an error page. Never throws.
 */
export async function resolveAuthorizationRequest(
  supabase: Pick<SupabaseClient, "auth">,
  authorizationId: string,
): Promise<AuthorizationRequest> {
  const api = oauthServerApi(supabase);
  if (!api) return { kind: "error", error: "backend-unavailable" };

  let result: { data: unknown; error: unknown };
  try {
    result = await api.getAuthorizationDetails(authorizationId);
  } catch (error) {
    return { kind: "error", error: classifyAuthorizationError(error) };
  }
  if (result.error) {
    return { kind: "error", error: classifyAuthorizationError(result.error) };
  }

  const details = toConsentDetails(result.data, authorizationId);
  if (details) return { kind: "consent", details };

  const alreadyGranted = safeClientRedirect(field(result.data, "redirect_url"));
  if (alreadyGranted) return { kind: "redirect", url: alreadyGranted };

  return { kind: "error", error: "unknown-request" };
}

export type ConsentDecision = "approve" | "deny";

export type DecisionResult =
  | { readonly kind: "redirect"; readonly url: string }
  | { readonly kind: "error"; readonly error: ConsentErrorKind };

/**
 * Records the learner's decision and returns where the browser goes next.
 * A decision that cannot be recorded never falls back to a redirect: the
 * caller sends the learner back to the consent page with the failure.
 */
export async function submitConsentDecision(
  supabase: Pick<SupabaseClient, "auth">,
  authorizationId: string,
  decision: ConsentDecision,
): Promise<DecisionResult> {
  const api = oauthServerApi(supabase);
  if (!api) return { kind: "error", error: "backend-unavailable" };

  let result: { data: unknown; error: unknown };
  try {
    result =
      decision === "approve"
        ? await api.approveAuthorization(authorizationId, {
            skipBrowserRedirect: true,
          })
        : await api.denyAuthorization(authorizationId, {
            skipBrowserRedirect: true,
          });
  } catch (error) {
    return { kind: "error", error: classifyAuthorizationError(error) };
  }
  if (result.error) {
    return { kind: "error", error: classifyAuthorizationError(result.error) };
  }

  const url = safeClientRedirect(field(result.data, "redirect_url"));
  return url ? { kind: "redirect", url } : { kind: "error", error: "decision-failed" };
}
