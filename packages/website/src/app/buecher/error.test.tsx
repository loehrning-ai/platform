import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BuecherError from "./error";

const pathnameState = vi.hoisted(() => ({ value: "/buecher" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

/**
 * Books segment error boundary (src/app/buecher/error.tsx). Representative of the
 * per-segment error.tsx pattern: it carries a segment-specific message ("Die
 * Bücher konnten gerade nicht geladen werden") and the same reset()/home
 * contract as the root boundary. Assertions target roles and the exact copy so a
 * wording refresh stays green while a broken reset wiring fails.
 */

afterEach(() => {
  cleanup();
  pathnameState.value = "/buecher";
});

describe("src/app/buecher/error.tsx", () => {
  it("renders the books-specific fallback with a home escape hatch", () => {
    render(<BuecherError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Die Buchseite konnte nicht geladen werden.",
    );
    expect(
      screen.getByText(
        "Der Buchbestand wurde nicht ersetzt. Lade die geprüfte Fassung erneut.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zur Startseite" }),
    ).toHaveAttribute("href", "/");
  });

  it("calls reset() when the retry button is activated", () => {
    const reset = vi.fn();
    render(<BuecherError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Erneut laden" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renders English recovery copy and a locale-preserving home link", () => {
    pathnameState.value = "/en/buecher";
    render(<BuecherError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The book page could not be loaded.",
    );
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en",
    );
  });
});
