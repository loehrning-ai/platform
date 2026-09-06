import { afterEach, describe, expect, it } from "vitest";
import { MCP_SEARCH_MAX_QUERY_LENGTH } from "./config";
import { resetSearchIndex, searchEntries, searchIndexFor, tokenize } from "./search-index";
import { searchContent } from "./tools/search";

afterEach(() => resetSearchIndex());

describe("lazy search index", () => {
  it("builds once per locale and reuses the same array", () => {
    const first = searchIndexFor("de");
    const second = searchIndexFor("de");
    expect(second).toBe(first);
    expect(searchIndexFor("en")).not.toBe(first);
    expect(first.length).toBeGreaterThan(20);
  });

  it("indexes every public content kind", () => {
    const kinds = new Set(searchIndexFor("de").map((entry) => entry.kind));
    expect(kinds.has("course")).toBe(true);
    expect(kinds.has("lesson")).toBe(true);
    expect(kinds.has("workshop")).toBe(true);
    expect(kinds.has("book")).toBe(true);
    expect(kinds.has("open_source")).toBe(true);
  });

  it("tokenizes unicode words and drops one-character noise", () => {
    expect(tokenize("Datenschutz  &  KI")).toEqual(["datenschutz", "ki"]);
    expect(tokenize("Prüfschritte für Führungskräfte")).toEqual([
      "prüfschritte",
      "für",
      "führungskräfte",
    ]);
    expect(tokenize("a b c")).toEqual([]);
    expect(tokenize("!!! ??? ---")).toEqual([]);
  });

  it("requires every token to match", () => {
    const hits = searchEntries("de", "Datenschutz Zeppelinfabrik", 10);
    expect(hits).toEqual([]);
  });

  it("ranks a title match above a body-only match", () => {
    const hits = searchEntries("de", "Workshop", 10);
    if (hits.length > 1) {
      expect(hits[0]!.score).toBeGreaterThanOrEqual(hits[1]!.score);
    }
    expect(hits.length).toBeGreaterThan(0);
  });

  it("honours the result limit", () => {
    expect(searchEntries("de", "KI", 3).length).toBeLessThanOrEqual(3);
  });
});

describe("search_content", () => {
  it("answers an empty query with a stated reason and no results", () => {
    const empty = searchContent("   ", "de");
    expect(empty.count).toBe(0);
    expect(empty.results).toEqual([]);
    expect(String(empty.note)).toContain("no searchable word");
  });

  it("answers a punctuation-only query the same way", () => {
    expect(searchContent("?!.", "de").count).toBe(0);
  });

  it("survives a maximum-length unicode query", () => {
    const query = "ü".repeat(MCP_SEARCH_MAX_QUERY_LENGTH);
    const result = searchContent(query, "de");
    expect(result.count).toBe(0);
    expect(String(result.note)).toContain("matches");
  });

  it("clamps an out-of-range limit into the allowed window", () => {
    expect(searchContent("KI", "de", 0).results.length).toBeLessThanOrEqual(1);
    expect(searchContent("KI", "de", 9_999).results.length).toBeLessThanOrEqual(
      25,
    );
  });

  it("searches the English index when asked", () => {
    const result = searchContent("course", "en", 5);
    expect(result.locale).toBe("en");
    for (const hit of result.results) {
      expect(hit.url).toContain("loehrning.ai");
    }
  });
});
