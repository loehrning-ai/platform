import "server-only";

import {
  isAgentAccessReady,
  isOAuthServerReady,
} from "@/lib/provider-readiness";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo/entity";
import { normalizeSupabaseOrigin } from "@/lib/supabase/config";
import { MCP_ENDPOINT_PATH, MCP_HELP_PATH } from "./config";

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728) for the agent surface.
 *
 * An agent client that receives a 401 from the endpoint reads the
 * `resource_metadata` link in the `WWW-Authenticate` header, fetches the
 * document built here, and learns which authorization server can issue a
 * token for this resource. Nothing in the document is a secret; everything in
 * it is derived from configuration this deployment has already validated.
 *
 * Two documents exist. The canonical one is scoped to the agent endpoint and
 * lives at the RFC 9728 path that inserts the resource path after the
 * well-known prefix. The site-level one answers clients that only probe the
 * origin root, so discovery still succeeds for them.
 */

/** RFC 9728 well-known prefix, and the endpoint-scoped variant below it. */
export const PROTECTED_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";
export const MCP_PROTECTED_RESOURCE_METADATA_PATH =
  `${PROTECTED_RESOURCE_METADATA_PATH}${MCP_ENDPOINT_PATH}` as const;

/** Absolute URL an agent client is pointed at when a bearer is rejected. */
export const MCP_PROTECTED_RESOURCE_METADATA_URL = absoluteUrl(
  MCP_PROTECTED_RESOURCE_METADATA_PATH,
);

/**
 * The resource identifier this deployment expects in an access token's `aud`.
 * It is the endpoint URL itself, which is what an MCP client sends as the
 * `resource` parameter during authorization.
 */
export const MCP_RESOURCE_IDENTIFIER = absoluteUrl(MCP_ENDPOINT_PATH);

/**
 * Scopes a client may request for this resource. They are the OpenID Connect
 * scopes the platform consent screen documents line by line; the agent tools
 * themselves are read-only and grant no additional capability.
 */
export const AGENT_SCOPES_SUPPORTED = [
  "openid",
  "email",
  "profile",
] as const;

export type ProtectedResourceTarget = "site" | "agent-endpoint";

export interface ProtectedResourceMetadata {
  readonly resource: string;
  readonly resource_name: string;
  readonly authorization_servers?: readonly string[];
  readonly scopes_supported: readonly string[];
  readonly bearer_methods_supported: readonly string[];
  readonly resource_documentation: string;
  readonly resource_policy_uri: string;
}

/**
 * The Supabase project origin, re-validated here rather than trusted. The
 * issuer and the JWKS URL are both built from it, so an unexpected value must
 * disable token verification instead of redirecting it somewhere else.
 */
function supabaseProjectOrigin(): string | null {
  const configured =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  return configured ? normalizeSupabaseOrigin(configured) : null;
}

/** Issuer claim every access token for this resource has to carry. */
export function supabaseAuthIssuer(): string | null {
  const origin = supabaseProjectOrigin();
  return origin ? `${origin}/auth/v1` : null;
}

/** Discovery endpoint for the project's JWT signing keys. */
export function supabaseJwksUrl(): string | null {
  const origin = supabaseProjectOrigin();
  return origin ? `${origin}/auth/v1/.well-known/jwks.json` : null;
}

/**
 * Authorization servers a client may use for this resource.
 *
 * Empty until the OAuth server is confirmed enabled. Advertising an
 * authorization server that does not answer would send every agent client
 * into a dead authorization flow, so the list stays empty and the personal
 * access token path documented on the endpoint remains the way in.
 */
function authorizationServers(): readonly string[] {
  if (!isOAuthServerReady()) return [];
  const issuer = supabaseAuthIssuer();
  return issuer ? [issuer] : [];
}

/**
 * The metadata document, or null when this deployment serves no agent
 * surface at all. A null result is answered with 404 by the routes: there is
 * genuinely no protected resource here to describe.
 */
export function buildProtectedResourceMetadata(
  target: ProtectedResourceTarget,
): ProtectedResourceMetadata | null {
  if (!isAgentAccessReady()) return null;

  const servers = authorizationServers();
  const scoped = target === "agent-endpoint";

  return {
    resource: scoped ? MCP_RESOURCE_IDENTIFIER : SITE_ORIGIN,
    resource_name: scoped
      ? "loehrning.ai agent endpoint"
      : "loehrning.ai",
    ...(servers.length > 0 ? { authorization_servers: servers } : {}),
    scopes_supported: AGENT_SCOPES_SUPPORTED,
    bearer_methods_supported: ["header"],
    // The setup guide, not the endpoint. A browser GET on the endpoint does
    // serve an explainer, but the help page carries the full walkthrough per
    // client plus the personal-token and account-chat paths, which is what a
    // person following this link actually needs.
    resource_documentation: absoluteUrl(MCP_HELP_PATH),
    resource_policy_uri: absoluteUrl("/datenschutz"),
  };
}

/**
 * Public, cacheable, and readable by a browser-based client. The document
 * carries no per-caller data, so a shared cache entry is correct and a
 * permissive origin costs nothing.
 */
export const PROTECTED_RESOURCE_METADATA_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=300",
  "Access-Control-Allow-Origin": "*",
} as const;

/**
 * The served document, or a 404 when this deployment has no agent surface.
 *
 * The 404 is deliberately uncached: enabling the endpoint has to take effect
 * for the next discovery request, not after a shared cache entry expires.
 */
export function protectedResourceMetadataResponse(
  target: ProtectedResourceTarget,
): Response {
  const metadata = buildProtectedResourceMetadata(target);
  if (!metadata) {
    return new Response(
      JSON.stringify({ error: "not_found" }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: { ...PROTECTED_RESOURCE_METADATA_HEADERS },
  });
}
