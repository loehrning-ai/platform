import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "./section";

describe("Section", () => {
  it("renders a semantic <section> with responsive default spacing", () => {
    render(<Section data-testid="s">content</Section>);
    const el = screen.getByTestId("s");
    expect(el.tagName).toBe("SECTION");
    expect(el.className).toContain("py-16");
    expect(el.className).toContain("sm:py-20");
    expect(el.className).toContain("lg:py-24");
    expect(el).toHaveTextContent("content");
  });

  it("applies the hero spacing scale", () => {
    render(<Section spacing="hero" data-testid="s">x</Section>);
    expect(screen.getByTestId("s").className).toContain("lg:py-32");
  });

  it("uses the mobile-safe small viewport unit for fold (svh, not vh)", () => {
    render(<Section fold data-testid="s">x</Section>);
    const cls = screen.getByTestId("s").className;
    expect(cls).toContain("min-h-[100svh]");
    expect(cls).not.toContain("min-h-screen");
  });

  it("vertically centers content only when fold + center", () => {
    render(<Section fold center data-testid="s">x</Section>);
    expect(screen.getByTestId("s").className).toContain("justify-center");
  });

  it("forwards className, id and arbitrary props", () => {
    render(<Section id="hero" data-section="hero" className="bg-card" data-testid="s">x</Section>);
    const el = screen.getByTestId("s");
    expect(el.id).toBe("hero");
    expect(el.getAttribute("data-section")).toBe("hero");
    expect(el.className).toContain("bg-card");
  });

  it("can render a different element via `as`", () => {
    render(<Section as="div" data-testid="s">x</Section>);
    expect(screen.getByTestId("s").tagName).toBe("DIV");
  });
});
