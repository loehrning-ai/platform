import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EuAiActGrundlagenPage from "./page";

describe("EuAiActGrundlagenPage smoke", () => {
  it("renders hero, all seven sections, and the status distinction", () => {
    render(<EuAiActGrundlagenPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /EU AI Act/ }),
    ).toBeInTheDocument();
    for (const id of [
      "grundlagen",
      "risikoklassen",
      "zeitplan",
      "stand",
      "rechte",
      "praxis",
      "quellen",
    ]) {
      expect(document.getElementById(id), `section #${id}`).not.toBeNull();
    }
    const text = document.body.textContent ?? "";
    expect(text).toContain("noch nicht in Kraft");
    expect(text).toContain("2. August 2026");
    expect(text).toContain("2. Dezember 2027");
    expect(text).toContain("16. Juli 2026");
  });
});
