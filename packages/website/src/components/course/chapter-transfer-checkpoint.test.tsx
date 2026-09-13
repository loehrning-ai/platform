import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usageEvents = vi.hoisted(() => ({
  trackCourseStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
  trackLessonReached: vi.fn(),
}));

vi.mock("@/lib/analytics/events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analytics/events")>()),
  ...usageEvents,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    recordLessonCompletionEvidenceDurably: vi.fn(
      actual.recordLessonCompletionEvidenceDurably,
    ),
  };
});
import { DEF_CHAPTER_IDS } from "@/lib/data-engineering-fundamentals/types";
import { DS_NUMBERED_CHAPTER_IDS } from "@/lib/data-science/types";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import {
  __resetCacheForTests,
  completeCheckpoint,
  getCompletedLessonsCount,
  getUnifiedState,
  isCertificateEligible,
  isEvidenceBackedLessonCompleted,
  markLessonCompleted,
  recordLessonCompletionEvidenceDurably,
} from "@/lib/progress";
import {
  activateUnknownProgress,
  continueWithAnonymousProgress,
} from "@/lib/progress/store";
import { checkpointKey } from "@/lib/progress/types";
import { ChapterTransferCheckpoint } from "./chapter-transfer-checkpoint";

const CASES = [
  {
    label: "Data Engineering",
    courseSlug: "data-engineering-fundamentals",
    chapterId: "fund",
    allChapterIds: DEF_CHAPTER_IDS,
    decision: "I will test the late-data boundary before release",
  },
  {
    label: "Data Science",
    courseSlug: "data-science",
    chapterId: "fund",
    allChapterIds: DS_NUMBERED_CHAPTER_IDS,
    decision: "I will challenge the metric with a counterexample",
  },
] as const;

