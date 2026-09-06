import { describe, expect, it } from "vitest";
import { accountChatSystemPrompt } from "./prompt";

const LESSON = {
  uri: "lesson://ki-grundlagen/was-ist-ki",
  course: "ki-grundlagen",
  lessonId: "was-ist-ki",
  locale: "de",
} as const;

describe("accountChatSystemPrompt", () => {
  it("addresses the learner with Du and uses real umlauts", () => {
    const prompt = accountChatSystemPrompt("de");
    expect(prompt).toContain("Sprich sie mit Du an");
    expect(prompt).toContain("ändern");
    expect(prompt).toContain("ausschließlich");
    // Transliterations of the words this prompt actually uses. A broad
    // ae/oe/ue sweep would flag "loehrning.ai" and "Werkzeuge" and say
    // nothing about the rule.
    for (const transliteration of [
      "aendern",
      "ausschliesslich",
      "ueber",
      "geoeffnet",
      "Buecher",
    ]) {
      expect(prompt).not.toContain(transliteration);
    }
  });

  it("uses no dash characters that the platform does not allow", () => {
    for (const locale of ["de", "en"] as const) {
      const prompt = accountChatSystemPrompt(locale);
      expect(prompt).not.toContain("—");
      expect(prompt).not.toContain("–");
    }
  });

  it("states plainly that every tool is read-only", () => {
    expect(accountChatSystemPrompt("de")).toContain("lesend");
    expect(accountChatSystemPrompt("en")).toContain("read-only");
  });

  it("answers in the requested language", () => {
    expect(accountChatSystemPrompt("en")).toContain("Answer in English.");
    expect(accountChatSystemPrompt("de")).toContain("antworte auf Deutsch");
  });

  it("keeps the fixed body as a stable, cacheable prefix", () => {
    const base = accountChatSystemPrompt("de");
    expect(accountChatSystemPrompt("de", LESSON).startsWith(base)).toBe(true);
  });

  it("names the lesson address in both languages", () => {
    expect(accountChatSystemPrompt("de", LESSON)).toContain(
      "lesson://ki-grundlagen/was-ist-ki",
    );
    expect(accountChatSystemPrompt("en", { ...LESSON, locale: "en" })).toContain(
      "course ki-grundlagen",
    );
  });

  it("defaults to the canonical language", () => {
    expect(accountChatSystemPrompt()).toBe(accountChatSystemPrompt("de"));
  });
});
