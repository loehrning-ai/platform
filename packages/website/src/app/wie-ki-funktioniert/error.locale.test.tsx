import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WieKiFunktioniertError from "./error";
import WieKiFunktioniertNotFound from "./not-found";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/wie-ki-funktioniert/lektion-unknown",
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: async () => "en",
}));

vi.mock("@/lib/observability/client-boundary-error", () => ({
  reportClientBoundaryError: vi.fn(),
}));

describe("wie-ki-funktioniert localized boundaries", () => {
  it("keeps the English error boundary on the English route", () => {
    render(
      <WieKiFunktioniertError
        error={new Error("test")}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "The learning sequence could not be loaded.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the overview" }),
    ).toHaveAttribute("href", "/en/wie-ki-funktioniert");
  });

  it("renders the localized not-found boundary with a safe return path", async () => {
    render(await WieKiFunktioniertNotFound());

    expect(
      screen.getByRole("heading", { name: "Lesson not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the overview" }),
    ).toHaveAttribute("href", "/en/wie-ki-funktioniert");
  });
});
