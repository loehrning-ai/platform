import { describe, expect, it } from "vitest";
import {
  isProtectedPlatformPath,
  isPublicPlatformPath,
  sanitizeNextPath,
} from "./routes";

describe("platform route access model", () => {
  it("treats course previews and verification readers as public", () => {
    for (const path of [
      "/kurse",
      "/kurse/open-source/codex",
      "/ki-fuehrerschein",
      "/eu-ai-act-kurs",
      "/ai-native",
      "/ki-fuehrerschein/verifizierung",
      "/eu-ai-act-kurs/verifizierung",
      "/ai-native/verifizierung",
      "/api/books.json",
      "/api/health",
      "/api/ai-native/grade-exercise",
      "/imported-courses/screenshots/codex.jpg",
    ]) {
      expect(isPublicPlatformPath(path), path).toBe(true);
      expect(isProtectedPlatformPath(path), path).toBe(false);
    }
  });

  it("treats all educational content as public (optional-account policy D1: optional login)", () => {
    for (const path of [
      "/ki-fuehrerschein/kurs",
      "/ki-fuehrerschein/kurs/block-1",
      "/eu-ai-act-kurs/kurs",
      "/eu-ai-act-kurs/kurs/block-1",
      "/ai-native/kurs",
      "/ai-native/kurs/modul_1",
      "/ai-native/demos",
      "/ai-native/fluency-test",
      "/ai-native/glossar",
      "/ai-native/capstone-gallery",
      "/demos",
      "/demos/excel",
      "/buecher",
      "/buecher/ki-arbeitsalltag",
      "/book-covers/ki-arbeitsalltag-2026-1.png",
    ]) {
      expect(isPublicPlatformPath(path), path).toBe(true);
      expect(isProtectedPlatformPath(path), path).toBe(false);
    }
  });

  it("treats ueber-mich as public (optional-account policy D10)", () => {
    expect(isPublicPlatformPath("/ueber-mich")).toBe(true);
    expect(isProtectedPlatformPath("/ueber-mich")).toBe(false);
  });

  it("treats ueber-die-plattform as public reputation surface", () => {
    expect(isPublicPlatformPath("/ueber-die-plattform")).toBe(true);
    expect(isProtectedPlatformPath("/ueber-die-plattform")).toBe(false);
  });

  it("keeps konto and API sync routes gated (require login)", () => {
    for (const path of [
      "/konto",
      "/konto/datenschutz",
      "/api/progress",
      "/api/progress/sync",
      "/api/ai-native/grade",
      "/api/ai-native/practice",
      "/api/demos/example/future-write",
    ]) {
      expect(isProtectedPlatformPath(path), path).toBe(true);
    }
  });

  it("keeps public learning downloads available without login", () => {
    for (const path of [
      "/api/demos/excel/briefing.pdf",
    ]) {
      expect(isPublicPlatformPath(path), path).toBe(true);
      expect(isProtectedPlatformPath(path), path).toBe(false);
    }
  });

  it("does not protect deleted commercial routes (they redirect or return 410)", () => {
    // These routes are handled by redirect stubs or middleware 410, not auth
    expect(isProtectedPlatformPath("/ki-transformation-check")).toBe(false);
    expect(isProtectedPlatformPath("/arbeitsweise")).toBe(false);
    expect(isProtectedPlatformPath("/leistungen")).toBe(false);
    expect(isProtectedPlatformPath("/foerdermittel")).toBe(false);
    expect(isProtectedPlatformPath("/kontakt")).toBe(false);
  });

  it("sanitizes next paths to internal non-auth targets", () => {
    expect(sanitizeNextPath(null)).toBe("/konto");
    expect(sanitizeNextPath("//evil.example")).toBe("/konto");
    expect(sanitizeNextPath("/\\evil.example")).toBe("/konto");
    expect(sanitizeNextPath("/%5cevil.example")).toBe("/konto");
    expect(sanitizeNextPath("/%2fevil.example")).toBe("/konto");
    expect(sanitizeNextPath("/%255cevil.example")).toBe("/konto");
    expect(sanitizeNextPath("/safe\npath")).toBe("/konto");
    expect(sanitizeNextPath("https://evil.example")).toBe("/konto");
    expect(sanitizeNextPath("/login")).toBe("/konto");
    expect(sanitizeNextPath("/safe/%2e%2e/login")).toBe("/konto");
    expect(sanitizeNextPath("/auth/callback")).toBe("/konto");
    expect(sanitizeNextPath("/ki-fuehrerschein/kurs")).toBe("/ki-fuehrerschein/kurs");
    expect(sanitizeNextPath("/kurse?persona=einsteiger#start")).toBe(
      "/kurse?persona=einsteiger#start",
    );
  });
});
