import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { L07PrXray } from "./l07-pr-xray";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      removeItem: (k: string) => store.delete(k),
      setItem: (k: string, v: string) => store.set(k, String(v)),
    },
    writable: true,
    configurable: true,
  });
}

beforeAll(() => {
  if (
    typeof window.localStorage === "undefined" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("L07PrXray", () => {
  it("starts with 0 bugs caught", () => {
    render(<L07PrXray lessonId="L07" cpId="bespoke" />);
    expect(screen.getByText("Bugs caught: 0 / 3")).toBeInTheDocument();
  });

  it("clicking a clean line counts as a false alarm, not a bug", () => {
    render(<L07PrXray lessonId="L07" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("Line 1"));
    expect(screen.getByText("False alarms: 1")).toBeInTheDocument();
    expect(screen.getByText("Bugs caught: 0 / 3")).toBeInTheDocument();
  });

  it("clicking the same bug line twice only counts once", () => {
    render(<L07PrXray lessonId="L07" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText(/Line 4/));
    fireEvent.click(screen.getByLabelText(/Line 4/));
    expect(screen.getByText("Bugs caught: 1 / 3")).toBeInTheDocument();
  });

  it("awards the checkpoint once all three bugs are caught", () => {
    render(<L07PrXray lessonId="L07" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText(/Line 4/));
    fireEvent.click(screen.getByLabelText(/Line 11/));
    expect(isCheckpointDone("L07", "bespoke")).toBe(false);
    fireEvent.click(screen.getByLabelText(/Line 15/));
    expect(isCheckpointDone("L07", "bespoke")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
    expect(screen.getByText(/REVIEWER/)).toBeInTheDocument();
  });

  it("clears the false-alarm flash on a timer without leaking it past unmount", () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const { unmount } = render(<L07PrXray lessonId="L07" cpId="bespoke" />);
    fireEvent.click(screen.getByLabelText("Line 1"));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
