import { describe, expect, it } from "vitest";
import {
  canonicalLocalePathname,
  buildLocaleAlternates,
  isLocale,
  isUnprefixedLocalePath,
  localizeHref,
  parseLocalePathname,
} from "./locale";

describe("canonicalLocalePathname", () => {
  it("maps visible locale URLs to one route-tree pathname", () => {
    expect(canonicalLocalePathname("/kurse/open-source/codex")).toBe(
      "/kurse/open-source/codex",
    );
    expect(canonicalLocalePathname("/en/kurse/open-source/codex")).toBe(
      "/kurse/open-source/codex",
    );
    expect(canonicalLocalePathname("/de/kurse/open-source/codex")).toBe(
      "/kurse/open-source/codex",
    );
  });

  it("does not normalize unsafe path syntax", () => {
    expect(canonicalLocalePathname("/%2fadmin")).toBeNull();
    expect(canonicalLocalePathname(null)).toBeNull();
  });
});

describe("locale path contract", () => {
  it("keeps German canonical URLs unprefixed and strips an explicit German prefix", () => {
    expect(parseLocalePathname("/kurse")).toMatchObject({
      locale: "de",
      pathname: "/kurse",
      explicitLocale: null,
      valid: true,
    });
    expect(parseLocalePathname("/de/kurse")).toMatchObject({
      locale: "de",
      pathname: "/kurse",
      explicitLocale: "de",
      valid: true,
    });
    expect(localizeHref("/de/kurse?persona=technik#start", "de")).toBe(
      "/kurse?persona=technik#start",
    );
  });

  it("maps English to the equivalent /en path without double-prefixing", () => {
    expect(parseLocalePathname("/en")).toMatchObject({
      locale: "en",
      pathname: "/",
      explicitLocale: "en",
      valid: true,
    });
    expect(localizeHref("/kurse#lernpfad", "en")).toBe("/en/kurse#lernpfad");
    expect(localizeHref("/en/kurse", "en")).toBe("/en/kurse");
    expect(localizeHref("/en/kurse", "de")).toBe("/kurse");
  });

  it("rejects ambiguous or external navigation input", () => {
    for (const value of [
      "https://evil.example/path",
      "//evil.example/path",
      "/\\evil.example",
      "/%2fevil.example",
      "/%255cevil.example",
      "/safe\npath",
    ]) {
      expect(localizeHref(value, "de"), value).toBe("/");
      expect(localizeHref(value, "en"), value).toBe("/en");
    }
    expect(parseLocalePathname("/%2fadmin").valid).toBe(false);
  });

  // Stripping the locale prefix must never expose a scheme-relative path:
  // `/en//evil.example` would otherwise parse to `//evil.example`, and
  // localizeHref(…, "de") would return it as a navigation target.
  it("rejects a locale prefix followed by a scheme-relative path", () => {
    for (const value of [
      "/de//evil.com",
      "/en//evil.com",
      "/en//evil.com/path?x=1#y",
      "/de///evil.com",
    ]) {
      expect(parseLocalePathname(value), value).toMatchObject({
        valid: false,
        explicitLocale: null,
      });
      expect(parseLocalePathname(value).pathname.startsWith("//")).toBe(false);
      expect(canonicalLocalePathname(value), value).toBeNull();
      expect(localizeHref(value, "de"), value).toBe("/");
      expect(localizeHref(value, "en"), value).toBe("/en");
    }
    expect(localizeHref("/en//evil.com", "de")).toBe("/");
    // Single-slash locale paths keep working.
    expect(parseLocalePathname("/en/kurse")).toMatchObject({
      pathname: "/kurse",
      valid: true,
    });
    expect(parseLocalePathname("/de/")).toMatchObject({
      pathname: "/",
      valid: true,
    });
  });

  it("never returns a scheme-relative href for dot-segment variants", () => {
    for (const value of [
      "/en/%2e//evil.com",
      "/en/.//evil.com",
      "/en/x/..//evil.com",
      "/de/%2E//evil.com",
    ]) {
      for (const locale of ["de", "en"] as const) {
        const href = localizeHref(value, locale);
        expect(href.startsWith("//"), `${value} ${locale}`).toBe(false);
        expect(href.startsWith("/\\"), `${value} ${locale}`).toBe(false);
        expect(href).toBe(locale === "de" ? "/" : "/en");
      }
    }
  });

  it("keeps APIs, auth callbacks, and machine endpoints unprefixed", () => {
    for (const path of [
      "/api/progress",
      "/auth/callback",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/schema/knowledge-graph/v1",
    ]) {
      expect(isUnprefixedLocalePath(path), path).toBe(true);
    }
    expect(isUnprefixedLocalePath("/login")).toBe(false);
    expect(isUnprefixedLocalePath("/kurse")).toBe(false);
  });

  it("emits English alternates only after reviewed content parity is declared", () => {
    expect(buildLocaleAlternates("/kurse", ["de"])).toEqual({
      canonical: "/kurse",
    });
    expect(buildLocaleAlternates("/kurse", ["de", "en"])).toEqual({
      canonical: "/kurse",
      languages: {
        de: "/kurse",
        en: "/en/kurse",
        "x-default": "/kurse",
      },
    });
  });

  it("accepts only supported locale identifiers", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("en-US")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
