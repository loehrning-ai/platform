import { afterEach, describe, it, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef, useState, type JSX } from "react";
import { useAutoSizedCanvasRAF } from "./use-auto-sized-canvas-raf";
import { CanvasFallbackNotice } from "./canvas-fallback";

/**
 * Throwaway integration harness ('s own "done when" bar): a
 * minimal canvas widget composing all three Stage 2 utilities exactly the
 * way every real widget in stages 4-9 will, proving the null-context
 * fallback, the RAF/settled loop, and the DPR-aware resize hook all compose
 * without crashing before any real widget is built on top of them. Not
 * exported, not part of any registry — exists only for this test file.
 */
interface TestCanvasWidgetProps {
  readonly minWidth?: number;
  readonly onDraw?: (width: number, height: number) => void;
}

function TestCanvasWidget({
  minWidth = 200,
  onDraw,
}: TestCanvasWidgetProps = {}): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);

  useAutoSizedCanvasRAF(
    canvasRef,
    wrapRef,
    () => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setContextUnavailable(true);
        return false;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillRect(0, 0, 10, 10);
      onDraw?.(canvas.width, canvas.height);
      return false;
    },
    { minWidth, minHeight: 100 },
  );

  if (contextUnavailable) {
    return (
      <CanvasFallbackNotice title="Test widget" summary="A static summary." />
    );
  }

  return (
    <div ref={wrapRef} data-canvas-test-wrap="">
      <canvas ref={canvasRef} role="img" aria-label="Test canvas widget" />
    </div>
  );
}

type ResizeCallback = () => void;

function installMockResizeObserver(): {
  fireAll: () => void;
} {
  const callbacks: ResizeCallback[] = [];
  class MockResizeObserver {
    private readonly callback: ResizeCallback;

    constructor(callback: ResizeCallback) {
      this.callback = callback;
    }

    observe(): void {
      callbacks.push(this.callback);
    }

    unobserve(): void {}
    disconnect(): void {}
  }

  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  return { fireAll: () => callbacks.forEach((callback) => callback()) };
}

function rect(width: number, height: number): DOMRect {
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("canvas widget harness ", () => {
  it("renders a real canvas element when getContext succeeds", () => {
    render(<TestCanvasWidget />);
    expect(
      screen.getByRole("img", { name: "Test canvas widget" }),
    ).toBeInTheDocument();
  });

  it("falls back to a static text summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue(null) as any;
    try {
      expect(() => render(<TestCanvasWidget />)).not.toThrow();
      expect(
        screen.getByRole("img", { name: /Test widget\. A static summary\./ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("img", { name: "Test canvas widget" }),
      ).not.toBeInTheDocument();
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("under prefers-reduced-motion, still renders its single static frame without crashing", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;
    try {
      expect(() => render(<TestCanvasWidget />)).not.toThrow();
      expect(
        screen.getByRole("img", { name: "Test canvas widget" }),
      ).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });

  it("does not crash when mounted while the tab is hidden", () => {
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    try {
      expect(() => render(<TestCanvasWidget />)).not.toThrow();
    } finally {
      Object.defineProperty(document, "hidden", {
        value: false,
        configurable: true,
      });
    }
  });

  it("redraws a settled canvas when a closed disclosure becomes measurable", () => {
    const resizeObserver = installMockResizeObserver();
    const rafCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement): DOMRect {
        if (this.dataset.canvasTestWrap !== undefined) {
          const isOpen = this.closest("details")?.open ?? true;
          return isOpen ? rect(400, 150) : rect(0, 0);
        }
        return rect(0, 0);
      },
    );

    const onDraw = vi.fn();
    const { container } = render(
      <details>
        <summary>Show canvas</summary>
        <TestCanvasWidget minWidth={0} onDraw={onDraw} />
      </details>,
    );

    expect(onDraw).toHaveBeenCalledTimes(1);
    expect(rafSpy).not.toHaveBeenCalled();

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    act(() => {
      if (details) details.open = true;
      resizeObserver.fireAll();
    });
    expect(rafSpy).toHaveBeenCalledTimes(1);

    const pending = rafCallbacks.splice(0);
    act(() => pending.forEach((callback) => callback(16)));

    const dpr = window.devicePixelRatio || 1;
    expect(onDraw).toHaveBeenCalledTimes(2);
    expect(onDraw).toHaveBeenLastCalledWith(
      Math.round(400 * dpr),
      Math.round(150 * dpr),
    );
  });

  it("does not redraw after a ResizeObserver callback with an unchanged size", () => {
    const resizeObserver = installMockResizeObserver();
    const rafCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement): DOMRect {
        return this.dataset.canvasTestWrap !== undefined
          ? rect(400, 150)
          : rect(0, 0);
      },
    );

    const onDraw = vi.fn();
    render(<TestCanvasWidget minWidth={0} onDraw={onDraw} />);

    expect(onDraw).toHaveBeenCalledTimes(1);
    expect(rafSpy).toHaveBeenCalledTimes(1);
    const pending = rafCallbacks.splice(0);
    act(() => pending.forEach((callback) => callback(16)));
    expect(onDraw).toHaveBeenCalledTimes(2);

    act(() => resizeObserver.fireAll());

    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(onDraw).toHaveBeenCalledTimes(2);
  });
});
