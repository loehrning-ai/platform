import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  COURSE_CATALOG,
  IMPORTED_COURSE_CATALOG,
} from "@/lib/courses/catalog";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import type { UnifiedProgress } from "@/lib/progress/types";

// Mock the unified store + course-progress facade so the gallery's
// client-side progress dots are deterministic.
const storeMock = vi.hoisted(() => ({
  progressState: {
    current: {
      schemaVersion: 3,
      courses: {},
      xp: 0,
      checkpoints: {},
      badges: {},
      streak: { days: 0, last: null },
      lastActivity: "2026-07-29T12:00:00.000Z",
    } as UnifiedProgress,
  },
  getCompletedLessonsCount: vi.fn<(slug: string) => number>(() => 0),
  isCertificateEligible: vi.fn<(slug: string) => boolean>(() => false),
  getXp: vi.fn(() => 0),
  getStreak: vi.fn(() => ({ days: 0, last: null as string | null })),
  subscribe: vi.fn((listener: (progress: UnifiedProgress) => void) => {
    listener(storeMock.progressState.current);
    return () => {};
  }),
}));

vi.mock("@/lib/progress/store", () => storeMock);
vi.mock("@/lib/course/progress", () => ({
  serializeProgress: vi.fn(() => "ENCODED"),
}));

import { CourseGallery } from "./course-gallery";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storeMock.getCompletedLessonsCount.mockReturnValue(0);
  storeMock.isCertificateEligible.mockReturnValue(false);
  storeMock.getXp.mockReturnValue(0);
  storeMock.getStreak.mockReturnValue({ days: 0, last: null });
  storeMock.progressState.current = {
    schemaVersion: 3,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-07-29T12:00:00.000Z",
  };
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
});

