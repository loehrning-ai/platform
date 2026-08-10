import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * lesson-quiz.test.tsx (regression coverage)
 *
 * Drives the real <LessonQuiz>. This is the interactive per-lesson quiz: a
 * radiogroup with roving tabindex, per-question explanation reveal, a running
 * score, a completion screen and a retry. The behaviours under test are the
 * component's OWN logic (not framer-motion):
 *   - empty question set renders the fallback message;
 *   - selecting an option reveals the explanation + "Richtig"/"Falsch" verdict
 *     and marks the chosen radio aria-checked;
 *   - advancing walks 1..n and the final button reads "Ergebnis";
 *   - finishing calls onComplete(score, total) with the REAL score derived from
 *     the chosen answers, and the result screen shows the rounded percentage and
 *     the matching band message;
 *   - "Nochmal" resets to the first question;
 *   - arrow keys move the roving tabindex and Space/Enter select.
 *
 * framer-motion is stubbed to plain elements so state transitions render
 * synchronously; every assertion targets real component output.
 */

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef, Fragment } = await import("react");
  const cache = new Map<string, unknown>();
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileInView",
    "layout",
    "layoutId",
    "viewport",
  ]);
  const clean = (p: Record<string, unknown>) => {
    const o: Record<string, unknown> = {};
    for (const k in p) if (!DROP.has(k)) o[k] = p[k];
    return o;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(
            tag,
            forwardRef<HTMLElement, Record<string, unknown>>((props, ref) =>
              createElement(tag, { ...clean(props), ref }),
            ),
          );
        }
        return cache.get(tag);
      },
    },
  );
  const Pass = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  return { __esModule: true, m, motion: m, AnimatePresence: Pass };
});

import { LessonQuiz } from "./lesson-quiz";
import type { LessonQuizQuestion } from "@/lib/course/types";

const questions: readonly LessonQuizQuestion[] = [
  {
    id: "q1",
    questionText: "Was ergibt zwei plus zwei?",
    answerOptions: [
      { id: "a", text: "Drei", isCorrect: false },
      { id: "b", text: "Vier", isCorrect: true },
      { id: "c", text: "Fünf", isCorrect: false },
      { id: "d", text: "Sechs", isCorrect: false },
    ],
    explanation: "Zwei plus zwei ergibt vier.",
  },
  {
    id: "q2",
    questionText: "Was ist die Hauptstadt von Deutschland?",
    answerOptions: [
      { id: "a", text: "Berlin", isCorrect: true },
      { id: "b", text: "München", isCorrect: false },
      { id: "c", text: "Hamburg", isCorrect: false },
      { id: "d", text: "Köln", isCorrect: false },
    ],
    explanation: "Die Hauptstadt ist Berlin.",
  },
];

/** Correct-option array index per question (isCorrect === true). */
const CORRECT_INDEX = questions.map((q) =>
  q.answerOptions.findIndex((o) => o.isCorrect),
);

afterEach(cleanup);

describe("<LessonQuiz> empty + initial state", () => {
  it("renders the fallback message for an empty question set", () => {
    const onComplete = vi.fn();
    render(
      <LessonQuiz questions={[]} bestScore={null} onComplete={onComplete} />,
    );
    expect(
      screen.getByText("Keine Quizfragen für diese Lektion verfügbar."),
    ).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("renders the first question with a labelled radiogroup and roving tabindex", () => {
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );
    expect(screen.getByText(/Frage 1 von 2/)).toBeInTheDocument();
    expect(screen.getByText("Was ergibt zwei plus zwei?")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);
    // Only the focused option (index 0) is in the tab order initially.
    expect(radios[0]).toHaveAttribute("tabindex", "0");
    expect(radios[1]).toHaveAttribute("tabindex", "-1");
  });

  it("shows the best-score line only when a bestScore is supplied", () => {
    const { unmount } = render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );
    expect(screen.queryByText(/Bisher/)).toBeNull();
    unmount();

    render(
      <LessonQuiz
        questions={questions}
        bestScore={{ score: 1, total: 2 }}
        onComplete={() => {}}
      />,
    );
    expect(screen.getByText(/Bisher:\s*1\/2/)).toBeInTheDocument();
  });
});

