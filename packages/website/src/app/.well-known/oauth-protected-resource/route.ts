import { protectedResourceMetadataResponse } from "@/lib/mcp/protected-resource";

/**
 * GET /.well-known/oauth-protected-resource
 *
 * Origin level OAuth 2.0 Protected Resource Metadata (RFC 9728). An agent
 * client that probes only the origin root still learns which authorization
 * server issues tokens here and which scopes exist. The document scoped to
 * the agent endpoint itself lives one path below this one and is the URL the
 * 401 challenge points at.
 *
 * Node runtime and dynamic on purpose: the document is built from runtime
 * configuration, so it must never be frozen into a build time snapshot.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return protectedResourceMetadataResponse("site");
}
