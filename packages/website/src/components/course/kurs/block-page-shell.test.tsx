import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/course/kurs/lesson-layout", () => ({
  LessonLayout: () => <div data-testid="lesson-layout" />,
}));

import { BlockPageShell } from "./block-page-shell";

afterEach(cleanup);

describe("<BlockPageShell>", () => {
  it("uses a two-row phone header and restores the compact desktop row", () => {
    render(
      <BlockPageShell courseSlug="ki-fuehrerschein" blockId="block_1" />,
    );

    const header = screen.getByRole("banner");
    expect(header.firstElementChild).toHaveClass(
      "grid",
      "grid-cols-[minmax(0,1fr)_auto]",
      "sm:flex",
    );
    expect(within(header).getByRole("heading", { level: 1 })).toHaveClass(
      "break-words",
      "sm:inline",
    );
    expect(screen.getByTestId("lesson-layout")).toBeInTheDocument();
  });

  it("renders English block chrome without changing the course path", () => {
    render(
      <BlockPageShell
        courseSlug="ki-fuehrerschein"
        blockId="block_1"
        locale="en"
      />,
    );

    expect(screen.getByRole("link", { name: "All blocks" })).toHaveAttribute(
      "href",
      "/en/ki-fuehrerschein/kurs",
    );
    expect(screen.getByText("Block 1 / 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AI is already here",
    );
  });
});