describe("<LessonQuiz> selection + explanation", () => {
  it("reveals 'Richtig' + explanation and checks the radio when the correct option is chosen", () => {
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[CORRECT_INDEX[0]]);

    expect(radios[CORRECT_INDEX[0]]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Richtig")).toBeInTheDocument();
    expect(screen.getByText("Zwei plus zwei ergibt vier.")).toBeInTheDocument();
    // Advancing affordance appears; it is "Weiter" while questions remain.
    expect(screen.getByRole("button", { name: /Weiter/ })).toBeInTheDocument();
  });

  it("reveals 'Falsch' when an incorrect option is chosen", () => {
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );
    const radios = screen.getAllByRole("radio");
    // Index 0 ("Drei") is wrong for q1 (correct is index 1 = "Vier").
    fireEvent.click(radios[0]);
    expect(screen.getByText("Falsch")).toBeInTheDocument();
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[CORRECT_INDEX[0]]).toHaveAccessibleName(/Richtige Antwort/);
    expect(radios[0]).toHaveAccessibleName(/Ihre Auswahl ist falsch/);
  });
});

describe("<LessonQuiz> completion scoring", () => {
  it("walks to the last question, labels the final button 'Ergebnis' and reports a perfect score", () => {
    const onComplete = vi.fn();
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={onComplete}
      />,
    );

    // Q1: pick the correct option, advance.
    fireEvent.click(screen.getAllByRole("radio")[CORRECT_INDEX[0]]);
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));

    // Q2 is the last question.
    expect(screen.getByText(/Frage 2 von 2/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("radio")[CORRECT_INDEX[1]]);
    fireEvent.click(screen.getByRole("button", { name: /Ergebnis/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(2, 2);
    // Result screen: 2/2 -> 100% -> the precise completion label.
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("2/2 richtig")).toBeInTheDocument();
    expect(screen.getByText("Alle Antworten richtig.")).toBeInTheDocument();
  });

  it("reports a zero score and the retry-band message when every answer is wrong", () => {
    const onComplete = vi.fn();
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={onComplete}
      />,
    );

    // Q1: pick a wrong option (index != correct), advance.
    const wrongQ1 = CORRECT_INDEX[0] === 0 ? 1 : 0;
    fireEvent.click(screen.getAllByRole("radio")[wrongQ1]);
    fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));

    // Q2: pick a wrong option, finish.
    const wrongQ2 = CORRECT_INDEX[1] === 0 ? 1 : 0;
    fireEvent.click(screen.getAllByRole("radio")[wrongQ2]);
    fireEvent.click(screen.getByRole("button", { name: /Ergebnis/ }));

    expect(onComplete).toHaveBeenCalledWith(0, 2);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0/2 richtig")).toBeInTheDocument();
    expect(
      screen.getByText("Lies die Lektion nochmal und versuch es noch einmal."),
    ).toBeInTheDocument();
  });

  it("resets to the first question when 'Nochmal' is clicked", () => {
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );

    // Finish the quiz (answers do not matter for the reset behaviour).
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Ergebnis/ }));

    // On the result screen, restart.
    fireEvent.click(screen.getByRole("button", { name: /Nochmal/ }));

    expect(screen.getByText(/Frage 1 von 2/)).toBeInTheDocument();
    expect(screen.getByText("Was ergibt zwei plus zwei?")).toBeInTheDocument();
    // Fresh question: nothing selected yet.
    screen
      .getAllByRole("radio")
      .forEach((r) => expect(r).toHaveAttribute("aria-checked", "false"));
  });
});

describe("<LessonQuiz> keyboard navigation", () => {
  it("moves the roving tabindex with ArrowDown and selects with Space", () => {
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );
    let radios = screen.getAllByRole("radio");

    fireEvent.keyDown(radios[0], { key: "ArrowDown" });
    radios = screen.getAllByRole("radio");
    // Focus moved to option index 1.
    expect(radios[1]).toHaveAttribute("tabindex", "0");
    expect(radios[0]).toHaveAttribute("tabindex", "-1");

    // Space on the focused option selects it (index 1 is correct for q1).
    fireEvent.keyDown(radios[1], { key: " " });
    expect(screen.getAllByRole("radio")[1]).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("Richtig")).toBeInTheDocument();
  });

  it("wraps the roving tabindex from the first option to the last with ArrowUp", () => {
    render(
      <LessonQuiz
        questions={questions}
        bestScore={null}
        onComplete={() => {}}
      />,
    );
    fireEvent.keyDown(screen.getAllByRole("radio")[0], { key: "ArrowUp" });
    const radios = screen.getAllByRole("radio");
    expect(radios[radios.length - 1]).toHaveAttribute("tabindex", "0");
    expect(radios[0]).toHaveAttribute("tabindex", "-1");
  });
});
