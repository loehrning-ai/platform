import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import {
  createEmptyLessonMissionState,
  getLessonMissionStorageKey,
  serializeLessonMissionState,
  type LessonMissionState,
} from "@/lib/course-projects/lesson-mission-persistence";
import { getLessonMissionProfile } from "@/lib/course-projects/lesson-missions";
import { selectCourseProjectCheckpoints } from "@/lib/course-projects/checkpoint-selector";
import type { RetrievalSuccessLevel } from "@/lib/course-projects/retrieval-schedule";
import { getCourseProjectExecutionReceipt } from "@/lib/course-projects/types";
import type { CourseSlug } from "@/lib/course/types";
import {
  __resetLearningOwnerForTests,
  activateAnonymousLearningOwner,
  setOwnedLocalLearningItem,
  setUnknownLearningOwner,
} from "@/lib/progress/browser-learning-storage";
import { RetrievalQueue } from "./retrieval-queue";

const COURSE = "data-science" as const;
const RESET_AT = "2026-08-01T00:00:00.000Z";
const CHECKPOINT_LESSON_IDS = selectCourseProjectCheckpoints(COURSE).map(
  ({ lessonId }) => lessonId,
);

function scheduledState(
  courseSlug: CourseSlug,
  successLevel: RetrievalSuccessLevel,
  lastAttemptAt: string,
  nextDueAt: string,
): LessonMissionState {
  const profile = getLessonMissionProfile(courseSlug);
  const correct = profile.retrieval.correctId;
  return {
    ...createEmptyLessonMissionState(),
    predictionId: profile.predictionChoices[0].id,
    revealed: true,
    workspaceOpened: true,
    manipulated: true,
    executionReceipt: getCourseProjectExecutionReceipt(courseSlug),
    evidenceId: profile.evidence.correctId,
    revisionId: profile.revision.correctId,
    retrievalId: correct,
    retrievalMastered: true,
    retrievalFirstChoiceId: correct,
    retrievalAttemptCount: successLevel,
    retrievalSuccessLevel: successLevel,
    retrievalLastAttemptAt: lastAttemptAt,
    retrievalNextDueAt: nextDueAt,
    retrievalMisconceptionId: null,
  };
}

function seed(
  lessonId: string,
  successLevel: 1 | 2 | 3,
  lastAttemptAt: string,
  nextDueAt: string,
  resetAt = RESET_AT,
  courseSlug: CourseSlug = COURSE,
): void {
  expect(
    setOwnedLocalLearningItem(
      getLessonMissionStorageKey(courseSlug, lessonId),
      serializeLessonMissionState(
        scheduledState(courseSlug, successLevel, lastAttemptAt, nextDueAt),
        resetAt,
      ),
    ),
  ).toBe(true);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime("2026-08-13T12:00:00.000Z");
  window.localStorage.clear();
  window.sessionStorage.clear();
  __resetLearningOwnerForTests("unknown");
  activateAnonymousLearningOwner();
});

