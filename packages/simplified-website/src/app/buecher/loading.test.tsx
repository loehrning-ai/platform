import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import BuecherLoading from "./loading";

/**
 * Books segment loading skeleton (src/app/buecher/loading.tsx). Representative of
 * the per-segment loading.tsx pattern: a visible spinner plus a segment-specific
 * "Bücher werden geladen…" label rather than a blank suspense frame. A styling
 * refresh stays green; an accidentally-empty skeleton fails.
 */

afterEach(cleanup);

describe("src/app/buecher/loading.tsx", () => {
  it("renders the spinner and the Bücher werden geladen… label", () => {
    render(<BuecherLoading />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Bücher werden geladen…",
    );
    expect(screen.getByText("Bücher werden geladen…")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
