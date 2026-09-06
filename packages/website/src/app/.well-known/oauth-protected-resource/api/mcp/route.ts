import { protectedResourceMetadataResponse } from "@/lib/mcp/protected-resource";

/**
 * GET /.well-known/oauth-protected-resource/api/mcp
 *
 * OAuth 2.0 Protected Resource Metadata (RFC 9728) for the agent endpoint.
 * The well-known prefix carries the resource path, so this document describes
 * exactly `https://loehrning.ai/api/mcp` and is the URL named by the
 * `resource_metadata` parameter of every 401 challenge that endpoint sends.
 *
 * Node runtime and dynamic on purpose: the document is built from runtime
 * configuration, so it must never be frozen into a build time snapshot.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return protectedResourceMetadataResponse("agent-endpoint");
}
