import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoLocaleProvider } from "./demo-locale";
import PromptScannerLoader from "./prompt-scanner-loader";

vi.mock("./prompt-scanner-demo", () => ({
  default: () => <div data-testid="prompt-scanner-interactive" />,
}));

let observerCallback: IntersectionObserverCallback | null = null;
let observerOptions: IntersectionObserverInit | undefined;

class TestIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "64px 0px";
  readonly thresholds = [0.01];

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    observerCallback = callback;
    observerOptions = options;
  }

  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

const originalIntersectionObserver = globalThis.IntersectionObserver;

describe("<PromptScannerLoader>", () => {
  beforeEach(() => {
    observerCallback = null;
    observerOptions = undefined;
    globalThis.IntersectionObserver =
      TestIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("reserves the demo height and imports the scanner only near the viewport", async () => {
    const { container } = render(
      <DemoLocaleProvider locale="en">
        <PromptScannerLoader />
      </DemoLocaleProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading practice example…",
    );
    expect(container.firstElementChild).toHaveStyle({ minHeight: "620px" });
    expect(screen.queryByTestId("prompt-scanner-interactive")).toBeNull();
    expect(observerOptions).toEqual({
      rootMargin: "64px 0px",
      threshold: 0.01,
    });

    await act(async () => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(
      await screen.findByTestId("prompt-scanner-interactive"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
