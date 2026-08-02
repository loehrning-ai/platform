import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installProductionServerLogPrivacyBoundary,
  SERVER_ERROR_REDACTED_LINE,
  SERVER_LOG_PRIVACY_STATE_KEY,
  writeRedactedServerErrorMarker,
  writeSafeApiErrorLog,
} from "../server-log-privacy";

const STATE_SYMBOL = Symbol.for(SERVER_LOG_PRIVACY_STATE_KEY);
const originalConsoleError = console.error;
const JWT_HEADER_CANARY = ["eyJ", "hbGci", "OiJIUzI1NiJ9"].join("");

function clearInstalledBoundary(): void {
  console.error = originalConsoleError;
  delete (globalThis as unknown as Record<PropertyKey, unknown>)[STATE_SYMBOL];
}

beforeEach(() => {
  clearInstalledBoundary();
});

afterEach(() => {
  clearInstalledBoundary();
  vi.unstubAllEnvs();
});

describe("production server log privacy boundary", () => {
  it("installs only in the production Node runtime", () => {
    const sink = vi.fn();
    console.error = sink;

    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    expect(installProductionServerLogPrivacyBoundary()).toBe(false);
    expect(console.error).toBe(sink);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "edge");
    expect(installProductionServerLogPrivacyBoundary()).toBe(false);
    expect(console.error).toBe(sink);

    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    expect(installProductionServerLogPrivacyBoundary()).toBe(true);
    expect(console.error).not.toBe(sink);
  });

  it("never inspects or forwards arbitrary console arguments", () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    installProductionServerLogPrivacyBoundary();

    const secret = `learner@example.com private-prompt ${JWT_HEADER_CANARY}`;
    const hostile = new Proxy(
      {},
      {
        get() {
          throw new Error(secret);
        },
        ownKeys() {
          throw new Error(secret);
        },
      },
    );

    expect(() =>
      console.error(
        new Error(secret),
        secret,
        hostile,
        { authorization: `Bearer ${secret}` },
      )).not.toThrow();
    expect(sink).toHaveBeenCalledExactlyOnceWith(SERVER_ERROR_REDACTED_LINE);
    expect(JSON.stringify(sink.mock.calls)).not.toContain("learner@example.com");
    expect(JSON.stringify(sink.mock.calls)).not.toContain("eyJhbGci");
  });

  it("is idempotent and restores its guard if the console method was replaced", () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    expect(installProductionServerLogPrivacyBoundary()).toBe(true);
    const guard = console.error;
    console.error = vi.fn();
    expect(installProductionServerLogPrivacyBoundary()).toBe(false);
    expect(console.error).toBe(guard);

    console.error("private");
    expect(sink).toHaveBeenCalledExactlyOnceWith(SERVER_ERROR_REDACTED_LINE);
  });

  it("recognizes the shared state from a separately evaluated module copy", async () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    expect(installProductionServerLogPrivacyBoundary()).toBe(true);
    const guard = console.error;

    vi.resetModules();
    const separateCopy = await import("../server-log-privacy");
    expect(separateCopy.installProductionServerLogPrivacyBoundary()).toBe(
      false,
    );
    expect(console.error).toBe(guard);

    separateCopy.writeSafeApiErrorLog({
      route: "/api/progress",
      step: "unhandled",
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      errorName: "Error",
      errorCode: "unknown",
    });
    expect(JSON.parse(String(sink.mock.calls[0]?.[0]))).toMatchObject({
      route: "/api/progress",
      step: "unhandled",
      requestId: "123e4567-e89b-42d3-a456-426614174000",
    });
  });

  it("exposes no original sink or unvalidated writer through public state", () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    installProductionServerLogPrivacyBoundary();

    const state = (globalThis as unknown as Record<PropertyKey, unknown>)[
      STATE_SYMBOL
    ];
    expect(state).toBeTruthy();
    const publicKeys = Reflect.ownKeys(state as object).map((key) =>
      typeof key === "symbol" ? key.description : key
    );
    expect(publicKeys).not.toContain("originalError");
    expect(publicKeys.some((key) => key?.toLowerCase().includes("raw"))).toBe(
      false,
    );
    expect(state).not.toHaveProperty("originalError");
  });

  it("replaces hostile pre-seeded Symbol state instead of trusting it", () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    (globalThis as unknown as Record<PropertyKey, unknown>)[STATE_SYMBOL] =
      new Proxy(
        {},
        {
          get() {
            throw new Error("pre-seeded-secret");
          },
        },
      );

    expect(installProductionServerLogPrivacyBoundary()).toBe(true);
    console.error("learner@example.com");
    expect(sink).toHaveBeenCalledExactlyOnceWith(SERVER_ERROR_REDACTED_LINE);
    expect(JSON.stringify(sink.mock.calls)).not.toContain("pre-seeded-secret");
  });

  it("writes the fixed marker through the captured original sink", () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    installProductionServerLogPrivacyBoundary();

    writeRedactedServerErrorMarker();
    expect(sink).toHaveBeenCalledExactlyOnceWith(SERVER_ERROR_REDACTED_LINE);
  });
});

