import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PRINT_SCOPE_FALLBACK_MS,
  PrintSheetButton,
} from "./print-sheet-button";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.printScope;
});

const root = () => document.documentElement;

/** A print media query whose change listeners the test can call. */
function stubPrintMedia() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: false,
    media: "print",
    onchange: null,
    addEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  };
  vi.spyOn(window, "matchMedia").mockImplementation(
    () => query as unknown as MediaQueryList,
  );
  const emit = (matches: boolean) => {
    for (const listener of [...listeners]) {
      listener({ matches } as MediaQueryListEvent);
    }
  };
  return { query, listeners, emit };
}

describe("PrintSheetButton", () => {
  it("keeps the sheet scope after print() returns and clears it on afterprint", () => {
    const seen: (string | undefined)[] = [];
    const print = vi
      .spyOn(window, "print")
      .mockImplementation(() => seen.push(root().dataset.printScope));

    render(<PrintSheetButton label="Fragenliste drucken" />);
    const button = screen.getByRole("button", { name: "Fragenliste drucken" });
    expect(button).toHaveAttribute("type", "button");

    fireEvent.click(button);

    expect(print).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(["sheet"]);
    // A browser that returns from print() before laying out the pages
    // (mobile Safari, Chrome on Android) still sees the scope.
    expect(root()).toHaveAttribute("data-print-scope", "sheet");

    window.dispatchEvent(new Event("afterprint"));
    expect(root()).not.toHaveAttribute("data-print-scope");
  });

  it("clears the scope when the print media query stops matching", () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const media = stubPrintMedia();

    render(<PrintSheetButton label="Print the question list" />);
    fireEvent.click(screen.getByRole("button", { name: "Print the question list" }));

    media.emit(true);
    expect(root()).toHaveAttribute("data-print-scope", "sheet");
    media.emit(false);
    expect(root()).not.toHaveAttribute("data-print-scope");
    expect(media.listeners.size).toBe(0);
  });

  it("falls back to the next pointer press when the browser signals nothing", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "print").mockImplementation(() => {});

    render(<PrintSheetButton label="Fragenliste drucken" />);
    fireEvent.click(screen.getByRole("button", { name: "Fragenliste drucken" }));

    // A press right after the click (the print UI is still opening) is ignored.
    window.dispatchEvent(new Event("pointerdown"));
    expect(root()).toHaveAttribute("data-print-scope", "sheet");

    vi.advanceTimersByTime(PRINT_SCOPE_FALLBACK_MS);
    window.dispatchEvent(new Event("pointerdown"));
    expect(root()).not.toHaveAttribute("data-print-scope");
  });

  it("removes every listener once the scope is cleared", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "print").mockImplementation(() => {});
    const media = stubPrintMedia();
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");

    render(<PrintSheetButton label="Fragenliste drucken" />);
    fireEvent.click(screen.getByRole("button", { name: "Fragenliste drucken" }));
    vi.advanceTimersByTime(PRINT_SCOPE_FALLBACK_MS);
    window.dispatchEvent(new Event("afterprint"));

    const types = (calls: unknown[][]) =>
      calls
        .map(([type]) => type)
        .filter((type) =>
          ["afterprint", "focus", "pointerdown", "keydown"].includes(type as string),
        )
        .sort();
    expect(types(removed.mock.calls)).toEqual(types(added.mock.calls));
    expect(media.listeners.size).toBe(0);

    // A later plain print is not scoped.
    window.dispatchEvent(new Event("focus"));
    expect(root()).not.toHaveAttribute("data-print-scope");
  });

  it("clears the scope when the button unmounts before printing finished", () => {
    vi.spyOn(window, "print").mockImplementation(() => {});

    const { unmount } = render(<PrintSheetButton label="Fragenliste drucken" />);
    fireEvent.click(screen.getByRole("button", { name: "Fragenliste drucken" }));
    expect(root()).toHaveAttribute("data-print-scope", "sheet");

    unmount();
    expect(root()).not.toHaveAttribute("data-print-scope");
  });

  it("does not leave the scope set when window.print throws", () => {
    vi.spyOn(window, "print").mockImplementation(() => {
      throw new Error("printing blocked");
    });

    // React reports an error thrown in a click handler to window "error".
    const reported: string[] = [];
    const onError = (event: ErrorEvent) => {
      reported.push(event.message);
      event.preventDefault();
    };
    window.addEventListener("error", onError);

    render(<PrintSheetButton label="Fragenliste drucken" />);
    fireEvent.click(screen.getByRole("button", { name: "Fragenliste drucken" }));
    window.removeEventListener("error", onError);

    expect(reported.join(" ")).toContain("printing blocked");
    expect(root()).not.toHaveAttribute("data-print-scope");
  });
});
