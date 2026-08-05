import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RoiRechnerDemo from "./roi-rechner-demo";

/**
 * roi-rechner-demo.test.tsx (regression coverage)
 *
 * Drives the real <RoiRechnerDemo>. The interesting logic is the transparent
 * cost model (the useMemo chain: users -> hours -> yearly / licenseCost -> net
 * -> roi) plus the slider-driven recompute and the Annahmen accordion.
 *
 * The big KPI figures are rendered through useAnimatedNumber, which snaps to its
 * target immediately under prefers-reduced-motion. We force reduced motion via a
 * matchMedia stub (leaving the useIsNarrow max-width query as no-match, i.e.
 * desktop), so every displayed number equals the exact model output with no
 * requestAnimationFrame in play. Expected values are recomputed by hand from the
 * source formula, not read back from the component:
 *
 *   users        = headcount * adoption/100
 *   hours        = users * hoursPerWeek * 46      (WEEKS_PER_YEAR)
 *   yearly       = round(hours * hourly)
 *   licenseCost  = round(users * 18 * 12)         (LICENSE_PER_USER_PER_MONTH)
 *   net          = yearly - licenseCost
 *   roi          = round(net / licenseCost * 100)
 *
 * Initial inputs 180 MA / 85 EUR-h / 55% / 4h  =>  1.548.360 / 21.384 /
 * 1.526.976 / 7.141. Raising Stundensatz to 100 =>  1.821.600 / 21.384 /
 * 1.800.216 / 8.419 (roi depends only on hourly & hoursPerWeek, so it moves).
 */

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  // Reduced motion => useAnimatedNumber snaps to target; max-width query stays
  // false => desktop two-column grid. Both keep the render deterministic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("<RoiRechnerDemo>", () => {
  it("renders the header and the initial model output from the default inputs", () => {
    render(<RoiRechnerDemo />);

    expect(
      screen.getByText("Annahmen-Rechner · Transparente Formel"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Bauchgefühl.",
    );

    // Yearly value is rendered twice: the big KPI (animated, snapped) and the
    // transparent inline formula (raw). Both must show the exact computed total.
    expect(screen.getAllByText(/1\.548\.360/)).toHaveLength(2);
    // License / net / roi each appear exactly once (in the summary rows).
    expect(screen.getByText(/21\.384/)).toBeInTheDocument();
    expect(screen.getByText(/1\.526\.976/)).toBeInTheDocument();
    expect(screen.getByText(/7\.141/)).toBeInTheDocument();
  });

  it("exposes the four sliders with their default values and accessible ranges", () => {
    render(<RoiRechnerDemo />);

    const adoption = screen.getByLabelText("Adoption");
    expect(adoption).toHaveAttribute("aria-valuenow", "55");
    expect(adoption).toHaveAttribute("aria-valuemin", "10");
    expect(adoption).toHaveAttribute("aria-valuemax", "90");

    // Each slider prints its own value+unit as a single node. "180 MA",
    // "85 €/h" and "55 %" do not recur elsewhere (the inline formula prints the
    // adoption as the decimal "0,55" and splits its units into separate spans).
    expect(screen.getByText("180 MA")).toBeInTheDocument();
    expect(screen.getByText("85 €/h")).toBeInTheDocument();
    expect(screen.getByText("55 %")).toBeInTheDocument();
  });

  it("recomputes yearly, net and roi when the Stundensatz slider changes", () => {
    render(<RoiRechnerDemo />);

    fireEvent.change(screen.getByLabelText("Stundensatz"), {
      target: { value: "100" },
    });

    // New Stundensatz is reflected in the slider readout.
    expect(screen.getByText("100 €/h")).toBeInTheDocument();

    // yearly 1.821.600 (KPI + formula), net 1.800.216, roi 8.419.
    expect(screen.getAllByText(/1\.821\.600/)).toHaveLength(2);
    expect(screen.getByText(/1\.800\.216/)).toBeInTheDocument();
    expect(screen.getByText(/8\.419/)).toBeInTheDocument();

    // License cost is independent of the hourly rate -> unchanged.
    expect(screen.getByText(/21\.384/)).toBeInTheDocument();

    // The old figures are gone.
    expect(screen.queryByText(/1\.548\.360/)).not.toBeInTheDocument();
    expect(screen.queryByText(/7\.141/)).not.toBeInTheDocument();
  });

  it("toggles the Annahmen accordion open and closed", () => {
    render(<RoiRechnerDemo />);

    const toggle = screen.getByRole("button", { name: /Annahmen & Methodik/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Panel body is not mounted while collapsed.
    expect(screen.queryByText(/Rollout scheitert/)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Rollout scheitert/)).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Rollout scheitert/)).not.toBeInTheDocument();
  });
});