describe("safe structured API error writer", () => {
  it("reconstructs an allowlisted event through the original sink", () => {
    const sink = vi.fn();
    console.error = sink;
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    installProductionServerLogPrivacyBoundary();

    writeSafeApiErrorLog({
      route: "/api/progress",
      step: "supabase-read",
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      errorName: "PostgrestError",
      errorCode: "PGRST301",
      errorStatus: 503,
      durationMs: 42,
      status: 500,
      code: "PGRST500",
      mode: "complete",
      kind: "exercise-free-response",
      prompt: "learner@example.com private prompt",
    } as Parameters<typeof writeSafeApiErrorLog>[0] & {
      readonly prompt: string;
    });

    expect(sink).toHaveBeenCalledTimes(1);
    const line = String(sink.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toEqual({
      route: "/api/progress",
      step: "supabase-read",
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      errorName: "PostgrestError",
      errorCode: "PGRST301",
      errorStatus: 503,
      durationMs: 42,
      status: 500,
      code: "PGRST500",
      mode: "complete",
      kind: "exercise-free-response",
    });
    expect(line).not.toContain("learner@example.com");
    expect(line).not.toContain("private prompt");
  });

  it("fails closed for hostile fields and identifier-shaped secrets", () => {
    const sink = vi.fn();
    console.error = sink;
    const secret = "sk-ant-private learner@example.com";
    const hostile = new Proxy(
      {},
      {
        get() {
          throw new Error(secret);
        },
        ownKeys() {
          throw new Error(secret);
        },
      },
    );

    expect(() =>
      writeSafeApiErrorLog(hostile as Parameters<typeof writeSafeApiErrorLog>[0])
    ).not.toThrow();
    expect(JSON.parse(String(sink.mock.calls[0]?.[0]))).toEqual({
      route: "unknown",
      step: "unknown",
      requestId: "unknown",
      errorName: "UnknownError",
      errorCode: "unknown",
    });
    expect(JSON.stringify(sink.mock.calls)).not.toContain("sk-ant");
    expect(JSON.stringify(sink.mock.calls)).not.toContain("learner@example.com");
  });

  it("does not inherit a polluted Object.prototype serializer", () => {
    const sink = vi.fn();
    console.error = sink;
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      "toJSON",
    );
    Object.defineProperty(Object.prototype, "toJSON", {
      configurable: true,
      value: () => ({ secret: "learner@example.com inherited-secret" }),
    });

    try {
      writeSafeApiErrorLog({
        route: "/api/progress",
        step: "unhandled",
        requestId: "123e4567-e89b-42d3-a456-426614174000",
        errorName: "Error",
        errorCode: "unknown",
      });
    } finally {
      if (previous) {
        Object.defineProperty(Object.prototype, "toJSON", previous);
      } else {
        delete (Object.prototype as { toJSON?: unknown }).toJSON;
      }
    }

    const line = String(sink.mock.calls[0]?.[0]);
    expect(line).not.toContain("learner@example.com");
    expect(JSON.parse(line)).toMatchObject({
      route: "/api/progress",
      step: "unhandled",
    });
  });
});
