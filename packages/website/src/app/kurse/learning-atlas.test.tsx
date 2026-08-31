import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import type { UnifiedProgress } from "@/lib/progress/types";

const storeMock = vi.hoisted(() => ({
  progressState: {
    current: {
      schemaVersion: 3,
      courses: {},
      xp: 0,
      checkpoints: {},
      badges: {},
      streak: { days: 0, last: null },
      lastActivity: "2026-08-25T12:00:00.000Z",
    } as UnifiedProgress,
  },
  getCompletedLessonsCount: vi.fn<(slug: string) => number>(() => 0),
  isCertificateEligible: vi.fn<(slug: string) => boolean>(() => false),
  subscribe: vi.fn((listener: (progress: UnifiedProgress) => void) => {
    listener(storeMock.progressState.current);
    return () => {};
  }),
}));

vi.mock("@/lib/progress/store", () => storeMock);

import { LearningAtlas } from "./learning-atlas";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  storeMock.getCompletedLessonsCount.mockReturnValue(0);
  storeMock.isCertificateEligible.mockReturnValue(false);
  storeMock.progressState.current = {
    schemaVersion: 3,
    courses: {},
    xp: 0,
    checkpoints: {},
    badges: {},
    streak: { days: 0, last: null },
    lastActivity: "2026-08-25T12:00:00.000Z",
  };
  window.history.replaceState({}, "", "/kurse");
});

