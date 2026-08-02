import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DiscoverySpeedrun } from "./discovery-speedrun";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("DiscoverySpeedrun ", () => {
  it("shows the intro screen with all 6 shortcuts before starting", () => {
    render(<DiscoverySpeedrun />);
    expect(screen.getByText("Discovery Speedrun")).toBeInTheDocument();
    expect(screen.getByText("ht <table>")).toBeInTheDocument();
    expect(screen.getByText("wut <term>")).toBeInTheDocument();
  });

  it("starts the run and shows question 1 of 5", () => {
    render(<DiscoverySpeedrun />);
    fireEvent.click(screen.getByRole("button", { name: /Start speedrun/ }));
    expect(screen.getByText("question 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Shortcut answer" })).toHaveAttribute(
      "name",
      "shortcut",
    );
  });

  it("submitting the correct shortcut advances to question 2 and shows the result", () => {
    render(<DiscoverySpeedrun />);
    fireEvent.click(screen.getByRole("button", { name: /Start speedrun/ }));
    const input = screen.getByPlaceholderText("type a shortcut…");
    fireEvent.change(input, { target: { value: "ht dim_users" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText("question 2 of 5")).toBeInTheDocument();
    expect(screen.getByText(/answered/)).toBeInTheDocument();
  });

  it("shows the tip banner with a time penalty when requested", () => {
    render(<DiscoverySpeedrun />);
    fireEvent.click(screen.getByRole("button", { name: /Start speedrun/ }));
    fireEvent.click(screen.getByRole("button", { name: /Show tip/ }));
    expect(screen.getByText("Tip:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tip shown/ })).toBeDisabled();
  });
});
