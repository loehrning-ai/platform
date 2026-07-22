import { describe, it, expect } from "vitest";
import {
  genericAnswer,
  gradePrompt,
  judgeRewrite,
  fillBlankFeedback,
  shareabilityFeedback,
  socraticReply,
  buildClaudeMd,
  simulatedDelayMs,
} from "./simulated-claude";

describe("simulated-claude ", () => {
  describe("genericAnswer", () => {
    it("returns a structured launch-email answer for a detailed launch-email prompt", () => {
      const out = genericAnswer(
        "Write a launch email announcing our new authentication service. Audience: engineers. Format: subject then body. Context: replacing legacy SSO.",
      );
      expect(out).toContain("Subject:");
      expect(out).toContain("authkit migrate");
    });

    it("returns a short generic launch-email answer for a bare launch-email prompt", () => {
      const out = genericAnswer("write a launch email");
      expect(out).toContain("Subject: New authentication service");
    });

    it("returns an honest, self-aware answer for a p99/latency prompt", () => {
      const out = genericAnswer("which service has the worst p99 latency?");
      expect(out.toLowerCase()).toContain("don't actually have your telemetry");
    });

    it("returns an honest, self-aware answer for an oncall prompt", () => {
      const out = genericAnswer("who owns the oncall rotation for auth?");
      expect(out.toLowerCase()).toContain("guessing");
    });

    it("falls back to a generic honest continuation for anything else", () => {
      const out = genericAnswer("summarize this thread");
      expect(out).toContain("useful response");
    });
  });

  describe("gradePrompt", () => {
    it("scores a thin, vague prompt low with weaknesses named", () => {
      const result = gradePrompt("hi");
      expect(result.score).toBeLessThan(50);
      expect(result.weaknesses.length).toBeGreaterThan(0);
    });

    it("scores a role+context+format-rich prompt higher with strengths named", () => {
      const rich =
        "You are a senior release manager. Context: we ship weekly and the audience is internal engineers, because they need a quick status. Format the output as three bullet points under 100 words. For example: - Shipped X.";
      const result = gradePrompt(rich);
      expect(result.score).toBeGreaterThan(70);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.oneBetterRewrite).toContain("CONTEXT");
    });

    it("clamps score into [8, 96]", () => {
      const result = gradePrompt("");
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.score).toBeLessThanOrEqual(96);
    });
  });

  describe("judgeRewrite", () => {
    it("declares the user the winner for a much stronger rewrite", () => {
      const result = judgeRewrite(
        "write release notes plz",
        "You are a senior engineer. Context: weekly release for internal tooling. Format as three bullets, under 100 words each. For example: - Fixed the login bug.",
      );
      expect(result.winner).toBe("user");
      expect(result.userScore).toBeGreaterThan(result.originalScore);
    });

    it("never returns a userScore or originalScore outside [0, 100]", () => {
      const result = judgeRewrite("original text here", "short");
      expect(result.userScore).toBeGreaterThanOrEqual(0);
      expect(result.userScore).toBeLessThanOrEqual(100);
      expect(result.originalScore).toBeGreaterThanOrEqual(0);
      expect(result.originalScore).toBeLessThanOrEqual(100);
    });
  });

  describe("fixed coaching feedback", () => {
    it("fillBlankFeedback returns a non-empty, stable string", () => {
      expect(fillBlankFeedback().length).toBeGreaterThan(20);
      expect(fillBlankFeedback()).toBe(fillBlankFeedback());
    });

    it("shareabilityFeedback returns a non-empty, stable string", () => {
      expect(shareabilityFeedback().length).toBeGreaterThan(20);
      expect(shareabilityFeedback()).toContain("PLACEHOLDERS");
    });
  });

  describe("socraticReply", () => {
    it("asks a probing question back before turn 3", () => {
      const out = socraticReply("what is claude?", 1);
      expect(out).toContain("?");
      expect(out.toLowerCase()).not.toContain("you've got it");
    });

    it("wraps up with the course thesis at turn 3 or beyond", () => {
      const out = socraticReply("ok I think I get it", 3);
      expect(out).toContain("completion engine");
    });

    it("is deterministic for the same input", () => {
      expect(socraticReply("same input", 1)).toBe(socraticReply("same input", 1));
    });
  });

  describe("buildClaudeMd", () => {
    it("renders every provided field into the markdown template", () => {
      const md = buildClaudeMd({
        project: "Reporting dashboard",
        stack: "TypeScript, React",
        conventions: "Functional components only",
        avoid: "No any types",
        commands: "yarn build",
      });
      expect(md).toContain("# CLAUDE.md");
      expect(md).toContain("Reporting dashboard");
      expect(md).toContain("TypeScript, React");
      expect(md).toContain("Functional components only");
      expect(md).toContain("No any types");
      expect(md).toContain("yarn build");
    });

    it("falls back to placeholders for empty fields", () => {
      const md = buildClaudeMd({
        project: "",
        stack: "",
        conventions: "",
        avoid: "",
        commands: "",
      });
      expect(md).toContain("Your project");
    });
  });

  describe("simulatedDelayMs", () => {
    it("returns a small, bounded, deterministic delay per seed", () => {
      const a = simulatedDelayMs("hello");
      const b = simulatedDelayMs("hello");
      expect(a).toBe(b);
      expect(a).toBeGreaterThanOrEqual(12);
      expect(a).toBeLessThan(40);
    });
  });
});
