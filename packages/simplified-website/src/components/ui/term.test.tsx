import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Term } from "./term";

describe("<Term>", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as { plausible?: unknown }).plausible;
  });

  afterEach(() => {
    delete (window as unknown as { plausible?: unknown }).plausible;
  });

  it("renders the label with a dotted underline and title attribute", () => {
    render(<Term label="EU AI Act" short="A definition." />);
    const trigger = screen.getByRole("button", { name: /EU AI Act/i });
    expect(trigger).toHaveAttribute("title", "A definition.");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger.className).toMatch(/underline/);
  });

  it("renders custom children when provided", () => {
    render(
      <Term label="Term" short="short">
        <strong>custom</strong>
      </Term>,
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
  });

  it("opens and closes on click", () => {
    render(<Term label="Retainer" short="monthly fee" />);
    const trigger = screen.getByRole("button", { name: /Retainer/i });
    act(() => {
      fireEvent.click(trigger);
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    act(() => {
      fireEvent.click(trigger);
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens via Enter/Space keyboard", () => {
    render(<Term label="API" short="Programmierschnittstelle" />);
    const trigger = screen.getByRole("button", { name: /API/i });
    act(() => {
      fireEvent.keyDown(trigger, { key: "Enter" });
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    act(() => {
      fireEvent.keyDown(trigger, { key: " " });
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape", () => {
    render(<Term label="DMARC" short="mail security" />);
    const trigger = screen.getByRole("button", { name: /DMARC/i });
    act(() => {
      fireEvent.click(trigger);
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on outside click", () => {
    render(
      <div>
        <Term label="Datenmodell" short="schema" />
        <div data-testid="outside">outside</div>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: /Datenmodell/i });
    act(() => {
      fireEvent.click(trigger);
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    act(() => {
      fireEvent.mouseDown(screen.getByTestId("outside"));
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("fires analytics event once per mount (privacy hardening: console.debug only, no plausible/posthog)", () => {
    // After privacy hardening analytics.ts cleanup, track() dispatches to console.debug only.
    // Plausible and PostHog are no longer providers.
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    render(<Term label="Governance" short="rules" id="governance" />);
    const trigger = screen.getByRole("button", { name: /Governance/i });
    act(() => {
      fireEvent.click(trigger);
    });
    act(() => {
      fireEvent.click(trigger);
    });
    act(() => {
      fireEvent.click(trigger);
    });
    // Should fire exactly once on first open (de-duplication by Term component)
    const termCalls = debug.mock.calls.filter(
      (c) => c[0] === "[analytics]" && c[1] === "term_opened",
    );
    expect(termCalls).toHaveLength(1);
    expect(termCalls[0][2]).toEqual({ term_id: "governance" });
  });
});
