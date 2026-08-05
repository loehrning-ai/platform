import { afterEach, describe, expect, it, vi } from "vitest";
import {
  redirectOriginForRequest,
  trustedRequestOrigin,
} from "./origin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("trusted request origins", () => {
  it.each([
    "https://loehrning.ai",
    "https://www.loehrning.ai",
  ])("canonicalizes the production authority %s", (value) => {
    expect(trustedRequestOrigin(new URL(value))?.origin).toBe(
      "https://loehrning.ai",
    );
  });

  it.each([
    "https://evil.example",
    "https://loehrning.ai.evil.example",
    "http://loehrning.ai",
    "https://loehrning.ai:444",
    "https://user:password@loehrning.ai",
  ])("rejects untrusted authority %s", (value) => {
    expect(trustedRequestOrigin(new URL(value))).toBeNull();
    expect(redirectOriginForRequest(new URL(value)).origin).toBe(
      "https://loehrning.ai",
    );
  });

  it("preserves loopback outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(
      trustedRequestOrigin(new URL("http://localhost:3311"))?.origin,
    ).toBe("http://localhost:3311");
  });

  it("rejects loopback in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      trustedRequestOrigin(new URL("http://localhost:3311")),
    ).toBeNull();
  });

  it("preserves loopback for an explicitly marked local production verification runtime", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
      "http://localhost:3311",
    );
    expect(
      trustedRequestOrigin(new URL("http://localhost:3311"))?.origin,
    ).toBe("http://localhost:3311");
  });

  it("requires an exact HTTP loopback origin and rejects hostile authority", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
      "http://localhost:3311",
    );
    expect(
      trustedRequestOrigin(new URL("http://localhost:3312")),
    ).toBeNull();
    expect(
      trustedRequestOrigin(new URL("https://localhost:3311")),
    ).toBeNull();
    expect(
      trustedRequestOrigin(new URL("http://attacker.example:3311")),
    ).toBeNull();
  });

  it.each([
    "https://localhost:3311",
    "http://localhost:3311/path",
    "http://user:password@localhost:3311",
    "http://attacker.example:3311",
  ])("rejects malformed local verification capability %s", (value) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOEHRNING_LOCAL_VERIFICATION_ORIGIN", value);
    expect(
      trustedRequestOrigin(new URL("http://localhost:3311")),
    ).toBeNull();
  });

  it.each([
    { VERCEL: "1" },
    { VERCEL_ENV: "preview" },
    { VERCEL_ENV: "production" },
  ])("denies local verification authority in Vercel runtimes: %o", (env) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
      "http://localhost:3311",
    );
    for (const [name, value] of Object.entries(env)) {
      vi.stubEnv(name, value);
    }
    expect(
      trustedRequestOrigin(new URL("http://localhost:3311")),
    ).toBeNull();
  });

  it("preserves only an exact Vercel preview system hostname", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "platform-pr-42.vercel.app");

    expect(
      trustedRequestOrigin(
        new URL("https://platform-pr-42.vercel.app/auth/callback"),
      )?.origin,
    ).toBe("https://platform-pr-42.vercel.app");
    expect(
      trustedRequestOrigin(
        new URL("https://platform-pr-42.vercel.app.evil.example"),
      ),
    ).toBeNull();
  });
});
