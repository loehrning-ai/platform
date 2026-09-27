// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildCustomRoute } from "next/dist/lib/build-custom-route";
import nextConfig from "../../../next.config";
import {
  buildResourcePolicyHeaderRules,
  CROSS_ORIGIN_RESOURCE_POLICY_HEADER,
  SAME_ORIGIN_RESOURCE_SOURCES,
} from "./resource-policy";

type HeaderRules = Awaited<ReturnType<NonNullable<typeof nextConfig.headers>>>;

/**
 * The headers a response for `pathname` receives from next.config.ts, resolved
 * the way the platform resolves them: every rule is compiled with Next's own
 * builder (the regex that lands in routes-manifest.json), every matching rule
 * applies in order, and a later rule overrides an earlier one per key.
 */
function effectiveHeaders(
  rules: HeaderRules,
  pathname: string,
): Map<string, string> {
  const headers = new Map<string, string>();
  for (const rule of rules) {
    const { regex } = buildCustomRoute("header", rule);
    if (!new RegExp(regex).test(pathname)) continue;
    for (const { key, value } of rule.headers) {
      headers.set(key.toLowerCase(), value);
    }
  }
  return headers;
}

async function configuredRules(): Promise<HeaderRules> {
  if (!nextConfig.headers) throw new Error("next.config.ts defines no headers()");
  return nextConfig.headers();
}

const SAME_ORIGIN_PATHS = [
  "/api",
  "/api/mcp",
  "/api/health",
  "/api/csp-report",
  "/api/account/export",
  "/api/account/oauth-grants",
  "/api/buecher/ki-landschaft/download.pdf",
  "/api/books.json",
  "/konto",
  "/konto/ki",
  "/konto/werkzeuge/cv-engine/oeffnen",
  "/en/konto",
  "/en/konto/ki",
  "/oauth/consent",
  "/oauth/consent/entscheidung",
  "/en/oauth/consent",
] as const;

const CROSS_ORIGIN_LOADABLE_PATHS = [
  "/",
  "/en",
  "/opengraph-image",
  "/en/opengraph-image",
  "/course-covers/claude-v2.webp",
  "/fonts/inter-v4.woff2",
  "/workshops/w01/index.html",
  "/login",
  "/auth/callback",
  "/schema/knowledge-graph/v1",
  "/.well-known/oauth-protected-resource/api/mcp",
  // Prefix look-alikes stay outside the policy.
  "/apis",
  "/api-docs",
  "/kontoauszug",
  "/oauthx",
] as const;

describe("cross-origin resource policy rules", () => {
  it("builds one same-origin rule per session-bound prefix", () => {
    expect(buildResourcePolicyHeaderRules()).toEqual(
      SAME_ORIGIN_RESOURCE_SOURCES.map((source) => ({
        source,
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      })),
    );
    expect(CROSS_ORIGIN_RESOURCE_POLICY_HEADER).toEqual({
      key: "Cross-Origin-Resource-Policy",
      value: "same-origin",
    });
  });

  it("returns fresh header objects so a caller cannot mutate the policy", () => {
    const [first] = buildResourcePolicyHeaderRules();
    first.headers[0].value = "cross-origin";

    expect(buildResourcePolicyHeaderRules()[0].headers[0].value).toBe(
      "same-origin",
    );
    expect(Object.isFrozen(CROSS_ORIGIN_RESOURCE_POLICY_HEADER)).toBe(true);
  });
});

describe("next.config.ts Cross-Origin-Resource-Policy", () => {
  it.each(SAME_ORIGIN_PATHS)("sends same-origin on %s", async (pathname) => {
    const headers = effectiveHeaders(await configuredRules(), pathname);

    expect(headers.get("cross-origin-resource-policy")).toBe("same-origin");
  });

  it.each(CROSS_ORIGIN_LOADABLE_PATHS)(
    "leaves %s loadable by other origins",
    async (pathname) => {
      const headers = effectiveHeaders(await configuredRules(), pathname);

      expect(headers.has("cross-origin-resource-policy")).toBe(false);
    },
  );

  it("keeps the site-wide browser-boundary headers on the covered paths", async () => {
    const headers = effectiveHeaders(await configuredRules(), "/api/mcp");

    expect(headers.get("content-security-policy")).toContain(
      "form-action 'self'",
    );
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("cross-origin-opener-policy")).toBe("same-origin");
  });

  it("never sets a resource policy on the site-wide rule", async () => {
    const rules = await configuredRules();
    const global = rules.find((rule) => rule.source === "/:path*");

    expect(global).toBeDefined();
    expect(
      global?.headers.some(
        ({ key }) => key.toLowerCase() === "cross-origin-resource-policy",
      ),
    ).toBe(false);
    // Every resource-policy value the config ships is same-origin.
    const values = rules.flatMap((rule) =>
      rule.headers
        .filter(({ key }) => key.toLowerCase() === "cross-origin-resource-policy")
        .map(({ value }) => value),
    );
    expect(new Set(values)).toEqual(new Set(["same-origin"]));
  });
});
