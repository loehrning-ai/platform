import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FineTuneDemo } from "./finetune-demo";

/**
 * finetune-demo.test.tsx (regression coverage)
 *
 * Drives the real <FineTuneDemo>. It has no framer-motion (only useState +
 * useMemo), so a plain RTL render exercises the actual behaviour: the prompt
 * picker swaps the base/tuned answer pair from the non-exported PROMPTS table
 * and toggles aria-pressed, and the epoch slider recomputes the deterministic
 * training metrics rendered by the useMemo formula.
 */

describe("<FineTuneDemo>", () => {
  it("shows the first prompt's base and tuned answers on initial render", () => {
    render(<FineTuneDemo />);

    expect(
      screen.getByRole("region", { name: "Fine-Tuning Playground" }),
    ).toBeInTheDocument();
    // PROMPTS[0] is the active pair by default (selIdx = 0).
    expect(
      screen.getByText(/Die Garantie für einen Motor hängt vom Hersteller/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Auf den Motor XR-2200 gewähren wir 36 Monate Garantie/),
    ).toBeInTheDocument();
    // A later prompt's answer is not mounted while it is unselected.
    expect(
      screen.queryByText(/Freigegeben sind 1\.4462 \(Duplex\)/),
    ).not.toBeInTheDocument();
  });

  it("swaps the answer pair and aria-pressed when a different prompt is picked", () => {
    render(<FineTuneDemo />);

    const first = screen.getByRole("button", { name: /PROMPT 01/ });
    const second = screen.getByRole("button", { name: /PROMPT 02/ });
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(second);

    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "false");
    // PROMPTS[1] answers now render; PROMPTS[0] base is unmounted.
    expect(
      screen.getByText(/Für Offshore-Anwendungen werden üblicherweise/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Freigegeben sind 1\.4462 \(Duplex\)/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Die Garantie für einen Motor hängt vom Hersteller/),
    ).not.toBeInTheDocument();
  });

  it("renders the deterministic epoch-0 training metrics", () => {
    render(<FineTuneDemo />);

    // loss = (2.8 - ln(1) * 0.9) -> "2.800"
    expect(screen.getByText("2.800")).toBeInTheDocument();
    // accuracy = min(98, 42 + 0 + sin(0) * 2) -> "42.0%"
    expect(screen.getByText("42.0%")).toBeInTheDocument();
    // Firmenwissen = min(96, 18 + 0) -> "18%"
    expect(screen.getByText("18%")).toBeInTheDocument();
    expect(screen.getByText("0/6")).toBeInTheDocument();
  });

  it("recomputes Firmenwissen and the counter when the epoch slider moves to 6", () => {
    render(<FineTuneDemo />);

    fireEvent.change(screen.getByLabelText("Epoche auswählen"), {
      target: { value: "6" },
    });

    // Firmenwissen = min(96, 18 + 6 * 10) -> "78%"
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("6/6")).toBeInTheDocument();
    // The epoch-0 value is no longer shown.
    expect(screen.queryByText("18%")).not.toBeInTheDocument();
    expect(screen.queryByText("0/6")).not.toBeInTheDocument();
  });
});
