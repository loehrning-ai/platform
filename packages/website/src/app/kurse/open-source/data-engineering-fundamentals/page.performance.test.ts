import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("data-engineering-fundamentals landing performance", () => {
  it("keeps chapter bodies, simulators, and client icon libraries out of the landing entry", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");

    expect(source).not.toContain("getDefLocaleRegistry");
    expect(source).not.toContain("@/lib/data-engineering-fundamentals/content");
    expect(source).not.toContain("lucide-react");
    expect(source).not.toMatch(
      /components\/data-engineering-fundamentals\/(?:chapters|simulators)/,
    );
    expect(source).toContain("DEF_CHAPTERS.map");
  });

  it("disables route prefetch for every chapter transition", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const chapterLink = source.match(
      /<Link[\s\S]*?chapterId:\s*chapter\.id[\s\S]*?>/,
    )?.[0];

    expect(chapterLink).toContain("prefetch={false}");
  });
});
