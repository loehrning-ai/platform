import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const styles = {
  archive: readFileSync(join(__dirname, "_styles", "blog.css"), "utf8"),
  index: readFileSync(join(__dirname, "_styles", "blog-index.css"), "utf8"),
  post: readFileSync(join(__dirname, "_styles", "post.css"), "utf8"),
} as const;

describe("blog editorial design contract", () => {
  it("keeps visible editorial labels at 12px or larger", () => {
    for (const source of Object.values(styles)) {
      expect(source).not.toMatch(/font-size:\s*(?:[0-9]|1[01])(?:\.[0-9]+)?px/);
    }
  });

  it("uses the compact platform spacing scale instead of landing-page scenes", () => {
    expect(styles.post).not.toContain("min-height:92svh");
    expect(styles.post).not.toMatch(/padding:\s*(?:120|140)px/);
    expect(styles.post).not.toMatch(/margin:\s*(?:60|72|100)px auto/);
    expect(styles.post).not.toContain("gap:80px");
    expect(styles.post).toMatch(/padding:\s*48px clamp\(16px, 4vw, 40px\)/);
  });

  it("keeps article navigation and simulator controls on 44px targets", () => {
    // The railbar pins to the companion shell's header token pair rather than
    // to one fixed offset, so it stays flush under the 48px compact bar below
    // lg and under the 64px band from lg. Both halves are asserted, which is
    // stricter than the single rule this replaced: dropping either one lets
    // article content bleed through the gap again.
    expect(styles.post).toMatch(
      /\.railbar\s*\{[^}]*top:\s*var\(--nav-h-compact\)/s,
    );
    expect(styles.post).toMatch(
      /@media\s*\(min-width:\s*64rem\)\s*\{\s*\.railbar\s*\{[^}]*top:\s*var\(--nav-h\)/s,
    );

    for (const selector of [
      ".railbar__back",
      ".railbar__item",
      ".sim__axis-btn",
      ".sim__slider",
    ]) {
      expect(styles.post).toMatch(
        new RegExp(
          `${selector.replaceAll("_", "\\_")}\\s*\\{[^}]*min-(?:height|block-size):\\s*44px`,
          "s",
        ),
      );
    }

    expect(styles.post).toMatch(
      /\.sim__slider\s*\{[^}]*background:\s*linear-gradient\([^}]*100% 2px\s+no-repeat/s,
    );
  });

  it("styles the index on the Werkzeichnung paper system without risograph surfaces", () => {
    expect(styles.index).not.toMatch(
      /--blog-(?:acid|lilac|sky|pink|cobalt|teal)|brand-(?:acid|peach|sky|pink|cobalt|teal)/,
    );
    expect(styles.index).not.toMatch(/rotate\(/);
    expect(styles.index).not.toMatch(/text-transform:\s*uppercase/);
    expect(styles.index).not.toMatch(/font-style:\s*italic|--font-serif/);
    expect(styles.index).toMatch(
      /\.blog-index__head\s*\{[^}]*border-top:\s*2px solid var\(--bi-ink\)/s,
    );
    expect(styles.index).toMatch(
      /\.blog-index__container\s*\{[^}]*max-width:\s*75rem/s,
    );
    expect(styles.index).toMatch(
      /\.blog-index__link\s*\{[^}]*min-height:\s*44px/s,
    );
  });
});
