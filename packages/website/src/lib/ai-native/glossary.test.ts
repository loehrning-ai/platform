import { describe, it, expect } from "vitest";
import {
  getGlossary,
  getGlossaryEntries,
  getEntriesByCategory,
  getGlossaryTerm,
  getCategoryLabel,
  CATEGORY_ORDER,
} from "./glossary";

describe("ai-native glossary", () => {
  it("exposes the JSON meta block verbatim", () => {
    const meta = getGlossary()._meta;
    expect(meta.title).toBe("Glossar zu Mit KI arbeiten");
    expect(meta.version).toBe("2.0");
    expect(getGlossary("en")._meta.title).toBe("Working with AI glossary");
  });

  it("keeps only the terms the nine lessons use, as one singleton array", () => {
    expect(getGlossaryEntries()).toBe(getGlossary().entries);
    expect(getGlossaryEntries()).toHaveLength(16);
  });

  it("mirrors German and English entry by entry", () => {
    const german = getGlossaryEntries("de");
    const english = getGlossaryEntries("en");
    expect(english).toHaveLength(german.length);
    english.forEach((entry, index) => {
      expect(entry.category).toBe(german[index].category);
      expect(entry.related).toHaveLength(german[index].related.length);
      expect(entry.definition).not.toBe(german[index].definition);
    });
  });

  it("orders categories by course module and labels every category", () => {
    expect(CATEGORY_ORDER).toEqual(["messen", "kontext", "wissen", "workflow"]);
    for (const category of CATEGORY_ORDER) {
      expect(getCategoryLabel(category).length).toBeGreaterThan(0);
      expect(getCategoryLabel(category, "en").length).toBeGreaterThan(0);
      expect(getEntriesByCategory(category).length).toBeGreaterThan(0);
    }
    expect(getCategoryLabel("wissen", "en")).toBe("Knowledge and sources");
  });

  it("resolves every related term within its own locale", () => {
    for (const locale of ["de", "en"] as const) {
      for (const entry of getGlossaryEntries(locale)) {
        for (const related of entry.related) {
          expect(getGlossaryTerm(related, locale), `${locale}: ${related}`).toBeDefined();
        }
      }
    }
  });

  it("looks terms up case-insensitively and stays tool-neutral", () => {
    expect(getGlossaryTerm("prompt-injection")?.category).toBe("kontext");
    expect(getGlossaryTerm("Least privilege", "en")?.term).toBe("Least privilege");
    const text = JSON.stringify([getGlossary("de"), getGlossary("en")]);
    expect(text).not.toMatch(/Claude|Obsidian|n8n/);
  });
});
