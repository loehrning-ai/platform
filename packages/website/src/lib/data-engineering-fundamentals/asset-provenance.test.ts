import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// ─── Governance: social-preview asset provenance ─
//
// The two real binary assets this course adds beyond its pre-existing
// screenshot+license entries (assets/social-preview.png/.svg in the
// pinned source tree) — tracked in ASSET_MANIFEST.json (repo root) even
// though this course's own opengraph-image.tsx/twitter-image.tsx
// generate their card programmatically rather than serving these files
// directly, matching the same governance convention every other checked-
// in imported-course asset follows.

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("data-engineering-fundamentals social-preview asset provenance", () => {
  it("both files exist on disk and match the checked-in ASSET_MANIFEST.json entries", () => {
    const repoRoot = join(process.cwd(), "..", "..");
    const manifestPath = join(repoRoot, "ASSET_MANIFEST.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      assets: readonly { path: string; sizeBytes: number; sha256: string }[];
    };

    for (const rel of [
      "packages/website/public/imported-courses/social-previews/data-engineering-fundamentals.png",
      "packages/website/public/imported-courses/social-previews/data-engineering-fundamentals.svg",
    ]) {
      const entry = manifest.assets.find((a) => a.path === rel);
      expect(entry, `missing ASSET_MANIFEST.json entry for ${rel}`).toBeDefined();
      const absPath = join(repoRoot, rel);
      expect(existsSync(absPath), `missing file on disk: ${rel}`).toBe(true);
      expect(sha256(absPath)).toBe(entry!.sha256);
      expect(statSync(absPath).size).toBe(entry!.sizeBytes);
    }
  });
});
