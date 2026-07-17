import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import GlobalError from "./global-error";

/**
 * Global error boundary (src/app/global-error.tsx). This is the last-resort
 * fallback for failures in the ROOT layout itself (fonts, providers, JsonLd),
 * where the normal error.tsx cannot help; it renders its own <html>/<body> with
 * inline styles so it survives a broken Tailwind/font pipeline. Guards that it
 * renders the branded recovery copy and wires reset(). Assertions target the
 * heading role and exact copy, not markup, so a visual refresh stays green.
 *
 * Rendering a full <html>/<body> tree into jsdom's container emits an expected
 * React DOM-nesting warning (invalid nesting), which is swallowed here; the node
 * text is still queryable and the reset contract still holds.
 */

afterEach(cleanup);

describe("src/app/global-error.tsx", () => {
  it("renders the branded root-failure fallback and calls reset()", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const reset = vi.fn();

    render(<GlobalError error={new Error("layout boom")} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Etwas ist schiefgelaufen.",
    );
    expect(
      screen.getByText(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
