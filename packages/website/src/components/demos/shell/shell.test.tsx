import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Beat } from "@/lib/demo-beats";
import { PersonalLine } from "../take-home/personal-line";
import { setTakeHomeLine } from "../take-home/take-home-store";
import { BeatClockProvider, DemoLever, DemoStage, useBeatClock, useOnEscape, useOnRestart } from ".";
import { BeatRail } from "./beat-rail";

const BEATS: readonly Beat[] = [
  { id: "frage", kind: "commit", seconds: 1, label: { de: "Frage", en: "Question" } },
  { id: "kipp", kind: "reveal", seconds: 1, label: { de: "Kipp", en: "Turn" } },
  { id: "werkzeug", kind: "tool", seconds: 1, label: { de: "Werkzeug", en: "Tool" } },
  { id: "deins", kind: "own", seconds: 1, label: { de: "Deins", en: "Yours" } },
  { id: "mitnehmen", kind: "takehome", seconds: 0, label: { de: "Mitnehmen", en: "Take home" } },
];

function setMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function Fixture({ onRestart = () => {}, onEscape = () => {} }: { onRestart?: () => void; onEscape?: () => void }) {
  const clock = useBeatClock();
  useOnRestart(onRestart);
  useOnEscape(onEscape);
  return (
    <>
      <DemoStage label="Bühne" caption={`beat ${clock.beat.id} ${clock.progress.toFixed(2)}${clock.skippedCommit ? " skipped" : ""}`}>
        <svg data-testid="scene" />
      </DemoStage>
      <DemoLever>
        <button type="button" onClick={clock.commit}>
          Wetten
        </button>
        <input aria-label="Eigene Zahl" />
      </DemoLever>
    </>
  );
}

function mount(props: { onRestart?: () => void; onEscape?: () => void } = {}) {
  return render(
    <BeatClockProvider beats={BEATS} locale="de">
      <BeatRail orientation="horizontal" />
      <Fixture {...props} />
    </BeatClockProvider>,
  );
}

const caption = () => screen.getByText(/^beat /).textContent;
const key = (init: KeyboardEventInit, target: EventTarget = window) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
  });

beforeEach(() => {
  setMotion(true);
  window.history.replaceState(null, "", "/demos/x");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("v3 shell: the beat clock", () => {
  it("shows the end frame at once with reduced motion, and gates Weiter on a commit beat", async () => {
    mount();
    expect(caption()).toBe("beat frage 1.00");
    expect(screen.queryByRole("button", { name: "Weiter" })).toBeNull();
    key({ key: "ArrowRight" });
    expect(caption()).toBe("beat frage 1.00");
    fireEvent.click(screen.getByRole("button", { name: "Wetten" }));
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(caption()).toBe("beat kipp 1.00");
    key({ key: "ArrowRight" });
    expect(caption()).toBe("beat werkzeug 1.00");
    key({ key: "ArrowLeft" });
    expect(caption()).toBe("beat kipp 1.00");
  });

  it("lets a rail mark jump anywhere, and marks a skipped commit", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Schritt 4 von 5: Deins" }));
    expect(caption()).toBe("beat deins 1.00 skipped");
    expect(screen.getByRole("button", { name: "Schritt 4 von 5: Deins" })).toHaveAttribute("aria-current", "step");
  });

  it("resets on r and Shift+R and on Von vorn, calls onRestart, and ignores Cmd+R and keys in a field", () => {
    const onRestart = vi.fn();
    mount({ onRestart });
    fireEvent.click(screen.getByRole("button", { name: "Schritt 3 von 5: Werkzeug" }));
    key({ key: "r", metaKey: true });
    expect(caption()).toBe("beat werkzeug 1.00 skipped");
    key({ key: "r" }, screen.getByLabelText("Eigene Zahl"));
    expect(caption()).toBe("beat werkzeug 1.00 skipped");
    key({ key: "r" });
    expect(caption()).toBe("beat frage 1.00");
    expect(onRestart).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Schritt 2 von 5: Kipp" }));
    key({ key: "R", shiftKey: true });
    expect(caption()).toBe("beat frage 1.00");
    fireEvent.click(screen.getByRole("button", { name: "Schritt 2 von 5: Kipp" }));
    fireEvent.click(screen.getByRole("button", { name: /Von vorn/ }));
    expect(caption()).toBe("beat frage 1.00");
    expect(onRestart).toHaveBeenCalledTimes(3);
  });

  it("passes Escape to the demo and binds no digits, Space or Home", () => {
    const onEscape = vi.fn();
    mount({ onEscape });
    key({ key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
    for (const name of ["1", "3", " ", "Home", "End", "p"]) key({ key: name });
    expect(caption()).toBe("beat frage 1.00");
  });

  it("reads ?beat= and ?room=1 once on load", () => {
    window.history.replaceState(null, "", "/demos/x?beat=werkzeug&room=1");
    const { container } = mount();
    expect(caption()).toBe("beat werkzeug 1.00 skipped");
    expect(container.querySelector("[data-demo-clock]")).toHaveAttribute("data-room", "");
  });

  it("runs a beat's motion once from 0 to 1, and rewinds visibly on restart", () => {
    setMotion(false);
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    mount();
    // the mock observer never reports the stage, so beat 1 waits on its start frame
    expect(caption()).toBe("beat frage 0.00");
    fireEvent.click(screen.getByRole("button", { name: "Schritt 2 von 5: Kipp" }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const half = Number(caption()?.split(" ")[2]);
    expect(half).toBeGreaterThan(0.3);
    expect(half).toBeLessThan(0.7);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(caption()).toBe("beat kipp 1.00 skipped");
    key({ key: "r" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(caption()).toMatch(/^beat (frage|kipp) /);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(caption()).toBe("beat frage 1.00");
  });
});

describe("take-home store", () => {
  it("shows the personal line only once the demo wrote one, and keeps it in memory", () => {
    render(<PersonalLine slug="probe" heading="Deine Zeile" note="Bleibt hier." copyLabel="Kopieren" copiedLabel="Kopiert" />);
    expect(screen.queryByText("Deine Zeile")).toBeNull();
    act(() => setTakeHomeLine("probe", "  Planzahl 748, frei.  "));
    expect(screen.getByText("Planzahl 748, frei.")).toBeInTheDocument();
    act(() => setTakeHomeLine("probe", ""));
    expect(screen.queryByText("Deine Zeile")).toBeNull();
  });
});
