import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BuecherError from "./error";

/**
 * Books segment error boundary (src/app/buecher/error.tsx). Representative of the
 * per-segment error.tsx pattern: it carries a segment-specific message ("Die
 * Bücher konnten gerade nicht geladen werden") and the same reset()/home
 * contract as the root boundary. Assertions target roles and the exact copy so a
 * wording refresh stays green while a broken reset wiring fails.
 */

afterEach(cleanup);

describe("src/app/buecher/error.tsx", () => {
  it("renders the books-specific fallback with a home escape hatch", () => {
    render(<BuecherError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Etwas ist schiefgelaufen.",
    );
    expect(
      screen.getByText(
        "Die Bücher konnten gerade nicht geladen werden. Bitte versuch es noch einmal.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("calls reset() when the retry button is activated", () => {
    const reset = vi.fn();
    render(<BuecherError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
