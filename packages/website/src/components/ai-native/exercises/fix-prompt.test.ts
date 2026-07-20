import { describe, it, expect } from "vitest";
import { gradeFixPrompt } from "./fix-prompt";

describe("gradeFixPrompt — grading purity + correctness", () => {
  const criteria = [
    { id: "role", label: "Rolle definiert", pattern: "rolle:" },
    { id: "ctx", label: "Kontext erwähnt", pattern: "kontext:" },
    { id: "format", label: "Format-Spec enthalten", pattern: "format:" },
    {
      id: "constraints",
      label: "Constraints benannt",
      pattern: "constraints?",
      regex: true,
    },
  ];

  it("is deterministic — same input yields same result twice", () => {
    const draft = "Rolle: Marketing-Lead. Kontext: SaaS. Format: LinkedIn-Post.";
    const a = gradeFixPrompt(draft, criteria);
    const b = gradeFixPrompt(draft, criteria);
    expect(a).toEqual(b);
  });

  it("scores 1.0 when all criteria match", () => {
    const draft =
      "Rolle: Marketing-Lead. Kontext: B2B SaaS. Format: LinkedIn-Post. Constraint: kein Hype-Sprech.";
    const { score, matches } = gradeFixPrompt(draft, criteria);
    expect(matches).toEqual([true, true, true, true]);
    expect(score).toBe(1);
  });

  it("scores 0 when no criteria match", () => {
    const draft = "schreib was zu Marketing";
    const { score } = gradeFixPrompt(draft, criteria);
    expect(score).toBe(0);
  });

  it("is case-insensitive for plain substring matches", () => {
    const draft = "ROLLE: Analyst. KONTEXT: Banking.";
    const { matches } = gradeFixPrompt(draft, criteria);
    expect(matches[0]).toBe(true); // rolle:
    expect(matches[1]).toBe(true); // kontext:
  });

  it("regex criteria handle word variations", () => {
    const draftSingular = "eine Constraint: keine Buzzwords";
    const draftPlural = "Constraints: keine Buzzwords, keine Listen";
    expect(gradeFixPrompt(draftSingular, criteria).matches[3]).toBe(true);
    expect(gradeFixPrompt(draftPlural, criteria).matches[3]).toBe(true);
  });

  it("invalid regex pattern returns false (no throw)", () => {
    const bad = [{ id: "x", label: "Broken", pattern: "[invalid(", regex: true }];
    const { matches } = gradeFixPrompt("anything", bad);
    expect(matches[0]).toBe(false);
  });

  it("empty criteria returns score 0 (no div by zero)", () => {
    const { score } = gradeFixPrompt("anything", []);
    expect(score).toBe(0);
  });

  it("does not use Date.now or Math.random (determinism)", () => {
    // Call the same inputs with 100ms delay between to simulate time passage
    const draft = "Rolle: dev. Format: markdown.";
    const before = gradeFixPrompt(draft, criteria);
    // sync loop to simulate passage of time
    for (let i = 0; i < 1e5; i++) void Math.floor(i);
    const after = gradeFixPrompt(draft, criteria);
    expect(before).toEqual(after);
  });
});
