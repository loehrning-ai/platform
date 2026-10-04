import { describe, it, expect } from "vitest";
import {
  AI_NATIVE_URL,
  AI_NATIVE_TRUST_SIGNALS,
  AI_NATIVE_TRUST_SIGNALS_EN,
  getAiNativeTrustSignals,
} from "./content";

describe("ai-native content", () => {
  it("points at the free landing route", () => {
    expect(AI_NATIVE_URL).toBe("/ai-native");
  });

  it("mirrors three trust signals per locale and spells Löhr with an umlaut", () => {
    expect(AI_NATIVE_TRUST_SIGNALS).toHaveLength(3);
    expect(AI_NATIVE_TRUST_SIGNALS_EN).toHaveLength(3);
    expect(getAiNativeTrustSignals("en")).toBe(AI_NATIVE_TRUST_SIGNALS_EN);
    for (const signal of [...AI_NATIVE_TRUST_SIGNALS, ...AI_NATIVE_TRUST_SIGNALS_EN]) {
      expect(signal.trim().length).toBeGreaterThan(0);
      expect(signal).not.toMatch(/Loehr/);
      expect(signal).not.toMatch(/[—–]/);
    }
    expect(AI_NATIVE_TRUST_SIGNALS.some((s) => s.includes("Löhr"))).toBe(true);
  });
});
