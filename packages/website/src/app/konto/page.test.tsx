import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  isEvidenceGatedCourseSlug,
  lessonCompletionEvidenceCheckpointId,
} from "@/lib/courses/completion";
import type { CourseSlug } from "@/lib/course/types";
import type {
  UnifiedCourseSlice,
  UnifiedLessonProgress,
  UnifiedProgress,
} from "@/lib/progress/types";
import { checkpointKey } from "@/lib/progress/types";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createAuthServerClient: vi.fn(),
  fetchUnifiedProgressForUser: vi.fn(),
  reportApiError: vi.fn(),
  redirect: vi.fn(),
  getRequestLocale: vi.fn(),
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
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: mocks.getRequestLocale,
}));

import KontoPage, { generateMetadata } from "./page";

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
      CANONICAL_LESSON_IDS[slug].slice(0, completedCount).map((lessonId) => [
        lessonId,
        isEvidenceGatedCourseSlug(slug)
          ? {
              ...COMPLETED_LESSON,
              sectionsRead: CANONICAL_SECTION_IDS[slug][lessonId] ?? [],
              quizScore:
                slug === "data-engineering-fundamentals" ||
                slug === "data-science"
                  ? null
                  : 1,
              quizTotal:
                slug === "data-engineering-fundamentals" ||
                slug === "data-science"
                  ? null
                  : 1,
            }
          : COMPLETED_LESSON,
      ]),
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

function progress(courses: UnifiedProgress["courses"]): UnifiedProgress {
  const checkpoints = Object.fromEntries(
    Object.entries(courses).flatMap(([slug, slice]) => {
      const courseSlug = slug as CourseSlug;
      if (!slice || !isEvidenceGatedCourseSlug(courseSlug)) return [];
      return Object.entries(slice.lessons)
        .filter(([, lesson]) => lesson.completed)
        .map(([lessonId]) => [
          checkpointKey(
            lessonId,
            lessonCompletionEvidenceCheckpointId(courseSlug),
          ),
          true,
        ]);
    }),
  );
  return {
    schemaVersion: 3,
    courses,
    xp: 0,
    checkpoints,
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
  mocks.getRequestLocale.mockResolvedValue("de");
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
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

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
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    render(await KontoPage());

    expect(
      within(courseCard("Codex-Kurs")).getByRole("link", {
        name: /Nachweis ansehen/,
      }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/kurs/zertifikat");
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
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    render(await KontoPage());

    const continuation = screen.getByText("Weiter lernen").closest("div.group");
    expect(continuation).not.toBeNull();
    expect(
      within(continuation as HTMLElement).getByText("EU AI Act Kurs"),
    ).toBeInTheDocument();
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
      screen.queryByRole("heading", { name: "Behandelte Lernergebnisse" }),
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

  it("renders an outage instead of signing the learner out when auth itself fails", async () => {
    // {configured:true, user:null, error} is an auth-backend outage, not a
    // logged-out visitor: it differs from the anonymous case only by `error`.
    // Redirecting on it would bounce a signed-in learner to /login.
    const authError = new Error("supabase auth 503");
    mocks.getAuthenticatedUser.mockResolvedValue({
      configured: true,
      user: null,
      error: authError,
    });

    render(await KontoPage());

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.reportApiError).toHaveBeenCalledWith({
      route: "/konto",
      step: "auth-get-user",
      error: authError,
    });
    expect(
      screen.getByText("Anmeldestatus ist gerade nicht abrufbar."),
    ).toBeInTheDocument();
    // The page must not claim the visitor is browsing without an account, and
    // must not offer a sign-out it cannot honour.
    expect(document.body).not.toHaveTextContent("lokaler Zugriff ohne Konto");
    expect(
      screen.queryByRole("button", { name: /Abmelden/ }),
    ).not.toBeInTheDocument();
  });

  it("renders reviewed English account copy, course data, links, and metadata", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");

    render(await KontoPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Your learning record." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Courses completed")).toBeInTheDocument();
    expect(screen.getByText("Course outcomes covered")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Covered course outcomes" }),
    ).toBeVisible();
    expect(document.body).not.toHaveTextContent(/competenc(?:y|ies) earned/i);
    expect(screen.getAllByText("AI Fundamentals").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Start" })[0]).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/en\//),
    );
    expect(
      screen.getByRole("link", { name: "Privacy and data controls" }),
    ).toHaveAttribute("href", "/en/konto/datenschutz");
    expect(
      screen.getByRole("navigation", { name: "Account privacy" }),
    ).toBeVisible();
    expect(document.body).toHaveTextContent(
      "Historical activity data remains in exports for compatibility",
    );
    expect(document.body).not.toHaveTextContent(/\bXP\b|streak|badge/i);
    expect(document.body).not.toHaveTextContent("Deine Kurse");

    const metadata = await generateMetadata();
    expect(metadata.title).toBe("Account | Free learning platform");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.alternates).toEqual({ canonical: null });
  });
});
