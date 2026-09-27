import "server-only";

import {
  isPersonalAccessToken,
  lookupPersonalAccessToken,
  PERSONAL_ACCESS_TOKEN_PREFIX,
} from "@/lib/agent-access/personal-tokens";
import { oauthClientLabel } from "@/lib/agent-access/record";
import {
  isAgentAccessReady,
  isOAuthServerReady,
} from "@/lib/provider-readiness";
import { verifyOAuthAccessToken } from "./oauth-jwt";
import {
  MCP_PROTECTED_RESOURCE_METADATA_URL,
  MCP_RESOURCE_IDENTIFIER,
  supabaseAuthIssuer,
  supabaseJwksUrl,
} from "./protected-resource";

/**
 * Who is calling the authenticated agent tools.
 *
 * Two credentials reach this resolver and both end in the same principal.
 *
 * An OAuth access token is verified against the authorization server's
 * published keys and its claims. A personal access token is recognised by its
 * SHA-256 digest; the clear value is never stored, so a disclosure of the
 * table yields no usable credential. Recognising one is the account's
 * concern, so it lives in `@/lib/agent-access/personal-tokens` and keeps the
 * read-only boundary of this directory intact.
 *
 * The credential never leaves this module. It is not logged, not reported to
 * error tracking, not written to the audit trail, and not echoed in a
 * rejection. Every rejection is a fixed enum member, and the caller turns it
 * into a 401 whose `WWW-Authenticate` header points a client at the metadata
 * document that explains how to obtain a valid one.
 */

/**
 * The token format is re-exported here because this module is the credential
 * surface of the agent endpoint: the mint route, the account page, and this
 * resolver all read one definition, and it lives beside the table it
 * describes so that this directory keeps its read-only boundary.
 */
export {
  AGENT_ACCESS_TOKENS_TABLE,
  hashPersonalAccessToken,
  isPersonalAccessToken,
  personalAccessTokenDisplayPrefix,
  PERSONAL_ACCESS_TOKEN_DISPLAY_LENGTH,
  PERSONAL_ACCESS_TOKEN_PREFIX,
  PERSONAL_ACCESS_TOKEN_SECRET_BYTES,
  PERSONAL_ACCESS_TOKEN_SECRET_LENGTH,
} from "@/lib/agent-access/personal-tokens";

/** RFC 6750 credentials: the `Bearer` scheme followed by one token68 value. */
const BEARER_CREDENTIAL = /^Bearer +([A-Za-z0-9._~+/-]+=*)$/i;
const MAX_AUTHORIZATION_HEADER_LENGTH = 8192;

export type AgentPrincipalKind = "oauth" | "personal-access-token";

export interface AgentPrincipal {
  /** Account the credential belongs to. Server-derived, never a claim. */
  readonly userId: string;
  readonly kind: AgentPrincipalKind;
  /** Audit-trail label: `oauth:<client id>` or `pat:<name>`. */
  readonly client: string;
  readonly scopes: readonly string[];
}

export const BEARER_REJECTIONS = [
  "missing_credentials",
  "malformed_credentials",
  "unknown_token_format",
  "invalid_token",
  "expired_token",
  "invalid_audience",
  "invalid_issuer",
  "revoked_token",
  "verifier_unavailable",
  "not_configured",
] as const;

export type BearerRejection = (typeof BEARER_REJECTIONS)[number];

export type BearerResolution =
  | { readonly ok: true; readonly principal: AgentPrincipal }
  | { readonly ok: false; readonly rejection: BearerRejection };

function refuse(rejection: BearerRejection): BearerResolution {
  return { ok: false, rejection };
}

/**
 * The presented credential, or null. Accepts only a single well formed Bearer
 * value: a repeated Authorization header arrives here comma joined and fails
 * the pattern, which is the safe reading of an ambiguous request.
 */
export function readBearerCredential(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header === null || header.length > MAX_AUTHORIZATION_HEADER_LENGTH) {
    return null;
  }
  return BEARER_CREDENTIAL.exec(header)?.[1] ?? null;
}

const PERSONAL_TOKEN_REJECTION: Readonly<
  Record<"unknown" | "revoked" | "unavailable", BearerRejection>
> = {
  unknown: "invalid_token",
  revoked: "revoked_token",
  unavailable: "verifier_unavailable",
};

async function resolvePersonalAccessToken(
  token: string,
  now: Date,
): Promise<BearerResolution> {
  const found = await lookupPersonalAccessToken(token, now);
  if (!found.ok) return refuse(PERSONAL_TOKEN_REJECTION[found.reason]);

  return {
    ok: true,
    principal: {
      userId: found.userId,
      kind: "personal-access-token",
      client: found.client,
      // A personal token stands in for its owner's own read access. It
      // carries no OAuth scope grant, and every tool it can reach is
      // read-only, so the scope list stays deliberately empty.
      scopes: [],
    },
  };
}

