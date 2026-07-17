import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PersonaCourseLinks } from "./persona-filter";

afterEach(() => {
  cleanup();
});

describe("PersonaCourseLinks", () => {
  it("links every learning goal directly to its native course by exact title", () => {
    render(<PersonaCourseLinks />);

    const expected = [
      ["Alltag und sicherer Einsatz: direkt zum Kurs KI-Führerschein", "/ki-fuehrerschein"],
      ["Gesellschaft und Ethik verstehen: direkt zum Kurs KI und Gesellschaft", "/ki-und-gesellschaft"],
      ["Regeln und Einordnen: direkt zum Kurs EU AI Act Kurs", "/eu-ai-act-kurs"],
      ["Aktiv mit KI arbeiten: direkt zum Kurs AI-Native Arbeitskurs", "/ai-native"],
    ] as const;

    for (const [name, href] of expected) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    // All four native Zertifikatskurse are represented.
    expect(screen.getAllByRole("link")).toHaveLength(expected.length);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
