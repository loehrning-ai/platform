import { describe, expect, it, vi, afterEach } from "vitest";
import { Component, type ReactNode } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import RootError from "./error";

/**
 * Root error boundary (src/app/error.tsx). Guards the two things Next.js relies
 * on this fallback for: it RENDERS a branded, honest recovery UI, and its
 * "Erneut versuchen" button calls the injected reset() so the segment can
 * re-render. Assertions target roles and the exact German copy, so a wording
 * refresh that keeps the contract stays green while a dropped reset wiring or a
 * missing home escape hatch fails.
 */

afterEach(cleanup);

describe("src/app/error.tsx", () => {
  it("renders the branded fallback with a home escape hatch", () => {
    render(<RootError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Etwas ist schiefgelaufen.",
    );
    expect(
      screen.getByText(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuch es noch einmal.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Startseite" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("calls reset() when the retry button is activated", () => {
    const reset = vi.fn();
    render(<RootError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("recovers a thrown child once reset() lets it stop throwing", () => {
    // A minimal React error boundary that renders RootError as its fallback,
    // exactly as the App Router wires error.tsx around a segment. reset() clears
    // the boundary AND lets the child stop throwing, proving throw -> fallback ->
    // reset -> recovered content end to end.
    let shouldThrow = true;

    function Boom() {
      if (shouldThrow) throw new Error("child boom");
      return <p>Wieder einsatzbereit</p>;
    }

    class ResetBoundary extends Component<
      { children: ReactNode },
      { hasError: boolean }
    > {
      state = { hasError: false };
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      render(): ReactNode {
        if (this.state.hasError) {
          return (
            <RootError
              error={new Error("child boom")}
              reset={() => {
                shouldThrow = false;
                this.setState({ hasError: false });
              }}
            />
          );
        }
        return this.props.children;
      }
    }

    // React logs caught render errors to console.error even inside a boundary;
    // swallow that expected noise so the suite stays quiet.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ResetBoundary>
        <Boom />
      </ResetBoundary>,
    );

    // Fallback is showing.
    expect(screen.getByText("Etwas ist schiefgelaufen.")).toBeInTheDocument();
    expect(screen.queryByText("Wieder einsatzbereit")).not.toBeInTheDocument();

    // Recover.
    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));

    expect(
      screen.queryByText("Etwas ist schiefgelaufen."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Wieder einsatzbereit")).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
