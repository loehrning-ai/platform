import { describe, it, expect } from "vitest";
import { looksLikeUrl, normalizeUrl } from "@/lib/utils";

describe("looksLikeUrl", () => {
  it("returns true for https URL", () => {
    expect(looksLikeUrl("https://example.com")).toBe(true);
  });

  it("returns true for http URL", () => {
    expect(looksLikeUrl("http://example.com")).toBe(true);
  });

  it("returns true for www prefix", () => {
    expect(looksLikeUrl("www.example.com")).toBe(true);
  });

  it("returns true for bare domain", () => {
    expect(looksLikeUrl("example.com")).toBe(true);
  });

  it("returns true for subdomain", () => {
    expect(looksLikeUrl("sub.example.com")).toBe(true);
  });

  it("returns true for .de domain", () => {
    expect(looksLikeUrl("firma.de")).toBe(true);
  });

  it("returns false for company name", () => {
    expect(looksLikeUrl("SAP SE")).toBe(false);
  });

  it("returns false for company name with GmbH", () => {
    expect(looksLikeUrl("Firma GmbH")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(looksLikeUrl("")).toBe(false);
  });

  it("returns false for single word", () => {
    expect(looksLikeUrl("Siemens")).toBe(false);
  });

  it("handles whitespace", () => {
    expect(looksLikeUrl("  example.com  ")).toBe(true);
  });
});

describe("normalizeUrl", () => {
  it("adds https:// if missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("preserves existing https://", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("preserves existing http://", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com");
  });
});
