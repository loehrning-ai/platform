import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The metadata document is what turns a 401 into a working authorization
 * flow, so the assertions below are about exact identifiers: the resource an
 * access token has to name in `aud`, the issuer that may sign it, and the URL
 * a client is sent to. A wrong value here does not fail loudly, it just makes
 * every agent client unable to authenticate, which is why the strings are
 * pinned rather than derived in the test.
 */

const mockIsAgentAccessReady = vi.fn<() => boolean>(() => true);
const mockIsOAuthServerReady = vi.fn<() => boolean>(() => true);

vi.mock("@/lib/provider-readiness", () => ({
  isAgentAccessReady: () => mockIsAgentAccessReady(),
  isOAuthServerReady: () => mockIsOAuthServerReady(),
}));

import {
  AGENT_SCOPES_SUPPORTED,
  buildProtectedResourceMetadata,
  MCP_PROTECTED_RESOURCE_METADATA_PATH,
  MCP_PROTECTED_RESOURCE_METADATA_URL,
  MCP_RESOURCE_IDENTIFIER,
  PROTECTED_RESOURCE_METADATA_PATH,
  protectedResourceMetadataResponse,
  supabaseAuthIssuer,
  supabaseJwksUrl,
} from "./protected-resource";
import { MCP_HELP_PATH } from "./config";
import { AGENT_HELP_PATH } from "@/components/course/open-with-your-ai-copy";
import {
  GET as getSiteMetadata,
  dynamic as siteDynamic,
  runtime as siteRuntime,
} from "@/app/.well-known/oauth-protected-resource/route";
import {
  GET as getEndpointMetadata,
  dynamic as endpointDynamic,
  runtime as endpointRuntime,
} from "@/app/.well-known/oauth-protected-resource/api/mcp/route";

const ISSUER = "https://project.supabase.co/auth/v1";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  mockIsAgentAccessReady.mockReturnValue(true);
  mockIsOAuthServerReady.mockReturnValue(true);
});

describe("agent surface identifiers", () => {
  it("pins the resource identifier and the RFC 9728 paths", () => {
    expect(MCP_RESOURCE_IDENTIFIER).toBe("https://loehrning.ai/api/mcp");
    expect(PROTECTED_RESOURCE_METADATA_PATH).toBe(
      "/.well-known/oauth-protected-resource",
    );
    expect(MCP_PROTECTED_RESOURCE_METADATA_PATH).toBe(
      "/.well-known/oauth-protected-resource/api/mcp",
    );
    expect(MCP_PROTECTED_RESOURCE_METADATA_URL).toBe(
      "https://loehrning.ai/.well-known/oauth-protected-resource/api/mcp",
    );
  });

  it("derives the issuer and the key discovery URL from the project origin", () => {
    expect(supabaseAuthIssuer()).toBe(ISSUER);
    expect(supabaseJwksUrl()).toBe(
      "https://project.supabase.co/auth/v1/.well-known/jwks.json",
    );
  });

  it("refuses an origin that is not a Supabase project", () => {
    vi.stubEnv("SUPABASE_URL", "https://attacker.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    expect(supabaseAuthIssuer()).toBeNull();
    expect(supabaseJwksUrl()).toBeNull();
  });
});

describe("buildProtectedResourceMetadata", () => {
  it("documents the same help path the help page and the copy island use", () => {
    // Two modules name this route: the agent surface, which advertises it to
    // every client that reads the metadata, and the reading-page island,
    // which links a learner to it. A rename that touched only one would send
    // one of the two audiences to a 404.
    expect(MCP_HELP_PATH).toBe(AGENT_HELP_PATH);
  });

  it("describes the agent endpoint and names the authorization server", () => {
    expect(buildProtectedResourceMetadata("agent-endpoint")).toEqual({
      resource: "https://loehrning.ai/api/mcp",
      resource_name: "loehrning.ai agent endpoint",
      authorization_servers: [ISSUER],
      scopes_supported: AGENT_SCOPES_SUPPORTED,
      bearer_methods_supported: ["header"],
      resource_documentation: "https://loehrning.ai/hilfe/eigene-ki",
      resource_policy_uri: "https://loehrning.ai/datenschutz",
    });
  });

  it("describes the origin for a client that probes only the root", () => {
    const metadata = buildProtectedResourceMetadata("site");

    expect(metadata?.resource).toBe("https://loehrning.ai");
    expect(metadata?.authorization_servers).toEqual([ISSUER]);
  });

  it("advertises no authorization server until the OAuth server is confirmed", () => {
    mockIsOAuthServerReady.mockReturnValue(false);
    const metadata = buildProtectedResourceMetadata("agent-endpoint");

    expect(metadata).not.toBeNull();
    expect(metadata).not.toHaveProperty("authorization_servers");
  });

  it("advertises no authorization server when the project origin is unusable", () => {
    vi.stubEnv("SUPABASE_URL", "https://attacker.example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    expect(
      buildProtectedResourceMetadata("agent-endpoint"),
    ).not.toHaveProperty("authorization_servers");
  });

  it("describes nothing when the agent surface is off", () => {
    mockIsAgentAccessReady.mockReturnValue(false);

    expect(buildProtectedResourceMetadata("agent-endpoint")).toBeNull();
    expect(buildProtectedResourceMetadata("site")).toBeNull();
  });
});

describe("protectedResourceMetadataResponse", () => {
  it("serves the document as cacheable public JSON", async () => {
    const response = protectedResourceMetadataResponse("agent-endpoint");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, s-maxage=300",
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await expect(response.json()).resolves.toMatchObject({
      resource: "https://loehrning.ai/api/mcp",
    });
  });

  it("answers 404 without caching when the agent surface is off", async () => {
    mockIsAgentAccessReady.mockReturnValue(false);
    const response = protectedResourceMetadataResponse("agent-endpoint");

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });
});

describe("the well-known routes", () => {
  it("runs on Node and is never frozen into the build", () => {
    expect(siteRuntime).toBe("nodejs");
    expect(endpointRuntime).toBe("nodejs");
    expect(siteDynamic).toBe("force-dynamic");
    expect(endpointDynamic).toBe("force-dynamic");
  });

  it("serves the origin document at the well-known root", async () => {
    const response = await getSiteMetadata();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      resource: "https://loehrning.ai",
      authorization_servers: [ISSUER],
    });
  });

  it("serves the endpoint document at the resource scoped path", async () => {
    const response = await getEndpointMetadata();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      resource: "https://loehrning.ai/api/mcp",
      bearer_methods_supported: ["header"],
    });
  });

  it("answers 404 on both paths when the agent surface is off", async () => {
    mockIsAgentAccessReady.mockReturnValue(false);

    expect((await getSiteMetadata()).status).toBe(404);
    expect((await getEndpointMetadata()).status).toBe(404);
  });
});
