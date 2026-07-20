import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EuAiActInline } from "./eu-ai-act-inline";

describe("<EuAiActInline>", () => {
  it("firstMention renders the definition pill alongside the label", () => {
    render(<EuAiActInline firstMention />);
    expect(screen.getByText("EU AI Act")).toBeInTheDocument();
    expect(screen.getByText(/EU-Verordnung 2024\/1689/i)).toBeInTheDocument();
    expect(
      screen.getByTestId("eu-ai-act-first-mention"),
    ).toHaveAttribute("data-eu-ai-act-first", "true");
  });

  it("non-first renders as a Term trigger only (no expanded pill)", () => {
    render(<EuAiActInline />);
    const trigger = screen.getByRole("button", { name: /EU AI Act/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/EU-Verordnung 2024\/1689/),
    ).not.toBeInTheDocument();
  });
});
