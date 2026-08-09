import type { ComponentType } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BlockSummary, CourseSlug } from "@/lib/course/types";
import {
  __resetCacheForTests,
  activateAnonymousProgress,
  activateUnknownProgress,
} from "@/lib/progress/store";

const {
  buildProgressUrlMock,
  getBlockCompletedLessonsMock,
  getCompletedLessonsCountMock,
  getOverallProgressMock,
  importProgressMock,
  isWorkshopQuizPassedMock,
} = vi.hoisted(() => ({
  buildProgressUrlMock: vi.fn(),
  getBlockCompletedLessonsMock: vi.fn(),
  getCompletedLessonsCountMock: vi.fn(),
  getOverallProgressMock: vi.fn(),
  importProgressMock: vi.fn(),
  isWorkshopQuizPassedMock: vi.fn(),
}));

vi.mock("@/lib/course/progress", () => ({
  buildProgressUrl: buildProgressUrlMock,
  getBlockCompletedLessons: getBlockCompletedLessonsMock,
  getCompletedLessonsCount: getCompletedLessonsCountMock,
  getOverallProgress: getOverallProgressMock,
  importProgress: importProgressMock,
  isWorkshopQuizPassed: isWorkshopQuizPassedMock,
}));

import { KursContent as EuAiActKursContent } from "@/app/eu-ai-act-kurs/kurs/kurs-content";
import { KursContent as KiFuehrerscheinKursContent } from "@/app/ki-fuehrerschein/kurs/kurs-content";
import { KursContent as KiGesellschaftKursContent } from "@/app/ki-und-gesellschaft/kurs/kurs-content";

interface CourseCase {
  readonly slug: CourseSlug;
  readonly path: string;
  readonly Component: ComponentType<{
    readonly blocks: readonly BlockSummary[];
    readonly totalLessons: number;
  }>;
}

const COURSES: readonly CourseCase[] = [
  {
    slug: "eu-ai-act-kurs",
    path: "/eu-ai-act-kurs/kurs",
    Component: EuAiActKursContent,
  },
  {
    slug: "ki-fuehrerschein",
    path: "/ki-fuehrerschein/kurs",
    Component: KiFuehrerscheinKursContent,
  },
  {
    slug: "ki-und-gesellschaft",
    path: "/ki-und-gesellschaft/kurs",
    Component: KiGesellschaftKursContent,
  },
];

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  __resetCacheForTests();
  buildProgressUrlMock.mockReset();
  getBlockCompletedLessonsMock.mockReset();
  getCompletedLessonsCountMock.mockReset();
  getOverallProgressMock.mockReset();
  importProgressMock.mockReset();
  isWorkshopQuizPassedMock.mockReset();

  getBlockCompletedLessonsMock.mockReturnValue(0);
  getCompletedLessonsCountMock.mockReturnValue(1);
  getOverallProgressMock.mockReturnValue(50);
  importProgressMock.mockReturnValue(false);
  isWorkshopQuizPassedMock.mockReturnValue(false);
  buildProgressUrlMock.mockImplementation(
    (slug: CourseSlug, baseUrl: string) =>
      `${baseUrl}#progress=encoded-${slug}`,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each(COURSES)(
  "$slug progress sharing",
  ({ slug, path, Component }) => {
    it("announces clipboard success only after the write resolves", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      render(<Component blocks={[]} totalLessons={1} />);
      fireEvent.click(
        await screen.findByRole("button", {
          name: /Fortschritt auf anderem Gerät fortsetzen/i,
        }),
      );

      const expectedUrl = `${window.location.origin}${path}#progress=encoded-${slug}`;
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedUrl));
      expect(await screen.findByText(/Link kopiert/i)).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("shows a generic retry error without logging progress or provider details", async () => {
      const writeText = vi
        .fn()
        .mockRejectedValue(
          new Error(`encoded-${slug} private-progress provider-secret`),
        );
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<Component blocks={[]} totalLessons={1} />);
      fireEvent.click(
        await screen.findByRole("button", {
          name: /Fortschritt auf anderem Gerät fortsetzen/i,
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /Link konnte nicht kopiert werden\. (?:Bitte )?versuche es erneut\./i,
      );
      expect(consoleError).not.toHaveBeenCalled();
    });

    it("removes an invalid progress hash, preserves path/query, and shows a persistent generic alert", async () => {
      const privatePayload = `private-${slug}-do-not-render`;
      window.history.replaceState(
        null,
        "",
        `${path}?source=mail#progress=${privatePayload}`,
      );
      importProgressMock.mockReturnValue(false);
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<Component blocks={[]} totalLessons={1} />);

      expect(importProgressMock).toHaveBeenCalledWith(slug, privatePayload);
      expect(window.location.pathname).toBe(path);
      expect(window.location.search).toBe("?source=mail");
      expect(window.location.hash).toBe("");
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(
        "Dieser Fortschrittslink ist ungültig oder veraltet. Es wurde kein Fortschritt importiert.",
      );
      expect(screen.queryByText(privatePayload)).toBeNull();
      expect(consoleError).not.toHaveBeenCalled();

      await waitFor(() => expect(screen.getByRole("alert")).toBe(alert));
    });

    it("removes a valid progress hash while preserving the query and announces success", async () => {
      window.history.replaceState(
        null,
        "",
        `${path}?source=qr#progress=valid-${slug}`,
      );
      importProgressMock.mockReturnValue(true);

      render(<Component blocks={[]} totalLessons={1} />);

      expect(importProgressMock).toHaveBeenCalledWith(slug, `valid-${slug}`);
      expect(window.location.pathname).toBe(path);
      expect(window.location.search).toBe("?source=qr");
      expect(window.location.hash).toBe("");
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Fortschritt erfolgreich importiert.",
      );
    });

    it("retains and defers a progress import until the learning owner resolves", async () => {
      const privatePayload = `pending-${slug}-owner-resolution`;
      window.history.replaceState(
        null,
        "",
        `${path}?source=handoff#progress=${privatePayload}`,
      );
      importProgressMock.mockReturnValue(true);
      activateUnknownProgress();

      render(<Component blocks={[]} totalLessons={1} />);

      expect(importProgressMock).not.toHaveBeenCalled();
      expect(window.location.hash).toBe(
        `#progress=${privatePayload}`,
      );
      expect(screen.queryByRole("status")).toBeNull();

      act(() => {
        activateAnonymousProgress();
      });

      expect(importProgressMock).toHaveBeenCalledTimes(1);
      expect(importProgressMock).toHaveBeenCalledWith(
        slug,
        privatePayload,
      );
      expect(window.location.pathname).toBe(path);
      expect(window.location.search).toBe("?source=handoff");
      expect(window.location.hash).toBe("");
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Fortschritt erfolgreich importiert.",
      );
    });

    it("clamps defensive over-counts and does not unlock the final quiz", async () => {
      getCompletedLessonsCountMock.mockReturnValue(2);
      getOverallProgressMock.mockReturnValue(250);

      render(<Component blocks={[]} totalLessons={1} />);

      const progressbar = await screen.findByRole("progressbar", {
        name: "Gesamtfortschritt",
      });
      expect(progressbar).toHaveAttribute("aria-valuenow", "100");
      expect(progressbar.firstElementChild).toHaveStyle({ width: "100%" });
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /Quiz starten/i }),
      ).toBeNull();
      expect(
        screen.getByText("Verfügbar nach Abschluss aller 1 Lektionen."),
      ).toBeInTheDocument();
    });
  },
);