describe("ChapterTransferCheckpoint", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetCacheForTests();
  });

  afterEach(() => {
    cleanup();
    __resetCacheForTests();
  });

  it.each(CASES)(
    "$label rejects clicks and filler, then records meaningful ephemeral evidence",
    ({ courseSlug, chapterId, decision }) => {
      render(
        <ChapterTransferCheckpoint
          courseSlug={courseSlug}
          chapterId={chapterId}
          locale="en"
        />,
      );

      const input = screen.getByLabelText("Decision or revision");
      const save = screen.getByRole("button", { name: "Save checkpoint" });
      expect(save).toBeDisabled();
      fireEvent.click(save);
      expect(isEvidenceBackedLessonCompleted(courseSlug, chapterId)).toBe(
        false,
      );

      fireEvent.change(input, { target: { value: "I will test" } });
      expect(save).toBeDisabled();
      expect(isEvidenceBackedLessonCompleted(courseSlug, chapterId)).toBe(
        false,
      );

      fireEvent.change(input, { target: { value: "blah blah blah blah" } });
      expect(save).toBeDisabled();
      expect(isEvidenceBackedLessonCompleted(courseSlug, chapterId)).toBe(
        false,
      );

      fireEvent.change(input, { target: { value: decision } });
      expect(
        screen.getByText(/response is not saved or synced/i),
      ).toBeVisible();
      expect(screen.getByText(/not mastery or certification/i)).toBeVisible();
      fireEvent.click(save);

      expect(isEvidenceBackedLessonCompleted(courseSlug, chapterId)).toBe(true);
      expect(screen.getByText("Navigation checkpoint saved")).toBeVisible();
      expect(
        screen.getByText(/not a mastery assessment or credential/i),
      ).toBeVisible();
      expect(JSON.stringify(getUnifiedState())).not.toContain(decision);
    },
  );

  it.each(CASES)(
    "$label hides historical raw booleans from progress and certificate state",
    ({ courseSlug, chapterId, allChapterIds }) => {
      for (const id of allChapterIds) {
        markLessonCompleted(courseSlug, id);
      }

      expect(getCompletedLessonsCount(courseSlug)).toBe(0);
      expect(isCertificateEligible(courseSlug)).toBe(false);
      render(
        <ChapterTransferCheckpoint
          courseSlug={courseSlug}
          chapterId={chapterId}
          locale="en"
        />,
      );
      expect(screen.getByText("Transfer checkpoint")).toBeVisible();
      expect(screen.queryByText("Navigation checkpoint saved")).toBeNull();
    },
  );

  it.each(CASES)(
    "$label counts only current versioned checkpoints toward the completion record",
    ({ courseSlug, allChapterIds }) => {
      const checkpointId = lessonCompletionEvidenceCheckpointId(courseSlug);
      for (const id of allChapterIds) {
        markLessonCompleted(courseSlug, id);
        completeCheckpoint(id, checkpointId);
        expect(
          getUnifiedState().checkpoints[checkpointKey(id, checkpointId)],
        ).toBe(true);
      }

      expect(getCompletedLessonsCount(courseSlug)).toBe(allChapterIds.length);
      expect(isCertificateEligible(courseSlug)).toBe(true);
    },
  );

  it.each(CASES)(
    "$label fails closed until the learning owner is resolved",
    ({ courseSlug, chapterId }) => {
      activateUnknownProgress();
      render(
        <ChapterTransferCheckpoint
          courseSlug={courseSlug}
          chapterId={chapterId}
          locale="en"
        />,
      );

      expect(screen.getByLabelText("Decision or revision")).toBeDisabled();
      expect(
        screen.getByText("Choose account or local progress above first."),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Save checkpoint" }),
      ).toBeDisabled();
      expect(window.localStorage.getItem("loehrning-progress-v2")).toBeNull();

      act(() => continueWithAnonymousProgress());
      expect(screen.getByLabelText("Decision or revision")).toBeEnabled();
    },
  );

  it.each(CASES)(
    "$label drops ephemeral prose at an owner boundary",
    ({ courseSlug, chapterId, decision }) => {
      render(
        <ChapterTransferCheckpoint
          courseSlug={courseSlug}
          chapterId={chapterId}
          locale="en"
        />,
      );
      const input = screen.getByLabelText("Decision or revision");
      fireEvent.change(input, { target: { value: decision } });
      expect(input).toHaveValue(decision);

      act(() => activateUnknownProgress());
      expect(screen.getByLabelText("Decision or revision")).toBeDisabled();
      expect(screen.getByLabelText("Decision or revision")).toHaveValue("");

      act(() => continueWithAnonymousProgress());
      expect(screen.getByLabelText("Decision or revision")).toBeEnabled();
      expect(screen.getByLabelText("Decision or revision")).toHaveValue("");
    },
  );

  it("clears completed UI and draft text when chapter identity changes", () => {
    const { rerender } = render(
      <ChapterTransferCheckpoint
        courseSlug="data-science"
        chapterId="fund"
        locale="en"
      />,
    );
    fireEvent.change(screen.getByLabelText("Decision or revision"), {
      target: { value: "I will test one baseline against one counterexample" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save checkpoint" }));
    expect(isEvidenceBackedLessonCompleted("data-science", "fund")).toBe(true);

    rerender(
      <ChapterTransferCheckpoint
        courseSlug="data-science"
        chapterId="explore"
        locale="en"
      />,
    );
    expect(isEvidenceBackedLessonCompleted("data-science", "explore")).toBe(
      false,
    );
    expect(screen.getByLabelText("Decision or revision")).toHaveValue("");
  });
});

describe("ChapterTransferCheckpoint usage events", () => {
  const ordinalOf = (ids: readonly string[], id: string) =>
    `l${String(ids.indexOf(id) + 1).padStart(2, "0")}`;

  beforeEach(() => {
    window.localStorage.clear();
    __resetCacheForTests();
    usageEvents.trackCourseStarted.mockClear();
    usageEvents.trackLessonCompleted.mockClear();
    usageEvents.trackLessonReached.mockClear();
    vi.mocked(recordLessonCompletionEvidenceDurably).mockClear();
  });

  afterEach(() => {
    cleanup();
    __resetCacheForTests();
  });

  function commit(decision: string) {
    fireEvent.change(screen.getByLabelText("Decision or revision"), {
      target: { value: decision },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save checkpoint" }));
  }

  it.each(CASES)(
    "$label reports the persisted chapter and the course start, never the prose",
    ({ courseSlug, chapterId, allChapterIds, decision }) => {
      render(
        <ChapterTransferCheckpoint
          courseSlug={courseSlug}
          chapterId={chapterId}
          locale="en"
        />,
      );
      commit(decision);

      expect(usageEvents.trackLessonCompleted.mock.calls).toEqual([
        [courseSlug, ordinalOf(allChapterIds, chapterId)],
      ]);
      expect(usageEvents.trackCourseStarted.mock.calls).toEqual([
        [courseSlug],
      ]);
      expect(usageEvents.trackLessonReached).not.toHaveBeenCalled();
      const payload = JSON.stringify([
        usageEvents.trackLessonCompleted.mock.calls,
        usageEvents.trackCourseStarted.mock.calls,
      ]);
      expect(payload).not.toContain(decision);
    },
  );

  it("reports the course start only for the first persisted chapter", () => {
    const { rerender } = render(
      <ChapterTransferCheckpoint
        courseSlug="data-science"
        chapterId="fund"
        locale="en"
      />,
    );
    commit("I will test one baseline against one counterexample");

    rerender(
      <ChapterTransferCheckpoint
        courseSlug="data-science"
        chapterId="explore"
        locale="en"
      />,
    );
    commit("I will plot the distribution before trusting the mean");

    expect(usageEvents.trackLessonCompleted.mock.calls).toEqual([
      ["data-science", "l01"],
      ["data-science", "l02"],
    ]);
    expect(usageEvents.trackCourseStarted.mock.calls).toEqual([
      ["data-science"],
    ]);
  });

  it("reports nothing when the completion is not persisted", () => {
    vi.mocked(recordLessonCompletionEvidenceDurably).mockReturnValueOnce(false);
    render(
      <ChapterTransferCheckpoint
        courseSlug="data-science"
        chapterId="fund"
        locale="en"
      />,
    );
    commit("I will challenge the metric with a counterexample");

    expect(recordLessonCompletionEvidenceDurably).toHaveBeenCalledTimes(1);
    expect(usageEvents.trackLessonCompleted).not.toHaveBeenCalled();
    expect(usageEvents.trackCourseStarted).not.toHaveBeenCalled();
  });
});
