import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FreshnessBadge } from "./freshness-badge";

/**
 * freshness-badge.test.tsx (regression coverage)
 *
 * The badge's logic is two private helpers exercised through the render:
 *   - formatMonthYear(iso): ISO date -> German "Monat Jahr" (de-DE long month,
 *     parsed as local calendar fields so there is no timezone day-shift);
 *   - isOverdue(nextReview): true when nextReview is before today.
 * Plus the riskClass chip and the aria-label. We use dates far in the past /
 * future so the overdue branch is deterministic under any system clock.
 */

// Guaranteed past / future relative to any plausible run date.
const FAR_PAST = "2000-01-01";
const FAR_FUTURE = "2999-12-31";

describe("<FreshnessBadge>", () => {
  it("formats the reviewed date as a German 'Monat Jahr' string", () => {
    render(<FreshnessBadge lastReviewed="2026-03-15" nextReview={FAR_FUTURE} />);
    // de-DE long month: March -> "Maerz" spelled with a real umlaut, proving
    // it is localized rather than echoing the raw ISO input.
    expect(screen.getByText("März 2026")).toBeInTheDocument();
  });

  it("wraps the formatted date in a <time> carrying the raw ISO dateTime", () => {
    render(<FreshnessBadge lastReviewed="2026-10-05" nextReview={FAR_FUTURE} />);
    const time = screen.getByText("Oktober 2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-10-05");
  });

  it("exposes an accessible note whose aria-label states when it was reviewed", () => {
    render(<FreshnessBadge lastReviewed="2026-01-20" nextReview={FAR_FUTURE} />);
    const note = screen.getByRole("note");
    expect(note).toHaveAttribute(
      "aria-label",
      "Inhalt zuletzt geprüft: Januar 2026",
    );
  });

  it("renders the riskClass chip only when the prop is provided", () => {
    const { rerender } = render(
      <FreshnessBadge lastReviewed="2026-04-01" nextReview={FAR_FUTURE} />,
    );
    expect(screen.queryByText("HOCHRISIKO")).toBeNull();

    rerender(
      <FreshnessBadge
        lastReviewed="2026-04-01"
        nextReview={FAR_FUTURE}
        riskClass="HOCHRISIKO"
      />,
    );
    expect(screen.getByText("HOCHRISIKO")).toBeInTheDocument();
  });

  it("shows the overdue warning when nextReview is in the past", () => {
    render(<FreshnessBadge lastReviewed="2020-01-01" nextReview={FAR_PAST} />);
    expect(screen.getByText("Aktualisierung ausstehend")).toBeInTheDocument();
  });

  it("hides the overdue warning when nextReview is in the future", () => {
    render(<FreshnessBadge lastReviewed="2026-01-01" nextReview={FAR_FUTURE} />);
    expect(screen.queryByText("Aktualisierung ausstehend")).toBeNull();
  });
});
