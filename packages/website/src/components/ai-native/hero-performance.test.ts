import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AI-native hero animation contract", () => {
  it("pauses the perpetual typewriter outside the observable viewport", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ai-native/hero.tsx"),
      "utf8",
    );

    expect(source).toContain("new IntersectionObserver");
    expect(source).toContain("useMotionAllowed()");
    expect(source).toMatch(
      /if \(!motionAllowed \|\| !paletteInView\) return;/,
    );
    expect(source).toContain('min-h-[64px]');
    expect(source).toContain('min-h-[104px]');
  });
});
