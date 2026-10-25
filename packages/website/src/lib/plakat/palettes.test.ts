import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEBSITE = join(__dirname, "..", "..", "..");

describe("docs/plakat-pairings.md", () => {
  it("is exactly what scripts/plakat/build-pairings.mjs writes, with every contrast floor met", () => {
    const script = join(WEBSITE, "scripts", "plakat", "build-pairings.mjs");
    // --check exits 1 (and execFileSync throws) when the file is stale, when
    // palettes.ts and globals.css disagree, or a required pairing misses its
    // contrast floor.
    const out = execFileSync(process.execPath, [script, "--check"], {
      cwd: WEBSITE,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(out).toContain("(up to date)");
  });
});
