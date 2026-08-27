import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CareerTimeline } from "./career-timeline";

describe("<CareerTimeline>", () => {
  it("renders one semantic German timeline without duplicate breakpoint markup", () => {
    render(<CareerTimeline locale="de" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Berufliche Stationen" }),
    ).toBeVisible();
    const timeline = screen.getByRole("list", {
      name: "Chronologie der beruflichen Stationen",
    });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(5);

    for (const company of [
      "Amazon",
      "Apple",
      "Red Bull",
      "Meta",
      "loehrning.ai",
    ]) {
      expect(within(timeline).getAllByText(company)).toHaveLength(1);
    }
    for (const period of [
      "2021",
      "2022–2024",
      "2024–2025",
      "2025–2026",
      "Seit 2026",
    ]) {
      expect(within(timeline).getByText(period)).toBeVisible();
    }
    expect(within(timeline).getByText("Aktuell")).toBeVisible();
    expect(timeline).toHaveClass("divide-y", "border-y");
    expect(timeline.closest("section")).toHaveAttribute("data-proof-ledger");
  });

  it("renders complete English copy while preserving employers and chronology", () => {
    render(<CareerTimeline locale="en" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Professional timeline" }),
    ).toBeVisible();
    const timeline = screen.getByRole("list", {
      name: "Chronology of professional roles",
    });
    expect(within(timeline).getByText("Working student")).toBeVisible();
    expect(
      within(timeline).getByText(
        "Data quality, pipelines, and analytics systems.",
      ),
    ).toBeVisible();
    expect(within(timeline).getByText("Current")).toBeVisible();
    expect(within(timeline).queryByText("Werkstudent")).not.toBeInTheDocument();
    expect(within(timeline).queryByText("Aktuell")).not.toBeInTheDocument();
  });

  it("marks employer names as non-translatable and keeps all content static", () => {
    const { container } = render(<CareerTimeline locale="en" />);

    for (const company of [
      "Amazon",
      "Apple",
      "Red Bull",
      "Meta",
      "loehrning.ai",
    ]) {
      expect(screen.getByText(company)).toHaveAttribute("translate", "no");
    }
    expect(container.querySelector(".js-reveal")).toBeNull();
    expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
  });
});
