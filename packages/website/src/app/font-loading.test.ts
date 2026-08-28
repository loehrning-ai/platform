import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global font loading contract", () => {
  it("keeps the brand font off every route's preload path", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );

    expect(source).toMatch(/display:\s*"optional"/);
    expect(source).toMatch(/preload:\s*false/);
  });

  it("bundles Geist Mono so monospace metrics do not vary by machine", () => {
    // Course and demo layouts are laid out against Geist Mono's advance
    // widths. Resolving monospace from an OS stack picks a wider face on
    // Linux than on macOS, which overflows prompt and code blocks on some
    // machines only - and makes the responsive suite pass or fail according
    // to which fonts the CI image happens to ship.
    const source = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const globalStyles = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(source).toContain('from "geist/font/mono"');
    expect(source).toContain("GeistMono.variable");
    expect(globalStyles).toMatch(
      /--font-mono:\s*var\(--font-geist-mono\),\s*monospace;/,
    );
    expect(globalStyles).not.toMatch(/--font-geist-mono:\s*ui-monospace/);
  });

  it("uses a bounded route subset instead of duplicating the full Bold face", () => {
    const catalogSource = readFileSync(
      resolve(process.cwd(), "src/app/buecher/page.tsx"),
      "utf8",
    );
    const subsetPath = resolve(
      process.cwd(),
      "src/fonts/LoehrningSans-Bold-BookDisplay.woff2",
    );

    expect(catalogSource).toContain(
      "LoehrningSans-Bold-BookDisplay.woff2",
    );
    expect(catalogSource).not.toContain(
      'src: "../../fonts/LoehrningSans-Bold.woff2"',
    );
    expect(statSync(subsetPath).size).toBeLessThan(8 * 1024);
  });
});
