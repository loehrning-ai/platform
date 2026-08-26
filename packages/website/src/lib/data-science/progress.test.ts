import { afterEach, describe, expect, it } from "vitest";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import {
  completeCheckpoint,
  getCourseSlice,
  markLessonCompleted,
} from "@/lib/progress/store";
import { DS_NUMBERED_CHAPTER_IDS, type DsNumberedChapterId } from "./types";
import {
  isChapterVisited,
  getVisitedChapterIds,
  getVisitedChapterCount,
  getOverallProgress,
  resetProgress,
  __resetCacheForTests,
} from "./progress";

const COURSE = "data-science" as const;
const CHECKPOINT_ID = lessonCompletionEvidenceCheckpointId(COURSE);

function recordTransfer(chapterId: DsNumberedChapterId): void {
  completeCheckpoint(chapterId, CHECKPOINT_ID);
  markLessonCompleted(COURSE, chapterId);
}

describe("data-science evidence-backed progress facade", () => {
  afterEach(() => {
    resetProgress();
    __resetCacheForTests();
  });

  it("starts without evidence-backed chapter progress", () => {
    __resetCacheForTests();
    for (const id of DS_NUMBERED_CHAPTER_IDS) {
      expect(isChapterVisited(id)).toBe(false);
    }
    expect(getVisitedChapterCount()).toBe(0);
    expect(getVisitedChapterIds().size).toBe(0);
  });

  it("does not expose a historical raw completion boolean", () => {
    markLessonCompleted(COURSE, "fund");
    expect(getCourseSlice(COURSE).lessons.fund?.completed).toBe(true);
    expect(isChapterVisited("fund")).toBe(false);
    expect(getVisitedChapterCount()).toBe(0);
    expect(getOverallProgress()).toBe(0);
  });

  it("counts only chapters with the current versioned transfer checkpoint", () => {
    recordTransfer("fund");
    recordTransfer("cap");

    const ids = getVisitedChapterIds();
    expect(ids).toEqual(new Set(["fund", "cap"]));
    expect(getVisitedChapterCount()).toBe(2);
    expect(isChapterVisited("explore")).toBe(false);
  });

  it("reports evidence-backed progress across all twelve chapters", () => {
    for (const id of DS_NUMBERED_CHAPTER_IDS.slice(0, 6)) {
      recordTransfer(id);
    }
    expect(getOverallProgress()).toBe(50);

    for (const id of DS_NUMBERED_CHAPTER_IDS.slice(6)) {
      recordTransfer(id);
    }
    expect(getOverallProgress()).toBe(100);
    expect(getVisitedChapterCount()).toBe(DS_NUMBERED_CHAPTER_IDS.length);
  });

  it("reset clears both legacy bits and current evidence", () => {
    recordTransfer("fund");
    recordTransfer("explore");
    resetProgress();

    expect(getVisitedChapterCount()).toBe(0);
    expect(isChapterVisited("fund")).toBe(false);
  });
});
