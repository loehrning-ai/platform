import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PhoneDisclosure } from "./phone-disclosure";

afterEach(cleanup);

describe("<PhoneDisclosure>", () => {
  it("renders the content collapsed below lg only, with a lg:hidden toggle row", () => {
    render(
      <PhoneDisclosure id="bench" label="Prompt-Werkbank ausprobieren">
        <p>Instrument</p>
      </PhoneDisclosure>,
    );

    const toggle = screen.getByRole("button", {
      name: "Prompt-Werkbank ausprobieren",
    });
    expect(toggle).toHaveClass("lg:hidden", "js-shell-only", "min-h-12");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "bench");

    // The content is server markup in its document position; only CSS hides
    // it below lg, so the desktop layout never changes.
    const region = document.getElementById("bench");
    expect(region).toHaveClass("max-lg:hidden");
    expect(region).toContainElement(screen.getByText("Instrument"));
  });

  it("opens and closes on the row", () => {
    render(
      <PhoneDisclosure id="bench" label="Try the prompt workbench">
        <p>Instrument</p>
      </PhoneDisclosure>,
    );
    const toggle = screen.getByRole("button", {
      name: "Try the prompt workbench",
    });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("bench")).not.toHaveClass("max-lg:hidden");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("bench")).toHaveClass("max-lg:hidden");
  });

  it("keeps the label as the name and the hint as the description", () => {
    render(
      <PhoneDisclosure
        id="bench"
        label="Prompt-Werkbank ausprobieren"
        hint="Aktiviere einzelne Bestandteile."
      >
        <p>Instrument</p>
      </PhoneDisclosure>,
    );
    const toggle = screen.getByRole("button", {
      name: "Prompt-Werkbank ausprobieren",
    });
    expect(toggle).toHaveAccessibleDescription(
      "Aktiviere einzelne Bestandteile.",
    );
    expect(screen.getByText("Aktiviere einzelne Bestandteile.")).toHaveClass(
      "text-[13px]",
    );
  });
});
