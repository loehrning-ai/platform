import { describe, it, expect } from "vitest";
import {
  getGlossary,
  getGlossaryEntries,
  getEntriesByCategory,
  getGlossaryTerm,
  getCategoryLabel,
  CATEGORY_ORDER,
} from "./glossary";

describe("ai-native glossary - getGlossary / getGlossaryEntries", () => {
  it("exposes the JSON meta block verbatim", () => {
    const meta = getGlossary()._meta;
    expect(meta.title).toBe("AI-Native Arbeitskurs Glossary");
    expect(meta.version).toBe("1.0");
    expect(meta.last_updated).toBe("2026-04-18");
  });

  it("getGlossaryEntries returns the same singleton array as getGlossary().entries", () => {
    // Both readers must expose the identical underlying object (no copy).
    expect(getGlossaryEntries()).toBe(getGlossary().entries);
    expect(getGlossaryEntries().length).toBeGreaterThan(40);
  });
});

describe("ai-native glossary - categories & CATEGORY_ORDER", () => {
  it("CATEGORY_ORDER is the exact curated display order (7 categories)", () => {
    expect(CATEGORY_ORDER).toEqual([
      "mindset",
      "claude",
      "obsidian",
      "automation",
      "technik",
      "regulatorik",
      "pedagogy",
    ]);
    expect(CATEGORY_ORDER).toHaveLength(7);
  });

  it("CATEGORY_ORDER is a permutation of the JSON category keys", () => {
    const jsonKeys = Object.keys(getGlossary().categories).sort();
    expect([...CATEGORY_ORDER].sort()).toEqual(jsonKeys);
  });

  it("getCategoryLabel returns the JSON label for a category", () => {
    expect(getCategoryLabel("claude")).toBe(
      "Claude.ai, Claude Code, Anthropic-Plattform",
    );
    expect(getCategoryLabel("regulatorik")).toBe(
      "EU AI Act, DSGVO, UWG, Compliance",
    );
    expect(getCategoryLabel("mindset")).toBe(
      "AI-native Konzepte, Orchestrierung, Coworker-Denkweise",
    );
  });

  it("every ordered category resolves to a non-empty label", () => {
    for (const category of CATEGORY_ORDER) {
      expect(getCategoryLabel(category).length).toBeGreaterThan(0);
    }
  });
});

describe("ai-native glossary - getEntriesByCategory", () => {
  it("returns only entries whose category matches the filter", () => {
    const claude = getEntriesByCategory("claude");
    expect(claude.length).toBeGreaterThan(0);
    expect(claude.every((e) => e.category === "claude")).toBe(true);
    expect(claude.some((e) => e.term === "Claude Code")).toBe(true);
  });

  it("filtering by every category partitions the entry list exactly", () => {
    // Sum over all 7 categories must equal the total: proves each entry's
    // category is one of the 7 (exhaustive) and the filter is disjoint.
    const summed = CATEGORY_ORDER.reduce(
      (n, category) => n + getEntriesByCategory(category).length,
      0,
    );
    expect(summed).toBe(getGlossaryEntries().length);
  });

  it("returns a fresh array, not the shared entries reference", () => {
    expect(getEntriesByCategory("technik")).not.toBe(getGlossaryEntries());
  });
});

describe("ai-native glossary - getGlossaryTerm", () => {
  it("finds an entry by exact term", () => {
    const entry = getGlossaryTerm("Claude");
    expect(entry?.term).toBe("Claude");
    expect(entry?.category).toBe("claude");
  });

  it("is case-insensitive and returns the identical entry object", () => {
    const canonical = getGlossaryTerm("Claude");
    expect(getGlossaryTerm("claude")).toBe(canonical);
    expect(getGlossaryTerm("CLAUDE")).toBe(canonical);
  });

  it("matches terms containing dots and mixed case (CLAUDE.md)", () => {
    expect(getGlossaryTerm("claude.md")?.term).toBe("CLAUDE.md");
  });

  it("preserves real umlauts in term lookups (KI-Führerschein)", () => {
    const entry = getGlossaryTerm("ki-führerschein");
    expect(entry?.term).toBe("KI-Führerschein");
    expect(entry?.category).toBe("pedagogy");
  });

  it("returns undefined for unknown or empty terms", () => {
    expect(getGlossaryTerm("does-not-exist")).toBeUndefined();
    expect(getGlossaryTerm("")).toBeUndefined();
  });
});

describe("ai-native glossary - entry integrity", () => {
  it("every entry is well-formed (term, valid category, definition, related[])", () => {
    const validCategories = new Set<string>(CATEGORY_ORDER);
    for (const entry of getGlossaryEntries()) {
      expect(typeof entry.term).toBe("string");
      expect(entry.term.trim().length).toBeGreaterThan(0);
      expect(validCategories.has(entry.category)).toBe(true);
      expect(typeof entry.definition).toBe("string");
      expect(entry.definition.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(entry.related)).toBe(true);
      for (const related of entry.related) {
        expect(typeof related).toBe("string");
        expect(related.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("terms are unique case-insensitively (getGlossaryTerm stays unambiguous)", () => {
    const seen = new Set<string>();
    for (const entry of getGlossaryEntries()) {
      const key = entry.term.toLowerCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
