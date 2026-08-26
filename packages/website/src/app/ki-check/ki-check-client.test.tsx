import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { KiCheckClient } from "./ki-check-client";
import { KI_CHECK_CONTENT } from "@/lib/ki-check/localization";
import { QUESTIONS } from "@/lib/ki-check/questions";

/**
 * framer-motion is stubbed to plain elements so `m.*` and AnimatePresence render
 * their children synchronously (no exit-animation timing in jsdom). This lets us
 * drive the REAL wizard and assert focus management + the result content.
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
    "whileInView",
    "whileHover",
    "whileTap",
    "viewport",
    "layout",
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
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: Pass,
    LazyMotion: Pass,
    MotionConfig: Pass,
    domAnimation: {},
    useReducedMotion: () => false,
  };
});

afterEach(cleanup);

/** Answer the current question with its first option, then advance. */
function answerFirstAndAdvance(
  question: (typeof QUESTIONS)[number],
  isLast: boolean,
) {
  fireEvent.click(
    screen.getByRole("button", { name: question.options[0].text }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: isLast ? "Zum Ergebnis" : "Weiter" }),
  );
}

describe("KiCheckClient", () => {
  it("shows one question at a time and requires a choice before advancing", () => {
    render(<KiCheckClient />);

    // First question visible; the next question is not.
    expect(
      screen.getByRole("heading", { level: 2, name: QUESTIONS[0].text }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: QUESTIONS[1].text }),
    ).not.toBeInTheDocument();

    // "Weiter" is disabled until an option is picked.
    expect(screen.getByRole("button", { name: "Weiter" })).toBeDisabled();
    expect(
      document.querySelectorAll(
        '[data-diagnostic-state="question"] [data-primary-action]',
      ),
    ).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: QUESTIONS[0].options[0].text }),
    );
    expect(screen.getByRole("button", { name: "Weiter" })).toBeEnabled();
  });

  it("reveals the picked option's meaning", () => {
    render(<KiCheckClient />);
    const meaning = QUESTIONS[0].options[0].meaning;
    expect(screen.queryByText(meaning)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: QUESTIONS[0].options[0].text }),
    );
    expect(screen.getByText(meaning)).toBeInTheDocument();
  });

  it("moves focus to each new question and then to the result heading", () => {
    render(<KiCheckClient />);

    for (let i = 0; i < QUESTIONS.length; i += 1) {
      const heading = screen.getByRole("heading", {
        level: 2,
        name: QUESTIONS[i].text,
      });
      if (i > 0) expect(heading).toHaveFocus();
      answerFirstAndAdvance(QUESTIONS[i], i === QUESTIONS.length - 1);
    }

    expect(
      screen.getByRole("heading", { level: 1, name: "Hier stehst du gerade." }),
    ).toHaveFocus();
  });

  it("renders a composite score, a stage and a course recommendation", () => {
    render(<KiCheckClient />);
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      answerFirstAndAdvance(QUESTIONS[i], i === QUESTIONS.length - 1);
    }

    // All-lowest answers -> composite 0, stage 1 "Neugierig", foundation course.
    expect(screen.getByText("Gesamtstand")).toBeInTheDocument();
    expect(screen.getByText(/Stufe 1: Neugierig/)).toBeInTheDocument();
    expect(screen.getByText("Dein nächster Schritt")).toBeInTheDocument();

    const start = screen.getByRole("link", { name: /Kurs starten/ });
    expect(start).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
    expect(
      document.querySelectorAll(
        '[data-diagnostic-state="result"] [data-primary-action]',
      ),
    ).toHaveLength(1);
  });

  it("returns focus to the first question after a restart", () => {
    render(<KiCheckClient />);
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      answerFirstAndAdvance(QUESTIONS[i], i === QUESTIONS.length - 1);
    }

    fireEvent.click(
      screen.getByRole("button", { name: /Check erneut starten/ }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: QUESTIONS[0].text }),
    ).toHaveFocus();
  });

  it("lets the user step back to revise an earlier answer", () => {
    render(<KiCheckClient />);
    answerFirstAndAdvance(QUESTIONS[0], false);

    // On question 2, go back.
    expect(
      screen.getByRole("heading", { level: 2, name: QUESTIONS[1].text }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Zurück/ }));

    // Question 1 again, previous choice still selected (Weiter enabled).
    expect(
      screen.getByRole("heading", { level: 2, name: QUESTIONS[0].text }),
    ).toHaveFocus();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeEnabled();
  });

  it("renders the complete English question and result flow with localized links", () => {
    const questions = KI_CHECK_CONTENT.en.questions;
    render(<KiCheckClient locale="en" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What is your current level?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: questions[0].text }),
    ).toBeInTheDocument();

    for (let index = 0; index < questions.length; index += 1) {
      fireEvent.click(
        screen.getByRole("button", { name: questions[index].options[0].text }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: index === questions.length - 1 ? "View result" : "Next",
        }),
      );
    }

    expect(
      screen.getByRole("heading", { level: 1, name: "Current profile." }),
    ).toHaveFocus();
    expect(screen.getByText("Level 1: Starting")).toBeInTheDocument();
    expect(screen.getByText("AI Fundamentals")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start course/ })).toHaveAttribute(
      "href",
      "/en/ki-fuehrerschein/kurs",
    );
  });
});
