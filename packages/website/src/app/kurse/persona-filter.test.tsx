import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PersonaCourseLinks } from "./persona-filter";

afterEach(cleanup);

describe("PersonaCourseLinks", () => {
  it("links every German learning objective to its course", () => {
    render(<PersonaCourseLinks locale="de" />);

    const expected = [
      ["Alltag und sicherer Einsatz: direkt zum Kurs KI-Führerschein", "/ki-fuehrerschein"],
      ["Deepfakes und Bias prüfen: direkt zum Kurs KI und Gesellschaft", "/ki-und-gesellschaft"],
      ["Pflichten und Risiken einordnen: direkt zum Kurs EU AI Act Kurs", "/eu-ai-act-kurs"],
      ["KI-Arbeit strukturieren: direkt zum Kurs AI-Native Arbeitskurs", "/ai-native"],
    ] as const;

    for (const [name, href] of expected) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(screen.getAllByRole("link")).toHaveLength(expected.length);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders reviewed English objectives and preserves the locale in every URL", () => {
    render(<PersonaCourseLinks locale="en" />);

    expect(
      screen.getByRole("navigation", {
        name: "Direct course recommendations by learning objective",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Use AI safely at work: open course AI Fundamentals",
      }),
    ).toHaveAttribute("href", "/en/ki-fuehrerschein");
    expect(
      screen.getByRole("link", {
        name: "Structure AI-supported work: open course AI-Native Work Course",
      }),
    ).toHaveAttribute("href", "/en/ai-native");
  });
});
