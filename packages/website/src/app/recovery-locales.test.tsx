import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BlogError from "./blog/error";
import CourseError from "./ki-fuehrerschein/kurs/error";
import LessonError from "./ki-fuehrerschein/kurs/[blockId]/error";
import OpenSourceError from "./open-source/error";

const pathnameState = vi.hoisted(() => ({ value: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/observability/client-boundary-error", () => ({
  reportClientBoundaryError: vi.fn(),
}));

afterEach(() => {
  cleanup();
  pathnameState.value = "/";
});

describe("localized recovery boundaries", () => {
  it("renders the English blog recovery contract", () => {
    const reset = vi.fn();
    pathnameState.value = "/en/blog";
    render(<BlogError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The blog could not be loaded.",
    );
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it.each([
    [CourseError, "The course content could not be loaded"],
    [LessonError, "The lesson could not be loaded"],
  ] as const)(
    "renders the English course recovery contract",
    (Boundary, title) => {
      const reset = vi.fn();
      pathnameState.value = "/en/ki-fuehrerschein/kurs/block_1";
      render(<Boundary error={new Error("boom")} reset={reset} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        title,
      );
      expect(
        screen.getByRole("link", { name: "Course overview" }),
      ).toHaveAttribute("href", "/en/ki-fuehrerschein/kurs");
      fireEvent.click(screen.getByRole("button", { name: "Reload" }));
      expect(reset).toHaveBeenCalledTimes(1);
    },
  );

  it("renders the English open-source recovery contract", () => {
    const reset = vi.fn();
    pathnameState.value = "/en/open-source";
    render(<OpenSourceError reset={reset} />);

    expect(
      screen.getByRole("heading", {
        name: "The artifact page could not be loaded.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the directory" }),
    ).toHaveAttribute("href", "/en/open-source");
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
