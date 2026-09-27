import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The demos hub cover below lg. Moved unchanged from
// src/app/catalog-surfaces-mobile.test.ts so the demos route and its test
// share one owner; the catalog-wide rules (server-only, paired reorders) stay
// in that file. Paths resolve from src/app, as they did there.
function source(path: "demos/page.tsx"): string {
  return readFileSync(join(__dirname, "..", path), "utf8");
}

describe("demo cover below lg", () => {
  it("keeps the demo cover compact without moving the desktop console", () => {
    const demos = source("demos/page.tsx");

    // The hero is the IDEA PlakatBand (SPEC §3.12); the facts follow it on
    // paper with tighter padding on a phone, the reviewed spacing from sm.
    const band = demos.indexOf('<PlakatBand');
    const statRow = demos.search(/<StatRow\s+stats=\{stats\}/);
    expect(demos).toMatch(/<PlakatBand\s+plakat="idea"/);
    expect(band).toBeGreaterThan(-1);
    expect(statRow).toBeGreaterThan(demos.indexOf("</PlakatBand>"));
    expect(demos).toContain(
      'className="px-4 pb-6 pt-5 sm:px-6 sm:pb-12 sm:pt-10"',
    );
    // Stats and check list stack on a phone and sit side by side from lg.
    expect(demos).toContain(
      "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
    );
    // The stats are the shared StatRow (two columns on a phone, one row of
    // three from sm), not a bespoke figure grid.
    expect(demos).toMatch(/<StatRow\s+stats=\{stats\}/);
  });
});
