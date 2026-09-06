import { describe, expect, it } from "vitest";
import { MCP_MAX_OUTPUT_BYTES } from "./config";
import { byteLength, capJsonPayload, capText } from "./output";

describe("output caps", () => {
  it("returns a small payload untouched", () => {
    const capped = capJsonPayload({ ok: true }, { url: "https://loehrning.ai" });
    expect(capped.truncated).toBe(false);
    expect(JSON.parse(capped.text)).toEqual({ ok: true });
  });

  it("replaces an oversize payload with a pointer under the ceiling", () => {
    const huge = { body: "x".repeat(MCP_MAX_OUTPUT_BYTES * 2) };
    const capped = capJsonPayload(huge, { url: "https://loehrning.ai/kurse" });
    expect(capped.truncated).toBe(true);
    expect(capped.bytes).toBeLessThan(MCP_MAX_OUTPUT_BYTES);
    const parsed = JSON.parse(capped.text) as Record<string, unknown>;
    expect(parsed.truncated).toBe(true);
    expect(parsed.url).toBe("https://loehrning.ai/kurse");
    expect(Number(parsed.full_payload_bytes)).toBeGreaterThan(
      MCP_MAX_OUTPUT_BYTES,
    );
  });

  it("cuts text on a whole code point", () => {
    const text = "ü".repeat(100);
    const capped = capText(text, 51);
    expect(capped.truncated).toBe(true);
    expect(capped.bytes).toBeLessThanOrEqual(51);
    expect(capped.text).toBe("ü".repeat(25));
    expect(byteLength(capped.text)).toBe(50);
  });

  it("leaves text inside the budget alone", () => {
    const capped = capText("kurz", 100);
    expect(capped).toEqual({ text: "kurz", bytes: 4, truncated: false });
  });

  it("handles an empty budget without producing a broken character", () => {
    const capped = capText("äöü", 1);
    expect(capped.text).toBe("");
    expect(capped.truncated).toBe(true);
  });
});
