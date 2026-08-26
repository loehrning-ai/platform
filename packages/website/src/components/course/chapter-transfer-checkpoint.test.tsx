import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
