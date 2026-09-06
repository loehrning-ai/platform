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

function kontoPage(params: { level?: string; sort?: string } = {}) {
  return KontoPage({ searchParams: Promise.resolve(params) });
}

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

    render(await kontoPage());

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

    render(await kontoPage());

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

    render(await kontoPage());

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

    render(await kontoPage());

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

    await expect(kontoPage()).rejects.toBe(REDIRECT);

    expect(mocks.redirect).toHaveBeenCalledWith("/login?next=/konto");
    expect(mocks.createAuthServerClient).not.toHaveBeenCalled();
    expect(mocks.fetchUnifiedProgressForUser).not.toHaveBeenCalled();
  });

  it("offers persistent navigation to account settings without a landmark collision", async () => {
    // 025 requires account settings to be reachable from navigation. The
    // catalog pushed the privacy link far below the fold, so the section nav
    // carries it at the top of the page. Its accessible name must stay
    // distinct from the privacy landmark, because that one is queried by name
    // as a single match (below, and in the authed e2e suite).
    //
    // Copy lock updated: the account page is a sequence of regions now, so the
    // nav anchors "Konto verwalten" on this page instead of pointing straight
    // at /konto/datenschutz. That route stays one click away from inside the
    // region, asserted below and in the authed e2e suite.
    const state = progress({
      "eu-ai-act-kurs": courseSlice(
        "eu-ai-act-kurs",
        5,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    const { container } = render(await kontoPage());

    const sectionNav = screen.getByRole("navigation", {
      name: "Kontobereiche",
    });
    expect(
      within(sectionNav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "#konto-weiterlernen",
      "#konto-meine-kurse",
      "#konto-werkzeuge",
      "#konto-nachweise",
      "#konto-verwalten",
    ]);
    // Anchors only point at regions that actually rendered.
    for (const link of within(sectionNav).getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      if (!href.startsWith("#")) continue;
      expect(
        container.querySelector(href),
        `${href} must resolve to a rendered section`,
      ).not.toBeNull();
    }
    expect(
      screen.getByRole("link", { name: "Datenschutz und Datenverwaltung" }),
    ).toHaveAttribute("href", "/konto/datenschutz");
    // Still exactly one privacy landmark, so the single-match query holds.
    expect(screen.getAllByRole("navigation", { name: "Kontodatenschutz" })).toHaveLength(1);
  });

  it("drops catalog anchors when the progress region is replaced by the outage alert", async () => {
    mocks.fetchUnifiedProgressForUser.mockResolvedValue({
      ok: false,
      error: new Error("database unavailable"),
    });

    render(await kontoPage());

    const sectionNav = screen.getByRole("navigation", {
      name: "Kontobereiche",
    });
    // Linking to regions that never rendered would strand the learner.
    expect(
      within(sectionNav).queryByRole("link", { name: "Meine Kurse" }),
    ).toBeNull();
    expect(
      within(sectionNav).queryByRole("link", { name: "Teilnahmebestätigungen" }),
    ).toBeNull();
    expect(
      within(sectionNav).getByRole("link", { name: "Weiterlernen" }),
    ).toBeInTheDocument();
    expect(
      within(sectionNav).getByRole("link", { name: "Konto verwalten" }),
    ).toBeInTheDocument();
    // Reference material and the data controls do not depend on the record, so
    // an unreadable record must not take them off the page with it.
    expect(
      screen.getByRole("link", { name: /Lernbücher/ }),
    ).toHaveAttribute("href", "/buecher");
    expect(
      screen.getByRole("link", { name: "Datenschutz und Datenverwaltung" }),
    ).toHaveAttribute("href", "/konto/datenschutz");
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

    render(await kontoPage());

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

    render(await kontoPage());

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

describe("KontoPage catalog", () => {
  it("renders cover art for every course and splits my courses from available", async () => {
    const state = progress({
      codex: courseSlice(
        "codex",
        CANONICAL_LESSON_IDS.codex.length,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    const { container } = render(await kontoPage());

    // All ten courses have cover art (verified against catalog.ts); every
    // course renders somewhere on the page (my courses + available).
    expect(container.querySelectorAll("img").length).toBe(10);

    expect(
      screen.getByRole("heading", { name: "Meine Kurse" }),
    ).toBeInTheDocument();
    expect(
      within(courseCard("Codex-Kurs")).getByText("Nachweis erreicht"),
    ).toBeInTheDocument();

    // A completed course appears once, under "my courses", not a second
    // time under "available".
    expect(screen.getAllByRole("heading", { name: "Codex-Kurs" })).toHaveLength(
      1,
    );
    expect(
      screen.getByRole("heading", { name: "KI-Führerschein" }),
    ).toBeInTheDocument();
  });

  it("omits the my-courses section entirely when nothing has started", async () => {
    render(await kontoPage());

    expect(
      screen.queryByRole("heading", { name: "Meine Kurse" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Weitere Kurse" }),
    ).toBeInTheDocument();
    // All ten courses fall through to "available" with nothing started.
    expect(courseCard("Codex-Kurs")).toBeInTheDocument();
  });

  it("filters the catalog to one level via a real link, not client state", async () => {
    const { container } = render(await kontoPage({ level: "einstieg" }));

    // Only the two einstieg courses remain (ki-fuehrerschein,
    // ki-und-gesellschaft); codex (fortg) drops out.
    expect(screen.queryByText("Codex-Kurs")).not.toBeInTheDocument();
    expect(courseCard("KI-Führerschein")).toBeInTheDocument();
    expect(courseCard("KI und Gesellschaft")).toBeInTheDocument();

    const activeLevelLink = screen.getByRole("link", { name: "Einstieg" });
    expect(activeLevelLink).toHaveAttribute("href", "/konto?level=einstieg");

    const allLink = container.querySelector('a[href="/konto"]');
    expect(allLink).not.toBeNull();
    expect(allLink).toHaveTextContent("Alle");
  });

  it("sorts the catalog by duration via a real link", async () => {
    render(await kontoPage({ sort: "duration" }));

    const cards = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    // ki-und-gesellschaft (46 min) sorts before ki-fuehrerschein (100 min)
    // under duration order, the reverse of the step-order default.
    const gesellschaft = cards.indexOf("KI und Gesellschaft");
    const fuehrerschein = cards.indexOf("KI-Führerschein");
    expect(gesellschaft).toBeGreaterThanOrEqual(0);
    expect(gesellschaft).toBeLessThan(fuehrerschein);

    const durationSort = screen.getByRole("link", { name: "Dauer" });
    expect(durationSort).toHaveAttribute("href", "/konto?sort=duration");
  });

  it("combines level and sort in one link, and keeps the account-required note truthful", async () => {
    render(await kontoPage());

    expect(
      screen.getByText(
        "Bei den vier grundlegenden Kursen synchronisiert ein Konto Fortschritt und Abschlussstatus geräteübergreifend. Die sechs technischen Kurse funktionieren auch ohne Konto.",
      ),
    ).toBeInTheDocument();

    const combined = screen.getByRole("link", { name: "Fortgeschritten" });
    expect(combined).toHaveAttribute("href", "/konto?level=fortg");
  });

  it("keeps the whole catalog on one fetch of the account record", async () => {
    // Every region reads props derived from this single call. A second call
    // would mean a region started fetching for itself, which is the waterfall
    // the decomposition exists to prevent.
    render(await kontoPage());

    expect(mocks.fetchUnifiedProgressForUser).toHaveBeenCalledTimes(1);
    expect(mocks.fetchUnifiedProgressForUser).toHaveBeenCalledWith(
      AUTH_CLIENT,
      USER.id,
    );
  });

  it("shows the no-match state when a filter empties the available list", async () => {
    const state = progress(
      Object.fromEntries(
        (["ki-fuehrerschein", "ki-und-gesellschaft"] as const).map((slug) => [
          slug,
          courseSlice(
            slug,
            CANONICAL_LESSON_IDS[slug].length,
            "2026-07-29T11:00:00.000Z",
          ),
        ]),
      ),
    );
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    // Both einstieg courses are now in "my courses" (recordEarned), so no
    // einstieg course remains for the "available" list to show.
    render(await kontoPage({ level: "einstieg" }));

    expect(
      screen.getByText("Kein Kurs entspricht diesem Filter."),
    ).toBeInTheDocument();
  });
});

describe("KontoPage account regions", () => {
  it("renders the account regions in the published order", async () => {
    const state = progress({
      codex: courseSlice(
        "codex",
        CANONICAL_LESSON_IDS.codex.length,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    const { container } = render(await kontoPage());

    expect(
      Array.from(container.querySelectorAll('section[id^="konto-"]')).map(
        (section) => section.id,
      ),
    ).toEqual([
      "konto-weiterlernen",
      "konto-meine-kurse",
      "konto-werkzeuge",
      "konto-nachweise",
      "konto-verwalten",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      "Weiterlernen",
      "Meine Kurse",
      "Weitere Kurse",
      "Werkzeuge",
      "Teilnahmebestätigungen",
      "Konto verwalten",
    ]);
  });

  it("keeps the tool and AI regions fail-closed while their capabilities are off", async () => {
    // The two regions are not symmetrical, and the difference is deliberate.
    //
    // Deine KI renders nothing at all: an endpoint panel would advertise a
    // connection a deployment without agent access cannot honour.
    //
    // Werkzeuge has something true to say either way, so it renders its
    // source-only card: the repository and the self-host guide that
    // /open-source already publishes, and nothing else. What it must never
    // carry while the hosted tool is off is the handoff form, a document
    // count, or any claim about a hosted instance, so those are asserted
    // absent here rather than the whole region.
    const { container } = render(await kontoPage());

    expect(container.querySelector("#konto-deine-ki")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Deine KI" })).toBeNull();

    const tools = container.querySelector("#konto-werkzeuge") as HTMLElement;
    expect(tools).not.toBeNull();
    expect(tools.getAttribute("data-konto-werkzeuge")).toBe("source-only");
    expect(
      within(tools).getByRole("heading", { level: 2, name: "Werkzeuge" }),
    ).toBeInTheDocument();
    expect(tools.querySelector("form")).toBeNull();
    expect(within(tools).queryByRole("button", { name: /Öffnen/ })).toBeNull();
    expect(within(tools).queryByText(/Dokument/)).toBeNull();
  });

  it("lists an earned record with the course's own record noun and certificate link", async () => {
    const state = progress({
      codex: courseSlice(
        "codex",
        CANONICAL_LESSON_IDS.codex.length,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    const { container } = render(await kontoPage());

    const records = container.querySelector("#konto-nachweise") as HTMLElement;
    expect(records).not.toBeNull();
    expect(
      within(records).getByRole("link", {
        name: /Codex-Kurs Teilnahmebestätigung öffnen/,
      }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/kurs/zertifikat");
    // The unearned courses stay out of the record list.
    expect(
      within(records).queryByRole("link", { name: /KI-Führerschein/ }),
    ).toBeNull();
  });

  it("states plainly that no record has been earned yet", async () => {
    const { container } = render(await kontoPage());

    const records = container.querySelector("#konto-nachweise") as HTMLElement;
    expect(
      within(records).getByText(
        "Noch kein Kurs abgeschlossen. Die erste Bestätigung erscheint hier, sobald du einen Kurs beendest.",
      ),
    ).toBeInTheDocument();
    expect(within(records).queryAllByRole("link")).toHaveLength(0);
  });

  it("names the record region and its boundary in English too", async () => {
    mocks.getRequestLocale.mockResolvedValue("en");
    const state = progress({
      codex: courseSlice(
        "codex",
        CANONICAL_LESSON_IDS.codex.length,
        "2026-07-29T11:00:00.000Z",
      ),
    });
    mocks.fetchUnifiedProgressForUser.mockResolvedValue(successfulFetch(state));

    const { container } = render(await kontoPage());

    expect(
      screen.getByRole("heading", { name: "Certificates of participation" }),
    ).toBeVisible();
    const records = container.querySelector("#konto-nachweise") as HTMLElement;
    expect(
      within(records).getByRole("link", {
        name: /Codex Course Open certificate of participation/,
      }),
    ).toHaveAttribute("href", "/en/kurse/open-source/codex/kurs/zertifikat");
    expect(document.body).not.toHaveTextContent(/\bXP\b|streak|badge/i);
  });
});
