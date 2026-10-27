import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Beat } from "@/lib/demo-beats";
import { useState } from "react";
import { BeatClockProvider, useBeatClock, useOnEscape } from "./beat-clock";

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

beforeEach(() => {
  window.history.replaceState(null, "", "/demos/x");
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(cleanup);

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
