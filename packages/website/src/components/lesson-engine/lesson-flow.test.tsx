import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetCacheForTests,
  activateUnknownProgress,
  completeCheckpoint,
  continueWithAnonymousProgress,
  getLessonQuizScore,
  getReadSectionIds,
  resetCourse,
} from "@/lib/progress/store";
import { isEvidenceBackedLessonCompleted } from "@/lib/progress";
import { getBlockLessons } from "@/lib/course/data";
import { isEngineLesson, type EngineLesson } from "@/lib/lesson-engine/lesson";
import type { Lesson } from "@/lib/course/types";
import { LessonFlow } from "./lesson-flow";
import { orderCheckOptions } from "./lesson-checks";

function pilotLesson(): EngineLesson<Lesson> {
  const lesson = getBlockLessons("ki-fuehrerschein", "block_1")[0];
  if (!isEngineLesson(lesson)) throw new Error("pilot lesson must be an engine lesson");
  return {
    ...lesson,
    // A two-card sort keeps the interaction test short.
    exercise: {
      ...lesson.exercise,
      kind: "bucket-sort",
      props: {
        buckets: [
          { id: "public", label: "Öffentlich" },
          { id: "never", label: "Nie eingeben" },
        ],
        items: [
          { id: "press", text: "Pressetext", bucket: "public", why: "Veröffentlicht." },
          { id: "key", text: "API-Schlüssel", bucket: "never", why: "Zugangsdaten." },
          { id: "site", text: "Website-Text", bucket: "public", why: "Veröffentlicht." },
        ],
      },
    },
  };
}

function answerChecksCorrectly(lesson: EngineLesson<Lesson>) {
  for (const check of lesson.checks) {
    const fieldset = document.querySelector(`[data-check-id="${check.id}"]`) as HTMLElement;
    const correct = check.options.find((option) => option.correct)!;
    fireEvent.click(within(fieldset).getByRole("button", { name: correct.text }));
  }
}

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
  continueWithAnonymousProgress();
});

afterEach(() => {
  cleanup();
});