afterEach(() => {
  __resetLearningOwnerForTests("anonymous");
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("RetrievalQueue", () => {
  it("shows the English due count, current due state, and conservative level-1 label", () => {
    const lessonId = CHECKPOINT_LESSON_IDS[0];
    seed(lessonId, 1, "2026-08-12T12:00:00.000Z", "2026-08-13T12:00:00.000Z");

    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={lessonId}
        locale="en"
        resetAt={RESET_AT}
      />,
    );

    expect(screen.getByText("1 review is due")).toBeInTheDocument();
    expect(screen.getByText("Due now · passed once")).toBeInTheDocument();
    expect(screen.queryByText(/spaced mastery/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Go to the lesson mission, then select the Retrieve step.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to current lesson mission" }),
    ).toHaveAttribute("href", "#lesson-mission-control");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses the level-3 spaced-mastery label in German", () => {
    const lessonId = CHECKPOINT_LESSON_IDS[0];
    seed(lessonId, 3, "2026-07-23T12:00:00.000Z", "2026-08-13T12:00:00.000Z");

    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={lessonId}
        locale="de"
        resetAt={RESET_AT}
      />,
    );

    expect(screen.getByText("1 Abruf ist fällig")).toBeInTheDocument();
    expect(
      screen.getByText("Jetzt fällig · verteilte Beherrschung"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zur aktuellen Lektionsmission" }),
    ).toBeInTheDocument();
  });

  it("routes v2 history through fresh Run evidence instead of claiming Retrieve is available", () => {
    const lessonId = CHECKPOINT_LESSON_IDS[0];
    const profile = getLessonMissionProfile(COURSE);
    expect(
      setOwnedLocalLearningItem(
        getLessonMissionStorageKey(COURSE, lessonId),
        JSON.stringify({
          version: 2,
          resetAt: RESET_AT,
          predictionId: profile.predictionChoices[0].id,
          revealed: true,
          workspaceOpened: true,
          manipulated: true,
          evidenceId: profile.evidence.correctId,
          retrievalId: profile.retrieval.correctId,
          revisionId: profile.revision.correctId,
          transferId: null,
          collapsed: false,
        }),
      ),
    ).toBe(true);

    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={lessonId}
        locale="en"
        resetAt={RESET_AT}
      />,
    );

    expect(
      screen.getByText("Fresh evidence required · passed once"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This earlier review has no current Run receipt. Go to the lesson mission and complete Run, Inspect, and Revise again; Retrieve becomes available afterward.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Re-establish lesson mission evidence",
      }),
    ).toHaveAttribute("href", "#lesson-mission-control");
    expect(screen.queryByText("Due now · passed once")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Go to the lesson mission, then select the Retrieve step.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Due on:/)).not.toBeInTheDocument();
  });

  it("reports an established current review as scheduled without a due action", () => {
    const lessonId = CHECKPOINT_LESSON_IDS[0];
    seed(lessonId, 2, "2026-08-13T12:00:00.000Z", "2026-08-20T12:00:00.000Z");

    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={lessonId}
        locale="en"
        resetAt={RESET_AT}
      />,
    );

    expect(screen.getByText("0 reviews are due")).toBeInTheDocument();
    expect(
      screen.getByText("Not due yet · retrieval established"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Go to current lesson mission" }),
    ).not.toBeInTheDocument();
  });

  it("updates only after an explicit bounded refresh, without polling", () => {
    const [currentLessonId, anotherLessonId] = CHECKPOINT_LESSON_IDS;
    seed(
      currentLessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );
    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={currentLessonId}
        locale="en"
        resetAt={RESET_AT}
      />,
    );
    expect(screen.getByText("1 review is due")).toBeInTheDocument();

    seed(
      anotherLessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );
    expect(screen.getByText("1 review is due")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Check due state now" }),
    );
    expect(screen.getByText("2 reviews are due")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Other due lessons" }),
    ).toHaveTextContent(anotherLessonId);
    expect(
      screen.getByRole("link", {
        name: `Open due lesson: ${anotherLessonId}`,
      }),
    ).toHaveAttribute(
      "href",
      `/en/kurse/open-source/data-science/${anotherLessonId}`,
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refreshes same-tab writes when the bounded schedule revision changes", () => {
    const [currentLessonId, anotherLessonId] = CHECKPOINT_LESSON_IDS;
    seed(
      currentLessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );
    const { rerender } = render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={currentLessonId}
        locale="en"
        resetAt={RESET_AT}
        scheduleRevision={0}
      />,
    );
    expect(screen.getByText("1 review is due")).toBeInTheDocument();

    seed(
      anotherLessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );
    rerender(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={currentLessonId}
        locale="en"
        resetAt={RESET_AT}
        scheduleRevision={1}
      />,
    );

    expect(screen.getByText("2 reviews are due")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a native same-document fragment for another due block lesson", () => {
    const courseSlug = "ki-und-gesellschaft" as const;
    const [currentLessonId, anotherLessonId] = selectCourseProjectCheckpoints(
      courseSlug,
    )
      .map(({ lessonId }) => lessonId)
      .filter((lessonId) => lessonId.startsWith("deepfake-"));
    seed(
      currentLessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
      RESET_AT,
      courseSlug,
    );
    seed(
      anotherLessonId,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
      RESET_AT,
      courseSlug,
    );

    render(
      <RetrievalQueue
        courseSlug={courseSlug}
        currentLessonId={currentLessonId}
        locale="de"
        resetAt={RESET_AT}
      />,
    );

    const dueLink = screen.getByRole("link", {
      name: `Fällige Lektion öffnen: ${anotherLessonId}`,
    });
    expect(dueLink).toHaveAttribute(
      "href",
      `/ki-und-gesellschaft/kurs/block_2#lesson=${anotherLessonId}`,
    );
    expect(dueLink.tagName).toBe("A");
    expect(dueLink).toHaveAttribute("data-native-lesson-fragment", "true");
  });

  it("lists every reachable due checkpoint without a dead overflow entry", () => {
    const [currentLessonId, ...otherLessonIds] = CHECKPOINT_LESSON_IDS;
    for (const lessonId of [currentLessonId, ...otherLessonIds]) {
      seed(lessonId, 1, "2026-08-12T12:00:00.000Z", "2026-08-13T12:00:00.000Z");
    }

    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={currentLessonId}
        locale="en"
        resetAt={RESET_AT}
      />,
    );

    expect(screen.getByText("5 reviews are due")).toBeInTheDocument();
    expect(screen.getByText("Other due lessons · 4")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Other due lessons" });
    expect(list.querySelectorAll("li")).toHaveLength(4);
    expect(list).not.toHaveTextContent(/and \d+ more/);
    expect(list.querySelectorAll("a")).toHaveLength(4);
    for (const lessonId of otherLessonIds) {
      expect(
        screen.getByRole("link", { name: `Open due lesson: ${lessonId}` }),
      ).toHaveAttribute(
        "href",
        `/en/kurse/open-source/data-science/${lessonId}`,
      );
    }
  });

  it("does not render a due link for a historical non-checkpoint schedule", () => {
    const checkpointIds = new Set(CHECKPOINT_LESSON_IDS);
    const nonCheckpointLesson = CANONICAL_LESSON_IDS[COURSE].find(
      (lessonId) => !checkpointIds.has(lessonId),
    );
    expect(nonCheckpointLesson).toBeDefined();
    seed(
      CHECKPOINT_LESSON_IDS[0],
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );
    seed(
      nonCheckpointLesson!,
      1,
      "2026-08-12T12:00:00.000Z",
      "2026-08-13T12:00:00.000Z",
    );

    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={CHECKPOINT_LESSON_IDS[0]}
        locale="en"
        resetAt={RESET_AT}
      />,
    );

    expect(screen.getByText("1 review is due")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: `Open due lesson: ${nonCheckpointLesson}`,
      }),
    ).not.toBeInTheDocument();
  });

  it("rechecks owner and reset boundaries without carrying a prior queue", () => {
    const lessonId = CHECKPOINT_LESSON_IDS[0];
    seed(lessonId, 1, "2026-08-12T12:00:00.000Z", "2026-08-13T12:00:00.000Z");
    const { rerender } = render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={lessonId}
        locale="en"
        resetAt={RESET_AT}
      />,
    );
    expect(screen.getByText("1 review is due")).toBeInTheDocument();

    act(() => {
      setUnknownLearningOwner();
    });
    expect(
      screen.getByText(
        "Local learning state is not available for the current identity yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Local mode inactive")).toBeInTheDocument();

    act(() => {
      activateAnonymousLearningOwner();
    });
    expect(screen.getByText("1 review is due")).toBeInTheDocument();

    rerender(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={lessonId}
        locale="en"
        resetAt="2026-08-13T13:00:00.000Z"
      />,
    );
    expect(screen.getByText("0 reviews are due")).toBeInTheDocument();
    expect(screen.getByText(/No retrieval schedule yet/)).toBeInTheDocument();
  });

  it("fails closed while the learning owner is unknown", () => {
    setUnknownLearningOwner();
    render(
      <RetrievalQueue
        courseSlug={COURSE}
        currentLessonId={CHECKPOINT_LESSON_IDS[0]}
        locale="en"
        resetAt={RESET_AT}
      />,
    );

    expect(
      screen.getByText(
        "Local learning state is not available for the current identity yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Local mode inactive")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    const header = document.querySelector("[data-retrieval-queue-header]");
    expect(header).toHaveClass(
      "grid",
      "grid-cols-[auto_minmax(0,1fr)_auto]",
      "sm:flex",
    );
    expect(screen.getByRole("status")).toHaveClass(
      "col-start-2",
      "row-start-2",
      "[overflow-wrap:anywhere]",
    );
    expect(screen.getByRole("button", { name: "Retrieval queue" })).toHaveClass(
      "col-start-3",
      "row-span-2",
    );
  });
});
