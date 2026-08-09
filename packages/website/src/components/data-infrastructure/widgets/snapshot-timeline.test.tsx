import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { SnapshotTimeline } from "./snapshot-timeline";

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

describe("SnapshotTimeline", () => {
  it("renders the canvas timeline, detail panel, and one-Tab-stop snapshot picker", () => {
    render(<SnapshotTimeline lessonId="di-lakehouse" cpId="snap" />);
    expect(
      screen.getByRole("img", { name: /Lakehouse snapshot timeline/ }),
    ).toBeInTheDocument();
    const listbox = screen.getByRole("listbox", { name: "Snapshot picker" });
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(7);
    expect(options.every((option) => option.tagName === "BUTTON")).toBe(true);
    expect(options.map((option) => option.tabIndex)).toEqual([
      0, -1, -1, -1, -1, -1, -1,
    ]);
    expect(listbox).toBeInTheDocument();
  });

  it("defaults to the first snapshot (CREATE)", () => {
    render(<SnapshotTimeline lessonId="di-lakehouse" cpId="snap" />);
    expect(screen.getByText("snapshot @ 10:00")).toBeInTheDocument();
    expect(screen.getByText(/initial load · 1\.2 TB/)).toBeInTheDocument();
  });

  it("falls back to a static summary, without crashing, when getContext('2d') returns null — the keyboard picker still works underneath", () => {
    const original = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue(null) as any;
    try {
      expect(() =>
        render(<SnapshotTimeline lessonId="di-lakehouse" cpId="snap" />),
      ).not.toThrow();
      expect(
        screen.getByRole("img", { name: /Currently viewing snapshot/ }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(7);
    } finally {
      HTMLCanvasElement.prototype.getContext = original;
    }
  });

  it("is fully completable via the keyboard-accessible picker alone, with zero mouse/canvas interaction", () => {
    render(<SnapshotTimeline lessonId="di-lakehouse" cpId="snap" />);
    expect(isCheckpointDone("di-lakehouse", "snap")).toBe(false);

    // No mouse event (click/mousemove) is ever dispatched on the canvas in
    // this test — only .focus() (Tab-navigation equivalent) and Enter/Space
    // activation on a real <button>, which real browsers translate into a
    // click via the standard HTML button activation-behavior spec.
    const rollbackOption = screen.getByRole("option", {
      name: "13:08 · ROLLBACK",
    });
    rollbackOption.focus();
    expect(document.activeElement).toBe(rollbackOption);
    fireEvent.keyDown(rollbackOption, { key: "Enter" });
    fireEvent.click(rollbackOption);

    expect(screen.getByText("snapshot @ 13:08")).toBeInTheDocument();
    expect(screen.getByText(/rolled back to snap @12:33/)).toBeInTheDocument();
    expect(isCheckpointDone("di-lakehouse", "snap")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("prev/next/rollback buttons also drive the same selection state", () => {
    render(<SnapshotTimeline lessonId="di-lakehouse" cpId="snap" />);
    fireEvent.click(screen.getByRole("button", { name: /next/ }));
    expect(screen.getByText("snapshot @ 10:42")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /prev/ }));
    expect(screen.getByText("snapshot @ 10:00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /rollback to 12:33/ }));
    expect(screen.getByText("snapshot @ 12:33")).toBeInTheDocument();
  });

  it("supports Arrow/Home/End listbox navigation and updates selection", () => {
    render(<SnapshotTimeline lessonId="di-lakehouse" cpId="snap" />);
    const options = screen.getAllByRole("option");

    options[0].focus();
    fireEvent.keyDown(options[0], { key: "End" });

    expect(options[6]).toHaveFocus();
    expect(options[6]).toHaveAttribute("aria-selected", "true");
    expect(options.map((option) => option.tabIndex)).toEqual([
      -1, -1, -1, -1, -1, -1, 0,
    ]);
    expect(screen.getByText("snapshot @ 13:08")).toBeInTheDocument();

    fireEvent.keyDown(options[6], { key: "Home" });
    expect(options[0]).toHaveFocus();
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });
});
