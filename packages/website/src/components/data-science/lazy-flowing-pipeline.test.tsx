import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LazyFlowingPipeline } from "./lazy-flowing-pipeline";

vi.mock("./simulators/flowing-pipeline", () => ({
  FlowingPipeline: () => <div data-testid="flowing-pipeline" />,
}));

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly rootMargin: string;
  private readonly callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "";
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const originalIntersectionObserver = globalThis.IntersectionObserver;

describe("LazyFlowingPipeline", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("reserves the final diagram shape without hydrating the SVG", () => {
    const { container } = render(<LazyFlowingPipeline />);
    expect(container.querySelector(".ov-loop-slot")).not.toBeNull();
    expect(container.querySelector(".ov-loop-placeholder")).not.toBeNull();
    expect(screen.queryByTestId("flowing-pipeline")).toBeNull();
    expect(MockIntersectionObserver.instances[0]?.rootMargin).toBe(
      "0px 0px -50% 0px",
    );
  });

  it("loads the interactive SVG after the reserved slot enters the active viewport", async () => {
    render(<LazyFlowingPipeline />);

    await act(async () => {
      MockIntersectionObserver.instances[0]?.trigger(true);
    });

    expect(await screen.findByTestId("flowing-pipeline")).toBeInTheDocument();
    expect(MockIntersectionObserver.instances[0]?.disconnect).toHaveBeenCalled();
  });
});
