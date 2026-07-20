import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "./container";

describe("Container", () => {
  it("renders a centered div with the responsive gutter + default max-width", () => {
    render(<Container data-testid="c">x</Container>);
    const el = screen.getByTestId("c");
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("mx-auto");
    expect(el.className).toContain("px-5");
    expect(el.className).toContain("sm:px-6");
    expect(el.className).toContain("lg:px-8");
    expect(el.className).toContain("max-w-6xl");
  });

  it("maps the size prop to the matching max-width", () => {
    render(<Container size="3xl" data-testid="c">x</Container>);
    expect(screen.getByTestId("c").className).toContain("max-w-3xl");
  });

  it("supports a prose measure for long-form copy", () => {
    render(<Container size="prose" data-testid="c">x</Container>);
    expect(screen.getByTestId("c").className).toContain("max-w-prose");
  });

  it("forwards className and arbitrary props", () => {
    render(<Container className="mt-8" id="wrap" data-testid="c">x</Container>);
    const el = screen.getByTestId("c");
    expect(el.className).toContain("mt-8");
    expect(el.id).toBe("wrap");
  });
});
