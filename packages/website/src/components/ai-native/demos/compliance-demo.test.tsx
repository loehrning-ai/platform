import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ComplianceDemo } from "./compliance-demo";

describe("<ComplianceDemo>", () => {
  it("operates its view-mode radio group with roving horizontal focus", () => {
    render(<ComplianceDemo />);
    const group = screen.getByRole("radiogroup", { name: "Ansichtsmodus" });
    const radios = within(group).getAllByRole("radio");

    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1]);
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });

    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios.map((radio) => radio.tabIndex)).toEqual([-1, 0]);

    fireEvent.keyDown(radios[1], { key: "Home" });
    expect(radios[0]).toHaveFocus();
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
  });
});
