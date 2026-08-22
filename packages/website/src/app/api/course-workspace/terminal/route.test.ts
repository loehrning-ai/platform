import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  ready: vi.fn(),
  dailyBudget: vi.fn(),
  consume: vi.fn(),
  userKey: vi.fn(),
  ipKey: vi.fn(),
  execute: vi.fn(),
  report: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.auth,
}));
vi.mock("@/lib/provider-readiness", () => ({
  isCourseTerminalRuntimeReady: mocks.ready,
  courseTerminalDailyRunBudget: mocks.dailyBudget,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeMultiRateLimit: mocks.consume,
  hashedAuthenticatedRateLimitKey: mocks.userKey,
  hashedClientRateLimitKey: mocks.ipKey,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.report,
}));
vi.mock("./sandbox-adapter", () => {
  class SyntheticTerminalExecutionError extends Error {
    readonly kind: "timeout" | "unavailable";
    constructor(kind: "timeout" | "unavailable") {
      super(`Synthetic terminal failure:${kind}`);
      this.kind = kind;
    }
  }
  return {
    executeSyntheticWorkspace: mocks.execute,
    SyntheticTerminalExecutionError,
  };
});

import { POST, maxDuration, runtime } from "./route";
import { SyntheticTerminalExecutionError } from "./sandbox-adapter";
import { REPOSITORY_TERMINAL_COMMANDS } from "./types";

const VALID_REQUEST = {
  workspace: "pipeline-quality",
  commands: [...REPOSITORY_TERMINAL_COMMANDS],
};

function request(body: unknown, contentType = "application/json"): Request {
  return new Request("https://example.test/api/course-workspace/terminal", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function expectPrivateResponse(response: Response): void {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-robots-tag")).toBe(
    "noindex, nofollow, noarchive",
  );
}

describe("POST /api/course-workspace/terminal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      configured: true,
      user: { id: "fake-user" },
    });
    mocks.ready.mockReturnValue(true);
    mocks.dailyBudget.mockReturnValue(100);
    mocks.consume.mockResolvedValue(true);
    mocks.userKey.mockResolvedValue("course-terminal:user-safe");
    mocks.ipKey.mockResolvedValue("course-terminal:ip-safe");
    mocks.execute.mockResolvedValue({
      workspace: "pipeline-quality",
      runtime: "node24",
      network: "deny-all",
      persistent: false,
      commands: [
        {
          commandId: "test-after-fix",
          command: "node --test",
          stdout: "pass 1",
          stderr: "",
          exitCode: 0,
          durationMs: 5,
          truncated: false,
        },
      ],
      diff: "+ bounded fix",
      diffTruncated: false,
      attestation: {
        contract: "pipeline-quality-v1",
        workspace: "pipeline-quality",
        outcome: "verified",
        commandCount: 10,
      },
    });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("is pinned to the Node runtime and a 60-second function ceiling", () => {
    expect(runtime).toBe("nodejs");
    expect(maxDuration).toBe(60);
  });

  it("authenticates, applies user/IP/global durable limits, and returns the actual adapter result", async () => {
    const response = await POST(request(VALID_REQUEST));
    expect(response.status).toBe(200);
    expectPrivateResponse(response);
    expect(await response.json()).toMatchObject({
      runtime: "node24",
      network: "deny-all",
      persistent: false,
      diff: "+ bounded fix",
    });
    expect(mocks.consume).toHaveBeenCalledWith({
      windowSeconds: 86_400,
      entries: [
        { key: "course-terminal:user-safe", max: 6 },
        { key: "course-terminal:ip-safe", max: 30 },
        { key: "course-terminal-global-day-v1", max: 100 },
      ],
    });
    expect(mocks.consume).toHaveBeenCalledTimes(1);
    expect(mocks.execute).toHaveBeenCalledWith(VALID_REQUEST);
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(
      "bounded fix",
    );
  });

  it("does not consume any durable quota for an invalid command body", async () => {
    const response = await POST(
      request({
        workspace: "pipeline-quality",
        commands: ["rm -rf /"],
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_terminal_command" });
    expect(mocks.consume).not.toHaveBeenCalled();
    expect(mocks.userKey).not.toHaveBeenCalled();
    expect(mocks.ipKey).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it.each([
    ["subset", ["workspace-path"]],
    ["reordered", [...REPOSITORY_TERMINAL_COMMANDS].reverse()],
    [
      "repeated",
      REPOSITORY_TERMINAL_COMMANDS.map((command, index) =>
        index === 1 ? "workspace-path" : command,
      ),
    ],
  ] as const)("rejects a %s fixed-command sequence before quota", async (_label, commands) => {
    const response = await POST(
      request({ workspace: "pipeline-quality", commands }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_terminal_command" });
    expect(mocks.consume).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("fails closed before execution for missing auth or runtime readiness", async () => {
    mocks.auth.mockResolvedValueOnce({ configured: true, user: null });
    const unauthorized = await POST(request(VALID_REQUEST));
    expect(unauthorized.status).toBe(401);
    expect(mocks.execute).not.toHaveBeenCalled();

    mocks.auth.mockResolvedValueOnce({
      configured: true,
      user: { id: "fake-user" },
    });
    mocks.ready.mockReturnValueOnce(false);
    const notReady = await POST(request(VALID_REQUEST));
    expect(notReady.status).toBe(503);
    expect(await notReady.json()).toEqual({ error: "terminal_not_ready" });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("fails closed on durable quota errors and maps sandbox timeout without exposing details", async () => {
    mocks.consume.mockRejectedValueOnce(new Error("private quota detail"));
    const quotaFailure = await POST(request(VALID_REQUEST));
    expect(quotaFailure.status).toBe(503);
    expect(await quotaFailure.json()).toEqual({
      error: "terminal_budget_unavailable",
    });
    expect(mocks.execute).not.toHaveBeenCalled();

    mocks.consume.mockResolvedValue(true);
    mocks.execute.mockRejectedValueOnce(
      new SyntheticTerminalExecutionError("timeout"),
    );
    const timeout = await POST(request(VALID_REQUEST));
    expect(timeout.status).toBe(504);
    expect(await timeout.json()).toEqual({ error: "terminal_timeout" });
  });

  it("rejects an atomic quota refusal without executing a workspace", async () => {
    mocks.consume.mockResolvedValueOnce(false);

    const response = await POST(request(VALID_REQUEST));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "terminal_budget_exhausted",
    });
    expect(mocks.consume).toHaveBeenCalledTimes(1);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