describe("CourseGallery (learner-first: path + deeper shelf)", () => {
  //: both sections branch on nativeStatus, not which array a
  // course came from. Today COURSE_CATALOG is 100% "live" and
  // IMPORTED_COURSE_CATALOG is 100% "pending", so this pins the same visible
  // split as the array-membership tests below, just asserted via the field
  // the gallery now actually reads.
  it("renders exactly the nativeStatus === 'live' courses in Der Lernpfad and 'pending' ones in Tiefer gehen", () => {
    render(<CourseGallery />);
    for (const course of COURSE_CATALOG) {
      expect(course.nativeStatus).toBe("live");
      expect(screen.getByTestId(`progress-dots-${course.slug}`)).toBeInTheDocument();
    }
    for (const course of IMPORTED_COURSE_CATALOG) {
      expect(course.nativeStatus).toBe("pending");
      expect(screen.queryByTestId(`progress-dots-${course.slug}`)).toBeNull();
    }
  });

  it("renders one card per native course with a free price + progress dots", () => {
    render(<CourseGallery />);
    expect(screen.getByText("KI-Führerschein")).toBeInTheDocument();
    expect(screen.getByText("KI und Gesellschaft")).toBeInTheDocument();
    expect(screen.getByText("EU AI Act Kurs")).toBeInTheDocument();
    expect(screen.getByText("AI-Native Arbeitskurs")).toBeInTheDocument();

    expect(screen.getByTestId("progress-dots-ki-fuehrerschein")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dots-ki-und-gesellschaft")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dots-eu-ai-act-kurs")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dots-ai-native")).toBeInTheDocument();
  });

  it("labels the path and the deeper shelf so their difference is legible", () => {
    render(<CourseGallery />);
    expect(screen.getByText("Grundlagenpfad")).toBeInTheDocument();
    expect(screen.getByText("Technikkurse")).toBeInTheDocument();
  });

  it("renders English interface copy, translated foundation cards, and locale-preserving actions", () => {
    render(<CourseGallery locale="en" />);

    expect(screen.getByText("Foundation path")).toBeInTheDocument();
    expect(screen.getByText("Technical courses")).toBeInTheDocument();
    expect(screen.getByText("AI Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("AI and Society")).toBeInTheDocument();
    expect(screen.getByText("EU AI Act Course")).toBeInTheDocument();
    expect(screen.getByText("AI-Native Work Course")).toBeInTheDocument();
    expect(screen.queryByText("Grundlagenpfad")).toBeNull();

    const card = screen.getByText("AI Fundamentals").closest("li");
    expect(card).not.toBeNull();
    const scoped = within(card as HTMLElement);
    expect(scoped.getByText("Duration")).toBeInTheDocument();
    expect(scoped.getByText("Access")).toBeInTheDocument();
    expect(scoped.getByText("Free")).toBeInTheDocument();
    expect(
      scoped.getByRole("link", { name: "Start course: AI Fundamentals" }),
    ).toHaveAttribute("href", "/en/ki-fuehrerschein/kurs");
    expect(
      scoped.getByRole("link", { name: "Course details: AI Fundamentals" }),
    ).toHaveAttribute("href", "/en/ki-fuehrerschein");
    expect(
      scoped.getByRole("progressbar", { name: "Progress AI Fundamentals" }),
    ).toHaveAttribute("aria-valuetext", "0 of 18 lessons completed");
  });

  it("splits the path from the shelf along the declared classification", () => {
    render(<CourseGallery />);
    const spine = ["ki-fuehrerschein", "ki-und-gesellschaft", "eu-ai-act-kurs", "ai-native"];
    const lernpfad = document.getElementById("lernpfad") as HTMLElement;
    const shelf = document.getElementById("tiefer-gehen") as HTMLElement;
    for (const course of COURSE_CATALOG) {
      const home = spine.includes(course.slug) ? lernpfad : shelf;
      expect(within(home).getByText(course.title)).toBeInTheDocument();
    }
    // Every foundation course has an owned cover and the same compact fact
    // grammar; visual identity must not remove operational detail.
    expect(lernpfad.querySelectorAll("img")).toHaveLength(4);
    for (const course of COURSE_CATALOG.slice(0, 4)) {
      expect(
        within(lernpfad).getByAltText(course.coverImageAlt ?? ""),
      ).toBeInTheDocument();
    }
    expect(within(lernpfad).getAllByText("Umfang")).toHaveLength(4);
    expect(within(lernpfad).getAllByText("Dauer")).toHaveLength(4);
    expect(within(lernpfad).getAllByText("Aufbau")).toHaveLength(4);
    expect(within(lernpfad).getAllByText("Zugang")).toHaveLength(4);
    expect(within(lernpfad).getAllByText("Kostenlos")).toHaveLength(4);
  });

  it("mounts every ported course as a framed specimen with visible provenance", () => {
    render(<CourseGallery />);
    const deeper = COURSE_CATALOG.filter(
      (course) => !["ki-fuehrerschein", "ki-und-gesellschaft", "eu-ai-act-kurs", "ai-native"].includes(course.slug),
    );
    expect(deeper).toHaveLength(6);
    for (const course of deeper) {
      const card = screen.getByText(course.title).closest("li");
      expect(card).not.toBeNull();
      const scoped = within(card as HTMLElement);
      expect(scoped.getByAltText(course.coverImageAlt ?? "")).toBeInTheDocument();
      // The visible text of this link is the repo path, so the accessible
      // name has to contain it (WCAG 2.5.3): an aria-label that names only
      // the course would leave the link unaddressable by speech input.
      const repoPath = new URL(course.sourceHref ?? "")
        .pathname.split("/")
        .filter(Boolean)
        .slice(0, 2)
        .join("/");
      const sourceLink = scoped.getByRole("link", {
        name: `Quellcode auf GitHub: ${repoPath}, ${course.title}`,
      });
      expect(sourceLink).toHaveAttribute("href", course.sourceHref);
      expect(sourceLink).toHaveTextContent(repoPath);
      expect(scoped.getByText("MIT")).toBeInTheDocument();
      expect(
        scoped.getByRole("link", {
          name: `Quell-Commit ${course.sourceCommit?.slice(0, 7)} auf GitHub`,
        }),
      ).toHaveAttribute("href", course.sourceCommitHref);
      // Native progress stays: the specimen is still a real course card.
      expect(scoped.getByTestId(`progress-dots-${course.slug}`)).toBeInTheDocument();
    }
  });

  it("renders GitHub-Labs with source identity and no fake progress widgets", () => {
    render(<CourseGallery />);
    for (const course of IMPORTED_COURSE_CATALOG) {
      const card = screen.getByText(course.title).closest("li");
      expect(card).not.toBeNull();
      const scoped = within(card as HTMLElement);
      expect(scoped.getByText(course.title)).toBeInTheDocument();
      expect(card).toHaveTextContent(course.lessonCountLabel);
      for (const fact of course.sourceFacts.slice(0, 4)) {
        expect(scoped.getByText(fact)).toBeInTheDocument();
      }

      // GitHub identity: stroke-only icon link, honest badge chips, commit pin.
      expect(scoped.getByRole("link", { name: "Quellcode auf GitHub" })).toHaveAttribute(
        "href",
        course.sourceHref,
      );
      expect(scoped.getByText("Englisch")).toBeInTheDocument();
      expect(scoped.getByText("extern · GitHub")).toBeInTheDocument();
      expect(scoped.getByText("MIT")).toBeInTheDocument();
      expect(
        scoped.getByRole("link", { name: new RegExp(`Quell-Commit ${course.sourceCommit.slice(0, 7)}`) }),
      ).toHaveAttribute("href", course.sourceCommitHref);

      // Primary CTA opens the external live course; Details keeps the native detail route.
      expect(scoped.getByRole("link", { name: /Kurs öffnen/ })).toHaveAttribute(
        "href",
        course.launchHref,
      );
      expect(scoped.getByRole("link", { name: /Details/ })).toHaveAttribute(
        "href",
        course.href,
      );

      expect(scoped.getByAltText(course.imageAlt)).toBeInTheDocument();
      expect(screen.queryByTestId(`progress-dots-${course.slug}`)).toBeNull();
    }
    expect(screen.getByText("Technikkurse")).toBeInTheDocument();
    expect(storeMock.getCompletedLessonsCount.mock.calls.map(([slug]) => slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
    expect(storeMock.isCertificateEligible.mock.calls.map(([slug]) => slug)).toEqual(
      COURSE_CATALOG.map((course) => course.slug),
    );
  }, 10_000);

  it("shows 0% and no gamification banner before any progress exists", () => {
    render(<CourseGallery />);
    expect(
      screen.getByTestId("progress-pct-ki-fuehrerschein").textContent,
    ).toBe("0%");
    expect(screen.queryByTestId("kurse-gamification")).toBeNull();
  });

  it("fills progress dots proportionally and surfaces XP + streak once started", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "ki-fuehrerschein" ? 18 : 0,
    );
    storeMock.getXp.mockReturnValue(120);
    storeMock.getStreak.mockReturnValue({ days: 3, last: "2026-06-03" });

    render(<CourseGallery />);

    // Completed course -> exact 100% bar.
    expect(
      screen.getByTestId("progress-pct-ki-fuehrerschein").textContent,
    ).toBe("100%");
    const bar = within(
      screen.getByTestId("progress-dots-ki-fuehrerschein"),
    ).getByText("", { selector: "span" });
    expect(bar).toHaveStyle({ width: "100%" });

    const banner = screen.getByTestId("kurse-gamification");
    expect(banner.textContent).toMatch(/120 XP/);
    expect(banner.textContent).toMatch(/3 Tage Serie/);
  });

  it("links Weiterlernen to the first incomplete canonical lesson", () => {
    const lessonIds = CANONICAL_LESSON_IDS["eu-ai-act-kurs"];
    storeMock.progressState.current = {
      ...storeMock.progressState.current,
      courses: {
        "eu-ai-act-kurs": {
          lessons: Object.fromEntries(
            lessonIds.slice(0, 5).map((lessonId) => [
              lessonId,
              {
                sectionsRead: [],
                quizScore: null,
                quizTotal: null,
                completed: true,
                exercisesCompleted: {},
              },
            ]),
          ),
          workshopQuiz: { passed: false, score: 0, completedAt: null },
          capstoneSubmitted: false,
          startedAt: "2026-07-29T10:00:00.000Z",
          lastActivity: "2026-07-29T12:00:00.000Z",
        },
      },
    };
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "eu-ai-act-kurs" ? 5 : 0,
    );

    render(<CourseGallery />);

    const card = screen.getByText("EU AI Act Kurs").closest("li");
    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByRole("link", {
        name: "Weiterlernen: EU AI Act Kurs",
      }),
    ).toHaveAttribute(
      "href",
      "/eu-ai-act-kurs/kurs/block_2#lesson=block_2_lesson_2",
    );
  });

  it("marks a certified course and offers a share button only mid-course", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "ki-fuehrerschein" ? 19 : slug === "eu-ai-act-kurs" ? 5 : 0,
    );
    storeMock.isCertificateEligible.mockImplementation(
      (slug: string) => slug === "ki-fuehrerschein",
    );

    render(<CourseGallery />);

    // Certified badge on the finished course.
    expect(screen.getByTestId("certified-ki-fuehrerschein")).toBeInTheDocument();
    // In-progress (started, not certified) course offers the share action.
    expect(screen.getByText("Fortschritt teilen")).toBeInTheDocument();
  });

  it("announces clipboard rejection instead of leaving the share action silent", async () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "eu-ai-act-kurs" ? 5 : 0,
    );
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CourseGallery />);
    const status = screen.getByRole("status");
    const shareButton = screen.getByRole("button", {
      name: "EU AI Act Kurs: Fortschritt teilen",
    });
    expect(status).toBeEmptyDOMElement();
    fireEvent.click(shareButton);

    await waitFor(() =>
      expect(status).toHaveTextContent("Kopieren fehlgeschlagen"),
    );
    expect(shareButton).toHaveTextContent("Kopieren fehlgeschlagen");
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("localizes the shared progress URL and success state in English", async () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug: string) =>
      slug === "eu-ai-act-kurs" ? 5 : 0,
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CourseGallery locale="en" />);
    const shareButton = screen.getByRole("button", {
      name: "EU AI Act Course: Share progress",
    });
    fireEvent.click(shareButton);

    await waitFor(() => expect(shareButton).toHaveTextContent("Link copied"));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/en/eu-ai-act-kurs/kurs#progress=ENCODED"),
    );
  });
});