describe("LearningAtlas", () => {
  it("starts with a semantic goal decision and one explicit next proof", () => {
    render(<LearningAtlas />);

    const goals = screen.getByRole("group", {
      name: "Lernziel auswählen",
    });
    const buttons = within(goals).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(
      buttons.every((button) => button.className.includes("min-h-14")),
    ).toBe(true);
    expect(
      within(goals).getByRole("button", { name: "Sicher starten" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Nachweis beginnen: KI-Führerschein",
      }),
    ).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
    expect(
      screen.getByText(
        "Prüfe eine reale Aufgabe auf Eingabe, Datenrisiko und Ergebnisqualität.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("next-proof").querySelector("[data-next-proof-stack]"),
    ).not.toBeNull();
    expect(
      screen.getByTestId("next-proof").querySelector("[data-next-proof-card]"),
    ).toHaveClass("bg-paper", "border-t-brand-orange");
    expect(
      screen.getByTestId("next-proof").querySelector(".dark-section"),
    ).toBeNull();
    expect(
      screen
        .getByTestId("selected-path-sequence")
        .querySelector("[data-learning-path-stepper]"),
    ).not.toBeNull();
    expect(
      within(screen.getByTestId("selected-path-sequence")).getByRole("link", {
        name: /KI-Führerschein.*offen/,
      }),
    ).toHaveAttribute("aria-current", "step");
    expect(screen.queryByText(/XP|Serie/)).not.toBeInTheDocument();
  });

  it("preserves every catalog course, overview route, start route, and MIT source attribution", () => {
    const { container } = render(<LearningAtlas />);

    for (const course of COURSE_CATALOG) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      expect(row).not.toBeNull();
      expect(row?.querySelector(`a[href="${course.href}"]`)).not.toBeNull();
      expect(
        row?.querySelector(`a[href="${course.startHref}"]`),
      ).not.toBeNull();
      const action = row?.querySelector<HTMLElement>("[data-course-action]");
      expect(action).not.toBeNull();
      expect(action?.closest("details")).toBeNull();
      expect(action?.querySelector("a")).toHaveClass(
        "border-brand-orange",
        "bg-paper",
        "text-foreground",
      );
      // No per-row progress meter: the teaser states duration only and the
      // progress affordances live on the account catalog.
      expect(
        screen.queryByTestId(`progress-dots-${course.slug}`),
      ).toBeNull();
      expect(row?.querySelector('[role="progressbar"]')).toBeNull();
      // The imported courses are MIT-licensed. This row is the only place the
      // repository and pinned commit render as page content anywhere on the
      // site, so attribution must be present and visible, not disclosed.
      if (course.sourceHref) {
        const source = row?.querySelector<HTMLElement>("[data-course-source]");
        expect(source, `${course.slug} source attribution`).not.toBeNull();
        expect(
          source?.querySelector(`a[href="${course.sourceHref}"]`),
        ).not.toBeNull();
        if (course.sourceCommitHref) {
          expect(
            source?.querySelector(`a[href="${course.sourceCommitHref}"]`),
          ).not.toBeNull();
        }
      }
    }

    for (const course of IMPORTED_COURSE_CATALOG) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      expect(row).not.toBeNull();
      expect(row?.querySelector(`a[href="${course.href}"]`)).not.toBeNull();
      expect(
        row?.querySelector(`a[href="${course.launchHref}"]`),
      ).not.toBeNull();
      expect(row?.querySelector("[data-course-action]")).not.toBeNull();
      expect(screen.queryByTestId(`progress-dots-${course.slug}`)).toBeNull();
    }

    // Exactly the six imported courses carry visible source attribution.
    expect(container.querySelectorAll("[data-course-source]")).toHaveLength(
      COURSE_CATALOG.filter((course) => course.sourceHref).length,
    );

    // One cover-art image per course now that the ledger brief's "zero
    // images" rule is deliberately reversed -- every COURSE_CATALOG entry
    // has a coverImage, and IMPORTED_COURSE_CATALOG is empty today.
    expect(container.querySelectorAll("img")).toHaveLength(
      COURSE_CATALOG.length,
    );
    // No per-row disclosure at all. The facts it held are either on the row
    // (duration, source) or on the course's own landing page (description,
    // scope, structure, audience, badges).
    expect(container.querySelectorAll("details")).toHaveLength(0);
    expect(screen.queryByText("Fakten und Zugang")).toBeNull();
  });

  it("shows the declared relationship between foundation and technical courses", () => {
    const { container } = render(<LearningAtlas />);
    const foundation = document.getElementById("lernpfad") as HTMLElement;
    const technical = document.getElementById("tiefer-gehen") as HTMLElement;

    expect(within(foundation).getByText("Grundlagenpfad")).toBeInTheDocument();
    expect(within(technical).getByText("Technikkurse")).toBeInTheDocument();
    expect(foundation.querySelectorAll("[data-course-slug]")).toHaveLength(4);
    expect(technical.querySelectorAll("[data-course-slug]")).toHaveLength(6);

    for (const slug of [
      "ki-fuehrerschein",
      "ki-und-gesellschaft",
      "eu-ai-act-kurs",
      "ai-native",
    ]) {
      expect(
        container.querySelector(`[data-course-slug="${slug}"]`),
      ).toHaveAttribute("data-in-path", "true");
    }
  });

  it("changes the path with semantic buttons and persists the goal in the URL", () => {
    const { container } = render(<LearningAtlas />);
    fireEvent.click(screen.getByRole("button", { name: "Mit KI bauen" }));

    expect(window.location.search).toBe("?goal=build");
    expect(
      screen.getByRole("button", { name: "Mit KI bauen" }),
    ).toHaveAttribute("aria-pressed", "true");
    const path = screen.getByTestId("selected-path-sequence");
    for (const title of [
      "AI-Native Arbeitskurs",
      "Claude Course",
      "Codex-Kurs",
      "The AI-Native Operator",
    ]) {
      expect(within(path).getByText(title)).toBeInTheDocument();
    }
    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Nachweis beginnen: AI-Native Arbeitskurs",
      }),
    ).toHaveAttribute("href", "/ai-native/kurs/modul_1");
    expect(
      container.querySelector('[data-course-slug="claude"]'),
    ).toHaveAttribute("data-in-path", "true");
    expect(
      container.querySelector('[data-course-slug="ki-fuehrerschein"]'),
    ).toHaveAttribute("data-in-path", "false");
  });

  it("restores a safe goal query and localizes every route in English", () => {
    window.history.replaceState({}, "", "/en/kurse?goal=data");
    const { container } = render(<LearningAtlas locale="en" />);

    expect(
      screen.getByRole("button", { name: "Decide with data" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Start this proof: Data Engineering Fundamentals",
      }),
    ).toHaveAttribute(
      "href",
      "/en/kurse/open-source/data-engineering-fundamentals/home",
    );

    for (const course of COURSE_CATALOG) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      expect(row?.querySelector(`a[href="/en${course.href}"]`)).not.toBeNull();
      expect(
        row?.querySelector(`a[href="/en${course.startHref}"]`),
      ).not.toBeNull();
    }
  });

  it("uses progress to advance the default path and keeps source provenance visible", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug) =>
      slug === "ki-fuehrerschein" ? 18 : slug === "ki-und-gesellschaft" ? 3 : 0,
    );
    storeMock.isCertificateEligible.mockImplementation(
      (slug) => slug === "ki-fuehrerschein",
    );

    const { container } = render(<LearningAtlas />);

    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Nachweis fortsetzen: KI und Gesellschaft",
      }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-course-slug="ki-fuehrerschein"]'),
    ).toHaveAttribute("data-course-status", "complete");
    expect(
      container
        .querySelector('[data-course-slug="ki-fuehrerschein"]')
        ?.querySelector("[aria-hidden='true']"),
    ).toHaveClass("border-brand-orange", "bg-kupfer-mist", "text-brand-orange");
    expect(
      container.querySelector('[data-course-slug="ki-und-gesellschaft"]'),
    ).toHaveAttribute("data-course-status", "started");
    // Progress still DRIVES the atlas (status attribute above, next-proof pick
    // above) but is no longer DISPLAYED here: the numeric readouts moved to the
    // account catalog, so the teaser states a course's duration instead.
    expect(screen.queryByTestId("progress-pct-ki-fuehrerschein")).toBeNull();
    expect(
      screen.queryByTestId("course-progress-ki-fuehrerschein"),
    ).toBeNull();
    expect(container.querySelectorAll("[data-progress-fill]")).toHaveLength(0);
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);

    const codex = container.querySelector<HTMLElement>(
      '[data-course-slug="codex"]',
    );
    expect(
      codex?.querySelector('a[href*="github.com/Mavengence"]'),
    ).not.toBeNull();
    expect(codex).toHaveTextContent("#0e5dfd3");
  });

  it("links a course to its demo only where a demo actually exists", () => {
    const { container } = render(<LearningAtlas locale="de" />);

    // Twelve demos cover three of the ten courses. The other seven rows must
    // omit the teaser rather than borrow a demo from an unrelated course.
    const withTeaser = Array.from(
      container.querySelectorAll<HTMLElement>("[data-course-slug]"),
    ).filter((row) => row.querySelector('a[href^="/demos/"]') !== null);

    expect(withTeaser.map((row) => row.dataset.courseSlug).sort()).toEqual([
      "ai-native",
      "eu-ai-act-kurs",
      "ki-fuehrerschein",
    ]);

    const aiNative = container.querySelector<HTMLElement>(
      '[data-course-slug="ai-native"]',
    );
    // Nine demos on this course, so the label carries the real count.
    expect(aiNative).toHaveTextContent("9 Praxisbeispiele testen");
    const single = container.querySelector<HTMLElement>(
      '[data-course-slug="ki-fuehrerschein"]',
    );
    expect(single).toHaveTextContent("Praxisbeispiel testen");
  });
});
