import { describe, it, expect } from "vitest";
import {
  AI_NATIVE_URL,
  AI_NATIVE_BUNDLE_ITEMS,
  AI_NATIVE_FAQ,
  AI_NATIVE_TRUST_SIGNALS,
} from "./content";

describe("ai-native content - AI_NATIVE_URL", () => {
  it("points at the free landing route", () => {
    expect(AI_NATIVE_URL).toBe("/ai-native");
  });
});

describe("ai-native content - bundle items", () => {
  it("exposes 6 items, each with copy and a resolved lucide icon", () => {
    expect(AI_NATIVE_BUNDLE_ITEMS).toHaveLength(6);
    for (const item of AI_NATIVE_BUNDLE_ITEMS) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.description.trim().length).toBeGreaterThan(0);
      expect(item.count.trim().length).toBeGreaterThan(0);
      // A renamed/removed lucide export would import as undefined; assert the
      // icon reference actually resolved.
      expect(item.icon).toBeTruthy();
    }
  });

  it("has unique item titles", () => {
    const titles = AI_NATIVE_BUNDLE_ITEMS.map((i) => i.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("ai-native content - FAQ", () => {
  it("exposes 7 non-empty question/answer pairs", () => {
    expect(AI_NATIVE_FAQ).toHaveLength(7);
    for (const faq of AI_NATIVE_FAQ) {
      expect(faq.question.trim().length).toBeGreaterThan(0);
      expect(faq.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("answers the cost question as free (no price, no selling)", () => {
    // Free-learning-platform invariant: the FAQ must never quote a price.
    const priceLike = /\bEUR\b|€|\beuro\b/i;
    for (const faq of AI_NATIVE_FAQ) {
      expect(priceLike.test(faq.answer)).toBe(false);
    }
    const costFaq = AI_NATIVE_FAQ.find((f) =>
      f.question.toLowerCase().includes("kostet"),
    );
    expect(costFaq).toBeDefined();
    expect(costFaq!.answer.toLowerCase()).toContain("nichts");
  });
});

describe("ai-native content - trust signals", () => {
  it("exposes 3 non-empty signals and names Tim Löhr with a real umlaut", () => {
    expect(AI_NATIVE_TRUST_SIGNALS).toHaveLength(3);
    for (const signal of AI_NATIVE_TRUST_SIGNALS) {
      expect(signal.trim().length).toBeGreaterThan(0);
      // Brand spelling rule: Löhr, never the ASCII substitution "Loehr".
      expect(signal).not.toMatch(/Loehr/);
    }
    expect(AI_NATIVE_TRUST_SIGNALS.some((s) => s.includes("Löhr"))).toBe(true);
  });
});

describe("ai-native content - writing-style guardrails", () => {
  it("contains no em/en dashes in any user-facing string", () => {
    const allStrings = [
      ...AI_NATIVE_TRUST_SIGNALS,
      ...AI_NATIVE_BUNDLE_ITEMS.flatMap((i) => [
        i.title,
        i.description,
        i.count,
      ]),
      ...AI_NATIVE_FAQ.flatMap((f) => [f.question, f.answer]),
    ];
    for (const s of allStrings) {
      // U+2014 em dash and U+2013 en dash are banned in this project's copy.
      expect(s).not.toMatch(/[\u2014\u2013]/);
    }
  });
});
