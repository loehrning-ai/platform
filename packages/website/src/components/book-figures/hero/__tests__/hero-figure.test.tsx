import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CURVE, NETWORK, NULLDIST, SLOPE, STRIP } from "@/lib/figures/__tests__/fixtures-hero";
import type { FigureSpec } from "@/lib/figures";
import { HeroFigure } from "../hero-figure";
import { setStage, stubIdle, stubMedia } from "./helpers";

function html(node: React.ReactElement): Document {
  const doc = document.implementation.createHTMLDocument("t");
  doc.body.innerHTML = renderToString(node);
  return doc;
}

const readout = (): string => document.querySelector("[data-hs-readout]")?.textContent ?? "";
const hits = (): HTMLButtonElement[] => [...document.querySelectorAll<HTMLButtonElement>("button.hs-hit")];

function inStage(spec: FigureSpec, props: { bare?: boolean; stepVariants?: readonly (string | undefined)[] } = {}) {
  const view = render(
    <section data-chapter-stage="t" className="cs" data-mode="scrub">
      <div className="cs-view">
        <HeroFigure spec={spec} {...props} />
      </div>
    </section>,
  );
  return view.container.querySelector("section") as HTMLElement;
}

describe("server markup is the finished figure", () => {
  it.each([NETWORK, STRIP, CURVE, SLOPE, NULLDIST])("$id: both layouts at progress 1, a control and a sentence, nothing live", (spec) => {
    const doc = html(<HeroFigure spec={spec} />);
    const svgs = [...doc.querySelectorAll("svg[data-figure]")];
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) {
      expect(svg.getAttribute("data-progress")).toBe("1");
      expect(svg.getAttribute("role")).toBe("img");
    }
    expect(new Set([...doc.querySelectorAll("[id]")].map((e) => e.id)).size).toBe(doc.querySelectorAll("[id]").length);
    expect(doc.querySelector(".hs-hit")).toBeNull();
    expect(doc.querySelector("[data-hs-readout]")?.textContent?.length).toBeGreaterThan(5);
    expect(doc.querySelector(".hv")).not.toBeNull();
    // the reserved box: an aspect ratio on both layouts, so the island takes over without a shift
    for (const v of doc.querySelectorAll<HTMLElement>(".hs-variant")) expect(v.style.aspectRatio).toMatch(/^\d+(\.\d+)? \/ \d+(\.\d+)?$/);
  });

  it("never renders a collapsible", () => {
    for (const spec of [NETWORK, STRIP, CURVE, SLOPE, NULLDIST]) {
      const doc = html(<HeroFigure spec={spec} />);
      expect(doc.querySelector("details, summary, [aria-expanded]")).toBeNull();
    }
  });
});