async function resolveOAuthAccessToken(
  token: string,
  now: Date,
): Promise<BearerResolution> {
  const issuer = supabaseAuthIssuer();
  const jwksUrl = supabaseJwksUrl();
  if (!isOAuthServerReady() || !issuer || !jwksUrl) {
    return refuse("verifier_unavailable");
  }

  const verification = await verifyOAuthAccessToken(token, {
    issuer,
    audience: MCP_RESOURCE_IDENTIFIER,
    jwksUrl,
    now: now.getTime(),
  });
  if (!verification.ok) {
    switch (verification.reason) {
      case "expired_token":
        return refuse("expired_token");
      case "invalid_audience":
        return refuse("invalid_audience");
      case "invalid_issuer":
        return refuse("invalid_issuer");
      case "verifier_unavailable":
        return refuse("verifier_unavailable");
      default:
        return refuse("invalid_token");
    }
  }

  return {
    ok: true,
    principal: {
      userId: verification.token.subject,
      kind: "oauth",
      client: verification.token.clientId
        ? oauthClientLabel(verification.token.clientId)
        : oauthClientLabel("unknown"),
      scopes: verification.token.scopes,
    },
  };
}

/**
 * Resolve the caller of an authenticated agent request.
 *
 * A credential that is missing, malformed, unrecognised, expired, issued for
 * another audience, issued by another issuer, tampered with, or revoked all
 * end the same way: no principal, and a named reason the caller turns into a
 * 401. There is no partial success.
 */
export async function resolveAgentPrincipal(
  request: Request,
  now: Date = new Date(),
): Promise<BearerResolution> {
  if (!isAgentAccessReady()) return refuse("not_configured");

  const header = request.headers.get("authorization");
  if (header === null) return refuse("missing_credentials");

  const token = readBearerCredential(request);
  if (token === null) return refuse("malformed_credentials");

  if (token.startsWith(PERSONAL_ACCESS_TOKEN_PREFIX)) {
    return isPersonalAccessToken(token)
      ? resolvePersonalAccessToken(token, now)
      : refuse("invalid_token");
  }
  // Three base64url segments is the only other credential this resource
  // accepts. Anything else is refused before a verifier is even selected.
  if (token.split(".").length === 3) {
    return resolveOAuthAccessToken(token, now);
  }
  return refuse("unknown_token_format");
}

/**
 * RFC 6750 error codes. `invalid_request` marks a malformed header, and every
 * credential that was read but not accepted is `invalid_token`. A request
 * that carried no credential at all gets no error code, as the RFC requires.
 */
const REJECTION_ERROR_CODE: Readonly<
  Record<BearerRejection, "invalid_request" | "invalid_token" | null>
> = {
  missing_credentials: null,
  malformed_credentials: "invalid_request",
  unknown_token_format: "invalid_token",
  invalid_token: "invalid_token",
  expired_token: "invalid_token",
  invalid_audience: "invalid_token",
  invalid_issuer: "invalid_token",
  revoked_token: "invalid_token",
  verifier_unavailable: "invalid_token",
  not_configured: null,
};

/**
 * Fixed English descriptions. They are protocol text an agent developer
 * reads, they never contain a caller value, and they never contain the
 * credential.
 */
const REJECTION_DESCRIPTION: Readonly<Record<BearerRejection, string>> = {
  missing_credentials: "This resource requires a Bearer credential.",
  malformed_credentials:
    "The Authorization header is not a well formed Bearer credential.",
  unknown_token_format:
    "The credential is neither an OAuth access token nor a personal access token.",
  invalid_token: "The credential could not be verified.",
  expired_token: "The access token has expired.",
  invalid_audience: "The access token was not issued for this resource.",
  invalid_issuer:
    "The access token was not issued by the authorization server of this resource.",
  revoked_token: "The personal access token has been revoked.",
  verifier_unavailable:
    "The credential could not be verified because token verification is unavailable.",
  not_configured: "This deployment does not serve an agent endpoint.",
};

function quoted(value: string): string {
  // Every value emitted here is a fixed string or an origin-derived URL, so
  // escaping is a guarantee about this function rather than a filter.
  return `"${value.replaceAll("\\", "").replaceAll('"', "")}"`;
}

/**
 * The `WWW-Authenticate` challenge for a rejected agent request. The
 * `resource_metadata` link is what turns a 401 into a working authorization
 * flow, so it is present whenever a protected resource exists to describe.
 */
export function wwwAuthenticateHeader(rejection: BearerRejection): string {
  const parameters = [`realm=${quoted("loehrning.ai")}`];
  const code = REJECTION_ERROR_CODE[rejection];
  if (code) {
    // A request that carried no credential at all is answered without an
    // error code, and therefore without a description of one, as RFC 6750
    // requires: nothing was rejected, authentication simply has to start.
    parameters.push(`error=${quoted(code)}`);
    parameters.push(
      `error_description=${quoted(REJECTION_DESCRIPTION[rejection])}`,
    );
  }
  if (isAgentAccessReady()) {
    parameters.push(
      `resource_metadata=${quoted(MCP_PROTECTED_RESOURCE_METADATA_URL)}`,
    );
  }
  return `Bearer ${parameters.join(", ")}`;
}

/**
 * The complete 401 for a rejected agent request: the challenge header, a
 * body in the shape RFC 6750 uses for an error, and no caching anywhere.
 */
export function agentUnauthorizedResponse(
  rejection: BearerRejection,
): Response {
  // The body always says why. `unauthorized` covers the two cases where the
  // challenge header carries no RFC 6750 code, so the body never has to
  // borrow a code that would misdescribe what happened.
  return new Response(
    JSON.stringify({
      error: REJECTION_ERROR_CODE[rejection] ?? "unauthorized",
      error_description: REJECTION_DESCRIPTION[rejection],
    }),
    {
      status: 401,
      headers: {
        "WWW-Authenticate": wwwAuthenticateHeader(rejection),
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
