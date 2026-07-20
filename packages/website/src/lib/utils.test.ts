/**
 * utils.test.ts (regression coverage)
 *
 * Covers the `cn` class-name helper from `@/lib/utils`. The other two exports of
 * this module, `looksLikeUrl` and `normalizeUrl`, are already covered by the
 * co-located `eu-ai-act-utils.test.ts`, so this file only fills the untested
 * gap.
 *
 * `cn` composes clsx (conditional/array/object flattening) with tailwind-merge
 * (later Tailwind utility wins on conflict). Each assertion below verifies that
 * BOTH layers are wired: the conflict-resolution cases only pass if tailwind-
 * merge runs, and the falsy/object/array cases only pass if clsx runs.
 */

import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins independent classes with a single space", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("lets the later conflicting Tailwind utility win (tailwind-merge wired)", () => {
    // Plain clsx would yield "px-2 px-4"; tailwind-merge collapses to "px-4".
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("resolves conflicts across array inputs too", () => {
    expect(cn("p-2", ["p-4"])).toBe("p-4");
  });

  it("drops falsy values (clsx wired)", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("applies conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("flattens nested arrays and objects", () => {
    expect(cn(["flex", { "gap-2": true, "gap-4": false }])).toBe("flex gap-2");
  });

  it("returns an empty string when given no truthy classes", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});
