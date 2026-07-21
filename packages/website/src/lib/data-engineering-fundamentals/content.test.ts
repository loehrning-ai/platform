import { describe, it, expect } from "vitest";
import { DEF_CHAPTER_IDS } from "./types";
import { getDefChapterComponent, __resetDefChapterCacheForTests } from "./content";

describe("data-engineering-fundamentals content loader map (plan 011 stage 1)", () => {
  it("resolves no chapter component yet for any id — stage 9 populates the loader map", async () => {
    __resetDefChapterCacheForTests();
    for (const id of DEF_CHAPTER_IDS) {
      expect(await getDefChapterComponent(id)).toBeUndefined();
    }
  });

  it("returns undefined for an id outside the known set instead of throwing", async () => {
    // @ts-expect-error — exercising the not-found branch with an invalid id
    expect(await getDefChapterComponent("does-not-exist")).toBeUndefined();
  });
});
