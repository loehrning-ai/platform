import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const motionPreference = vi.hoisted(() => ({ reduced: true }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => motionPreference.reduced,
  };
});

import { CredibilityStrip } from "./credibility-strip";
import { FinalCta } from "./final-cta";
import { Offering } from "./offering";

describe("homepage reduced-motion reveals", () => {
  it("never initializes the offering copy as transparent", () => {
    render(<Offering />);

    expect(screen.getByText("Die Kurse")).not.toHaveStyle({
      opacity: "0",
    });
    expect(
      screen.getByRole("heading", { name: /4 Kurse/ }),
    ).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByText(/arbeite dich vor/)).not.toHaveStyle({
      opacity: "0",
    });
  });

  it("never initializes platform principles as clipped or transparent", () => {
    render(<CredibilityStrip />);

    const firstPrinciple = screen.getByText("Gratis").closest("div.flex");
    expect(firstPrinciple).not.toBeNull();
    expect(firstPrinciple).not.toHaveStyle({
      clipPath: "inset(0 0 100% 0)",
    });
    expect(screen.getByText(/Alles zum Lernen ist offen/)).not.toHaveStyle({
      opacity: "0",
    });
  });

  it("never initializes the closing call to action as transparent", () => {
    render(<FinalCta />);

    expect(
      screen.getByRole("heading", { name: "Lernpfad starten." }),
    ).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByText(/öffentlich lesbar/)).not.toHaveStyle({
      opacity: "0",
    });
    expect(screen.getByText("// loehrning.ai")).not.toHaveStyle({
      opacity: "0",
    });
  });
});
