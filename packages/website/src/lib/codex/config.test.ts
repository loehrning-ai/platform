import { describe, it, expect } from "vitest";
import { CODEX_CONFIG } from "./config";

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
});
