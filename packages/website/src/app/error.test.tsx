import { describe, expect, it, vi, afterEach } from "vitest";
import { Component, type ReactNode } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";
import RootError from "./error";

const pathnameState = vi.hoisted(() => ({ value: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  withScope: (
    callback: (scope: {
      clear: () => void;
      setLevel: (level: string) => void;
      setTag: (key: string, value: string) => void;
    }) => void,
  ) =>
    callback({
      clear: vi.fn(),
      setLevel: vi.fn(),
      setTag: vi.fn(),
    }),
}));

/**
 * Root error boundary (src/app/error.tsx). Guards the two things Next.js relies
 * on this fallback for: it RENDERS a branded, honest recovery UI, and its
 * retry button calls the injected reset() so the segment can
 * re-render. Assertions target roles and the exact German copy, so a wording
 * refresh that keeps the contract stays green while a dropped reset wiring or a
 * missing home escape hatch fails. The boundary must also report the error to
 * Sentry (client errors otherwise never leave the browser) and show the digest
 * as a correlation ID users can quote in support requests.
 */

afterEach(() => {
  cleanup();
  pathnameState.value = "/";
});

describe("src/app/error.tsx", () => {
  it("renders the branded fallback with a home escape hatch", () => {
    render(<RootError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Die Seite konnte nicht geladen werden.",
    );
    expect(
      screen.getByText(
        "Ein unerwarteter Fehler ist aufgetreten. Lade die Anfrage erneut.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zur Startseite" }),
    ).toHaveAttribute("href", "/");
  });

  it("calls reset() when the retry button is activated", () => {
    const reset = vi.fn();
    render(<RootError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Erneut laden" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("reports the error to Sentry and shows the digest as a correlation ID", () => {
    const error = Object.assign(new Error("boom"), { digest: "1234567890" });
    render(<RootError error={error} reset={vi.fn()} />);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "client-boundary-failure",
    );
    expect(screen.getByText("Fehler-ID: 1234567890")).toBeInTheDocument();
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
    expect(
      screen.getByText("Die Seite konnte nicht geladen werden."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Wieder einsatzbereit")).not.toBeInTheDocument();

    // Recover.
    fireEvent.click(screen.getByRole("button", { name: "Erneut laden" }));

    expect(
      screen.queryByText("Die Seite konnte nicht geladen werden."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Wieder einsatzbereit")).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it("renders English recovery copy with a locale-preserving home link", () => {
    pathnameState.value = "/en";
    render(<RootError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The page could not be loaded.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/en",
    );
  });
});
