import { describe, it, expect, afterEach } from "vitest";
import { DS_NUMBERED_CHAPTER_IDS } from "./types";
import { getCourseSlice } from "@/lib/progress/store";
import {
  markChapterVisited,
  isChapterVisited,
  getVisitedChapterIds,
  getVisitedChapterCount,
  getOverallProgress,
  resetProgress,
  __resetCacheForTests,
} from "./progress";

describe("data-science progress facade ", () => {
  afterEach(() => {
    resetProgress();
    __resetCacheForTests();
  });

  it("starts with no chapter marked visited", () => {
    __resetCacheForTests();
    for (const id of DS_NUMBERED_CHAPTER_IDS) {
      expect(isChapterVisited(id)).toBe(false);
    }
    expect(getVisitedChapterCount()).toBe(0);
    expect(getVisitedChapterIds().size).toBe(0);
  });

  it("markChapterVisited marks exactly the given chapter, idempotently", () => {
    markChapterVisited("fund");
    expect(isChapterVisited("fund")).toBe(true);
    expect(isChapterVisited("explore")).toBe(false);
    expect(getVisitedChapterCount()).toBe(1);

    markChapterVisited("fund");
    expect(getVisitedChapterCount()).toBe(1);
  });

  it("getVisitedChapterIds returns the exact set of marked chapters", () => {
    markChapterVisited("fund");
    markChapterVisited("cap");
    const ids = getVisitedChapterIds();
    expect(ids.size).toBe(2);
    expect(ids.has("fund")).toBe(true);
    expect(ids.has("cap")).toBe(true);
  });

  it("getOverallProgress reports percent complete out of the 12 numbered chapters", () => {
    expect(getOverallProgress()).toBe(0);
    for (const id of DS_NUMBERED_CHAPTER_IDS.slice(0, 6)) {
      markChapterVisited(id);
    }
    expect(getOverallProgress()).toBe(50);
  });

  it("marking every one of the 12 numbered chapters reaches 100% and satisfies the unified store's certificate-eligibility fallback", () => {
    for (const id of DS_NUMBERED_CHAPTER_IDS) {
      markChapterVisited(id);
    }
    expect(getOverallProgress()).toBe(100);
    expect(getVisitedChapterCount()).toBe(12);
  });

  it("writes to the 'data-science' slice of the unified store, not some other course", () => {
    markChapterVisited("fund");
    const slice = getCourseSlice("data-science");
    expect(slice.lessons["fund"]?.completed).toBe(true);
  });

  it("resetProgress clears every visited chapter", () => {
    markChapterVisited("fund");
    markChapterVisited("explore");
    resetProgress();
    expect(getVisitedChapterCount()).toBe(0);
    expect(isChapterVisited("fund")).toBe(false);
  });
});
