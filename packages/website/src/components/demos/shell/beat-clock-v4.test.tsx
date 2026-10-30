import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Beat } from "@/lib/demo-beats";
import { useEffect, useState } from "react";
import { BeatClockProvider, revealIfOffscreen, useBeatClock, useBeatGate, useOnEscape } from "./beat-clock";

const BEATS: readonly Beat[] = [
  { id: "schaetzen", kind: "commit", seconds: 0, label: { de: "Schätzen", en: "Estimate" } },
  { id: "aufloesung", kind: "reveal", seconds: 0, label: { de: "Auflösung", en: "Answer" } },
  { id: "deins", kind: "own", seconds: 0, label: { de: "Deine Daten", en: "Your data" } },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" } },
];

function Probe() {
  const clock = useBeatClock();
  return (
    <div>
      <p data-testid="state">{`${clock.shell} ${clock.phase} ${clock.beat.id} next=${clock.canAdvance} skipped=${clock.skippedCommit}`}</p>
      <button type="button" onClick={clock.start}>
        Starten
      </button>
      <button type="button" onClick={clock.explore}>
        Frei
      </button>
      <button type="button" onClick={clock.toGuide}>
        Führung
      </button>
      <button type="button" onClick={clock.next}>
        Weiter
      </button>
      <button type="button" onClick={clock.restart}>
        Neu
      </button>
    </div>
  );
}

const state = () => screen.getByTestId("state").textContent;
const key = (init: KeyboardEventInit) =>
  act(() => {
    fireEvent.keyDown(window, init);
  });

function setMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const ORIGINAL_WIDTH = window.innerWidth;
beforeEach(() => {
  window.history.replaceState(null, "", "/demos/x");
  setMotion(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: ORIGINAL_WIDTH });
});

/** A demo's detail card: Escape closes it first and says so. */
function Detail() {
  const [open, setOpen] = useState(false);
  useOnEscape(() => {
    if (!open) return false;
    setOpen(false);
    return true;
  });
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {open ? "Detail offen" : "Detail"}
    </button>
  );
}

function mount() {
  return render(
    <BeatClockProvider beats={BEATS} locale="de" shell="v4">
      <Probe />
      <Detail />
    </BeatClockProvider>,
  );
}

describe("the v4 clock: intro, guided path, free play", () => {
  it("starts in the intro, where only ArrowRight (like Starten) does something", () => {
    mount();
    expect(state()).toBe("v4 intro schaetzen next=false skipped=false");
    key({ key: "r" });
    expect(state()).toMatch(/^v4 intro/);
    key({ key: "ArrowRight" });
    expect(state()).toMatch(/^v4 guided schaetzen next=true/);
  });

  it("never blocks on the commit: Weiter moves on and the skipped estimate is named", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    key({ key: "ArrowRight" });
    expect(state()).toBe("v4 guided aufloesung next=true skipped=true");
  });

  it("opens free play and returns to the guide with Escape or the button", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Frei" }));
    expect(state()).toMatch(/^v4 free/);
    key({ key: "Escape" });
    expect(state()).toMatch(/^v4 guided/);
    fireEvent.click(screen.getByRole("button", { name: "Frei" }));
    fireEvent.click(screen.getByRole("button", { name: "Führung" }));
    expect(state()).toMatch(/^v4 guided/);
  });

  it("Escape closes an open detail first, and leaves free play once nothing is open", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Frei" }));
    fireEvent.click(screen.getByRole("button", { name: "Detail" }));
    key({ key: "Escape" });
    expect(screen.getByRole("button", { name: "Detail" })).toBeInTheDocument();
    expect(state()).toMatch(/^v4 free/);
    key({ key: "Escape" });
    expect(state()).toMatch(/^v4 guided/);
  });

  it("restarts to beat 1 in the guide and stops at the last beat", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    for (let n = 0; n < 5; n += 1) key({ key: "ArrowRight" });
    expect(state()).toMatch(/mitnehmen next=false/);
    key({ key: "R", shiftKey: true });
    expect(state()).toMatch(/^v4 guided schaetzen/);
  });

  it("skips the intro for a ?beat= deep link", () => {
    window.history.replaceState(null, "", "/demos/x?beat=deins");
    mount();
    expect(state()).toMatch(/^v4 guided deins/);
  });
});

function captureFrames() {
  const frames = new Map<number, FrameRequestCallback>();
  let next = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = next++;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => { frames.delete(id); });
  return (time = performance.now()) => act(() => {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  });
}

function GateStage({ automaticDone = false, gated = true, onStage }: { automaticDone?: boolean; gated?: boolean; onStage: (element: HTMLElement | null) => void }) {
  const clock = useBeatClock();
  const [done, setDone] = useState(false);
  useEffect(() => { if (automaticDone) setDone(true); }, [automaticDone]);
  useBeatGate(gated ? true : null, () => { setDone(true); return true; });
  return <section ref={(element) => { clock.registerStage(element); onStage(element); }} data-testid="stage" data-answer={done ? "done" : "waiting"} data-progress={clock.progress} />;
}

