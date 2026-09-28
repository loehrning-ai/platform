/**
 * The template registry: every entry points at files that exist, every public
 * name is a safe URL segment, and a requested name resolves only to a
 * registered file, never to a path of the caller's choosing.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_NAME_PATTERN,
  VORLAGEN,
  downloadPathFor,
  findByDownloadName,
  loadQuestionSheet,
  readVorlageSource,
  vorlagenContentRoot,
} from "./registry";

const LOCALES = ["de", "en"] as const;

describe("VORLAGEN", () => {
  it("publishes exactly the question sheet on AI in apprenticeship training", () => {
    expect(VORLAGEN.map((entry) => entry.slug)).toEqual(["ki-in-der-ausbildung-fragen"]);
  });

  it("uses unique download names that match the public pattern", () => {
    const names = VORLAGEN.flatMap((entry) => LOCALES.map((locale) => entry.downloadNames[locale]));
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(DOWNLOAD_NAME_PATTERN);
    for (const entry of VORLAGEN) {
      expect(entry.downloadNames.de.endsWith(".en.md")).toBe(false);
      expect(entry.downloadNames.en.endsWith(".en.md")).toBe(true);
    }
  });

  it("points at files that exist under content/vorlagen", () => {
    const root = vorlagenContentRoot();
    expect(root).toBe(path.join(process.cwd(), "content", "vorlagen"));
    for (const entry of VORLAGEN) {
      for (const locale of LOCALES) {
        const file = path.join(root, entry.files[locale]);
        expect(path.relative(root, file).startsWith(".."), file).toBe(false);
        expect(existsSync(file), file).toBe(true);
      }
      // English sources live under en/ so the voice linter reads them as English.
      expect(entry.files.en.startsWith("en/")).toBe(true);
      expect(entry.files.de.includes("/")).toBe(false);
    }
  });

  it("names host pages in the matching locale space", () => {
    for (const entry of VORLAGEN) {
      expect(entry.hostPaths.de.startsWith("/en/")).toBe(false);
      expect(entry.hostPaths.en).toBe(`/en${entry.hostPaths.de}`);
    }
  });
});

describe("download paths", () => {
  it("round-trips every download name", () => {
    for (const entry of VORLAGEN) {
      for (const locale of LOCALES) {
        const name = entry.downloadNames[locale];
        expect(findByDownloadName(name)).toEqual({ entry, locale });
        expect(downloadPathFor(entry.slug, locale)).toBe(`/vorlagen/${name}`);
      }
    }
  });

  it("never localizes the download path", () => {
    for (const entry of VORLAGEN) {
      for (const locale of LOCALES) {
        expect(downloadPathFor(entry.slug, locale)).not.toContain("/en/");
      }
    }
    expect(downloadPathFor("ki-in-der-ausbildung-fragen", "en")).toBe(
      "/vorlagen/ki-in-der-ausbildung-fragen.en.md",
    );
  });

  it.each([
    "",
    "x.md",
    "ki-in-der-ausbildung-fragen",
    "ki-in-der-ausbildung-fragen.de.md",
    "KI-in-der-ausbildung-fragen.md",
    "../ki-in-der-ausbildung-fragen.md",
    "en/ki-in-der-ausbildung-fragen.md",
    "..%2Fpackage.json",
    "../../package.json",
    "ki-in-der-ausbildung-fragen.md/",
    "ki-in-der-ausbildung-fragen.md\n",
  ])("resolves %j to nothing", (name) => {
    expect(findByDownloadName(name)).toBeNull();
  });

  it("refuses an unknown slug", () => {
    expect(() => downloadPathFor("does-not-exist", "de")).toThrow(/unknown Vorlage/);
  });
});

describe("reading and parsing", () => {
  it("returns the authored bytes unchanged", async () => {
    for (const entry of VORLAGEN) {
      for (const locale of LOCALES) {
        const expected = readFileSync(path.join(vorlagenContentRoot(), entry.files[locale]), "utf8");
        await expect(readVorlageSource(entry.slug, locale)).resolves.toBe(expected);
      }
    }
  });

  it("parses each sheet for the page that hosts it", async () => {
    for (const entry of VORLAGEN) {
      for (const locale of LOCALES) {
        const sheet = await loadQuestionSheet(entry.slug, locale);
        expect(sheet.meta.locale).toBe(locale);
        expect(sheet.meta.hostPath).toBe(entry.hostPaths[locale]);
        // Cached: the same promise answers the second call.
        expect(loadQuestionSheet(entry.slug, locale)).toBe(loadQuestionSheet(entry.slug, locale));
      }
    }
  });

  it("rejects an unknown slug", async () => {
    await expect(readVorlageSource("does-not-exist", "de")).rejects.toThrow(/unknown Vorlage/);
    await expect(loadQuestionSheet("does-not-exist", "de")).rejects.toThrow(/unknown Vorlage/);
  });
});
