import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathnameState = vi.hoisted(() => ({
  value: "/en/ki-und-gesellschaft/kurs",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@/lib/observability/client-boundary-error", () => ({
  reportClientBoundaryError: vi.fn(),
}));

import CourseError from "./kurs/error";
import BlockError from "./kurs/[blockId]/error";

afterEach(cleanup);

const error = Object.assign(new Error("private detail"), { digest: "opaque" });
const reset = vi.fn();

describe("KI und Gesellschaft error-boundary localization", () => {
  it("renders English course and block recovery controls under /en", () => {
    pathnameState.value = "/en/ki-und-gesellschaft/kurs";
    const course = render(<CourseError error={error} reset={reset} />);
    expect(
      screen.getByRole("heading", { name: "The course could not be loaded" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to course" })).toHaveAttribute(
      "href",
      "/en/ki-und-gesellschaft/kurs",
    );
    course.unmount();

    pathnameState.value = "/en/ki-und-gesellschaft/kurs/block_1";
    render(<BlockError error={error} reset={reset} />);
    expect(
      screen.getByRole("heading", { name: "The lesson could not be loaded" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to course overview" }),
    ).toHaveAttribute("href", "/en/ki-und-gesellschaft/kurs");
  });

  it("preserves German recovery copy and unprefixed destinations", () => {
    pathnameState.value = "/ki-und-gesellschaft/kurs";
    render(<CourseError error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Der Kurs konnte nicht geladen werden" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zurück zum Kurs" })).toHaveAttribute(
      "href",
      "/ki-und-gesellschaft/kurs",
    );
  });
});
