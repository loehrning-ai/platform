import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type { CourseSlug } from "@/lib/course/types";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createAuthServerClient: vi.fn(),
  fetchUnifiedProgressForUser: vi.fn(),
  reportApiError: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/lib/supabase/auth-server", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
  createAuthServerClient: mocks.createAuthServerClient,
}));
vi.mock("@/lib/progress/server-store", () => ({
  fetchUnifiedProgressForUser: mocks.fetchUnifiedProgressForUser,
}));
vi.mock("@/lib/observability/api-error", () => ({
  reportApiError: mocks.reportApiError,
}));

import KontoPage from "./page";

const USER = {
  id: "learner-1",
  email: "learner@example.com",
};
const AUTH_CLIENT = { kind: "auth-client" };
const REDIRECT = new Error("NEXT_REDIRECT");
const COMPLETED_LESSON: UnifiedLessonProgress = {
  sectionsRead: [],
  quizScore: null,
  quizTotal: null,
  completed: true,
  exercisesCompleted: {},
};

function courseSlice(
  slug: CourseSlug,
  completedCount: number,
  lastActivity: string,
  assessmentPassed = false,
): UnifiedCourseSlice {
  return {
    lessons: Object.fromEntries(
      CANONICAL_LESSON_IDS[slug]
        .slice(0, completedCount)
        .map((lessonId) => [lessonId, COMPLETED_LESSON]),
    ),
    workshopQuiz: {
      passed: assessmentPassed,
      score: assessmentPassed ? 0.9 : 0,
      completedAt: assessmentPassed ? lastActivity : null,
    },
    capstoneSubmitted: false,
    startedAt: "2026-07-29T08:00:00.000Z",
    lastActivity,
  };
}

function progress(
  courses: UnifiedProgress["courses"],
): UnifiedProgress {
  return {
    schemaVersion: 3,
    courses,
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-07-29T12:00:00.000Z",
  };
}

function successfulFetch(state: UnifiedProgress | null) {
  return {
    ok: true as const,
    result: {
      progress: state,
      updatedAt: state?.lastActivity ?? null,
      courseResetAt: {},
      rawRows: [],
    },
  };
}

function courseCard(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title });
  const card = heading.closest("div.group");
  expect(card, `course card for ${title}`).not.toBeNull();
  return card as HTMLElement;
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.getAuthenticatedUser.mockResolvedValue({
    configured: true,
    user: USER,
  });
  mocks.createAuthServerClient.mockResolvedValue(AUTH_CLIENT);
  mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(null));
  mocks.redirect.mockImplementation(() => {
    throw REDIRECT;
  });
});

describe("KontoPage course resume integration", () => {
  it("links a partially completed course to its first incomplete lesson", async () => {
    const state = progress({
      "eu-ai-act-kurs": courseSlice(
        "eu-ai-act-kurs",
        5,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(
      successfulFetch(state),
    );

    render(await KontoPage());

    expect(
      within(courseCard("EU AI Act Kurs")).getByRole("link", {
        name: /Weiterlernen/,
      }),
    ).toHaveAttribute(
      "href",
      "/eu-ai-act-kurs/kurs/block_2#lesson=block_2_lesson_2",
    );
  });

  it("links an earned course record to the real certificate route", async () => {
    const state = progress({
      codex: courseSlice(
        "codex",
        CANONICAL_LESSON_IDS.codex.length,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(
      successfulFetch(state),
    );

    render(await KontoPage());

    expect(
      within(courseCard("Codex Course")).getByRole("link", {
        name: /Nachweis ansehen/,
      }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/codex/kurs/zertifikat",
    );
  });

  it("chooses the most recently active incomplete course for the primary continuation", async () => {
    const state = progress({
      "ki-fuehrerschein": courseSlice(
        "ki-fuehrerschein",
        1,
        "2026-07-29T09:00:00.000Z",
      ),
      "eu-ai-act-kurs": courseSlice(
        "eu-ai-act-kurs",
        5,
        "2026-07-29T12:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(
      successfulFetch(state),
    );

    render(await KontoPage());

    const continuation = screen.getByText("Weiter lernen").closest("div.group");
    expect(continuation).not.toBeNull();
    expect(within(continuation as HTMLElement).getByText("EU AI Act Kurs"))
      .toBeInTheDocument();
    expect(
      within(continuation as HTMLElement).getByRole("link", {
        name: "Weiterlernen",
      }),
    ).toHaveAttribute(
      "href",
      "/eu-ai-act-kurs/kurs/block_2#lesson=block_2_lesson_2",
    );
  });

  it("isolates an unavailable progress fetch instead of rendering false zero progress", async () => {
    mocks.fetchUnifiedProgressForUser.mockResolvedValue({
      ok: false,
      error: new Error("database unavailable"),
    });

    render(await KontoPage());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dein Lernstand ist gerade nicht erreichbar.",
    );
    expect(screen.queryByText("Kurse abgeschlossen")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Deine Kurse" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Deine Kompetenzen" }),
    ).not.toBeInTheDocument();
    expect(mocks.fetchUnifiedProgressForUser).toHaveBeenCalledWith(
      AUTH_CLIENT,
      USER.id,
    );
  });

  it("redirects an unauthenticated configured deployment before reading progress", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
    });

    await expect(KontoPage()).rejects.toBe(REDIRECT);

    expect(mocks.redirect).toHaveBeenCalledWith("/login?next=/konto");
    expect(mocks.createAuthServerClient).not.toHaveBeenCalled();
    expect(mocks.fetchUnifiedProgressForUser).not.toHaveBeenCalled();
  });
});
