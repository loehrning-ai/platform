import { describe, expect, it } from "vitest";
import {
  isGatedCoursePath,
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

  it("treats non-certified educational content as public (optional-account policy D1: optional login)", () => {
    for (const path of [
      "/kurse/open-source/codex/kurs",
      "/kurse/open-source/codex/kurs/L01",
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

  it("requires login for the 4 native certified courses' lesson content (exception to policy D1)", () => {
    for (const path of [
      "/ki-fuehrerschein/kurs",
      "/ki-fuehrerschein/kurs/block-1",
      "/eu-ai-act-kurs/kurs",
      "/eu-ai-act-kurs/kurs/block-1",
      "/ai-native/kurs",
      "/ai-native/kurs/modul_1",
      "/ki-und-gesellschaft/kurs",
      "/ki-und-gesellschaft/kurs/block-1",
    ]) {
      expect(isProtectedPlatformPath(path), path).toBe(true);
      expect(isPublicPlatformPath(path), path).toBe(false);
    }
    // Landing pages and third-party certificate verification stay public.
    for (const path of [
      "/ki-fuehrerschein",
      "/eu-ai-act-kurs",
      "/ai-native",
      "/ki-und-gesellschaft",
      "/ki-fuehrerschein/verifizierung",
      "/ai-native/verifizierung",
    ]) {
      expect(isPublicPlatformPath(path), path).toBe(true);
      expect(isProtectedPlatformPath(path), path).toBe(false);
    }
  });

  it("identifies gated-course paths for the login page's reason messaging", () => {
    for (const path of [
      "/ki-fuehrerschein/kurs",
      "/ki-fuehrerschein/kurs/block-1",
      "/eu-ai-act-kurs/kurs",
      "/ai-native/kurs/modul_1",
      "/ki-und-gesellschaft/kurs",
    ]) {
      expect(isGatedCoursePath(path), path).toBe(true);
    }
    for (const path of [
      "/ki-fuehrerschein",
      "/kurse/open-source/codex/kurs",
      "/konto",
      "/ai-native/kurs-vorschau",
    ]) {
      expect(isGatedCoursePath(path), path).toBe(false);
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
