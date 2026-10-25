/**
 * The template registry: every entry points at files that exist, every public
 * name is a safe URL segment, and a requested name resolves only to a
 * registered file, never to a path of the caller's choosing.
 */

import { existsSync, readFileSync } from "node:fs";
import { readZipEntry } from "@/lib/zip/read";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_NAME_PATTERN,
  VORLAGEN,
  downloadPathFor,
  vorlagenOfKind,
  findByDownloadName,
  loadQuestionSheet,
  readVorlageSource,
  vorlagenContentRoot,
} from "./registry";

const LOCALES = ["de", "en"] as const;

describe("VORLAGEN", () => {
  it("publishes exactly one question sheet, the one on AI in apprenticeship training", () => {
    expect(vorlagenOfKind("question-sheet").map((entry) => entry.slug)).toEqual([
      "ki-in-der-ausbildung-fragen",
    ]);
  });

  it("gives every entry a kind, and every template a demo page as host", () => {
    for (const entry of VORLAGEN) {
      expect(["question-sheet", "template"]).toContain(entry.kind);
      if (entry.kind !== "template") {
        expect(entry.inKit, entry.slug).toBeUndefined();
        continue;
      }
      expect(entry.hostPaths.de, entry.slug).toMatch(/^\/demos\/[a-z0-9-]+$/);
    }
  });

  it("keeps a template that also ships in a kit byte-identical to the kit copy", () => {
    for (const entry of vorlagenOfKind("template")) {
      if (!entry.inKit) continue;
      const zip = new Uint8Array(readFileSync(path.join(process.cwd(), "public", entry.inKit.zip)));
      for (const locale of LOCALES) {
        const kitPath = entry.inKit.paths[locale];
        if (!kitPath) continue;
        const inKit = readZipEntry(zip, kitPath);
        expect(inKit, `${entry.inKit.zip}: ${kitPath}`).not.toBeNull();
        const authored = readFileSync(path.join(vorlagenContentRoot(), entry.files[locale]));
        expect(Buffer.from(inKit as Uint8Array).equals(authored), `${entry.slug} (${locale})`).toBe(true);
      }
    }
  });

  it("uses unique download names that match the public pattern", () => {
    const names = VORLAGEN.flatMap((entry) => LOCALES.map((locale) => entry.downloadNames[locale]));
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(DOWNLOAD_NAME_PATTERN);
    for (const entry of VORLAGEN) {
      expect(entry.downloadNames.de).not.toMatch(/\.en\.(?:md|csv)$/);
      expect(entry.downloadNames.en).toMatch(/\.en\.(?:md|csv)$/);
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
    for (const entry of vorlagenOfKind("question-sheet")) {
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