function mockStage(reveal: HTMLElement["scrollIntoView"]) {
  return (element: HTMLElement | null) => {
    if (!element) return;
    element.getBoundingClientRect = () => ({ top: -200 } as DOMRect);
    element.scrollIntoView = reveal;
  };
}

describe("v4 Next reveals an offscreen stage only for the visitor's action", () => {
  it("reveals a consumed gate after its answer rendered and two frames, without advancing beats", () => {
    const advanceFrame = captureFrames();
    const reveal = vi.fn(() => expect(screen.getByTestId("stage")).toHaveAttribute("data-answer", "done"));
    const onStage = mockStage(reveal);
    render(<BeatClockProvider beats={BEATS} locale="de" shell="v4"><Probe /><GateStage onStage={onStage} /></BeatClockProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(state()).toMatch(/^v4 guided schaetzen/);
    expect(screen.getByTestId("stage")).toHaveAttribute("data-answer", "done");
    expect(reveal).not.toHaveBeenCalled();
    advanceFrame();
    expect(reveal).not.toHaveBeenCalled();
    advanceFrame();
    expect(reveal).toHaveBeenCalledExactlyOnceWith({ behavior: "instant", block: "start" });
  });

  it("does not reveal on load, automatic answer completion or restart", () => {
    const advanceFrame = captureFrames();
    const reveal = vi.fn();
    const onStage = mockStage(reveal);
    const fixture = (done: boolean) => <BeatClockProvider beats={BEATS} locale="de" shell="v4"><Probe /><GateStage automaticDone={done} onStage={onStage} /></BeatClockProvider>;
    const view = render(fixture(false));
    advanceFrame(); advanceFrame();
    expect(reveal).not.toHaveBeenCalled();
    view.rerender(fixture(true));
    expect(screen.getByTestId("stage")).toHaveAttribute("data-answer", "done");
    advanceFrame(); advanceFrame();
    expect(reveal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Neu" }));
    advanceFrame(); advanceFrame();
    expect(reveal).not.toHaveBeenCalled();
  });

  it("reveals after a Next press finishes beat motion, without waiting for another beat", () => {
    setMotion(false);
    const advanceFrame = captureFrames();
    const reveal = vi.fn();
    const beats = BEATS.map((beat, index) => index === 0 ? { ...beat, seconds: 1 } : beat);
    render(<BeatClockProvider beats={beats} locale="de" shell="v4"><Probe /><GateStage onStage={mockStage(reveal)} /></BeatClockProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    expect(screen.getByTestId("stage")).toHaveAttribute("data-progress", "0");
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByTestId("stage")).toHaveAttribute("data-progress", "1");
    expect(state()).toMatch(/^v4 guided schaetzen/);
    advanceFrame(); advanceFrame();
    expect(reveal).toHaveBeenCalledTimes(1);
  });

  it("does not reveal when beat motion reaches its end automatically", () => {
    setMotion(false);
    const advanceFrame = captureFrames();
    const reveal = vi.fn();
    const beats = BEATS.map((beat, index) => index === 0 ? { ...beat, seconds: 1 } : beat);
    render(<BeatClockProvider beats={beats} locale="de" shell="v4"><Probe /><GateStage onStage={mockStage(reveal)} /></BeatClockProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    advanceFrame(0); advanceFrame(1100);
    expect(screen.getByTestId("stage")).toHaveAttribute("data-progress", "1");
    advanceFrame(1200); advanceFrame(1300);
    expect(reveal).not.toHaveBeenCalled();
  });

  it("keeps the existing take-home reveal to one event when Next advances normally", () => {
    const advanceFrame = captureFrames();
    const reveal = vi.fn();
    render(<BeatClockProvider beats={BEATS} locale="de" shell="v4"><Probe /><GateStage gated={false} onStage={mockStage(reveal)} /></BeatClockProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Starten" }));
    for (let index = 0; index < 3; index++) fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(state()).toMatch(/mitnehmen next=false/);
    advanceFrame(); advanceFrame();
    expect(reveal).toHaveBeenCalledTimes(1);
  });
});

describe("stage reveal motion", () => {
  for (const [width, reduced, behavior] of [[390, false, "instant"], [1023, false, "instant"], [1200, true, "instant"], [1200, false, "smooth"]] as const) {
    it(`uses ${behavior} at ${width}px with reduced motion ${reduced}`, () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      const element = document.createElement("section");
      const reveal = vi.fn();
      element.getBoundingClientRect = () => ({ top: -200 } as DOMRect);
      element.scrollIntoView = reveal;
      revealIfOffscreen(element, reduced);
      expect(reveal).toHaveBeenCalledExactlyOnceWith({ behavior, block: "start" });
      element.getBoundingClientRect = () => ({ top: 100 } as DOMRect);
      revealIfOffscreen(element, reduced);
      expect(reveal).toHaveBeenCalledTimes(1);
    });
  }
});
