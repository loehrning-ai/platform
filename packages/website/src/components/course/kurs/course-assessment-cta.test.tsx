import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
} from "@testing-library/react";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type { CourseSlug } from "@/lib/course/types";
import type {
  UnifiedProgress,
  UnifiedCourseSlice,
} from "@/lib/progress/types";

type Owner = {
  readonly kind: "unknown" | "anonymous";
  readonly generation: number;
};

const harness = vi.hoisted(() => ({
  owner: { kind: "unknown", generation: 0 } as Owner,
  ownerListener: null as ((owner: Owner) => void) | null,
  progressListener: null as ((progress: UnifiedProgress) => void) | null,
}));

vi.mock("@/lib/progress/browser-learning-storage", () => ({
  getLearningOwnerContext: () => harness.owner,
  subscribeLearningOwner: (listener: (owner: Owner) => void) => {
    harness.ownerListener = listener;
    return () => {
      harness.ownerListener = null;
    };
  },
}));

vi.mock("@/lib/progress/store", () => ({
  subscribe: (listener: (progress: UnifiedProgress) => void) => {
    harness.progressListener = listener;
    return () => {
      harness.progressListener = null;
    };
  },
}));

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef } = await import("react");
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
  ]);
  const MotionSection = forwardRef<HTMLElement, Record<string, unknown>>(
    (props, ref) => {
      const cleanProps: Record<string, unknown> = {};
      for (const key in props) {
        if (!DROP.has(key)) cleanProps[key] = props[key];
      }
      return createElement("section", { ...cleanProps, ref });
    },
  );
  return { m: { section: MotionSection } };
});

import { AiNativeQuizCertCta } from "@/components/ai-native/kurs/quiz-cert-cta";
import { CourseAssessmentCta } from "./course-assessment-cta";

function courseSlice(
  courseSlug: CourseSlug,
  completedLessons: number,
  quizPassed: boolean,
  capstoneSubmitted = false,
): UnifiedCourseSlice {
  const now = "2026-07-29T10:00:00.000Z";
  const lessons = Object.fromEntries(
    CANONICAL_LESSON_IDS[courseSlug]
      .slice(0, completedLessons)
      .map((lessonId) => [
        lessonId,
        {
          sectionsRead: [],
          quizScore: null,
          quizTotal: null,
          completed: true,
          exercisesCompleted: {},
        },
      ]),
  );
  return {
    lessons,
    workshopQuiz: {
      passed: quizPassed,
      score: quizPassed ? 0.9 : 0,
      completedAt: quizPassed ? now : null,
    },
    capstoneSubmitted,
    startedAt: now,
    lastActivity: now,
  };
}

function progressFor(
  courseSlug: CourseSlug,
  completedLessons: number,
  quizPassed = false,
  capstoneSubmitted = false,
): UnifiedProgress {
  return {
    schemaVersion: 3,
    courses: {
      [courseSlug]: courseSlice(
        courseSlug,
        completedLessons,
        quizPassed,
        capstoneSubmitted,
      ),
    },
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-07-29T10:00:00.000Z",
  };
}

function resolveOwner(): void {
  act(() => {
    harness.owner = {
      kind: "anonymous",
      generation: harness.owner.generation + 1,
    };
    harness.ownerListener?.(harness.owner);
  });
}

function emitProgress(progress: UnifiedProgress): void {
  act(() => {
    harness.progressListener?.(progress);
  });
}

beforeEach(() => {
  harness.owner = { kind: "unknown", generation: 0 };
  harness.ownerListener = null;
  harness.progressListener = null;
});

afterEach(cleanup);

