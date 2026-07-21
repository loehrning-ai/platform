import { describe, it, expect } from "vitest";
import { DEF_CHAPTER_IDS } from "./types";
import {
  getDefChapterComponent,
  getAllDefChapterComponents,
  __resetDefChapterCacheForTests,
} from "./content";

describe("data-engineering-fundamentals content loader map (plan 011 stage 9)", () => {
  it("resolves a real component for every one of the 12 chapter ids", async () => {
    __resetDefChapterCacheForTests();
    for (const id of DEF_CHAPTER_IDS) {
      const Component = await getDefChapterComponent(id);
      expect(Component).toBeDefined();
      expect(typeof Component).toBe("function");
    }
  });

  it("memoizes: a second lookup for the same id returns the same component reference", async () => {
    __resetDefChapterCacheForTests();
    const first = await getDefChapterComponent("fund");
    const second = await getDefChapterComponent("fund");
    expect(first).toBe(second);
  });

  it("returns undefined for an id outside the known set instead of throwing", async () => {
    // @ts-expect-error — exercising the not-found branch with an invalid id
    expect(await getDefChapterComponent("does-not-exist")).toBeUndefined();
  });

  it("getAllDefChapterComponents resolves all 12 chapters keyed by id", async () => {
    __resetDefChapterCacheForTests();
    const all = await getAllDefChapterComponents();
    expect(all.size).toBe(12);
    for (const id of DEF_CHAPTER_IDS) {
      expect(all.has(id)).toBe(true);
    }
  });
});
