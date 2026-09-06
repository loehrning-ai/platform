import { describe, expect, it } from "vitest";
import {
  isLearningOwnerRoute,
  isProgressRuntimeRoute,
  isProgressUiRoute,
} from "./learning-route-policy";

describe("isProgressUiRoute", () => {
  it.each([
    "/ai-native",
    "/ai-native/kurs/modul-1/lektion-1",
    "/buecher/ki-landschaft/02_methodik",
    "/eu-ai-act-kurs/kurs",
    "/ki-fuehrerschein/kurs/quiz",
    "/ki-und-gesellschaft",
    "/kurse/open-source/data-science",
    "/en/kurse/open-source/data-infrastructure",
  ])("keeps progress UI available on %s", (pathname) => {
    expect(isProgressUiRoute(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/blog/eu-ai-act-grundlagen",
    "/datenschutz",
    "/demos/prompt-scanner",
    "/impressum",
    "/ueber-mich",
  ])("keeps the heavy progress UI off %s", (pathname) => {
    expect(isProgressUiRoute(pathname)).toBe(false);
  });

  it("loads ownership isolation only where progress can be changed", () => {
    expect(isLearningOwnerRoute("/ai-native")).toBe(true);
    expect(isLearningOwnerRoute("/ai-native/kurs/modul-1/lektion-1")).toBe(
      true,
    );
    expect(isLearningOwnerRoute("/kurse/open-source/data-science/fund")).toBe(
      true,
    );
    expect(isLearningOwnerRoute("/kurse/open-source/codex/kurs")).toBe(true);
    expect(isLearningOwnerRoute("/en/kurse/open-source/codex/kurs")).toBe(true);
    expect(
      isLearningOwnerRoute("/kurse/open-source/claude/kurs/zertifikat"),
    ).toBe(true);
    expect(isLearningOwnerRoute("/konto/datenschutz")).toBe(true);
    expect(isLearningOwnerRoute("/blog/eu-ai-act-grundlagen")).toBe(false);
    expect(isLearningOwnerRoute("/impressum")).toBe(false);
  });

  it.each([
    "/ai-native/capstone-gallery",
    "/ai-native/demos",
    "/ai-native/demos/example",
    "/ai-native/fluency-test",
    "/ai-native/glossar",
    "/ai-native/verifizierung",
    "/buecher/ki-landschaft",
    "/buecher/ki-landschaft/02_methodik",
    "/kurse/open-source",
    "/kurse/open-source/ai-native-operator",
    "/kurse/open-source/claude",
    "/kurse/open-source/codex/verifizierung",
    "/kurse/open-source/data-infrastructure/verifizierung",
    "/en/kurse/open-source/data-infrastructure/verifizierung",
  ])("does not block the read-only public route %s", (pathname) => {
    expect(isLearningOwnerRoute(pathname)).toBe(false);
  });
});

describe("isProgressRuntimeRoute", () => {
  it.each([
    "/ai-native",
    "/ai-native/verifizierung",
    "/buecher/ki-landschaft",
    "/eu-ai-act-kurs/kurs",
    "/ki-fuehrerschein",
    "/ki-und-gesellschaft/kurs/quiz",
    "/kurse",
    "/kurse/open-source",
    "/kurse/open-source/codex/verifizierung",
    "/konto",
    "/konto/datenschutz",
    "/en/kurse/open-source/codex/kurs",
    "/en/konto",
  ])("reconciles account and progress state on %s", (pathname) => {
    expect(isProgressRuntimeRoute(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/blog/eu-ai-act-grundlagen",
    "/datenschutz",
    "/demos/prompt-scanner",
    "/impressum",
    "/ki-check",
    "/login",
    "/ueber-mich",
    "/workshops",
    "/en/impressum",
  ])("requests no reconciliation runtime on %s", (pathname) => {
    expect(isProgressRuntimeRoute(pathname)).toBe(false);
  });

  it("stays the widest of the three predicates", () => {
    // The runtime affects every ledger surface and both account pages, so
    // neither narrower predicate may claim a route it does not cover.
    for (const pathname of [
      "/ai-native",
      "/buecher",
      "/eu-ai-act-kurs/kurs",
      "/ki-fuehrerschein/kurs",
      "/ki-und-gesellschaft",
      "/konto",
      "/konto/datenschutz",
      "/kurse",
      "/kurse/open-source/claude/kurs/zertifikat",
      "/en/kurse/open-source/data-science",
    ]) {
      if (isProgressUiRoute(pathname) || isLearningOwnerRoute(pathname)) {
        expect(isProgressRuntimeRoute(pathname)).toBe(true);
      }
    }
    expect(isProgressUiRoute("/konto")).toBe(false);
    expect(isLearningOwnerRoute("/kurse")).toBe(false);
    expect(isProgressRuntimeRoute("/konto")).toBe(true);
    expect(isProgressRuntimeRoute("/kurse")).toBe(true);
  });

  it("rejects an unparseable pathname", () => {
    expect(isProgressRuntimeRoute("//evil.example/konto")).toBe(false);
    expect(isProgressRuntimeRoute("konto")).toBe(false);
  });
});
