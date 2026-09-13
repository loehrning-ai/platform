import { afterEach, describe, expect, it } from "vitest";
import {
  createBrowserAuthCookieMethods,
  parseDocumentCookies,
  serializeDocumentCookie,
} from "./browser-cookies";
import { AUTH_COOKIE_MAX_AGE_SECONDS } from "./config";

const LIBRARY_DEFAULT_MAX_AGE = 400 * 24 * 60 * 60;

function captureCookieWrites(): string[] {
  const writes: string[] = [];
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => "a=1; sb-proj-auth-token.0=base64-abc; a=2; broken; b=%7Bx%7D",
    set: (value: string) => {
      writes.push(value);
    },
  });
  return writes;
}

afterEach(() => {
  Reflect.deleteProperty(document, "cookie");
});

describe("parseDocumentCookies", () => {
  it("keeps the first value per name, decodes values and skips malformed pairs", () => {
    expect(
      parseDocumentCookies('a=1; b="%7Bx%7D"; a=2; broken; =x; c=%E0%A4%A'),
    ).toEqual([
      { name: "a", value: "1" },
      { name: "b", value: "{x}" },
      { name: "c", value: "%E0%A4%A" },
    ]);
  });
});

describe("serializeDocumentCookie", () => {
  it("writes every attribute a script may set", () => {
    expect(
      serializeDocumentCookie("sb-proj-auth-token", "v a", {
        maxAge: 60,
        path: "/",
        domain: ".example.test",
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      }),
    ).toBe(
      "sb-proj-auth-token=v%20a; Max-Age=60; Domain=.example.test; Path=/; SameSite=Lax; Secure",
    );
  });

  it("refuses names, paths, domains and lifetimes that would inject attributes", () => {
    expect(() => serializeDocumentCookie("a;b", "v", {})).toThrow();
    expect(() => serializeDocumentCookie("a", "v", { path: "/; Domain=x" })).toThrow();
    expect(() => serializeDocumentCookie("a", "v", { domain: "x; Secure" })).toThrow();
    expect(() =>
      serializeDocumentCookie("a", "v", { maxAge: Number.POSITIVE_INFINITY }),
    ).toThrow();
  });
});

describe("createBrowserAuthCookieMethods", () => {
  it("reads the current document cookies", async () => {
    captureCookieWrites();
    const methods = createBrowserAuthCookieMethods();
    const all = await (methods as { getAll: () => unknown }).getAll();
    expect(all).toEqual([
      { name: "a", value: "1" },
      { name: "sb-proj-auth-token.0", value: "base64-abc" },
      { name: "b", value: "{x}" },
    ]);
  });

  it("caps the library's 400-day lifetime and keeps removals as removals", async () => {
    const writes = captureCookieWrites();
    const methods = createBrowserAuthCookieMethods() as {
      setAll: (
        cookies: { name: string; value: string; options: object }[],
        headers: Record<string, string>,
      ) => void;
    };

    methods.setAll(
      [
        {
          name: "sb-proj-auth-token.0",
          value: "base64-abc",
          options: { path: "/", sameSite: "lax", maxAge: LIBRARY_DEFAULT_MAX_AGE },
        },
        {
          name: "sb-proj-auth-token.1",
          value: "",
          options: { path: "/", sameSite: "lax", maxAge: 0 },
        },
      ],
      {},
    );

    expect(writes).toEqual([
      `sb-proj-auth-token.0=base64-abc; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`,
      "sb-proj-auth-token.1=; Max-Age=0; Path=/; SameSite=Lax",
    ]);
  });
});
