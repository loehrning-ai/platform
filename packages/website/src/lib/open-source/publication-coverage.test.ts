import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("open-source publication coverage", () => {
  it("includes the public license policy in the Lighthouse route set", () => {
    const config = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "..", "..", "lighthouserc.json"),
        "utf8",
      ),
    ) as { ci?: { collect?: { url?: unknown } } };

    expect(config.ci?.collect?.url).toEqual(
      expect.arrayContaining([
        "http://localhost:3000/open-source/lizenzrichtlinie",
      ]),
    );
  });
});
