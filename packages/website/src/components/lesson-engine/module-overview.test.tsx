import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetCacheForTests,
  activateAnonymousProgress,
  activateUnknownProgress,
  completeCheckpoint,
  markLessonCompleted,
  markSectionRead,
  saveLessonQuizScore,
} from "@/lib/progress/store";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";

const { importProgressMock, buildProgressUrlMock } = vi.hoisted(() => ({
  importProgressMock: vi.fn(),
  buildProgressUrlMock: vi.fn(),
}));

vi.mock("@/lib/course/progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/course/progress")>()),
  importProgress: importProgressMock,
  buildProgressUrl: buildProgressUrlMock,
}));

import { KursContent } from "@/app/ki-fuehrerschein/kurs/kurs-content";
import type { ModuleOverviewModule } from "./module-overview";

const MODULES: readonly ModuleOverviewModule[] = [
  {
    id: "block_1",
    title: "Was darf rein?",
    description: "Daten einstufen.",
    durationMinutes: 12,
    orderIndex: 0,
    lessons: [
      { id: "daten-1-1", title: "Vier Stufen in einer Minute", durationMinutes: 6 },
      { id: "daten-1-2", title: "Schwärzen, bevor du einfügst", durationMinutes: 6 },
    ],
  },
  {
    id: "block_2",
    title: "Gut briefen",
    description: "Prüfbare Aufträge.",
    durationMinutes: 11,
    orderIndex: 1,
    lessons: [{ id: "briefen-2-1", title: "Ein Auftrag, den du prüfen kannst", durationMinutes: 6 }],
  },
];

function completeLesson(lessonId: string) {
  markSectionRead("ki-fuehrerschein", lessonId, `${lessonId}_exercise`);
  saveLessonQuizScore("ki-fuehrerschein", lessonId, 2, 2);
  completeCheckpoint(lessonId, lessonCompletionEvidenceCheckpointId("ki-fuehrerschein"));
  markLessonCompleted("ki-fuehrerschein", lessonId);
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/ki-fuehrerschein/kurs");
  __resetCacheForTests();
  activateAnonymousProgress();
  importProgressMock.mockReset();
  buildProgressUrlMock.mockReset();
  buildProgressUrlMock.mockImplementation((slug: string, base: string) => `${base}#progress=encoded-${slug}`);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("KI-Führerschein module overview", () => {
  it("shows module cards with progress rings and starts at the first lesson", async () => {
    render(<KursContent modules={MODULES} />);
    expect(screen.getByRole("heading", { level: 1, name: "KI-Führerschein" })).toBeInTheDocument();
    expect(screen.getByText("2 Module · 3 Lektionen · ca. 23 Min.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0 von 2 Lektionen in diesem Modul" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Erste Lektion starten/ })).toHaveAttribute(
      "href",
      "/ki-fuehrerschein/kurs/block_1#lesson=daten-1-1",
    );
    expect(screen.getByRole("link", { name: /Ein Auftrag, den du prüfen kannst/ })).toHaveAttribute(
      "href",
      "/ki-fuehrerschein/kurs/block_2#lesson=briefen-2-1",
    );
    for (const link of screen.getAllByRole("link")) expect(link).toHaveClass("min-h-11");
  });

  it("continues with the first unfinished lesson and fills the rings from evidence-backed progress", async () => {
    act(() => completeLesson("daten-1-1"));
    render(<KursContent modules={MODULES} locale="en" />);
    expect(await screen.findByRole("link", { name: /Continue: Schwärzen, bevor du einfügst/ })).toHaveAttribute(
      "href",
      "/en/ki-fuehrerschein/kurs/block_1#lesson=daten-1-2",
    );
    expect(screen.getByRole("img", { name: "1 of 2 lessons in this module" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "1 of 3 lessons complete" })).toBeInTheDocument();
  });

  it("does not count a raw completion bit without lesson evidence", async () => {
    act(() => markLessonCompleted("ki-fuehrerschein", "daten-1-1"));
    render(<KursContent modules={MODULES} />);
    expect(await screen.findByRole("link", { name: /Erste Lektion starten/ })).toBeInTheDocument();
  });

  it("imports a progress hash once the owner resolves, preserving the query", async () => {
    act(() => activateUnknownProgress());
    window.history.replaceState(null, "", "/ki-fuehrerschein/kurs?source=qr#progress=valid-payload");
    importProgressMock.mockReturnValue(true);
    render(<KursContent modules={MODULES} />);
    expect(importProgressMock).not.toHaveBeenCalled();
    act(() => activateAnonymousProgress());
    expect(importProgressMock).toHaveBeenCalledWith("ki-fuehrerschein", "valid-payload");
    expect(window.location.search).toBe("?source=qr");
    expect(window.location.hash).toBe("");
    expect(await screen.findByText("Fortschritt importiert.")).toBeInTheDocument();
  });

  it("removes an invalid progress hash and shows a generic alert without the payload", async () => {
    window.history.replaceState(null, "", "/ki-fuehrerschein/kurs#progress=private-do-not-render");
    importProgressMock.mockReturnValue(false);
    render(<KursContent modules={MODULES} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Der Fortschrittslink ist ungültig oder veraltet. Es wurde nichts importiert.",
    );
    expect(window.location.hash).toBe("");
    expect(screen.queryByText(/private-do-not-render/)).toBeNull();
  });

  it("copies a share link only after progress exists", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    act(() => completeLesson("daten-1-1"));
    render(<KursContent modules={MODULES} />);
    fireEvent.click(await screen.findByRole("button", { name: /Auf anderem Gerät fortsetzen/ }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/ki-fuehrerschein/kurs#progress=encoded-ki-fuehrerschein`,
      ),
    );
    expect(await screen.findByText(/Link kopiert/)).toBeInTheDocument();
  });
});