describe("<CourseAssessmentCta>", () => {
  it("keeps owner-unknown progress unresolved and exposes no premature route", () => {
    render(<CourseAssessmentCta courseSlug="claude" />);

    emitProgress(progressFor("claude", 0));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking course progress…",
    );
    expect(screen.getByRole("region")).toHaveAttribute(
      "data-assessment-state",
      "loading",
    );
    expect(
      document.querySelector(
        'a[href="/kurse/open-source/claude/kurs/quiz"]',
      ),
    ).toBeNull();
    expect(
      document.querySelector(
        'a[href="/kurse/open-source/claude/kurs/zertifikat"]',
      ),
    ).toBeNull();
  });

  it("keeps incomplete and corrupt passed-bit states locked with exact requirements", () => {
    render(<CourseAssessmentCta courseSlug="claude" />);
    resolveOwner();

    emitProgress(progressFor("claude", 11, true));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Complete all 12 lessons to unlock the workshop quiz. 1 lesson remaining.",
    );
    expect(screen.getByText("11 of 12 lessons complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quiz locked" }),
    ).toBeDisabled();
    expect(
      document.querySelector(
        'a[href="/kurse/open-source/claude/kurs/quiz"]',
      ),
    ).toBeNull();
    expect(
      document.querySelector(
        'a[href="/kurse/open-source/claude/kurs/zertifikat"]',
      ),
    ).toBeNull();
  });

  it("updates Claude from ready to passed without remounting", () => {
    render(<CourseAssessmentCta courseSlug="claude" />);
    resolveOwner();

    emitProgress(progressFor("claude", 12));

    expect(screen.getByRole("status")).toHaveTextContent(
      "All 12 lessons are complete.",
    );
    expect(
      screen.getByRole("link", { name: "Start workshop quiz" }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/claude/kurs/quiz",
    );
    expect(
      screen.queryByRole("link", {
        name: "Download Certificate of Completion",
      }),
    ).not.toBeInTheDocument();

    emitProgress(progressFor("claude", 12, true));

    expect(screen.getByRole("status")).toHaveTextContent("Passed.");
    expect(
      screen.getByRole("link", { name: "Retake quiz" }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/claude/kurs/quiz",
    );
    expect(
      screen.getByRole("link", {
        name: "Download Certificate of Completion",
      }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/claude/kurs/zertifikat",
    );
  });

  it("uses the Operator configuration, isolated progress slice, and exact routes", () => {
    render(<CourseAssessmentCta courseSlug="ai-native-operator" />);
    resolveOwner();

    emitProgress(
      progressFor("claude", CANONICAL_LESSON_IDS.claude.length, true),
    );
    expect(screen.getByText("Quiz locked")).toBeInTheDocument();
    expect(screen.getByText("0 of 39 lessons complete")).toBeInTheDocument();

    emitProgress(progressFor("ai-native-operator", 39));

    expect(
      screen.getByText("22 questions · 70% to pass · 28 minutes"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start workshop quiz" }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/ai-native-operator/quiz",
    );

    emitProgress(progressFor("ai-native-operator", 39, true));
    expect(
      screen.getByRole("link", {
        name: "Download Certificate of Completion",
      }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/ai-native-operator/zertifikat",
    );
  });

  it("keeps the German AI-Native capstone alternative and localized actions", () => {
    render(<AiNativeQuizCertCta />);
    resolveOwner();

    emitProgress(progressFor("ai-native", 26));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Schließe alle 27 Lektionen ab",
    );
    expect(screen.getByText("Quiz gesperrt")).toBeInTheDocument();
    expect(
      document.querySelector('a[href="/ai-native/kurs/quiz"]'),
    ).toBeNull();

    emitProgress(progressFor("ai-native", 27, false, true));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Capstone-Rubrik",
    );
    expect(
      screen.getByRole("link", { name: "Workshop-Quiz starten" }),
    ).toHaveAttribute("href", "/ai-native/kurs/quiz");
    expect(
      screen.getByRole("link", {
        name: "Teilnahmebestätigung herunterladen",
      }),
    ).toHaveAttribute("href", "/ai-native/kurs/zertifikat");

    emitProgress(progressFor("ai-native", 27, true));
    expect(
      screen.getByRole("link", { name: "Quiz wiederholen" }),
    ).toBeInTheDocument();
  });
});
