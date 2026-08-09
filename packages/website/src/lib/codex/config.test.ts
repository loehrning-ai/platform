import { describe, it, expect } from "vitest";
import { CODEX_CONFIG, CODEX_CONFIG_DE } from "./config";

describe("CODEX_CONFIG ", () => {
  it("registers codex with English-language content and the all-lessons-completion cert path", () => {
    expect(CODEX_CONFIG.slug).toBe("codex");
    expect(CODEX_CONFIG.language).toBe("en");
    expect(CODEX_CONFIG.basePath).toBe("/kurse/open-source/codex");
    expect(CODEX_CONFIG.coursePath).toBe("/kurse/open-source/codex/kurs");
    expect(CODEX_CONFIG.blockIds).toEqual([]);
  });

  it("has a non-empty certificate file stem and no em/en dashes in its copy", () => {
    expect(CODEX_CONFIG.certificateFileStem.length).toBeGreaterThan(0);
    const copy = [
      CODEX_CONFIG.title,
      CODEX_CONFIG.certificateTitle,
      CODEX_CONFIG.certificateSubtitle,
      CODEX_CONFIG.certificateReferenceLabel,
      CODEX_CONFIG.quizPassMessage,
      ...CODEX_CONFIG.certificateModules,
    ].join(" ");
    expect([...copy].some((ch) => ch === "—" || ch === "–")).toBe(
      false,
    );
  });

  it("carries a certificate recordNoun consistent with an English certificate of completion", () => {
    expect(CODEX_CONFIG.recordNoun.label).toBe("Certificate of Completion");
    expect(CODEX_CONFIG.recordNoun.possessive).toContain("certificate");
    expect(CODEX_CONFIG.recordNoun.demonstrative).toContain("certificate");
  });

  it("keeps machine identity stable in the German certificate config", () => {
    expect(CODEX_CONFIG_DE.language).toBe("de");
    expect(CODEX_CONFIG_DE.slug).toBe(CODEX_CONFIG.slug);
    expect(CODEX_CONFIG_DE.basePath).toBe(CODEX_CONFIG.basePath);
    expect(CODEX_CONFIG_DE.coursePath).toBe(CODEX_CONFIG.coursePath);
    expect(CODEX_CONFIG_DE.blockIds).toEqual(CODEX_CONFIG.blockIds);
    expect(CODEX_CONFIG_DE.title).toBe("Codex-Kurs");
    expect(CODEX_CONFIG_DE.recordNoun.label).toBe("Teilnahmebestätigung");
  });
});
