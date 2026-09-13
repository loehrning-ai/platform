/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AiNativeLesson, AiNativeModule } from "@/lib/ai-native/types";

const harness = vi.hoisted(() => ({
  completedBefore: new Set<string>(),
  persisted: true,
  record: vi.fn(),
  trackCourseStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
  trackLessonReached: vi.fn(),
}));

vi.mock("@/lib/analytics/events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analytics/events")>()),
  trackCourseStarted: harness.trackCourseStarted,
  trackLessonCompleted: harness.trackLessonCompleted,
  trackLessonReached: harness.trackLessonReached,
}));

vi.mock("@/lib/progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/progress")>()),
  getEvidenceBackedCompletedLessonIds: () => harness.completedBefore,
  recordLessonCompletionEvidenceDurably: (...args: unknown[]) => {
    harness.record(...args);
    return harness.persisted;
  },
}));

vi.mock("@/components/widgets/registry", () => ({
  RenderWidget: () => null,
  resolveWidgetsForSlot: () => [],
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_ONLY_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileInView",
    "viewport",
    "layout",
  ]);
  const cache = new Map<string, React.ElementType>();
  const make = (tag: string): React.ElementType => {
    if (!cache.has(tag)) {
      cache.set(
        tag,
        React.forwardRef(function MotionMock(props: any, ref: any) {
          const rest: Record<string, unknown> = {};
          for (const key in props) {
            if (key !== "children" && !MOTION_ONLY_PROPS.has(key)) {
              rest[key] = props[key];
            }
          }
          return React.createElement(tag, { ...rest, ref }, props.children);
        }),
      );
    }
    return cache.get(tag)!;
  };
  const m = new Proxy(
    {},
    { get: (_t, prop) => (typeof prop === "string" ? make(prop) : undefined) },
  );
  const Passthrough = ({ children }: any) =>
    React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: Passthrough,
    MotionConfig: Passthrough,
    LazyMotion: Passthrough,
    domAnimation: {},
    useReducedMotion: () => true,
  };
});

import { AiNativeLessonReader } from "./lesson-reader";
import {
  __resetCacheForTests,
  activateAnonymousProgress,
} from "@/lib/progress/store";

const MODULE: AiNativeModule = {
  id: "modul_1",
  number: 1,
  title: "Modul",
  subtitle: "Untertitel",
  description: "Beschreibung",
  durationMinutes: 10,
  lessonCount: 2,
  premiumGated: false,
  topics: [],
};

const LESSON: AiNativeLesson = {
  id: "modul_1_lesson_2",
  moduleId: "modul_1",
  number: 2,
  title: "Transferlektion",
  subtitle: "Ziel",
  durationMinutes: 10,
  sections: [],
  quiz: [],
  keyConcepts: [],
};

const DECISION = "I will review every agent output before it ships";

function renderAndCommit() {
  render(
    <AiNativeLessonReader
      module={MODULE}
      lesson={LESSON}
      prevLesson={null}
      nextLesson={null}
      allModuleLessonIds={["modul_1_lesson_1", "modul_1_lesson_2"]}
      locale="en"
    />,
  );
  fireEvent.change(screen.getByLabelText("Decision or revision"), {
    target: { value: DECISION },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save checkpoint" }));
}

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
  activateAnonymousProgress();
  harness.completedBefore = new Set();
  harness.persisted = true;
  harness.record.mockClear();
  harness.trackCourseStarted.mockClear();
  harness.trackLessonCompleted.mockClear();
  harness.trackLessonReached.mockClear();
});

afterEach(() => {
  cleanup();
  __resetCacheForTests();
});

describe("<AiNativeLessonReader> usage events", () => {
  it("reports the persisted lesson and the first course start, never the prose", () => {
    renderAndCommit();

    expect(harness.record).toHaveBeenCalledWith("ai-native", LESSON.id);
    expect(harness.trackLessonCompleted.mock.calls).toEqual([
      ["ai-native", "l02"],
    ]);
    expect(harness.trackCourseStarted.mock.calls).toEqual([["ai-native"]]);
    expect(harness.trackLessonReached).not.toHaveBeenCalled();
    expect(
      JSON.stringify([
        harness.trackLessonCompleted.mock.calls,
        harness.trackCourseStarted.mock.calls,
      ]),
    ).not.toContain(DECISION);
  });

  it("does not report a course start when earlier progress exists", () => {
    harness.completedBefore = new Set(["modul_1_lesson_1"]);
    renderAndCommit();

    expect(harness.trackLessonCompleted.mock.calls).toEqual([
      ["ai-native", "l02"],
    ]);
    expect(harness.trackCourseStarted).not.toHaveBeenCalled();
  });

  it("does not report a repeat completion of the same lesson", () => {
    harness.completedBefore = new Set([LESSON.id]);
    renderAndCommit();

    expect(harness.trackLessonCompleted).not.toHaveBeenCalled();
    expect(harness.trackCourseStarted).not.toHaveBeenCalled();
  });

  it("reports nothing when the completion is not persisted", () => {
    harness.persisted = false;
    renderAndCommit();

    expect(harness.record).toHaveBeenCalledTimes(1);
    expect(harness.trackLessonCompleted).not.toHaveBeenCalled();
    expect(harness.trackCourseStarted).not.toHaveBeenCalled();
  });
});
