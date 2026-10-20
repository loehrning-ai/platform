import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { FigureLoadError, isPreRescan, loadBookFigures } from "./book-figures";
import { figureCsv, findPrivacyFindings, parseFigureSpec, resolveToken, resolveTokensDeep, tokenKeys } from "@/lib/figures";

const ROOT = resolve(__dirname, "..", "..");
const BOOK = "ki-landschaft";
const FIGURES = join(ROOT, "content", "books", BOOK, "figures");
const DATA = join(ROOT, "public", "books", BOOK, "data");

/** What scripts/export-book-data.mjs writes: one CSV per figure JSON, plain UTF-8. */
function bookCsvFiles(): { name: string; content: string }[] {
  return readdirSync(FIGURES)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const spec = parseFigureSpec(JSON.parse(readFileSync(join(FIGURES, name), "utf8")));
      return { name: `${spec.id}.csv`, content: figureCsv(spec) };
    });
}

describe("the figure files of the data book", () => {
  it("load, validate and pass the engine's privacy gate", async () => {
    const figures = await loadBookFigures(BOOK);
    // The insight spine (figures-mapping-v1.json) plus the v0 files that stay on disk until
    // `build_v1.py --publish --retire` moves them to figures/_retired-v0/ (their islands are still registered).
    const mapping = JSON.parse(readFileSync(join(FIGURES, "..", "figures-mapping-v1.json"), "utf8")) as { v1: Record<string, unknown> };
    const legacy = ["c1", "c10", "c10-bars", "c11", "c12", "c14", "c2", "c4", "c5", "c6", "c7", "c8", "c9"];
    expect([...figures.specs.keys()].sort()).toEqual([...new Set([...Object.keys(mapping.v1), ...legacy])].sort());
    for (const spec of figures.specs.values()) {
      expect(findPrivacyFindings(spec)).toEqual([]);
    }
  });

  it("carry the method version of this edition and are no longer flagged as provisional", async () => {
    const figures = await loadBookFigures(BOOK);
    for (const spec of figures.specs.values()) {
      expect(spec.meta?.methodVersion).toMatch(/^v1-/);
      expect(spec.meta?.frozenOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isPreRescan(spec)).toBe(false);
    }
  });

  it("hold only JSON specs and a copy folder (render-figures reads every *.json here as a spec)", () => {
    const entries = readdirSync(FIGURES, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) expect(entry.name).toBe("copy");
      else expect(entry.name).toMatch(/^[a-z0-9-]+\.json$/);
    }
  });

  it("offer only tokens that resolve, and no token name is both a value and an alias", async () => {
    const figures = await loadBookFigures(BOOK);
    for (const spec of figures.specs.values()) {
      for (const key of tokenKeys(spec)) {
        expect(() => resolveToken(spec, key), `${spec.id}.${key}`).not.toThrow();
      }
      const values = Object.keys(spec.meta?.values ?? {});
      for (const alias of Object.keys(spec.meta?.aliases ?? {})) {
        expect(values, `${spec.id}.${alias}`).not.toContain(alias);
      }
    }
  });

  it("restate chart numbers by reference, so they follow the chart", async () => {
    const figures = await loadBookFigures(BOOK);
    const c4 = figures.specs.get("c4");
    expect(c4?.meta?.values?.["weighted_share"]?.ref).toBe("weighted_total");
    expect(resolveToken(c4!, "weighted_share")).toBe(resolveToken(c4!, "weighted_total"));
  });

  it("keep the copy files free of retired wording, dashes and unresolved tokens", async () => {
    const figures = await loadBookFigures(BOOK);
    expect(figures.copy.size).toBeGreaterThan(0);
    for (const [id, raw] of figures.copy) {
      const resolved = resolveTokensDeep(raw, figures.lookup);
      const text = JSON.stringify(resolved);
      expect(text, id).not.toMatch(/\{\{[^}]*\}\}/);
      expect(text, id).not.toMatch(/[–—]/);
      expect(findPrivacyFindings(resolved), id).toEqual([]);
    }
  });
});

describe("the CSV downloads of the plotted aggregates", () => {
  it("exist for every figure, match the figure data byte for byte, and no other file is there", async () => {
    const expected = bookCsvFiles();
    expect(expected.length).toBeGreaterThan(0);
    const present = readdirSync(DATA).sort();
    expect(present).toEqual(expected.map((f) => f.name).sort());
    for (const file of expected) {
      expect(readFileSync(join(DATA, file.name), "utf8"), file.name).toBe(file.content);
      expect(file.content.charCodeAt(0)).not.toBe(0xfeff);
    }
  });

  it("hold aggregates only: no count of 1 to 4 as a number, no names, no URLs", () => {
    for (const name of readdirSync(DATA)) {
      const text = readFileSync(join(DATA, name), "utf8");
      expect(text, name).not.toMatch(/https?:\/\/|@|\/Users\//);
      expect(text, name).not.toMatch(/[–—]/);
    }
  });
});

describe("loadBookFigures on a broken folder", () => {
  const root = mkdtempSync(join(tmpdir(), "book-figures-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const goodSpec = {
    id: "t1",
    kind: "bars",
    title: "T",
    alt: "A",
    caption: "C",
    n: 100,
    source: "S",
    asOf: "2026-10-18",
    limitation: "L",
    data: { fmt: { style: "percent", digits: 1 }, items: [{ id: "a", label: "A", value: 10, n: 50 }] },
  };

  function put(book: string, name: string, body: unknown): void {
    const dir = join(root, "content", "books", book, "figures");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), JSON.stringify(body));
  }

  it("returns an empty set for a book without figures", async () => {
    const figures = await loadBookFigures("none", root);
    expect(figures.specs.size).toBe(0);
    expect(figures.lookup("c4")).toBeUndefined();
  });

  it("loads a good file case-insensitively", async () => {
    put("good", "t1.json", goodSpec);
    const figures = await loadBookFigures("good", root);
    expect(figures.lookup("T1")?.id).toBe("t1");
  });

  it("fails the build for a count of 1 to 4", async () => {
    put("small", "t1.json", { ...goodSpec, data: { ...goodSpec.data, items: [{ id: "a", label: "A", value: 10, n: 3 }] } });
    await expect(loadBookFigures("small", root)).rejects.toThrow(FigureLoadError);
    await expect(loadBookFigures("small", root)).rejects.toThrow(/privacy gate/);
  });

  it("fails for a URL in a caption, a wrong file name and a broken spec", async () => {
    put("url", "t1.json", { ...goodSpec, caption: "siehe https://example.org" });
    await expect(loadBookFigures("url", root)).rejects.toThrow(/URL/);
    put("name", "other.json", goodSpec);
    await expect(loadBookFigures("name", root)).rejects.toThrow(/file name/);
    put("broken", "t1.json", { id: "t1" });
    await expect(loadBookFigures("broken", root)).rejects.toThrow(FigureLoadError);
  });

  it("rejects a book slug that is not a slug", async () => {
    await expect(loadBookFigures("../etc", root)).rejects.toThrow(/Invalid book slug/);
  });
});
