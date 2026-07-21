import { describe, it, expect } from "vitest";
import { DS_CHAPTER_IDS } from "./types";
import { getDsChapterComponent, __resetDsChapterCacheForTests } from "./chapters";

const POPULATED_IDS = [
  "home",
  "fund",
  "explore",
  "clean",
  "feature",
  "model",
  "eval",
  "interp",
  "exp",
  "causal",
  "peek",
] as const;
const UNPOPULATED_IDS = DS_CHAPTER_IDS.filter(
  (id) => !(POPULATED_IDS as readonly string[]).includes(id),
);

describe("data-science chapter-component loader map (plan 012 stages 1, 6, 7, 8, 9, 10)", () => {
  it("resolves a real component for every populated id (fund, eval — stage 6; home, explore, clean — stage 7; feature, model — stage 8; interp, exp — stage 9; causal, peek — stage 10)", async () => {
    __resetDsChapterCacheForTests();
    for (const id of POPULATED_IDS) {
      const Component = await getDsChapterComponent(id);
      expect(Component).toBeDefined();
      expect(typeof Component).toBe("function");
    }
  });

  it("resolves no chapter component yet for any id not populated so far — later stages populate the rest", async () => {
    __resetDsChapterCacheForTests();
    for (const id of UNPOPULATED_IDS) {
      expect(await getDsChapterComponent(id)).toBeUndefined();
    }
  });

  it("memoizes: a second lookup for the same id returns the same component reference", async () => {
    __resetDsChapterCacheForTests();
    const first = await getDsChapterComponent("fund");
    const second = await getDsChapterComponent("fund");
    expect(first).toBe(second);
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
