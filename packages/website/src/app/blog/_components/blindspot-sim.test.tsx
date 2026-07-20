import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlindspotSim } from "./blindspot-sim";

describe("BlindspotSim axis selector", () => {
  it("uses a labelled pressed-button group instead of incomplete tab semantics", () => {
    render(<BlindspotSim />);

    expect(screen.getByRole("group", { name: "Achse wählen" })).toBeInTheDocument();
    const data = screen.getByRole("button", { name: "Daten" });
    const tech = screen.getByRole("button", { name: "Tech" });
    expect(data).toHaveAttribute("aria-pressed", "true");
    expect(tech).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(tech);
    expect(data).toHaveAttribute("aria-pressed", "false");
    expect(tech).toHaveAttribute("aria-pressed", "true");
  });
});
