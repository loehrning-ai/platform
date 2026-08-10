import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Callout } from "./callout";

describe("Callout ", () => {
  it("renders a quote callout with text and attribution", () => {
    render(
      <Callout
        c={{ kind: "quote", text: "Ship it.", attr: "Someone · 2026" }}
      />,
    );
    expect(screen.getByText(/Ship it\./)).toBeInTheDocument();
    expect(screen.getByText("Someone · 2026")).toBeInTheDocument();
  });

  it("renders a spec callout with a heading and pre-formatted lines", () => {
    render(
      <Callout
        c={{
          kind: "spec",
          h: "Example spec",
          lines: ["# Goal", "Do the thing."],
        }}
      />,
    );
    expect(screen.getByText("Example spec")).toBeInTheDocument();
    expect(screen.getByText("# Goal")).toBeInTheDocument();
    expect(screen.getByText("Do the thing.")).toBeInTheDocument();
  });

  it("renders a note callout", () => {
    render(<Callout c={{ kind: "note", h: "A note", text: "Some detail." }} />);
    expect(screen.getByText("A note")).toBeInTheDocument();
    expect(screen.getByText("Some detail.")).toBeInTheDocument();
  });

  it("renders a warn callout", () => {
    render(
      <Callout c={{ kind: "warn", h: "Failure mode", text: "Watch out." }} />,
    );
    expect(screen.getByText("Failure mode")).toBeInTheDocument();
    expect(screen.getByText("Watch out.")).toBeInTheDocument();
  });
});
