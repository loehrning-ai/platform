import { NextResponse } from "next/server";

import {
  hasJsonContentType,
  readBoundedJson,
} from "@/lib/http/read-json-body";
import { reportApiError } from "@/lib/observability/api-error";
import {
  courseTerminalDailyRunBudget,
  isCourseTerminalRuntimeReady,
} from "@/lib/provider-readiness";
import {
  consumeMultiRateLimit,
  hashedAuthenticatedRateLimitKey,
  hashedClientRateLimitKey,
} from "@/lib/security/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth-server";

import {
  executeSyntheticWorkspace,
  SyntheticTerminalExecutionError,
} from "./sandbox-adapter";
import type {
  SyntheticTerminalError,
  SyntheticTerminalResponse,
} from "./types";
import { syntheticTerminalRequestSchema } from "./validation";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 4 * 1024;
const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

function jsonResponse(
  body: SyntheticTerminalResponse | SyntheticTerminalError,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_RESPONSE_HEADERS,
  });
}

export async function POST(req: Request): Promise<Response> {
  const startedAt = Date.now();
  if (!hasJsonContentType(req)) {
    return jsonResponse({ error: "unsupported_media_type" }, 415);
  }

  let auth;
  try {
    auth = await getAuthenticatedUser();
  } catch (error) {
    reportApiError({ request: req, step: "auth-get-user", error });
    return jsonResponse({ error: "auth_unavailable" }, 503);
  }
  if (auth.configured && auth.error) {
    reportApiError({ request: req, step: "auth-get-user", error: auth.error });
    return jsonResponse({ error: "auth_unavailable" }, 503);
  }
  if (!auth.configured || !auth.user) {
    return jsonResponse(
      { error: auth.configured ? "unauthorized" : "auth_not_configured" },
      auth.configured ? 401 : 503,
    );
  }
  if (!isCourseTerminalRuntimeReady()) {
    return jsonResponse({ error: "terminal_not_ready" }, 503);
  }

  const dailyBudget = courseTerminalDailyRunBudget();
  if (dailyBudget === null) {
    return jsonResponse({ error: "terminal_not_ready" }, 503);
  }

  let body;
  try {
    body = await readBoundedJson(req, MAX_BODY_BYTES);
  } catch (error) {
    reportApiError({ request: req, step: "unhandled", error });
    return jsonResponse({ error: "invalid_request" }, 400);
  }
  if (!body.ok && body.error === "body_too_large") {
    return jsonResponse({ error: "request_too_large" }, 413);
  }
  if (!body.ok) return jsonResponse({ error: "invalid_json" }, 400);

  const parsed = syntheticTerminalRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return jsonResponse({ error: "invalid_terminal_command" }, 400);
  }

  try {
    const withinBudget = await consumeMultiRateLimit({
      windowSeconds: 86_400,
      entries: [
        {
          key: await hashedAuthenticatedRateLimitKey(
            "course-terminal-day",
            req,
            auth.user.id,
          ),
          max: 6,
        },
        {
          key: await hashedClientRateLimitKey("course-terminal-day", req),
          max: 30,
        },
        { key: "course-terminal-global-day-v1", max: dailyBudget },
      ],
    });
    if (!withinBudget) {
      return jsonResponse({ error: "terminal_budget_exhausted" }, 429);
    }
  } catch (error) {
    reportApiError({ request: req, step: "rate-limit", error });
    return jsonResponse({ error: "terminal_budget_unavailable" }, 503);
  }

  try {
    const result = await executeSyntheticWorkspace(parsed.data);
    // Fixed command IDs only; do not log terminal transcripts or diffs.
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        route: "course-workspace/terminal",
        status: "success",
        commandCount: parsed.data.commands.length,
        durationMs: Date.now() - startedAt,
      }),
    );
    return jsonResponse(result);
  } catch (error) {
    reportApiError({
      request: req,
      step: "sandbox-run",
      error,
      extra: { durationMs: Date.now() - startedAt },
    });
    const timeout =
      error instanceof SyntheticTerminalExecutionError &&
      error.kind === "timeout";
    return jsonResponse(
      { error: timeout ? "terminal_timeout" : "terminal_unavailable" },
      timeout ? 504 : 503,
    );
  }
}
