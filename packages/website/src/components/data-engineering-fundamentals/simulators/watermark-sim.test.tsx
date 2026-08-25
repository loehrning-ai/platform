import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { WatermarkSim } from "./watermark-sim";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function installMockResizeObserver(): {
  fireAll: () => void;
  disconnect: ReturnType<typeof vi.fn>;
} {
  const observers: Array<{ active: boolean; callback: () => void }> = [];
  const disconnect = vi.fn();
  class MockResizeObserver {
    readonly callback: () => void;
    active = false;

    constructor(callback: () => void) {
      this.callback = callback;
      observers.push(this);
    }

    observe(): void {
      this.active = true;
    }

    unobserve(): void {}
    disconnect(): void {
      this.active = false;
      disconnect();
    }
  }

  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  return {
    disconnect,
    fireAll: () => {
      for (const observer of observers) {
        if (observer.active) observer.callback();
      }
    },
  };
}

describe("WatermarkSim ", () => {
  it("renders the readout grid and default middle window", () => {
    render(<WatermarkSim />);
    expect(screen.getByRole("region", { name: "Event-time and watermark timeline" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Included")).toBeInTheDocument();
    expect(screen.getByText("Late · dropped")).toBeInTheDocument();
    expect(screen.getByText("middle window")).toBeInTheDocument();
  });

  it("moves the watermark and switches mode via the range input", () => {
    render(<WatermarkSim />);
    const [watermarkSlider] = screen.getAllByRole("slider");
    fireEvent.change(watermarkSlider, { target: { value: "900" } });
    expect(screen.getByText("wide window")).toBeInTheDocument();
  });

  it("centers the watermark after a closed disclosure becomes measurable", () => {
    const resizeObserver = installMockResizeObserver();
    const { container } = render(<WatermarkSim />);
    const viewport = container.querySelector<HTMLElement>(".wm-stage-scroll");
    const stage = container.querySelector<HTMLElement>(".wm-stage");
    expect(viewport).not.toBeNull();
    expect(stage).not.toBeNull();
    expect(viewport?.scrollLeft).toBe(0);

    Object.defineProperties(viewport!, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 1000 },
    });
    Object.defineProperty(stage!, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    resizeObserver.fireAll();

    expect(viewport?.scrollLeft).toBe(520);
    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it("does not recenter after the learner moves the watermark and the viewport resizes", () => {
    const resizeObserver = installMockResizeObserver();
    const { container } = render(<WatermarkSim />);
    const viewport = container.querySelector<HTMLElement>(".wm-stage-scroll");
    const stage = container.querySelector<HTMLElement>(".wm-stage");
    expect(viewport).not.toBeNull();
    expect(stage).not.toBeNull();

    Object.defineProperties(viewport!, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 1000 },
    });
    Object.defineProperty(stage!, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    resizeObserver.fireAll();
    expect(viewport?.scrollLeft).toBe(520);

    const [watermarkSlider] = screen.getAllByRole("slider");
    fireEvent.change(watermarkSlider, { target: { value: "900" } });
    viewport!.scrollLeft = 275;
    Object.defineProperty(viewport!, "clientWidth", {
      configurable: true,
      value: 300,
    });
    resizeObserver.fireAll();

    expect(screen.getByText("wide window")).toBeInTheDocument();
    expect(viewport?.scrollLeft).toBe(275);
  });

  it("starts no event interval before explicit Start and pauses after activation", () => {
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    render(<WatermarkSim />);

    const eventIntervalStarted = () =>
      intervalSpy.mock.calls.some(([, delay]) => delay === 420);
    expect(eventIntervalStarted()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Start stream/ }));
    expect(eventIntervalStarted()).toBe(true);
    const btn = screen.getByRole("button", { name: /Pause stream/ });
    fireEvent.click(btn);
    expect(
      screen.getByRole("button", { name: /Start stream/ }),
    ).toBeInTheDocument();
  });
});
