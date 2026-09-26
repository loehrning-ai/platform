import { afterEach, describe, expect, it, vi } from "vitest";
import { getCourseAccess } from "@/lib/courses/access";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { COURSE_CATALOG, IMPORTED_COURSE_CATALOG } from "@/lib/courses/catalog";
import { COURSE_PROMISES } from "@/lib/courses/course-hub-copy";
import type { UnifiedProgress } from "@/lib/progress/types";
import { renderToString } from "react-dom/server";

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
  it.each(["de", "en"] as const)("offers an open cold-start task in provider-free %s", (locale) => {
    render(<LearningAtlas locale={locale} access={getCourseAccess(false)} />);
    const next = screen.getByTestId("next-proof");
    expect(within(next).getAllByRole("link")).toHaveLength(1);
    expect(within(next).getByRole("link")).toHaveAttribute("href", `${locale === "en" ? "/en" : ""}/kurse/open-source/claude/kurs/mental-model`);
    expect(next).toHaveTextContent(locale === "de" ? "Offener Einstieg ohne Lernkonto" : "Open starting point without an account");
    expect(next.textContent).not.toContain("0/4");
    // The sheet says why it offers a course off the path, and the Route
    // still marks the path's own first course as current.
    expect(next).toHaveTextContent(
      locale === "de"
        ? "Dein Pfad beginnt mit KI-Führerschein, der hier nicht verfügbar ist."
        : "Your path starts with AI Fundamentals, which is unavailable here.",
    );
    const stations = screen
      .getByTestId("selected-path-sequence")
      .querySelectorAll("[data-learning-path-stepper] > li");
    expect(stations[0]).toHaveAttribute("data-state", "current");
    expect(stations[0]?.querySelector("a")).toHaveAttribute("aria-current", "step");
  });

  it.each(["de", "en"] as const)("preserves an explicit unavailable goal and target in %s", (locale) => {
    const prefix = locale === "en" ? "/en" : "";
    const url = `${prefix}/kurse?goal=build&thread=retained#selected-learning-path`;
    window.history.replaceState({}, "", url);
    const { container } = render(<LearningAtlas locale={locale} access={getCourseAccess(false)} />);
    const next = screen.getByTestId("next-proof");
    const links = within(next).getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", `${prefix}/ai-native`);
    expect(links[0]).toHaveTextContent(locale === "de" ? "Hier nicht verfügbar" : "Unavailable here");
    expect(links[1]).toHaveAttribute("data-open-course-alternative");
    expect(links[1]).toHaveAttribute("href", `${prefix}/kurse/open-source/claude/kurs/mental-model`);
    expect(links[1]).toHaveTextContent(locale === "de" ? "Offene Alternative ohne Lernkonto" : "Open alternative without an account");
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(url);
    expect(container.querySelector('[data-learning-goal="build"]')).toHaveAttribute("aria-pressed", "true");
    const row = container.querySelector('[data-course-slug="ai-native"]');
    expect(row).toHaveAttribute("data-course-access", "unavailable");
    expect(row?.querySelector("[data-course-access-label]")).not.toHaveClass("sr-only");
    const rowAction = row?.querySelector("[data-course-action] a");
    expect(rowAction).toHaveAttribute("href", `${prefix}/ai-native`);
    // The state prints once, in the facts; the action shows the verb and
    // keeps the full state in its accessible name.
    expect(rowAction?.querySelector("span:not(.sr-only)")).toHaveTextContent(
      locale === "de" ? /^Kursübersicht$/ : /^Course overview$/,
    );
    expect(rowAction).toHaveAccessibleName(
      locale === "de"
        ? "Hier nicht verfügbar · Kursübersicht: AI-Native Arbeitskurs"
        : /^Unavailable here · Course overview: /,
    );
    expect(row?.querySelector("[data-course-meta]")).toHaveTextContent(
      locale === "de" ? "Hier nicht verfügbar" : "Unavailable here",
    );
  });

  it("honors a selected goal even when the learner explicitly chooses the default", () => {
    render(<LearningAtlas access={getCourseAccess(false)} />);
    fireEvent.click(screen.getByRole("button", { name: "Ich nutze KI im Job" }));
    const links = within(screen.getByTestId("next-proof")).getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/ki-fuehrerschein");
    expect(links[1]).toHaveAttribute("data-open-course-alternative");
    expect(window.location.search).toBe("?goal=start");
  });

  it.each([
    ["start", "/ki-fuehrerschein"],
    ["judge", "/ki-und-gesellschaft"],
    ["build", "/ai-native"],
    ["data", "/kurse/open-source/data-engineering-fundamentals/home"],
  ] as const)("retains the provider-free %s goal in both locales", (goal, href) => {
    for (const locale of ["de", "en"] as const) {
      const prefix = locale === "en" ? "/en" : "";
      window.history.replaceState({}, "", `${prefix}/kurse?goal=${goal}`);
      const { container, unmount } = render(
        <LearningAtlas locale={locale} access={getCourseAccess(false)} />,
      );
      expect(within(screen.getByTestId("next-proof")).getAllByRole("link")[0]).toHaveAttribute("href", prefix + href);
      expect(container.querySelector(`[data-learning-goal="${goal}"]`)).toHaveAttribute("aria-pressed", "true");
      expect(window.location.search).toBe(`?goal=${goal}`);
      unmount();
    }
  });

  it("keeps an unavailable course selected by real progress instead of replacing it", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug) => slug === "ki-und-gesellschaft" ? 3 : 0);
    storeMock.isCertificateEligible.mockImplementation((slug) => slug === "ki-fuehrerschein");
    render(<LearningAtlas access={getCourseAccess(false)} />);
    const links = within(screen.getByTestId("next-proof")).getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/ki-und-gesellschaft");
    expect(links[0]).toHaveTextContent("KI und Gesellschaft");
  });

  it("drops a prior progress recommendation when the subscribed owner snapshot resets", () => {
    storeMock.getCompletedLessonsCount.mockImplementation((slug) => slug === "ki-und-gesellschaft" ? 3 : 0);
    storeMock.isCertificateEligible.mockImplementation((slug) => slug === "ki-fuehrerschein");
    render(<LearningAtlas access={getCourseAccess(false)} />);
    expect(within(screen.getByTestId("next-proof")).getAllByRole("link")[0]).toHaveAttribute("href", "/ki-und-gesellschaft");
    act(() => {
      storeMock.getCompletedLessonsCount.mockReturnValue(0);
      storeMock.isCertificateEligible.mockReturnValue(false);
      storeMock.subscribe.mock.calls.at(-1)?.[0](storeMock.progressState.current);
    });
    expect(within(screen.getByTestId("next-proof")).getByRole("link")).toHaveAttribute("href", "/kurse/open-source/claude/kurs/mental-model");
  });

  it("states the account requirement on configured English actions before the click", () => {
    const { container } = render(<LearningAtlas locale="en" access={getCourseAccess(true)} />);
    const action = within(screen.getByTestId("next-proof")).getByRole("link");
    expect(action).toHaveTextContent("Account required");
    expect(action).toHaveAttribute("href", "/en/ki-fuehrerschein/kurs");
    expect(container.querySelector('[data-course-slug="ki-fuehrerschein"] [data-course-access-label]')).toHaveTextContent("Account required");
  });

  it("keeps server-rendered discovery independent of browser auth cookies", () => {
    const access = getCourseAccess(true);
    document.cookie = "access-test-owner=anonymous; path=/";
    const anonymous = renderToString(<LearningAtlas access={access} />);
    document.cookie = "access-test-owner=account; path=/";
    expect(renderToString(<LearningAtlas access={access} />)).toBe(anonymous);
    document.cookie = "access-test-owner=; Max-Age=0; path=/";
  });

  it("starts with a semantic goal decision and one explicit next proof", () => {
    render(<LearningAtlas access={getCourseAccess(true)} />);

    const goals = screen.getByRole("group", {
      name: "Lernziel auswählen",
    });
    const buttons = within(goals).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(
      buttons.every((button) => button.className.includes("min-h-14")),
    ).toBe(true);
    expect(
      within(goals).getByRole("button", { name: "Ich nutze KI im Job" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Kurs starten · Lernkonto nötig: KI-Führerschein",
      }),
    ).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
    expect(
      within(screen.getByTestId("next-proof")).getByText(
        COURSE_PROMISES.de["ki-fuehrerschein"] as string,
      ),
    ).toBeInTheDocument();
    // One flat sheet: no offset stack behind it, no mist fill, and the
    // page's single Mennige button is its action.
    const nextProof = screen.getByTestId("next-proof");
    expect(nextProof.querySelector("[data-next-proof-stack]")).toBeNull();
    expect(nextProof).toHaveClass("bg-card", "border-hairline");
    expect(nextProof.className).not.toMatch(/kupfer-mist|translate-|shadow/);
    expect(within(nextProof).getAllByRole("link")[0]).toHaveClass("bg-mennige");
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
    // The path is a vertical Route: the recommended course carries the
    // current station, the rest are open stations behind a dashed line.
    const stations = screen
      .getByTestId("selected-path-sequence")
      .querySelectorAll("[data-learning-path-stepper] > li");
    expect([...stations].map((li) => li.getAttribute("data-state"))).toEqual([
      "current",
      "future",
      "future",
      "future",
    ]);
    expect(screen.queryByText(/XP|Serie/)).not.toBeInTheDocument();
  });

  it("preserves every catalog course, overview route, start route, and MIT source attribution", () => {
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);

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
      // The row action is a text link, not a boxed button.
      expect(action?.querySelector("a")).toHaveClass(
        "min-h-11",
        "underline",
        "text-foreground",
      );
      expect(action?.querySelector("a")?.className).not.toMatch(
        /border-brand-orange|bg-paper|kupfer-mist/,
      );
      // No pastel wash on the row itself.
      expect(row?.className).not.toMatch(/bg-brand-|border-l-/);
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
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);
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
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Ich baue mit KI" }));

    expect(window.location.search).toBe("?goal=build");
    expect(
      within(screen.getByTestId("selected-path-sequence")).getByRole("heading", {
        level: 3,
        name: "Dein Pfad · 4 Kurse: Ich baue mit KI",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ich baue mit KI" }),
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
        name: "Kurs starten · Lernkonto nötig: AI-Native Arbeitskurs",
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
    const { container } = render(<LearningAtlas locale="en" access={getCourseAccess(true)} />);

    expect(
      screen.getByRole("button", { name: "I work with data" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Start course: Data Engineering Fundamentals",
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

    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);

    expect(
      within(screen.getByTestId("next-proof")).getByRole("link", {
        name: "Weiterlernen · Lernkonto nötig: KI und Gesellschaft",
      }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-course-slug="ki-fuehrerschein"]'),
    ).toHaveAttribute("data-course-status", "complete");
    // A finished course states it with the pass pictogram plus a word.
    expect(
      container.querySelector('[data-course-slug="ki-fuehrerschein"]'),
    ).toHaveTextContent("Abgeschlossen");
    expect(
      screen
        .getByTestId("selected-path-sequence")
        .querySelector("[data-learning-path-stepper] > li"),
    ).toHaveAttribute("data-state", "past");
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
    const { container } = render(<LearningAtlas locale="de" access={getCourseAccess(true)} />);

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
    expect(aiNative).toHaveTextContent("9 Praxisbeispiele ansehen");
    const single = container.querySelector<HTMLElement>(
      '[data-course-slug="ki-fuehrerschein"]',
    );
    expect(single).toHaveTextContent("Praxisbeispiel ansehen");
  });
});

describe("LearningAtlas phone ledger", () => {
  it("offers level chips that narrow the ledger below lg and leave the desktop ledger complete", () => {
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);

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

  it("states level and duration on every row as plain text, with the number out of the accessibility tree", () => {
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);

    for (const course of [...COURSE_CATALOG, ...IMPORTED_COURSE_CATALOG]) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      const levelLine = row?.querySelector<HTMLElement>(
        "[data-course-level-label]",
      );
      const level = { einstieg: "Einstieg", mittel: "Mittel", fortg: "Fortgeschritten" }[
        course.level
      ];
      expect(levelLine, course.slug).not.toBeNull();
      expect(levelLine).toHaveClass("lg:hidden");
      expect(levelLine).toHaveTextContent(course.duration);
      expect(levelLine).toHaveTextContent(level);

      // From lg the duration sits in its own column as plain text, never an
      // input-looking box.
      const meta = row?.querySelector<HTMLElement>("[data-course-meta]");
      expect(meta, course.slug).toHaveClass("hidden", "lg:block");
      expect(meta).toHaveTextContent(course.duration);
      expect(meta?.querySelector("[class*='border']")).toBeNull();

      const number = row?.querySelector<HTMLElement>("[data-course-number]");
      expect(number).toHaveAttribute("aria-hidden", "true");
      expect(row?.querySelector("[aria-hidden='true']")).toBe(number);
    }
  });
  it("keeps the full repository path and commit in the attribution's accessible name", () => {
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);
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

  it("renders the goal decision as joined square tabs: 44px in two rows below lg, one 56px row from lg", () => {
    render(<LearningAtlas access={getCourseAccess(true)} />);
    const goals = screen.getByRole("group", { name: "Lernziel auswählen" });
    expect(goals).toHaveClass("grid-cols-2", "lg:grid-cols-4");

    const buttons = within(goals).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.className).toContain("min-h-11");
      expect(button.className).toContain("lg:min-h-14");
      expect(button.className).not.toMatch(/kupfer-mist|rounded/);
    }
    // Shared hairlines: neighbours overlap by 1px at both widths.
    expect(buttons[1]).toHaveClass("-ml-px");
    expect(buttons[2]).toHaveClass("-mt-px", "lg:mt-0", "lg:-ml-px");
    expect(buttons[3]).toHaveClass("-ml-px", "-mt-px");
    expect(buttons[0]).not.toHaveClass("-ml-px");
    expect(buttons[0]).not.toHaveClass("-mt-px");
    // The chosen goal is an ink fill.
    expect(buttons[0]).toHaveClass("bg-foreground", "text-background");
    expect(buttons[1]).not.toHaveClass("bg-foreground");
  });
  it("localizes the level chips in English", () => {
    window.history.replaceState({}, "", "/en/kurse");
    render(<LearningAtlas locale="en" access={getCourseAccess(true)} />);

    const chips = screen.getByRole("group", { name: "Choose a course level" });
    expect(
      within(chips)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["All", "Entry", "Intermediate", "Advanced"]);

    fireEvent.click(within(chips).getByRole("button", { name: "Advanced" }));
    expect(screen.getByText("3 of 10 courses")).toBeInTheDocument();
  });

  it("gives every row one visible, addressable text-link action", () => {
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);

    for (const course of [...COURSE_CATALOG, ...IMPORTED_COURSE_CATALOG]) {
      const row = container.querySelector<HTMLElement>(
        `[data-course-slug="${course.slug}"]`,
      );
      expect(row?.querySelector("[data-course-plate]")).toBeNull();
      const actionCell = row?.querySelector<HTMLElement>(
        "[data-course-action]",
      );
      expect(actionCell, course.slug).not.toBeNull();
      const action = actionCell?.querySelector<HTMLElement>("a");
      expect(action, `${course.slug} action`).not.toBeNull();
      expect(action).toHaveClass("min-h-11");
      // The label is printed at every width.
      const label = action?.querySelector("span:not(.sr-only)");
      expect(label?.textContent?.trim().length).toBeGreaterThan(0);
    }

    const ledger = screen.getByRole("region", { name: "Alle Kurse" });
    expect(
      within(ledger).getByRole("link", {
        name: "Kurs starten · Lernkonto nötig: KI-Führerschein",
      }),
    ).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
    expect(
      within(ledger).getByRole("link", {
        name: "Kurs starten: Codex-Kurs",
      }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/kurs/L01");
  });
  it("marks path courses with an ink square and keeps the marker text and ledger intro in the accessibility tree", () => {
    const { container } = render(<LearningAtlas access={getCourseAccess(true)} />);

    const marked = Array.from(
      container.querySelectorAll<HTMLElement>('[data-in-path="true"]'),
    );
    expect(marked.length).toBeGreaterThan(0);
    for (const row of marked) {
      // The square is the visible signal; the words stay for screen
      // readers only, and the ledger head prints the key once.
      const marker = within(row).getByText("Teil deines Pfads");
      expect(marker, row.dataset.courseSlug).toHaveClass("sr-only");
      expect(marker).not.toHaveClass("lg:not-sr-only");
      // Ink square instead of an orange left edge.
      expect(row.querySelector("[data-path-marker]")).toHaveClass("bg-foreground");
      expect(row.className).not.toMatch(/border-l-/);
    }
    const outside = container.querySelector<HTMLElement>('[data-in-path="false"]');
    expect(outside).not.toHaveTextContent("Teil deines Pfads");
    expect(outside?.querySelector("[data-path-marker]")).not.toHaveClass(
      "bg-foreground",
    );

    const intro = screen.getByText(
      "Jede Zeile sagt, was du nach dem Kurs kannst. Jeden Kurs kannst du auch ohne Pfad direkt öffnen.",
    );
    expect(intro).toHaveClass("sr-only", "sm:not-sr-only");
    const legend = container.querySelector("[data-path-legend]");
    expect(legend).toHaveAttribute("aria-hidden", "true");
    expect(legend).toHaveTextContent("Teil deines Pfads");
  });
});
