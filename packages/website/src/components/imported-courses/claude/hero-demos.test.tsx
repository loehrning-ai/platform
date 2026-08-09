import { describe, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
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
  it("starts with role+context+task active (structure 68) and constraints/format off", () => {
    render(<HeroOrrery locale="en" />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Toggle five prompt components",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Constraints/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("toggling a part updates the structure score live", () => {
    render(<HeroOrrery locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Constraints/i }));
    expect(screen.getByText("84")).toBeInTheDocument();
  });

  it("runs the assembled prompt and shows an output, no checkpoint XP language anywhere", async () => {
    render(<HeroOrrery locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Run simulation/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Run again/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Fixed local rules; no model or API call/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it("renders German controls and simulated output on the German route", async () => {
    render(<HeroOrrery locale="de" />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Fünf Bestandteile ein- und ausschalten",
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Simulation starten/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Erneut ausführen/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/Run simulation|Prompt workbench/),
    ).not.toBeInTheDocument();
  });
});

describe("HeroTransform", () => {
  it("renders three stages, starting at stage 1 (vague)", () => {
    render(<HeroTransform locale="en" />);
    expect(screen.getByText(/stage 1 \/ 3 · vague/i)).toBeInTheDocument();
  });

  it("switching to stage 3 shows the structured prompt and its diagnosis", () => {
    render(<HeroTransform locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByText(/stage 3 \/ 3 · structured/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Role, context, task, constraints, and format are explicit/,
      ),
    ).toBeInTheDocument();
  });

  it("running a stage shows the fixed local output", async () => {
    render(<HeroTransform locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: /Run stage 1/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/Subject: Authentication service change/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Fixed local rules; no model or API call/i),
    ).toBeInTheDocument();
  });

  it("renders German stage chrome and output", async () => {
    render(<HeroTransform locale="de" />);
    expect(screen.getByText(/Stufe 1 \/ 3 · vage/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Stufe 1 simulieren/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Betreff: Neuer Authentifizierungsdienst/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/Simulated output|Not run yet/),
    ).not.toBeInTheDocument();
  });
});
