import { createMcpHandler } from "mcp-handler";
import { recordAgentAccessEvent } from "@/lib/agent-access/record";
import { readAgentProgressSnapshot } from "@/lib/agent-access/progress-snapshot";
import { reportApiError } from "@/lib/observability/api-error";
import { isAgentAccessReady } from "@/lib/provider-readiness";
import {
  consumeRateLimit,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import {
  agentUnauthorizedResponse,
  resolveAgentPrincipal,
} from "@/lib/mcp/auth";
import {
  MCP_MAX_REQUEST_BYTES,
  MCP_RATE_LIMIT_MAX,
  MCP_RATE_LIMIT_NAMESPACE,
  MCP_RATE_LIMIT_WINDOW_SECONDS,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
} from "@/lib/mcp/config";
import { renderMcpExplainer } from "@/lib/mcp/explainer";
import {
  logMcpRequestEvent,
  type McpRequestEvent,
} from "@/lib/mcp/observability";
import { readBoundedText, withReplayedBody } from "@/lib/mcp/request-body";
import {
  MCP_SERVER_INSTRUCTIONS,
  registerMcpResources,
  registerMcpTools,
} from "@/lib/mcp/server";
import {
  registerAuthenticatedMcpTools,
  type AuthenticatedToolContext,
} from "@/lib/mcp/tools/authenticated";

/**
 * Public MCP endpoint.
 *
 * POST is the Streamable HTTP transport. GET is not part of that transport, so
 * it answers with a human-readable explainer page instead of a protocol error.
 *
 * Node runtime, never edge: the tools read compiled-in content registries and
 * the book chapters come off the filesystem.
 *
 * The catalogue half of this surface is public, so the per-client limiter and
 * the request and response ceilings are not optional here. Authentication is
 * additive rather than a wall: a request with no `Authorization` header gets
 * the ten public read-only tools and nothing else, while a request that does
 * present a bearer must have it hold up. A credential that is missing from the
 * store, revoked, expired, or issued for another audience is refused with a
 * 401 and an RFC 6750 challenge instead of being quietly downgraded to the
 * public surface, so a client with a stale token learns to refresh it.
 */
export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const ROUTE = "/api/mcp";

function createHandler(
  authenticated: AuthenticatedToolContext | null,
): (request: Request) => Promise<Response> {
  return createMcpHandler(
    (server) => {
      registerMcpTools(server);
      registerMcpResources(server);
      // Registered only for a resolved caller, so an unauthenticated session
      // does not see `get_my_progress` or `get_next_step` in tools/list at
      // all: there is nothing to attempt and nothing to guess at.
      if (authenticated) {
        registerAuthenticatedMcpTools(server, authenticated);
      }
    },
    {
      serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
      instructions: MCP_SERVER_INSTRUCTIONS,
      // The transport is stateless per request, so an open subscription stream
      // would outlive the function that created it.
      maxSubscriptions: 0,
    },
  );
}

// The public handler is built once. An authenticated one is per request,
// because the tool closures carry that caller's principal.
const handleMcpRequest = createHandler(null);

function jsonRpcError(
  status: number,
  code: number,
  message: string,
): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    },
  );
}

function requestedLocale(request: Request): Locale {
  const requested = new URL(request.url).searchParams.get("locale");
  return isLocale(requested) ? requested : DEFAULT_LOCALE;
}

function finish(
  response: Response,
  outcome: McpRequestEvent["outcome"],
  startedAt: number,
): Response {
  logMcpRequestEvent({
    outcome,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });
  return response;
}

export async function GET(request: Request): Promise<Response> {
  const startedAt = Date.now();
  if (!isAgentAccessReady()) {
    return finish(
      new Response("Agent access is not enabled in this deployment.", {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-store",
        },
      }),
      "disabled",
      startedAt,
    );
  }
  return finish(
    new Response(renderMcpExplainer(requestedLocale(request)), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600",
        "X-Robots-Tag": "noindex, follow",
      },
    }),
    "served",
    startedAt,
  );
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();

  if (!isAgentAccessReady()) {
    return finish(
      jsonRpcError(503, -32000, "Agent access is not enabled."),
      "disabled",
      startedAt,
    );
  }

  const contentType = request.headers.get("content-type");
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return finish(
      jsonRpcError(
        415,
        -32700,
        "The Streamable HTTP transport requires Content-Type: application/json.",
      ),
      "unsupported_media_type",
      startedAt,
    );
  }

  // Per-client budget. The endpoint is public, so the trusted client address
  // is the only identity available and the key never stores it in the clear.
  let allowed: boolean;
  try {
    allowed = await consumeRateLimit({
      key: await hashedClientRateLimitKey(MCP_RATE_LIMIT_NAMESPACE, request),
      windowSeconds: MCP_RATE_LIMIT_WINDOW_SECONDS,
      max: MCP_RATE_LIMIT_MAX,
    });
  } catch (rateLimitError) {
    reportApiError({
      route: ROUTE,
      step: "rate-limit",
      error: rateLimitError,
      request,
    });
    return finish(
      jsonRpcError(503, -32000, "Rate-limit protection is unavailable."),
      "rate_limit_unavailable",
      startedAt,
    );
  }
  if (!allowed) {
    return finish(
      jsonRpcError(429, -32000, "Too many requests. Try again later."),
      "rate_limited",
      startedAt,
    );
  }

  // Identity, before the body is read: a credential that does not hold up
  // never gets to spend the 256 KB read budget. No header at all is not a
  // rejection, it is the public surface.
  let authenticated: AuthenticatedToolContext | null = null;
  if (request.headers.get("authorization") !== null) {
    const caller = await resolveAgentPrincipal(request);
    if (!caller.ok) {
      return finish(
        agentUnauthorizedResponse(caller.rejection),
        "unauthorized",
        startedAt,
      );
    }
    authenticated = {
      principal: caller.principal,
      request,
      readProgress: readAgentProgressSnapshot,
      recordEvent: recordAgentAccessEvent,
    };
  }

  const body = await readBoundedText(request, MCP_MAX_REQUEST_BYTES);
  if (!body.ok) {
    return finish(
      body.error === "body_too_large"
        ? jsonRpcError(413, -32600, "The request body is too large.")
        : jsonRpcError(400, -32700, "The request body could not be read."),
      body.error === "body_too_large" ? "payload_too_large" : "failed",
      startedAt,
    );
  }

  try {
    const handle = authenticated
      ? createHandler(authenticated)
      : handleMcpRequest;
    const response = await handle(withReplayedBody(request, body.text));
    return finish(response, "served", startedAt);
  } catch (error) {
    reportApiError({
      route: ROUTE,
      step: "unhandled",
      error,
      request,
    });
    return finish(
      jsonRpcError(500, -32603, "The agent endpoint could not answer."),
      "failed",
      startedAt,
    );
  }
}
