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

    // Back to the ledger brief's zero-image rule. A cover thumbnail was tried
    // here and removed: the artwork is a wide illustration that crops to mush
    // at the ~56px a dense row allows, and the six imported courses carry only
    // site screenshots, which read as grey noise at that size. The art renders
    // large on the home cards and the account catalog instead.
    expect(container.querySelectorAll("img")).toHaveLength(0);
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

describe("LearningAtlas phone ledger", () => {
  it("offers level chips that narrow the ledger below lg and leave the desktop ledger complete", () => {
    const { container } = render(<LearningAtlas />);

    const chips = screen.getByRole("group", { name: "Kursstufe wählen" });
    const buttons = within(chips).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Alle",
      "Einstieg",
      "Mittel",
      "Fortgeschritten",
    ]);
    expect(
      buttons.every((button) => button.className.includes("min-h-11")),
    ).toBe(true);
    expect(within(chips).getByRole("button", { name: "Alle" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // The bar sticks under the compact top bar, exists below lg only, and
    // leaves the no-script document rather than standing there inert.
    const bar = chips.closest("[data-course-level-filter]");
    expect(bar).toHaveClass(
      "sticky",
      "top-[var(--nav-h-compact)]",
      "lg:hidden",
      "js-shell-only",
    );

    const rows = Array.from(
      container.querySelectorAll<HTMLElement>("[data-course-slug]"),
    );
    expect(rows).toHaveLength(10);
    for (const row of rows) {
      expect(row).not.toHaveClass("hidden");
      expect(row.dataset.courseLevel).toMatch(/^(?:einstieg|mittel|fortg)$/);
    }
    expect(screen.getByText("10 von 10 Kursen")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    fireEvent.click(within(chips).getByRole("button", { name: "Einstieg" }));

    expect(
      within(chips).getByRole("button", { name: "Einstieg" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(chips).getByRole("button", { name: "Alle" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    for (const row of rows) {
      if (row.dataset.courseLevel === "einstieg") {
        expect(row, row.dataset.courseSlug).not.toHaveClass("hidden");
      } else {
        // Hidden on the phone only: the desktop ledger stays complete.
        expect(row, row.dataset.courseSlug).toHaveClass(
          "hidden",
          "lg:list-item",
        );
      }
    }
    expect(
      rows.filter((row) => !row.classList.contains("hidden")),
    ).toHaveLength(2);
    // A group with no matching course leaves the phone list with its rows.
    expect(document.getElementById("tiefer-gehen")).toHaveClass(
      "hidden",
      "lg:block",
    );
    expect(document.getElementById("lernpfad")).not.toHaveClass("hidden");
    expect(screen.getByText("2 von 10 Kursen")).toBeInTheDocument();
    // The level is a phone view state, never a shareable URL state: only the
    // goal writes to the address bar.
    expect(window.location.search).toBe("");

    fireEvent.click(within(chips).getByRole("button", { name: "Alle" }));
    for (const row of rows) expect(row).not.toHaveClass("hidden");
    expect(document.getElementById("tiefer-gehen")).not.toHaveClass("hidden");
  });

  it("states level and duration on every row and keeps the plate out of the accessibility tree", () => {
    const { container } = render(<LearningAtlas />);

    for (const course of [...COURSE_CATALOG, ...IMPORTED_COURSE_CATALOG]) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      const eyebrow = row?.querySelector<HTMLElement>(
        "[data-course-level-label]",
      );
      expect(eyebrow, course.slug).not.toBeNull();
      expect(eyebrow).toHaveClass("lg:hidden");
      expect(eyebrow).toHaveTextContent(course.duration);
      expect(eyebrow).toHaveTextContent(
        { einstieg: "Einstieg", mittel: "Mittel", fortg: "Fortgeschritten" }[
          course.level
        ],
      );

      // The plate is a styling column only. It carries no aria-hidden of its
      // own, so the row's first hidden element is still the number badge.
      const plate = row?.querySelector<HTMLElement>("[data-course-plate]");
      expect(plate, course.slug).not.toBeNull();
      expect(plate).not.toHaveAttribute("aria-hidden");
      expect(plate).toHaveClass("lg:bg-transparent");
      expect(plate?.firstElementChild).toHaveAttribute("aria-hidden", "true");
      expect(row?.querySelector("[aria-hidden='true']")).toBe(
        plate?.firstElementChild,
      );
    }
  });

  it("keeps the full repository path and commit in the attribution's accessible name", () => {
    const { container } = render(<LearningAtlas />);
    const codex = container.querySelector<HTMLElement>(
      '[data-course-slug="codex"]',
    ) as HTMLElement;

    const repository = within(codex).getByRole("link", {
      name: "Mavengence/interactive-courses: Quellcode, Codex-Kurs",
    });
    expect(repository).toHaveAttribute(
      "href",
      expect.stringContaining("github.com/Mavengence/interactive-courses"),
    );
    // Below lg only the repository name is printed; the owner returns at lg.
    const owner = repository.querySelector(".sr-only.lg\\:not-sr-only");
    expect(owner).toHaveTextContent("Mavengence/");

    const commit = within(codex).getByRole("link", { name: "Commit #0e5dfd3" });
    expect(commit.querySelector(".sr-only.lg\\:not-sr-only")).toHaveTextContent(
      "Commit",
    );
  });

  it("renders the goal decision as joined 44px segments below lg and the 56px tiles from lg", () => {
    render(<LearningAtlas />);
    const goals = screen.getByRole("group", { name: "Lernziel auswählen" });
    expect(goals).toHaveClass("grid-cols-2", "lg:grid-cols-4");

    const buttons = within(goals).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.className).toContain("min-h-11");
      expect(button.className).toContain("lg:min-h-14");
    }
    // Shared hairlines: the right column and the second row overlap by 1px
    // below lg and get their gap back from lg.
    expect(buttons[1]).toHaveClass("-ml-px", "lg:ml-0");
    expect(buttons[2]).toHaveClass("-mt-px", "lg:mt-0");
    expect(buttons[3]).toHaveClass("-ml-px", "-mt-px");
    expect(buttons[0]).not.toHaveClass("-ml-px");
    expect(buttons[0]).not.toHaveClass("-mt-px");
  });

  it("localizes the level chips in English", () => {
    window.history.replaceState({}, "", "/en/kurse");
    render(<LearningAtlas locale="en" />);

    const chips = screen.getByRole("group", { name: "Choose a course level" });
    expect(
      within(chips)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["All", "Entry", "Intermediate", "Advanced"]);

    fireEvent.click(within(chips).getByRole("button", { name: "Advanced" }));
    expect(screen.getByText("3 of 10 courses")).toBeInTheDocument();
  });

  it("puts the row action inside the tinted rail below lg and keeps its wording addressable", () => {
    const { container } = render(<LearningAtlas />);

    for (const course of [...COURSE_CATALOG, ...IMPORTED_COURSE_CATALOG]) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      const plate = row?.querySelector<HTMLElement>("[data-course-plate]");
      const actionCell = row?.querySelector<HTMLElement>(
        "[data-course-action]",
      );
      expect(actionCell, course.slug).not.toBeNull();

      // Both rail cells carry the row's own plate tone, which is what makes
      // them read as one strip, and both drop it at lg so the reviewed
      // four-column row keeps its flat wash.
      const tone = [...(plate?.classList ?? [])].find((name) =>
        name.startsWith("bg-brand-"),
      );
      expect(tone, `${course.slug} plate tone`).toBeDefined();
      expect(actionCell).toHaveClass(tone as string, "lg:bg-transparent");
      expect(plate).toHaveClass("lg:bg-transparent");

      // The rail is two cells, so neither spans rows; the copy column does.
      expect(plate?.className).not.toContain("row-span");
      expect(actionCell?.className).not.toContain("row-span");

      const action = actionCell?.querySelector<HTMLElement>("a");
      expect(action, `${course.slug} action`).not.toBeNull();
      // 44x44 outright below lg, the labelled button from lg.
      expect(action).toHaveClass("h-11", "w-11", "lg:h-auto", "lg:w-auto");
      expect(action?.className).toContain("lg:min-h-11");
      const label = action?.querySelector(".sr-only.lg\\:not-sr-only");
      expect(label, `${course.slug} action label`).not.toBeNull();
      expect(label?.textContent?.trim().length).toBeGreaterThan(0);
    }

    // The accessible name is unchanged by the icon-only phone treatment.
    const ledger = screen.getByRole("region", { name: "Alle Kurse" });
    expect(
      within(ledger).getByRole("link", {
        name: "Nachweis beginnen: KI-Führerschein",
      }),
    ).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
    expect(
      within(ledger).getByRole("link", {
        name: "Nachweis beginnen: Codex-Kurs",
      }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/kurs/L01");
  });

  it("keeps the path marker and the ledger intro in the accessibility tree when the phone drops their lines", () => {
    const { container } = render(<LearningAtlas />);

    // Selected goal "start" — its courses carry the marker, others do not.
    const marked = Array.from(
      container.querySelectorAll<HTMLElement>('[data-in-path="true"]'),
    );
    expect(marked.length).toBeGreaterThan(0);
    for (const row of marked) {
      const marker = within(row).getByText("Teil des gewählten Pfads");
      expect(marker, row.dataset.courseSlug).toHaveClass(
        "sr-only",
        "lg:not-sr-only",
      );
      // The orange left edge and the orange badge still state membership.
      expect(row).toHaveClass("border-l-brand-orange");
    }
    expect(
      container.querySelector('[data-in-path="false"]'),
    ).not.toHaveTextContent("Teil des gewählten Pfads");

    const intro = screen.getByText(
      "Der Pfad ist eine Empfehlung. Jeder Kurs bleibt direkt erreichbar.",
    );
    expect(intro).toHaveClass("sr-only", "sm:not-sr-only");
  });
});
