import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetCacheForTests,
  completeCheckpoint,
  continueWithAnonymousProgress,
  markLessonCompleted,
  markSectionRead,
  saveLessonQuizScore,
} from "@/lib/progress/store";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import { LessonShell } from "@/components/course/lesson-shell";
import { CourseOutline, type CourseOutlineModule } from "./course-outline";
import { CourseLessonHeader } from "./course-lesson-header";
import { useLessonReaderBar } from "@/components/course/use-lesson-reader-bar";
import { ReaderFocusBar } from "@/components/learning/reader-focus-bar";

function EngineBarHarness({ lessonId }: { readonly lessonId: string }) {
  const reader = useLessonReaderBar({
    courseSlug: "ki-fuehrerschein",
    lessonId,
    ordinal: 1,
    total: 8,
    locale: "de",
    next: { kind: "link", label: "Weiter", href: "/next" },
    engineSteps: true,
  });
  return (
    <>
      <div ref={reader.contentRef}>
        <section id="lesson-exercise"><h2>Übung</h2></section>
        <section id="lesson-checks"><h2>Prüfen</h2></section>
      </div>
      <ReaderFocusBar tone="app" {...reader.bar} action={reader.bar.next} />
    </>
  );
}

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/ki-fuehrerschein/kurs/block_1",
}));

const MODULES: readonly CourseOutlineModule[] = [
  {
    id: "block_1",
    number: 1,
    title: "Was darf rein?",
    lessons: [
      { id: "daten-1-1", number: 1, title: "Vier Stufen", durationMinutes: 6 },
      { id: "daten-1-2", number: 2, title: "Schwärzen", durationMinutes: 6 },
    ],
  },
  {
    id: "block_2",
    number: 2,
    title: "Gut briefen",
    lessons: [
      {
        id: "briefen-2-1",
        number: 3,
        title: "Prüfbarer Auftrag",
        durationMinutes: 6,
        href: "/ki-fuehrerschein/kurs/block_2#lesson=briefen-2-1",
      },
    ],
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
  __resetCacheForTests();
  continueWithAnonymousProgress();
});

afterEach(cleanup);

