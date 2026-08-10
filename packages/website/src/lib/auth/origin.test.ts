import { afterEach, describe, expect, it, vi } from "vitest";
import {
  externalRequestUrl,
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

function probeRequest(url: string, headers: Record<string, string>) {
  return { url, headers: new Headers(headers) };
}

describe("external request URL reconstruction", () => {
  // Next serves route handlers with a placeholder authority behind the
  // platform proxy. Without this repair every callback fails closed as
  // untrusted-origin, which is exactly what production did.
  it("restores the visible authority from forwarded headers", () => {
    const url = externalRequestUrl(
      probeRequest("http://n/auth/callback?code=abc", {
        "x-forwarded-host": "loehrning.ai",
        "x-forwarded-proto": "https",
        host: "loehrning.ai",
      }),
    );
    expect(url.origin).toBe("https://loehrning.ai");
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("code")).toBe("abc");
    expect(trustedRequestOrigin(url)?.origin).toBe("https://loehrning.ai");
  });

  it("takes the first hop of a forwarded header list", () => {
    const url = externalRequestUrl(
      probeRequest("http://n/auth/callback", {
        "x-forwarded-host": "loehrning.ai, evil.example",
        "x-forwarded-proto": "https, http",
      }),
    );
    expect(url.origin).toBe("https://loehrning.ai");
  });

  it("falls back to the host header when no forwarded host is present", () => {
    const url = externalRequestUrl(
      probeRequest("http://n/auth/callback", {
        host: "loehrning.ai",
        "x-forwarded-proto": "https",
      }),
    );
    expect(url.origin).toBe("https://loehrning.ai");
  });

  it.each<Record<string, string>>([
    {},
    { "x-forwarded-host": "loehrning.ai" },
    { "x-forwarded-host": "loehrning.ai", "x-forwarded-proto": "ftp" },
    { "x-forwarded-host": "", "x-forwarded-proto": "https" },
    { "x-forwarded-host": "user:pass@loehrning.ai", "x-forwarded-proto": "https" },
    { "x-forwarded-host": "loehrning.ai/../evil", "x-forwarded-proto": "https" },
  ])("keeps the internal URL for unusable headers %#", (headers) => {
    const url = externalRequestUrl(
      probeRequest("http://n/auth/callback", headers),
    );
    expect(url.origin).toBe("http://n");
    expect(trustedRequestOrigin(url)).toBeNull();
  });

  it("does not by itself widen trust to an arbitrary authority", () => {
    const url = externalRequestUrl(
      probeRequest("http://n/auth/callback", {
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      }),
    );
    expect(url.origin).toBe("https://evil.example");
    expect(trustedRequestOrigin(url)).toBeNull();
  });
});
