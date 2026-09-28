import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const styles = {
  archive: readFileSync(join(__dirname, "_styles", "blog.css"), "utf8"),
  index: readFileSync(join(__dirname, "_styles", "blog-index.css"), "utf8"),
  post: readFileSync(join(__dirname, "_styles", "post.css"), "utf8"),
} as const;

// Werkzeichnung article stylesheet (post Nº 02 onward), scoped under .post-wz.
const werkzeichnung = readFileSync(
  join(__dirname, "_styles", "post-wz.css"),
  "utf8",
);

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
    // The Kopflinie takes the page's scene line (SPEC §3.7): Kobalt below
    // the IDEA band, Druckschwarz where :has() is missing.
    expect(styles.index).toMatch(
      /\.blog-index__head\s*\{[^}]*border-top:\s*2px solid var\(--bi-line\)/s,
    );
    expect(styles.index).toMatch(
      /--bi-line:\s*var\(--color-scene-line, #121212\)/,
    );
    expect(styles.index).toMatch(
      /\.blog-index__container\s*\{[^}]*max-width:\s*75rem/s,
    );
    expect(styles.index).toMatch(
      /\.blog-index__link\s*\{[^}]*min-height:\s*44px/s,
    );
  });
});

describe("blog index IDEA band (SPEC §2.3, §3.12)", () => {
  it("sets the hero title with the poster-title values and the word fit", () => {
    expect(styles.index).toMatch(
      /\.blog-index__title\s*\{[^}]*font-size:\s*max\(2\.125rem,\s*min\(var\(--text-poster\),\s*calc\(100cqi \/ var\(--fit, 0\.01\)\)\)\)/s,
    );
    expect(styles.index).toMatch(
      /\.blog-index__title\s*\{[^}]*letter-spacing:\s*var\(--text-poster--letter-spacing\)/s,
    );
    expect(styles.index).toMatch(
      /\.blog-index__hero-inner\s*\{[^}]*container-type:\s*inline-size/s,
    );
  });

  it("colours the band from the scene tokens only, with no muted tier", () => {
    const hero = styles.index.match(/\.blog-root \.blog-index__hero\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(hero).toMatch(/--bi-ink:\s*var\(--color-scene-ink\)/);
    expect(hero).toMatch(/--bi-slate:\s*var\(--color-scene-ink\)/);
    expect(hero).toMatch(/--bi-slate-light:\s*var\(--color-scene-ink\)/);
    // No raw hex inside the band rules: the ground and ink come from
    // .plakat-idea in globals.css.
    for (const selector of ["__hero", "__title", "__lead"]) {
      const body =
        styles.index.match(new RegExp(`\\.blog-index${selector}\\s*\\{([^}]*)\\}`, "s"))?.[1] ?? "";
      expect(body, selector).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    }
  });
});

describe("Werkzeichnung article design contract (post-wz.css)", () => {
  it("keeps every screen font size at 12px or larger", () => {
    expect(werkzeichnung).not.toMatch(
      /font-size:\s*(?:[0-9]|1[01])(?:\.[0-9]+)?px/,
    );
  });

  it("uses sentence case, upright roman type and no serif face", () => {
    expect(werkzeichnung).not.toMatch(/text-transform:\s*uppercase/);
    expect(werkzeichnung).not.toMatch(/font-style:\s*italic/);
    expect(werkzeichnung).not.toContain("--font-serif");
  });

  it("keeps square geometry: no radius other than 0", () => {
    const radii = [...werkzeichnung.matchAll(/border-radius:\s*([^;]+);/g)].map(
      (match) => match[1]!.trim(),
    );
    for (const radius of radii) expect(radius).toBe("0");
  });

  it("draws no shadow except the inset paper square of the current Route station", () => {
    const shadows = [
      ...werkzeichnung.matchAll(/([^{}]+)\{[^}]*?box-shadow:\s*([^;]+);/g),
    ].map((match) => ({
      selector: match[1]!.trim(),
      value: match[2]!.trim(),
    }));

    expect(shadows).toHaveLength(1);
    expect(shadows[0]!.selector).toBe(
      '.wz-route__station[data-state="current"] .wz-route__mark',
    );
    for (const layer of shadows[0]!.value.split(/,\s*/)) {
      expect(layer).toMatch(/^inset\s/);
    }
  });

  it("keeps buttons on 44px targets and the sheet, heads and print page in place", () => {
    expect(werkzeichnung).toMatch(/\.wz-btn\s*\{[^}]*min-height:\s*44px/s);
    expect(werkzeichnung).toMatch(
      /\.wz-sheet\s*\{[^}]*border:\s*1px solid var\(--wz-ink\)/s,
    );
    expect(werkzeichnung).toMatch(/@page wz-sheet\s*\{/);
    expect(werkzeichnung).toMatch(
      /\.wz-head\s*\{[^}]*border-top:\s*2px solid var\(--wz-ink\)/s,
    );
  });
});
