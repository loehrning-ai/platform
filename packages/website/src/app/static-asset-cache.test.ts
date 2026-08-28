import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("versioned public asset caching", () => {
  it("gives runtime fonts and versioned course covers immutable URLs", () => {
    const config = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    const courseCovers = readdirSync(
      resolve(process.cwd(), "public/course-covers"),
    );

    expect(config).toContain('source: "/fonts/:path*.woff2"');
    expect(config).toContain('source: "/course-covers/:path*.webp"');
    expect(
      config.match(/public, max-age=31536000, immutable/g),
    ).toHaveLength(2);
    expect(courseCovers.length).toBeGreaterThan(0);
    expect(courseCovers.every((name) => /-v\d+\.webp$/.test(name))).toBe(true);
  });
});
