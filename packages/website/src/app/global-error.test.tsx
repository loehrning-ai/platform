import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";
import GlobalError from "./global-error";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
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
 * Global error boundary (src/app/global-error.tsx). This is the last-resort
 * fallback for failures in the ROOT layout itself (fonts, providers, JsonLd),
 * where the normal error.tsx cannot help; it renders its own <html>/<body> with
 * inline styles so it survives a broken Tailwind/font pipeline. Guards that it
 * renders the branded recovery copy and wires reset(). Assertions target the
 * heading role and exact copy, not markup, so a visual refresh stays green.
 * The boundary must also report the error to Sentry (root-layout failures
 * otherwise never leave the browser) and show the digest as a correlation ID.
 *
 * Rendering a full <html>/<body> tree into jsdom's container emits an expected
 * React DOM-nesting warning (invalid nesting), which is swallowed here; the node
 * text is still queryable and the reset contract still holds.
 */

afterEach(() => {
  cleanup();
  usePathnameMock.mockReset();
});

describe("src/app/global-error.tsx", () => {
  it("renders the branded root-failure fallback and calls reset()", () => {
    usePathnameMock.mockReturnValue("/");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const reset = vi.fn();

    render(<GlobalError error={new Error("layout boom")} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Die Anwendung konnte nicht geladen werden.",
    );
    expect(
      screen.getByText(
        "Ein unerwarteter Fehler ist aufgetreten. Lade die Anwendung erneut.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Erneut laden" }));
    expect(reset).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });

  it("reports the error to Sentry and shows the digest as a correlation ID", () => {
    usePathnameMock.mockReturnValue("/");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = Object.assign(new Error("layout boom"), {
      digest: "3123456789",
    });

    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "client-boundary-failure",
    );
    expect(screen.getByText("Fehler-ID: 3123456789")).toHaveStyle({
      color: "#a89070",
    });

    consoleError.mockRestore();
  });

  it("renders English copy for an English route", () => {
    usePathnameMock.mockReturnValue("/en/kurse");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<GlobalError error={new Error("layout boom")} reset={vi.fn()} />);

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The application could not be loaded.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();

    consoleError.mockRestore();
  });
});