describe("LessonFlow (lesson-engine reader)", () => {
  it("renders one scrolling flow: header, concept, exercise, checks and status, without read buttons or tabs", async () => {
    const lesson = pilotLesson();
    render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} moduleLabel="Modul 1 · Was darf rein?" />);

    expect(screen.getByRole("heading", { level: 1, name: lesson.title })).toBeInTheDocument();
    expect(screen.getByText(/Lektion 1 von 8/)).toBeInTheDocument();
    expect(screen.getByText(lesson.concept.takeaway!)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DSGVO Art. 5" })).toHaveAttribute("href", expect.stringContaining("eur-lex.europa.eu"));
    expect(screen.getByRole("heading", { name: lesson.exercise.title })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Pressetext/ })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("button", { name: /geprüft|gelesen/i })).toBeNull();
    expect(screen.getByRole("heading", { name: "Noch offen" })).toBeInTheDocument();
  });

  it("gives instant explained feedback on a wrong pick and locks that option", () => {
    const lesson = pilotLesson();
    render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} />);
    const check = lesson.checks[0];
    const wrong = check.options.find((option) => !option.correct && option.feedback)!;
    const fieldset = document.querySelector(`[data-check-id="${check.id}"]`) as HTMLElement;
    const button = within(fieldset).getByRole("button", { name: wrong.text });
    fireEvent.click(button);
    expect(within(fieldset).getByText("Nicht ganz.")).toBeInTheDocument();
    expect(within(fieldset).getByText(new RegExp(wrong.feedback!.slice(0, 30)))).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(fieldset).toHaveAttribute("data-solved", "0");
  });

  it("completes only after the exercise and both checks, then writes the lesson proof", async () => {
    const lesson = pilotLesson();
    const onCompleted = vi.fn();
    const onSelect = vi.fn();
    render(
      <LessonFlow
        courseSlug="ki-fuehrerschein"
        lesson={lesson}
        position={{ index: 1, total: 8 }}
        onCompleted={onCompleted}
        next={{ kind: "button", label: "Weiter: Schwärzen", onSelect }}
      />,
    );

    answerChecksCorrectly(lesson);
    await waitFor(() => expect(getLessonQuizScore("ki-fuehrerschein", lesson.id)).toEqual({ score: 2, total: 2 }));
    expect(isEvidenceBackedLessonCompleted("ki-fuehrerschein", lesson.id)).toBe(false);
    expect(screen.getByText(/Übung abschließen/)).toBeInTheDocument();

    // Do the exercise through its real UI (keyboard path).
    fireEvent.keyDown(await screen.findByRole("button", { name: /Pressetext/ }), { key: "1" });
    fireEvent.keyDown(screen.getByRole("button", { name: /API-Schlüssel/ }), { key: "2" });
    fireEvent.keyDown(screen.getByRole("button", { name: /Website-Text/ }), { key: "1" });

    await waitFor(() => expect(isEvidenceBackedLessonCompleted("ki-fuehrerschein", lesson.id)).toBe(true));
    expect(getReadSectionIds("ki-fuehrerschein", lesson.id).has(`${lesson.id}_exercise`)).toBe(true);
    expect(await screen.findByRole("heading", { name: "Lektion geschafft" })).toBeInTheDocument();
    expect(document.querySelector("[data-lesson-engine]")).toHaveAttribute("data-lesson-complete", "1");
    expect(onCompleted).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Weiter: Schwärzen/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("promotes a widget checkpoint (legacy widgets) to the exercise step", async () => {
    const lesson = pilotLesson();
    render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} />);
    act(() => {
      completeCheckpoint(`ki-fuehrerschein:${lesson.id}`, "exercise");
    });
    await waitFor(() =>
      expect(getReadSectionIds("ki-fuehrerschein", lesson.id).has(`${lesson.id}_exercise`)).toBe(true),
    );
  });

  it("does not count a pre-reset widget checkpoint after a course reset", async () => {
    const lesson = pilotLesson();
    act(() => {
      completeCheckpoint(`ki-fuehrerschein:${lesson.id}`, "exercise");
      resetCourse("ki-fuehrerschein");
    });
    render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} />);
    answerChecksCorrectly(lesson);
    await waitFor(() => expect(getLessonQuizScore("ki-fuehrerschein", lesson.id)).toEqual({ score: 2, total: 2 }));
    expect(getReadSectionIds("ki-fuehrerschein", lesson.id).has(`${lesson.id}_exercise`)).toBe(false);
    expect(isEvidenceBackedLessonCompleted("ki-fuehrerschein", lesson.id)).toBe(false);

    // Redoing the exercise completes the lesson again.
    fireEvent.keyDown(await screen.findByRole("button", { name: /Pressetext/ }), { key: "1" });
    fireEvent.keyDown(screen.getByRole("button", { name: /API-Schlüssel/ }), { key: "2" });
    fireEvent.keyDown(screen.getByRole("button", { name: /Website-Text/ }), { key: "1" });
    await waitFor(() => expect(isEvidenceBackedLessonCompleted("ki-fuehrerschein", lesson.id)).toBe(true));
  });

  it("renders stored progress as solved after a reload", async () => {
    const lesson = pilotLesson();
    const first = render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} />);
    answerChecksCorrectly(lesson);
    await waitFor(() => expect(getLessonQuizScore("ki-fuehrerschein", lesson.id)).not.toBeNull());
    first.unmount();

    render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} />);
    await waitFor(() =>
      expect(document.querySelectorAll('[data-solved="1"]')).toHaveLength(lesson.checks.length),
    );
  });

  it("keeps checks inert and explains why until a learning owner is chosen", async () => {
    act(() => {
      activateUnknownProgress();
    });
    const lesson = pilotLesson();
    render(<LessonFlow courseSlug="ki-fuehrerschein" lesson={lesson} position={{ index: 1, total: 8 }} locale="en" />);
    const check = lesson.checks[0];
    const fieldset = document.querySelector(`[data-check-id="${check.id}"]`) as HTMLElement;
    fireEvent.click(within(fieldset).getByRole("button", { name: check.options[0].text }));
    expect(fieldset.querySelector('[data-option-state="idle"]')).not.toBeNull();
    expect(getLessonQuizScore("ki-fuehrerschein", lesson.id)).toBeNull();
  });

  it("shows check options in a stable shuffled order that keeps every option", () => {
    const options = ["a", "b", "c", "d"].map((id) => ({ id }));
    const first = orderCheckOptions("daten-1-1-c1", options);
    expect(orderCheckOptions("daten-1-1-c1", options)).toEqual(first);
    expect([...first].map((option) => option.id).sort()).toEqual(["a", "b", "c", "d"]);
    const positions = new Set(
      Array.from({ length: 24 }, (_, index) =>
        orderCheckOptions(`check-${index}`, options).findIndex((option) => option.id === "b"),
      ),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});