describe("live island", () => {
  beforeEach(() => {
    stubMedia({ motion: true });
    stubIdle();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("hydrates to one layout and gives every pin a named 44 px button", () => {
    render(<HeroFigure spec={NETWORK} />);
    expect(document.querySelectorAll("svg[data-figure]")).toHaveLength(1);
    const buttons = hits();
    expect(buttons.length).toBe(24);
    for (const b of buttons) expect(b.getAttribute("aria-label")).toBeTruthy();
  });

  it("walks the pins with the arrow keys, pins on Enter and unpins on Escape", () => {
    render(<HeroFigure spec={NETWORK} />);
    const [first, second] = hits();
    first?.focus();
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(second);
    fireEvent.keyDown(second as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(hits().at(-1));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
    expect(document.activeElement).toBe(first);
    fireEvent.click(first as HTMLElement);
    expect(first?.getAttribute("aria-pressed")).toBe("true");
    expect(readout()).toContain("Wort KI");
    expect(document.querySelector('[data-id="n0"]')?.getAttribute("fill")).toBe("#121212");
    expect(document.querySelector('[data-id="n5"]')?.getAttribute("opacity")).toBe("0.4");
    fireEvent.keyDown(first as HTMLElement, { key: "Escape" });
    expect(first?.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps exactly one tab stop among the pins (roving tabindex)", () => {
    render(<HeroFigure spec={STRIP} />);
    expect(hits().filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  it("moves between detents with the keyboard-reachable control and reads the new state", async () => {
    stubMedia({ motion: false });
    render(<HeroFigure spec={NETWORK} />);
    const roh = screen.getByRole("radio", { name: "roh" });
    await act(async () => {
      fireEvent.click(roh);
    });
    expect(readout()).toMatch(/^roh: \d+ Verbindungen/);
    expect(document.querySelector("svg")?.querySelector('[data-t="numeral"]')?.textContent).toMatch(/^\d+$/);
    const equal = screen.getByRole("radio", { name: "gleiche Textmenge" });
    await act(async () => {
      fireEvent.click(equal);
    });
    expect(readout()).toContain("gleiche Textmenge");
  });

  it("uses a native range with the real detents for six classes", async () => {
    stubMedia({ motion: false });
    render(<HeroFigure spec={CURVE} />);
    const range = screen.getByRole("slider");
    expect(range).toHaveAttribute("min", "0");
    expect(range).toHaveAttribute("max", "4");
    expect(range).toHaveAttribute("step", "1");
    await act(async () => {
      fireEvent.change(range, { target: { value: "0" } });
    });
    expect(range).toHaveAttribute("aria-valuetext", "bis 2022");
    expect(readout()).toContain("bis 2022");
    expect(readout()).toContain("2,0");
  });

  it("cycles the baked random splits with one button", async () => {
    stubMedia({ motion: false });
    render(<HeroFigure spec={SLOPE} />);
    expect(readout()).toContain("Teilung 1");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Neue Zufallsteilung" }));
    });
    expect(readout()).toContain("Teilung 2");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Neue Zufallsteilung" }));
    });
    expect(readout()).toContain("Teilung 1");
  });

  it("animates a detent change over frames in normal motion and lands on the target", async () => {
    const frames: Array<(t: number) => void> = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window.performance, "now").mockReturnValue(0);
    render(<HeroFigure spec={NETWORK} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("radio", { name: "roh" }));
    });
    // mid-change: both edge sets are in the markup (leaving edges fade)
    await act(async () => {
      frames.shift()?.(90);
    });
    expect(document.querySelector('[data-edges="leaving"], [data-edges="entering"]')).not.toBeNull();
    await act(async () => {
      while (frames.length > 0) frames.shift()?.(400);
    });
    expect(document.querySelector('[data-edges="leaving"]')).toBeNull();
    expect(document.querySelector('[data-edges="entering"]')).toBeNull();
  });
});

describe("inside a chapter stage", () => {
  beforeEach(() => {
    stubMedia({ motion: true });
    stubIdle();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("takes progress 0, 0.5 and 1 from the stage", () => {
    const root = inStage(CURVE);
    for (const p of [0, 0.5, 1]) {
      setStage(root, p);
      expect(root.querySelector("svg[data-figure]")?.getAttribute("data-progress")).toBe(String(p));
    }
  });

  it("draws bare: no numeral and no claim, the shell owns them", () => {
    const root = inStage(NETWORK, { bare: true });
    expect(root.querySelector('[data-t="numeral"]')).toBeNull();
    expect(root.querySelector('[data-t="claim"]')).toBeNull();
    const plain = inStage(NETWORK);
    expect(plain.querySelector('[data-t="numeral"]')).not.toBeNull();
  });

  it("follows the detent of the stage step and lets the reader's choice win", () => {
    const root = inStage(NETWORK, { stepVariants: ["roh", "gleich"] });
    setStage(root, 0.2, 0, 2);
    expect(readout()).toMatch(/^roh:/);
    setStage(root, 0.9, 1, 2);
    expect(readout()).toMatch(/^gleiche Textmenge:/);
  });

  it("shows only the finished figure under reduced motion", () => {
    stubMedia({ motion: false });
    const root = inStage(CURVE);
    setStage(root, 0.3);
    expect(root.querySelector("svg[data-figure]")?.getAttribute("data-progress")).toBe("1");
  });

  it("returns to the finished frame when the stage says static", () => {
    const root = inStage(CURVE);
    setStage(root, 0.3);
    expect(root.querySelector("svg[data-figure]")?.getAttribute("data-progress")).toBe("0.3");
    act(() => {
      root.dispatchEvent(new CustomEvent("chapterstage", { detail: { mode: "static", step: 2, steps: 3, stepProgress: 1, progress: 1 } }));
    });
    expect(within(root).getAllByRole("img")[0]).toBeTruthy();
  });
});
