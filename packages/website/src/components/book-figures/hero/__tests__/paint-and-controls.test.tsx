import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PALETTES, compileFeld, createFrameBuffer, feldFrame, type FieldData } from "@/lib/figures";
import { BLOCKS, CURVE, FIELD, NETWORK, SLOPE } from "@/lib/figures/__tests__/fixtures-hero";
import { paintFeld, type PaintContext } from "../canvas-paint";
import { useVariantShift } from "../use-variant-shift";
import { VariantControl } from "../variant-control";

function recorder() {
  const log = { fills: [] as Array<{ style: string; rects: number }>, strokes: 0, rects: [] as number[][] };
  let style = "";
  let pending: number[][] = [];
  const ctx: PaintContext = {
    get fillStyle() {
      return style;
    },
    set fillStyle(v) {
      style = String(v);
    },
    strokeStyle: "",
    lineWidth: 1,
    setTransform: () => undefined,
    clearRect: () => undefined,
    beginPath: () => {
      pending = [];
    },
    rect: (x, y, w, h) => {
      pending.push([x, y, w, h]);
      log.rects.push([x, y, w, h]);
    },
    fill: () => log.fills.push({ style, rects: pending.length }),
    stroke: () => {
      log.strokes += 1;
    },
  };
  return { ctx, log };
}

const data = FIELD.data as FieldData;
const VIEW = { width: 340, height: 300 };
const opts = (scene: number, focus = -1) => ({ pal: PALETTES.web, dpr: 1, width: VIEW.width, height: VIEW.height, scene, focus });

describe("paintFeld", () => {
  const model = compileFeld(data, VIEW);
  const buf = createFrameBuffer(model);

  it("draws a whole field with three batched fills at most", () => {
    feldFrame(model, 0.2, buf);
    const { ctx, log } = recorder();
    const fills = paintFeld(ctx, buf, model, opts(0));
    expect(fills).toBeLessThanOrEqual(3);
    expect(log.fills.length).toBe(fills);
    expect(log.fills.reduce((s, f) => s + f.rects, 0)).toBeGreaterThanOrEqual(900);
  });

  it("uses only the three palette colours for the fills", () => {
    feldFrame(model, 0.2, buf);
    const { ctx, log } = recorder();
    paintFeld(ctx, buf, model, opts(0));
    for (const f of log.fills) expect([PALETTES.web.track, PALETTES.web.ink, PALETTES.web.accent]).toContain(f.style);
  });

  it("draws a partial square from the bottom and its outline in leinen", () => {
    feldFrame(model, 0.2, buf);
    const { ctx, log } = recorder();
    paintFeld(ctx, buf, model, opts(0));
    const side = model.scenes[0]?.side ?? 0;
    const partial = log.rects.filter(([, , w, h]) => Math.abs((w ?? 0) - side) < 0.01 && (h ?? 0) < side - 0.01 && (h ?? 0) > 0);
    expect(partial.length).toBeGreaterThanOrEqual(1);
  });

  it("strokes the outlines of ghost squares in one batch", () => {
    feldFrame(model, 0.5, buf);
    const { ctx, log } = recorder();
    paintFeld(ctx, buf, model, opts(1));
    expect(log.strokes).toBe(1);
  });

  it("flips the focused class to its anti colour and dims the others to leinen", () => {
    feldFrame(model, 0.2, buf);
    const ki = model.classIndex.get("ki") ?? -1;
    const { ctx, log } = recorder();
    paintFeld(ctx, buf, model, opts(0, ki));
    const styles = log.fills.map((f) => f.style);
    expect(styles).toContain(PALETTES.web.track);
    expect(styles).toContain(PALETTES.web.ink);
    expect(styles).not.toContain(PALETTES.web.accent);
    const ink = model.classIndex.get("other") ?? -1;
    const second = recorder();
    feldFrame(model, 0.5, buf);
    paintFeld(second.ctx, buf, model, opts(1, ink));
    expect(second.log.fills.map((f) => f.style)).toContain(PALETTES.web.accent);
  });

  it("skips squares outside the canvas (the pour above, the drain below)", () => {
    feldFrame(model, 0.03, buf);
    const { ctx, log } = recorder();
    paintFeld(ctx, buf, model, opts(0));
    for (const [x, y, w, h] of log.rects) {
      expect((y ?? 0) + (h ?? 0)).toBeGreaterThan(0);
      expect(y).toBeLessThan(VIEW.height);
      expect((x ?? 0) + (w ?? 0)).toBeGreaterThan(0);
    }
  });
});

describe("VariantControl", () => {
  afterEach(cleanup);

  it("renders nothing for a figure without a control", () => {
    const { container } = render(<VariantControl spec={FIELD} value="" onChange={() => undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("two detents are native radios inside a fieldset with a legend", () => {
    const onChange = vi.fn();
    render(<VariantControl spec={BLOCKS} value="a" onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Was heißt dieselbe Stelle?" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "Firma und Titel" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Kopien am selben Ort" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("five classes are a native range with integer steps, and the label of the detent is its value text", () => {
    const onChange = vi.fn();
    render(<VariantControl spec={CURVE} value="y2024" onChange={onChange} />);
    const range = screen.getByRole("slider", { name: "Jüngstes Datum der Seite" });
    expect(range).toHaveAttribute("aria-valuetext", "2024");
    fireEvent.change(range, { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("y2026");
  });

  it("a network with two detents is a segmented choice; the split of the slope is a button", () => {
    const { rerender } = render(<VariantControl spec={NETWORK} value="gleich" onChange={() => undefined} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    const onChange = vi.fn();
    rerender(<VariantControl spec={SLOPE} value="s1" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Neue Zufallsteilung" }));
    expect(onChange).toHaveBeenCalledWith("s2");
  });
});

describe("useVariantShift", () => {
  afterEach(() => vi.restoreAllMocks());

  it("starts settled, changes at once under reduced motion", () => {
    const { result, rerender } = renderHook(({ t }) => useVariantShift(t, true), { initialProps: { t: "a" as string | undefined } });
    expect(result.current).toEqual({ variant: "a", from: undefined, shift: 1 });
    rerender({ t: "b" });
    expect(result.current).toEqual({ variant: "b", from: undefined, shift: 1 });
  });

  it("runs 0 to 1 in 180 ms and never goes backwards", () => {
    const frames: Array<(t: number) => void> = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window.performance, "now").mockReturnValue(1000);
    const { result, rerender } = renderHook(({ t }) => useVariantShift(t, false), { initialProps: { t: "a" as string | undefined } });
    rerender({ t: "b" });
    expect(result.current).toMatchObject({ variant: "b", from: "a", shift: 0 });
    const seen: number[] = [];
    for (const at of [1060, 1120, 1170, 1181, 1500]) {
      act(() => frames.shift()?.(at));
      seen.push(result.current.shift);
    }
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen.at(-1)).toBe(1);
    expect(result.current.from).toBeUndefined();
  });
});
