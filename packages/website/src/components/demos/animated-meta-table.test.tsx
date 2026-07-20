import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedMetaTable } from "./animated-meta-table";

/**
 * animated-meta-table.test.tsx (regression coverage)
 *
 * Drives the real <AnimatedMetaTable>. Two paths are exercised:
 *
 *  - Off-screen: the polyfilled IntersectionObserver never intersects, so the
 *    count-up stays inactive and every value renders verbatim (including
 *    non-numeric ones and the empty-meta edge case).
 *  - In-view: we remove IntersectionObserver to hit the immediate-active
 *    fallback and drive requestAnimationFrame straight to the final frame, so
 *    the private formatLike must reconstruct the exact de-DE formatted target.
 */

describe("<AnimatedMetaTable>", () => {
  it("renders every label and value verbatim while off-screen", () => {
    const meta = [
      { label: "Zeitersparnis", value: "3,5 Std." },
      { label: "Genauigkeit", value: "98,2 %" },
      { label: "Status", value: "Aktiv" },
    ] as const;

    render(<AnimatedMetaTable meta={meta} />);

    expect(screen.getByText("Zeitersparnis")).toBeInTheDocument();
    expect(screen.getByText("3,5 Std.")).toBeInTheDocument();
    expect(screen.getByText("Genauigkeit")).toBeInTheDocument();
    expect(screen.getByText("98,2 %")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    // A value with no digits is passed straight through.
    expect(screen.getByText("Aktiv")).toBeInTheDocument();
  });

  it("renders only the container (no rows) for an empty meta list", () => {
    const { container } = render(<AnimatedMetaTable meta={[]} />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });

  it("counts a numeric value up to its exact de-DE formatted target when in view", async () => {
    // Removing IntersectionObserver forces setActive(true) immediately; the
    // rAF stub jumps past the 800ms duration so the counter lands on its final
    // frame in one call. The final value must equal the original input, which
    // only holds if the number parse + formatLike round-trip correctly.
    const savedIO = globalThis.IntersectionObserver;
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(performance.now() + 1000);
        return 1;
      });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).IntersectionObserver;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).IntersectionObserver;

      render(<AnimatedMetaTable meta={[{ label: "Umsatz", value: "1.234,5" }]} />);

      expect(await screen.findByText("1.234,5")).toBeInTheDocument();
    } finally {
      raf.mockRestore();
      globalThis.IntersectionObserver = savedIO;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).IntersectionObserver = savedIO;
    }
  });
});
