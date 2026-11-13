import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { FOLDER_FILES, KIT_TEXT, KIT_ZIP_NAME, KIT_ZIP_NAME_DE, kitText } from "./kit";

const KIT_DIR = join(__dirname, "../../../../../../scripts/workshop05/kit");
const KIT_DIR_DE = join(__dirname, "../../../../../../scripts/workshop05/kit-de");

function walk(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name !== ".DS_Store")
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

describe("W05 kit lockstep", () => {
  it("kit.ts holds every kit file byte for byte, except the start files", () => {
    const en = walk(KIT_DIR).map((path) => relative(KIT_DIR, path)).filter((file) => file !== "START-HERE.md");
    const de = walk(KIT_DIR_DE).map((path) => relative(KIT_DIR_DE, path)).filter((file) => file !== "START-HIER.md");
    // 39 besides the start file, extras/ included (keep-watch/, de: bereit-bleiben/, added five files in REDESIGN-3 D5)
    expect(en).toHaveLength(39);
    expect(de).toHaveLength(39);
    expect(Object.keys(KIT_TEXT).sort()).toEqual([...en, ...de.map((file) => `de/${file}`)].sort());
    for (const file of Object.keys(KIT_TEXT)) {
      const source = file.startsWith("de/") ? join(KIT_DIR_DE, file.slice(3)) : join(KIT_DIR, file);
      expect(KIT_TEXT[file], file).toBe(readFileSync(source, "utf8"));
    }
  });

  it("names the two zips of the kit", () => {
    expect(KIT_ZIP_NAME).toBe("gradba-audit-kit.zip");
    expect(KIT_ZIP_NAME_DE).toBe("gradba-audit-kit-de.zip");
  });

  it("has fourteen folder files, each readable through kitText", () => {
    expect(FOLDER_FILES).toHaveLength(14);
    for (const file of FOLDER_FILES) expect(kitText(`folder/${file}`).length, file).toBeGreaterThan(0);
  });

  it("the folder files of the German edition are the same CSV bytes", () => {
    for (const file of FOLDER_FILES.filter((name) => name.endsWith(".csv"))) {
      expect(kitText(`de/ordner/${file}`), file).toBe(kitText(`folder/${file}`));
    }
  });

  it("throws for a path the kit does not hold", () => {
    expect(() => kitText("START-HERE.md")).toThrow("not in the kit");
    expect(() => kitText("folder/nope.csv")).toThrow("not in the kit");
  });
});