describe("CourseOutline", () => {
  it("opens the active module, switches lessons in place and links other modules", () => {
    const onSelect = vi.fn();
    render(
      <CourseOutline
        courseSlug="ki-fuehrerschein"
        modules={MODULES}
        activeLessonId="daten-1-1"
        onSelectLesson={onSelect}
        label="Lektionen"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Lektionen" });
    const [first, second] = within(nav).getAllByRole("button", { expanded: true }).concat(
      within(nav).getAllByRole("button", { expanded: false }),
    );
    expect(first).toHaveAccessibleName(/Modul 1/);
    expect(second).toHaveAccessibleName(/Modul 2/);
    expect(screen.getByRole("button", { name: "Lektion 1: Vier Stufen" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    fireEvent.click(screen.getByRole("button", { name: "Lektion 2: Schwärzen" }));
    expect(onSelect).toHaveBeenCalledWith("daten-1-2");

    // Collapsed modules keep their lessons out of the tab order until opened.
    expect(screen.queryByRole("link", { name: /Prüfbarer Auftrag/ })).toBeNull();
    fireEvent.click(second);
    expect(screen.getByRole("link", { name: "Lektion 3: Prüfbarer Auftrag" })).toHaveAttribute(
      "href",
      "/ki-fuehrerschein/kurs/block_2#lesson=briefen-2-1",
    );
  });

  it("marks evidence-backed lessons as complete", () => {
    act(() => completeLesson("daten-1-1"));
    render(
      <CourseOutline
        courseSlug="ki-fuehrerschein"
        modules={MODULES}
        activeLessonId="daten-1-2"
        locale="en"
        label="Lessons"
      />,
    );
    expect(screen.getByRole("button", { name: "Lesson 1: Vier Stufen (complete)" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 lessons done")).toHaveClass("sr-only");
  });
});

describe("CourseLessonHeader", () => {
  it("shows course progress and the lesson's three steps", () => {
    act(() => completeLesson("daten-1-1"));
    render(
      <CourseLessonHeader
        courseSlug="ki-fuehrerschein"
        lessonId="daten-1-1"
        courseLessonIds={["daten-1-1", "daten-1-2", "briefen-2-1"]}
        backHref="/ki-fuehrerschein/kurs"
        backLabel="Zur Kursübersicht"
        title="KI-Führerschein"
        context="Modul 1 · Lektion 1 von 3"
      />,
    );
    expect(screen.getByRole("link", { name: "Zur Kursübersicht" })).toHaveAttribute(
      "href",
      "/ki-fuehrerschein/kurs",
    );
    expect(
      screen.getByRole("progressbar", { name: "Kursfortschritt: 1 von 3 Lektionen abgeschlossen" }),
    ).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("img", { name: "Diese Lektion: 3 von 3 Schritten erledigt" })).toBeInTheDocument();
    const header = document.querySelector("[data-course-lesson-header]");
    expect(header).toHaveClass("sticky", "top-[var(--nav-h-compact)]", "lg:top-[var(--nav-h)]");
  });
});

describe("LessonShell course-app look", () => {
  it("drops scene headings and Kopflinien, renders the header slot and the app reader bar", () => {
    render(
      <LessonShell
        look="app"
        header={<div data-testid="course-header" />}
        sidebar={<p>Outline</p>}
        navOpen={false}
        onNavOpenChange={() => undefined}
        navLabel="Lektionsnavigation"
        readerBar={{ position: "1 / 8", next: { kind: "link", label: "Weiter", href: "/x" } }}
      >
        <h1>Titel</h1>
      </LessonShell>,
    );
    const shell = document.querySelector("[data-lesson-shell]") as HTMLElement;
    expect(shell).toHaveAttribute("data-lesson-look", "app");
    expect(shell).not.toHaveAttribute("data-plakat-page");
    expect(shell).toHaveClass("course-app-ground");
    const stage = document.querySelector("[data-lesson-shell-content]") as HTMLElement;
    expect(stage.className).not.toMatch(/scene-line/);
    expect(screen.getByTestId("course-header")).toBeInTheDocument();
    expect(document.querySelector("[data-reader-focus-bar]")).toHaveAttribute(
      "data-reader-focus-tone",
      "app",
    );
    expect(document.querySelector("[data-reader-focus-action]")).toHaveClass("rounded-full", "min-h-11");
  });

  it("keeps the Werkzeichnung look by default for the technical readers", () => {
    render(
      <LessonShell
        header={<div data-testid="course-header" />}
        sidebar={<p>Outline</p>}
        navOpen={false}
        onNavOpenChange={() => undefined}
        navLabel="Lektionsnavigation"
      >
        <h1>Titel</h1>
      </LessonShell>,
    );
    const shell = document.querySelector("[data-lesson-shell]") as HTMLElement;
    expect(shell).toHaveAttribute("data-lesson-look", "werk");
    expect(shell).toHaveAttribute("data-plakat-page");
    expect(screen.queryByTestId("course-header")).toBeNull();
  });
});

describe("engine reader bar", () => {
  it("leads to the exercise, then to the checks, then to the next lesson", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    const view = render(<EngineBarHarness lessonId="daten-1-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Zur Übung" }));
    expect(screen.getByRole("heading", { name: "Übung" })).toHaveFocus();

    act(() => markSectionRead("ki-fuehrerschein", "daten-1-1", "daten-1-1_exercise"));
    fireEvent.click(screen.getByRole("button", { name: "Zu den Fragen" }));
    expect(screen.getByRole("heading", { name: "Prüfen" })).toHaveFocus();

    act(() => completeLesson("daten-1-1"));
    expect(screen.getByRole("link", { name: "Weiter" })).toHaveAttribute("href", "/next");
    view.unmount();
  });
});
