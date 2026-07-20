import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetEngineState,
  hashRequest,
  isPracticeEnabled,
  parsePlacement,
  readCache,
  writeCache,
} from "./engine";
import type { PracticeRequestParsed } from "./validation";

describe("practice engine — pure helpers", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    __resetEngineState();
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;
  });

  describe("isPracticeEnabled (feature flag, OFF by default)", () => {
    function configureRuntime() {
      vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
      vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
      vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
      vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
    }

    it("is OFF when the env var is unset", () => {
      expect(isPracticeEnabled()).toBe(false);
    });

    it("is OFF for every value except the exact validated literal 'true'", () => {
      for (const v of ["false", "0", "off", "no", "", "TRUE", "1", "on", "On", " true "]) {
        process.env.AI_NATIVE_PRACTICE_ENABLED = v;
        expect(isPracticeEnabled()).toBe(false);
      }
    });

    it("is ON for the exact validated literal 'true'", () => {
      configureRuntime();
      vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
      expect(isPracticeEnabled()).toBe(true);
    });
  });

  describe("parsePlacement", () => {
    const existing = ["Kunde", "Angebot", "Server"];

    it("parses clean JSON and clamps coordinates into [0.05, 0.95]", () => {
      const raw = JSON.stringify({
        x: 0.4,
        y: 0.6,
        near: "Kunde",
        why: "Vertrieb.",
      });
      const result = parsePlacement(raw, existing);
      expect(result.x).toBe(0.4);
      expect(result.y).toBe(0.6);
      expect(result.near).toBe("Kunde");
      expect(result.why).toBe("Vertrieb.");
    });

    it("strips markdown fences", () => {
      const raw = [
        "```json",
        JSON.stringify({ x: 0.2, y: 0.2, near: "Server", why: "Technik." }),
        "```",
      ].join("\n");
      const result = parsePlacement(raw, existing);
      expect(result.near).toBe("Server");
    });

    it("clamps out-of-range coordinates", () => {
      const raw = JSON.stringify({ x: 9, y: -3, near: "Kunde", why: "" });
      const result = parsePlacement(raw, existing);
      expect(result.x).toBeLessThanOrEqual(0.95);
      expect(result.y).toBeGreaterThanOrEqual(0.05);
    });

    it("falls back to the first existing word when 'near' hallucinated", () => {
      const raw = JSON.stringify({ x: 0.5, y: 0.5, near: "Mond", why: "x" });
      const result = parsePlacement(raw, existing);
      expect(result.near).toBe("Kunde");
    });

    it("supplies a default 'why' when missing", () => {
      const raw = JSON.stringify({ x: 0.5, y: 0.5, near: "Kunde" });
      const result = parsePlacement(raw, existing);
      expect(result.why.length).toBeGreaterThan(0);
    });

    it("throws on invalid JSON", () => {
      expect(() => parsePlacement("not json", existing)).toThrow();
    });

    it("throws when x/y are not finite", () => {
      const raw = JSON.stringify({ x: "abc", near: "Kunde", why: "x" });
      expect(() => parsePlacement(raw, existing)).toThrow(/finite/);
    });
  });

  describe("cache + hash", () => {
    const req: PracticeRequestParsed = { mode: "complete", prompt: "hi" };

    it("round-trips a response", () => {
      const response = { mode: "complete", text: "out", cached: false } as const;
      writeCache("k1", response);
      expect(readCache("k1")).toEqual(response);
    });

    it("returns null for unknown keys", () => {
      expect(readCache("nope")).toBeNull();
    });

    it("hashRequest is deterministic and input-sensitive", async () => {
      const a = await hashRequest(req);
      const b = await hashRequest({ mode: "complete", prompt: "hi" });
      const c = await hashRequest({ mode: "complete", prompt: "bye" });
      expect(a).toBe(b);
      expect(a).not.toBe(c);
    });
  });
});
