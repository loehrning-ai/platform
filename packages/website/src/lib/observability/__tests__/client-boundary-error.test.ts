import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureMessage, scope, withScope } = vi.hoisted(() => {
  const isolatedScope = {
    clear: vi.fn(),
    setLevel: vi.fn(),
    setTag: vi.fn(),
  };
  return {
    captureMessage: vi.fn(),
    scope: isolatedScope,
    withScope: vi.fn((callback: (value: typeof isolatedScope) => void) =>
      callback(isolatedScope),
    ),
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureMessage,
  withScope,
}));

import {
  CLIENT_BOUNDARY_IDS,
  reportClientBoundaryError,
  validatedNextDigest,
} from "../client-boundary-error";

const JWT_HEADER_CANARY = ["eyJ", "hbGci", "OiJIUzI1NiJ9"].join("");

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("validatedNextDigest", () => {
  it("accepts only canonical unsigned 32-bit Next string-hash digests", () => {
    expect(validatedNextDigest({ digest: "0" })).toBe("0");
    expect(validatedNextDigest({ digest: "4294967295" })).toBe("4294967295");

    for (const digest of [
      "",
      "01",
      "-1",
      "4294967296",
      "digest-123",
      "learner@example.com",
      "sk-ant-private-token",
      "confidential prompt",
    ]) {
      expect(validatedNextDigest({ digest }), digest).toBeUndefined();
    }
  });

  it("drops throwing digest accessors without exposing or rethrowing them", () => {
    const error = Object.defineProperty(
      new Error("private message"),
      "digest",
      {
        get() {
          throw new Error("digest getter contained a secret");
        },
      },
    );

    expect(() => validatedNextDigest(error)).not.toThrow();
    expect(validatedNextDigest(error)).toBeUndefined();
  });
});

describe("reportClientBoundaryError", () => {
  it("registers the Data Infrastructure recovery boundary", () => {
    expect(CLIENT_BOUNDARY_IDS).toContain("data-infrastructure-course");
  });

  it("reports only a generic boundary id and a validated Next digest", async () => {
    const error = Object.assign(
      new Error(
        "learner@example.com prompt=private-answer token=sk-ant-secret-value",
      ),
      { digest: "3141592653" },
    );
    error.stack = `Authorization: Bearer ${JWT_HEADER_CANARY}.private`;

    reportClientBoundaryError("ai-native-exercise", error);
    // The SDK is imported dynamically to keep it out of every route's initial
    // script list, so the report lands a microtask later.
    await vi.waitFor(() => expect(scope.setTag).toHaveBeenCalled());

    expect(withScope).toHaveBeenCalledTimes(1);
    expect(scope.clear).toHaveBeenCalledTimes(1);
    expect(scope.setLevel).toHaveBeenCalledWith("error");
    expect(scope.setTag).toHaveBeenCalledWith(
      "client.boundary",
      "ai-native-exercise",
    );
    expect(scope.setTag).toHaveBeenCalledWith("next.digest", "3141592653");
    expect(captureMessage).toHaveBeenCalledWith("client-boundary-failure");
    expect(consoleError).toHaveBeenCalledWith("[client-boundary-failure]", {
      boundaryId: "ai-native-exercise",
      nextDigest: "3141592653",
    });

    const serializedReports = JSON.stringify({
      sentry: captureMessage.mock.calls,
      scope: {
        levels: scope.setLevel.mock.calls,
        tags: scope.setTag.mock.calls,
      },
      console: consoleError.mock.calls,
    });
    for (const secret of [
      "learner@example.com",
      "private-answer",
      "sk-ant-secret-value",
      "eyJhbGci",
      "Authorization",
    ]) {
      expect(serializedReports).not.toContain(secret);
    }
  });

  it("drops an unsafe digest instead of leaking it to Sentry or console", async () => {
    const error = Object.assign(new Error("private prompt"), {
      digest: "learner@example.com",
    });

    reportClientBoundaryError("workshop-quiz", error);
    await vi.waitFor(() => expect(scope.setTag).toHaveBeenCalled());

    expect(scope.setTag).toHaveBeenCalledTimes(1);
    expect(scope.setTag).toHaveBeenCalledWith(
      "client.boundary",
      "workshop-quiz",
    );
    expect(consoleError).toHaveBeenCalledWith("[client-boundary-failure]", {
      boundaryId: "workshop-quiz",
    });
    expect(
      JSON.stringify({
        sentry: captureMessage.mock.calls,
        scope: scope.setTag.mock.calls,
        console: consoleError.mock.calls,
      }),
    ).not.toContain("learner@example.com");
  });
});
