import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Loading from "./loading";

/**
 * Root loading skeleton (src/app/loading.tsx). A Suspense fallback has one job:
 * render a visible, honest "still working" indicator instead of a blank frame.
 * This asserts the spinner element and the "Laden…" label exist, so a styling
 * refresh stays green while an accidentally-empty skeleton (a blank suspense
 * frame) fails.
 */

afterEach(cleanup);

describe("src/app/loading.tsx", () => {
  it("renders the spinner and the Laden… label", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Laden…");
    expect(screen.getByText("Laden…")).toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
