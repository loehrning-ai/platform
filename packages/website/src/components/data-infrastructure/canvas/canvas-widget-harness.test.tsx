import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useRef, useState, type JSX } from "react";
import { useCanvasRAF } from "./use-canvas-raf";
import { useCanvasAutoSize } from "./use-canvas-size";
import { CanvasFallbackNotice } from "./canvas-fallback";

/**
 * Throwaway integration harness ('s own "done when" bar): a
 * minimal canvas widget composing all three Stage 2 utilities exactly the
 * way every real widget in stages 4-9 will, proving the null-context
 * fallback, the RAF/settled loop, and the DPR-aware resize hook all compose
 * without crashing before any real widget is built on top of them. Not
 * exported, not part of any registry — exists only for this test file.
 */
function TestCanvasWidget(): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);

  useCanvasAutoSize(canvasRef, wrapRef, { minWidth: 200, minHeight: 100 });

  useCanvasRAF(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setContextUnavailable(true);
      return false;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, 10, 10);
    return false;
  });

  if (contextUnavailable) {
    return <CanvasFallbackNotice title="Test widget" summary="A static summary." />;
  }

  return (
    <div ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label="Test canvas widget" />
    </div>
  );
}

describe("canvas widget harness ", () => {
  it("renders a real canvas element when getContext succeeds", () => {
    render(<TestCanvasWidget />);
    expect(screen.getByRole("img", { name: "Test canvas widget" })).toBeInTheDocument();
  });

  it("falls back to a static text summary, without crashing, when getContext('2d') returns null", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;
    try {
      expect(() => render(<TestCanvasWidget />)).not.toThrow();
      expect(screen.getByRole("img", { name: /Test widget\. A static summary\./ })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Test canvas widget" })).not.toBeInTheDocument();
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
      expect(screen.getByRole("img", { name: "Test canvas widget" })).toBeInTheDocument();
    } finally {
      window.matchMedia = original;
    }
  });

  it("does not crash when mounted while the tab is hidden", () => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    try {
      expect(() => render(<TestCanvasWidget />)).not.toThrow();
    } finally {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
    }
  });
});
