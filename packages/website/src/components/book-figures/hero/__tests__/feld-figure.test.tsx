import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compileFeld, createFrameBuffer, feldFrame } from "@/lib/figures";
import { FIELD } from "@/lib/figures/__tests__/fixtures-hero";
import type { FigureSpecOf } from "@/lib/figures";
import { FeldFigure } from "../feld-figure";
import { classAt, dprCap } from "../feld-live";
import { setStage, stubCanvas, stubIdle, stubMedia, type Recorder } from "./helpers";

const spec = FIELD as FigureSpecOf<"field">;

function html(node: React.ReactElement): Document {
  const doc = document.implementation.createHTMLDocument("t");
  doc.body.innerHTML = renderToString(node);
  return doc;
}

const chips = (): HTMLButtonElement[] => [...document.querySelectorAll<HTMLButtonElement>("button.hf-chip")];

function inStage(props: { bare?: boolean } = {}): HTMLElement {
  const view = render(
    <section data-chapter-stage="t" className="cs" data-mode="scrub">
      <div className="cs-view">
        <FeldFigure spec={spec} {...props} />
      </div>
    </section>,
  );
  return view.container.querySelector("section") as HTMLElement;
}

describe("server markup is the finished field", () => {
  const doc = html(<FeldFigure spec={spec} />);

  it("holds the SVG field of the last scene in both layouts, the numeral and the unit line", () => {
    const svgs = [...doc.querySelectorAll("svg[data-figure]")];
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg.getAttribute("data-progress")).toBe("1");
    expect(doc.querySelector("[data-hf-numeral]")?.textContent).toBe("35");
    expect(doc.querySelector("[data-hf-unit]")?.textContent).toContain("1 Quadrat");
    expect(doc.querySelectorAll("path").length).toBeLessThan(40);
  });

  it("has no canvas, no chips and no collapsible before the island runs", () => {
    expect(doc.querySelector("canvas")).toBeNull();
    expect(doc.querySelector(".hf-chips")).toBeNull();
    expect(doc.querySelector("details, summary")).toBeNull();
    expect(doc.querySelector(".hf")?.getAttribute("data-hf-live")).toBe("false");
  });

  it("leaves numeral and unit to the stage when bare", () => {
    const bare = html(<FeldFigure spec={spec} bare />);
    expect(bare.querySelector("[data-hf-numeral]")).toBeNull();
    expect(bare.querySelector("[data-hf-unit]")).toBeNull();
  });
});

