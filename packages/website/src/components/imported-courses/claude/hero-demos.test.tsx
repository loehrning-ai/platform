import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { HeroOrrery } from "./hero-orrery";
import { HeroTransform } from "./hero-transform";

/**
 * Landing-page hero demos. Ported from
 * `claude/js/widgets.js`'s PromptOrrery/PromptTransform: confirmed zero
 * props, no checkpoint, never mounted inside a lesson (source: only
 * `index.html`'s hero section), these are deliberately bespoke,
 * non-registry components, so these tests exercise them directly rather than
 * through the widget registry.
 */

afterEach(() => cleanup());

describe("HeroOrrery", () => {
  it("starts with role+context+task active (quality 68) and constraints/format off", () => {
    render(<HeroOrrery />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Five parts. Toggle each.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Constraints/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("toggling a part updates the quality score live", () => {
    render(<HeroOrrery />);
    fireEvent.click(screen.getByRole("button", { name: /Constraints/i }));
    expect(screen.getByText("84")).toBeInTheDocument();
  });

  it("runs the assembled prompt and shows an output, no checkpoint XP language anywhere", async () => {
    render(<HeroOrrery />);
    fireEvent.click(screen.getByRole("button", { name: /Run live/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Run again/i })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });
});

describe("HeroTransform", () => {
  it("renders three stages, starting at stage 1 (vague)", () => {
    render(<HeroTransform />);
    expect(screen.getByText(/stage 1 \/ 3 · vague/)).toBeInTheDocument();
  });

  it("switching to stage 3 shows the structured prompt and its diagnosis", () => {
    render(<HeroTransform />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByText(/stage 3 \/ 3 · structured/)).toBeInTheDocument();
    expect(screen.getByText(/Claude has everything it needs/)).toBeInTheDocument();
  });

  it("running a stage shows claude's simulated output", async () => {
    render(<HeroTransform />);
    fireEvent.click(screen.getByRole("button", { name: /Run stage 1/i }));
    await waitFor(() =>
      expect(screen.getByText(/Subject: New authentication service/)).toBeInTheDocument(),
    );
  });
});
