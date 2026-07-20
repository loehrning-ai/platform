import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

/**
 * badge.test.tsx (regression coverage)
 *
 * Badge's real behavior is its variant -> semantic-token class mapping: each
 * variant selects a specific border + text colour pair, with "neutral" as the
 * default, on top of the fixed Bauhaus base classes. We assert that contract
 * (mirroring the className-assertion convention in section.test.tsx).
 */

describe("<Badge>", () => {
  it("renders children inside a <span> with the Bauhaus base classes", () => {
    render(<Badge>Hochrisiko</Badge>);
    const el = screen.getByText("Hochrisiko");
    expect(el.tagName).toBe("SPAN");
    // Hard corners, 1px outline, uppercase monospaced-style tag.
    expect(el.className).toContain("rounded-none");
    expect(el.className).toContain("border");
    expect(el.className).toContain("uppercase");
  });

  it("defaults to the neutral variant (stone border + muted text)", () => {
    render(<Badge>Standard</Badge>);
    const el = screen.getByText("Standard");
    expect(el.className).toContain("border-border");
    expect(el.className).toContain("text-muted-foreground");
  });

  it.each([
    ["kupfer", "border-brand-orange", "text-brand-orange"],
    ["green", "border-risk-green", "text-risk-green"],
    ["yellow", "border-risk-yellow", "text-risk-yellow"],
    ["red", "border-risk-red", "text-risk-red"],
    ["sand", "border-brand-sand", "text-brand-sand"],
  ] as const)(
    "maps variant=%s to its semantic border + text classes",
    (variant, border, text) => {
      render(<Badge variant={variant}>Label</Badge>);
      const el = screen.getByText("Label");
      expect(el.className).toContain(border);
      expect(el.className).toContain(text);
    },
  );

  it("merges a custom className without dropping the variant classes", () => {
    render(
      <Badge variant="red" className="ml-4">
        Kritisch
      </Badge>,
    );
    const el = screen.getByText("Kritisch");
    expect(el.className).toContain("ml-4");
    expect(el.className).toContain("border-risk-red");
  });
});
