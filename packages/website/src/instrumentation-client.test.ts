import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("@sentry/nextjs");
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("client instrumentation bootstrap", () => {
  it("swallows an SDK loader failure without logging the raw error", async () => {
    vi.resetModules();
    vi.stubEnv(
      "NEXT_PUBLIC_SENTRY_DSN",
      "https://public@example.ingest.sentry.io/123",
    );
    vi.doMock("@sentry/nextjs", () => {
      throw new Error("private-route provider-loader-secret");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("./instrumentation-client");
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("swallows a synchronous SDK init failure without logging the raw error", async () => {
    vi.resetModules();
    vi.stubEnv(
      "NEXT_PUBLIC_SENTRY_DSN",
      "https://public@example.ingest.sentry.io/123",
    );
    vi.doMock("@sentry/nextjs", () => ({
      init: () => {
        throw new Error("private-route provider-init-secret");
      },
    }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("./instrumentation-client");
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(consoleError).not.toHaveBeenCalled();
  });
});
