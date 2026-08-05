import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { useInView, useInterval } from "./hooks";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: readonly number[] = [];
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function InViewProbe() {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="probe">
      {inView ? "in-view" : "out-of-view"}
    </div>
  );
}

describe("useInView ", () => {
  it("starts false, flips true once IntersectionObserver reports intersecting, then disconnects", () => {
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    MockIntersectionObserver.instances = [];

    const { getByTestId } = render(<InViewProbe />);
    expect(getByTestId("probe").textContent).toBe("out-of-view");

    const observer = MockIntersectionObserver.instances[0];
    act(() => observer.trigger(true));
    expect(getByTestId("probe").textContent).toBe("in-view");
    expect(observer.disconnect).toHaveBeenCalledTimes(1);

    globalThis.IntersectionObserver = original;
  });
});

function IntervalProbe({ ms }: { readonly ms: number | null }) {
  const [count, setCount] = useState(0);
  useInterval(() => setCount((c) => c + 1), ms);
  return <div data-testid="count">{count}</div>;
}

describe("useInterval ", () => {
  it("ticks on the given interval", () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<IntervalProbe ms={100} />);
    expect(getByTestId("count").textContent).toBe("0");
    act(() => vi.advanceTimersByTime(300));
    expect(getByTestId("count").textContent).toBe("3");
  });

  it("does not schedule anything when ms is null", () => {
    vi.useFakeTimers();
    const { getByTestId } = render(<IntervalProbe ms={null} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(getByTestId("count").textContent).toBe("0");
  });
});
