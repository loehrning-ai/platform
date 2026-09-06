/**
 * /api/account/agent-tokens.
 *
 * The route skeleton is pinned gate by gate: media type, readiness, session,
 * the paired rate limit, the request ceiling, the owner binding, the strict
 * schema, and only then the store. The store itself is a scripted fake, so the
 * exact statement shape the route sends is observable.
 *
 * The load-bearing assertion in the mint path is negative: the clear token
 * must reach the response and nothing else. Never the insert, never a log.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface QueryOp {
  readonly name: string;
  readonly args: readonly unknown[];
}

interface TableCall {
  readonly table: string;
  readonly ops: QueryOp[];
}

const mockGetUser = vi.fn<
  () => Promise<{
    configured: boolean;
    user: { id: string } | null;
    error?: unknown;
  }>
>(async () => ({ configured: true, user: { id: OWNER_ID } }));
const mockConsumeRateLimit = vi.fn<(...args: unknown[]) => Promise<boolean>>(
  async () => true,
);
const mockReportApiError = vi.fn<(...args: unknown[]) => void>();

const OWNER_ID = "9f1d7c2a-6f5b-4a3e-9d21-0f6b4c8e1a77";
const TOKEN_ID = "1b2c3d4e-5f60-4718-8293-a4b5c6d7e8f9";

let queued: unknown[] = [];
let calls: TableCall[] = [];
let serviceClientAvailable = true;

function nextResult(): unknown {
  return queued.length > 0
    ? queued.shift()
    : { data: null, error: null, count: 0 };
}

function builderFor(call: TableCall): Record<string, unknown> {
  const builder: Record<string, unknown> = {};
  for (const name of ["select", "eq", "is", "insert", "update", "delete"]) {
    builder[name] = (...args: unknown[]) => {
      call.ops.push({ name, args });
      return builder;
    };
  }
  for (const name of ["single", "maybeSingle"]) {
    builder[name] = async () => {
      call.ops.push({ name, args: [] });
      return nextResult();
    };
  }
  // A Supabase query builder is thenable, so `await client.from(...)…` without
  // a terminal method resolves too. The count query relies on exactly that.
  builder.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(nextResult()).then(resolve, reject);
  return builder;
}

vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: () => mockGetUser(),
}));
vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () =>
    serviceClientAvailable
      ? {
          from: (table: string) => {
            const call: TableCall = { table, ops: [] };
            calls.push(call);
            return builderFor(call);
          },
        }
      : null,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
  hashedAuthenticatedRateLimitKey: async (
    namespace: string,
    _request: Request,
    userId: string,
  ) => `${namespace}:user-v1:${userId.length}`,
  hashedClientRateLimitKey: async (namespace: string) =>
    `${namespace}:ip-v1:${"a".repeat(64)}`,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: (...args: unknown[]) => mockReportApiError(...args),
}));

import {
  hashPersonalAccessToken,
  isPersonalAccessToken,
} from "@/lib/agent-access/personal-tokens";
import { DELETE, POST, runtime } from "./route";

const ENDPOINT = "https://loehrning.ai/api/account/agent-tokens";

function request(
  method: "POST" | "DELETE",
  body: unknown,
  headers: Record<string, string> = { "Content-Type": "application/json" },
): Request {
  return new Request(ENDPOINT, {
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function enableAgentAccess(): void {
  vi.stubEnv("MCP_SERVER_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", `rlh1_${"a".repeat(64)}`);
  // The route gates on the complete EU account runtime, not only the
  // limiter backend: a token hands an external client one learner's account.
  vi.stubEnv("SUPABASE_REGION", "eu-central-1");
  vi.stubEnv("SUPABASE_DPA_CONFIRMED_AT", "2026-07-01");
}

function opNamed(call: TableCall, name: string): QueryOp | undefined {
  return call.ops.find((op) => op.name === name);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  queued = [];
  calls = [];
  serviceClientAvailable = true;
  mockGetUser.mockClear();
  mockGetUser.mockImplementation(async () => ({
    configured: true,
    user: { id: OWNER_ID },
  }));
  mockConsumeRateLimit.mockClear();
  mockConsumeRateLimit.mockImplementation(async () => true);
  mockReportApiError.mockClear();
  enableAgentAccess();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("route contract", () => {
  it("runs on the Node runtime", () => {
    expect(runtime).toBe("nodejs");
  });
});

describe("POST gates", () => {
  it("refuses a body that is not JSON", async () => {
    const response = await POST(
      request("POST", "name=Laptop", { "Content-Type": "text/plain" }),
    );
    expect(response.status).toBe(415);
    expect(await readJson(response)).toEqual({
      error: "unsupported_media_type",
    });
  });

  it("fails closed while agent access is not enabled", async () => {
    vi.stubEnv("MCP_SERVER_ENABLED", "false");
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(503);
    expect((await readJson(response)).error).toBe("agent_access_disabled");
    expect(calls).toHaveLength(0);
  });

  it("answers 401 without a session", async () => {
    mockGetUser.mockImplementation(async () => ({
      configured: true,
      user: null,
    }));
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(401);
    expect((await readJson(response)).error).toBe("unauthorized");
  });

  it("separates an auth outage from being logged out", async () => {
    mockGetUser.mockImplementation(async () => ({
      configured: true,
      user: null,
      error: new Error("supabase unreachable"),
    }));
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(503);
    expect((await readJson(response)).error).toBe("auth_unavailable");
    expect(mockReportApiError).toHaveBeenCalled();
  });

  it("answers 503 when auth is not configured", async () => {
    mockGetUser.mockImplementation(async () => ({
      configured: false,
      user: null,
    }));
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(503);
    expect((await readJson(response)).error).toBe("auth_not_configured");
  });

  it("pairs an account budget with a client ceiling", async () => {
    mockConsumeRateLimit.mockImplementationOnce(async () => false);
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(429);
    expect((await readJson(response)).error).toBe("rate_limit_exceeded");
    expect(mockConsumeRateLimit).toHaveBeenCalledTimes(1);
  });

  it("stops on the client ceiling too", async () => {
    mockConsumeRateLimit
      .mockImplementationOnce(async () => true)
      .mockImplementationOnce(async () => false);
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(429);
    expect(calls).toHaveLength(0);
  });

  it("refuses to mint while the limiter is unavailable", async () => {
    mockConsumeRateLimit.mockImplementation(async () => {
      throw new Error("durable backend unavailable");
    });
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(503);
    expect((await readJson(response)).error).toBe("rate_limit_unavailable");
  });

  it("rejects an oversized body before parsing it", async () => {
    const response = await POST(
      request("POST", {
        expectedOwnerId: OWNER_ID,
        name: "x".repeat(8 * 1024),
      }),
    );
    expect(response.status).toBe(413);
    expect((await readJson(response)).error).toBe("payload_too_large");
  });

  it("requires an owner binding", async () => {
    const response = await POST(request("POST", { name: "Laptop" }));
    expect(response.status).toBe(400);
    expect((await readJson(response)).error).toBe("invalid_owner_binding");
  });

  it("refuses a binding for another account", async () => {
    const response = await POST(
      request("POST", { expectedOwnerId: "someone-else", name: "Laptop" }),
    );
    expect(response.status).toBe(409);
    expect((await readJson(response)).error).toBe("account_owner_mismatch");
    expect(calls).toHaveLength(0);
  });

  it("refuses an unusable name and an unknown field", async () => {
    for (const body of [
      { expectedOwnerId: OWNER_ID },
      { expectedOwnerId: OWNER_ID, name: "   " },
      { expectedOwnerId: OWNER_ID, name: "x".repeat(65) },
      // A control character in the label would survive into the audit
      // trail's client column and into a log line.
      { expectedOwnerId: OWNER_ID, name: "Laptop\u0007" },
      { expectedOwnerId: OWNER_ID, name: "Laptop", scopes: ["write"] },
      { expectedOwnerId: OWNER_ID, name: "Laptop", token: "lat_supplied" },
    ]) {
      const response = await POST(request("POST", body));
      expect(response.status, JSON.stringify(body)).toBe(400);
      expect((await readJson(response)).error).toBe("invalid_token_name");
    }
    expect(calls).toHaveLength(0);
  });

  it("answers 503 when the store is not configured", async () => {
    serviceClientAvailable = false;
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );
    expect(response.status).toBe(503);
    expect((await readJson(response)).error).toBe("token_store_unavailable");
  });
});

describe("POST mints a token exactly once", () => {
  it("returns the clear token and stores only its digest", async () => {
    queued = [
      { count: 1, error: null },
      {
        data: {
          id: TOKEN_ID,
          name: "Laptop",
          prefix: "lat_abcdefgh",
          created_at: "2026-09-05T10:00:00.000Z",
        },
        error: null,
      },
      { count: 2, error: null },
    ];

    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: " Laptop " }),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");

    const body = await readJson(response);
    const token = String(body.token);
    expect(isPersonalAccessToken(token)).toBe(true);
    expect(body).toMatchObject({
      ok: true,
      ownerId: OWNER_ID,
      tokenShownOnce: true,
      id: TOKEN_ID,
      limit: 5,
      activeTokens: 2,
    });

    const insert = opNamed(calls[1]!, "insert")!;
    const row = insert.args[0] as Record<string, string>;
    expect(calls[1]!.table).toBe("agent_access_tokens");
    expect(Object.keys(row).sort()).toEqual([
      "name",
      "prefix",
      "token_hash",
      "user_id",
    ]);
    expect(row.user_id).toBe(OWNER_ID);
    // Trimmed by the schema, so a padded label cannot mint a padded name.
    expect(row.name).toBe("Laptop");
    expect(row.token_hash).toBe(await hashPersonalAccessToken(token));
    expect(JSON.stringify(row)).not.toContain(token);
    expect(row.prefix).toBe(token.slice(0, 12));
  });

  it("counts only live tokens when it checks the ceiling", async () => {
    queued = [
      { count: 0, error: null },
      { data: { id: TOKEN_ID, name: "A", prefix: "lat_aaaaaaaa", created_at: "x" }, error: null },
      { count: 1, error: null },
    ];
    await POST(request("POST", { expectedOwnerId: OWNER_ID, name: "A" }));

    const countOps = calls[0]!.ops.map((op) => op.name);
    expect(countOps).toEqual(["select", "eq", "is"]);
    expect(calls[0]!.ops[0]!.args).toEqual([
      "id",
      { count: "exact", head: true },
    ]);
    expect(calls[0]!.ops[1]!.args).toEqual(["user_id", OWNER_ID]);
    expect(calls[0]!.ops[2]!.args).toEqual(["revoked_at", null]);
  });

  it("refuses a sixth live token", async () => {
    queued = [{ count: 5, error: null }];
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Sixth" }),
    );

    expect(response.status).toBe(409);
    expect(await readJson(response)).toEqual({ error: "token_limit", limit: 5 });
    expect(calls).toHaveLength(1);
  });

  it("withdraws its own token when a concurrent mint won the last slot", async () => {
    queued = [
      { count: 4, error: null },
      { data: { id: TOKEN_ID, name: "Race", prefix: "lat_aaaaaaaa", created_at: "x" }, error: null },
      { count: 6, error: null },
      { data: null, error: null },
    ];
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Race" }),
    );

    expect(response.status).toBe(409);
    expect((await readJson(response)).error).toBe("token_limit");
    const withdrawal = calls[3]!;
    expect(withdrawal.ops.map((op) => op.name)).toEqual(["delete", "eq", "eq"]);
    expect(withdrawal.ops[1]!.args).toEqual(["id", TOKEN_ID]);
    expect(withdrawal.ops[2]!.args).toEqual(["user_id", OWNER_ID]);
  });

  it("reports a refused insert without inventing a token", async () => {
    queued = [
      { count: 0, error: null },
      { data: null, error: { code: "23514", message: "check violation" } },
    ];
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );

    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({ error: "token_mint_failed" });
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "supabase-insert" }),
    );
  });

  it("reports a failed pre-count instead of minting blind", async () => {
    queued = [{ count: null, error: { code: "PGRST301", message: "denied" } }];
    const response = await POST(
      request("POST", { expectedOwnerId: OWNER_ID, name: "Laptop" }),
    );

    expect(response.status).toBe(500);
    expect((await readJson(response)).error).toBe("token_mint_failed");
    expect(calls).toHaveLength(1);
  });
});

describe("DELETE revokes a token", () => {
  const validBody = { expectedOwnerId: OWNER_ID, tokenId: TOKEN_ID };

  it("refuses a body that is not JSON", async () => {
    const response = await DELETE(
      request("DELETE", "id=1", { "Content-Type": "text/plain" }),
    );
    expect(response.status).toBe(415);
  });

  it("keeps working while agent access is disabled", async () => {
    vi.stubEnv("MCP_SERVER_ENABLED", "false");
    queued = [
      {
        data: {
          id: TOKEN_ID,
          name: "Laptop",
          prefix: "lat_abcdefgh",
          revoked_at: "2026-09-05T11:00:00.000Z",
        },
        error: null,
      },
    ];
    const response = await DELETE(request("DELETE", validBody));

    expect(response.status).toBe(200);
    expect((await readJson(response)).ok).toBe(true);
  });

  it("answers 401 without a session", async () => {
    mockGetUser.mockImplementation(async () => ({
      configured: true,
      user: null,
    }));
    const response = await DELETE(request("DELETE", validBody));
    expect(response.status).toBe(401);
  });

  it("refuses a binding for another account", async () => {
    const response = await DELETE(
      request("DELETE", { ...validBody, expectedOwnerId: "someone-else" }),
    );
    expect(response.status).toBe(409);
    expect(calls).toHaveLength(0);
  });

  it("refuses a token id that is not one", async () => {
    for (const tokenId of ["", "not-a-uuid", `${TOKEN_ID} or 1=1`]) {
      const response = await DELETE(request("DELETE", { ...validBody, tokenId }));
      expect(response.status, tokenId).toBe(400);
      expect((await readJson(response)).error).toBe("invalid_token_id");
    }
    expect(calls).toHaveLength(0);
  });

  it("scopes the revocation to the owner and to a live token", async () => {
    queued = [
      {
        data: {
          id: TOKEN_ID,
          name: "Laptop",
          prefix: "lat_abcdefgh",
          revoked_at: "2026-09-05T11:00:00.000Z",
        },
        error: null,
      },
    ];
    const response = await DELETE(request("DELETE", validBody));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({
      ok: true,
      ownerId: OWNER_ID,
      id: TOKEN_ID,
      revokedAt: "2026-09-05T11:00:00.000Z",
    });
    const ops = calls[0]!.ops;
    expect(ops.map((op) => op.name)).toEqual([
      "update",
      "eq",
      "eq",
      "is",
      "select",
      "maybeSingle",
    ]);
    expect(Object.keys(ops[0]!.args[0] as object)).toEqual(["revoked_at"]);
    expect(ops[1]!.args).toEqual(["id", TOKEN_ID]);
    expect(ops[2]!.args).toEqual(["user_id", OWNER_ID]);
    expect(ops[3]!.args).toEqual(["revoked_at", null]);
  });

  it("answers 404 for a token that is not this account's or already revoked", async () => {
    queued = [{ data: null, error: null }];
    const response = await DELETE(request("DELETE", validBody));

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({ error: "token_not_found" });
  });

  it("reports a failed revoke", async () => {
    queued = [{ data: null, error: { code: "PGRST301", message: "denied" } }];
    const response = await DELETE(request("DELETE", validBody));

    expect(response.status).toBe(500);
    expect((await readJson(response)).error).toBe("token_revoke_failed");
    expect(mockReportApiError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "supabase-write" }),
    );
  });
});

describe("every answer stays private", () => {
  it("never lets a token response be cached", async () => {
    queued = [{ data: null, error: null }];
    const responses = [
      await POST(request("POST", { expectedOwnerId: "other", name: "x" })),
      await DELETE(request("DELETE", { expectedOwnerId: OWNER_ID, tokenId: TOKEN_ID })),
    ];
    for (const response of responses) {
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    }
  });
});
