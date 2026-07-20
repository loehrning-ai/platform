import { describe, it, expect } from "vitest";
import {
  getAllChallenges,
  getChallengeForDate,
  getISOWeek,
  formatWeekIso,
} from "./challenges";

describe("ai-native challenges — ISO week math", () => {
  it("returns 1 for January 4 (always in week 1 per ISO 8601)", () => {
    // ISO 8601: week 1 is the week containing the year's first Thursday.
    // January 4 is ALWAYS in week 1.
    expect(getISOWeek(new Date(Date.UTC(2026, 0, 4)))).toBe(1);
    expect(getISOWeek(new Date(Date.UTC(2025, 0, 4)))).toBe(1);
  });

  it("handles week-53 years correctly", () => {
    // 2026 starts on a Thursday → 2025 ends on week 52.
    expect(getISOWeek(new Date(Date.UTC(2025, 11, 29)))).toBe(1);
  });

  it("formatWeekIso returns year-Wxx format", () => {
    expect(formatWeekIso(new Date(Date.UTC(2026, 0, 4)))).toBe("2026-W01");
  });
});

describe("ai-native challenges — rotation", () => {
  it("loads 12 challenges", () => {
    expect(getAllChallenges()).toHaveLength(12);
  });

  it("wraps back to week 1 at week 13 (modular)", () => {
    // Jan 4 is ALWAYS in ISO week 1
    const wk1Date = new Date(Date.UTC(2026, 0, 4));
    const ch1 = getChallengeForDate(wk1Date);
    // Week 1 → offset 0
    expect(ch1.weekOffset).toBe(0);

    // Offset deterministic for any given date
    expect(getChallengeForDate(wk1Date)).toEqual(ch1);

    // Week 13 should wrap back to week 1 (modulo 12)
    // Jan 4 + 12 weeks = March 29, 2026 (in week 13)
    const wk13Date = new Date(Date.UTC(2026, 2, 29));
    const ch13 = getChallengeForDate(wk13Date);
    // With 12-challenge rotation: (13-1) % 12 = 0 → same as week 1
    expect(ch13.weekOffset).toBe(0);
  });

  it("getChallengeForDate is deterministic", () => {
    const d = new Date(Date.UTC(2026, 0, 4));
    expect(getChallengeForDate(d)).toEqual(getChallengeForDate(d));
  });

  it("every challenge has required fields", () => {
    const all = getAllChallenges();
    all.forEach((c) => {
      expect(c.scenario.length).toBeGreaterThan(50);
      expect(c.modelSolution.length).toBeGreaterThan(100);
      expect(c.rubric.length).toBe(7); // §0 constraint
      expect(c.stack.length).toBeGreaterThan(0);
      expect(c.timeBudget.length).toBeGreaterThan(0);
      expect(c.role.length).toBeGreaterThan(0);
    });
  });
});
