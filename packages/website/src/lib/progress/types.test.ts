// ─── Checkpoint key contract test (regression coverage) ──
//
// types.ts is mostly type + constant declarations, but checkpointKey() is a
// real pure function whose exact output format is load-bearing: the unified
// store keys `checkpoints` by "<lessonId>::<cpId>" and every checkpoint
// read/write round-trips through this exact composite. A regression in the
// "::" delimiter would silently break checkpoint lookups, so pin it here.

import { describe, it, expect } from "vitest";
import {
  checkpointKey,
  MAX_EXERCISE_SUMMARY_BYTES,
  truncateToByteLength,
  UNIFIED_SCHEMA_VERSION,
} from "./types";

describe("checkpointKey", () => {
  it("joins lessonId and cpId with a '::' delimiter", () => {
    expect(checkpointKey("l1", "c1")).toBe("l1::c1");
  });

  it("preserves multi-segment ids verbatim (no trimming, no escaping)", () => {
    expect(checkpointKey("modul-3", "cp-final")).toBe("modul-3::cp-final");
  });

  it("keeps empty segments so the delimiter is always present", () => {
    expect(checkpointKey("", "")).toBe("::");
    expect(checkpointKey("l1", "")).toBe("l1::");
  });
});

// plan 007 stage 5: progress storage redesign bumps the unified schema to 3
// (one row per (user_id, course_slug) instead of one shared blob per user).
describe("UNIFIED_SCHEMA_VERSION", () => {
  it("is 3", () => {
    expect(UNIFIED_SCHEMA_VERSION).toBe(3);
  });
});

// plan 007 stage 5: exercise summaries are capped by UTF-8 BYTE length, not
// character count, because German umlauts/ß are 2 bytes each and the real
// Postgres constraint is byte-based (pg_column_size).
describe("truncateToByteLength", () => {
  it("returns ASCII text unchanged when under the byte budget", () => {
    expect(truncateToByteLength("hello world", 20)).toBe("hello world");
  });

  it("truncates ASCII text to exactly maxBytes", () => {
    const result = truncateToByteLength("a".repeat(10), 5);
    expect(result).toBe("aaaaa");
    expect(new TextEncoder().encode(result).length).toBe(5);
  });

  it("never splits a multi-byte UTF-8 character in half", () => {
    // Every character below is a 2-byte UTF-8 sequence (ä = 0xC3 0xA4, etc).
    const text = "ä".repeat(10); // 20 bytes total
    const result = truncateToByteLength(text, 5); // odd budget mid-character
    expect(new TextEncoder().encode(result).length).toBeLessThanOrEqual(5);
    // No replacement-character artifact from a chopped byte sequence.
    expect(result).not.toContain("�");
    // Every character in the result must be a real, complete "ä".
    expect([...result].every((ch) => ch === "ä")).toBe(true);
  });

  it("caps a German exercise summary at MAX_EXERCISE_SUMMARY_BYTES", () => {
    const summary = "Über KI-Kompetenz und Verantwortungsübernahme. ".repeat(50);
    const capped = truncateToByteLength(summary, MAX_EXERCISE_SUMMARY_BYTES);
    expect(new TextEncoder().encode(capped).length).toBeLessThanOrEqual(
      MAX_EXERCISE_SUMMARY_BYTES,
    );
  });

  it("is a no-op for an already-short string", () => {
    expect(truncateToByteLength("kurz", 500)).toBe("kurz");
  });
});
