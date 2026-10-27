import { describe, expect, it } from "vitest";
import { COUNTERS, rate } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { AUG_OVER_SEP } from "./tile-motion";

describe("the hub tile", () => {
  it("starts each rail at August's length relative to September's", () => {
    for (const counter of COUNTERS) {
      expect(AUG_OVER_SEP[counter]).toBeCloseTo(rate(counter, "aug") / rate(counter, "sep"), 3);
    }
  });
});
