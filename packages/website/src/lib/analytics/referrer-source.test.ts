/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyReferrerSource } from "./referrer-source";
import { ANALYTICS_REFERRER_SOURCES } from "./registry";

function withReferrer(referrer: string): void {
  vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
}

const origin = () => window.location.origin;

describe("classifyReferrerSource", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns direct for an empty referrer", () => {
    withReferrer("");
    expect(classifyReferrerSource()).toBe("direct");
  });

  it("returns direct for a malformed referrer", () => {
    withReferrer("not a url at all");
    expect(classifyReferrerSource()).toBe("direct");
  });

  it("returns direct for an external referrer and leaks nothing of it", () => {
    withReferrer("https://search.example.org/kurse?q=private+query");
    const source = classifyReferrerSource();
    expect(source).toBe("direct");
    expect(source).not.toContain("example");
    expect(source).not.toContain("query");
  });

  it("does not trust an external host that reuses a same-origin path", () => {
    withReferrer("https://elsewhere.example.org/ki-check");
    expect(classifyReferrerSource()).toBe("direct");
  });

  it.each([
    ["/ki-check", "ki_check"],
    ["/ki-check/ergebnis", "ki_check"],
    ["/demos", "demo"],
    ["/demos/excel?cat=agenten", "demo"],
    ["/kurse", "katalog"],
    ["/kurse/open-source/codex", "katalog"],
    ["/lernpfad", "hub"],
    ["/", "home"],
  ] as const)("classifies same-origin %s as %s", (pathname, expected) => {
    withReferrer(`${origin()}${pathname}`);
    expect(classifyReferrerSource()).toBe(expected);
  });

  it.each([
    ["/en", "home"],
    ["/en/", "home"],
    ["/en/ki-check", "ki_check"],
    ["/en/demos/word", "demo"],
    ["/en/kurse", "katalog"],
    ["/en/lernpfad", "hub"],
  ] as const)("strips the English locale prefix from %s", (pathname, expected) => {
    withReferrer(`${origin()}${pathname}`);
    expect(classifyReferrerSource()).toBe(expected);
  });

  it.each(["/konto", "/kursendung", "/demosammlung", "/english", "/blog/ki-check"])(
    "returns direct for the unknown same-origin path %s",
    (pathname) => {
      withReferrer(`${origin()}${pathname}`);
      expect(classifyReferrerSource()).toBe("direct");
    },
  );

  it("only ever returns a declared source", () => {
    withReferrer(`${origin()}/kurse`);
    expect(ANALYTICS_REFERRER_SOURCES).toContain(classifyReferrerSource());
  });
});
