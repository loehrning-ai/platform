// ─── Checkpoint key contract test (regression coverage) ──
//
// types.ts is mostly type + constant declarations, but checkpointKey() is a
// real pure function whose exact output format is load-bearing: the unified
// store keys `checkpoints` by "<lessonId>::<cpId>" and every checkpoint
// read/write round-trips through this exact composite. A regression in the
// "::" delimiter would silently break checkpoint lookups, so pin it here.

import { describe, it, expect } from "vitest";
import { checkpointKey } from "./types";

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
