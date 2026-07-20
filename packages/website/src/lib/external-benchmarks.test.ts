import { describe, expect, it } from "vitest";
import {
  externalBenchmarks,
  benchmarkById,
  benchmarksByTopic,
  benchmarksByIds,
} from "./external-benchmarks";

describe("externalBenchmarks", () => {
  it("every entry has non-empty id, value, plain, publisher, year, topic", () => {
    for (const b of externalBenchmarks) {
      expect(b.id).toBeTruthy();
      expect(b.value).toBeTruthy();
      expect(b.plain.length).toBeGreaterThan(20);
      expect(b.publisher).toBeTruthy();
      expect(b.year).toMatch(/\d{4}/);
      expect(b.topic).toBeTruthy();
    }
  });

  it("no duplicate ids", () => {
    const ids = externalBenchmarks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no em dashes in plain copy", () => {
    for (const b of externalBenchmarks) {
      expect(b.plain).not.toMatch(/—/);
    }
  });

  it("benchmarkById returns the matching entry", () => {
    expect(benchmarkById("bitkom_2026_adoption")?.publisher).toBe(
      "Bitkom Research",
    );
    expect(benchmarkById("nonexistent")).toBeUndefined();
  });

  it("benchmarksByTopic filters correctly", () => {
    const failures = benchmarksByTopic("failure");
    expect(failures.length).toBeGreaterThanOrEqual(2);
    for (const b of failures) {
      expect(b.topic).toBe("failure");
    }
  });

  it("benchmarksByIds preserves order and skips unknown ids", () => {
    const result = benchmarksByIds([
      "bitkom_2026_adoption",
      "nonexistent",
      "gartner_2025_ai_fail",
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("bitkom_2026_adoption");
    expect(result[1].id).toBe("gartner_2025_ai_fail");
  });

  it("includes at least one German-specific stat", () => {
    const german = externalBenchmarks.filter(
      (b) =>
        b.plain.toLowerCase().includes("deutsch") ||
        b.publisher.toLowerCase().includes("destatis") ||
        b.publisher.toLowerCase().includes("bitkom") ||
        b.publisher.toLowerCase().includes("ifo"),
    );
    expect(german.length).toBeGreaterThanOrEqual(5);
  });
});
