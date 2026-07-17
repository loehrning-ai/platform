import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTryCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  tryCreateServiceClient: () => mockTryCreate(),
}));

import { GET } from "./route";

const SUPABASE_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function clientWithLimitResult(result: {
  error: { code: string } | null;
}): unknown {
  return {
    from: () => ({
      select: () => ({ limit: async () => result }),
    }),
  };
}

type HealthBody = {
  status: "ok" | "degraded";
  supabase: "disabled" | "ok" | "error";
  anthropicEnabled: boolean;
  timestamp: string;
};

function configureSupabase() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fake-public-key";
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
}

describe("GET /api/health", () => {
  beforeEach(() => {
    mockTryCreate.mockReset();
    for (const key of SUPABASE_KEYS) delete process.env[key];
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_DPA_CONFIRMED_AT;
    delete process.env.ANTHROPIC_RETENTION_DAYS;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const key of SUPABASE_KEYS) delete process.env[key];
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_DPA_CONFIRMED_AT;
    delete process.env.ANTHROPIC_RETENTION_DAYS;
  });

  it("200 ok when optional Supabase is disabled", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as HealthBody;
    expect(json.status).toBe("ok");
    expect(json.supabase).toBe("disabled");
    expect(mockTryCreate).not.toHaveBeenCalled();
  });

  it("200 ok when configured Supabase answers", async () => {
    configureSupabase();
    mockTryCreate.mockReturnValueOnce(clientWithLimitResult({ error: null }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(((await res.json()) as HealthBody).supabase).toBe("ok");
  });

  it("200 ok when the configured table is empty", async () => {
    configureSupabase();
    mockTryCreate.mockReturnValueOnce(
      clientWithLimitResult({ error: { code: "PGRST116" } }),
    );
    const res = await GET();
    expect(res.status).toBe(200);
    expect(((await res.json()) as HealthBody).supabase).toBe("ok");
  });

  it("503 when provider variables exist but no service client can be created", async () => {
    configureSupabase();
    mockTryCreate.mockReturnValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(503);
    expect(((await res.json()) as HealthBody).supabase).toBe("error");
  });

  it.each(["42P01", "ECONNREFUSED"])(
    "503 when configured Supabase returns %s",
    async (code) => {
      configureSupabase();
      mockTryCreate.mockReturnValueOnce(
        clientWithLimitResult({ error: { code } }),
      );
      const res = await GET();
      expect(res.status).toBe(503);
      expect(((await res.json()) as HealthBody).supabase).toBe("error");
    },
  );

  it("503 when the configured client factory throws", async () => {
    configureSupabase();
    mockTryCreate.mockImplementationOnce(() => {
      throw new Error("unreachable");
    });
    const res = await GET();
    expect(res.status).toBe(503);
    expect(((await res.json()) as HealthBody).supabase).toBe("error");
  });

  it("reports Anthropic enabled only when flag, key, and quota backend are ready", async () => {
    process.env.AI_NATIVE_PRACTICE_ENABLED = "true";
    let json = (await (await GET()).json()) as HealthBody;
    expect(json.anthropicEnabled).toBe(false);

    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
    json = (await (await GET()).json()) as HealthBody;
    expect(json.anthropicEnabled).toBe(false);

    configureSupabase();
    mockTryCreate.mockReturnValueOnce(clientWithLimitResult({ error: null }));
    json = (await (await GET()).json()) as HealthBody;
    expect(json.anthropicEnabled).toBe(true);
  });
});
