import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readRootLicensePolicy } from "./license-policy.server";

describe("public license policy source", () => {
  it("returns the exact repository-root policy and its digest", () => {
    const expected = readFileSync(
      resolve(process.cwd(), "..", "..", "LICENSE_POLICY.md"),
      "utf8",
    );
    const policy = readRootLicensePolicy();

    expect(policy.markdown).toBe(expected);
    expect(policy.sha256).toBe(
      createHash("sha256").update(expected).digest("hex"),
    );
    expect(policy.markdown).toContain(
      "`packages/website/public/fonts/**` are not",
    );
    expect(policy.markdown).toContain(
      "versioned runtime faces under `packages/website/public/fonts/**` are modified and renamed derivatives of Inter",
    );
  });

  it("retains the exact ISC notices and truthful geo-data provenance", () => {
    const repositoryRoot = resolve(process.cwd(), "..", "..");
    const packageRoot = process.cwd();

    for (const [dependency, notice] of [
      ["world-atlas", "world-atlas-ISC.txt"],
      ["topojson-client", "topojson-client-ISC.txt"],
    ] as const) {
      expect(
        readFileSync(resolve(repositoryRoot, "LICENSES", notice), "utf8"),
      ).toBe(
        readFileSync(resolve(packageRoot, "node_modules", dependency, "LICENSE"), "utf8"),
      );
    }

    const generator = readFileSync(
      resolve(packageRoot, "scripts/extract-country-outlines.mjs"),
      "utf8",
    );
    const generated = readFileSync(
      resolve(packageRoot, "src/lib/country-polylines-3d.ts"),
      "utf8",
    );
    for (const source of [generator, generated]) {
      expect(source).toContain("world-atlas/countries-50m.json");
      expect(source).toContain("ISC, Michael Bostock");
      expect(source).not.toContain("countries-110m.json");
      expect(source).not.toContain("MIT, Mike Bostock");
    }
    expect(generator).toContain('"../node_modules/world-atlas/countries-50m.json"');
    expect(generated).toContain("selecting only the exterior ring");
  });
});
