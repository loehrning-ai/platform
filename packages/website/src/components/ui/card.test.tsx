import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ href, children, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

import { Card, IconTile } from "./card";

function TestIcon({
  className,
  strokeWidth,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      data-testid="icon"
      className={className}
      data-stroke-width={strokeWidth}
    />
  );
}

describe("<Card>", () => {
  it("uses a flat editorial frame without default elevation", () => {
    render(<Card aria-label="Rahmen">Inhalt</Card>);
    const card = screen.getByLabelText("Rahmen");

    expect(card.tagName).toBe("DIV");
    expect(card).toHaveClass(
      "rounded-md",
      "border",
      "border-border",
      "bg-card",
      "p-4",
      "sm:p-6",
    );
    expect(card.className).not.toMatch(/shadow-(?:card|card-hover|tile)/);
  });

  it("renders an accessible link with a 3px accent signal", () => {
    render(
      <Card href="/kurs" accent="kupfer" aria-label="Kurs öffnen">
        Kurs
      </Card>,
    );
    const card = screen.getByRole("link", { name: "Kurs öffnen" });

    expect(card).toHaveAttribute("href", "/kurs");
    expect(card).toHaveClass("border-t-[3px]", "border-t-brand-orange");
    expect(card).toHaveClass(
      "transition-[background-color,border-color]",
      "hover:border-brand-orange",
    );
    expect(card.className).not.toMatch(/translate-|shadow-/);
  });

  it("preserves external-link safety and the interactive override", () => {
    render(
      <Card
        href="https://example.com"
        external
        interactive={false}
        aria-label="Extern"
      >
        Extern
      </Card>,
    );
    const card = screen.getByRole("link", { name: "Extern" });

    expect(card).toHaveAttribute("target", "_blank");
    expect(card).toHaveAttribute("rel", "noopener noreferrer");
    expect(card.className).not.toContain("hover:bg-card-hover");
  });
});

describe("<IconTile>", () => {
  it("uses a bounded, flat 44px marker", () => {
    render(<IconTile icon={TestIcon} />);
    const tile = screen.getByTestId("icon").parentElement;

    expect(tile).toHaveAttribute("aria-hidden", "true");
    expect(tile).toHaveClass(
      "h-11",
      "w-11",
      "rounded-sm",
      "border",
      "border-border",
    );
    expect(tile?.className).not.toMatch(/shadow-/);
    expect(screen.getByTestId("icon")).toHaveAttribute(
      "data-stroke-width",
      "1.75",
    );
  });
});
