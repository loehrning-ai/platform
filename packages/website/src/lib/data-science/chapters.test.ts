import { describe, it, expect } from "vitest";
import { DS_CHAPTER_IDS } from "./types";
import { getDsChapterComponent, __resetDsChapterCacheForTests } from "./chapters";

describe("data-science chapter-component loader map (plan 012 stage 1)", () => {
  it("resolves no chapter component yet for any id — later stages populate the loader map", async () => {
    __resetDsChapterCacheForTests();
    for (const id of DS_CHAPTER_IDS) {
      expect(await getDsChapterComponent(id)).toBeUndefined();
    }
  });

  it("returns undefined for an id outside the known set instead of throwing", async () => {
    // @ts-expect-error — exercising the not-found branch with an invalid id
    expect(await getDsChapterComponent("does-not-exist")).toBeUndefined();
  });

  it("DS_CHAPTER_IDS has exactly 13 unique entries, each a unique route slug", () => {
    expect(DS_CHAPTER_IDS).toHaveLength(13);
    expect(new Set(DS_CHAPTER_IDS).size).toBe(13);
  });
});
