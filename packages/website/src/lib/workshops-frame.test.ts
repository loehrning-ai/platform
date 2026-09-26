import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The static materials of Workshops 01 and 02 share one frame stylesheet
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
      expect(
        statSync(copy).isFile(),
        `${slug}: lib/workshop-frame.css missing`,
      ).toBe(true);
      expect(
        readFileSync(copy).equals(source),
        `${slug}: lib/workshop-frame.css drifted; run node scripts/workshops/sync-frame.mjs`,
      ).toBe(true);
    }
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
          /<link rel="stylesheet" href="(?:\.\.\/|\.\/)?lib\/workshop-frame\.css" \/>/,
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
