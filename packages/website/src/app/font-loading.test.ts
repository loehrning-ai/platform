import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global font loading contract", () => {
  it("preloads only the regular and bold above-the-fold brand faces", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const globalStyles = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(source).toContain(
      'preload("/fonts/loehrning-sans-regular-v1.woff2"',
    );
    expect(source).toContain(
      'preload("/fonts/loehrning-sans-bold-v1.woff2"',
    );
    expect(source).not.toMatch(
      /preload\("\/fonts\/loehrning-sans-(?:medium|semibold)/,
    );
    expect(globalStyles.match(/font-display:\s*optional/g)).toHaveLength(4);
    for (const weight of ["regular", "medium", "semibold", "bold"]) {
      expect(globalStyles).toContain(
        `/fonts/loehrning-sans-${weight}-v1.woff2`,
      );
    }
  });

  it("bundles Geist Mono without putting it on the first-paint preload path", () => {
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

    expect(source).toContain(
      'src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2"',
    );
    expect(source).toContain('variable: "--font-geist-mono"');
    expect(source).toContain("preload: false");
    expect(source).toContain("geistMono.variable");
    expect(globalStyles).toMatch(
      /--font-mono:\s*var\(--font-geist-mono\),\s*monospace;/,
    );
    expect(globalStyles).not.toMatch(/--font-geist-mono:\s*ui-monospace/);
  });

  it("keeps the public homepage shell off the Geist Mono request path", () => {
    const shellFiles = [
      "src/components/nav.tsx",
      "src/components/i18n/language-switch.tsx",
      "src/components/auth/auth-status.tsx",
      "src/components/footer.tsx",
      "src/components/home/hero.tsx",
      "src/components/home/hero-network.tsx",
      "src/components/home/offering.tsx",
      "src/components/home/workflow.tsx",
      "src/components/home/credibility-strip.tsx",
    ];
    const shellSource = shellFiles
      .map((file) => readFileSync(resolve(process.cwd(), file), "utf8"))
      .join("\n");

    expect(shellSource).toContain("font-ui-mono");
    expect(shellSource).not.toMatch(/\bfont-mono\b/);
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
