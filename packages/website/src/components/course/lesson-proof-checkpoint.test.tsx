import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isMeaningfulTransferDecision,
  LessonProofCheckpoint,
  LessonSectionCheckpoint,
} from "./lesson-proof-checkpoint";

afterEach(() => cleanup());

describe("LessonProofCheckpoint", () => {
  it("rejects filler and accepts a concrete multi-word transfer decision", () => {
    expect(isMeaningfulTransferDecision("twelvechars!!")).toBe(false);
    expect(isMeaningfulTransferDecision("I will test")).toBe(false);
    expect(isMeaningfulTransferDecision("blah blah blah blah")).toBe(false);
    expect(isMeaningfulTransferDecision("test test test test now")).toBe(false);
    expect(isMeaningfulTransferDecision("lorem ipsum lorem ipsum")).toBe(false);
    expect(isMeaningfulTransferDecision("asdf qwerty asdf qwerty")).toBe(false);
    expect(isMeaningfulTransferDecision("n/a n/a n/a n/a")).toBe(false);
    expect(
      isMeaningfulTransferDecision("I will test the narrower boundary"),
    ).toBe(true);
    expect(
      isMeaningfulTransferDecision(
        "Ich prüfe morgen die engere Freigabegrenze.",
      ),
    ).toBe(true);
  });

  it("asks for a concrete prediction as one valid form of transfer evidence", () => {
    const { rerender } = render(
      <LessonProofCheckpoint
        locale="en"
        completed={false}
        progressReady
        prerequisitesMet
        prerequisiteHint=""
        onCommit={() => undefined}
      />,
    );
    expect(
      screen.getByText(/prediction, decision, test, or revision/i),
    ).toBeVisible();

    rerender(
      <LessonProofCheckpoint
        locale="de"
        completed={false}
        progressReady
        prerequisitesMet
        prerequisiteHint=""
        onCommit={() => undefined}
      />,
    );
    expect(
      screen.getByText(/Prognose, Entscheidung, einen Test oder eine Änderung/),
    ).toBeVisible();
  });

  it("requires prior checkpoints and a meaningful decision before committing", () => {
    const onCommit = vi.fn();
    const { rerender } = render(
      <LessonProofCheckpoint
        locale="en"
        completed={false}
        progressReady
        prerequisitesMet={false}
        prerequisiteHint="Confirm every section first."
        onCommit={onCommit}
      />,
    );

    expect(screen.getByLabelText("Decision or revision")).toBeDisabled();
    expect(screen.getByText("Confirm every section first.")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Save checkpoint" }),
    ).toBeDisabled();

    rerender(
      <LessonProofCheckpoint
        locale="en"
        completed={false}
        progressReady
        prerequisitesMet
        prerequisiteHint="Confirm every section first."
        onCommit={onCommit}
      />,
    );
    const response = screen.getByLabelText("Decision or revision");
    fireEvent.change(response, { target: { value: "I will test" } });
    expect(
      screen.getByRole("button", { name: "Save checkpoint" }),
    ).toBeDisabled();

    fireEvent.change(response, {
      target: { value: "I will test the narrower boundary" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save checkpoint" }));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("states the privacy and evidence boundaries without claiming mastery", () => {
    const { rerender } = render(
      <LessonProofCheckpoint
        locale="en"
        completed={false}
        progressReady={false}
        prerequisitesMet
        prerequisiteHint=""
        onCommit={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Loading progress" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/response is not saved or synced/i)).toBeVisible();
    expect(screen.getByText(/not mastery or certification/i)).toBeVisible();

    rerender(
      <LessonProofCheckpoint
        locale="en"
        completed
        progressReady
        prerequisitesMet
        prerequisiteHint=""
        onCommit={() => undefined}
      />,
    );
    expect(screen.getByText("Navigation checkpoint saved")).toBeVisible();
    expect(
      screen.getByText(/not a mastery assessment or credential/i),
    ).toBeVisible();
  });

  it("keeps section state learner-confirmed and locale-specific", () => {
    const onCheck = vi.fn();
    const { rerender } = render(
      <LessonSectionCheckpoint
        locale="de"
        checked={false}
        progressReady
        onCheck={onCheck}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Abschnitt als geprüft bestätigen",
      }),
    );
    expect(onCheck).toHaveBeenCalledTimes(1);

    rerender(
      <LessonSectionCheckpoint
        locale="de"
        checked
        progressReady
        onCheck={onCheck}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Abschnitt geprüft" }),
    ).toBeDisabled();
  });
});

const CHROME_FILES = [
  "lesson-shell.tsx",
  "lesson-proof-checkpoint.tsx",
  "../codex/codex-lesson-reader.tsx",
  "../data-infrastructure/data-infra-lesson-reader.tsx",
  "../imported-courses/claude/claude-lesson-reader.tsx",
  "../ai-native-operator/lesson-reader.tsx",
] as const;

describe("technical lesson chrome design contract", () => {
  it.each(CHROME_FILES)(
    "keeps visible labels at 12px or larger in %s",
    (file) => {
      const source = readFileSync(join(__dirname, file), "utf8");
      expect(source).not.toMatch(
        /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]|\btext-\[0\.(?:5|6\d*|7(?:[0-4]\d*)?)rem\]/,
      );
    },
  );

  it.each(CHROME_FILES)(
    "uses flat, bounded interaction chrome in %s",
    (file) => {
      const source = readFileSync(join(__dirname, file), "utf8");
      expect(source).not.toMatch(/shadow-\[/);
      expect(source).not.toMatch(/hover:-translate/);
      expect(source).not.toMatch(/\btransition-all\b/);
      expect(source).not.toMatch(/\banimate-(?:pulse|bounce)\b/);
    },
  );
});
