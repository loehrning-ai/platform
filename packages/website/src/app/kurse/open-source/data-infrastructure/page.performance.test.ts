import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("data-infrastructure landing performance", () => {
  it("does not preload the interactive lesson bundle from the static landing page", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const lessonLinks = source.match(
      /<Link[\s\S]*?href=\{?`?"?\/kurse\/open-source\/data-infrastructure\/kurs\/[\s\S]*?<\/Link>/g,
    );

    expect(lessonLinks).toHaveLength(3);
    for (const link of lessonLinks ?? []) {
      expect(link).toContain("prefetch={false}");
    }
  });
});
