import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import { AGENT_ACCOUNT_COPY, type AgentAccountCopy } from "./ki-copy";

/** Every rendered string in one locale, functions included. */
function renderedStrings(copy: AgentAccountCopy): readonly string[] {
  const values: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      values.push(value);
      return;
    }
    if (typeof value === "function") {
      // Every copy function on this surface takes at most two arguments and
      // interpolates them; calling with stand-ins exercises the sentence.
      values.push(String((value as (...args: unknown[]) => string)("A1B2", 7)));
      return;
    }
    if (typeof value === "object" && value !== null) {
      for (const nested of Object.values(value)) walk(nested);
    }
  };
  walk(copy);
  return values;
}

describe("agent account copy", () => {
  it("defines both locales with the same keys", () => {
    const de = Object.keys(AGENT_ACCOUNT_COPY.de).sort();
    const en = Object.keys(AGENT_ACCOUNT_COPY.en).sort();
    expect(en).toEqual(de);
    expect(de.length).toBeGreaterThan(50);
  });

  it.each(SUPPORTED_LOCALES)("has no empty string in %s", (locale: Locale) => {
    for (const value of renderedStrings(AGENT_ACCOUNT_COPY[locale])) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(SUPPORTED_LOCALES)(
    "uses no em dash or en dash in %s",
    (locale: Locale) => {
      for (const value of renderedStrings(AGENT_ACCOUNT_COPY[locale])) {
        expect(value).not.toContain("—");
        expect(value).not.toContain("–");
      }
    },
  );

  it("addresses the learner informally in German", () => {
    const formal = /\b(?:Sie|Ihre|Ihren|Ihrem|Ihr|Ihnen)\b/;
    for (const value of renderedStrings(AGENT_ACCOUNT_COPY.de)) {
      expect(value, `formal address in: ${value}`).not.toMatch(formal);
    }
  });

  it("spells German with real umlauts, never transliterations", () => {
    const german = renderedStrings(AGENT_ACCOUNT_COPY.de).join("\n");
    for (const transliteration of [
      "Schluessel",
      "Aktivitaet",
      "zurueck",
      "Zurueck",
      "fuer",
      "ueber",
      "geloescht",
      "geprueft",
      "spaeter",
      "Hoechstzahl",
      "Buechern",
    ]) {
      expect(german).not.toContain(transliteration);
    }
    expect(german).toContain("Schlüssel");
    expect(german).toContain("Aktivität");
    expect(german).toContain("zurück");
  });

  it("keeps the four region labels distinct so the section nav is unambiguous", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const labels = Object.values(AGENT_ACCOUNT_COPY[locale].sections);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("states in both locales that the transcript stays in the browser", () => {
    expect(AGENT_ACCOUNT_COPY.de.chatTranscriptNote).toContain("Browser");
    expect(AGENT_ACCOUNT_COPY.en.chatTranscriptNote).toContain("browser");
  });

  it("names the cost and terms boundary on the key form", () => {
    expect(AGENT_ACCOUNT_COPY.de.keyDisclosure).toContain("Anthropic");
    expect(AGENT_ACCOUNT_COPY.de.keyDisclosure).toContain("Kosten");
    expect(AGENT_ACCOUNT_COPY.en.keyDisclosure).toContain("your own cost");
  });

  it("warns that a personal access token is shown once", () => {
    expect(AGENT_ACCOUNT_COPY.de.tokenOnceBody).toContain("nicht gespeichert");
    expect(AGENT_ACCOUNT_COPY.en.tokenOnceBody).toContain("not stored");
  });
});
