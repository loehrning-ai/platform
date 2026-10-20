import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./stage-enhancer", () => ({ StageEnhancer: () => null }));

import { ChapterStage } from "./chapter-stage";
import { getStageState, subscribeStage, type StageState } from "./stage-protocol";
import { startStage } from "./stage-controller";

const STEPS = ["a", "b", "c"].map((id, i) => ({ id, label: id, text: `Karte ${i + 1}.`, numeral: String(i + 1), claim: `Aussage ${i + 1}` }));
const SOURCE = { id: "t", n: 100, asOf: "2026-10-18", limitation: "Grenze.", sourceLine: "n = 100 · Grenze: keine" };

interface FakeWin {
  win: Window & typeof globalThis;
  scroll: (y: number) => void;
  scrollBy: ReturnType<typeof vi.fn>;
  setMedia: (query: string, matches: boolean) => void;
}

/** A window whose scroll position moves the step blocks: block i is 600 px high and starts at 500 + 600 i - scrollY. */
function fakeWindow(root: HTMLElement, innerHeight = 844): FakeWin {
  let scrollY = 0;
  const media = new Map<string, boolean>();
  const listeners = new Map<string, Set<() => void>>();
  const mqls = new Map<string, MediaQueryList>();
  const stepEls = Array.from(root.querySelectorAll<HTMLElement>(".cs-step"));
  stepEls.forEach((el, i) => {
    el.getBoundingClientRect = () => ({ top: 500 + i * 600 - scrollY, height: 600, bottom: 0, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  });
  root.querySelector<HTMLElement>("[data-cs-pin]")!.getBoundingClientRect = () => ({ top: 48, bottom: 538, height: 490 }) as DOMRect;
  const scrollBy = vi.fn(({ top }: { top: number }) => {
    scrollY += top;
  });
  const win = {
    innerHeight,
    matchMedia: (query: string) => {
      if (!mqls.has(query)) {
        const handlers = new Set<() => void>();
        listeners.set(query, handlers);
        mqls.set(query, {
          get matches() {
            return media.get(query) ?? false;
          },
          addEventListener: (_: string, fn: () => void) => handlers.add(fn),
          removeEventListener: (_: string, fn: () => void) => handlers.delete(fn),
        } as unknown as MediaQueryList);
      }
      return mqls.get(query)!;
    },
    addEventListener: (name: string, fn: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(fn);
    },
    removeEventListener: (name: string, fn: () => void) => listeners.get(name)?.delete(fn),
    requestAnimationFrame: (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    },
    cancelAnimationFrame: () => {},
    scrollBy,
    IntersectionObserver: undefined,
  } as unknown as Window & typeof globalThis;
  return {
    win,
    scrollBy,
    scroll: (y) => {
      scrollY = y;
      listeners.get("scroll")?.forEach((fn) => fn());
    },
    setMedia: (query, matches) => {
      media.set(query, matches);
      listeners.get(query)?.forEach((fn) => fn());
    },
  };
}

function mount(strip?: { fits: boolean; ratio: number | null; controlPx: number }) {
  const { container } = render(
    <ChapterStage id="t" label="Test" steps={STEPS} source={SOURCE} strip={strip}>
      <svg />
    </ChapterStage>,
  );
  const root = container.querySelector<HTMLElement>("[data-chapter-stage]")!;
  return { root, container };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("startStage", () => {
  it("writes step, progress and the counter onto the stage element and into the protocol while the reader scrolls", () => {
    const { root } = mount();
    const fake = fakeWindow(root);
    const seen: StageState[] = [];
    subscribeStage(root, (s) => seen.push(s));
    const stop = startStage(root, fake.win);
    // Reading line: pin bottom 538 + half of the space down to the bottom (844) = 691. Step 0 starts at 500.
    expect(root.dataset["mode"]).toBe("scrub");
    expect(root.dataset["step"]).toBe("0");
    fake.scroll(1200); // block 2 starts at 1700 - 1200 = 500 ... line 691 is 191 px into block 1? (1100 - 1200 = -100)
    const state = getStageState(root);
    expect(root.dataset["step"]).toBe(String(state.step));
    expect(root.style.getPropertyValue("--cs-p")).toBe(state.progress.toFixed(4));
    expect(root.querySelector("[data-cs-count]")).toHaveTextContent(`Schritt ${state.step + 1} von 3`);
    expect(state.mode).toBe("scrub");
    expect(seen.length).toBeGreaterThan(1);
    stop();
  });

  it("names the neighbour step on Weiter and Zurück and disables them at the ends", () => {
    const { root } = mount();
    const fake = fakeWindow(root);
    const stop = startStage(root, fake.win);
    const prev = root.querySelector<HTMLElement>("[data-cs='prev']")!;
    const next = root.querySelector<HTMLElement>("[data-cs='next']")!;
    expect(prev).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveAttribute("aria-disabled", "false");
    expect(next).toHaveAttribute("aria-label", "Weiter zu Schritt 2");
    fake.scroll(5000);
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(prev).toHaveAttribute("aria-disabled", "false");
    expect(prev).toHaveAttribute("aria-label", "Zurück zu Schritt 2");
    stop();
  });

  it("scrolls so that the next card is centred on the reading line when Weiter is pressed", () => {
    const { root } = mount();
    const fake = fakeWindow(root);
    const stop = startStage(root, fake.win);
    root.querySelector<HTMLElement>("[data-cs='next']")!.click();
    expect(fake.scrollBy).toHaveBeenCalledTimes(1);
    const arg = fake.scrollBy.mock.calls[0]![0] as { top: number; behavior: string };
    // Step 1 starts at 1100, its centre at 1400; the reading line is at 691.
    expect(arg.top).toBe(1400 - 691);
    expect(arg.behavior).toBe("smooth");
    stop();
  });

  it("does nothing on a disabled button and shows the finished stage under reduced motion", () => {
    const { root } = mount();
    const fake = fakeWindow(root);
    fake.setMedia("(prefers-reduced-motion: reduce)", true);
    const stop = startStage(root, fake.win);
    expect(root.dataset["mode"]).toBe("static");
    expect(getStageState(root)).toMatchObject({ mode: "static", step: 2, progress: 1 });
    root.querySelector<HTMLElement>("[data-cs='next']")!.click();
    expect(fake.scrollBy).not.toHaveBeenCalled();
    stop();
  });

  it("returns every figure to progress 1 when the chapter pause switch is turned on", () => {
    const pause = document.createElement("input");
    pause.type = "checkbox";
    pause.className = "cs-pause-input";
    document.body.append(pause);
    const { root } = mount();
    const fake = fakeWindow(root);
    const stop = startStage(root, fake.win);
    expect(getStageState(root).mode).toBe("scrub");
    pause.checked = true;
    pause.dispatchEvent(new Event("change"));
    // The controller listens to the input's change event through the same schedule.
    expect(getStageState(root)).toMatchObject({ mode: "static", progress: 1 });
    stop();
  });

  it("reads the middle of the window under the header when the pin stands beside the text column (wide screens)", () => {
    const { root } = mount();
    const fake = fakeWindow(root, 900);
    // From lg the pin is the right column, stuck 80px from the top and as tall as the window below it.
    const pin = root.querySelector<HTMLElement>("[data-cs-pin]")!;
    pin.getBoundingClientRect = () => ({ top: 80, bottom: 884, height: 804, left: 700, right: 1300, width: 600 }) as DOMRect;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>(".cs-step"))) {
      const base = el.getBoundingClientRect();
      el.getBoundingClientRect = () => ({ ...base, left: 100, right: 600, width: 500 }) as DOMRect;
    }
    (fake.win as unknown as { getComputedStyle: () => { top: string } }).getComputedStyle = () => ({ top: "80px" });
    const stop = startStage(root, fake.win);
    root.querySelector<HTMLElement>("[data-cs='next']")!.click();
    // Step 1 centres at 1400; the reading line is 80 + (900 - 80) / 2 = 490, not under the pin's bottom.
    expect((fake.scrollBy.mock.calls[0]![0] as { top: number }).top).toBe(1400 - 490);
    stop();
  });

  it("keeps a stage whose figure does not fit the phone strip static below lg, and scrubs it from lg", () => {
    const { root } = mount({ fits: false, ratio: 0.98, controlPx: 50 });
    expect(root).toHaveAttribute("data-strip", "inline");
    const fake = fakeWindow(root);
    fake.setMedia("(max-width: 1023px)", true);
    const stop = startStage(root, fake.win);
    expect(getStageState(root)).toMatchObject({ mode: "static", progress: 1 });
    fake.setMedia("(max-width: 1023px)", false);
    expect(getStageState(root).mode).toBe("scrub");
    stop();
  });

  it("ignores the narrow-screen rule for a stage that fits the strip", () => {
    const { root } = mount({ fits: true, ratio: 0.44, controlPx: 0 });
    expect(root).not.toHaveAttribute("data-strip");
    const fake = fakeWindow(root);
    fake.setMedia("(max-width: 1023px)", true);
    const stop = startStage(root, fake.win);
    expect(getStageState(root).mode).toBe("scrub");
    stop();
  });

  it("stops listening when it is stopped", () => {
    const { root } = mount();
    const fake = fakeWindow(root);
    const stop = startStage(root, fake.win);
    stop();
    const before = getStageState(root);
    fake.scroll(3000);
    expect(getStageState(root)).toBe(before);
  });
});