describe("live canvas", () => {
  let rec: Recorder;
  beforeEach(() => {
    stubMedia({ motion: true });
    stubIdle();
    rec = stubCanvas();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads the canvas chunk after idle and paints with at most three batched fills", async () => {
    render(<FeldFigure spec={spec} />);
    await waitFor(() => expect(document.querySelector("canvas")).not.toBeNull());
    expect(document.querySelector(".hf")?.getAttribute("data-hf-live")).toBe("true");
    expect(rec.fills).toBeGreaterThan(0);
    expect(rec.calls).toBeGreaterThan(0);
    expect(rec.fills / rec.calls).toBeLessThanOrEqual(3);
    expect(rec.rects).toBeGreaterThanOrEqual(100);
  });

  it("does not paint an idle frame: nothing happens until progress or focus change", async () => {
    const root = inStage();
    await waitFor(() => expect(root.querySelector("canvas")).not.toBeNull());
    setStage(root, 0.5);
    const before = rec.calls;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(rec.calls).toBe(before);
    setStage(root, 0.5);
    expect(rec.calls).toBe(before);
    setStage(root, 0.6);
    expect(rec.calls).toBeGreaterThan(before);
  });

  it("follows the stage: progress 0, 0.5 and 1 paint different frames and move the page copy", async () => {
    const root = inStage();
    await waitFor(() => expect(root.querySelector("canvas")).not.toBeNull());
    const rects: number[] = [];
    for (const p of [0, 0.5, 1]) {
      const before = rec.rects;
      setStage(root, p);
      rects.push(rec.rects - before);
    }
    expect(rects[0]).toBeLessThan(rects[2] ?? 0);
    setStage(root, 0.5);
    expect(root.querySelector("[data-hf-numeral]")?.textContent).toBe("46 %");
    setStage(root, 0.1);
    expect(root.querySelector("[data-hf-numeral]")?.textContent).toBe("62x");
  });

  it("shows the labels of the bins only once the scene is formed", async () => {
    const root = inStage();
    await waitFor(() => expect(root.querySelector("canvas")).not.toBeNull());
    setStage(root, 0.2);
    expect(root.querySelector(".hf-labels text")).not.toBeNull();
    setStage(root, (1 / 3) * 0.05);
    expect(root.querySelector(".hf-labels")).toBeNull();
  });

  it("gives the classes of the scene as chips: roving tab stop, arrows, Enter pins, Escape unpins", async () => {
    const root = inStage();
    await waitFor(() => expect(root.querySelector("canvas")).not.toBeNull());
    setStage(root, 0.2);
    const list = chips();
    expect(list.map((c) => c.getAttribute("aria-label"))).toEqual(["ohne KI-Wort: 20.680", "mit KI-Wort: 724"]);
    expect(list.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    list[0]?.focus();
    fireEvent.keyDown(list[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(list[1]);
    fireEvent.keyDown(list[1] as HTMLElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(list[0]);
    fireEvent.click(list[1] as HTMLElement);
    expect(list[1]?.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector("[data-hs-readout]")?.textContent).toContain("von 21.404");
    fireEvent.keyDown(list[1] as HTMLElement, { key: "Escape" });
    expect(list[1]?.getAttribute("aria-pressed")).toBe("false");
  });

  it("flips the pinned class to its anti colour and dims the rest to leinen", async () => {
    const root = inStage();
    await waitFor(() => expect(root.querySelector("canvas")).not.toBeNull());
    setStage(root, 0.2);
    rec.styles.length = 0;
    fireEvent.click(chips()[1] as HTMLElement);
    // accent class pinned: it is drawn in ink, everything else in the leinen tint
    expect(rec.styles).toContain("#121212");
    expect(rec.styles).toContain("#d4cec5");
    expect(rec.styles).not.toContain("#b73a15");
  });

  it("pins a class by tapping the field and un-pins it with a second tap", async () => {
    const root = render(<FeldFigure spec={spec} />).container;
    await waitFor(() => expect(root.querySelector("canvas")).not.toBeNull());
    const canvas = root.querySelector("canvas") as HTMLCanvasElement;
    // jsdom has no layout: the island compiles for its 120 x 120 minimum
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120, x: 0, y: 0, toJSON: () => ({}) });
    const model = compileFeld(spec.data, { width: 120, height: 120 });
    const scene = model.scenes[2];
    const accent = model.classIndex.get("ki") ?? -1;
    const slot = Array.from({ length: scene?.squares ?? 0 }, (_v, i) => i).find((i) => scene?.cls[i] === accent) ?? 0;
    const at = { clientX: (scene?.x[slot] ?? 0) + 1, clientY: (scene?.y[slot] ?? 0) + 1 };
    rec.styles.length = 0;
    fireEvent.click(canvas, at);
    expect(rec.styles).toContain("#d4cec5");
    expect(rec.styles).not.toContain("#b73a15");
    rec.styles.length = 0;
    fireEvent.click(canvas, at);
    expect(rec.styles).toContain("#b73a15");
  });
});

describe("reduced motion", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps the finished SVG field: no canvas is loaded, nothing moves, whatever the stage says", async () => {
    stubMedia({ motion: false });
    stubIdle();
    const rec = stubCanvas();
    const root = inStage();
    setStage(root, 0.3);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(root.querySelector("canvas")).toBeNull();
    expect(rec.fills).toBe(0);
    expect(root.querySelector(".hf")?.getAttribute("data-hf-live")).toBe("false");
    expect(root.querySelector("svg[data-figure]")?.getAttribute("data-progress")).toBe("1");
  });
});

describe("helpers", () => {
  it("caps the device pixel ratio at 2, and 1.5 on four cores or fewer", () => {
    const win = (dpr: number, cores: number) => ({ devicePixelRatio: dpr, navigator: { hardwareConcurrency: cores } }) as unknown as Window;
    expect(dprCap(win(3, 8))).toBe(2);
    expect(dprCap(win(3, 4))).toBe(1.5);
    expect(dprCap(win(1, 4))).toBe(1);
  });

  it("finds the class under a point and ignores gaps and the neutral ink", () => {
    const model = compileFeld(spec.data, { width: 340, height: 300 });
    const buf = createFrameBuffer(model);
    feldFrame(model, 1, buf);
    const scene = model.scenes[2];
    const x = (scene?.x[0] ?? 0) + 2;
    const y = (scene?.y[0] ?? 0) + 2;
    expect(classAt(buf, model, x, y)).toBe(scene?.cls[0]);
    expect(classAt(buf, model, -50, -50)).toBe(-1);
  });
});
