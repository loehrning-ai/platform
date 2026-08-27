import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SURFACES = [
  "../ueber-mich/ueber-mich-content.tsx",
  "page.tsx",
  "artifact-ledger.tsx",
  "../../components/open-source/artifact-preview-stack.tsx",
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

  it.each(SURFACES)("keeps %s geometry disciplined", (path) => {
    expect(source(path)).not.toMatch(
      /(?:hover:-translate|transition-all|rounded-(?:xl|2xl|3xl|full))/,
    );
  });

  it.each(SURFACES)("keeps %s scene gaps at 48px or less", (path) => {
    expect(source(path)).not.toMatch(
      /\b(?:py-(?:16|20|24|28|32)|mt-(?:14|16|20|24|28|32)|gap-(?:14|16|20|24|28|32))\b/,
    );
  });

  it("uses one bounded, accessible image stack while evidence stays compact", () => {
    const hub = source("page.tsx");
    const ledger = source("artifact-ledger.tsx");
    const preview = source(
      "../../components/open-source/artifact-preview-stack.tsx",
    );

    expect(hub).toContain("<ArtifactLedger");
    expect(ledger).toContain("<ArtifactPreviewStack");
    expect(ledger).toContain("<details");
    expect(preview).toContain("transition-[transform,opacity]");
    expect(preview).toContain("motion-reduce:transition-none");
    expect(preview).toContain("aria-pressed");
    expect(preview).toContain("onKeyDown");
    expect(preview).not.toMatch(/transition-all|animate-|repeat|autoplay/);
  });
});
