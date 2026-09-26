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
    // Newest first: the current station opens the list, and it is marked
    // once, in its period cell, in Mennige text (no chip box).
    const items = within(timeline).getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-current");
    expect(within(items[0]!).getByText("loehrning.ai")).toBeVisible();
    expect(within(items[4]!).getByText("Amazon")).toBeVisible();
    const current = within(timeline).getByText("Aktuell");
    expect(current).toHaveClass("text-brand-orange");
    expect(current.className).not.toMatch(/\bborder\b/);
    expect(current.closest("p")).toHaveTextContent("Seit 2026");
    expect(timeline).toHaveClass("relative");
    expect(timeline).not.toHaveClass("divide-y", "border-y");
    expect(timeline.closest("section")).toHaveAttribute("data-proof-ledger");
    // Hairline ledger: the current station is marked by an ink square and a
    // sentence-case word, never by a tinted row or mono all-caps.
    expect(timeline.innerHTML).not.toMatch(/bg-brand-|uppercase|font-mono/);
    expect(within(timeline).getByText("Aktuell")).not.toHaveClass("uppercase");
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

  it("marks former employers in ink and states that this is no endorsement", () => {
    render(<CareerTimeline locale="de" />);
    const section = screen
      .getByRole("list", { name: "Chronologie der beruflichen Stationen" })
      .closest("section")!;
    for (const employer of ["Apple", "Red Bull", "Meta"]) {
      const mark = section.querySelector(`[data-employer-mark="${employer}"]`);
      expect(mark).not.toBeNull();
      expect(mark).toHaveAttribute("aria-hidden", "true");
      expect(mark).toHaveAttribute("fill", "currentColor");
    }
    expect(
      within(section).getByText(/ausschließlich der biografischen Einordnung/),
    ).toBeVisible();
    expect(within(section).getByText("2021 bis heute")).toBeInTheDocument();
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
