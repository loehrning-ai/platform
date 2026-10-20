import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InsightFocusBar } from "./insight-focus-bar";
import { publishStageState } from "./stage/stage-protocol";

const NEXT = { href: "/buecher/x/03", ariaLabel: "Nächstes Kapitel: Im Schaufenster", isOverview: false } as const;

function mountStage(): { root: HTMLElement; prev: ReturnType<typeof vi.fn>; next: ReturnType<typeof vi.fn> } {
  const root = document.createElement("section");
  root.setAttribute("data-chapter-stage", "h01");
  const prev = vi.fn();
  const next = vi.fn();
  const mk = (which: string, spy: ReturnType<typeof vi.fn>): void => {
    const b = document.createElement("button");
    b.setAttribute("data-cs", which);
    b.addEventListener("click", spy as unknown as EventListener);
    root.append(b);
  };
  mk("prev", prev);
  mk("next", next);
  root.getBoundingClientRect = () => ({ top: 100, bottom: 1400, left: 0, right: 390, width: 390, height: 1300, x: 0, y: 100, toJSON: () => ({}) });
  document.body.append(root);
  return { root, prev, next };
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => window.setTimeout(() => cb(0), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

const bar = (): HTMLElement => document.querySelector<HTMLElement>("[data-reader-focus-bar]")!;

describe("InsightFocusBar", () => {
  it("is the chapter bar without a stage: a labelled chapter counter and the next chapter", () => {
    render(<InsightFocusBar locale="de" chapterNumber={2} chapterTotal={9} next={NEXT} />);
    expect(bar()).toHaveAttribute("data-bar-mode", "chapter");
    expect(within(bar()).getByText("Kapitel 2 von 9")).toBeInTheDocument();
    expect(within(bar()).getByRole("link", { name: /Nächstes Kapitel: Im Schaufenster/ })).toHaveAttribute("href", "/buecher/x/03");
  });

  it("becomes the step control while a stage is in play, wired to the stage's own buttons", async () => {
    const { root, prev, next } = mountStage();
    render(<InsightFocusBar locale="de" chapterNumber={2} chapterTotal={9} next={NEXT} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    act(() => publishStageState(root, { mode: "scrub", step: 1, steps: 4, stepProgress: 1, progress: 0.5 }));
    expect(bar()).toHaveAttribute("data-bar-mode", "step");
    expect(within(bar()).getByText("Schritt 2 von 4")).toBeInTheDocument();
    // The chapter jump is not offered while steps remain.
    expect(within(bar()).queryByRole("link")).toBeNull();
    fireEvent.click(within(bar()).getByRole("button", { name: "Weiter zu Schritt 3" }));
    expect(next).toHaveBeenCalledTimes(1);
    fireEvent.click(within(bar()).getByRole("button", { name: "Zurück zu Schritt 1" }));
    expect(prev).toHaveBeenCalledTimes(1);
  });

  it("offers the chapter jump in place of the step Weiter in the last step, and a disabled Zurück in the first", async () => {
    const { root, prev } = mountStage();
    render(<InsightFocusBar locale="de" chapterNumber={2} chapterTotal={9} next={NEXT} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    act(() => publishStageState(root, { mode: "scrub", step: 0, steps: 3, stepProgress: 1, progress: 1 / 3 }));
    const back = within(bar()).getByRole("button", { name: /Zurück/ });
    expect(back).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(back);
    expect(prev).not.toHaveBeenCalled();
    act(() => publishStageState(root, { mode: "scrub", step: 2, steps: 3, stepProgress: 1, progress: 1 }));
    expect(within(bar()).getByText("Schritt 3 von 3")).toBeInTheDocument();
    expect(within(bar()).getByRole("link", { name: /Nächstes Kapitel/ })).toBeVisible();
    expect(within(bar()).queryByRole("button", { name: /^Weiter/ })).toBeNull();
  });

  it("stays the chapter bar when the stage is static (paused or reduced motion)", async () => {
    const { root } = mountStage();
    render(<InsightFocusBar locale="en" chapterNumber={2} chapterTotal={9} next={{ ...NEXT, ariaLabel: "Next chapter: x" }} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    act(() => publishStageState(root, { mode: "static", step: 3, steps: 4, stepProgress: 1, progress: 1 }));
    expect(bar()).toHaveAttribute("data-bar-mode", "chapter");
    expect(within(bar()).getByText("Chapter 2 of 9")).toBeInTheDocument();
  });

  it("says 'Zur Übersicht' after the last chapter", () => {
    render(<InsightFocusBar locale="de" chapterNumber={9} chapterTotal={9} next={{ href: "/buecher/x", ariaLabel: "Kapitelübersicht", isOverview: true }} />);
    expect(within(bar()).getByRole("link", { name: "Kapitelübersicht" })).toHaveTextContent("Zur Übersicht");
  });

  it("keeps hard edges and anti colours in its stylesheet, and no mono type", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const css = readFileSync(join(__dirname, "insight-focus-bar.css"), "utf8");
    expect(css).not.toMatch(/border-radius:\s*[1-9]|gradient\(|box-shadow|mono/);
    expect(css).toMatch(/\.ifb-btn:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--color-brand-orange/);
    expect(css).toMatch(/\.ifb-btn\s*\{[^}]*min-height:\s*3rem/);
    const outside = css.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}\n/g, "");
    expect(outside).not.toMatch(/:hover/);
  });
});
