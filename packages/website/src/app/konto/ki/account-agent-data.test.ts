import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchAgentAccessEvents,
  fetchAgentTokens,
  fetchOAuthGrants,
  oauthGrantsApi,
  toGrant,
} from "./account-agent-data";

type QueryResult = { data: unknown; error: unknown };

/**
 * A PostgREST builder stub. Every filter returns the builder, and awaiting it
 * resolves the configured result, which is exactly the surface these readers
 * touch.
 */
function stubClient(result: QueryResult | (() => never)) {
  const calls: { table?: string; columns?: string; filters: unknown[][] } = {
    filters: [],
  };
  const builder: Record<string, unknown> = {
    select(columns: string) {
      calls.columns = columns;
      return builder;
    },
    eq(column: string, value: unknown) {
      calls.filters.push([column, value]);
      return builder;
    },
    order(column: string, options: unknown) {
      calls.filters.push(["order", column, options]);
      return builder;
    },
    limit(count: number) {
      calls.filters.push(["limit", count]);
      return builder;
    },
    then(resolve: (value: QueryResult) => unknown) {
      if (typeof result === "function") result();
      return Promise.resolve(result as QueryResult).then(resolve);
    },
  };
  const client = {
    from: vi.fn((table: string) => {
      calls.table = table;
      return builder;
    }),
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const EVENT_ROW = {
  id: "3f4c2f4a-1111-4222-8333-444455556666",
  client: "pat:Laptop",
  tool: "get_my_progress",
  ok: true,
  duration_ms: 42,
  created_at: "2026-09-05T07:04:09.000Z",
};

const TOKEN_ROW = {
  id: "9a4c2f4a-1111-4222-8333-444455556666",
  name: "Claude Desktop",
  prefix: "lat_ab12cd34",
  created_at: "2026-09-01T09:00:00.000Z",
  last_used_at: null,
  revoked_at: null,
};

describe("agent access events read", () => {
  it("returns validated rows newest first", async () => {
    const { client, calls } = stubClient({ data: [EVENT_ROW], error: null });
    const result = await fetchAgentAccessEvents(client, "owner-1");
    expect(result).toEqual({
      ok: true,
      items: [
        {
          id: EVENT_ROW.id,
          client: "pat:Laptop",
          tool: "get_my_progress",
          ok: true,
          durationMs: 42,
          createdAt: "2026-09-05T07:04:09.000Z",
        },
      ],
    });
    expect(calls.table).toBe("agent_access_events");
    expect(calls.filters).toContainEqual(["user_id", "owner-1"]);
    expect(calls.filters).toContainEqual(["limit", 50]);
  });

  it("drops a malformed row instead of rendering it", async () => {
    const { client } = stubClient({
      data: [
        { ...EVENT_ROW, ok: "yes" },
        { ...EVENT_ROW, id: "second", duration_ms: -5 },
        { ...EVENT_ROW, id: "third", created_at: "whenever" },
        EVENT_ROW,
      ],
      error: null,
    });
    const result = await fetchAgentAccessEvents(client, "owner-1");
    expect(result.ok).toBe(true);
    expect(result.ok && result.items).toHaveLength(1);
  });

  it("reports unavailable rather than empty when the read fails", async () => {
    const { client } = stubClient({ data: null, error: { message: "boom" } });
    expect(await fetchAgentAccessEvents(client, "owner-1")).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("reports unavailable when the client throws", async () => {
    const { client } = stubClient(() => {
      throw new Error("network");
    });
    expect(await fetchAgentAccessEvents(client, "owner-1")).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

describe("agent access tokens read", () => {
  it("names the granted columns, because the table refuses select star", async () => {
    const { client, calls } = stubClient({ data: [TOKEN_ROW], error: null });
    await fetchAgentTokens(client, "owner-1");
    expect(calls.columns).toBe(
      "id, name, prefix, created_at, last_used_at, revoked_at",
    );
    expect(calls.columns).not.toContain("token_hash");
  });

  it("maps a revoked token with its timestamps", async () => {
    const { client } = stubClient({
      data: [
        {
          ...TOKEN_ROW,
          last_used_at: "2026-09-02T10:00:00.000Z",
          revoked_at: "2026-09-03T10:00:00.000Z",
        },
      ],
      error: null,
    });
    const result = await fetchAgentTokens(client, "owner-1");
    expect(result.ok && result.items[0]).toMatchObject({
      lastUsedAt: "2026-09-02T10:00:00.000Z",
      revokedAt: "2026-09-03T10:00:00.000Z",
    });
  });

  it("reports unavailable when the read fails", async () => {
    const { client } = stubClient({ data: null, error: { message: "boom" } });
    expect(await fetchAgentTokens(client, "owner-1")).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

describe("oauth grants read", () => {
  const GRANT = {
    client: {
      id: "6b2f4a11-2222-4333-8444-555566667777",
      name: "Claude Desktop",
      uri: "https://claude.ai",
      logo_uri: "",
    },
    scopes: ["progress:read", "cv:read"],
    granted_at: "2026-09-04T12:00:00.000Z",
  };

  it("separates a deployment without the namespace from a failed call", async () => {
    const withoutNamespace = { auth: {} } as unknown as SupabaseClient;
    expect(await fetchOAuthGrants(withoutNamespace)).toEqual({
      ok: false,
      reason: "not-configured",
    });
    expect(oauthGrantsApi(withoutNamespace)).toBeNull();

    const failing = {
      auth: { oauth: { listGrants: async () => ({ data: null, error: {} }) } },
    } as unknown as SupabaseClient;
    expect(await fetchOAuthGrants(failing)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("returns validated grants", async () => {
    const client = {
      auth: {
        oauth: { listGrants: async () => ({ data: [GRANT], error: null }) },
      },
    } as unknown as SupabaseClient;
    expect(await fetchOAuthGrants(client)).toEqual({
      ok: true,
      items: [
        {
          clientId: GRANT.client.id,
          clientName: "Claude Desktop",
          clientUri: "https://claude.ai",
          scopes: ["progress:read", "cv:read"],
          grantedAt: "2026-09-04T12:00:00.000Z",
        },
      ],
    });
  });

  it("reports unavailable when listGrants throws", async () => {
    const client = {
      auth: {
        oauth: {
          listGrants: async () => {
            throw new Error("offline");
          },
        },
      },
    } as unknown as SupabaseClient;
    expect(await fetchOAuthGrants(client)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("drops a grant without a client id, since it could not be revoked", () => {
    expect(toGrant({ client: {}, scopes: [] })).toBeNull();
    expect(toGrant(null)).toBeNull();
  });

  it("bounds third-party display strings and the scope list", () => {
    const grant = toGrant({
      client: {
        id: "client-1",
        name: "N".repeat(500),
        uri: "https://example.test",
      },
      scopes: [
        ...Array.from({ length: 40 }, (_, index) => `scope_${index}`),
        42,
        "",
      ],
      granted_at: "not-a-date",
    });
    expect(grant?.clientName).toHaveLength(200);
    expect(grant?.scopes).toHaveLength(16);
    expect(grant?.grantedAt).toBeNull();
  });
});
