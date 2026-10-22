import { describe, expect, it } from "vitest";
import { hashTarget } from "./hash";

describe("hashTarget", () => {
  it("decodes a well-formed hash, with or without the #", () => {
    expect(hashTarget("#strom")).toBe("strom");
    expect(hashTarget("montag")).toBe("montag");
    expect(hashTarget("#%C3%BC")).toBe("ü");
  });

  it("is null for no hash and for a malformed escape, never a throw", () => {
    expect(hashTarget("")).toBeNull();
    expect(hashTarget("#")).toBeNull();
    for (const bad of ["#%E0%A4%A", "#%", "#%zz", "#strom%"]) {
      expect(() => hashTarget(bad), bad).not.toThrow();
      expect(hashTarget(bad), bad).toBeNull();
    }
  });
});
