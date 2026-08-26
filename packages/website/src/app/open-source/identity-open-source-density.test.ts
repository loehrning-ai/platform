import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SURFACES = [
  "../ueber-mich/ueber-mich-content.tsx",
  "page.tsx",
  "artifact-ledger.tsx",
  "lizenzrichtlinie/page.tsx",
  "[kind]/[slug]/page.tsx",
  "[kind]/[slug]/not-found.tsx",
  "error.tsx",
] as const;

function source(path: (typeof SURFACES)[number]): string {
  return readFileSync(join(__dirname, path), "utf8");
}

describe("identity and open-source editorial density", () => {
  it.each(SURFACES)("keeps %s labels at 12px or larger", (path) => {
    expect(source(path)).not.toMatch(/\btext-\[(?:9|10|10\.5|11)px\]\b/);
  });

  it.each(SURFACES)("keeps %s flat and free of decorative motion", (path) => {
    expect(source(path)).not.toMatch(
      /(?:shadow-(?:card|card-hover|tile)|shadow-\[|hover:-translate|transition-all|rounded-(?:xl|2xl|3xl|full))/,
    );
  });

  it.each(SURFACES)("keeps %s scene gaps at 48px or less", (path) => {
    expect(source(path)).not.toMatch(
      /\b(?:py-(?:16|20|24|28|32)|mt-(?:14|16|20|24|28|32)|gap-(?:14|16|20|24|28|32))\b/,
    );
  });

  it("uses a static evidence ledger instead of reveal cards", () => {
    const hub = source("page.tsx");
    expect(hub).toContain("<ArtifactLedger");
    expect(hub).not.toMatch(/DrawRule|ShelfReveal|OpenSourceArtifactShelf/);
    expect(source("artifact-ledger.tsx")).toContain("<details");
  });
});
