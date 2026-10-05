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

  it("uses light risograph surfaces without hiding the real article preview", () => {
    expect(styles.index).toContain("--blog-acid");
    expect(styles.index).toContain("--blog-lilac");
    expect(styles.index).toContain("--blog-sky");
    expect(styles.index).toContain("--blog-pink");
    expect(styles.index).not.toMatch(
      /(?:mast__meta|row__art|feed__note)[^{]*\{[^}]*background:\s*var\(--druckertinte\)/s,
    );
    expect(styles.index).not.toMatch(/\.row__art\s*\{[^}]*display:\s*none/s);
  });
});

describe("blog index risograph surfaces", () => {
  const backgrounds = [
    ...styles.index.matchAll(/background(?:-color)?:\s*([^;]+);/g),
  ].map((match) => match[1]!.trim());

  it("never paints a black or near-black surface", () => {
    expect(backgrounds.length).toBeGreaterThan(0);
    for (const value of backgrounds) {
      expect(value).not.toMatch(
        /--druckertinte|--bg-dark|--card-dark|--border-dark|graphit|--color-foreground|\bblack\b|#0{3,6}\b/i,
      );
      for (const hex of value.match(/#[0-9a-f]{6}\b/gi) ?? []) {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
        // Every fill is paper, a pastel or a brand ink: none darker than
        // mid-grey.
        expect(Math.max(r!, g!, b!), hex).toBeGreaterThan(128);
      }
    }
  });

  it("fills its surfaces from the paper and pastel tokens", () => {
    const allowed =
      /^(?:var\(--blog-(?:paper|acid|lilac|sky|pink|cobalt)\)|var\(--kupfer\)|color-mix\(in srgb, var\(--blog-paper\) \d+%, transparent\)|radial-gradient\([\s\S]*\))$/;
    for (const value of backgrounds) {
      expect(value).toMatch(allowed);
    }
  });

  it("keeps the article sheets on 44px CTA targets with a Mennige focus ring", () => {
    expect(styles.index).toMatch(/\.row__cta\s*\{[^}]*min-height:\s*44px/s);
    expect(styles.index).toMatch(
      /\.row:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--kupfer\)/s,
    );
    expect(styles.index).not.toMatch(/outline:\s*(?:none|0)\b/);
    expect(styles.index).toMatch(
      /\.evidence-card li\s*\{[^}]*min-height:\s*44px/s,
    );
  });

  it("lifts and tilts the sheets on hover only when motion is allowed", () => {
    const withoutMotionQueries = styles.index.replace(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{(?:[^{}]*\{[^}]*\})*\s*\}/g,
      "",
    );
    expect(withoutMotionQueries).not.toMatch(
      /:(?:hover|focus-visible)[^{]*\{[^}]*transform:/s,
    );
    expect(styles.index).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*\.row[^{]*\{[^}]*transition:\s*none/s,
    );
  });

  it("gives the earlier editions their own paper body and pink preview", () => {
    expect(styles.index).toMatch(
      /\.row--earlier \.row__body\s*\{[^}]*background:\s*var\(--blog-paper\)/s,
    );
    expect(styles.index).toMatch(
      /\.row--earlier \.row__art\s*\{[^}]*background-color:\s*var\(--blog-pink\)/s,
    );
    // Mennige on pink is under 4.5:1: the emphasis keeps the ink there.
    expect(styles.index).toMatch(
      /\.row--earlier \.row__art-cap b\s*\{[^}]*color:\s*var\(--druckertinte\)/s,
    );
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
