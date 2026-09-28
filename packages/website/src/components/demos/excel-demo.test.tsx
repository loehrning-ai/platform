import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ExcelDemo from "./excel-demo";

/**
 * excel-demo.test.tsx (regression coverage)
 *
 * The forecast tab computes its four weekly rows from a real growth-rate
 * slider (compound growth + rate-scaled uncertainty), not a canned array —
 * this covers that computation and its visible failure beat, which no other
 * test file exercises today.
 */

function openForecastTab() {
  render(<ExcelDemo />);
  fireEvent.click(screen.getByRole("button", { name: /Forecast KW 17 bis 20/ }));
}

describe("<ExcelDemo> forecast tab", () => {
  it("renders the default growth rate and no warning below the threshold", () => {
    openForecastTab();

    // The rate label appears twice: the slider header and the trend line.
    expect(screen.getAllByText("+8 %").length).toBe(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("recomputes the trend and forecast values when the growth rate changes", () => {
    openForecastTab();

    const slider = screen.getByRole("slider", {
      name: "Angenommenes wöchentliches Wachstum in Prozent",
    });
    fireEvent.change(slider, { target: { value: "0" } });

    // 0% growth: every week's prediction equals the 492 base.
    expect(screen.getAllByText("+0 %").length).toBe(2);
    expect(screen.getAllByText("492").length).toBeGreaterThan(0);
  });

  it("shows the failure beat once the assumed growth rate is unrealistic", () => {
    openForecastTab();

    const slider = screen.getByRole("slider", {
      name: "Angenommenes wöchentliches Wachstum in Prozent",
    });
    fireEvent.change(slider, { target: { value: "25" } });

    expect(screen.getAllByText("+25 %").length).toBe(2);
    expect(screen.getByRole("alert")).toHaveTextContent(/unzuverlässig/);
  });
});

describe("<ExcelDemo> sheet on phones", () => {
  it("shows five rows below sm until the status bar opens all nine", () => {
    render(<ExcelDemo />);
    const sheet = screen.getByRole("region", { name: "Beispiel-Arbeitsblatt" });
    const rows = within(sheet).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(9);
    expect(rows.slice(0, 5).every((row) => !row.classList.contains("max-sm:hidden"))).toBe(true);
    expect(rows.slice(5).every((row) => row.classList.contains("max-sm:hidden"))).toBe(true);

    const toggle = screen.getByRole("button", { name: "Alle 9 Zeilen" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", sheet.id);
    expect(toggle).toHaveClass("min-h-11", "sm:hidden");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      within(sheet).getAllByRole("row").some((row) => row.classList.contains("max-sm:hidden")),
    ).toBe(false);
  });
});
