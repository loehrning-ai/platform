import { describe, it, expect, beforeEach } from "vitest";

import {
  __resetEngineState,
  hashRequest,
  isRateLimited,
  parseGradeJson,
  readCache,
  writeCache,
} from "./engine";

describe("grade-exercise engine — pure helpers", () => {
  beforeEach(() => {
    __resetEngineState();
  });

  describe("parseGradeJson", () => {
    const criteriaIds = ["role", "context"];

    it("parses clean JSON and computes score from passed count", () => {
      const raw = JSON.stringify({
        rubric: [
          { id: "role", passed: true, rationale: "Rolle vorhanden." },
          { id: "context", passed: false, rationale: "Branche fehlt." },
        ],
        summary: "Gute Rolle, Kontext zu dünn.",
      });
      const result = parseGradeJson(raw, criteriaIds);
      expect(result.score).toBe(0.5);
      expect(result.rubric).toHaveLength(2);
      expect(result.rubric[0]?.passed).toBe(true);
      expect(result.rubric[1]?.passed).toBe(false);
      expect(result.summary).toBe("Gute Rolle, Kontext zu dünn.");
    });

    it("strips markdown fences when Haiku accidentally returns them", () => {
      const raw = [
        "```json",
        JSON.stringify({
          rubric: [{ id: "role", passed: true, rationale: "ok." }],
          summary: "ok.",
        }),
        "```",
      ].join("\n");
      const result = parseGradeJson(raw, ["role"]);
      expect(result.score).toBe(1);
    });

    it("rejects hallucinated rubric entries", () => {
      const raw = JSON.stringify({
        rubric: [
          { id: "role", passed: true, rationale: "" },
          { id: "context", passed: true, rationale: "" },
          { id: "c", passed: true, rationale: "" },
          { id: "d", passed: true, rationale: "" },
        ],
        summary: "",
      });
      expect(() => parseGradeJson(raw, criteriaIds)).toThrow(/canonical/);
    });

    it("throws on invalid JSON", () => {
      expect(() => parseGradeJson("not json", criteriaIds)).toThrow();
    });

    it("throws when rubric array is missing", () => {
      const raw = JSON.stringify({ summary: "bad" });
      expect(() => parseGradeJson(raw, criteriaIds)).toThrow(/rubric/);
    });

    it("throws on empty rubric", () => {
      const raw = JSON.stringify({ rubric: [], summary: "" });
      expect(() => parseGradeJson(raw, criteriaIds)).toThrow(/canonical/);
    });

    it("rejects missing or model-invented criterion ids", () => {
      const raw = JSON.stringify({
        rubric: [{ passed: true, rationale: "yes" }],
        summary: "",
      });
      expect(() => parseGradeJson(raw, ["role"])).toThrow(/id\/order/);
    });

    it("clamps score to [0, 1]", () => {
      const raw = JSON.stringify({
        rubric: [
          { id: "role", passed: true, rationale: "" },
          { id: "context", passed: true, rationale: "" },
        ],
        summary: "",
      });
      const result = parseGradeJson(raw, criteriaIds);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it("rejects non-boolean passed values instead of coercing them", () => {
      const raw = JSON.stringify({
        rubric: [{ id: "role", passed: "false", rationale: "Nein." }],
        summary: "Nicht erfüllt.",
      });
      expect(() => parseGradeJson(raw, ["role"])).toThrow(/boolean/);
    });

    it("rejects reordered criterion ids", () => {
      const raw = JSON.stringify({
        rubric: [
          { id: "context", passed: true, rationale: "Ja." },
          { id: "role", passed: true, rationale: "Ja." },
        ],
        summary: "Erfüllt.",
      });
      expect(() => parseGradeJson(raw, criteriaIds)).toThrow(/id\/order/);
    });
  });

  describe("isRateLimited", () => {
    it("allows first 20 requests from an IP, blocks the 21st", () => {
      for (let i = 0; i < 20; i++) {
        expect(isRateLimited("1.2.3.4")).toBe(false);
      }
      expect(isRateLimited("1.2.3.4")).toBe(true);
    });

    it("tracks IPs independently", () => {
      for (let i = 0; i < 20; i++) {
        isRateLimited("1.1.1.1");
      }
      // Different IP gets its own bucket.
      expect(isRateLimited("2.2.2.2")).toBe(false);
      expect(isRateLimited("1.1.1.1")).toBe(true);
    });
  });

  describe("cache read/write", () => {
    it("round-trips a response", async () => {
      const key = "abc";
      const response = {
        score: 0.8,
        rubric: [{ id: "a", passed: true, rationale: "r" }],
        summary: "ok",
        cached: false,
      };
      writeCache(key, response);
      expect(readCache(key)).toEqual(response);
    });

    it("returns null for unknown keys", () => {
      expect(readCache("missing")).toBeNull();
    });
  });

  describe("hashRequest", () => {
    it("is deterministic — same input yields same hash", async () => {
      const a = await hashRequest("k", "l", "e", "scenario", ["rubric"], { x: 1 });
      const b = await hashRequest("k", "l", "e", "scenario", ["rubric"], { x: 1 });
      expect(a).toBe(b);
    });

    it("differs when userInput differs", async () => {
      const a = await hashRequest("k", "l", "e", "scenario", ["rubric"], { x: 1 });
      const b = await hashRequest("k", "l", "e", "scenario", ["rubric"], { x: 2 });
      expect(a).not.toBe(b);
    });

    it("differs when the canonical scenario or rubric changes", async () => {
      const base = await hashRequest("k", "l", "e", "one", ["a"], "answer");
      const scenarioChanged = await hashRequest("k", "l", "e", "two", ["a"], "answer");
      const rubricChanged = await hashRequest("k", "l", "e", "one", ["b"], "answer");
      expect(base).not.toBe(scenarioChanged);
      expect(base).not.toBe(rubricChanged);
    });
  });
});
