import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The static materials of Workshops 01, 02 and 04 share one frame stylesheet
// ("Werkzeichnung", the Workshop 03 deck language). Source of truth:
// scripts/workshops/workshop-frame.css; each folder ships a byte-identical copy
// in lib/ (node scripts/workshops/sync-frame.mjs). These checks keep the copies in
// sync and keep the brutalist/risograph look from creeping back.

const repoRoot = resolve(__dirname, "../../../..");
const publicWorkshops = resolve(__dirname, "../../public/workshops");
const frameSource = join(repoRoot, "scripts/workshops/workshop-frame.css");

/** Folders restyled onto the frame. */
const FRAME_WORKSHOPS = [
  "ki-prognosen-einschaetzen",
  "geschaeftsberichte-mit-ki-lesen",
  "esg-berichte-mit-ki",
] as const;

/** Material pages that must link the frame (the W02 deck keeps its own deck.css). */
const FRAME_PAGES: Record<(typeof FRAME_WORKSHOPS)[number], string[]> = {
  "ki-prognosen-einschaetzen": [
    "hub.html",
    "hands-on.html",
    "case-study/index.html",
    "field-card.html",
    "homework.html",
  ],
  "geschaeftsberichte-mit-ki-lesen": [],
  "esg-berichte-mit-ki": [
    "guide.html",
    "demo.html",
    "field-card.html",
    "transfer.html",
  ],
};

function textFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return textFiles(path);
    return /\.(html|css|js)$/.test(entry.name) ? [path] : [];
  });
}

describe("workshop frame stylesheet", () => {
  const source = readFileSync(frameSource);

  it("ships a byte-identical copy of scripts/workshops/workshop-frame.css in every restyled folder", () => {
    for (const slug of FRAME_WORKSHOPS) {
      const copy = join(publicWorkshops, slug, "lib/workshop-frame.css");
      // One read, no stat first: a missing copy reads as null.
      let bytes: Buffer | null;
      try {
        bytes = readFileSync(copy);
      } catch {
        bytes = null;
      }
      expect(bytes, `${slug}: lib/workshop-frame.css missing`).not.toBeNull();
      expect(
        bytes!.equals(source),
        `${slug}: lib/workshop-frame.css drifted; run node scripts/workshops/sync-frame.mjs`,
      ).toBe(true);
    }
  });

  it("keeps the strip slim on phones: brand and back link on one row, materials as one rail", () => {
    const css = source.toString("utf8");
    const phone = css.slice(css.indexOf("@media (max-width:600px){"));
    expect(phone).toMatch(/\.wf-strip\{display:grid;grid-template-columns:auto minmax\(0,1fr\)/);
    expect(phone).toMatch(/\.wf-mats\{grid-column:1 \/ -1\}/);
    // 44px targets stay: the language link keeps its width, the rail keeps its height.
    expect(phone).toMatch(/\.wf-back-alt\{[^}]*min-width:44px/);
    expect(phone).toMatch(/\.wf-mats a\{min-height:44px/);
    expect(css).toMatch(/@media \(max-width:374px\)\{\.wf-brand\{min-width:44px\}/);
  });

  it("keeps the current material tab clear of the rail's edge fade on phones", () => {
    const css = source.toString("utf8");
    // The fade is 32px; the strip script scrolls the current tab to 48px, and snapping keeps it there.
    expect(css).toMatch(/\.wf-mats\[data-more="l"\]\{[^}]*transparent,#000 32px/);
    expect(css).toMatch(/\.wf-mats\{[^}]*scroll-padding-inline:48px/);
    const scripts = [
      ...FRAME_PAGES["ki-prognosen-einschaetzen"].map((page) =>
        join(publicWorkshops, "ki-prognosen-einschaetzen", page),
      ),
      join(publicWorkshops, "esg-berichte-mit-ki/lib/w04-pages.js"),
      ...["guide.html", "demo.html", "builder.html"].map((page) =>
        join(publicWorkshops, "datenbereitschaft-fuer-ki", page),
      ),
    ];
    for (const file of scripts) {
      const text = readFileSync(file, "utf8");
      const offsets = [
        ...text.matchAll(/c\.offsetLeft\s*-\s*n\.offsetLeft\s*-\s*(\d+)/g),
      ].map((match) => Number(match[1]));
      expect(offsets, relative(publicWorkshops, file)).toEqual([48]);
    }
    // Phones: short tab names where a page offers them, and a 32px gap above the footer.
    const phone = css.slice(css.indexOf("@media (max-width:600px){"));
    expect(phone).toMatch(/\.wf-mats a \.wf-long\{display:none\}\.wf-mats a \.wf-short\{display:inline\}/);
    expect(phone).toMatch(/\.wf-foot\{margin-top:32px\}/);
  });

  it("uses no url() except data: URIs, so every copy resolves in every folder", () => {
    const urls = [
      ...source.toString("utf8").matchAll(/url\(\s*["']?([^"')]+)/g),
    ].map((match) => match[1]);
    expect(urls.filter((url) => !url.startsWith("data:"))).toEqual([]);
  });

  it("is linked by every material page", () => {
    for (const slug of FRAME_WORKSHOPS) {
      for (const page of FRAME_PAGES[slug]) {
        const html = readFileSync(join(publicWorkshops, slug, page), "utf8");
        expect(html, `${slug}/${page}`).toMatch(
          /<link rel="stylesheet" href="(?:\.\.\/|\.\/)?lib\/workshop-frame\.css" ?\/?>/,
        );
      }
    }
  });
});

describe("restyled workshop materials keep the Werkzeichnung look", () => {
  const files = FRAME_WORKSHOPS.flatMap((slug) =>
    textFiles(join(publicWorkshops, slug)),
  );
  const read = (file: string) => ({
    name: relative(publicWorkshops, file),
    text: readFileSync(file, "utf8"),
  });

  it("covers the static materials of both workshops", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("has no offset (stamp) box-shadows", () => {
    const offenders = files
      .map(read)
      .flatMap(({ name, text }) =>
        [
          ...text.matchAll(
            /box-shadow\s*:\s*(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)\s+0(?:px)?\b/g,
          ),
        ]
          .filter((match) => match[1] !== "0px" || match[2] !== "0px")
          .map((match) => `${name}: ${match[0]}`),
      );
    expect(offenders).toEqual([]);
  });

  it("has no dot or graph-paper page backgrounds", () => {
    const patterns = [
      /radial-gradient\(\s*circle at 1px 1px/,
      /linear-gradient\(\s*90deg\s*,\s*rgba\([^)]*\)\s+1px\s*,\s*transparent\s+1px\s*\)/,
    ];
    const offenders = files
      .map(read)
      .filter(({ text }) => patterns.some((pattern) => pattern.test(text)))
      .map(({ name }) => name);
    expect(offenders).toEqual([]);
  });

  it("drops the old blue and navy themes and the never-loaded Space Mono", () => {
    const banned =
      /#0b66e4|#245cff|#0866ff|#0f2333|#081826|#0e2436|Space Mono/i;
    const offenders = files
      .map(read)
      .filter(({ text }) => banned.test(text))
      .map(({ name, text }) => `${name}: ${text.match(banned)?.[0]}`);
    expect(offenders).toEqual([]);
  });

  it("keeps the W01 lab card from clipping on 900px-tall laptops", () => {
    const skin = readFileSync(
      join(publicWorkshops, "ki-prognosen-einschaetzen/lib/hands-on-frame.css"),
      "utf8",
    );
    expect(skin).toContain("@media (min-width:901px) and (max-height:980px)");
  });
});
